# Suppa Unit Normalization System

**Purpose**: Track ingredient quantities consistently across inventory → recipe → deduction flow.

**Principle**: Every ingredient normalizes to a **base unit** determined by its category. User input (cups, tbsp, grams, pieces) converts to that base unit for storage and comparison.

---

## **Base Unit Categories**

### **1. Dry Goods & Solids → Grams**
Flour, sugar, salt, spices, rice, pasta, nuts, chocolate, butter, oils (when measured by weight)

| Ingredient | Base Unit | Example Conversions |
|------------|-----------|-------------------|
| Flour | g | 1 cup ≈ 125g, 1 tbsp ≈ 8g |
| Sugar | g | 1 cup ≈ 200g, 1 tbsp ≈ 12.5g |
| Butter | g | 1 stick ≈ 113g, 1 tbsp ≈ 14g |
| Salt | g | 1 tsp ≈ 6g, 1 tbsp ≈ 18g |
| Cocoa powder | g | 1 tbsp ≈ 7g |
| Baking powder | g | 1 tsp ≈ 5g |

**Storage format**: `{ name: "flour", quantity: 500, unit: "g", confidence: "exact" }`

**Handling "some" or "a bit"**: If user says "some flour", LLM estimates → "≈300g" with confidence: "approximate"

---

### **2. Liquids → Milliliters**
Water, milk, oil, juice, vinegar, soy sauce, broth

| Ingredient | Base Unit | Example Conversions |
|------------|-----------|-------------------|
| Milk | ml | 1 cup ≈ 240ml, 1 tbsp ≈ 15ml |
| Oil | ml | 1 cup ≈ 240ml, 1 tbsp ≈ 15ml |
| Water | ml | 1 cup ≈ 240ml, 1 tsp ≈ 5ml |
| Vinegar | ml | 1 tbsp ≈ 15ml |
| Soy sauce | ml | 1 tbsp ≈ 15ml |
| Honey | ml | 1 tbsp ≈ 15ml |

**Storage format**: `{ name: "milk", quantity: 500, unit: "ml", confidence: "exact" }`

**Special case (oils)**: User might say "oil for cooking" → normalize to 250ml (reasonable cooking amount) with confidence: "approximate"

---

### **3. Countable Items → Pieces**
Eggs, garlic cloves, tomatoes, onions, chicken breasts, potatoes, lemons, mushrooms

| Ingredient | Base Unit | Notes |
|------------|-----------|-------|
| Eggs | pieces | "3 eggs" → 3 pieces |
| Chicken breast | pieces | "2 chicken breasts" → 2 pieces |
| Tomatoes | pieces | "3 tomatoes" → 3 pieces |
| Garlic | pieces (cloves) | "4 garlic cloves" → 4 pieces or 1 bulb ≈ 10 pieces |
| Onions | pieces | "1 onion" → 1 piece |
| Potatoes | pieces | "2 potatoes" → 2 pieces |
| Lemons | pieces | "1 lemon" → 1 piece |
| Mushrooms | pieces | "8 mushrooms" → 8 pieces |

**Storage format**: `{ name: "eggs", quantity: 3, unit: "pieces", confidence: "exact" }`

**Handling imprecision**: "some tomatoes" → "≈3 pieces" with confidence: "approximate"

---

### **4. Fresh Vegetables (by weight) → Grams**
When user specifies weight OR when "some broccoli" needs normalization

| Ingredient | Base Unit | Typical Serving |
|------------|-----------|--------|
| Broccoli | g | 1 head ≈ 500g |
| Spinach | g | 1 bag ≈ 300g |
| Bell pepper | g | 1 pepper ≈ 150g |
| Carrot | g | 1 carrot ≈ 60g |
| Lettuce | g | 1 head ≈ 300g |

**Storage format**: `{ name: "broccoli", quantity: 500, unit: "g", confidence: "approximate" }`

**Note**: If user says "2 bell peppers", keep as pieces (not grams) because that's how they think about it.

---

## **Normalization Rules**

### **Rule 1: Normalize on Inventory Add**

When `POST /api/inventory` receives `"2 cups flour, 3 eggs, 500ml milk"`:

```
Parse with LLM → [
  { name: "flour", raw_quantity: 2, raw_unit: "cups" },
  { name: "eggs", raw_quantity: 3, raw_unit: "pieces" },
  { name: "milk", raw_quantity: 500, raw_unit: "ml" }
]

Normalize each:
  flour: 2 cups → 250g (multiply by 125)
  eggs: 3 pieces → 3 pieces (already canonical)
  milk: 500ml → 500ml (already canonical)

Store:
  { name: "flour", quantity: 250, unit: "g", confidence: "exact" }
  { name: "eggs", quantity: 3, unit: "pieces", confidence: "exact" }
  { name: "milk", quantity: 500, unit: "ml", confidence: "exact" }
```

### **Rule 2: LLM Generates Recipes with Canonical Units**

Update `prompts.ts` ingredient generation to include unit constraints:

```
System prompt addition:
"When generating recipe ingredients, use ONLY these units:
- For dry goods/spices: grams (g)
- For liquids: milliliters (ml)
- For countable items: pieces
Do NOT use cups, tbsp, tsp, or other cooking units in the output."
```

