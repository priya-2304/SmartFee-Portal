const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');
const { generateChallanPdf } = require('../services/pdfService');
const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');

const FEE_HEAD_NAMES = ['Tuition Fee', 'Hostel Fee', 'Bus Fee', 'Exam Fee', 'Library Fee'];

const getStudentFees = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'student' && String(req.user._id) !== id) {
    return res.status(403).json({ success: false, message: 'Cannot view another student\'s fees' });
  }
  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const structure = await FeeStructure.findOne({
    batch: student.batch,
    branch: student.branch,
    year: student.year,
    isActive: true,
  });

  let payments = await FeePayment.find({ studentId: id }).sort({ createdAt: -1 });

  if (structure) {
    const existingForThisStructure = new Set(
      payments
        .filter((p) => String(p.feeStructureId) === String(structure._id))
        .map((p) => p.feeHead)
    );

    const missingHeads = structure.feeHeads.filter((h) => !existingForThisStructure.has(h.name));

    if (missingHeads.length > 0) {
      const created = await FeePayment.insertMany(
        missingHeads.map((h) => ({
          studentId: id,
          feeStructureId: structure._id,
          feeHead: h.name,
          semester: structure.semester,
          amountDue: h.amount,
          amountPaid: 0,
          status: 'pending',
        }))
      );
      payments = [...created, ...payments];
    }
  }

 const scholarships = await Scholarship.find({ studentId: id, status: 'approved' });
