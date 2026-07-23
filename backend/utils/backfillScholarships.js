require('dotenv').config();
const connectDB = require('../config/db');
const Scholarship = require('../models/Scholarship');
const { applyScholarshipCredit } = require('../services/scholarshipService');

(async () => {
  await connectDB();
  const approved = await Scholarship.find({ status: 'approved' });
  for (const s of approved) await applyScholarshipCredit(s._id);
  console.log(`Backfilled ${approved.length} scholarship(s)`);
  process.exit(0);
})();