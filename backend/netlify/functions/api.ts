/**
 * Main Express server for Suppa backend
 * Runs on Netlify Functions
 */

import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
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
const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  try {
    return await new Promise((resolve, reject) => {
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
        resolved: false,
        
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        
        header(name: string, value: string) {
          this.headers[name] = value;
          return this;
        },
        
        json(data: any) {
          if (!this.resolved) {
            this.resolved = true;
            this.body = JSON.stringify(data);
            resolve({
              statusCode: this.statusCode,
              headers: this.headers,
              body: this.body,
            });
          }
        },
        
        send(data: any) {
          if (!this.resolved) {
            this.resolved = true;
            this.body = typeof data === 'string' ? data : JSON.stringify(data);
            resolve({
              statusCode: this.statusCode,
              headers: this.headers,
              body: this.body,
            });
          }
        },
        
        sendStatus(code: number) {
          if (!this.resolved) {
            this.resolved = true;
            this.statusCode = code;
            resolve({
              statusCode: this.statusCode,
              headers: this.headers,
              body: '',
            });
          }
        },
      };

      // Add Express-like methods
      Object.setPrototypeOf(mockReq, Object.getPrototypeOf({}));
      Object.setPrototypeOf(mockRes, Object.getPrototypeOf({}));

      // Set timeout to ensure we always resolve
      const timeout = setTimeout(() => {
        if (!mockRes.resolved) {
          mockRes.resolved = true;
          resolve({
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Request timeout' }),
          });
        }
      }, 10000);

      try {
        // Call the Express app
        app(mockReq, mockRes);
      } catch (appError) {
        clearTimeout(timeout);
        if (!mockRes.resolved) {
          mockRes.resolved = true;
          resolve({
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Internal server error',
              message: appError instanceof Error ? appError.message : String(appError),
            }),
          });
        }
      }
    });
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

export { handler };
export default handler;
