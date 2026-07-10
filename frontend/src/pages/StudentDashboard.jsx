import React, { useEffect, useMemo, useState } from 'react';
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

  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchStudentFees(user.id));
    }
  }, [dispatch, user]);

  const availableSemesters = useMemo(() => {
    if (!feeHeads?.length) return [];
    const valid = feeHeads
      .map((f) => f.semester)
      .filter((sem) => sem !== null && sem !== undefined && !Number.isNaN(Number(sem)));
    return [...new Set(valid)].sort((a, b) => a - b);
  }, [feeHeads]);

  useEffect(() => {
    if (availableSemesters.length > 0 && !availableSemesters.includes(Number(selectedSemester))) {
      setSelectedSemester(String(availableSemesters[0]));
    }
  }, [availableSemesters]); 

  const filteredFeeHeads = useMemo(() => {
    if (!feeHeads || !selectedSemester) return [];
    return feeHeads.filter((f) => String(f.semester) === String(selectedSemester));
  }, [feeHeads, selectedSemester]);

  const semesterSummary = useMemo(() => {
    const totalFees = filteredFeeHeads.reduce((sum, f) => sum + f.amountDue, 0);
    const paidFees = filteredFeeHeads.reduce((sum, f) => sum + f.amountPaid, 0);
    const scholarshipApplied = filteredFeeHeads.reduce((sum, f) => sum + (f.scholarshipApplied || 0), 0);
    const pendingFees = filteredFeeHeads.reduce(
      (sum, f) => sum + Math.max(f.amountDue - f.amountPaid - (f.scholarshipApplied || 0), 0),
      0
    );
    return { totalFees, paidFees, pendingFees, scholarshipApplied };
  }, [filteredFeeHeads]);

  const statusStyle = (s) => ({
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    pending: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-5">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.branch} &bull; Year {user?.year} &bull; Batch {user?.batch}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {availableSemesters.length > 0 && (
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="input-field text-med py-2 px-3 w-auto bg-blue-600 text-white font-medium"
            >
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          )}

          <Link to="/pay-fee" className="btn-primary flex items-center gap-2">
            Pay Fee <FiArrowRight size={15} />
          </Link>
        </div>
      </div>

      {loading || !feeHeads ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total Fees" value={`₹${semesterSummary.totalFees.toLocaleString()}`} icon={FiDollarSign} accent="primary" />
          <StatCard label="Paid" value={`₹${semesterSummary.paidFees.toLocaleString()}`} icon={FiCheckCircle} accent="green" />
          <StatCard label="Pending" value={`₹${semesterSummary.pendingFees.toLocaleString()}`} icon={FiAlertTriangle} accent="red" />
          <StatCard
            label="Due Date"
            value={summary?.dueDate ? new Date(summary.dueDate).toLocaleDateString() : 'N/A'}
            icon={FiCalendar}
            accent="amber"
          />
          <StatCard label="Scholarship" value={`₹${semesterSummary.scholarshipApplied.toLocaleString()}`} icon={FiAward} accent="primary" />
        </div>
      )}

      {semesterSummary.totalFees > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Payment Progress</span>
            <span className="text-primary-600 font-semibold">
              {Math.round((semesterSummary.paidFees / semesterSummary.totalFees) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((semesterSummary.paidFees / semesterSummary.totalFees) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>₹{semesterSummary.paidFees.toLocaleString()} paid</span>
            <span>₹{semesterSummary.pendingFees.toLocaleString()} remaining</span>
          </div>
        </div>
      )}

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
              {filteredFeeHeads?.map((f) => (
                <tr key={f._id}>
                  <td className="py-3 font-medium">{f.feeHead}</td>
                  <td className="py-3">₹{f.amountDue.toLocaleString()}</td>
                  <td className="py-3 text-green-600">₹{f.amountPaid.toLocaleString()}</td>
                  <td className="py-3 text-red-500">
                    ₹{Math.max(f.amountDue - f.amountPaid - (f.scholarshipApplied || 0), 0).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && (!filteredFeeHeads || filteredFeeHeads.length === 0) && (
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