Result:
```
Recipe now specifies: { name: "flour", quantity: 125, unit: "g" }
Not: { name: "flour", quantity: 1, unit: "cup" }
```

### **Rule 3: Deduction Matches by Unit Category**

Update `cooking.ts` ingredient matching (line 187):

```typescript
const inventoryItem = currentInventory.find(item => {
  // Match by name AND unit category
  return (
    item.name.toLowerCase() === ingredient.name.toLowerCase() &&
    getUnitCategory(item.unit) === getUnitCategory(ingredient.unit)
  );
});

if (!inventoryItem) throw new Error(...); // Ingredient not in inventory

// Now safe to compare quantities (both in canonical units)
if (inventoryItem.quantity < ingredient.quantity) {
  throw new Error(`Insufficient ${ingredient.name}: need ${ingredient.quantity}${ingredient.unit}, have ${inventoryItem.quantity}${inventoryItem.unit}`);
}
```

---

## **Conversion Tables**

### **Volume (to ml)**
```
1 cup = 240 ml
1 tbsp = 15 ml
1 tsp = 5 ml
1 fl oz = 30 ml
```

### **Weight (all already in grams)**
```
1 oz = 28g
1 lb = 454g
1 kg = 1000g
```

### **Common Dry Goods (to grams, assumes normal density)**
```
Flour: 1 cup = 125g, 1 tbsp = 8g
Sugar (granulated): 1 cup = 200g, 1 tbsp = 12.5g
Sugar (brown): 1 cup = 220g, 1 tbsp = 14g
Butter: 1 cup = 227g, 1 tbsp = 14g, 1 stick = 113g
Salt: 1 tsp = 6g, 1 tbsp = 18g
Rice: 1 cup = 185g
Pasta (dry): 1 cup = 140g
Cocoa powder: 1 tbsp = 7g
Baking powder: 1 tsp = 5g
Baking soda: 1 tsp = 5g
Cornstarch: 1 tbsp = 8g
```

---

## **Edge Cases & Decisions**

### **What if user adds "1 cup oil"?**
- Category: Liquid → base unit is ml
- Conversion: 1 cup ≈ 240ml
- Store: `{ name: "oil", quantity: 240, unit: "ml", confidence: "exact" }`

### **What if user adds "some garlic"?**
- Category: Countable → base unit is pieces (cloves)
- LLM estimates: "some garlic" ≈ 3 cloves
- Store: `{ name: "garlic", quantity: 3, unit: "pieces", confidence: "approximate" }`

### **What if user adds "2 tbsp peanut butter"?**
- PB is sticky (hybrid between solid & liquid)
- Choose category: Solids → base unit is grams
- Conversion: 1 tbsp PB ≈ 16g
- Store: `{ name: "peanut butter", quantity: 32, unit: "g", confidence: "exact" }`

### **What if recipe asks for "a pinch of salt" (no quantity)?**
- LLM interprets: "a pinch" ≈ 1g salt
- Store in recipe: `{ name: "salt", quantity: 1, unit: "g", confidence: "approximate" }`
- This can deduct from `{ name: "salt", quantity: 500, unit: "g" }`

### **What if inventory has "tomatoes" but recipe asks for "1 can of tomatoes"?**
- **This is a name mismatch, not a unit mismatch** → needs LLM matching improvement (Phase 1)
- For now, these are different ingredients (canned vs. fresh)

---

## **Implementation Checklist**

- [ ] Create `UnitConversion` utility module with:
  - [ ] `getUnitCategory(unit: string): 'weight' | 'volume' | 'count' | 'unknown'`
  - [ ] `normalizeToCanonical(quantity: number, fromUnit: string, ingredient: string): { quantity: number, unit: string, confidence: string }`
  - [ ] `areUnitsCompatible(unit1: string, unit2: string): boolean`
  
- [ ] Update `prompts.ts`:
  - [ ] Add unit normalization to `parseInventoryInput()` prompt
  - [ ] Add unit constraints to `suggestMeals()` and `generateRecipeDetail()` prompts
  
- [ ] Update `cooking.ts`:
  - [ ] Change ingredient matching (line 187) to include unit validation
  - [ ] Update error messages to show units
  
- [ ] Update frontend `CookingConfirm.tsx`:
  - [ ] Display quantities with units: "2g salt", "240ml milk"
  - [ ] Highlight when approximate quantities are being deducted
  
- [ ] Test scenarios:
  - [ ] Add "2 cups flour" → stored as 250g
  - [ ] Recipe asks for "100g flour" → matches against 250g inventory
  - [ ] Deduct 100g → remainder of 150g created as new item
  - [ ] Add "some oil" → estimated and stored as 250ml (approximate)
  - [ ] Recipe asks for "200ml oil" → matches, deducts from 250ml

---

## **Why This Works**

1. **Consistency**: Every ingredient type has one canonical unit throughout the system
2. **Flexibility**: Users can input any unit they want; it converts automatically
3. **Traceability**: `confidence` field flags approximations for UX warnings
4. **Deduction safety**: Only ingredients with compatible units can be matched
5. **Scalability**: Easy to add new ingredients—just assign them a category and base unit

