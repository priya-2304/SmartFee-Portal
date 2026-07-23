const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
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
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");

const {
  validate,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendRegisterOtpSchema,
  verifyRegisterOtpSchema,
  updateProfileSchema,
} = require("../utils/validators");

router.post(
  "/send-register-otp",
  validate(sendRegisterOtpSchema),
  sendRegisterOtp
);

router.post(
  "/verify-register-otp",
  validate(verifyRegisterOtpSchema),
  verifyRegisterOtp
);

router.post("/register", registerStudent);

router.post("/login", validate(loginSchema), login);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post("/verify-otp", verifyOtp);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword
);

router.get("/me", protect, getMe);

router.put(
  "/update-profile",
  protect,
  validate(updateProfileSchema),
  updateProfile
);

router.post("/logout", protect, logout);

router.post(
  "/upload-profile-pic",
  protect,
  upload.single("profilePic"),
  uploadProfilePic
);

module.exports = router;