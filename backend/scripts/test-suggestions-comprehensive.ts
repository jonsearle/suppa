/**
 * Comprehensive testing script for meal suggestion API
 *
 * Tests the suggestMeals function with diverse inventory sets to evaluate:
 * 1. Relevance of suggestions to available inventory
 * 2. Diversity of suggestions (no repeated meals)
 * 3. No hallucinated ingredients (only uses provided items)
 * 4. Quality of descriptions (menu-like and informative)
 * 5. Reasonable time estimates
 */

import { suggestMeals } from '../netlify/functions/api/utils/prompts';
import { InventoryItem } from '../netlify/functions/shared/types';

interface TestCase {
  name: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  inventory: InventoryItem[];
}

interface TestResult {
  testCase: string;
  passed: boolean;
  issues: string[];
  suggestions: any[];
}

// Test Case 1: Italian ingredients
const italianTest: TestCase = {
  name: 'Italian Ingredients',
  description: 'Chicken, tomatoes, basil, pasta',
  mealType: 'dinner',
  inventory: [
    {
      id: '1',
      user_id: 'test',
      name: 'chicken breast',
      canonical_name: 'chicken_breast',
      quantity_approx: 2,
      unit: 'pieces',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'test',
      name: 'tomatoes',
      canonical_name: 'tomato',
      quantity_approx: 3,
      unit: 'pieces',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: 'test',
      name: 'basil',
      canonical_name: 'basil',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '4',
      user_id: 'test',
      name: 'pasta',
      canonical_name: 'pasta',
      quantity_approx: 500,
      unit: 'g',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
  ],
};

// Test Case 2: Breakfast items
const breakfastTest: TestCase = {
  name: 'Breakfast Items',
  description: 'Eggs, bread, butter',
  mealType: 'breakfast',
  inventory: [
    {
      id: '5',
      user_id: 'test',
      name: 'eggs',
      canonical_name: 'egg',
      quantity_approx: 6,
      unit: 'pieces',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '6',
      user_id: 'test',
      name: 'bread',
      canonical_name: 'bread',
      quantity_approx: 1,
      unit: 'loaf',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '7',
      user_id: 'test',
      name: 'butter',
      canonical_name: 'butter',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
  ],
};

// Test Case 3: Asian ingredients
const asianTest: TestCase = {
  name: 'Asian Ingredients',
  description: 'Rice, soy sauce, chicken, garlic, vegetables',
  mealType: 'lunch',
  inventory: [
    {
      id: '8',
      user_id: 'test',
      name: 'rice',
      canonical_name: 'rice',
      quantity_approx: 500,
      unit: 'g',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '9',
      user_id: 'test',
      name: 'soy sauce',
      canonical_name: 'soy_sauce',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '10',
      user_id: 'test',
      name: 'chicken',
      canonical_name: 'chicken',
      quantity_approx: 300,
      unit: 'g',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '11',
      user_id: 'test',
      name: 'garlic',
      canonical_name: 'garlic',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '12',
      user_id: 'test',
      name: 'broccoli',
      canonical_name: 'broccoli',
      quantity_approx: 200,
      unit: 'g',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '13',
      user_id: 'test',
      name: 'carrots',
      canonical_name: 'carrot',
      quantity_approx: 2,
      unit: 'pieces',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
  ],
};

// Test Case 4: Limited inventory
const limitedTest: TestCase = {
  name: 'Limited Inventory',
  description: 'Just 2-3 items (eggs and bread)',
  mealType: 'breakfast',
  inventory: [
    {
      id: '14',
      user_id: 'test',
      name: 'eggs',
      canonical_name: 'egg',
      quantity_approx: 4,
      unit: 'pieces',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '15',
      user_id: 'test',
      name: 'bread',
      canonical_name: 'bread',
      quantity_approx: 1,
      unit: 'loaf',
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
  ],
};

// Test Case 5: Pantry staples only
const pantryTest: TestCase = {
  name: 'Pantry Staples Only',
  description: 'Salt, oil, spices (no fresh ingredients)',
  mealType: 'lunch',
  inventory: [
    {
      id: '16',
      user_id: 'test',
      name: 'salt',
      canonical_name: 'salt',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '17',
      user_id: 'test',
      name: 'oil',
      canonical_name: 'oil',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
    {
      id: '18',
      user_id: 'test',
      name: 'pepper',
      canonical_name: 'pepper',
      has_item: true,
      confidence: 'exact',
      date_added: new Date().toISOString(),
    },
  ],
};

/**
 * Validate test results against criteria
 */
function validateResult(testCase: TestCase, result: TestResult): TestResult {
  const suggestions = result.suggestions;
  const inventoryNames = new Set(
    testCase.inventory.flatMap((item) => [
      item.name.toLowerCase(),
      (item.canonical_name || item.name).toLowerCase(),
    ])
  );
  const inventoryStr = testCase.inventory.map((i) => i.name).join(', ');

  // Criterion 1: 3-5 suggestions returned
  if (suggestions.length < 3 || suggestions.length > 5) {
    result.issues.push(`Expected 3-5 suggestions, got ${suggestions.length}`);
    result.passed = false;
  }

  // Criterion 2: Check for diversity (no exact duplicates)
  const names = suggestions.map((s: any) => s.name.toLowerCase());
  const uniqueNames = new Set(names);
  if (uniqueNames.size < names.length) {
    result.issues.push(`Suggestions are not diverse: found duplicate meal names`);
    result.passed = false;
  }

  // Criterion 3: Check for hallucinated ingredients
  // Parse ingredients from descriptions (heuristic: look for mentions of common items)
  const commonHallucinations = ['olive oil', 'salt', 'pepper', 'garlic', 'onion', 'butter', 'cream'];
  const halluciantedItems: string[] = [];

  suggestions.forEach((suggestion: any) => {
    const text = `${suggestion.name} ${suggestion.description}`.toLowerCase();
    commonHallucinations.forEach((item) => {
      if (
        text.includes(item) &&
        !Array.from(inventoryNames).some((invItem) =>
          invItem.includes(item.split(' ')[0]) || item.includes(invItem)
        )
      ) {
        halluciantedItems.push(item);
      }
    });
  });

  if (halluciantedItems.length > 0) {
    result.issues.push(
      `Suggestions mention ingredients not in inventory: ${Array.from(new Set(halluciantedItems)).join(', ')}`
    );
    result.passed = false;
  }

  // Criterion 4: Check descriptions are informative
  suggestions.forEach((suggestion: any) => {
    if (!suggestion.description || suggestion.description.length < 10) {
      result.issues.push(`Suggestion "${suggestion.name}" has poor description`);
      result.passed = false;
    }
  });

  // Criterion 5: Check time estimates are reasonable
  suggestions.forEach((suggestion: any) => {
    const time = suggestion.time_estimate_mins;
    if (typeof time !== 'number' || time < 1 || time > 120) {
      result.issues.push(
        `Suggestion "${suggestion.name}" has unrealistic time estimate: ${time} mins`
      );
      result.passed = false;
    }
  });

  // Check meal type appropriateness
  if (testCase.mealType === 'breakfast') {
    suggestions.forEach((suggestion: any) => {
      if (suggestion.time_estimate_mins > 45) {
        result.issues.push(`Breakfast "${suggestion.name}" takes too long: ${suggestion.time_estimate_mins} mins`);
        result.passed = false;
      }
    });
  }

  return result;
}

/**
 * Run all test cases
 */
async function runTests() {
  console.log('\n========================================');
  console.log('MEAL SUGGESTION API - COMPREHENSIVE TESTS');
  console.log('========================================\n');

  const testCases = [italianTest, breakfastTest, asianTest, limitedTest, pantryTest];
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Meal Type: ${testCase.mealType}`);
    console.log(`Inventory: ${testCase.inventory.map((i) => i.name).join(', ')}`);

    try {
      const suggestions = await suggestMeals(testCase.inventory, testCase.mealType);

      const result: TestResult = {
        testCase: testCase.name,
        passed: true,
        issues: [],
        suggestions,
      };

      const validatedResult = validateResult(testCase, result);

      // Print results
      console.log(`\nResult: ${validatedResult.passed ? 'PASS' : 'FAIL'}`);
      if (validatedResult.issues.length > 0) {
        console.log('Issues:');
        validatedResult.issues.forEach((issue) => console.log(`  - ${issue}`));
      }

      console.log('\nSuggestions:');
      validatedResult.suggestions.forEach((s: any, i: number) => {
        console.log(`  ${i + 1}. ${s.name} (${s.time_estimate_mins} mins)`);
        console.log(`     ${s.description}`);
      });

      results.push(validatedResult);
    } catch (error) {
      console.log(`Result: FAIL`);
      console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
      results.push({
        testCase: testCase.name,
        passed: false,
        issues: [error instanceof Error ? error.message : String(error)],
        suggestions: [],
      });
    }

    console.log('\n----------------------------------------\n');
  }

  // Summary
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  results.forEach((result) => {
    const status = result.passed ? '✓' : '✗';
    console.log(`${status} ${result.testCase}`);
    if (result.issues.length > 0) {
      result.issues.forEach((issue) => console.log(`    ${issue}`));
    }
  });

  console.log('\n========================================\n');

  // Return exit code
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
