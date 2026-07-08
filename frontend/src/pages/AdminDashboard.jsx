import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeletons';
import { FiDollarSign, FiTrendingUp, FiAlertTriangle, FiUsers, FiCreditCard } from 'react-icons/fi';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accounts/summary')
      .then((res) => setSummary(res.data.summary))
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = summary?.monthlyRevenue?.length
    ? Math.max(...summary.monthlyRevenue.map((m) => m.total), 1)
    : 1;

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold">Accounts Dashboard</h1>

      {loading || !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Today" value={`₹${summary.collectionToday.toLocaleString()}`} icon={FiDollarSign} accent="green" />
          <StatCard label="This Month" value={`₹${summary.collectionThisMonth.toLocaleString()}`} icon={FiTrendingUp} accent="primary" />
          <StatCard label="Pending Dues" value={`₹${summary.pendingDues.toLocaleString()}`} icon={FiAlertTriangle} accent="red" />
          <StatCard label="Defaulters" value={summary.defaulterCount} icon={FiUsers} accent="amber" />
          <StatCard label="Transactions" value={summary.totalTransactions} icon={FiCreditCard} accent="primary" />
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Revenue — Last 6 Months</h2>
        {!summary?.monthlyRevenue?.length ? (
          <p className="text-gray-400 text-sm">No revenue data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-3 h-44 min-w-[280px]">
              {summary.monthlyRevenue.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-gray-500">₹{(m.total/1000).toFixed(0)}k</span>
                  <div
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all"
                    style={{ height: `${(m.total / maxRevenue) * 120}px`, minHeight: '4px' }}
                    title={`₹${m.total.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-500">{MONTHS[m._id.month - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
