import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiAward, FiCheck, FiX } from 'react-icons/fi';

const statusBadge = (s) =>
  ({
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  }[s] || 'bg-gray-100 text-gray-600');

const AdminScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actingId, setActingId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/scholarships', { params: filter ? { status: filter } : {} });
      setScholarships(data.scholarships || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [filter]);

  const act = async (id, status) => {
    setActingId(id);
    try {
      await api.put(`/admin/scholarships/${id}/approve`, { status });
      toast.success(`Scholarship ${status}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <FiAward className="text-primary-600" /> Scholarship Approvals
      </h1>

    <div className="flex gap-2">
    {['pending', 'approved', 'rejected', ''].map((f) => (
    <button key={f || 'all'} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition-all ${ filter === f ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300' }`}>
    {f || 'All'}</button> ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : scholarships.length === 0 ? (
          <p className="text-sm text-gray-500">No scholarship applications found.</p>
     ) : (
    <div className="space-y-2">
    {scholarships.map((s) => (
     <div
      key={s._id}
    className="flex items-center justify-between flex-wrap gap-2 border-b dark:border-gray-700 pb-3 last:border-0" >
     <div>
     <p className="text-sm font-semibold">
     {s.studentId?.name} <span className="text-gray-400 font-normal">({s.studentId?.enrollmentNo})</span>
         </p>
       <p className="text-xs text-gray-500 capitalize">
         {s.type.replace('-', ' ')} · ₹{s.amount.toLocaleString()}
        {s.reason && ` · "${s.reason}"`}
     </p>
    </div>
    <div className="flex items-center gap-2">
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(s.status)}`}>
        {s.status}
         </span>
        {s.status === 'pending' && (
    <>
      <button disabled={actingId === s._id} onClick={() => act(s._id, 'approved')} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"  title="Approve" >
        <FiCheck size={16} />
     </button>
     <button disabled={actingId === s._id} onClick={() => act(s._id, 'rejected')} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Reject" >
        <FiX size={16} />
     </button>
    </>
 )}</div> </div> ))} </div> )}</div></div>
  );
};

export default AdminScholarshipsPage;