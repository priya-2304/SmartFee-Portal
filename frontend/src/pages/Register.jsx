import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    enrollmentNo: "",
    email: "",
    phone: "",
    branch: "",
    year: "",
    batch: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

   if (e.target.name === "email" && emailVerified) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtp("");
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      return alert("Enter your email first");
    }
    try {
      setSendingOtp(true);
      const res = await api.post("/auth/send-register-otp", { email: formData.email });
      alert(res.data.message || "OTP sent to your email");
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return alert("Enter the 6-digit OTP");
    }
    try {
      setVerifyingOtp(true);
      const res = await api.post("/auth/verify-register-otp", {
        email: formData.email,
        otp,
      });
      alert(res.data.message || "Email verified");
      setEmailVerified(true);
    } catch (err) {
      alert(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      return alert("Please verify your email with OTP before registering");
    }

    if (formData.password !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      setLoading(true);

      const { confirmPassword, ...data } = formData;

      const res = await api.post("/auth/register", data);

      alert(res.data.message || "Registration Successful");

      navigate("/login");
    } catch (err) {
      alert(
        err.response?.data?.message || "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-2">
          SmartFee Portal
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Student Registration
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            name="enrollmentNo"
            placeholder="Enrollment Number"
            value={formData.enrollmentNo}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

         
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={emailVerified}
              className="flex-1 border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || emailVerified || !formData.email}
              className="whitespace-nowrap bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 rounded-lg text-sm font-medium"
            >
              {emailVerified ? "Verified ✓" : sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          </div>

          
          {otpSent && !emailVerified && (
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="flex-1 border rounded-lg px-4 py-2"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 rounded-lg text-sm font-medium"
              >
                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number (10 digits)"
            value={formData.phone}
            onChange={handleChange}
            required
            pattern="[6-9][0-9]{9}"
            title="Enter a valid 10-digit phone number"
            maxLength={10}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            name="branch"
            placeholder="Branch (e.g. CSE)"
            value={formData.branch}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="number"
            name="year"
            placeholder="Year"
            min="1"
            max="5"
            value={formData.year}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            name="batch"
            placeholder="Batch (e.g. 2024)"
            value={formData.batch}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            disabled={loading || !emailVerified}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Registering..." : !emailVerified ? "Verify Email to Continue" : "Register"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;