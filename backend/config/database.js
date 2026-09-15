const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

let activeEngine = 'mysql';
let mysqlPool = null;
let sqliteDb = null;
let isInitialized = false;

const isVercel = Boolean(process.env.VERCEL);
const DB_FILE = isVercel
  ? path.join('/tmp', 'ecodonate_local.sqlite')
  : path.join(__dirname, '../ecodonate_local.sqlite');
const LOCAL_SEEDED_FILE = path.join(__dirname, '../ecodonate_local.sqlite');

mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ecodonate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initSQLite() {
  const SQL = await initSqlJs();
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
      status TEXT DEFAULT 'active',
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

    const res = sqliteDb.exec("SELECT COUNT(*) as c FROM users");
    const count = res[0]?.values[0][0] || 0;
    if (count === 0) {
      const defaultHash = bcrypt.hashSync('Password@123', 10);
      const adminHash = bcrypt.hashSync('Admin@123', 10);

      sqliteDb.run(`
        INSERT INTO users (id, name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES
        (1, 'Admin User', 'admin@ecodonate.com', '9876543210', '${adminHash}', 'admin', 'Admin HQ', 'Delhi', 'Delhi', '110001', 'active'),
        (2, 'Rahul Sharma', 'rahul@example.com', '9876543211', '${defaultHash}', 'user', '12 MG Road', 'Mumbai', 'Maharashtra', '400001', 'active'),
        (3, 'Priya Singh', 'priya@example.com', '9876543212', '${defaultHash}', 'user', '34 Brigade Road', 'Bangalore', 'Karnataka', '560001', 'active'),
        (4, 'Amit Kumar', 'amit@example.com', '9876543213', '${defaultHash}', 'user', '56 Anna Salai', 'Chennai', 'Tamil Nadu', '600002', 'active'),
        (5, 'Green Earth NGO', 'contact@greenearth.org', '9876543214', '${defaultHash}', 'ngo', '78 NGO Colony', 'Mumbai', 'Maharashtra', '400050', 'active'),
        (6, 'Hope Foundation', 'hello@hopefoundation.org', '9876543215', '${defaultHash}', 'ngo', '90 Charity Street', 'Delhi', 'Delhi', '110020', 'pending'),
        (7, 'Eco Scrap Traders', 'info@ecoscrap.com', '9876543216', '${defaultHash}', 'scrapdealer', '12 Industrial Area', 'Mumbai', 'Maharashtra', '400093', 'active'),
        (8, 'City Recyclers', 'contact@cityrecyclers.com', '9876543217', '${defaultHash}', 'scrapdealer', '34 Scrap Yard', 'Bangalore', 'Karnataka', '560022', 'pending');

        INSERT INTO ngos (id, user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES
        (1, 5, 'Green Earth NGO', 'Suresh Patel', 'REG123456', 'Dedicated to environmental conservation and helping the needy.', 'approved'),
        (2, 6, 'Hope Foundation', 'Meera Reddy', 'REG654321', 'Providing education and resources to underprivileged children.', 'pending');

        INSERT INTO scrap_dealers (id, user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES
        (1, 7, 'Eco Scrap Traders', 'Ramesh Gupta', 'SCRAP987', '["Plastic","Paper","Metal","E-Waste"]', 'approved'),
        (2, 8, 'City Recyclers', 'Vinod Desai', 'SCRAP123', '["Paper","Cardboard","Glass"]', 'pending');
      `);
    }

    const donRes = sqliteDb.exec("SELECT COUNT(*) as c FROM donations");
    const donCount = donRes[0]?.values[0][0] || 0;
    if (donCount === 0) {
      sqliteDb.run(`
        INSERT INTO donations (id, request_id, user_id, ngo_id, item_name, category, description, condition_state, quantity, image, address, city, pincode, pickup_date, additional_notes, status, created_at)
        VALUES
        (1, 'DON-A1B2C3', 2, NULL, 'Solid Wood Study Desk & Ergonomic Chair', 'Furniture', 'Solid teak wood study desk with 3 drawers and an adjustable swivel chair. Very well maintained with minimal scratch marks.', 'Good', 1, 'mock-furniture.jpg', 'Flat 402, Sea Breeze Apt, Bandra West', 'Mumbai', '400050', '2026-09-20', 'Please call 15 minutes before arrival. Building has elevator access via rear entrance.', 'PENDING', datetime('now', '-2 days')),
        (2, 'DON-D4E5F6', 3, 1, 'NCERT & Higher Secondary Reference Textbooks', 'Books', 'Complete set of Class 11 and 12 Physics, Chemistry, Mathematics textbooks along with competitive exam guidebooks.', 'Like New', 14, 'mock-books.jpg', '34 Brigade Road, Ashok Nagar', 'Bangalore', '560001', '2026-09-18', 'All books are neatly packed in two labelled waterproof cartons. Available for pickup after 5 PM on weekdays.', 'ACCEPTED', datetime('now', '-3 days')),
        (3, 'DON-G7H8I9', 4, 1, 'Winter Blankets & Thermal Woolen Jackets', 'Clothes', 'Assorted adult winter jackets, fleece sweaters, and heavy woolen blankets. Cleaned, sanitized, and folded.', 'Good', 8, 'mock-clothes.jpg', '56 Anna Salai, Thousand Lights', 'Chennai', '600002', '2026-09-16', 'Security at gate will direct you to block C. Please ask for Amit Kumar.', 'RECEIVED', datetime('now', '-5 days')),
        (4, 'DON-J1K2L3', 2, 1, 'LED Study Lamps & Extension Power Boards', 'Electronics', 'Two Philips 10W adjustable LED desk study lamps and two 4-socket surge protected spike strips. 100% operational.', 'Good', 2, 'mock-electronics.jpg', '12 MG Road, Fort', 'Mumbai', '400001', '2026-09-14', 'Tested working with original power adapters included in boxes.', 'COMPLETED', datetime('now', '-7 days'));

        INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes, created_at) VALUES
        ('donation', 1, 'PENDING', 2, 'Donation request submitted by donor', datetime('now', '-2 days')),
        ('donation', 2, 'PENDING', 3, 'Donation request submitted by donor', datetime('now', '-3 days')),
        ('donation', 2, 'ACCEPTED', 5, 'Accepted by Green Earth NGO for pickup', datetime('now', '-2 days')),
        ('donation', 3, 'PENDING', 4, 'Donation request submitted by donor', datetime('now', '-5 days')),
        ('donation', 3, 'ACCEPTED', 5, 'Accepted by Green Earth NGO', datetime('now', '-4 days')),
        ('donation', 3, 'RECEIVED', 5, 'Items safely received at NGO storage depot', datetime('now', '-3 days')),
        ('donation', 4, 'PENDING', 2, 'Donation request submitted by donor', datetime('now', '-7 days')),
        ('donation', 4, 'ACCEPTED', 5, 'Accepted by Green Earth NGO', datetime('now', '-6 days')),
        ('donation', 4, 'RECEIVED', 5, 'Items inspected and verified', datetime('now', '-5 days')),
        ('donation', 4, 'COMPLETED', 5, 'Items distributed to students at community learning center', datetime('now', '-4 days'));

        INSERT INTO impact_records (user_id, request_type, request_db_id, items_count, impact_score, co2_saved_kg, created_at) VALUES
        (4, 'donation', 3, 8, 40.0, 20.0, datetime('now', '-3 days')),
        (2, 'donation', 4, 2, 10.0, 5.0, datetime('now', '-4 days'));

        INSERT INTO recycling_requests (id, request_id, user_id, scrap_dealer_id, waste_category, description, quantity, quantity_unit, image, ai_prediction, ai_confidence, address, city, pincode, pickup_date, status, created_at)
        VALUES
        (1, 'REC-M3N4P5', 2, 1, 'Plastic', 'Crushed HDPE milk jugs and PET mineral water bottles bundled together.', 18.5, 'kg', 'mock-plastic.jpg', 'PET & HDPE Plastic Bottles', 94.5, '12 MG Road', 'Mumbai', '400001', '2026-09-19', 'ACCEPTED', datetime('now', '-1 days')),
        (2, 'REC-Q6R7S8', 3, NULL, 'E-Waste', 'Old computer motherboards, RAM sticks, and power supply units.', 7.0, 'kg', 'mock-ewaste.jpg', 'Printed Circuit Boards (E-Waste)', 91.0, '34 Brigade Road', 'Bangalore', '560001', '2026-09-22', 'PENDING', datetime('now', '-2 days')),
        (3, 'REC-P1Q2R3', 4, 1, 'Metal', 'Scrap aluminum window frames, beverage cans, and iron pipes from home renovation.', 42.0, 'kg', 'mock-metal.jpg', 'Aluminum & Iron Scrap', 96.0, '56 Anna Salai', 'Mumbai', '400093', '2026-09-15', 'COLLECTED', datetime('now', '-4 days')),
        (4, 'REC-S4T5U6', 2, 1, 'Cardboard', 'Flattened corrugated cardboard packing cartons and shipping boxes.', 65.0, 'kg', 'mock-cardboard.jpg', 'Corrugated Cardboard', 98.0, '12 MG Road', 'Mumbai', '400001', '2026-09-12', 'COMPLETED', datetime('now', '-6 days')),
        (5, 'REC-V7W8X9', 3, 1, 'E-Waste', 'Old CRT monitors, broken computer towers, copper coils, and cables.', 14.5, 'kg', 'mock-ewaste.jpg', 'Electronic Waste (E-Waste)', 92.5, '78 NGO Colony', 'Mumbai', '400050', '2026-09-10', 'COMPLETED', datetime('now', '-8 days'));

        INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes, created_at) VALUES
        ('recycling', 1, 'PENDING', 2, 'Recycling request submitted by user', datetime('now', '-1 days')),
        ('recycling', 1, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders for collection', datetime('now', '-1 days')),
        ('recycling', 2, 'PENDING', 3, 'Recycling request submitted by user', datetime('now', '-2 days')),
        ('recycling', 3, 'PENDING', 4, 'Recycling request submitted by user', datetime('now', '-4 days')),
        ('recycling', 3, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders', datetime('now', '-3 days')),
        ('recycling', 3, 'COLLECTED', 7, 'Scrap metal collected and weighed on digital scale', datetime('now', '-2 days')),
        ('recycling', 4, 'PENDING', 2, 'Recycling request submitted by user', datetime('now', '-6 days')),
        ('recycling', 4, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders', datetime('now', '-5 days')),
        ('recycling', 4, 'COLLECTED', 7, 'Cardboard collected from premises', datetime('now', '-4 days')),
        ('recycling', 4, 'COMPLETED', 7, 'Cardboard baled and shipped to paper recycling plant', datetime('now', '-3 days')),
        ('recycling', 5, 'PENDING', 3, 'Recycling request submitted by user', datetime('now', '-8 days')),
        ('recycling', 5, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders', datetime('now', '-7 days')),
        ('recycling', 5, 'COLLECTED', 7, 'E-waste collected and logged', datetime('now', '-6 days')),
        ('recycling', 5, 'COMPLETED', 7, 'Safely processed at certified e-waste recovery unit', datetime('now', '-5 days'));

        INSERT INTO impact_records (user_id, request_type, request_db_id, waste_weight_kg, impact_score, co2_saved_kg, created_at) VALUES
        (4, 'recycling', 3, 42.0, 84.0, 63.0, datetime('now', '-2 days')),
        (2, 'recycling', 4, 65.0, 130.0, 97.5, datetime('now', '-3 days')),
        (3, 'recycling', 5, 14.5, 29.0, 21.75, datetime('now', '-5 days'));
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

