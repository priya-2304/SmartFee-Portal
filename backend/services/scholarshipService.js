const FeePayment = require('../models/FeePayment');
const Scholarship = require('../models/Scholarship');
const ALLOCATION_PRIORITY = ['Tuition Fee', 'Exam Fee', 'Library Fee', 'Bus Fee', 'Hostel Fee'];

const priorityIndex = (feeHead) => {
  const idx = ALLOCATION_PRIORITY.indexOf(feeHead);
  return idx === -1 ? ALLOCATION_PRIORITY.length : idx;
};

const applyScholarshipCredit = async (scholarshipId) => {
  const scholarship = await Scholarship.findById(scholarshipId);
  if (!scholarship || scholarship.status !== 'approved') return scholarship;

  let available = scholarship.amount - scholarship.appliedAmount;
  if (available <= 0) return scholarship;

  const feePayments = await FeePayment.find({
    studentId: scholarship.studentId,
    status: { $in: ['pending', 'partial'] },
  });

  feePayments.sort((a, b) => priorityIndex(a.feeHead) - priorityIndex(b.feeHead));

  for (const fp of feePayments) {
    if (available <= 0) break;

    const currentBalance = fp.amountDue - fp.amountPaid - fp.scholarshipApplied;
    if (currentBalance <= 0) continue;

    const allocate = Math.min(available, currentBalance);
    fp.scholarshipApplied += allocate;
    fp.status = fp.amountPaid + fp.scholarshipApplied >= fp.amountDue ? 'paid' : 'partial';
    await fp.save();

    scholarship.allocations.push({ feePaymentId: fp._id, amount: allocate });
    scholarship.appliedAmount += allocate;
    available -= allocate;
  }

  await scholarship.save();
  return scholarship;
};

const revokeScholarshipCredit = async (scholarshipId) => {
  const scholarship = await Scholarship.findById(scholarshipId);
  if (!scholarship || scholarship.allocations.length === 0) return scholarship;

  for (const alloc of scholarship.allocations) {
    const fp = await FeePayment.findById(alloc.feePaymentId);
    if (!fp) continue;
    fp.scholarshipApplied = Math.max(fp.scholarshipApplied - alloc.amount, 0);
    fp.status =
      fp.amountPaid >= fp.amountDue
        ? 'paid'
        : fp.amountPaid + fp.scholarshipApplied > 0
        ? 'partial'
        : 'pending';
    await fp.save();
  }

  scholarship.allocations = [];
  scholarship.appliedAmount = 0;
  await scholarship.save();
  return scholarship;
};

module.exports = { applyScholarshipCredit, revokeScholarshipCredit, ALLOCATION_PRIORITY };