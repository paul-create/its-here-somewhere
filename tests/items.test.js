const { request, setToken, assert, trackItem } = require('./helpers');

async function runItemTests(token) {
  console.log('Starting item tests...\n');
  
  setToken(token);
  const timestamp = Date.now();
  let testCategoryId = null;
  let testLocationId = null;
  let testItemId = null;

  try {
    // Create category first
    const catRes = await request('POST', '/api/categories', {
      name: `ItemCat-${timestamp}`,
      is_private: false
    });
    testCategoryId = catRes.body.id;
    trackItem('categories', testCategoryId);  // TRACK IT

    // Create location first
    const locRes = await request('POST', '/api/locations', {
      name: `ItemLoc-${timestamp}`,
      is_private: false
    });
    testLocationId = locRes.body.id;
    trackItem('locations', testLocationId);  // TRACK IT

    // 1. POST item
    console.log('1. Testing POST /api/items');
    const postRes = await request('POST', '/api/items', {
      name: 'Teapot',
      description: 'Blue ceramic',
      quantity: 2,
      category_id: testCategoryId,
      location_id: testLocationId
    });
    assert.strictEqual(postRes.status, 201, `POST failed with status ${postRes.status}`);
    assert.strictEqual(postRes.body.location_id, testLocationId, 'Location ID not returned');
    testItemId = postRes.body.id;
    trackItem('items', testItemId);  // TRACK IT
    console.log('✓ Created item with location\n');

    // 2. GET items
    console.log('2. Testing GET /api/items');
    const getRes = await request('GET', '/api/items');
    assert.strictEqual(getRes.status, 200, 'GET failed');
    assert(Array.isArray(getRes.body.items), 'Should return items array');
    assert(typeof getRes.body.totalPages === 'number', 'Should return totalPages');
    const createdItem = getRes.body.items.find(i => i.id === testItemId);
    assert(createdItem, 'Item not found in list');
    assert.strictEqual(createdItem.location_id, testLocationId, 'Location ID missing in list');
    console.log('✓ Retrieved items with location_id\n');

    // 3. GET single item
    console.log('3. Testing GET /api/items/:id');
    const getItemRes = await request('GET', `/api/items/${testItemId}`);
    assert.strictEqual(getItemRes.status, 200, 'GET item failed');
    assert.strictEqual(getItemRes.body.name, 'Teapot', 'Wrong item name');
    assert.strictEqual(getItemRes.body.location_id, testLocationId, 'Location ID missing');
    console.log('✓ Retrieved single item with location_id\n');

    // 4. PUT item
    console.log('4. Testing PUT /api/items/:id');
    const putRes = await request('PUT', `/api/items/${testItemId}`, {
      name: 'Teapot Updated',
      quantity: 3
    });
    assert.strictEqual(putRes.status, 200, 'PUT failed');
    assert.strictEqual(putRes.body.name, 'Teapot Updated', 'Name not updated');
    console.log('✓ Updated item\n');

    // 5. DELETE item
    console.log('5. Testing DELETE /api/items/:id');
    const deleteRes = await request('DELETE', `/api/items/${testItemId}`);
    assert.strictEqual(deleteRes.status, 200, 'DELETE failed');
    console.log('✓ Deleted item\n');

    console.log('Item tests passed!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  console.error('Run via test suite');
  process.exit(1);
}

module.exports = { runItemTests };