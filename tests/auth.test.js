const { request, setToken, setHomeId, setTestUserId, createTestHome, assert, trackItem } = require('./helpers');

async function runAuthTests() {
  console.log('Starting auth tests...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  let token = null;
  let userId = null;
  let homeId = null;

  try {
    // 1. Signup
    console.log('1. Testing POST /api/auth/signup');
    const signupRes = await request('POST', '/api/auth/signup', {
      email: testEmail,
      password: 'TestPass123!'
    });
    console.log('DEBUG signupRes.body:', signupRes.body);
    assert.strictEqual(signupRes.status, 201, 'Signup failed');
    userId = signupRes.body.userId;
    console.log('DEBUG userId after assignment:', userId);

    // 2. Login (before home registration)
    console.log('2. Testing POST /api/auth/login (before home)');
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'TestPass123!'
    });
    assert.strictEqual(loginRes.status, 200, 'Login failed');
    token = loginRes.body.token;
    assert(token, 'Token not returned');
    
    // After signup/login, homeId should be null until user creates/joins a home
    assert(loginRes.body.homeId === null || loginRes.body.homeId === undefined, 
      'User should not have homeId before home registration');
    
    setToken(token);
    console.log('✓ Login successful, token obtained\n');

    // 3. Create home
    console.log('3. Testing POST /api/auth/create-home');
    const createHomeRes = await request('POST', '/api/auth/create-home', {
      name: `Test Home ${Date.now()}`
    });
    assert.strictEqual(createHomeRes.status, 201, 'Create home failed');
    homeId = createHomeRes.body.home_id;
    assert(homeId, 'home_id not returned');
    assert(createHomeRes.body.home_code, 'home_code not returned');
    setHomeId(homeId);
    trackItem('homes', homeId);
    console.log(`✓ Created home: ${homeId}\n`);

    // 4. Login again (after home registration)
    console.log('4. Testing POST /api/auth/login (after home)');
    const loginRes2 = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'TestPass123!'
    });
    assert.strictEqual(loginRes2.status, 200, 'Second login failed');
    assert.strictEqual(loginRes2.body.homeId, homeId, 'homeId should be returned after home creation');
    console.log('✓ Login after home registration successful\n');

    console.log('Auth tests passed!');
    console.log('DEBUG auth.test.js return values:', { token: !!token, homeId, userId });
    return { token, homeId, userId };
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

module.exports = { runAuthTests };