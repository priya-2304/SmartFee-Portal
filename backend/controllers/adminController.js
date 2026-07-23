// const fs = require('fs');
// const csv = require('csv-parser');
// const Student = require('../models/Student');
// const FeePayment = require('../models/FeePayment');
// const Transaction = require('../models/Transaction');
// const Scholarship = require('../models/Scholarship');
// const { asyncHandler } = require('../middleware/errorHandler');
// const { applyScholarshipCredit, revokeScholarshipCredit } = require('../services/scholarshipService');
// const Notification = require('../models/Notification');


// const getSummary = asyncHandler(async (req, res) => {
//   const startOfToday = new Date();
//   startOfToday.setHours(0, 0, 0, 0);
//   const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

//   let studentIdFilter = null;
//   if (req.user.role === 'hod') {
//     const deptStudents = await Student.find({ branch: req.user.department, role: 'student' }).select('_id');
//     studentIdFilter = deptStudents.map((s) => s._id);
//   }
//   const studentMatch = studentIdFilter ? { studentId: { $in: studentIdFilter } } : {};

//   const [todayAgg] = await Transaction.aggregate([
//     { $match: { status: 'success', createdAt: { $gte: startOfToday }, ...studentMatch } },
//     { $group: { _id: null, total: { $sum: '$amount' } } },
//   ]);

//   const [monthAgg] = await Transaction.aggregate([
//     { $match: { status: 'success', createdAt: { $gte: startOfMonth }, ...studentMatch } },
//     { $group: { _id: null, total: { $sum: '$amount' } } },
//   ]);

//   const [pendingAgg] = await FeePayment.aggregate([
//     { $match: studentMatch },
//     {
//       $group: {
//         _id: null,
//         due: { $sum: '$amountDue' },
//         paid: { $sum: '$amountPaid' },
//         scholarship: { $sum: { $ifNull: ['$scholarshipApplied', 0] } },
//       },
//     },
//   ]);

//   const defaulterCount = await FeePayment.aggregate([
//     { $match: { status: { $in: ['pending', 'partial'] }, ...studentMatch } },
//     { $group: { _id: '$studentId' } },
//     { $count: 'count' },
//   ]);

//   const totalTransactions = await Transaction.countDocuments({ status: 'success', ...studentMatch });

//   const sixMonthsAgo = new Date();
//   sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
//   sixMonthsAgo.setDate(1);

//   const monthlyRevenue = await Transaction.aggregate([
//     { $match: { status: 'success', createdAt: { $gte: sixMonthsAgo }, ...studentMatch } },
//     {
//       $group: {
//         _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
//         total: { $sum: '$amount' },
//       },
//     },
//     { $sort: { '_id.year': 1, '_id.month': 1 } },
//   ]);

//   // Collection split by fee head (for a doughnut/pie chart)
//   const feeHeadBreakdown = await FeePayment.aggregate([
//     { $match: { amountPaid: { $gt: 0 }, ...studentMatch } },
//     { $group: { _id: '$feeHead', total: { $sum: '$amountPaid' } } },
//     { $sort: { total: -1 } },
//   ]);

//   // Defaulter count per branch (for a department-wise bar chart) — for HOD this will
//   // naturally only ever show their own branch, since studentMatch already restricts it.
//   const defaultersByBranch = await FeePayment.aggregate([
//     { $match: { status: { $in: ['pending', 'partial'] }, ...studentMatch } },
//     { $group: { _id: '$studentId' } },
//     {
//       $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
//     },
//     { $unwind: '$student' },
//     { $group: { _id: '$student.branch', count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//   ]);

//   res.json({
//     success: true,
//     summary: {
//       collectionToday: todayAgg?.total || 0,
//       collectionThisMonth: monthAgg?.total || 0,
//       pendingDues: pendingAgg
//         ? Math.max(pendingAgg.due - pendingAgg.paid - pendingAgg.scholarship, 0)
//         : 0,
//       defaulterCount: defaulterCount[0]?.count || 0,
//       totalTransactions,
//       monthlyRevenue,
//       feeHeadBreakdown,
//       defaultersByBranch,
//     },
//   });
// });

