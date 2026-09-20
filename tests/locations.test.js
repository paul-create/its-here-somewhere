const { request, setToken, assert } = require('./helpers');

async function runLocationTests(token) {
  console.log('Starting location tests...\n');
  
  setToken(token);
  const timestamp = Date.now();
  let testLocationId = null;

  try {
    // 1. POST location (public)
    console.log('1. Testing POST /api/locations (public)');
    const postRes = await request('POST', '/api/locations', {
      name: `Kitchen-${timestamp}`,
      is_private: false
    });
    assert.strictEqual(postRes.status, 201, `POST failed with status ${postRes.status}`);
    testLocationId = postRes.body.id;
    console.log('✓ Created public location\n');

    // 2. POST location (private)
    console.log('2. Testing POST /api/locations (private)');
    const postPrivateRes = await request('POST', '/api/locations', {
      name: `Wardrobe-${timestamp}`,
      is_private: true
    });
    assert.strictEqual(postPrivateRes.status, 201, 'POST failed');
    console.log('✓ Created private location\n');

    // 3. GET locations
    console.log('3. Testing GET /api/locations');
    const getRes = await request('GET', '/api/locations');
    assert.strictEqual(getRes.status, 200, 'GET failed');
    assert(Array.isArray(getRes.body), 'Should return array');
    console.log('✓ Retrieved locations\n');

    // 4. PUT location
    console.log('4. Testing PUT /api/locations/:id');
    const putRes = await request('PUT', `/api/locations/${testLocationId}`, {
      name: `Kitchen Updated-${timestamp}`,
      is_private: false
    });
    assert.strictEqual(putRes.status, 200, `PUT failed`);
    console.log('✓ Updated location\n');

    // 5. DELETE location
    console.log('5. Testing DELETE /api/locations/:id');
    const deleteLocRes = await request('POST', '/api/locations', {
      name: `Temp Loc-${timestamp}`,
      is_private: false
    });
    const deleteLocId = deleteLocRes.body.id;
    const deleteRes = await request('DELETE', `/api/locations/${deleteLocId}`);
    assert.strictEqual(deleteRes.status, 200, 'DELETE failed');
    console.log('✓ Deleted location\n');

    console.log('Location tests passed!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  console.error('Run via test suite');
  process.exit(1);
}

module.exports = { runLocationTests };