require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { runAuthTests } = require('./auth.test');
const { runCategoryTests } = require('./categories.test');
const { runLocationTests } = require('./locations.test');
const { runItemTests } = require('./items.test');
const { runItemLocationsTests } = require('./item-locations.test');
const { runPhotoTests } = require('./photos.test');
const { runSearchTests } = require('./search.test');
const { cleanup } = require('./helpers');

const TESTS = [
  { name: 'Auth', fn: runAuthTests },
  { name: 'Categories', fn: runCategoryTests },
  { name: 'Locations', fn: runLocationTests },
  { name: 'Items', fn: runItemTests },
  { name: 'Item Locations', fn: runItemLocationsTests },
  { name: 'Photos', fn: runPhotoTests },
  { name: 'Search', fn: runSearchTests }
];

async function runAllTests() {
  const results = {
    passed: [],
    failed: [],
    startTime: Date.now()
  };

  console.log('===============================================');
  console.log('Running It\'s Here Somewhere Test Suite');
  console.log('===============================================\n');

  let authResult = null;

  for (const test of TESTS) {
    console.log(`\n>>> Running ${test.name} Tests <<<\n`);
    try {
      if (test.name === 'Auth') {
        // Auth returns { token, homeId }
        authResult = await test.fn();
        console.log('DEBUG in run-all.js: authResult after Auth =', authResult);
      } else {
        // All other tests use the token/homeId from auth
        await test.fn(authResult);
      }
      results.passed.push(test.name);
      console.log(`\n✓ ${test.name} tests completed\n`);
    } catch (err) {
      results.failed.push({ test: test.name, error: err.message });
      console.error(`\n✗ ${test.name} tests failed: ${err.message}\n`);
    }
  }

  // Cleanup after all tests
  console.log('\n\n===============================================');
  console.log('Cleanup Phase');
  console.log('===============================================');
  await cleanup();

  // Print summary
  console.log('\n\n===============================================');
  console.log('Test Results Summary');
  console.log('===============================================');
  console.log(`Total tests: ${TESTS.length}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.passed.length > 0) {
    console.log('\nPassed:');
    results.passed.forEach(name => console.log(`  ✓ ${name}`));
  }

  if (results.failed.length > 0) {
    console.log('\nFailed:');
    results.failed.forEach(({ test, error }) => console.log(`  ✗ ${test}: ${error}`));
  }

  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  console.log(`\nTotal time: ${duration}s`);
  console.log('===============================================\n');

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});