const scholarshipTotal = scholarships.reduce((sum, s) => sum + s.amount, 0);
const scholarshipApplied = payments.reduce((sum, p) => sum + (p.scholarshipApplied || 0), 0);
const totalFees = payments.reduce((sum, p) => sum + p.amountDue, 0);
const paidFees = payments.reduce((sum, p) => sum + p.amountPaid, 0);
const pendingFees = payments.reduce(
  (sum, p) => sum + Math.max(p.amountDue - p.amountPaid - (p.scholarshipApplied || 0), 0),
  0
);
res.json({
  success: true,
  summary: {
    totalFees,
    paidFees,
    pendingFees,
    scholarshipCredits: scholarshipTotal,
    scholarshipApplied,
    scholarshipRemaining: Math.max(scholarshipTotal - scholarshipApplied, 0),
    dueDate: structure ? structure.dueDate : null,
  },
  feeHeads: payments,
});
});
const createFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, structure });
});



  const downloadChallan = asyncHandler(async (req, res) => {
  const feePayment = await FeePayment.findById(req.params.feePaymentId);
  if (!feePayment) {
    return res.status(404).json({ success: false, message: 'Fee record not found' });
  }
  if (req.user.role === 'student' && String(feePayment.studentId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Cannot access another student's challan" });
  }
  const balance = feePayment.amountDue - feePayment.amountPaid - (feePayment.scholarshipApplied || 0);
  if (balance <= 0) {
    return res.status(400).json({ success: false, message: 'This fee head is already fully paid' });
  }

  const student = await Student.findById(feePayment.studentId);
  const structure = await FeeStructure.findById(feePayment.feeStructureId);
  const challanNo = `CHL-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const relativePath = await generateChallanPdf({
    student,
    feeHead: feePayment.feeHead,
    amount: balance,
    dueDate: structure?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    challanNo,
  });

  const filePath = path.join(__dirname, '..', relativePath);
  res.download(filePath, `${challanNo}.pdf`);
});


const updateFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findById(req.params.id);
  if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });

  Object.assign(structure, req.body);
  await structure.save();

  const existingPayments = await FeePayment.find({ feeStructureId: structure._id });
  const amountByHead = new Map(structure.feeHeads.map((h) => [h.name, h.amount]));

  for (const payment of existingPayments) {
    const newAmountDue = amountByHead.get(payment.feeHead);
    if (newAmountDue === undefined || newAmountDue === payment.amountDue) continue;

    payment.amountDue = newAmountDue;
    const settled = payment.amountPaid + payment.scholarshipApplied;
    payment.status = settled >= payment.amountDue ? 'paid' : payment.amountPaid > 0 ? 'partial' : 'pending';
    await payment.save();
  }

  res.json({ success: true, structure });
});

const deleteFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findByIdAndDelete(req.params.id);
  if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });

  // Without this, FeePayment records tied to this structure stay orphaned
  // and keep inflating Pending Dues / Defaulters on the dashboard.
  const orphanedPayments = await FeePayment.find({ feeStructureId: structure._id }).select('_id');
  const orphanedPaymentIds = orphanedPayments.map((p) => p._id);

  if (orphanedPaymentIds.length > 0) {
    await Transaction.deleteMany({
      $or: [
        { feePaymentId: { $in: orphanedPaymentIds } },
        { feePaymentIds: { $in: orphanedPaymentIds } },
      ],
    });
    await FeePayment.deleteMany({ feeStructureId: structure._id });
  }

  res.json({ success: true, message: 'Fee structure and related fee records deleted' });
});

const listFeeStructures = asyncHandler(async (req, res) => {
  const structures = await FeeStructure.find().sort({ createdAt: -1 });
  res.json({ success: true, structures });
});


const getFeeDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'student' && String(req.user._id) !== id) {
    return res.status(403).json({ success: false, message: "Cannot view another student's fees" });
  }

  const bySemester = await FeePayment.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(id) } },
    {
      $group: {
        _id: '$semester',
        totalFees: { $sum: '$amountDue' },
        paidFees: { $sum: '$amountPaid' },
        scholarshipApplied: { $sum: { $ifNull: ['$scholarshipApplied', 0] } },
        feeHeadCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        semester: '$_id',
        totalFees: 1,
        paidFees: 1,
        scholarshipApplied: 1,
        pendingFees: {
          $max: [
            { $subtract: ['$totalFees', { $add: ['$paidFees', '$scholarshipApplied'] }] },
            0,
          ],
        },
        feeHeadCount: 1,
      },
    },
    { $sort: { semester: 1 } },
  ]);

  const overall = bySemester.reduce(
    (acc, s) => ({
      totalFees: acc.totalFees + s.totalFees,
      paidFees: acc.paidFees + s.paidFees,
      pendingFees: acc.pendingFees + s.pendingFees,
      scholarshipApplied: acc.scholarshipApplied + s.scholarshipApplied,
    }),
    { totalFees: 0, paidFees: 0, pendingFees: 0, scholarshipApplied: 0 }
  );

  res.json({ success: true, overall, bySemester });
});

const uploadFeeStructureCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'CSV file is required' });
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  const errors = [];
  const groups = new Map();

  rows.forEach((row, i) => {
    const rowNum = i + 2; 

    const batch = row.batch?.trim();
    const branch = row.branch?.trim();
    const year = Number(row.year);
    const semester = Number(row.semester);
    const feeHead = row.feeHead?.trim();
    const amount = Number(row.amount);
    const dueDateRaw = row.dueDate?.trim();
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

    if (!batch || !branch || !row.year || !row.semester || !feeHead || !row.amount || !dueDateRaw) {
      errors.push({ row: rowNum, error: 'Missing required field(s): batch, branch, year, semester, feeHead, amount, dueDate' });
      return;
    }
    if (!FEE_HEAD_NAMES.includes(feeHead)) {
      errors.push({ row: rowNum, error: `feeHead must be one of: ${FEE_HEAD_NAMES.join(', ')}` });
      return;
    }
    if (Number.isNaN(year) || year < 1 || year > 5) {
      errors.push({ row: rowNum, error: 'year must be a number between 1 and 5' });
      return;
    }
    if (Number.isNaN(semester) || semester < 1 || semester > 8) {
      errors.push({ row: rowNum, error: 'semester must be a number between 1 and 8' });
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      errors.push({ row: rowNum, error: 'amount must be a non-negative number' });
      return;
    }
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      errors.push({ row: rowNum, error: 'dueDate is not a valid date' });
      return;
    }

    const key = `${batch}|${branch}|${year}|${semester}`;
    if (!groups.has(key)) {
      groups.set(key, { batch, branch, year, semester, dueDate, feeHeads: new Map() });
    }
    const group = groups.get(key);
    group.feeHeads.set(feeHead, amount); 
    if (dueDate > group.dueDate) group.dueDate = dueDate; 
  });

  let structuresCreated = 0;
  let structuresUpdated = 0;

  for (const group of groups.values()) {
    const feeHeads = Array.from(group.feeHeads, ([name, headAmount]) => ({ name, amount: headAmount }));

    const existing = await FeeStructure.findOne({
      batch: group.batch,
      branch: group.branch,
      year: group.year,
      semester: group.semester,
      isActive: true,
    });

    if (existing) {
      existing.feeHeads = feeHeads;
      existing.dueDate = group.dueDate;
      await existing.save();
      structuresUpdated += 1;
    } else {
      await FeeStructure.create({
        batch: group.batch,
        branch: group.branch,
        year: group.year,
        semester: group.semester,
        feeHeads,
        dueDate: group.dueDate,
        isActive: true,
        createdBy: req.user._id,
      });
      structuresCreated += 1;
    }
  }

  fs.unlink(req.file.path, () => {});

  res.json({
    success: true,
    totalRows: rows.length,
    batchesProcessed: groups.size,
    structuresCreated,
    structuresUpdated,
    errors,
  });
});

const addIndividualFee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { semester, feeHeads } = req.body;

  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const created = await FeePayment.insertMany(
    feeHeads.map((h) => ({
      studentId: id,
      semester,
      feeHead: h.name,
      amountDue: h.amount,
      amountPaid: 0,
      status: 'pending',
    }))
  );

  res.status(201).json({ success: true, feeHeads: created });
});

module.exports = {
  getStudentFees,
  getFeeDashboard,  
  createFeeStructure,
  addIndividualFee, 
  updateFeeStructure,
  deleteFeeStructure,
  listFeeStructures,
  downloadChallan,
  uploadFeeStructureCsv,
};