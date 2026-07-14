import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeletons';
import { FiDollarSign, FiTrendingUp, FiAlertTriangle, FiUsers, FiCreditCard } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DOUGHNUT_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const chartTextColor = () =>
  document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accounts/summary')
      .then((res) => setSummary(res.data.summary))
      .finally(() => setLoading(false));
  }, []);

  const revenueData = {
    labels: (summary?.monthlyRevenue || []).map((m) => MONTHS[m._id.month - 1]),
    datasets: [
      {
        label: 'Collection',
        data: (summary?.monthlyRevenue || []).map((m) => m.total),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        pointBackgroundColor: '#2563eb',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `₹${ctx.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTextColor() } },
      y: {
        ticks: {
          color: chartTextColor(),
          callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
        },
        grid: { color: 'rgba(150,150,150,0.1)' },
      },
    },
  };

  const feeHeadData = {
    labels: (summary?.feeHeadBreakdown || []).map((f) => f._id),
    datasets: [
      {
        data: (summary?.feeHeadBreakdown || []).map((f) => f.total),
        backgroundColor: DOUGHNUT_COLORS,
        borderWidth: 0,
      },
    ],
  };

  const feeHeadOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: chartTextColor(), boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ₹${ctx.parsed.toLocaleString()}` },
      },
    },
  };

  const defaultersData = {
    labels: (summary?.defaultersByBranch || []).map((b) => b._id),
    datasets: [
      {
        label: 'Defaulters',
        data: (summary?.defaultersByBranch || []).map((b) => b.count),
        backgroundColor: '#f59e0b',
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const defaultersOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTextColor() } },
      y: {
        ticks: { color: chartTextColor(), stepSize: 1 },
        grid: { color: 'rgba(150,150,150,0.1)' },
      },
    },
  };

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

      {!loading && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <h2 className="font-semibold mb-4">Revenue Trend — Last 6 Months</h2>
            {!summary.monthlyRevenue?.length ? (
              <p className="text-gray-400 text-sm">No revenue data yet.</p>
            ) : (
              <div style={{ height: 260 }}>
                <Line data={revenueData} options={revenueOptions} />
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Collection by Fee Head</h2>
            {!summary.feeHeadBreakdown?.length ? (
              <p className="text-gray-400 text-sm">No collection data yet.</p>
            ) : (
              <div style={{ height: 260 }}>
                <Doughnut data={feeHeadData} options={feeHeadOptions} />
              </div>
            )}
          </div>

          <div className="card lg:col-span-3">
            <h2 className="font-semibold mb-4">Defaulters by Branch</h2>
            {!summary.defaultersByBranch?.length ? (
              <p className="text-gray-400 text-sm">No defaulters 🎉</p>
            ) : (
              <div style={{ height: 220 }}>
                <Bar data={defaultersData} options={defaultersOptions} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;