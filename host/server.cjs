'use strict';
/**
 * OmniPoll v3 — Local Development API Server
 * Run this alongside `npm run dev` to handle /api calls locally.
 *
 * Usage:
 *   npm run dev:api      (in one terminal)
 *   npm run dev          (in another terminal)
 *
 * Requires .env file with DATABASE_URL, JWT_SECRET, PUSHER_* vars.
 */

// Load .env
require('dotenv').config();

const app  = require('./api/index');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 OmniPoll API running on http://localhost:${PORT}`);
  console.log(`   DB  : ${process.env.DATABASE_URL ? '✅ Connected' : '❌ DATABASE_URL missing'}`);
  console.log(`   Push: ${process.env.PUSHER_KEY   ? '✅ Configured' : '⚠️  PUSHER_KEY missing (realtime disabled)'}`);
  console.log(`   JWT : ${process.env.JWT_SECRET    ? '✅ Set' : '⚠️  Using dev fallback'}\n`);
});
