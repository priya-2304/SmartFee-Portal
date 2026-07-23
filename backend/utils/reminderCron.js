const cron = require('node-cron');
const { sendReminders } = require('../controllers/notificationController');

/**
 * Runs the 7-day / 3-day / 1-day due-date reminder job automatically,
 * every day at 8:00 AM server time — so admins don't have to trigger it manually.
 */
const startReminderCron = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[reminderCron] Running daily due-date reminder job...');
    try {
      const sevenDay = await sendReminders(7);
      const threeDay = await sendReminders(3);
      const oneDay = await sendReminders(1);
      console.log(
        `[reminderCron] Done. Sent -> 7d: ${sevenDay}, 3d: ${threeDay}, 1d: ${oneDay}`
      );
    } catch (err) {
      console.error('[reminderCron] Reminder job failed:', err.message);
    }
  });

  console.log('[reminderCron] Daily reminder cron scheduled for 8:00 AM.');
};

module.exports = startReminderCron;