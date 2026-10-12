const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBs2In3NySOfBu9bstQbxmA4s9HvVbCnHI';

/**
 * Register a user account in permanent Google Firebase Cloud Authentication
 */
async function firebaseSignUp(email, password, profileData = {}) {
  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        returnSecureToken: true
      })
    });

    const data = await res.json();

    if (!res.ok) {
      // If user already exists in Firebase Auth, attempt to sign in and update profile
      if (data.error?.message?.includes('EMAIL_EXISTS')) {
        console.log(`[FirebaseAuth] User ${cleanEmail} already exists in Firebase Cloud Auth. Updating profile...`);
        return await firebaseSignInAndUpdate(cleanEmail, password, profileData);
      }
      console.warn('[FirebaseAuth] Cloud sign up note:', data.error?.message);
      return null;
    }

    // Persist safe display name into Firebase Cloud Auth (strictly under 100 chars to avoid 256 char limit)
    if (data.idToken) {
      const safeName = String(profileData.name || cleanEmail.split('@')[0]).slice(0, 100);
      await updateFirebaseProfile(data.idToken, safeName);
    }

    console.log(`[FirebaseAuth] ✅ User permanently registered in Firebase Cloud Auth: ${cleanEmail} (UID: ${data.localId})`);
    return data;
  } catch (err) {
    console.warn('[FirebaseAuth] Cloud registration note:', err.message);
    return null;
  }
}

/**
 * Sign in user and retrieve their permanently stored cloud profile from Firestore
 */
async function firebaseSignIn(email, password) {
  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return null;
    }

    // Look up persistent profile data in Cloud Firestore first for complete fidelity
    const { getUserFromFirestore } = require('./firestoreService');
    const firestoreUser = await getUserFromFirestore(cleanEmail);

    let displayName = cleanEmail.split('@')[0];
    try {
      const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
      const lookupRes = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: data.idToken })
      });
      const lookupData = await lookupRes.json();
      if (lookupData.users?.[0]?.displayName) {
        displayName = lookupData.users[0].displayName;
      }
    } catch (lookupErr) {}

    console.log(`[FirebaseAuth] ✅ Firebase Cloud Auth login successful for: ${cleanEmail}`);
    return {
      authData: data,
      uid: data.localId,
      email: cleanEmail,
      profile: firestoreUser || {
        name: displayName,
        email: cleanEmail,
        role: 'user',
        status: 'active',
        is_email_verified: 1
      }
    };
  } catch (err) {
    console.warn('[FirebaseAuth] Cloud sign in note:', err.message);
    return null;
  }
}

/**
 * Helper to update Firebase Cloud Auth display name
 */
async function updateFirebaseProfile(idToken, displayName) {
  try {
    const safeName = String(displayName || '').slice(0, 100);
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
    await fetch(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        displayName: safeName,
        returnSecureToken: false
      })
    });
  } catch (err) {
    console.warn('[FirebaseAuth] Profile metadata sync note:', err.message);
  }
}

async function firebaseSignInAndUpdate(email, password, profileData) {
  try {
    const signInRes = await firebaseSignIn(email, password);
    if (signInRes && signInRes.authData?.idToken) {
      const safeName = String(profileData.name || email.split('@')[0]).slice(0, 100);
      await updateFirebaseProfile(signInRes.authData.idToken, safeName);
      return signInRes.authData;
    }
  } catch (e) {}
  return null;
}

module.exports = {
  firebaseSignUp,
  firebaseSignIn,
  updateFirebaseProfile
};
