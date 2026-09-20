const { runAuthTests } = require('./auth.test');
const { runCategoryTests } = require('./categories.test');
const { runItemTests } = require('./items.test');
const { runLocationTests } = require('./locations.test');
const { runItemLocationsTests } = require('./item-locations.test');

async function runAll() {
  try {
    const token = await runAuthTests();
    await runCategoryTests(token);
    await runItemTests(token);
    await runLocationTests(token);
    await runItemLocationsTests(token);
    console.log('\nAll test suites passed!');
    process.exit(0);
  } catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
  }
}

runAll();