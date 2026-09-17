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

-- 9 Official Demo Accounts
INSERT INTO users (id, name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES
(1, 'Admin User', 'admin@ecodonate.com', '9876543210', '$2b$10$61r2sAJwoLR3hXW/N4wEv.u9IgGntPh/DpVuEDM6KvAmel9J4JGUG', 'admin', 'Admin HQ', 'Delhi', 'Delhi', '110001', 'active'),
(2, 'Rahul Sharma', 'rahul@example.com', '9876543211', '$2b$10$7lwm3Ug2EyQ2Z0Dp4v0X9evp6rjTtuHES1kR0W.8SRCxnOa5dHWM.', 'user', '12 MG Road', 'Mumbai', 'Maharashtra', '400001', 'active'),
(3, 'Hari User', 'harihari@gmail.com', '9876543220', '$2b$10$rRzxe4FcwiX/M.4RMhQbOurX2Pxzy35DA6A8psmBN4gwB3fs4P2wW', 'user', '24 Green Avenue', 'Chennai', 'Tamil Nadu', '600001', 'active'),
(4, 'Green Earth NGO', 'contact@greenearth.org', '9876543214', '$2b$10$7lwm3Ug2EyQ2Z0Dp4v0X9evp6rjTtuHES1kR0W.8SRCxnOa5dHWM.', 'ngo', '78 NGO Colony', 'Mumbai', 'Maharashtra', '400050', 'active'),
(5, 'Hari NGO', 'hariharingo@gmail.com', '9876543221', '$2b$10$rRzxe4FcwiX/M.4RMhQbOurX2Pxzy35DA6A8psmBN4gwB3fs4P2wW', 'ngo', '45 Care Foundation Road', 'Chennai', 'Tamil Nadu', '600004', 'active'),
(6, 'Eco Scrap Traders', 'info@ecoscrap.com', '9876543216', '$2b$10$7lwm3Ug2EyQ2Z0Dp4v0X9evp6rjTtuHES1kR0W.8SRCxnOa5dHWM.', 'scrapdealer', '12 Industrial Area', 'Mumbai', 'Maharashtra', '400093', 'active'),
(7, 'Hari Scrap Dealers', 'harihariscrap@gmail.com', '9876543222', '$2b$10$rRzxe4FcwiX/M.4RMhQbOurX2Pxzy35DA6A8psmBN4gwB3fs4P2wW', 'scrapdealer', '88 Recycle Park', 'Chennai', 'Tamil Nadu', '600032', 'active'),
(8, 'Hope Foundation (Unapproved NGO)', 'pendingngo@example.com', '9876543215', '$2b$10$7lwm3Ug2EyQ2Z0Dp4v0X9evp6rjTtuHES1kR0W.8SRCxnOa5dHWM.', 'ngo', '90 Charity Street', 'Delhi', 'Delhi', '110020', 'pending'),
(9, 'City Recyclers (Unapproved Scrap Dealer)', 'pendingscrap@example.com', '9876543217', '$2b$10$7lwm3Ug2EyQ2Z0Dp4v0X9evp6rjTtuHES1kR0W.8SRCxnOa5dHWM.', 'scrapdealer', '34 Scrap Yard', 'Bangalore', 'Karnataka', '560022', 'pending');

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