// const getDefaulters = asyncHandler(async (req, res) => {
//   const { branch } = req.query;
//   const effectiveBranch = req.user.role === 'hod' ? req.user.department : branch;

//   const pipeline = [
//     { $match: { status: { $in: ['pending', 'partial'] } } },
//     {
//       $group: {
//         _id: '$studentId',
//         pendingAmount: {
//           $sum: {
//             $subtract: [
//               { $subtract: ['$amountDue', '$amountPaid'] },
//               { $ifNull: ['$scholarshipApplied', 0] },
//             ],
//           },
//         },
//       },
//     },
//     { $match: { pendingAmount: { $gt: 0 } } },
//     {
//       $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
//     },
//     { $unwind: '$student' },
//   ];

//   if (effectiveBranch) {
//     pipeline.push({ $match: { 'student.branch': effectiveBranch } });
//   }

//   pipeline.push({
//     $project: {
//       _id: 0,
//       studentId: '$_id',
//       name: '$student.name',
//       enrollmentNo: '$student.enrollmentNo',
//       branch: '$student.branch',
//       email: '$student.email',
//       pendingAmount: 1,
//     },
//   });

//   const defaulters = await FeePayment.aggregate(pipeline);
//   res.json({ success: true, defaulters });
// });

// const applyScholarship = asyncHandler(async (req, res) => {
//   const { studentId, amount, type, reason } = req.body;
//   const targetStudent = req.user.role === 'student' ? req.user._id : studentId;
//   const scholarship = await Scholarship.create({ studentId: targetStudent, amount, type, reason });

//   const applicantName = req.user.role === 'student' ? req.user.name : (await Student.findById(targetStudent))?.name || 'A student';
//   await Notification.create({
//     recipientRole: 'admin',
//     type: 'scholarship_applied',
//     message: `${applicantName} applied for a ${type} scholarship of Rs. ${amount}.`,
//   });
//   res.status(201).json({ success: true, scholarship });
// });

// const approveScholarship = asyncHandler(async (req, res) => {
//   const { status } = req.body;
//   const scholarship = await Scholarship.findByIdAndUpdate(
//     req.params.id,
//     { status, approvedBy: req.user._id, approvedAt: new Date() },
//     { new: true }
//   );
//   if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found' });

//   if (status === 'approved') {
//     await applyScholarshipCredit(scholarship._id);
//   } else if (status === 'rejected') {
//     await revokeScholarshipCredit(scholarship._id);
//   }
//   const updated = await Scholarship.findById(scholarship._id);
//   res.json({ success: true, scholarship: updated });
// });

// const getAllStudents = asyncHandler(async (req, res) => {
//   const { search } = req.query;
//   const filter = { role: { $nin: ['admin', 'hod'] } };

//   if (req.user.role === 'hod') {
//     filter.branch = req.user.department;
//   }
//   if (search) {
//     const regex = new RegExp(search, 'i');
//     filter.$or = [
//       { name: regex },
//       { enrollmentNo: regex },
//       { email: regex },
//       { branch: regex },
//     ];
//   }
//   const students = await Student.find(filter).select('-password').sort({ name: 1 });
//   const pendingAgg = await FeePayment.aggregate([
//     { $match: { status: { $in: ['pending', 'partial'] } } },
//     { $group: { _id: '$studentId', pending: { $sum: { $subtract: ['$amountDue', '$amountPaid'] } } } },
//   ]);
//   const pendingMap = Object.fromEntries(pendingAgg.map((p) => [String(p._id), p.pending]));

//   const result = students.map((s) => ({
//     _id: s._id,
//     name: s.name,
//     enrollmentNo: s.enrollmentNo,
//     email: s.email,
//     phone: s.phone,
//     branch: s.branch,
//     year: s.year,
//     batch: s.batch,
//     isActive: s.isActive,
//     pendingAmount: pendingMap[String(s._id)] || 0,
//   }));

