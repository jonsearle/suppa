/**
 * Main Express server for Suppa backend
 * Runs on Netlify Functions
 */

import type { Handler } from '@netlify/functions';
import express, { Express, Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import inventoryRouter from './api/inventory';
import chatRouter from './api/chat';
import cookingRouter from './api/cooking';

const app: Express = express();

// Middleware
app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use('/api/inventory', inventoryRouter);
app.use('/api/chat', chatRouter);
app.use('/api/cooking', cookingRouter);

// 404 handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Netlify Functions handler
const handler: Handler = async (event, context) => {
  return new Promise((resolve) => {
    // Mock request/response objects that work with Express
    const mockReq: any = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : {},
      query: event.queryStringParameters || {},
    };

    const mockRes: any = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null,
      
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      
      header(name: string, value: string) {
        this.headers[name] = value;
        return this;
      },
      
      json(data: any) {
        this.body = JSON.stringify(data);
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
      
      send(data: any) {
        this.body = typeof data === 'string' ? data : JSON.stringify(data);
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
      
      sendStatus(code: number) {
        this.statusCode = code;
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: '',
        });
      },
    };

    // Add Express-like methods
    Object.setPrototypeOf(mockReq, Object.getPrototypeOf({}));
    Object.setPrototypeOf(mockRes, Object.getPrototypeOf({}));

    // Call the Express app
    app(mockReq, mockRes);

    // Fallback timeout
    setTimeout(() => {
      if (mockRes.body === null) {
        resolve({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Request timeout' }),
        });
      }
    }, 10000);
  });
};

export { handler };
export default handler;
