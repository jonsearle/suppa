/**
 * Main Express server for Suppa backend
 * Runs on Netlify Functions
 *
 * Endpoints:
 * - POST /api/inventory - Add inventory items from user input
 * - GET /api/inventory - Get current active inventory
 * - POST /api/chat - Send chat message, get suggestions/responses
 * - POST /api/cooking/start - Mark recipe as cooking
 * - POST /api/cooking/complete - Mark cooking as complete, deduct ingredients
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import inventoryRouter from './api/inventory';
import chatRouter from './api/chat';
import cookingRouter from './api/cooking';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use('/api/inventory', inventoryRouter);
app.use('/api/chat', chatRouter);
app.use('/api/cooking', cookingRouter);

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

export default app;
