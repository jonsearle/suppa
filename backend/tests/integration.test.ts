describe('Unit Normalization Integration', () => {
  it('complete flow: add → suggest → adjust → deduct', async () => {
    // 1. Add inventory
    const addResponse = await fetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({ user_input: '500g flour, some milk, 3 eggs' })
    });
    const { data: inventory } = await addResponse.json();
    
    expect(inventory).toHaveLength(3);
    expect(inventory[0].confidence).toBe('exact');
    expect(inventory[1].confidence).toBe('approximate');

    // 2. Get recipes
    const suggestResponse = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ meal_type: 'breakfast' })
    });
    const { data: recipes } = await suggestResponse.json();
    
    expect(recipes.length).toBeGreaterThan(0);

    // 3. Start cooking
    const startResponse = await fetch('/api/cooking/start', {
      method: 'POST',
      body: JSON.stringify({
        recipe_name: recipes[0].name,
        recipe_description: recipes[0].description,
        recipe_time_mins: recipes[0].time_estimate_mins
      })
    });
    const { data: cookingSession } = await startResponse.json();
    
    expect(cookingSession.session_id).toBeDefined();

    // 4. Adjust recipe
    const adjustResponse = await fetch('/api/cooking/confirm-adjustments', {
      method: 'POST',
      body: JSON.stringify({
        session_id: cookingSession.session_id,
        adjustments: [
          { type: 'quantity', ingredient: 'flour', quantity: 300, unit: 'g', confidence: 'exact' }
        ]
      })
    });
    const { data: adjustedCooking } = await adjustResponse.json();
    
    expect(adjustedCooking.ingredients_to_deduct).toBeDefined();

    // 5. Complete cooking
    const completeResponse = await fetch('/api/cooking/complete', {
      method: 'POST',
      body: JSON.stringify({
        session_id: cookingSession.session_id,
        deduction_confirmed: true
      })
    });
    const { data: completed } = await completeResponse.json();
    
    expect(completed.deducted_items.length).toBeGreaterThan(0);

    // 6. Check inventory updated
    const inventoryResponse = await fetch('/api/inventory');
    const { data: updatedInventory } = await inventoryResponse.json();
    
    // Should have remainder items and marked used items
    expect(updatedInventory.length).toBeGreaterThanOrEqual(inventory.length);
  });
});