//   res.json({ success: true, students: result });
// });


// const listScholarships = asyncHandler(async (req, res) => {
//   const filter = {};
//   if (req.user.role === 'student') {
//     filter.studentId = req.user._id;
//   } else if (req.user.role === 'hod') {
//     if (req.query.studentId) {
//       // Make sure the requested student actually belongs to this HOD's department
//       // before narrowing the filter — don't just trust the query param blindly.
//       const target = await Student.findById(req.query.studentId).select('branch');
//       if (!target || target.branch !== req.user.department) {
//         return res.status(403).json({ success: false, message: 'Cannot view scholarships outside your department' });
//       }
//       filter.studentId = req.query.studentId;
//     } else {
//       const deptStudents = await Student.find({ branch: req.user.department }).select('_id');
//       filter.studentId = { $in: deptStudents.map((s) => s._id) };
//     }
//     if (req.query.status) filter.status = req.query.status;
//   } else {
//     if (req.query.status) filter.status = req.query.status;
//     if (req.query.studentId) filter.studentId = req.query.studentId;
//   }
//   const scholarships = await Scholarship.find(filter)
//     .sort({ createdAt: -1 })
//     .populate('studentId', 'name enrollmentNo');
//   res.json({ success: true, scholarships });
// });


// const createStaff = asyncHandler(async (req, res) => {
//   const { name, enrollmentNo, email, phone, password, role, department } = req.body;
//   if (!['admin', 'hod'].includes(role)) {
//     return res.status(400).json({ success: false, message: "role must be 'admin' or 'hod'" });
//   }
//   if (role === 'hod' && !department) {
//     return res.status(400).json({ success: false, message: 'department is required for hod' });
//   }
//   const staff = await Student.create({
//     name, enrollmentNo, email, phone, password, role,
//     department: department || 'Administration',
//     branch: department || 'Administration',
//     year: 1,
//     batch: 'N/A',
//   });
//   res.status(201).json({
//     success: true,
//     staff: { id: staff._id, name: staff.name, role: staff.role, department: staff.department },
//   });
// });

// const searchStudents = asyncHandler(async (req, res) => {
//   const { q } = req.query;
//   if (!q || q.trim().length < 2) return res.json({ success: true, students: [] });

//   const regex = new RegExp(q.trim(), 'i');
//   const filter = {
//     role: 'student',
//     $or: [{ enrollmentNo: regex }, { name: regex }, { email: regex }],
//   };
//   if (req.user.role === 'hod') {
//     filter.branch = req.user.department;
//   }
//   const students = await Student.find(filter).select('name enrollmentNo email branch year batch').limit(10);
//   res.json({ success: true, students });
// });


// const uploadCsv = asyncHandler(async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ success: false, message: 'CSV file is required' });
//   }
//   const rows = [];
//   await new Promise((resolve, reject) => {
//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on('data', (row) => rows.push(row))
//       .on('end', resolve)
//       .on('error', reject);
//   });

//   let created = 0;
//   const errors = [];

//   for (let i = 0; i < rows.length; i++) {
//     const row = rows[i];
//     const rowNum = i + 2; 
//     try {
//       const { enrollmentNo, name, email, phone, branch, year, batch, password } = row;
//       if (!enrollmentNo || !name || !email || !branch || !year || !batch || !password) {
//         errors.push({ row: rowNum, error: 'Missing required field(s)' });
//         continue;
//       }
//       const exists = await Student.findOne({ $or: [{ enrollmentNo }, { email }] });
//       if (exists) {
//         errors.push({ row: rowNum, error: `Student with enrollmentNo/email already exists` });
//         continue;
//       }
//       await Student.create({
//         enrollmentNo, name, email, phone, branch,
//         year: Number(year), batch, password, role: 'student',
//       });
//       created++;
//     } catch (err) {
//       errors.push({ row: rowNum, error: err.message });
//     }}
//   fs.unlink(req.file.path, () => {});

