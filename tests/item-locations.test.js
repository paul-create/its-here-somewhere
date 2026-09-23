const { request, setToken, assert, trackItem } = require('./helpers');

async function runItemLocationsTests(authResult) {
  console.log('Starting item locations tests...\n');
  
  setToken(authResult.token);
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
    trackItem('categories', categoryId);

    // Setup: create location 1
    const locRes = await request('POST', '/api/locations', {
      name: `TestLoc-${timestamp}`,
      is_private: false
    });
    testLocationId = locRes.body.id;
    trackItem('locations', testLocationId);

    // Setup: create location 2
    const loc2Res = await request('POST', '/api/locations', {
      name: `TestLoc2-${timestamp}`,
      is_private: false
    });
    const location2Id = loc2Res.body.id;
    trackItem('locations', location2Id);

    // Setup: create item in location 1
    const itemRes = await request('POST', '/api/items', {
      name: 'Test Item',
      category_id: categoryId,
      location_id: testLocationId,
      quantity: 1
    });
    testItemId = itemRes.body.id;
    trackItem('items', testItemId);

    // 1. POST item to location 2
    console.log('1. Testing POST /api/items/:id/locations');
    const moveRes = await request('POST', `/api/items/${testItemId}/locations`, {
      location_id: location2Id
    });
    assert.strictEqual(moveRes.status, 201, `POST failed with status ${moveRes.status}`);
    assert.strictEqual(moveRes.body.item_id, testItemId, 'Wrong item ID');
    assert.strictEqual(moveRes.body.location_id, location2Id, 'Wrong location ID');
    console.log('✓ Recorded item move to location\n');

    // 2. GET item history
    console.log('2. Testing GET /api/items/:id/locations');
    const historyRes = await request('GET', `/api/items/${testItemId}/locations`);
    assert.strictEqual(historyRes.status, 200, `GET failed with status ${historyRes.status}`);
    assert(Array.isArray(historyRes.body), 'Should return array');
    assert(historyRes.body.length > 0, 'Should have at least one history entry');
    assert.strictEqual(historyRes.body[0].new_value, `TestLoc2-${timestamp}`, 'Wrong location name in history');
    console.log('✓ Retrieved item location history\n');

    // 3. Move item back to location 1 and verify history
    console.log('3. Testing multiple location history entries');
    const move2Res = await request('POST', `/api/items/${testItemId}/locations`, {
      location_id: testLocationId
    });
    assert.strictEqual(move2Res.status, 201, 'Second move failed');

    const history2Res = await request('GET', `/api/items/${testItemId}/locations`);
    const locationHistoryOnly = history2Res.body.filter(h => h.property === 'Location');
    assert.strictEqual(locationHistoryOnly.length, 3, 'Should have 3 location history entries');
    assert.strictEqual(locationHistoryOnly[0].new_value, `TestLoc-${timestamp}`, 'Most recent should be location 1');
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