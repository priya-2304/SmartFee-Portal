import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchStudentFees } from '../store/slices/feeSlice';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeletons';
import { FiDollarSign, FiCheckCircle, FiAlertTriangle, FiCalendar, FiAward, FiArrowRight } from 'react-icons/fi';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { summary, feeHeads, loading } = useSelector((state) => state.fee);

  useEffect(() => {
    if (user?.id) dispatch(fetchStudentFees(user.id));
  }, [dispatch, user]);

  const statusStyle = (s) => ({
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    pending: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.branch} &bull; Year {user?.year} &bull; Batch {user?.batch}
          </p>
        </div>
        <Link to="/pay-fee" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          Pay Fee <FiArrowRight size={15} />
        </Link>
      </div>

      {/* Stats */}
      {loading || !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total Fees" value={`₹${summary.totalFees.toLocaleString()}`} icon={FiDollarSign} accent="primary" />
          <StatCard label="Paid" value={`₹${summary.paidFees.toLocaleString()}`} icon={FiCheckCircle} accent="green" />
          <StatCard label="Pending" value={`₹${summary.pendingFees.toLocaleString()}`} icon={FiAlertTriangle} accent="red" />
          <StatCard
            label="Due Date"
            value={summary.dueDate ? new Date(summary.dueDate).toLocaleDateString() : 'N/A'}
            icon={FiCalendar}
            accent="amber"
          />
          <StatCard label="Scholarship" value={`₹${summary.scholarshipCredits.toLocaleString()}`} icon={FiAward} accent="primary" />
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.totalFees > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Payment Progress</span>
            <span className="text-primary-600 font-semibold">
              {Math.round((summary.paidFees / summary.totalFees) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((summary.paidFees / summary.totalFees) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>₹{summary.paidFees.toLocaleString()} paid</span>
            <span>₹{summary.pendingFees.toLocaleString()} remaining</span>
          </div>
        </div>
      )}

      {/* Fee heads table */}
      <div className="card">
        <h2 className="font-semibold mb-4">Fee Details</h2>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-2 font-medium">Fee Head</th>
                <th className="pb-2 font-medium">Due</th>
                <th className="pb-2 font-medium">Paid</th>
                <th className="pb-2 font-medium">Balance</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {feeHeads?.map((f) => (
                <tr key={f._id}>
                  <td className="py-3 font-medium">{f.feeHead}</td>
                  <td className="py-3">₹{f.amountDue.toLocaleString()}</td>
                  <td className="py-3 text-green-600">₹{f.amountPaid.toLocaleString()}</td>
                  <td className="py-3 text-red-500">₹{(f.amountDue - f.amountPaid).toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && (!feeHeads || feeHeads.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    No fee structure assigned yet. Contact accounts department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
