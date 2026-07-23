require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');

const seed = async () => {
  await connectDB();

  // await Student.deleteMany({});
  // await FeeStructure.deleteMany({});

  const admin = await Student.create({
    enrollmentNo: 'ADMIN001',
    name: 'Registrar Admin',
    email: 'admin@smartfee.edu',
    phone: '9999999999',
    branch: 'Administration',
    year: 1,
    batch: 'N/A',
    password: 'Admin@123',
    role: 'admin',
  });


  const student = await Student.create({
    enrollmentNo: 'CSE2023001',
    name: 'Meera',
    email: 'Meera@example.com',
    phone: '9876543210',
    branch: 'CSE',
    year: 3,
    batch: '2024-2028',
    password: 'Student@123',
    role: 'student',
  });

  await FeeStructure.create({
    batch: '2024-2028',
    branch: 'CSE',
    year: 3,
    feeHeads: [
      { name: 'Tuition Fee', amount: 30000 },
      { name: 'Hostel Fee', amount: 55000 },
      { name: 'Bus Fee', amount: 18000 },
      { name: 'Exam Fee', amount: 5000 },
      { name: 'Library Fee', amount: 15000 },
    ],
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    createdBy: admin._id,
  });

  console.log('Seed data created:');
  console.log('  Admin    -> ADMIN001 / Admin@123');
  console.log('  Student  -> CSE2023001 / Student@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
