/**
 * Cloud Firestore Service for EcoDonate
 * Permanently stores and retrieves application data (users, donations, recycling requests)
 * in Google Cloud Firestore (project: ecodonate-6e24d)
 */

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBs2In3NySOfBu9bstQbxmA4s9HvVbCnHI';
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'ecodonate-6e24d';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    if (val.length === 0) return { arrayValue: {} };
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function fromFirestoreValue(valObj) {
  if (!valObj) return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('integerValue' in valObj) return parseInt(valObj.integerValue, 10);
  if ('doubleValue' in valObj) return parseFloat(valObj.doubleValue);
  if ('booleanValue' in valObj) return valObj.booleanValue;
  if ('nullValue' in valObj) return null;
  if ('arrayValue' in valObj) return (valObj.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in valObj) {
    const res = {};
    for (const [k, v] of Object.entries(valObj.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function fromFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const res = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    res[k] = fromFirestoreValue(v);
  }
  return res;
}

/**
 * 1. Permanently store / update user in Firestore
 */
async function saveUserToFirestore(user) {
  try {
    if (!user || !user.email) return null;
    const cleanEmail = encodeURIComponent(user.email.toLowerCase().trim());
    const docData = {
      id: user.id || null,
      name: user.name || '',
      email: user.email.toLowerCase().trim(),
      phone: user.phone || '',
      password_hash: user.password_hash || '',
      role: user.role || 'user',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      status: user.status || 'active',
      is_email_verified: user.is_email_verified ? 1 : 0,
      ngo_details: user.ngo_details || null,
      scrap_dealer_details: user.scrap_dealer_details || null,
      updated_at: new Date().toISOString()
    };
    if (user.created_at) docData.created_at = user.created_at;

    const url = `${FIRESTORE_BASE_URL}/users/${cleanEmail}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    if (res.ok) {
      console.log(`[Firestore] ✅ User ${user.email} (${user.role}) permanently synced to Firestore`);
      return true;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[Firestore] User save error:`, errData);
      return false;
    }
  } catch (err) {
    console.warn('[Firestore] saveUser notice:', err.message);
    return false;
  }
}

/**
 * 2. Retrieve user from Firestore by email, phone, or id
 */
async function getUserFromFirestore(identifier) {
  try {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    // If identifier is an email: direct fetch
    if (cleanId.includes('@')) {
      const encoded = encodeURIComponent(cleanId);
      const url = `${FIRESTORE_BASE_URL}/users/${encoded}?key=${FIREBASE_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const doc = await res.json();
        return fromFirestoreDoc(doc);
      }
    }

    // Otherwise search all users in Firestore
    const all = await getAllUsersFromFirestore();
    return all.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone === cleanId) ||
      (String(u.id) === cleanId)
    ) || null;
  } catch (err) {
    return null;
  }
}

/**
 * 3. Retrieve all users from Firestore
 */
async function getAllUsersFromFirestore() {
  try {
    const url = `${FIRESTORE_BASE_URL}/users?pageSize=300&key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents || []).map(fromFirestoreDoc).filter(Boolean);
  } catch (err) {
    console.warn('[Firestore] getAllUsers notice:', err.message);
    return [];
  }
}

/**
 * 4. Permanently store donation in Firestore
 */
