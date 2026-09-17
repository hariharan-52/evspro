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



