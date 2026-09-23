const { randomUUID } = require('crypto');
const pool = require('../src/db');
const { request, setToken, assert, trackItem } = require('./helpers');

async function runSearchTests(authResult) {
  console.log('\n--- Search Tests ---');
  
  setToken(authResult.token);
  const homeId = authResult.homeId;
  const userId = authResult.userId;

  const timestamp = Date.now();

  try {
    // Create a category
    const categoryId = randomUUID();
    await pool.query(
      'INSERT INTO categories (id, home_id, name, created_by, is_private) VALUES ($1, $2, $3, $4, $5)',
      [categoryId, homeId, `Electronics-${timestamp}`, userId, false]
    );
    trackItem('categories', categoryId);

    // Create a public item (no location_id needed)
    const itemId = randomUUID();
    await pool.query(
      'INSERT INTO items (id, home_id, name, description, category_id, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [itemId, homeId, 'Laptop Computer', 'Dell XPS', categoryId, userId]
    );
    trackItem('items', itemId);

    // Test: Search items
    let res = await request('GET', '/api/search/items?q=laptop');
    assert.strictEqual(res.status, 200, 'Search failed');
    assert(res.body.length > 0, 'Should find laptop');
    assert.strictEqual(res.body[0].name, 'Laptop Computer', 'Wrong item returned');
    console.log('✓ Search items: found public items');

    // Test: Search empty query
    res = await request('GET', '/api/search/items?q=');
    assert.strictEqual(res.status, 400, 'Empty query should return 400');
    console.log('✓ Search items: empty query returns 400');

    // Test: Search missing query
    res = await request('GET', '/api/search/items');
    assert.strictEqual(res.status, 400, 'Missing query should return 400');
    console.log('✓ Search items: missing query returns 400');

    // Test: Search case insensitive
    res = await request('GET', '/api/search/items?q=LAPTOP');
    assert.strictEqual(res.status, 200, 'Case search failed');
    assert(res.body.length > 0, 'Should be case-insensitive');
    console.log('✓ Search items: case-insensitive');

    // Test: Search requires auth
    setToken(null);
    res = await request('GET', '/api/search/items?q=laptop');
    assert.strictEqual(res.status, 401, 'Should require auth');
    console.log('✓ Search items: requires auth');

    setToken(authResult.token);

    // Test: Search categories
    res = await request('GET', `/api/search/categories?q=electronics`);
    assert.strictEqual(res.status, 200, 'Category search failed');
    assert(res.body.length > 0, 'Should find category');
    console.log('✓ Search categories: found public categories');

    // Test: Search locations
    res = await request('GET', '/api/search/locations?q=testloc');
    assert.strictEqual(res.status, 200, 'Location search failed');
    assert(res.body.length > 0, 'Should find location');
    console.log('✓ Search locations: found public locations');

    console.log('✓ All search tests passed\n');
  } catch (err) {
    console.error('Search test failed:', err.message);
    throw err;
  }
}

module.exports = { runSearchTests };