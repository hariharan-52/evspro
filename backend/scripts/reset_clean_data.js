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
  const hariHash = bcrypt.hashSync('hari123', 10);

  db.run(`
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

  // Write pristine SQLite file
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));

  console.log('✅ Database reset complete:');
  console.log('   • 3 Donations (1 PENDING, 1 ACCEPTED, 1 COMPLETED)');
  console.log('   • 3 Recycling Requests (1 PENDING, 1 ACCEPTED, 1 COMPLETED)');
  console.log('   • Impact Records & Notifications Seeded');
  console.log('   • 9 Official Accounts Preserved:\n');
  console.log('     1. Admin: admin@ecodonate.com (Admin@123)');
  console.log('     2. User (Donor): rahul@example.com (Password@123)');
  console.log('     3. User (Donor): harihari@gmail.com (hari123)');
  console.log('     4. NGO (Approved): contact@greenearth.org (Password@123)');
  console.log('     5. NGO (Approved): hariharingo@gmail.com (hari123)');
  console.log('     6. Scrap Dealer (Approved): info@ecoscrap.com (Password@123)');
  console.log('     7. Scrap Dealer (Approved): harihariscrap@gmail.com (hari123)');
  console.log('     8. NGO (Unapproved/Pending): pendingngo@example.com (Password@123)');
  console.log('     9. Scrap Dealer (Unapproved/Pending): pendingscrap@example.com (Password@123)');
  console.log('\n=====================================================');
}

resetCleanData().catch(console.error);
