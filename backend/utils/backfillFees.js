require('dotenv').config();
const connectDB = require('../config/db');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');

(async () => {
  await connectDB();

  const structures = await FeeStructure.find({ isActive: true });
  console.log(`Found ${structures.length} active fee structure(s)`);

  let totalStudentsFixed = 0;
  let totalHeadsCreated = 0;

  for (const structure of structures) {
    const students = await Student.find({
      batch: structure.batch,
      branch: structure.branch,
      year: structure.year,
      role: 'student',
    });

    for (const student of students) {
      const existing = await FeePayment.find({
        studentId: student._id,
        feeStructureId: structure._id,
      });
      const existingHeads = new Set(existing.map((p) => p.feeHead));

      const missingHeads = structure.feeHeads.filter((h) => !existingHeads.has(h.name));
      if (missingHeads.length === 0) continue;

      await FeePayment.insertMany(
        missingHeads.map((h) => ({
          studentId: student._id,
          feeStructureId: structure._id,
          feeHead: h.name,
          semester: structure.semester,
          amountDue: h.amount,
          amountPaid: 0,
          status: 'pending',
        }))
      );

      totalStudentsFixed += 1;
      totalHeadsCreated += missingHeads.length;
      console.log(
        `Fixed ${student.enrollmentNo} (${student.name}) — added ${missingHeads.length} fee head(s) for semester ${structure.semester}`
      );
    }
  }

  console.log(
    `\nDone. ${totalStudentsFixed} student(s) fixed, ${totalHeadsCreated} fee head(s) created in total.`
  );
  process.exit(0);
})().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});