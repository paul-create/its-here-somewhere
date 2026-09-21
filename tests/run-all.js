const { runAuthTests } = require('./auth.test');
const { runCategoryTests } = require('./categories.test');
const { runItemTests } = require('./items.test');
const { runLocationTests } = require('./locations.test');
const { runItemLocationsTests } = require('./item-locations.test');
const { runPhotoTests, runPhotoUploadTest } = require('./photos.test');
const { runSearchTests } = require('./search.test');
const { cleanup, resetTracker } = require('./helpers');

const tests = {
  auth: { fn: runAuthTests, requiresAuth: false },
  categories: { fn: runCategoryTests, requiresAuth: true },
  items: { fn: runItemTests, requiresAuth: true },
  locations: { fn: runLocationTests, requiresAuth: true },
  'item-locations': { fn: runItemLocationsTests, requiresAuth: true },
  photos: { 
    fn: async (token) => {
      try {
        await runPhotoTests(token);
        await runPhotoUploadTest(token);
      } finally {
        await cleanup();
      }
    }, 
    requiresAuth: true 
  },
  search: { fn: runSearchTests, requiresAuth: true },
};

async function runAll() {
  try {
    let selectedTests = process.argv.slice(2);
    
    if (selectedTests.length === 0) {
      selectedTests = Object.keys(tests);
    }

    let token = null;
    const startTime = Date.now();

    // If any selected test requires auth, run auth first
    const needsAuth = selectedTests.some(name => tests[name]?.requiresAuth);
    if (needsAuth && !selectedTests.includes('auth')) {
      console.log('\n--- Running Auth (required for other tests) ---\n');
      token = await tests.auth.fn();
      await cleanup();
      resetTracker();
    }

    // Run selected tests
    for (const testName of selectedTests) {
      const test = tests[testName];
      if (!test) {
        console.error(`Unknown test: ${testName}`);
        continue;
      }

      resetTracker();
      console.log(`\n--- Running ${testName} ---\n`);

      try {
        if (test.requiresAuth && !token) {
          token = await test.fn();
        } else if (test.requiresAuth) {
          await test.fn(token);
        } else {
          await test.fn();
        }
        
        // Cleanup after each test
        await cleanup();
      } catch (err) {
        console.error(`Test ${testName} failed:`, err.message);
        await cleanup();
        throw err;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✓ All tests passed in ${duration}s`);
    process.exit(0);
  } catch (err) {
    console.error('Tests failed:', err.message);
    process.exit(1);
  }
}

runAll();