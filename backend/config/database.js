const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const os = require('os');

let activeEngine = 'mysql';
let mysqlPool = null;
let sqliteDb = null;
let isInitialized = false;

const isVercel = Boolean(process.env.VERCEL);
const DB_FILE = isVercel
  ? path.join(os.tmpdir(), 'ecodonate_local.sqlite')
  : path.join(__dirname, '../ecodonate_local.sqlite');
const LOCAL_SEEDED_FILE = path.join(__dirname, '../ecodonate_local.sqlite');

mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ecodonate',
  connectTimeout: 1500,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initSQLite() {
  const wasmCandidates = [
    path.join(__dirname, 'sql-wasm.wasm'),
    path.join(__dirname, '../sql-wasm.wasm'),
    path.join(__dirname, '../../sql-wasm.wasm'),
    path.join(process.cwd(), 'backend/config/sql-wasm.wasm'),
    path.join(process.cwd(), 'backend/sql-wasm.wasm'),
    path.join(process.cwd(), 'sql-wasm.wasm'),
    path.join('/var/task/backend/config/sql-wasm.wasm'),
    path.join('/var/task/backend/sql-wasm.wasm'),
    path.join('/var/task/sql-wasm.wasm')
  ];

  let wasmPath = null;
  for (const candidate of wasmCandidates) {
    if (fs.existsSync(candidate)) {
      wasmPath = candidate;
      break;
    }
  }

  let SQL;
  if (wasmPath) {
    SQL = await initSqlJs({
      locateFile: () => wasmPath
    });
  } else {
    SQL = await initSqlJs();
  }
  let buffer;
  if (fs.existsSync(DB_FILE)) {
    try {
      buffer = fs.readFileSync(DB_FILE);
      sqliteDb = new SQL.Database(buffer);
    } catch (e) {
      sqliteDb = new SQL.Database();
    }
  } else if (isVercel && fs.existsSync(LOCAL_SEEDED_FILE)) {
    try {
      buffer = fs.readFileSync(LOCAL_SEEDED_FILE);
      sqliteDb = new SQL.Database(buffer);
      // Write to /tmp so subsequent queries can save mutations
      try {
        fs.writeFileSync(DB_FILE, buffer);
      } catch (writeErr) {
        // Ignore write error if /tmp is temporarily locked
      }
    } catch (e) {
      sqliteDb = new SQL.Database();
    }
  } else {
    sqliteDb = new SQL.Database();
  }

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      profile_image TEXT,
      status TEXT DEFAULT 'pending',
      is_email_verified INTEGER DEFAULT 0,
      otp_code TEXT,
      otp_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ngos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ngo_name TEXT NOT NULL,
      contact_person TEXT,
      registration_number TEXT,
      description TEXT,
      verification_status TEXT DEFAULT 'pending',
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scrap_dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_name TEXT NOT NULL,
      contact_person TEXT,
      registration_number TEXT,
      accepted_materials TEXT,
      verification_status TEXT DEFAULT 'pending',
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      ngo_id INTEGER,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      condition_state TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      image TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      pickup_date TEXT,
      additional_notes TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recycling_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      scrap_dealer_id INTEGER,
      waste_category TEXT NOT NULL,
      ai_prediction TEXT,
      ai_confidence REAL,
      description TEXT,
      quantity REAL,
      quantity_unit TEXT,
      image TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      pickup_date TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS request_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_type TEXT NOT NULL,
      request_db_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      updated_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS impact_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      request_type TEXT NOT NULL,
      request_db_id INTEGER NOT NULL,
      waste_weight_kg REAL DEFAULT 0,
      items_count INTEGER DEFAULT 0,
      impact_score REAL DEFAULT 0,
      co2_saved_kg REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT,
      is_read INTEGER DEFAULT 0,
      related_id INTEGER,
      related_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // Check and migrate schema if needed
    try {
      const tableInfo = sqliteDb.exec("PRAGMA table_info(donations);");
      const cols = tableInfo[0]?.values.map(c => c[1]) || [];
      if (!cols.includes('additional_notes')) {
        sqliteDb.run("ALTER TABLE donations ADD COLUMN additional_notes TEXT;");
      }
    } catch (migErr) {
      console.warn('Migration note:', migErr.message);
    }

    try {
      const recInfo = sqliteDb.exec("PRAGMA table_info(recycling_requests);");
      const recCols = recInfo[0]?.values.map(c => c[1]) || [];
      if (!recCols.includes('ai_prediction')) {
        sqliteDb.run("ALTER TABLE recycling_requests ADD COLUMN ai_prediction TEXT;");
      }
      if (!recCols.includes('ai_confidence')) {
        sqliteDb.run("ALTER TABLE recycling_requests ADD COLUMN ai_confidence REAL;");
      }
    } catch (recMigErr) {
      console.warn('Recycling migration note:', recMigErr.message);
    }

    try {
      const userInfo = sqliteDb.exec("PRAGMA table_info(users);");
      const userCols = userInfo[0]?.values.map(c => c[1]) || [];
      if (!userCols.includes('is_email_verified')) {
        sqliteDb.run("ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;");
      }
      if (!userCols.includes('otp_code')) {
        sqliteDb.run("ALTER TABLE users ADD COLUMN otp_code TEXT;");
      }
      if (!userCols.includes('otp_expires_at')) {
        sqliteDb.run("ALTER TABLE users ADD COLUMN otp_expires_at DATETIME;");
      }
    } catch (userMigErr) {
      console.warn('User migration note:', userMigErr.message);
    }

    const res = sqliteDb.exec("SELECT COUNT(*) as c FROM users");
    const count = res[0]?.values[0][0] || 0;
    if (count === 0) {
      const defaultHash = bcrypt.hashSync('Password@123', 10);
      const adminHash = bcrypt.hashSync('Admin@123', 10);
      const hariHash = bcrypt.hashSync('hari123', 10);

      sqliteDb.run(`
        INSERT INTO users (id, name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES
        (1, 'Admin User', 'admin@ecodonate.com', '9876543210', '${adminHash}', 'admin', 'Admin HQ', 'Delhi', 'Delhi', '110001', 'active'),
        (2, 'Rahul Sharma', 'rahul@example.com', '9876543211', '${defaultHash}', 'user', '12 MG Road', 'Mumbai', 'Maharashtra', '400001', 'active'),
        (3, 'Hari User', 'harihari@gmail.com', '9876543220', '${hariHash}', 'user', '24 Green Avenue', 'Chennai', 'Tamil Nadu', '600001', 'active'),
        (4, 'Green Earth NGO', 'contact@greenearth.org', '9876543214', '${defaultHash}', 'ngo', '78 NGO Colony', 'Mumbai', 'Maharashtra', '400050', 'active'),
        (5, 'Hari NGO', 'hariharingo@gmail.com', '9876543221', '${hariHash}', 'ngo', '45 Care Foundation Road', 'Chennai', 'Tamil Nadu', '600004', 'active'),
        (6, 'Eco Scrap Traders', 'info@ecoscrap.com', '9876543216', '${defaultHash}', 'scrapdealer', '12 Industrial Area', 'Mumbai', 'Maharashtra', '400093', 'active'),
        (7, 'Hari Scrap Dealers', 'harihariscrap@gmail.com', '9876543222', '${hariHash}', 'scrapdealer', '88 Recycle Park', 'Chennai', 'Tamil Nadu', '600032', 'active'),
        (8, 'Hope Foundation (Unapproved NGO)', 'pendingngo@example.com', '9876543215', '${defaultHash}', 'ngo', '90 Charity Street', 'Delhi', 'Delhi', '110020', 'pending'),
        (9, 'City Recyclers (Unapproved Scrap Dealer)', 'pendingscrap@example.com', '9876543217', '${defaultHash}', 'scrapdealer', '34 Scrap Yard', 'Bangalore', 'Karnataka', '560022', 'pending');

        INSERT INTO ngos (id, user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES
        (1, 4, 'Green Earth NGO', 'Suresh Patel', 'REG123456', 'Dedicated to environmental conservation and helping the needy.', 'approved'),
        (2, 5, 'Hari NGO Foundation', 'Hariharan', 'REG789101', 'Empowering communities through sustainable donations and aid.', 'approved'),
        (3, 8, 'Hope Foundation', 'Meera Reddy', 'REG654321', 'Providing education and resources to underprivileged children.', 'pending');

        INSERT INTO scrap_dealers (id, user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES
        (1, 6, 'Eco Scrap Traders', 'Ramesh Gupta', 'SCRAP987', '["Plastic","Paper","Metal","E-Waste"]', 'approved'),
        (2, 7, 'Hari Scrap Dealers', 'Hariharan Scrap', 'SCRAP555', '["Plastic","Paper","Metal","E-Waste","Glass"]', 'approved'),
        (3, 9, 'City Recyclers', 'Vinod Desai', 'SCRAP123', '["Paper","Cardboard","Glass"]', 'pending');

        INSERT INTO donations (id, request_id, user_id, ngo_id, item_name, category, description, condition_state, quantity, address, city, pincode, pickup_date, additional_notes, status) VALUES
        (1, 'DON-1001', 2, NULL, 'Winter Blankets & Sweaters', 'Clothes', '10 clean winter blankets and warm sweaters for the shelter.', 'Good', 10, '12 MG Road', 'Mumbai', '400001', '2026-09-25', 'Packed in 2 cartons. Call before arriving.', 'PENDING'),
        (2, 'DON-1002', 3, 2, 'CBSE Grade 10 & 12 Books', 'Books', 'Complete sets of textbooks and study materials for high school students.', 'Like New', 15, '24 Green Avenue', 'Chennai', '600001', '2026-09-22', 'Neatly packed and labelled.', 'ACCEPTED'),
        (3, 'DON-1003', 2, 1, 'Stainless Steel Utensils', 'Household', 'Kitchenware and food containers for community food distribution.', 'Good', 8, '12 MG Road', 'Mumbai', '400001', '2026-09-15', 'Sanitized before handover.', 'COMPLETED');

        INSERT INTO recycling_requests (id, request_id, user_id, scrap_dealer_id, waste_category, ai_prediction, ai_confidence, description, quantity, quantity_unit, address, city, pincode, pickup_date, status) VALUES
        (1, 'REC-2001', 2, NULL, 'Plastic', 'PET Bottles & Containers', 0.94, 'Clean sorted plastic bottles and containers ready for recycling.', 12.5, 'kg', '12 MG Road', 'Mumbai', '400001', '2026-09-26', 'PENDING'),
        (2, 'REC-2002', 3, 2, 'Metal', 'Aluminium & Copper Scrap', 0.91, 'Discarded aluminium frames and copper scrap wire from home renovation.', 18.0, 'kg', '24 Green Avenue', 'Chennai', '600001', '2026-09-23', 'ACCEPTED'),
        (3, 'REC-2003', 2, 1, 'E-Waste', 'Computer Motherboard & Circuit Boards', 0.96, 'Old broken circuit boards, wires, and power supplies for metal recovery.', 7.2, 'kg', '12 MG Road', 'Mumbai', '400001', '2026-09-14', 'COMPLETED');

        INSERT INTO impact_records (user_id, request_type, request_db_id, waste_weight_kg, items_count, impact_score, co2_saved_kg) VALUES
        (2, 'donation', 3, 5.0, 8, 40, 12.5),
        (2, 'recycling', 3, 7.2, 1, 55, 21.6);

        INSERT INTO notifications (user_id, title, message, type) VALUES
        (2, 'Donation Received', 'Your donation of Stainless Steel Utensils (DON-1003) was successfully completed. Thank you for your support!', 'donation'),
        (2, 'Recycling Collected', 'Your recycling request for E-Waste (REC-2003) has been completed and verified.', 'recycling'),
        (3, 'Donation Accepted', 'Hari NGO Foundation has accepted your donation of CBSE Grade 10 & 12 Books (DON-1002).', 'donation'),
        (3, 'Recycling Accepted', 'Hari Scrap Dealers accepted your recycling request for Metal scrap (REC-2002).', 'recycling');
      `);
    }

    saveSQLite();
}

