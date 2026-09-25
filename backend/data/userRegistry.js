const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const REGISTRY_FILE = path.join(__dirname, 'registered_users.json');

// In-memory cache for ultra-fast, lock-free access
let usersCache = [];

function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
      usersCache = JSON.parse(data);
    } else {
      usersCache = [];
    }
  } catch (err) {
    console.error('[UserRegistry] Error loading registry file:', err.message);
    if (!usersCache || usersCache.length === 0) usersCache = [];
  }
  return usersCache;
}

function persistRegistry() {
  try {
    const dir = path.dirname(REGISTRY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(usersCache, null, 2), 'utf8');
  } catch (err) {
    console.error('[UserRegistry] Error writing registry file:', err.message);
  }
}

// Initial load
loadRegistry();

const UserRegistry = {
  getAllUsers() {
    loadRegistry();
    return [...usersCache];
  },

  findUser(identifier) {
    if (!identifier) return null;
    loadRegistry();
    const cleanId = String(identifier).trim().toLowerCase();

    return usersCache.find(u => {
      if (String(u.id) === cleanId) return true;
      if (u.email && u.email.toLowerCase() === cleanId) return true;
      if (u.phone && u.phone.trim() === String(identifier).trim()) return true;
      if (u.name && u.name.toLowerCase() === cleanId) return true;
      return false;
    }) || null;
  },

  async verifyPassword(user, password) {
    if (!user || !password || !user.password_hash) return false;
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      return false;
    }
  },

  async registerUser(userData) {
    loadRegistry();
    const email = (userData.email || '').trim().toLowerCase();
    const phone = (userData.phone || '').trim();
    const name = (userData.name || '').trim();
    const role = (userData.role || 'user').trim().toLowerCase();
    const isEmailVerified = userData.is_email_verified !== undefined ? (userData.is_email_verified ? 1 : 0) : 0;
    const status = userData.status || 'pending';

    // Check if user already exists
    let existingIndex = usersCache.findIndex(u => 
      (email && u.email && u.email.toLowerCase() === email) ||
      (phone && u.phone && u.phone === phone)
    );

    let passwordHash = userData.password_hash;
    if (!passwordHash && userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 10);
    } else if (!passwordHash) {
      passwordHash = await bcrypt.hash('EcoDonate@2026', 10);
    }

    let userObj;
    if (existingIndex >= 0) {
      // Update existing user record
      userObj = {
        ...usersCache[existingIndex],
        name: name || usersCache[existingIndex].name,
        email: email || usersCache[existingIndex].email,
        phone: phone || usersCache[existingIndex].phone,
        password_hash: passwordHash,
        role: role || usersCache[existingIndex].role,
        address: userData.address || usersCache[existingIndex].address || '',
        city: userData.city || usersCache[existingIndex].city || '',
        state: userData.state || usersCache[existingIndex].state || '',
        pincode: userData.pincode || usersCache[existingIndex].pincode || '',
        is_email_verified: isEmailVerified,
        status: status,
        updated_at: new Date().toISOString()
      };
      // Clean up legacy plain_password_hint
      delete userObj.plain_password_hint;
      if (userData.ngo_details) userObj.ngo_details = userData.ngo_details;
      if (userData.scrap_dealer_details) userObj.scrap_dealer_details = userData.scrap_dealer_details;

      usersCache[existingIndex] = userObj;
    } else {
      // Create new user record
      const nextId = usersCache.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
      userObj = {
        id: nextId,
        name,
        email,
        phone,
        password_hash: passwordHash,
        role,
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        pincode: userData.pincode || '',
        is_email_verified: isEmailVerified,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (userData.ngo_details) userObj.ngo_details = userData.ngo_details;
      if (userData.scrap_dealer_details) userObj.scrap_dealer_details = userData.scrap_dealer_details;

      usersCache.push(userObj);
    }

    persistRegistry();
    return userObj;
  },

  updateUserStatus(identifier, status) {
    loadRegistry();
    const cleanId = String(identifier).trim().toLowerCase();
    const user = usersCache.find(u => 
      String(u.id) === cleanId || 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone === cleanId)
    );
    if (user) {
      user.status = status;
      user.updated_at = new Date().toISOString();
      if (status === 'active' || status === 'approved') {
        user.is_email_verified = 1;
      }
      persistRegistry();
      return user;
    }
    return null;
  },

  updateEmailVerification(email, isVerified = 1) {
    loadRegistry();
    const cleanEmail = String(email).trim().toLowerCase();
    const user = usersCache.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.is_email_verified = isVerified ? 1 : 0;
      user.updated_at = new Date().toISOString();
      persistRegistry();
      return user;
    }
    return null;
  },

  updatePassword(identifier, newPasswordHash) {
    loadRegistry();
    const cleanId = String(identifier).trim().toLowerCase();
    const user = usersCache.find(u => 
      String(u.id) === cleanId || 
      (u.email && u.email.toLowerCase() === cleanId)
    );
    if (user) {
      user.password_hash = newPasswordHash;
      delete user.plain_password_hint;
      user.updated_at = new Date().toISOString();
      persistRegistry();
      return user;
    }
    return null;
  },

  async syncToDatabase(pool) {
    if (!pool) return;
    loadRegistry();

    try {
      for (const u of usersCache) {
        try {
          const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [u.email.toLowerCase()]);
          if (existing.length === 0) {
            const [res] = await pool.query(
              'INSERT INTO users (id, name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [u.id, u.name, u.email, u.phone || '', u.password_hash, u.role, u.address || '', u.city || '', u.state || '', u.pincode || '', u.status || 'active']
            );
            const dbUserId = u.id;

            if (u.role === 'ngo' && u.ngo_details) {
              await pool.query(
                'INSERT INTO ngos (user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
                [dbUserId, u.ngo_details.ngo_name || u.name, u.ngo_details.contact_person || u.name, u.ngo_details.registration_number || '', u.ngo_details.description || '', u.ngo_details.verification_status || 'approved']
              );
            } else if (u.role === 'scrapdealer' && u.scrap_dealer_details) {
              await pool.query(
                'INSERT INTO scrap_dealers (user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
                [dbUserId, u.scrap_dealer_details.business_name || u.name, u.scrap_dealer_details.contact_person || u.name, u.scrap_dealer_details.registration_number || '', typeof u.scrap_dealer_details.accepted_materials === 'string' ? u.scrap_dealer_details.accepted_materials : JSON.stringify(u.scrap_dealer_details.accepted_materials || []), u.scrap_dealer_details.verification_status || 'approved']
              );
            }
          }
        } catch (queryErr) {
          // Ignore individual duplicate key errors during sync
        }
      }
      console.log(`[UserRegistry] Synchronized ${usersCache.length} persistent accounts with database.`);
    } catch (err) {
      console.warn('[UserRegistry] Sync warning:', err.message);
    }
  }
};

module.exports = UserRegistry;
