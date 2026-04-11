/**
 * Direct Express dev server - bypasses Netlify Functions routing
 * Runs on http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import inventoryRouter from './dist/functions/api/inventory.js';
import chatRouter from './dist/functions/api/chat.js';
import cookingRouter from './dist/functions/api/cooking.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use('/api/inventory', inventoryRouter);
app.use('/api/chat', chatRouter);
app.use('/api/cooking', cookingRouter);

// Error handling
app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`✓ Backend API running on http://localhost:${PORT}`);
});
