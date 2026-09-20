const { request, setToken, assert } = require('./helpers');

async function runItemLocationsTests(token) {
  console.log('Starting item locations tests...\n');
  
  setToken(token);
  const timestamp = Date.now();
  let testItemId = null;
  let testLocationId = null;

  try {
    // Setup: create category
    const catRes = await request('POST', '/api/categories', {
      name: `LocTestCat-${timestamp}`,
      is_private: false
    });
    const categoryId = catRes.body.id;

    // Setup: create item
    const itemRes = await request('POST', '/api/items', {
      name: 'Test Item',
      category_id: categoryId,
      quantity: 1
    });
    testItemId = itemRes.body.id;

    // Setup: create location
    const locRes = await request('POST', '/api/locations', {
      name: `TestLoc-${timestamp}`,
      is_private: false
    });
    testLocationId = locRes.body.id;

    // 1. POST item to location
    console.log('1. Testing POST /api/items/:id/locations');
    const moveRes = await request('POST', `/api/items/${testItemId}/locations`, {
      location_id: testLocationId
    });
    assert.strictEqual(moveRes.status, 201, `POST failed with status ${moveRes.status}`);
    assert.strictEqual(moveRes.body.item_id, testItemId, 'Wrong item ID');
    assert.strictEqual(moveRes.body.location_id, testLocationId, 'Wrong location ID');
    console.log('✓ Recorded item move to location\n');

    // 2. GET item history
    console.log('2. Testing GET /api/items/:id/locations');
    const historyRes = await request('GET', `/api/items/${testItemId}/locations`);
    assert.strictEqual(historyRes.status, 200, `GET failed with status ${historyRes.status}`);
    assert(Array.isArray(historyRes.body), 'Should return array');
    assert(historyRes.body.length > 0, 'Should have at least one history entry');
    assert.strictEqual(historyRes.body[0].item_id, testItemId, 'Wrong item in history');
    assert.strictEqual(historyRes.body[0].location_name, `TestLoc-${timestamp}`, 'Wrong location name in history');
    console.log('✓ Retrieved item location history\n');

    // 3. Move item to second location and verify history
    console.log('3. Testing multiple location history entries');
    const loc2Res = await request('POST', '/api/locations', {
      name: `TestLoc2-${timestamp}`,
      is_private: false
    });
    const location2Id = loc2Res.body.id;

    const move2Res = await request('POST', `/api/items/${testItemId}/locations`, {
      location_id: location2Id
    });
    assert.strictEqual(move2Res.status, 201, 'Second move failed');

    const history2Res = await request('GET', `/api/items/${testItemId}/locations`);
    assert.strictEqual(history2Res.body.length, 2, 'Should have 2 history entries');
    assert.strictEqual(history2Res.body[0].location_name, `TestLoc2-${timestamp}`, 'Most recent should be second location');
    console.log('✓ History shows multiple moves in reverse order\n');

    console.log('Item locations tests passed!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  console.error('Run via test suite');
  process.exit(1);
}

module.exports = { runItemLocationsTests };