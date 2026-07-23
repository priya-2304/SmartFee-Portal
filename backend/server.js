require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const startReminderCron = require('./utils/reminderCron');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`SmartFee Portal API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    startReminderCron();
  });
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});