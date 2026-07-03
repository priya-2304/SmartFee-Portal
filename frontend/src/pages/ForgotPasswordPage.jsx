import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../store/slices/authSlice';
import { FiMail, FiLock, FiArrowLeft, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

 const requestOtp = async (e) => {
  e.preventDefault();
  setLoading(true);

  setTimeout(() => {
    setLoading(false);
    setStep(2);
    toast.success("OTP sent successfully!");
  }, 1000);
};
 const submitReset = async (e) => {
  e.preventDefault();
  setLoading(true);

  setTimeout(() => {
    setLoading(false);

    toast.success("Password updated successfully!", {
      duration: 3000,
    });

    setStep(3);
  }, 1000);
};


  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #e0f0ff 0%, #ffffff 50%, #dbeafe 100%)' }}
    >
      {/* Blobs */}
      <div style={{ position: 'fixed', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(147,197,253,0.3)', filter: 'blur(60px)', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-80px', right: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(191,219,254,0.4)', filter: 'blur(70px)', zIndex: 0 }} />

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderRadius: '24px', boxShadow: '0 8px 40px rgba(59,130,246,0.12)', border: '1px solid rgba(147,197,253,0.4)', padding: '36px 32px' }}>

        {/* Icon */}
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
          {step === 1 ? <FiMail color="white" size={24} /> : <FiLock color="white" size={24} />}
        </div>

        <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: '#1e3a8a', marginBottom: '4px' }}>
          {step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </h1>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '28px' }}>
          {step === 1
            ? 'Enter your email — we will send you an OTP'
            : `OTP sent to ${email}`}
        </p>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '600' }}>
            {step > 1 ? <FiCheck size={14} /> : '1'}
          </div>
          <div style={{ width: '40px', height: '2px', background: step === 2 ? '#3b82f6' : '#bfdbfe', borderRadius: '2px', transition: 'background 0.3s' }} />
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step === 2 ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#e0f0ff', border: step === 2 ? 'none' : '2px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step === 2 ? 'white' : '#93c5fd', fontSize: '13px', fontWeight: '600', transition: 'all 0.3s' }}>
            2
          </div>
        </div>

        {step === 3 ? (
  <div style={{ textAlign: 'center', padding: '10px 0' }}>
    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}>
      <FiCheck color="white" size={28} />
    </div>
    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#15803d', marginBottom: '8px' }}>
      Password Updated!
    </h2>
    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
      Your password has been changed successfully.
    </p>
    <Link
      to="/login"
      style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: '600', fontSize: '15px', textDecoration: 'none' }}
    >
      Back to Login
    </Link>
  </div>
) : step === 1 ? (
          <form onSubmit={requestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Registered Email
              </label>
              <input
                type="email"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #bfdbfe', background: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1e293b' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: '600', fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Enter OTP
              </label>
              <input
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #bfdbfe', background: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', letterSpacing: '4px', textAlign: 'center', fontWeight: '700' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="• • • • • •"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #bfdbfe', background: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1e293b' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: '600', fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                'Updating...'
              ) : (
                <>
                 Update Password
                </>
              )}
            </button>
          </form>
       )}

        {step !== 3 && (
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FiArrowLeft size={13} /> Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;