//   res.json({ success: true, totalRows: rows.length, created, errors });
// });


// module.exports = {
//   getSummary,
//   getDefaulters,
//   applyScholarship,
//   approveScholarship,
//   listScholarships,
//   getAllStudents,
//   createStaff,
//   searchStudents,
//   uploadCsv,
// };


const fs = require('fs');
const csv = require('csv-parser');
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Transaction = require('../models/Transaction');
const Scholarship = require('../models/Scholarship');
const { asyncHandler } = require('../middleware/errorHandler');
const { applyScholarshipCredit, revokeScholarshipCredit } = require('../services/scholarshipService');
const Notification = require('../models/Notification');


const getSummary = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  let studentIdFilter = null;
  if (req.user.role === 'hod') {
    const deptStudents = await Student.find({ branch: req.user.department, role: 'student' }).select('_id');
    studentIdFilter = deptStudents.map((s) => s._id);
  }
  const studentMatch = studentIdFilter ? { studentId: { $in: studentIdFilter } } : {};

  const [todayAgg] = await Transaction.aggregate([
    { $match: { status: 'success', createdAt: { $gte: startOfToday }, ...studentMatch } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const [monthAgg] = await Transaction.aggregate([
    { $match: { status: 'success', createdAt: { $gte: startOfMonth }, ...studentMatch } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const [pendingAgg] = await FeePayment.aggregate([
    { $match: studentMatch },
    {
      $group: {
        _id: null,
        due: { $sum: '$amountDue' },
        paid: { $sum: '$amountPaid' },
        scholarship: { $sum: { $ifNull: ['$scholarshipApplied', 0] } },
      },
    },
  ]);

  const defaulterCount = await FeePayment.aggregate([
    { $match: { status: { $in: ['pending', 'partial'] }, ...studentMatch } },
    { $group: { _id: '$studentId' } },
    { $count: 'count' },
  ]);

  const totalTransactions = await Transaction.countDocuments({ status: 'success', ...studentMatch });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyRevenue = await Transaction.aggregate([
    { $match: { status: 'success', createdAt: { $gte: sixMonthsAgo }, ...studentMatch } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Collection split by fee head (for a doughnut/pie chart)
  const feeHeadBreakdown = await FeePayment.aggregate([
    { $match: { amountPaid: { $gt: 0 }, ...studentMatch } },
    { $group: { _id: '$feeHead', total: { $sum: '$amountPaid' } } },
    { $sort: { total: -1 } },
  ]);

  // Defaulter count per branch (for a department-wise bar chart) — for HOD this will
  // naturally only ever show their own branch, since studentMatch already restricts it.
  const defaultersByBranch = await FeePayment.aggregate([
    { $match: { status: { $in: ['pending', 'partial'] }, ...studentMatch } },
    { $group: { _id: '$studentId' } },
    {
      $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
    },
    { $unwind: '$student' },
    { $group: { _id: '$student.branch', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    summary: {
      collectionToday: todayAgg?.total || 0,
      collectionThisMonth: monthAgg?.total || 0,
      pendingDues: pendingAgg
        ? Math.max(pendingAgg.due - pendingAgg.paid - pendingAgg.scholarship, 0)
        : 0,
      defaulterCount: defaulterCount[0]?.count || 0,
      totalTransactions,
      monthlyRevenue,
      feeHeadBreakdown,
      defaultersByBranch,
    },
  });
});

const getDefaulters = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const effectiveBranch = req.user.role === 'hod' ? req.user.department : branch;

  const pipeline = [
    { $match: { status: { $in: ['pending', 'partial'] } } },
    {
      $group: {
        _id: '$studentId',
        pendingAmount: {
          $sum: {
            $subtract: [
              { $subtract: ['$amountDue', '$amountPaid'] },
              { $ifNull: ['$scholarshipApplied', 0] },
            ],
          },
        },
      },
    },
    { $match: { pendingAmount: { $gt: 0 } } },
    {
      $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
    },
    { $unwind: '$student' },
  ];

  if (effectiveBranch) {
    pipeline.push({ $match: { 'student.branch': effectiveBranch } });
  }

  pipeline.push({
    $project: {
      _id: 0,
      studentId: '$_id',
      name: '$student.name',
      enrollmentNo: '$student.enrollmentNo',
      branch: '$student.branch',
      email: '$student.email',
      pendingAmount: 1,
    },
  });

  const defaulters = await FeePayment.aggregate(pipeline);
  res.json({ success: true, defaulters });
});

const applyScholarship = asyncHandler(async (req, res) => {
  const { studentId, amount, type, reason } = req.body;
  const targetStudent = req.user.role === 'student' ? req.user._id : studentId;
  const scholarship = await Scholarship.create({ studentId: targetStudent, amount, type, reason });

  const applicantName = req.user.role === 'student' ? req.user.name : (await Student.findById(targetStudent))?.name || 'A student';
  await Notification.create({
    recipientRole: 'admin',
    type: 'scholarship_applied',
    message: `${applicantName} applied for a ${type} scholarship of Rs. ${amount}.`,
  });
  res.status(201).json({ success: true, scholarship });
});

const approveScholarship = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const scholarship = await Scholarship.findByIdAndUpdate(
    req.params.id,
    { status, approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found' });

  if (status === 'approved') {
    await applyScholarshipCredit(scholarship._id);
  } else if (status === 'rejected') {
    await revokeScholarshipCredit(scholarship._id);
  }
  const updated = await Scholarship.findById(scholarship._id);
  res.json({ success: true, scholarship: updated });
});

const getAllStudents = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { role: { $nin: ['admin', 'hod'] } };

  if (req.user.role === 'hod') {
    filter.branch = req.user.department;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { name: regex },
      { enrollmentNo: regex },
      { email: regex },
      { branch: regex },
    ];
  }
  const students = await Student.find(filter).select('-password').sort({ name: 1 });
  const pendingAgg = await FeePayment.aggregate([
    { $match: { status: { $in: ['pending', 'partial'] } } },
    { $group: { _id: '$studentId', pending: { $sum: { $subtract: ['$amountDue', '$amountPaid'] } } } },
  ]);
  const pendingMap = Object.fromEntries(pendingAgg.map((p) => [String(p._id), p.pending]));

  const result = students.map((s) => ({
    _id: s._id,
    name: s.name,
    enrollmentNo: s.enrollmentNo,
    email: s.email,
    phone: s.phone,
    branch: s.branch,
    year: s.year,
    batch: s.batch,
    isActive: s.isActive,
    pendingAmount: pendingMap[String(s._id)] || 0,
  }));

  res.json({ success: true, students: result });
});


const listScholarships = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') {
    filter.studentId = req.user._id;
  } else if (req.user.role === 'hod') {
    if (req.query.studentId) {
      // Make sure the requested student actually belongs to this HOD's department
      // before narrowing the filter — don't just trust the query param blindly.
      const target = await Student.findById(req.query.studentId).select('branch');
      if (!target || target.branch !== req.user.department) {
        return res.status(403).json({ success: false, message: 'Cannot view scholarships outside your department' });
      }
      filter.studentId = req.query.studentId;
    } else {
      const deptStudents = await Student.find({ branch: req.user.department }).select('_id');
      filter.studentId = { $in: deptStudents.map((s) => s._id) };
    }
    if (req.query.status) filter.status = req.query.status;
  } else {
    if (req.query.status) filter.status = req.query.status;
    if (req.query.studentId) filter.studentId = req.query.studentId;
  }
  const scholarships = await Scholarship.find(filter)
    .sort({ createdAt: -1 })
    .populate('studentId', 'name enrollmentNo');
  res.json({ success: true, scholarships });
});


const createStaff = asyncHandler(async (req, res) => {
  const { name, enrollmentNo, email, phone, password, role, department } = req.body;
  if (!['admin', 'hod'].includes(role)) {
    return res.status(400).json({ success: false, message: "role must be 'admin' or 'hod'" });
  }
  if (role === 'hod' && !department) {
    return res.status(400).json({ success: false, message: 'department is required for hod' });
  }
  const staff = await Student.create({
    name, enrollmentNo, email, phone, password, role,
    department: department || 'Administration',
    branch: department || 'Administration',
    year: 1,
    batch: 'N/A',
  });
  res.status(201).json({
    success: true,
    staff: { id: staff._id, name: staff.name, role: staff.role, department: staff.department },
  });
});

const searchStudents = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ success: true, students: [] });

  const regex = new RegExp(q.trim(), 'i');
  const filter = {
    role: 'student',
    $or: [{ enrollmentNo: regex }, { name: regex }, { email: regex }],
  };
  if (req.user.role === 'hod') {
    filter.branch = req.user.department;
  }
  const students = await Student.find(filter).select('name enrollmentNo email branch year batch').limit(10);
  res.json({ success: true, students });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  if (student.role !== 'student') {
    return res.status(400).json({ success: false, message: 'Only student accounts can be deleted from here' });
  }

  // Cascade delete everything tied to this student so dashboard stats
  // (Pending Dues, Defaulters, Transactions) stay accurate automatically —
  // no more manual Mongo cleanup needed.
  await FeePayment.deleteMany({ studentId: id });
  await Transaction.deleteMany({ studentId: id });
  await Scholarship.deleteMany({ studentId: id });
  await Notification.deleteMany({ studentId: id });
  await Student.findByIdAndDelete(id);

  res.json({ success: true, message: 'Student and all related records deleted' });
});


