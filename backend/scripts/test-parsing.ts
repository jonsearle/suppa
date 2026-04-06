/**
 * Manual testing script for inventory parsing
 * Tests the LLM parsing on various real-world inventory inputs
 * Run with: ts-node backend/scripts/test-parsing.ts
 */

import 'dotenv/config';
import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';

// Test cases covering various real-world inventory input scenarios
const testCases = [
  // Test 1: Simple quantities with common kitchen items
  {
    input: '3 chicken breasts, 2 tomatoes, 1 bunch of basil',
    description: 'Simple items with clear quantities and units',
  },
  // Test 2: Approximate quantities
  {
    input: 'some rice, a bunch of spinach, a little garlic, handful of parmesan',
    description: 'Approximate quantities that need interpretation',
  },
  // Test 3: Metric measurements
  {
    input: '200g beef, 500ml milk, 100g butter, 2 tablespoons of salt',
    description: 'Metric and standard cooking measurements',
  },
  // Test 4: Complex ingredients with adjectives
  {
    input: 'fresh mozzarella, 3 medium carrots, 1 red onion, extra virgin olive oil',
    description: 'Items with adjectives and multiple variations',
  },
  // Test 5: Mixed casual and formal descriptions
  {
    input: 'a bunch of kale, 3 cups flour, pinch of cayenne, 1kg potatoes',
    description: 'Mix of casual cooking language and formal measurements',
  },
];

/**
 * Format parsed item for display
 */
function formatItem(item: any): string {
  const qty = item.quantity_approx
    ? `${item.quantity_approx}${item.unit ? ' ' + item.unit : ''}`
    : 'unspecified quantity';
  return `  - ${item.name}: ${qty}`;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('INVENTORY PARSING TEST SUITE');
  console.log('='.repeat(60));
  console.log();

  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    console.log();

    try {
      const result = await parseInventoryInput(testCase.input);

      console.log(`✓ Parsed successfully (${result.length} items):`);
      result.forEach((item) => console.log(formatItem(item)));

      // Basic validation: check that we got at least one item
      if (result.length > 0) {
        passCount++;
      } else {
        failCount++;
        console.log('⚠ Warning: No items parsed');
      }
    } catch (error) {
      failCount++;
      console.log(`✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log();
    console.log('-'.repeat(60));
    console.log();
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${passCount}/${testCases.length}`);
  console.log(`Failed: ${failCount}/${testCases.length}`);
  console.log(`Success Rate: ${Math.round((passCount / testCases.length) * 100)}%`);

  if (passCount === testCases.length) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠ Some tests failed. Review parsing results above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
