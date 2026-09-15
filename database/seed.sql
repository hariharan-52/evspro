-- EcoDonate Clean Seed Data
-- Admin Password: Admin@123
-- Seed User Passwords: Password@123

USE ecodonate;

-- Clean existing data
DELETE FROM impact_records;
DELETE FROM request_status_history;
DELETE FROM notifications;
DELETE FROM donations;
DELETE FROM recycling_requests;
DELETE FROM ngos;
DELETE FROM scrap_dealers;
DELETE FROM users;

-- Reset Auto-Increments
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE ngos AUTO_INCREMENT = 1;
ALTER TABLE scrap_dealers AUTO_INCREMENT = 1;
ALTER TABLE donations AUTO_INCREMENT = 1;
ALTER TABLE recycling_requests AUTO_INCREMENT = 1;
ALTER TABLE impact_records AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE request_status_history AUTO_INCREMENT = 1;

-- 8 Official Demo Accounts
INSERT INTO users (id, name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES
(1, 'Admin User', 'admin@ecodonate.com', '9876543210', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'admin', 'Admin HQ', 'Delhi', 'Delhi', '110001', 'active'),
(2, 'Rahul Sharma', 'rahul@example.com', '9876543211', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'user', '12 MG Road', 'Mumbai', 'Maharashtra', '400001', 'active'),
(3, 'Priya Singh', 'priya@example.com', '9876543212', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'user', '34 Brigade Road', 'Bangalore', 'Karnataka', '560001', 'active'),
(4, 'Amit Kumar', 'amit@example.com', '9876543213', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'user', '56 Anna Salai', 'Chennai', 'Tamil Nadu', '600002', 'active'),
(5, 'Green Earth NGO', 'contact@greenearth.org', '9876543214', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'ngo', '78 NGO Colony', 'Mumbai', 'Maharashtra', '400050', 'active'),
(6, 'Hope Foundation', 'hello@hopefoundation.org', '9876543215', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'ngo', '90 Charity Street', 'Delhi', 'Delhi', '110020', 'pending'),
(7, 'Eco Scrap Traders', 'info@ecoscrap.com', '9876543216', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'scrapdealer', '12 Industrial Area', 'Mumbai', 'Maharashtra', '400093', 'active'),
(8, 'City Recyclers', 'contact@cityrecyclers.com', '9876543217', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p/nukchbFqwhFHqpU1WX9i', 'scrapdealer', '34 Scrap Yard', 'Bangalore', 'Karnataka', '560022', 'pending');

INSERT INTO ngos (id, user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES
(1, 5, 'Green Earth NGO', 'Suresh Patel', 'REG123456', 'Dedicated to environmental conservation and helping the needy.', 'approved'),
(2, 6, 'Hope Foundation', 'Meera Reddy', 'REG654321', 'Providing education and resources to underprivileged children.', 'pending');

INSERT INTO scrap_dealers (id, user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES
(1, 7, 'Eco Scrap Traders', 'Ramesh Gupta', 'SCRAP987', '["Plastic","Paper","Metal","E-Waste"]', 'approved'),
(2, 8, 'City Recyclers', 'Vinod Desai', 'SCRAP123', '["Paper","Cardboard","Glass"]', 'pending');

-- Sample Donations with Additional Notes for NGO
INSERT INTO donations (id, request_id, user_id, ngo_id, item_name, category, description, condition_state, quantity, image, address, city, pincode, pickup_date, additional_notes, status, created_at)
VALUES
(1, 'DON-A1B2C3', 2, NULL, 'Solid Wood Study Desk & Ergonomic Chair', 'Furniture', 'Solid teak wood study desk with 3 drawers and an adjustable swivel chair. Very well maintained with minimal scratch marks.', 'Good', 1, 'mock-furniture.jpg', 'Flat 402, Sea Breeze Apt, Bandra West', 'Mumbai', '400050', '2026-09-20', 'Please call 15 minutes before arrival. Building has elevator access via rear entrance.', 'PENDING', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'DON-D4E5F6', 3, 1, 'NCERT & Higher Secondary Reference Textbooks', 'Books', 'Complete set of Class 11 and 12 Physics, Chemistry, Mathematics textbooks along with competitive exam guidebooks.', 'Like New', 14, 'mock-books.jpg', '34 Brigade Road, Ashok Nagar', 'Bangalore', '560001', '2026-09-18', 'All books are neatly packed in two labelled waterproof cartons. Available for pickup after 5 PM on weekdays.', 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 'DON-G7H8I9', 4, 1, 'Winter Blankets & Thermal Woolen Jackets', 'Clothes', 'Assorted adult winter jackets, fleece sweaters, and heavy woolen blankets. Cleaned, sanitized, and folded.', 'Good', 8, 'mock-clothes.jpg', '56 Anna Salai, Thousand Lights', 'Chennai', '600002', '2026-09-16', 'Security at gate will direct you to block C. Please ask for Amit Kumar.', 'RECEIVED', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 'DON-J1K2L3', 2, 1, 'LED Study Lamps & Extension Power Boards', 'Electronics', 'Two Philips 10W adjustable LED desk study lamps and two 4-socket surge protected spike strips. 100% operational.', 'Good', 2, 'mock-electronics.jpg', '12 MG Road, Fort', 'Mumbai', '400001', '2026-09-14', 'Tested working with original power adapters included in boxes.', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 7 DAY));

-- Request Status History
INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes, created_at) VALUES
('donation', 1, 'PENDING', 2, 'Donation request submitted by donor', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('donation', 2, 'PENDING', 3, 'Donation request submitted by donor', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('donation', 2, 'ACCEPTED', 5, 'Accepted by Green Earth NGO for pickup', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('donation', 3, 'PENDING', 4, 'Donation request submitted by donor', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('donation', 3, 'ACCEPTED', 5, 'Accepted by Green Earth NGO', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('donation', 3, 'RECEIVED', 5, 'Items safely received at NGO storage depot', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('donation', 4, 'PENDING', 2, 'Donation request submitted by donor', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('donation', 4, 'ACCEPTED', 5, 'Accepted by Green Earth NGO', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('donation', 4, 'RECEIVED', 5, 'Items inspected and verified', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('donation', 4, 'COMPLETED', 5, 'Items distributed to students at community learning center', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Impact Records
INSERT INTO impact_records (user_id, request_type, request_db_id, items_count, impact_score, co2_saved_kg, created_at) VALUES
(4, 'donation', 3, 8, 40.0, 20.0, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'donation', 4, 2, 10.0, 5.0, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Sample Recycling Requests
INSERT INTO recycling_requests (id, request_id, user_id, scrap_dealer_id, waste_category, description, quantity, quantity_unit, image, ai_prediction, ai_confidence, address, city, pincode, pickup_date, status, created_at)
VALUES
(1, 'REC-M3N4P5', 2, 1, 'Plastic', 'Crushed HDPE milk jugs and PET mineral water bottles bundled together.', 18.5, 'kg', 'mock-plastic.jpg', 'PET & HDPE Plastic Bottles', 94.5, '12 MG Road', 'Mumbai', '400001', '2026-09-19', 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'REC-Q6R7S8', 3, NULL, 'E-Waste', 'Old computer motherboards, RAM sticks, and power supply units.', 7.0, 'kg', 'mock-ewaste.jpg', 'Printed Circuit Boards (E-Waste)', 91.0, '34 Brigade Road', 'Bangalore', '560001', '2026-09-22', 'PENDING', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'REC-P1Q2R3', 4, 1, 'Metal', 'Scrap aluminum window frames, beverage cans, and iron pipes from home renovation.', 42.0, 'kg', 'mock-metal.jpg', 'Aluminum & Iron Scrap', 96.0, '56 Anna Salai', 'Mumbai', '400093', '2026-09-15', 'COLLECTED', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4, 'REC-S4T5U6', 2, 1, 'Cardboard', 'Flattened corrugated cardboard packing cartons and shipping boxes.', 65.0, 'kg', 'mock-cardboard.jpg', 'Corrugated Cardboard', 98.0, '12 MG Road', 'Mumbai', '400001', '2026-09-12', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 'REC-V7W8X9', 3, 1, 'E-Waste', 'Old CRT monitors, broken computer towers, copper coils, and cables.', 14.5, 'kg', 'mock-ewaste.jpg', 'Electronic Waste (E-Waste)', 92.5, '78 NGO Colony', 'Mumbai', '400050', '2026-09-10', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 8 DAY));

-- Additional Recycling Status History
INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes, created_at) VALUES
('recycling', 1, 'PENDING', 2, 'Recycling request submitted by user', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('recycling', 1, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders for collection', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('recycling', 2, 'PENDING', 3, 'Recycling request submitted by user', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('recycling', 3, 'PENDING', 4, 'Recycling request submitted by user', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('recycling', 3, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('recycling', 3, 'COLLECTED', 7, 'Scrap metal collected and weighed on digital scale', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('recycling', 4, 'PENDING', 2, 'Recycling request submitted by user', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('recycling', 4, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('recycling', 4, 'COLLECTED', 7, 'Cardboard collected from premises', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('recycling', 4, 'COMPLETED', 7, 'Cardboard baled and shipped to paper recycling plant', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('recycling', 5, 'PENDING', 3, 'Recycling request submitted by user', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('recycling', 5, 'ACCEPTED', 7, 'Accepted by Eco Scrap Traders', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('recycling', 5, 'COLLECTED', 7, 'E-waste collected and logged', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('recycling', 5, 'COMPLETED', 7, 'Safely processed at certified e-waste recovery unit', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- Additional Recycling Impact Records
INSERT INTO impact_records (user_id, request_type, request_db_id, waste_weight_kg, impact_score, co2_saved_kg, created_at) VALUES
(4, 'recycling', 3, 42.0, 84.0, 63.0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'recycling', 4, 65.0, 130.0, 97.5, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 'recycling', 5, 14.5, 29.0, 21.75, DATE_SUB(NOW(), INTERVAL 5 DAY));


