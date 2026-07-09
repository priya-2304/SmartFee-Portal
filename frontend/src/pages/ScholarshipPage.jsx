import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiAward, FiSend } from 'react-icons/fi';

const TYPES = [
  { value: 'merit', label: 'Merit-based' },
  { value: 'need-based', label: 'Need-based' },
  { value: 'sports', label: 'Sports' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const statusBadge = (s) =>
  ({
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  }[s] || 'bg-gray-100 text-gray-600');

const ScholarshipPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('merit');
  const [reason, setReason] = useState('');

  const fetchMine = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/scholarships');
      setScholarships(data.scholarships || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');

    setSubmitting(true);
    try {
      await api.post('/admin/scholarships', { amount: Number(amount), type, reason });
      toast.success('Scholarship application submitted');
      setAmount('');
      setReason('');
      fetchMine();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <FiAward className="text-primary-600" /> Scholarships
      </h1>

      <div className="card max-w-xl">
        <h2 className="font-semibold mb-3">Apply for a Scholarship</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹)</label>
            <input
              type="number"
              className="input-field"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <textarea
              className="input-field"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you applying for this scholarship?"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            <FiSend size={16} /> {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">My Applications</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : scholarships.length === 0 ? (
          <p className="text-sm text-gray-500">No scholarship applications yet.</p>
        ) : (
          <div className="space-y-2">
            {scholarships.map((s) => (
              <div key={s._id} className="flex items-center justify-between border-b dark:border-gray-700 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{s.type.replace('-', ' ')}</p>
                  <p className="text-xs text-gray-500">
                    ₹{s.amount.toLocaleString()} · Applied {new Date(s.appliedAt).toLocaleDateString()}
                    {s.appliedAmount > 0 && ` · ₹${s.appliedAmount.toLocaleString()} credited`}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipPage;