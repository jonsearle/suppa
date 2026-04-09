// Simple local development server for Suppa backend
// Runs Express app directly without Netlify wrapper

import dotenv from 'dotenv';
import app from './netlify/functions/api.ts';

// Prefer local developer overrides, then fall back to .env when present.
dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Suppa backend running at http://localhost:${PORT}`);
  console.log(`   PocketBase URL: ${process.env.POCKETBASE_URL}`);
  console.log(`   User ID: ${process.env.USER_ID}`);
  console.log(`\n📝 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/inventory`);
  console.log(`   POST http://localhost:${PORT}/api/inventory`);
});