const uploadCsv = asyncHandler(async (req, res) => {
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

  let created = 0;
  const errors = [];
  const noFeeStructure = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; 
    try {
      const { enrollmentNo, name, email, phone, branch, year, batch, password } = row;
      if (!enrollmentNo || !name || !email || !branch || !year || !batch || !password) {
        errors.push({ row: rowNum, error: 'Missing required field(s)' });
        continue;
      }
      const exists = await Student.findOne({ $or: [{ enrollmentNo }, { email }] });
      if (exists) {
        errors.push({ row: rowNum, error: `Student with enrollmentNo/email already exists` });
        continue;
      }
      const student = await Student.create({
        enrollmentNo, name, email, phone, branch,
        year: Number(year), batch, password, role: 'student',
      });
      created++;

      // Immediately allot fees from the matching active fee structure so this
      // student's dues show up right away on Students/Defaulters lists —
      // instead of waiting for someone to open their fee page for the first time.
      const structure = await FeeStructure.findOne({
        batch: student.batch,
        branch: student.branch,
        year: student.year,
        isActive: true,
      });
      if (structure) {
        await FeePayment.insertMany(
          structure.feeHeads.map((h) => ({
            studentId: student._id,
            feeStructureId: structure._id,
            feeHead: h.name,
            semester: structure.semester,
            amountDue: h.amount,
            amountPaid: 0,
          }))
        );
      } else {
        noFeeStructure.push({ row: rowNum, enrollmentNo });
      }
    } catch (err) {
      errors.push({ row: rowNum, error: err.message });
    }}
  fs.unlink(req.file.path, () => {});

  res.json({
    success: true,
    totalRows: rows.length,
    created,
    errors,
    ...(noFeeStructure.length > 0 && {
      warning: `${noFeeStructure.length} student(s) created but no active fee structure was found for their batch/branch/year — their fees weren't allotted yet.`,
      noFeeStructure,
    }),
  });
});


module.exports = {
  getSummary,
  getDefaulters,
  applyScholarship,
  approveScholarship,
  listScholarships,
  getAllStudents,
  createStaff,
  searchStudents,
  uploadCsv,
  deleteStudent,
};