async function saveDonationToFirestore(donation) {
  try {
    if (!donation || !donation.request_id) return null;
    const docId = encodeURIComponent(donation.request_id);
    const docData = {
      id: donation.id || null,
      request_id: donation.request_id,
      user_id: donation.user_id || null,
      donor_email: donation.donor_email || null,
      donor_name: donation.donor_name || null,
      ngo_id: donation.ngo_id || null,
      item_name: donation.item_name || '',
      category: donation.category || '',
      description: donation.description || '',
      condition_state: donation.condition_state || 'Good',
      quantity: donation.quantity || 1,
      image: donation.image || null,
      address: donation.address || '',
      city: donation.city || '',
      pincode: donation.pincode || '',
      pickup_date: donation.pickup_date || null,
      additional_notes: donation.additional_notes || null,
      status: donation.status || 'PENDING',
      created_at: donation.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const url = `${FIRESTORE_BASE_URL}/donations/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    if (res.ok) {
      console.log(`[Firestore] ✅ Donation ${donation.request_id} permanently saved to Firestore`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Firestore] saveDonation notice:', err.message);
    return false;
  }
}

/**
 * 5. Update donation in Firestore
 */
async function updateDonationInFirestore(requestId, updateData) {
  try {
    if (!requestId) return false;
    const docId = encodeURIComponent(requestId);
    const docData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    const url = `${FIRESTORE_BASE_URL}/donations/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 6. Retrieve all donations from Firestore
 */
async function getAllDonationsFromFirestore() {
  try {
    const url = `${FIRESTORE_BASE_URL}/donations?pageSize=300&key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents || []).map(fromFirestoreDoc).filter(Boolean);
  } catch (err) {
    console.warn('[Firestore] getAllDonations notice:', err.message);
    return [];
  }
}

/**
 * 7. Permanently store recycling request in Firestore
 */
async function saveRecyclingToFirestore(recycling) {
  try {
    if (!recycling || !recycling.request_id) return null;
    const docId = encodeURIComponent(recycling.request_id);
    const docData = {
      id: recycling.id || null,
      request_id: recycling.request_id,
      user_id: recycling.user_id || null,
      user_email: recycling.user_email || null,
      user_name: recycling.user_name || null,
      scrap_dealer_id: recycling.scrap_dealer_id || null,
      waste_category: recycling.waste_category || recycling.category || '',
      ai_prediction: recycling.ai_prediction || null,
      ai_confidence: recycling.ai_confidence || null,
      description: recycling.description || '',
      quantity: recycling.quantity || 1,
      quantity_unit: recycling.quantity_unit || 'kg',
      image: recycling.image || null,
      address: recycling.address || '',
      city: recycling.city || '',
      pincode: recycling.pincode || '',
      pickup_date: recycling.pickup_date || null,
      status: recycling.status || 'PENDING',
      created_at: recycling.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const url = `${FIRESTORE_BASE_URL}/recycling_requests/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    if (res.ok) {
      console.log(`[Firestore] ✅ Recycling request ${recycling.request_id} permanently saved to Firestore`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Firestore] saveRecycling notice:', err.message);
    return false;
  }
}

/**
 * 8. Update recycling request in Firestore
 */
async function updateRecyclingInFirestore(requestId, updateData) {
  try {
    if (!requestId) return false;
    const docId = encodeURIComponent(requestId);
    const docData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    const url = `${FIRESTORE_BASE_URL}/recycling_requests/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 9. Retrieve all recycling requests from Firestore
 */
async function getAllRecyclingFromFirestore() {
  try {
    const url = `${FIRESTORE_BASE_URL}/recycling_requests?pageSize=300&key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents || []).map(fromFirestoreDoc).filter(Boolean);
  } catch (err) {
    console.warn('[Firestore] getAllRecycling notice:', err.message);
    return [];
  }
}

/**
 * 10. Synchronize all Firestore persistent data into local SQL/cache on startup
 */
async function syncAllFromFirestore(pool) {
  try {
    console.log('[Firestore] 🔄 Synchronizing all Cloud Firestore persistent records...');
    const UserRegistry = require('../data/userRegistry');

    // 1. Sync all users from Firestore
    const cloudUsers = await getAllUsersFromFirestore();
    let usersSynced = 0;
    for (const cu of cloudUsers) {
      if (!cu.email) continue;
      const registeredUser = await UserRegistry.registerUser(cu);
      if (pool) {
        try {
          const [exists] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cu.email.toLowerCase()]);
          if (exists.length === 0) {
            await pool.query(
              'INSERT INTO users (id, name, email, phone, password_hash, role, address, city, state, pincode, status, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
              [registeredUser.id, cu.name || '', cu.email, cu.phone || '', cu.password_hash || '', cu.role || 'user', cu.address || '', cu.city || '', cu.state || '', cu.pincode || '', cu.status || 'active']
            );
            const dbUserId = registeredUser.id;
            if (cu.role === 'ngo' && cu.ngo_details) {
              await pool.query(
                'INSERT INTO ngos (user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
                [dbUserId, cu.ngo_details.ngo_name || cu.name, cu.ngo_details.contact_person || cu.name, cu.ngo_details.registration_number || '', cu.ngo_details.description || '', 'approved']
              );
            } else if (cu.role === 'scrapdealer' && cu.scrap_dealer_details) {
              await pool.query(
                'INSERT INTO scrap_dealers (user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
                [dbUserId, cu.scrap_dealer_details.business_name || cu.name, cu.scrap_dealer_details.contact_person || cu.name, cu.scrap_dealer_details.registration_number || '', typeof cu.scrap_dealer_details.accepted_materials === 'string' ? cu.scrap_dealer_details.accepted_materials : JSON.stringify(cu.scrap_dealer_details.accepted_materials || []), 'approved']
              );
            }
          }
        } catch (dbInsErr) {}
      }
      usersSynced++;
    }

    // 2. Sync all donations from Firestore
    const cloudDonations = await getAllDonationsFromFirestore();
    let donationsSynced = 0;
    if (pool) {
      for (const cd of cloudDonations) {
        if (!cd.request_id) continue;
        try {
          const [dExists] = await pool.query('SELECT id FROM donations WHERE request_id = ?', [cd.request_id]);
          if (dExists.length === 0) {
            let resolvedUserId = cd.user_id;
            if (cd.donor_email) {
              const [uRow] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cd.donor_email.toLowerCase()]);
              if (uRow && uRow.length > 0) resolvedUserId = uRow[0].id;
            }
            if (!resolvedUserId) resolvedUserId = 1;

            await pool.query(
              `INSERT INTO donations (request_id, user_id, ngo_id, item_name, category, description, condition_state, quantity, image, address, city, pincode, pickup_date, additional_notes, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [cd.request_id, resolvedUserId, cd.ngo_id || null, cd.item_name || 'Donation Item', cd.category || 'General', cd.description || '', cd.condition_state || 'Good', cd.quantity || 1, cd.image || null, cd.address || '', cd.city || '', cd.pincode || '', cd.pickup_date || null, cd.additional_notes || null, cd.status || 'PENDING']
            );
            donationsSynced++;
          }
        } catch (dErr) {}
      }
    }

    // 3. Sync all recycling requests from Firestore
    const cloudRecycling = await getAllRecyclingFromFirestore();
    let recyclingSynced = 0;
    if (pool) {
      for (const cr of cloudRecycling) {
        if (!cr.request_id) continue;
        try {
          const [rExists] = await pool.query('SELECT id FROM recycling_requests WHERE request_id = ?', [cr.request_id]);
          if (rExists.length === 0) {
            let resolvedUserId = cr.user_id;
            if (cr.user_email) {
              const [uRow] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cr.user_email.toLowerCase()]);
              if (uRow && uRow.length > 0) resolvedUserId = uRow[0].id;
            }
            if (!resolvedUserId) resolvedUserId = 1;

            await pool.query(
              `INSERT INTO recycling_requests (request_id, user_id, scrap_dealer_id, waste_category, description, quantity, quantity_unit, image, address, city, pincode, pickup_date, ai_prediction, ai_confidence, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [cr.request_id, resolvedUserId, cr.scrap_dealer_id || null, cr.waste_category || 'Plastic', cr.description || '', cr.quantity || 1, cr.quantity_unit || 'kg', cr.image || null, cr.address || '', cr.city || '', cr.pincode || '', cr.pickup_date || null, cr.ai_prediction || null, cr.ai_confidence || null, cr.status || 'PENDING']
            );
            recyclingSynced++;
          }
        } catch (rErr) {}
      }
    }

    console.log(`[Firestore] ✅ Cloud sync complete: ${usersSynced} users, ${donationsSynced} new donations, ${recyclingSynced} new recycling requests.`);
  } catch (err) {
    console.warn('[Firestore] syncAllFromFirestore warning:', err.message);
  }
}

module.exports = {
  saveUserToFirestore,
  getUserFromFirestore,
  getAllUsersFromFirestore,
  saveDonationToFirestore,
  updateDonationInFirestore,
  getAllDonationsFromFirestore,
  saveRecyclingToFirestore,
  updateRecyclingInFirestore,
  getAllRecyclingFromFirestore,
  syncAllFromFirestore
};
