const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getSummary,
  getDefaulters,
  applyScholarship,
  approveScholarship,
  listScholarships,
  getAllStudents,
  createStaff,
  uploadCsv,
  searchStudents,
   uploadStudents, 
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const csvStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'csv'),
  filename: (req, file, cb) => cb(null, `csv-${Date.now()}${path.extname(file.originalname)}`),
});
const csvUpload = multer({
  storage: csvStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only .csv files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/summary', protect, authorize('admin', 'hod'), getSummary);
router.get('/defaulters', protect, authorize('admin', 'hod'), getDefaulters);
router.get('/students/search', protect, authorize('admin', 'hod'), searchStudents);
router.get('/students', protect, authorize('admin', 'hod'), getAllStudents);
router.get('/scholarships', protect, listScholarships);
router.post('/scholarships', protect, authorize('student', 'admin', 'hod'), applyScholarship);
router.put('/scholarships/:id/approve', protect, authorize('admin'), approveScholarship);
router.post('/staff', protect, authorize('admin'), createStaff);
router.post('/upload-csv', protect, authorize('admin'), csvUpload.single('file'), uploadCsv);
router.post('/students/upload-csv', protect, authorize('admin'), csvUpload.single('file'), uploadCsv);

module.exports = router;