/**
 * Simple Express server for local testing
 * Runs without Netlify wrapper to test PocketBase integration
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getInventory, addInventoryItem } from './netlify/functions/api/utils/db';
import { InventoryItem } from './shared/types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test GET inventory
app.get('/test/inventory', async (req, res) => {
  try {
    const items = await getInventory();
    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

// Test POST inventory
app.post('/test/inventory', async (req, res) => {
  try {
    const { name, quantity_approx, unit } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const item: Omit<InventoryItem, 'id' | 'user_id' | 'date_added' | 'date_used'> = {
      name,
      quantity_approx: quantity_approx || null,
      unit: unit || null,
      canonical_name: name.toLowerCase(),
      has_item: false,
      confidence: 'exact',
    };

    const result = await addInventoryItem(item);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Suppa Test Server running at http://localhost:${PORT}

📝 Test endpoints:
   GET  http://localhost:${PORT}/health
   GET  http://localhost:${PORT}/test/inventory
   POST http://localhost:${PORT}/test/inventory

🗄️  PocketBase connected to: ${process.env.POCKETBASE_URL}
👤 User ID: ${process.env.USER_ID}

Example POST body:
{
  "name": "3 tomatoes",
  "quantity_approx": 3,
  "unit": "pieces"
}
  `);
});
