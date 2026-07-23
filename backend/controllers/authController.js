const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Student = require('../models/Student');
const RegistrationOtp = require('../models/RegistrationOtp');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendOtpEmail, sendRegistrationOtpEmail } = require('../services/emailService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const login = asyncHandler(async (req, res) => {
  const { enrollmentNo, password, role } = req.body;
  const user = await Student.findOne({ enrollmentNo: enrollmentNo.toUpperCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid enrollment number or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administration.' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({
      success: false,
      message: `This account is not registered as ${role}. Please select the correct login type.`,
    });
  }
  const token = generateToken(user._id);
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      enrollmentNo: user.enrollmentNo,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      branch: user.branch,
      year: user.year,
      batch: user.batch,
      profilePicUrl: user.profilePicUrl || null,
    },
  });
});


const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await Student.findOne({ email });
  if (!user) return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  const otp = crypto.randomInt(100000, 999999).toString();
  user.resetOtp = crypto.createHash('sha256').update(otp).digest('hex');
  user.resetOtpExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(user.email, otp);
  res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const hashedOtp = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  const user = await Student.findOne({
    email,
    resetOtp: hashedOtp,
    resetOtpExpires: { $gt: Date.now() },
  }).select("+resetOtp +resetOtpExpires");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or Expired OTP",
    });
  }

  res.status(200).json({
    success: true,
    message: "OTP Verified Successfully",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const user = await Student.findOne({
    email,
    resetOtp: hashedOtp,
    resetOtpExpires: { $gt: Date.now() },
  }).select('+password +resetOtp +resetOtpExpires');
  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset successful. Please log in.' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit phone number',
    });
  }

  const user = await Student.findByIdAndUpdate(
    req.user._id,
    { phone },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    phone: user.phone,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

const uploadProfilePic = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }
  const profilePicUrl = req.file.path;
  const user = await Student.findByIdAndUpdate(
    req.user._id,
    { profilePicUrl },
    { new: true }
  );
  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully",
    profilePicUrl: user.profilePicUrl,
  });
});

const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingStudent = await Student.findOne({ email: normalizedEmail });
  if (existingStudent) {
    return res.status(400).json({ success: false, message: 'This email is already registered' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  await RegistrationOtp.findOneAndUpdate(
    { email: normalizedEmail },
    { email: normalizedEmail, otpHash, verified: false, expiresAt: Date.now() + 10 * 60 * 1000 },
    { upsert: true, new: true }
  );

  await sendRegistrationOtpEmail(normalizedEmail, otp);

  res.json({ success: true, message: 'OTP sent to your email' });
});

const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  const record = await RegistrationOtp.findOne({
    email: normalizedEmail,
    otpHash,
    expiresAt: { $gt: Date.now() },
  });

  if (!record) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  record.verified = true;
  record.expiresAt = Date.now() + 15 * 60 * 1000; // give 15 more mins to finish registration
  await record.save();

  res.json({ success: true, message: 'Email verified successfully' });
});


const registerStudent = asyncHandler(async (req, res) => {
  const {
    enrollmentNo,
    name,
    email,
    phone,
    branch,
    year,
    batch,
    password,
  } = req.body;

  
  if (
    !enrollmentNo ||
    !name ||
    !email ||
    !phone ||
    !branch ||
    !year ||
    !batch ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required fields",
    });
  }

  if (!/^[6-9]\d{9}$/.test(phone.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 10-digit phone number",
    });
  }

  const normalizedEmail = email.toLowerCase();

  const verifiedOtp = await RegistrationOtp.findOne({
    email: normalizedEmail,
    verified: true,
    expiresAt: { $gt: Date.now() },
  });

  if (!verifiedOtp) {
    return res.status(400).json({
      success: false,
      message: "Please verify your email with OTP before registering",
    });
  }

  const existingStudent = await Student.findOne({
    $or: [
      { enrollmentNo: enrollmentNo.toUpperCase() },
      { email: normalizedEmail },
    ],
  });

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      message: "Enrollment Number or Email already exists",
    });
  }

  const student = await Student.create({
    enrollmentNo: enrollmentNo.toUpperCase(),
    name,
    email: normalizedEmail,
    phone: phone.trim(),
    branch,
    year,
    batch,
    password,
    role: "student",
  });

  await RegistrationOtp.deleteOne({ _id: verifiedOtp._id });

  res.status(201).json({
    success: true,
    message: "Registration Successful",
    student: {
      id: student._id,
      enrollmentNo: student.enrollmentNo,
      name: student.name,
      email: student.email,
      role: student.role,
    },
  });
});


module.exports = {
  registerStudent,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  updateProfile,
  logout,
  uploadProfilePic,
  sendRegisterOtp,
  verifyRegisterOtp,
};