import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';
import { getCanonicalUnit } from '../netlify/functions/api/utils/units';

describe('parseInventoryInput - Canonical Unit Caching', () => {
  beforeEach(() => {
    // Clear cache before each test
    jest.clearAllMocks();
  });

  test('should cache canonical unit when parsing inventory', async () => {
    const input = '500g rice';
    await parseInventoryInput(input);

    // After parsing, canonical unit for rice should be cached
    const cachedUnit = getCanonicalUnit('rice');
    expect(cachedUnit).toBe('g');
  });

  test('should cache unit for different ingredient types', async () => {
    await parseInventoryInput('240ml milk');
    expect(getCanonicalUnit('milk')).toBe('ml');

    await parseInventoryInput('3 eggs');
    expect(getCanonicalUnit('eggs')).toBe('pieces');
  });
});
