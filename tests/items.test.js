const { request, setToken, assert } = require('./helpers');

async function runItemTests(token) {
  console.log('Starting item tests...\n');
  
  setToken(token);
  const timestamp = Date.now();
  let testCategoryId = null;
  let testItemId = null;

  try {
    // Create category first
    const catRes = await request('POST', '/api/categories', {
      name: `ItemCat-${timestamp}`,
      is_private: false
    });
    testCategoryId = catRes.body.id;

    // 1. POST item
    console.log('1. Testing POST /api/items');
    const postRes = await request('POST', '/api/items', {
      name: 'Teapot',
      description: 'Blue ceramic',
      quantity: 2,
      category_id: testCategoryId
    });
    assert.strictEqual(postRes.status, 201, `POST failed with status ${postRes.status}`);
    testItemId = postRes.body.id;
    console.log('✓ Created item\n');

    // 2. GET items
    console.log('2. Testing GET /api/items');
    const getRes = await request('GET', '/api/items');
    assert.strictEqual(getRes.status, 200, 'GET failed');
    assert(Array.isArray(getRes.body), 'Should return array');
    console.log('✓ Retrieved items\n');

    // 3. GET single item
    console.log('3. Testing GET /api/items/:id');
    const getItemRes = await request('GET', `/api/items/${testItemId}`);
    assert.strictEqual(getItemRes.status, 200, 'GET item failed');
    assert.strictEqual(getItemRes.body.name, 'Teapot', 'Wrong item name');
    console.log('✓ Retrieved single item\n');

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