function saveSQLite() {
  if (sqliteDb) {
    try {
      const data = sqliteDb.export();
      fs.writeFileSync(DB_FILE, Buffer.from(data));
    } catch (e) {
      console.error('Error saving SQLite DB:', e.message);
    }
  }
}

function querySQLite(sql, params = []) {
  let normalizedSql = sql.trim();

  normalizedSql = normalizedSql.replace(/DATE_FORMAT\(([^,]+),\s*'%Y-%m'\)/gi, "strftime('%Y-%m', $1)");
  normalizedSql = normalizedSql.replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s*12\s*MONTH\)/gi, "datetime('now', '-12 months')");
  normalizedSql = normalizedSql.replace(/NOW\(\)/gi, "datetime('now')");

  const isSelect = /^\s*(SELECT|PRAGMA|SHOW)/i.test(normalizedSql);

  if (isSelect) {
    const stmt = sqliteDb.prepare(normalizedSql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows, []];
  } else {
    sqliteDb.run(normalizedSql, params);
    
    const lastIdRes = sqliteDb.exec("SELECT last_insert_rowid() as id, changes() as affected");
    const insertId = lastIdRes[0]?.values[0][0] || 0;
    const affectedRows = lastIdRes[0]?.values[0][1] || 0;

    saveSQLite();
    return [{ insertId, affectedRows }, []];
  }
}

