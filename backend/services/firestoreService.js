/**
 * Cloud Firestore Service for EcoDonate
 * Permanently stores and retrieves application data (users, donations, recycling requests)
 * in Google Cloud Firestore (project: ecodonate-6e24d)
 */

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBs2In3NySOfBu9bstQbxmA4s9HvVbCnHI';
const PROJECT_ID = 'ecodonate-6e24d';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
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

    const url = `${FIRESTORE_BASE_URL}/users/${cleanEmail}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    if (res.ok) {
      console.log(`[Firestore] User ${user.email} permanently synced to Firestore`);
    }
  } catch (err) {
    console.warn('[Firestore] saveUser notice:', err.message);
  }
}

/**
 * 2. Retrieve user from Firestore
 */
async function getUserFromFirestore(email) {
  try {
    if (!email) return null;
    const cleanEmail = encodeURIComponent(email.toLowerCase().trim());
    const url = `${FIRESTORE_BASE_URL}/users/${cleanEmail}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const doc = await res.json();
    return fromFirestoreDoc(doc);
  } catch (err) {
    return null;
  }
}

/**
 * 3. Permanently store donation in Firestore
 */
async function saveDonationToFirestore(donation) {
  try {
    const docId = encodeURIComponent(donation.request_id || `DON_${Date.now()}`);
    const docData = {
      ...donation,
      created_at: donation.created_at || new Date().toISOString()
    };
    const url = `${FIRESTORE_BASE_URL}/donations/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    if (res.ok) {
      console.log(`[Firestore] Donation ${donation.request_id} permanently saved to Firestore`);
    }
  } catch (err) {
    console.warn('[Firestore] saveDonation notice:', err.message);
  }
}

/**
 * 4. Permanently store recycling request in Firestore
 */
async function saveRecyclingToFirestore(recycling) {
  try {
    const docId = encodeURIComponent(recycling.request_id || `REC_${Date.now()}`);
    const docData = {
      ...recycling,
      created_at: recycling.created_at || new Date().toISOString()
    };
    const url = `${FIRESTORE_BASE_URL}/recycling_requests/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(docData) })
    });
    if (res.ok) {
      console.log(`[Firestore] Recycling request ${recycling.request_id} permanently saved to Firestore`);
    }
  } catch (err) {
    console.warn('[Firestore] saveRecycling notice:', err.message);
  }
}

module.exports = {
  saveUserToFirestore,
  getUserFromFirestore,
  saveDonationToFirestore,
  saveRecyclingToFirestore
};
