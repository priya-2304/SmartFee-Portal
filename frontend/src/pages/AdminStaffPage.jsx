import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiUserPlus } from 'react-icons/fi';

const AdminStaffPage = () => {
  const [form, setForm] = useState({
    name: '', enrollmentNo: '', email: '', phone: '',
    password: '', role: 'hod', department: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/staff', form);
      toast.success(`${form.role.toUpperCase()} account created`);
      setForm({ name: '', enrollmentNo: '', email: '', phone: '', password: '', role: 'hod', department: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <FiUserPlus className="text-primary-600" /> Manage Staff
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <select name="role" value={form.role} onChange={handleChange} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
          <option value="hod">HOD</option>
          <option value="admin">Admin</option>
        </select>

        <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" required
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />

        <input name="enrollmentNo" value={form.enrollmentNo} onChange={handleChange} placeholder="Staff ID (e.g. HOD-CSE-01)" required
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />

        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />

        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />

        {form.role === 'hod' && (
          <input name="department" value={form.department} onChange={handleChange} placeholder="Department / Branch (e.g. CSE)" required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
        )}

        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Temporary password" required
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />

        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default AdminStaffPage;