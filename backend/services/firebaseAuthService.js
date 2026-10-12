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

    // Persist full profile JSON into Firebase Cloud
    if (data.idToken && profileData) {
      await updateFirebaseProfile(data.idToken, profileData);
    }

    console.log(`[FirebaseAuth] ✅ User permanently registered in Firebase Cloud Auth: ${cleanEmail} (UID: ${data.localId})`);
    return data;
  } catch (err) {
    console.warn('[FirebaseAuth] Cloud registration note:', err.message);
    return null;
  }
}

/**
 * Sign in user and retrieve their permanently stored cloud profile
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

    // Lookup profile data stored in Firebase Auth
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
    const lookupRes = await fetch(lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: data.idToken })
    });
    const lookupData = await lookupRes.json();
    const userRecord = lookupData.users?.[0];

    let profile = {};
    if (userRecord?.displayName) {
      try {
        profile = JSON.parse(userRecord.displayName);
      } catch (e) {
        profile = { name: userRecord.displayName };
      }
    }

    console.log(`[FirebaseAuth] ✅ Firebase Cloud Auth login successful for: ${cleanEmail}`);
    return {
      authData: data,
      userRecord,
      profile: {
        name: profile.name || userRecord?.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: profile.role || 'user',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        status: profile.status || 'active',
        is_email_verified: 1,
        ngo_details: profile.ngo_details || null,
        scrap_dealer_details: profile.scrap_dealer_details || null
      }
    };
  } catch (err) {
    console.warn('[FirebaseAuth] Cloud sign in note:', err.message);
    return null;
  }
}

/**
 * Helper to update Firebase Cloud profile metadata
 */
async function updateFirebaseProfile(idToken, profileData) {
  try {
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
    await fetch(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        displayName: JSON.stringify(profileData),
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
      await updateFirebaseProfile(signInRes.authData.idToken, profileData);
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
