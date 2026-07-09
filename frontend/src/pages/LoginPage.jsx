import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../store/slices/authSlice';
import { FiLogIn } from 'react-icons/fi';
import { FaUserGraduate, FaUserShield } from 'react-icons/fa';

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      loginUser({
        enrollmentNo,
        password,
        role,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      navigate(
        role === 'student'
          ? '/dashboard'
          : '/admin/dashboard'
      );
    }};

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'linear-gradient(135deg, #e0f0ff 0%, #ffffff 50%, #dbeafe 100%)',
      }}>
      <div
        style={{
          position: 'fixed',
          top: '-80px',
          left: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(147,197,253,0.3)',
          filter: 'blur(60px)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '-80px',
          right: '-80px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(191,219,254,0.4)',
          filter: 'blur(70px)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          boxShadow: '0 8px 40px rgba(59,130,246,0.12)',
          border: '1px solid rgba(147,197,253,0.4)',
          padding: '36px 32px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background:
              'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow:
              '0 4px 16px rgba(59,130,246,0.35)',
          }}
        >
          <FiLogIn color="white" size={24} />
        </div>

        <h1
          style={{
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: '700',
            color: '#1e3a8a',
            marginBottom: '4px',
          }}
        >
          SmartFee Portal
        </h1>

        <p
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '22px',
          }}
        >
          Online Fee Payment & Finance Management
        </p>

        {/* Login As */}
        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                background: '#dbeafe',
              }}
            />

            <span
              style={{
                fontSize: '13px',
                color: '#64748b',
                fontWeight: '600',
              }}
            >
              Login as
            </span>

            <div
              style={{
                flex: 1,
                height: '1px',
                background: '#dbeafe',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              border: '1px solid #dbeafe',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('student')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
                background:
                  role === 'student'
                    ? '#eff6ff'
                    : '#fff',
                color:
                  role === 'student'
                    ? '#2563eb'
                    : '#475569',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRight: '1px solid #dbeafe',
              }}
            >
              <FaUserGraduate />
              Student
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
                background:
                  role === 'admin'
                    ? '#eff6ff'
                    : '#fff',
                color:
                  role === 'admin'
                    ? '#2563eb'
                    : '#475569',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <FaUserShield />
              Admin
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              {role === 'student'
                ? 'Enrollment Number'
                : 'Admin ID'}
            </label>

            <input
              value={enrollmentNo}
              onChange={(e) =>
                setEnrollmentNo(e.target.value)
              }
              placeholder={
                role === 'student'
                  ? 'e.g. CSE2023001'
                  : 'e.g. ADMIN001'
              }
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #bfdbfe',
                background: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#1e293b',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #bfdbfe',
                background: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#1e293b',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background:
                'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              fontWeight: '600',
              fontSize: '15px',
              border: 'none',
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}   >
            <FiLogIn size={17} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

     <div
  style={{
    textAlign: "center",
    marginTop: "18px",
    fontSize: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }} >
  <Link
    to="/forgot-password"
    style={{
      color: "#3b82f6",
      textDecoration: "none",
    }} >Forgot Password?
  </Link>

  {role === "student" && (
    <p style={{ color: "#64748b", margin: 0 }}>
     New Student?{" "}
      <Link
        to="/register"
        style={{
          color: "#2563eb",
          fontWeight: "600",
          textDecoration: "none",
        }}>
        Register Here
      </Link>
    </p>
  )}
</div>
  <p  style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '20px',}}>
      SmartFee Portal &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;