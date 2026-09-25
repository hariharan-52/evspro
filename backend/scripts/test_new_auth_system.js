const http = require('http');
const app = require('../app');
const UserRegistry = require('../data/userRegistry');

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🚀 TESTING NEW ECODONATE AUTHENTICATION SYSTEM (OTP & PASSWORD)');
  console.log('===============================================================\n');

  let server;
  let baseUrl;
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  try {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`Test server running at ${baseUrl}\n`);
        resolve();
      });
    });

    const timestamp = Date.now();
    const testPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
    const testEmail = `newuser_${timestamp}@example.com`;

    // -------------------------------------------------------------
    // Test 1: Send OTP for existing user (Rahul Sharma - 9876543211)
    // -------------------------------------------------------------
    console.log('--- Step 1: Send OTP for Existing User ---');
    const otpRes1 = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rahul@example.com' })
    });
    const otpData1 = await otpRes1.json();
    assert(otpRes1.status === 200, 'Send OTP status 200', JSON.stringify(otpData1));
    assert(otpData1.otp && otpData1.otp.length === 6, 'Generated 6-digit OTP', otpData1.otp);
    assert(otpData1.isRegistered === true, 'Identified user as registered', otpData1.isRegistered);

    // -------------------------------------------------------------
    // Test 2: Verify OTP for existing user
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Verify OTP & Sign In ---');
    const verifyRes1 = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rahul@example.com', otp: otpData1.otp })
    });
    const verifyData1 = await verifyRes1.json();
    assert(verifyRes1.status === 200, 'Verify OTP returns 200 OK', JSON.stringify(verifyData1));
    assert(verifyData1.token && verifyData1.user, 'Issued valid token & user object');
    assert(verifyData1.user.email === 'rahul@example.com', 'Correct user returned: ' + verifyData1.user.email);

    // -------------------------------------------------------------
    // Test 3: Send OTP & Auto-Register brand new user via OTP
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Instant Registration via OTP ---');
    const otpRes2 = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testPhone })
    });
    const otpData2 = await otpRes2.json();
    assert(otpRes2.status === 200, 'Send OTP for new phone number returns 200');

    const verifyRes2 = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testPhone,
        otp: otpData2.otp,
        name: 'Fresh OTP User',
        role: 'user'
      })
    });
    const verifyData2 = await verifyRes2.json();
    assert(verifyRes2.status === 201, 'New user registered via OTP returns 201 Created', JSON.stringify(verifyData2));
    assert(verifyData2.user && verifyData2.user.name === 'Fresh OTP User', 'New user profile created properly');

    // -------------------------------------------------------------
    // Test 4: Re-login the newly created user via OTP
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Re-login the Newly Created User via OTP ---');
    const otpRes3 = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testPhone })
    });
    const otpData3 = await otpRes3.json();
    const verifyRes3 = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testPhone, otp: otpData3.otp })
    });
    const verifyData3 = await verifyRes3.json();
    assert(verifyRes3.status === 200, 'Newly registered user re-login via OTP succeeds immediately');
    assert(verifyData3.user.id === verifyData2.user.id, 'User ID matches created user');

    // -------------------------------------------------------------
    // Test 5: Register User via Password & Verify Immediate Re-Login
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Register User via Password & Re-Login ---');
    const regPassword = 'MySecretPassword@2026';
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Persistent Tester',
        email: testEmail,
        phone: '9988776611',
        password: regPassword,
        role: 'user',
        address: '100 Green Blvd',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Password registration returns 201 Created');
    assert(regData.token && regData.user, 'Issued token upon registration');

    // Immediate re-login with email
    const loginRes1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: regPassword })
    });
    const loginData1 = await loginRes1.json();
    assert(loginRes1.status === 200, 'Re-login with Email succeeded');

    // Immediate re-login with phone
    const loginRes2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9988776611', password: regPassword })
    });
    const loginData2 = await loginRes2.json();
    assert(loginRes2.status === 200, 'Re-login with Phone Number succeeded');

    // Immediate re-login with username/name
    const loginRes3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Persistent Tester', password: regPassword })
    });
    const loginData3 = await loginRes3.json();
    assert(loginRes3.status === 200, 'Re-login with Username/Name succeeded');


    // -------------------------------------------------------------
    // Test 7: Verify User Persistence in Registry Store
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Verify Storage Persistence ---');
    const storedUser = UserRegistry.findUser(testEmail);
    assert(Boolean(storedUser), 'User permanently saved in registered_users.json');
    assert(storedUser && storedUser.email === testEmail, 'Email matches in registry');

    console.log('\n===============================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
