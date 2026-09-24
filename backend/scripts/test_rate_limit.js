const http = require('http');
const app = require('../app');

async function testRateLimit() {
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/api/auth/login`;

  console.log('Sending 5 consecutive failed login attempts...');
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'badactor@example.com', password: 'wrongpassword' })
    });
    console.log(`Attempt ${i}: HTTP status = ${res.status}`);
  }

  console.log('Attempt 6 (should trigger HTTP 429 Too Many Requests):');
  const limitRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'badactor@example.com', password: 'wrongpassword' })
  });
  const data = await limitRes.json();
  console.log(`Attempt 6: HTTP status = ${limitRes.status}, message = "${data.message}"`);
  server.close();

  if (limitRes.status === 429) {
    console.log('✅ [PASS] Brute-force rate limiter successfully locked out after 5 failed attempts.');
    process.exit(0);
  } else {
    console.error('❌ [FAIL] Expected 429 status code but received ' + limitRes.status);
    process.exit(1);
  }
}

testRateLimit().catch((err) => {
  console.error(err);
  process.exit(1);
});
