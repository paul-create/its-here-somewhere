const { request, setToken, assert } = require('./helpers');

async function runAuthTests() {
  console.log('Starting auth tests...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  let token = null;

  try {
    // 1. Signup
    console.log('1. Testing POST /api/auth/signup');
    const signupRes = await request('POST', '/api/auth/signup', {
      email: testEmail,
      password: 'TestPass123!'
    });
    assert.strictEqual(signupRes.status, 201, 'Signup failed');
    console.log('✓ Signup successful\n');

    // 2. Login
    console.log('2. Testing POST /api/auth/login');
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'TestPass123!'
    });
    assert.strictEqual(loginRes.status, 200, 'Login failed');
    token = loginRes.body.token;
    setToken(token);
    console.log('✓ Login successful, token obtained\n');

    // 3. GET /me
    console.log('3. Testing GET /api/auth/me');
    const meRes = await request('GET', '/api/auth/me');
    assert.strictEqual(meRes.status, 200, 'GET /me failed');
    assert.strictEqual(meRes.body.email, testEmail, 'Email mismatch');
    console.log('✓ GET /me successful\n');

    console.log('Auth tests passed!');
    return token; // Return token for other tests
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runAuthTests().then(() => process.exit(0));
}

module.exports = { runAuthTests };