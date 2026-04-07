// Simple local development server for Suppa backend
// Runs Express app directly without Netlify wrapper

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import app from './netlify/functions/api.ts';

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
