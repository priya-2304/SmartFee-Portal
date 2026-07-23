const { z } = require('zod');

const loginSchema = z.object({
  enrollmentNo: z.string().min(3, 'Enrollment number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'admin', 'hod']).optional(),
});

const sendRegisterOtpSchema = z.object({
  email: z.string().email('A valid email is required'),
});

const verifyRegisterOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('A valid email is required'),
});

const updateProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const feeStructureSchema = z.object({
  batch: z.string().min(1),
  branch: z.string().min(1),
  year: z.number().int().min(1).max(5),
  semester: z.number().int().min(1).max(8),
  feeHeads: z
    .array(
      z.object({
        name: z.enum(['Tuition Fee', 'Hostel Fee', 'Bus Fee', 'Exam Fee', 'Library Fee']),
        amount: z.number().nonnegative(),
      })
    )
    .min(1, 'At least one fee head is required'),
  dueDate: z.string().or(z.date()),
});

const individualFeeSchema = z.object({
  semester: z.number().int().min(1).max(8),
  feeHeads: z.array(
    z.object({
      name: z.enum(['Tuition Fee', 'Hostel Fee', 'Bus Fee', 'Exam Fee', 'Library Fee']),
      amount: z.number().positive(),
    })
  ).min(1),
});

const initiatePaymentSchema = z.object({
  feePaymentId: z.string().min(1, 'feePaymentId is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  feePaymentId: z.string(),
});
const initiateBulkPaymentSchema = z.object({
  feePaymentIds: z.array(z.string()).min(1, 'At least one fee head is required'),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet']).optional(),
});

const verifyBulkPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  feePaymentIds: z.array(z.string()).min(1),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validate,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  feeStructureSchema,
  individualFeeSchema,
  initiatePaymentSchema,
  verifyPaymentSchema,
  initiateBulkPaymentSchema,
  verifyBulkPaymentSchema,
  sendRegisterOtpSchema,
  verifyRegisterOtpSchema,
  updateProfileSchema,
};