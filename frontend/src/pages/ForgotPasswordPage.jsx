import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../store/slices/authSlice";

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Send OTP
  const requestOtp = async (e) => {
    e.preventDefault();

    const result = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(result)) {
      setStep(2);
    }
  };

  // Verify OTP
  const verifyOtpHandler = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      verifyOtp({
        email,
        otp,
      })
    );

    if (verifyOtp.fulfilled.match(result)) {
      setStep(3);
    }
  };

  // Reset Password
  const submitReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const result = await dispatch(
      resetPassword({
        email,
        otp,
        newPassword,
      })
    );

    if (resetPassword.fulfilled.match(result)) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="card w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Reset Password
        </h1>

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">

            <div>
              <label className="block mb-1 font-medium">
                Registered Email
              </label>

              <input
                type="email"
                className="input-field"
                placeholder="Enter Registered Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="btn-primary w-full">
              Send OTP
            </button>

          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtpHandler} className="space-y-4">

            <div>
              <label className="block mb-1 font-medium">
                Enter OTP
              </label>

              <input
                type="text"
                className="input-field"
                placeholder="6 Digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <button className="btn-primary w-full">
              Verify OTP
            </button>

          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitReset} className="space-y-4">

            <div>
              <label className="block mb-1 font-medium">
                New Password
              </label>

              <input
                type="password"
                className="input-field"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Confirm Password
              </label>

              <input
                type="password"
                className="input-field"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn-primary w-full">
              Reset Password
            </button>

          </form>
        )}

        <div className="text-center mt-5">
          <Link
            to="/login"
            className="text-primary-600 hover:underline"> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;