-- EcoDonate Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS ecodonate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecodonate;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','ngo','scrapdealer','admin') NOT NULL DEFAULT 'user',
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(20),
  profile_image VARCHAR(255),
  status ENUM('active','inactive','pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ngos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ngo_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  registration_number VARCHAR(100),
  description TEXT,
  verification_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scrap_dealers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  registration_number VARCHAR(100),
  accepted_materials JSON,
  verification_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  ngo_id INT,
  item_name VARCHAR(255) NOT NULL,
  category ENUM('Furniture','Books','Clothes','Electronics','Household Items','Other') NOT NULL,
  description TEXT,
  condition_state ENUM('New','Like New','Good','Usable') NOT NULL,
  quantity INT DEFAULT 1,
  image VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  pickup_date DATE,
  additional_notes TEXT,
  status ENUM('PENDING','ACCEPTED','PICKUP_SCHEDULED','RECEIVED','COMPLETED','REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recycling_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  scrap_dealer_id INT,
  waste_category ENUM('Plastic','Paper','Metal','Glass','E-Waste','Cardboard','Other') NOT NULL,
  ai_prediction VARCHAR(100),
  ai_confidence DECIMAL(5,2),
  description TEXT,
  quantity DECIMAL(10,2),
  quantity_unit VARCHAR(20),
  image VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  pickup_date DATE,
  status ENUM('PENDING','ACCEPTED','PICKUP_SCHEDULED','COLLECTED','COMPLETED','REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (scrap_dealer_id) REFERENCES scrap_dealers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE request_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('donation','recycling') NOT NULL,
  request_db_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  updated_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE impact_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  request_type ENUM('donation','recycling') NOT NULL,
  request_db_id INT NOT NULL,
  waste_weight_kg DECIMAL(10,2) DEFAULT 0,
  items_count INT DEFAULT 0,
  impact_score DECIMAL(10,2) DEFAULT 0,
  co2_saved_kg DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT 0,
  related_id INT,
  related_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
