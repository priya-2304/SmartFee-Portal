const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getStudentFees,
  getFeeDashboard,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  listFeeStructures,
  addIndividualFee,
  downloadChallan,
  uploadFeeStructureCsv,
} = require('../controllers/feeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate, feeStructureSchema, individualFeeSchema } = require('../utils/validators');

const feeStructureCsvStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'csv'),
  filename: (req, file, cb) => cb(null, `fee-structure-${Date.now()}${path.extname(file.originalname)}`),
});
const feeStructureCsvUpload = multer({
  storage: feeStructureCsvStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only .csv files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/student/:id', protect, getStudentFees);
router.get('/:feePaymentId/challan', protect, downloadChallan);  
router.get('/structure', protect, authorize('admin', 'accounts', 'hod'), listFeeStructures);
router.post('/structure', protect, authorize('admin', 'accounts'), validate(feeStructureSchema), createFeeStructure);
router.put('/structure/:id', protect, authorize('admin', 'accounts'), validate(feeStructureSchema), updateFeeStructure);
router.delete('/structure/:id', protect, authorize('admin', 'accounts'), deleteFeeStructure);
router.post(
  '/structure/upload',
  protect,
  authorize('admin', 'accounts'),
  feeStructureCsvUpload.single('file'),
  uploadFeeStructureCsv
);

router.get('/student/:id/dashboard', protect, getFeeDashboard);
router.post('/student/:id/add-fee', protect, authorize('admin', 'accounts'), validate(individualFeeSchema), addIndividualFee);

module.exports = router;