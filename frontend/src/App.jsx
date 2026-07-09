import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import StudentDashboard from './pages/StudentDashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import AdminDashboard from './pages/AdminDashboard';
import ScholarshipPage from './pages/ScholarshipPage';
import AdminScholarshipsPage from './pages/AdminScholarshipsPage';


function App() {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/scholarships" element={<ScholarshipPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

      </Route>
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute> }>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route 
          path="/admin/scholarships" 
          element={<AdminScholarshipsPage />} 
        />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;