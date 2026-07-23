const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendDueReminderEmail } = require('../services/emailService');

const DAY_MS = 24 * 60 * 60 * 1000;

const sendReminders = async (daysAhead) => {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  target.setHours(0, 0, 0, 0);
  const targetEnd = new Date(target.getTime() + DAY_MS);

  const structures = await FeeStructure.find({ dueDate: { $gte: target, $lt: targetEnd }, isActive: true });
  let sentCount = 0;

  for (const structure of structures) {
    const students = await Student.find({
      batch: structure.batch,
      branch: structure.branch,
      year: structure.year,
      role: 'student',
    });

    for (const student of students) {
      const payments = await FeePayment.find({ studentId: student._id, status: { $in: ['pending', 'partial'] } });
      const pendingAmount = payments.reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0);
      if (pendingAmount <= 0) continue;

      const type = `due_reminder_${daysAhead}d`;
      await Notification.create({
        studentId: student._id,
        type,
        message: `Your fee of Rs. ${pendingAmount} is due in ${daysAhead} day(s) (${structure.dueDate.toDateString()}).`,
      });

      await sendDueReminderEmail(student.email, student.name, pendingAmount, structure.dueDate, daysAhead).catch(
        (e) => console.error('Reminder email failed:', e.message)
      );
      sentCount += 1;
    }
  }
  return sentCount;
};

const triggerReminders = asyncHandler(async (req, res) => {
  const counts = {
    sevenDay: await sendReminders(7),
    threeDay: await sendReminders(3),
    oneDay: await sendReminders(1),
  };
  res.json({ success: true, message: 'Reminders dispatched', counts });
});

const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
     ? { recipientRole: 'admin' }
    : { studentId: req.user._id };
   const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id, recipientRole: 'admin' }
    : { _id: req.params.id, studentId: req.user._id };
  const notif = await Notification.findOneAndUpdate(filter, { read: true }, { new: true });
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, notification: notif });
});

const sendOneBulkReminder = async (id) => {
  const student = await Student.findById(id);
  if (!student) return { id, sent: false };

  const payments = await FeePayment.find({ studentId: id, status: { $in: ['pending', 'partial'] } });
  const pendingAmount = payments.reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0);
  if (pendingAmount <= 0) return { id, sent: false };

  const structure = await FeeStructure.findOne({
    batch: student.batch,
    branch: student.branch,
    year: student.year,
    isActive: true,
  });
  const dueDate = structure?.dueDate || new Date();
  const daysLeft = Math.max(Math.ceil((new Date(dueDate) - new Date()) / DAY_MS), 0);

  await Notification.create({
    studentId: id,
    type: 'general',
    message: `Reminder: You have a pending fee balance of Rs. ${pendingAmount}. Please pay at the earliest.`,
  });

  try {
    await sendDueReminderEmail(student.email, student.name, pendingAmount, dueDate, daysLeft);
    return { id, sent: true };
  } catch (e) {
    console.error(`[bulkReminder] email failed for ${student.email}:`, e.message);
    return { id, sent: false, error: e.message };
  }
};
const runWithConcurrency = async (items, limit, worker) => {
  const results = [];
  let i = 0;
  const runners = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
};

const bulkReminder = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: 'studentIds array is required' });
  }

  res.json({ success: true, message: `Reminders Sent for ${studentIds.length} student(s)` });

  runWithConcurrency(studentIds, 5, sendOneBulkReminder)
    .then((results) => {
      const sentCount = results.filter((r) => r?.sent).length;
      console.log(`[bulkReminder] done: ${sentCount}/${studentIds.length} emails sent`);
    })
    .catch((e) => console.error('[bulkReminder] batch failed:', e.message));
});

module.exports = { triggerReminders, getMyNotifications, markAsRead, bulkReminder, sendReminders };