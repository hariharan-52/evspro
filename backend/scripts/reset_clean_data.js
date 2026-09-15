const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const initSqlJs = require('sql.js');

async function resetCleanData() {
  console.log('=====================================================');
  console.log('🧹 CLEANING ALL DATA EXCEPT OFFICIAL DEMO CREDENTIALS');
  console.log('=====================================================\n');

  const DB_FILE = path.join(__dirname, '..', 'ecodonate_local.sqlite');
  const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

  // 1. Clean uploaded files
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    let deletedCount = 0;
    files.forEach(f => {
      const filePath = path.join(UPLOADS_DIR, f);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    console.log(`✅ Uploads folder cleaned: ${deletedCount} uploaded test image(s) removed.`);
  }

  // 2. Initialize SQL.js and rebuild pristine database
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create clean Schema
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'ngo', 'scrapdealer', 'admin')),
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      profile_image TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending', 'rejected', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE ngos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      ngo_name TEXT NOT NULL,
      contact_person TEXT,
      registration_number TEXT,
      description TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE scrap_dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      business_name TEXT NOT NULL,
      contact_person TEXT,
      registration_number TEXT,
      accepted_materials TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      ngo_id INTEGER,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      condition_state TEXT,
      quantity INTEGER DEFAULT 1,
      image TEXT,
      address TEXT,
      city TEXT,
      pincode TEXT,
      pickup_date DATE,
      additional_notes TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'COMPLETED', 'REJECTED', 'CANCELLED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE recycling_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      scrap_dealer_id INTEGER,
      waste_category TEXT NOT NULL,
      description TEXT,
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      image TEXT,
      ai_prediction TEXT,
      ai_confidence REAL,
      address TEXT,
      city TEXT,
      pincode TEXT,
      pickup_date DATE,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'PICKUP_SCHEDULED', 'COLLECTED', 'COMPLETED', 'REJECTED', 'CANCELLED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE request_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_type TEXT NOT NULL CHECK(request_type IN ('donation', 'recycling')),
      request_db_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      updated_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE impact_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      request_type TEXT NOT NULL CHECK(request_type IN ('donation', 'recycling')),
      request_db_id INTEGER,
      waste_weight_kg REAL DEFAULT 0,
      items_count INTEGER DEFAULT 0,
      impact_score REAL DEFAULT 0,
      co2_saved_kg REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notifications (
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

  // Insert ONLY Official Demo Credentials
  const defaultHash = bcrypt.hashSync('Password@123', 10);
  const adminHash = bcrypt.hashSync('Admin@123', 10);

  db.run(`
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

  // Write pristine SQLite file
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));

  console.log('✅ Database reset complete:');
  console.log('   • 0 Donations');
  console.log('   • 0 Recycling Requests');
  console.log('   • 0 Status Logs / Impact Records / Notifications');
  console.log('   • 8 Official Demo Accounts Preserved:\n');
  console.log('     1. Admin: admin@ecodonate.com (Admin@123)');
  console.log('     2. User (Donor): rahul@example.com (Password@123)');
  console.log('     3. User (Donor): priya@example.com (Password@123)');
  console.log('     4. User (Donor): amit@example.com (Password@123)');
  console.log('     5. NGO (Approved): contact@greenearth.org (Password@123)');
  console.log('     6. NGO (Pending): hello@hopefoundation.org (Password@123)');
  console.log('     7. Scrap Dealer (Approved): info@ecoscrap.com (Password@123)');
  console.log('     8. Scrap Dealer (Pending): contact@cityrecyclers.com (Password@123)');
  console.log('\n=====================================================');
}

resetCleanData().catch(console.error);
