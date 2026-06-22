'use strict';
require('dotenv').config();
const app  = require('./api/index');
const PORT = process.env.PORT || 3002;  // Different port from HOST (3001)
app.listen(PORT, () => {
  console.log(`\n🎓 OmniPoll LEARN API running on http://localhost:${PORT}`);
  console.log(`   DB  : ${process.env.DATABASE_URL ? '✅ Connected' : '❌ DATABASE_URL missing'}`);
  console.log(`   Push: ${process.env.PUSHER_KEY   ? '✅ Configured' : '⚠️  Missing'}`);
});
