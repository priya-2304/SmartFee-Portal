import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import PayFeePage from './pages/PayFeePage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import CsvUploadPage from './pages/CsvUploadPage';

import AllStudentsPage from './pages/AllStudentsPage';
import AdminDashboard from './pages/AdminDashboard';
import DefaultersPage from './pages/DefaultersPage';
import FeeStructurePage from './pages/FeeStructurePage';
import TransactionLogsPage from './pages/TransactionLogsPage';
import ScholarshipPage from './pages/ScholarshipPage';
import AdminScholarshipsPage from './pages/AdminScholarshipsPage';
import AdminStaffPage from './pages/AdminStaffPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/pay-fee" element={<PayFeePage />} />
          <Route path="/scholarships" element={<ScholarshipPage />} />
          <Route path="/payment-history" element={<PaymentHistoryPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin', 'hod']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AllStudentsPage />} />
          <Route path="/admin/defaulters" element={<DefaultersPage />} />
          <Route path="/admin/scholarships" element={<AdminScholarshipsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/fee-structure" element={<FeeStructurePage />} />
          <Route path="/admin/transactions" element={<TransactionLogsPage />} />
          <Route path="/admin/csv-upload" element={<CsvUploadPage />} /> 
          <Route path="/admin/staff" element={<AdminStaffPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['student', 'admin', 'hod']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;