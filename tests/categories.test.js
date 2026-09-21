const { request, setToken, assert, trackItem } = require('./helpers');

async function runCategoryTests(token) {
  console.log('Starting category tests...\n');
  
  setToken(token);
  const timestamp = Date.now();
  let testCategoryId = null;

  try {
    // 1. POST category (public)
    console.log('1. Testing POST /api/categories (public)');
    const postRes = await request('POST', '/api/categories', {
      name: `Storage-${timestamp}`,
      is_private: false
    });
    assert.strictEqual(postRes.status, 201, `POST failed with status ${postRes.status}`);
    testCategoryId = postRes.body.id;
    trackItem('categories', testCategoryId);  // TRACK IT
    console.log('✓ Created public category\n');

    // 2. POST category (private)
    console.log('2. Testing POST /api/categories (private)');
    const postPrivateRes = await request('POST', '/api/categories', {
      name: `Adult Toys-${timestamp}`,
      is_private: true
    });
    assert.strictEqual(postPrivateRes.status, 201, 'POST failed');
    trackItem('categories', postPrivateRes.body.id);  // TRACK IT
    console.log('✓ Created private category\n');

    // 3. GET categories
    console.log('3. Testing GET /api/categories');
    const getRes = await request('GET', '/api/categories');
    assert.strictEqual(getRes.status, 200, 'GET failed');
    assert(Array.isArray(getRes.body), 'Should return array');
    console.log('✓ Retrieved categories\n');

    // 4. PUT category
    console.log('4. Testing PUT /api/categories/:id');
    const putRes = await request('PUT', `/api/categories/${testCategoryId}`, {
      name: `Storage Updated-${timestamp}`,
      is_private: false
    });
    assert.strictEqual(putRes.status, 200, `PUT failed`);
    console.log('✓ Updated category\n');

    // 5. DELETE category (manual, don't track the deletion)
    console.log('5. Testing DELETE /api/categories/:id');
    const deleteCatRes = await request('POST', '/api/categories', {
      name: `Temp-${timestamp}`,
      is_private: false
    });
    const deleteCategoryId = deleteCatRes.body.id;
    const deleteRes = await request('DELETE', `/api/categories/${deleteCategoryId}`);
    assert.strictEqual(deleteRes.status, 200, 'DELETE failed');
    console.log('✓ Deleted category\n');

    console.log('Category tests passed!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  console.error('Run via test suite');
  process.exit(1);
}

module.exports = { runCategoryTests };