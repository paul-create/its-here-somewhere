const { runAuthTests } = require('./auth.test');
const { runCategoryTests } = require('./categories.test');
const { runItemTests } = require('./items.test');
const { runLocationTests } = require('./locations.test');
const { runItemLocationsTests } = require('./item-locations.test');
const { runPhotoTests, runPhotoUploadTest } = require('./photos.test');

const tests = {
  auth: { fn: runAuthTests, requiresAuth: false },
  categories: { fn: runCategoryTests, requiresAuth: true },
  items: { fn: runItemTests, requiresAuth: true },
  locations: { fn: runLocationTests, requiresAuth: true },
  'item-locations': { fn: runItemLocationsTests, requiresAuth: true },
  photos: { fn: async (token) => {
    await runPhotoTests(token);
    await runPhotoUploadTest(token);
    }, requiresAuth: true },
};

async function runAll() {
  try {
    let selectedTests = process.argv.slice(2);
    
    if (selectedTests.length === 0) {
      selectedTests = Object.keys(tests);
    }

    let token = null;

    // If any selected test requires auth, run auth first
    const needsAuth = selectedTests.some(name => tests[name]?.requiresAuth);
    if (needsAuth && !selectedTests.includes('auth')) {
      token = await tests.auth.fn();
    }

    // Run selected tests
    for (const testName of selectedTests) {
      const test = tests[testName];
      if (!test) {
        console.error(`Unknown test: ${testName}`);
        continue;
      }

      if (test.requiresAuth && !token) {
        token = await test.fn();
      } else if (test.requiresAuth) {
        await test.fn(token);
      } else {
        await test.fn();
      }
    }

    console.log('\nSelected tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
  }
}

runAll();