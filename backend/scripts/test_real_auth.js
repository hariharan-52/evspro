const http = require('http');
const app = require('../app');
const { pool } = require('../config/database');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING ECODONATE REAL AUTHENTICATION TEST SUITE');
  console.log('====================================================\n');

  let server;
  let baseUrl;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failedCount++;
    }
  }

  try {
    // Start temporary server on random available port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`Server listening for tests at ${baseUrl}\n`);
        resolve();
      });
    });

    const testTimestamp = Date.now();
    const testUserEmail = `realuser_${testTimestamp}@example.com`;
    const testUserPassword = 'MySecretPassword@2026';

    // -----------------------------------------------------------
    // TEST 1: Register a genuine new user
    // -----------------------------------------------------------
    console.log('--- Step 1: User Registration ---');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Real Test User',
        email: testUserEmail,
        phone: '9988776655',
        password: testUserPassword,
        role: 'user',
        address: '45 Eco Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Registration returns 201 Created', JSON.stringify(regData));
    assert(regData.user?.email === testUserEmail, 'Registration returns correct user email');
    assert(regData.user?.password === undefined && regData.user?.password_hash === undefined, 'No password or password_hash leaked in response');

    // -----------------------------------------------------------
    // TEST 2: Passwords securely hashed in the database
    // -----------------------------------------------------------
    console.log('\n--- Step 2: Database Password Hashing Verification ---');
    const [dbUsers] = await pool.query('SELECT password_hash FROM users WHERE email = ?', [testUserEmail]);
    assert(dbUsers.length === 1, 'User found in database');
    const storedHash = dbUsers[0]?.password_hash || '';
    assert(storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$'), 'Password is encrypted using bcrypt hash');
    assert(!storedHash.includes(testUserPassword), 'Plain text password is NEVER stored in database');

    // -----------------------------------------------------------
    // TEST 3: Duplicate email registration is prevented
    // -----------------------------------------------------------
    console.log('\n--- Step 3: Duplicate Email Prevention ---');
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: testUserEmail,
        phone: '1122334455',
        password: 'AnotherPassword@123',
        role: 'user'
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400, 'Duplicate email registration returns 400 Bad Request');
    assert(dupData.message.toLowerCase().includes('already exists'), 'Appropriate duplicate error message returned');

    // -----------------------------------------------------------
    // TEST 4: Prevent public registration as Admin
    // -----------------------------------------------------------
    console.log('\n--- Step 4: Role Tampering Security Check ---');
    const fakeAdminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `fakeadmin_${testTimestamp}@example.com`,
        phone: '1234567890',
        password: 'Password@123',
        role: 'admin'
      })
    });
    const fakeAdminData = await fakeAdminRes.json();
    assert(fakeAdminRes.status === 400, 'Public registration as admin is rejected (400)');
    assert(fakeAdminData.message.includes('Administrator accounts cannot be created publicly'), 'Admin creation blocked with security message');

    // -----------------------------------------------------------
    // TEST 5: Short password rejected
    // -----------------------------------------------------------
    console.log('\n--- Step 5: Password Length Validation ---');
    const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass',
        email: `short_${testTimestamp}@example.com`,
        phone: '1234567890',
        password: '123',
        role: 'user'
      })
    });
    assert(shortPassRes.status === 400, 'Password < 6 characters is rejected with 400');

    // -----------------------------------------------------------
    // TEST 6: Newly registered user can log in with their real credentials
    // -----------------------------------------------------------
    console.log('\n--- Step 6: Real Login with Registered Credentials ---');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login with real registered credentials succeeds (200)');
    assert(!!loginData.token, 'JWT token returned upon successful login');
    assert(loginData.user?.role === 'user', 'User role is preserved');
    const userToken = loginData.token;

    // -----------------------------------------------------------
    // TEST 7: Incorrect passwords are rejected
    // -----------------------------------------------------------
    console.log('\n--- Step 7: Incorrect Password Rejection ---');
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'WrongPassword@999'
      })
    });
    const wrongPassData = await wrongPassRes.json();
    assert(wrongPassRes.status === 401, 'Wrong password returns 401 Unauthorized');
    assert(wrongPassData.message === 'Invalid email address or password. Please check your credentials.', 'Generic error message to prevent enumeration');

    // -----------------------------------------------------------
    // TEST 8: Unregistered accounts cannot log in
    // -----------------------------------------------------------
    console.log('\n--- Step 8: Unregistered Account Login Rejection ---');
    const unregRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent_${testTimestamp}@example.com`,
        password: 'AnyPassword@123'
      })
    });
    const unregData = await unregRes.json();
    assert(unregRes.status === 401, 'Unregistered account returns 401 Unauthorized');
    assert(unregData.message === 'Invalid email address or password. Please check your credentials.', 'Identical message avoids email existence leakage');

    // -----------------------------------------------------------
    // TEST 9: Authenticated session check via /auth/me
    // -----------------------------------------------------------
    console.log('\n--- Step 9: Session Persistence via /auth/me ---');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, '/auth/me returns 200 with valid session token');
    assert(meData.email === testUserEmail, '/auth/me returns current authenticated user profile');
    assert(meData.password_hash === undefined, 'No password hash exposed in /auth/me');

    // -----------------------------------------------------------
    // TEST 10: Role-based access control (User cannot access Admin routes)
    // -----------------------------------------------------------
    console.log('\n--- Step 10: Role-Based Authorization Enforcement ---');
    const adminCheckRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(adminCheckRes.status === 403, 'Regular user is forbidden (403) from Admin dashboard API');

    // -----------------------------------------------------------
    // TEST 11: Unverified NGO cannot log in
    // -----------------------------------------------------------
    console.log('\n--- Step 11: Unverified Organization Login Restriction ---');
    const unverifiedNgoRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pendingngo@example.com',
        password: 'Password@123'
      })
    });
    const unverifiedNgoData = await unverifiedNgoRes.json();
    assert(unverifiedNgoRes.status === 403, 'Unverified NGO login returns 403 Forbidden');
    assert(unverifiedNgoData.message.includes('pending Admin approval'), 'Approval requirement message returned');

    // -----------------------------------------------------------
    // TEST 12: Admin login and verified NGO login
    // -----------------------------------------------------------
    console.log('\n--- Step 12: Approved Accounts Login & Role Access ---');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ecodonate.com',
        password: 'Admin@123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin logs in successfully (200)');
    assert(adminLoginData.user?.role === 'admin', 'Admin role is verified');

    const adminStatsRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminLoginData.token}` }
    });
    assert(adminStatsRes.status === 200, 'Admin can access Admin dashboard API (200)');

    // -----------------------------------------------------------
    // TEST 13: Logout and token revocation
    // -----------------------------------------------------------
    console.log('\n--- Step 13: Logout & Server-Side Token Invalidation ---');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(logoutRes.status === 200, 'Logout succeeds with 200');

    const postLogoutMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(postLogoutMeRes.status === 401, 'Revoked token is rejected on subsequent calls (401)');

    // -----------------------------------------------------------
    // TEST 14: Existing database records intact
    // -----------------------------------------------------------
    console.log('\n--- Step 14: Data Integrity Verification ---');
    const [existingUsers] = await pool.query('SELECT COUNT(*) as c FROM users');
    assert(existingUsers[0].c >= 9, 'All existing seed users remain completely intact');

    const [existingDonations] = await pool.query('SELECT COUNT(*) as c FROM donations');
    assert(existingDonations[0].c >= 3, 'All existing donations remain intact');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('====================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(0);
  }
}

runTests();