const testConnection = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    console.log('✅ MySQL Database connected successfully.');
    activeEngine = 'mysql';
    connection.release();
  } catch (error) {
    console.log('⚠️ MySQL connection unavailable (' + error.message + ').');
    console.log('⚡ Switching to embedded local database mode for instant plug-and-play operation.');
    activeEngine = 'sqlite';
    await initSQLite();
    console.log('✅ Embedded database initialized with complete EcoDonate seed data.');
  }
  isInitialized = true;
  try {
    const UserRegistry = require('../data/userRegistry');
    await UserRegistry.syncToDatabase(pool);
  } catch (syncErr) {
    console.warn('UserRegistry sync note:', syncErr.message);
  }
};

const pool = {
  query: async (sql, params = []) => {
    if (!isInitialized) {
      await testConnection();
    }
    if (activeEngine === 'mysql') {
      try {
        return await mysqlPool.query(sql, params);
      } catch (err) {
        console.warn('MySQL query failed, falling back to embedded database:', err.message);
        if (!sqliteDb) await initSQLite();
        activeEngine = 'sqlite';
        return querySQLite(sql, params);
      }
    } else {
      return querySQLite(sql, params);
    }
  },
  getConnection: async () => {
    if (activeEngine === 'mysql') {
      return await mysqlPool.getConnection();
    }
    return {
      release: () => {},
      query: (sql, params) => pool.query(sql, params)
    };
  }
};

module.exports = {
  pool,
  testConnection
};

