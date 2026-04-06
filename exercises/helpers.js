function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
  } catch (e) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${e.message}`);
  }
}

module.exports = { test };
