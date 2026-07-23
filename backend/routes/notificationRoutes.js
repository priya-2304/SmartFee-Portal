const express = require('express');
const router = express.Router();
const {
  triggerReminders,
  getMyNotifications,
  markAsRead,
  bulkReminder,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/send-reminders', protect, authorize('admin', 'accounts'), triggerReminders);
router.post('/bulk-reminder', protect, authorize('admin', 'accounts', 'hod'), bulkReminder);
router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;