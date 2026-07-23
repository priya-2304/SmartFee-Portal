import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeletons';
import { FiTrendingUp, FiAlertTriangle, FiUsers, FiCreditCard } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const chartTextColor = () =>
  document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280';

const chartGridColor = () =>
  document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';


const gradientFillPlugin = {
  id: 'gradientFill',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
    chart.data.datasets[0].backgroundColor = gradient;
  },
};

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/summary')
      .then((res) => setSummary(res.data.summary))
      .finally(() => setLoading(false));
  }, []);

  const revenuePoints = summary?.monthlyRevenue || [];

  const revenueData = {
    labels: revenuePoints.map((m) => MONTHS[m._id.month - 1]),
    datasets: [
      {
        label: 'Collection',
        data: revenuePoints.map((m) => m.total),
        borderColor: '#2563eb',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2563eb',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { weight: '600' },
        callbacks: { label: (ctx) => `₹${ctx.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTextColor(), font: { size: 12 } },
      },
      y: {
        border: { display: false },
        ticks: {
          color: chartTextColor(),
          font: { size: 12 },
          callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
        },
        grid: { color: chartGridColor() },
      },
    },
  };

  const breakdownData = summary && {
    labels: ['Total Collection', 'Pending Dues', 'Defaulters', 'Transactions'],
    datasets: [
      {
        data: [summary.totalCollection, summary.pendingDues, summary.defaulterCount, summary.totalTransactions],
        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#2563eb'],
        borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const breakdownOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: chartTextColor(), font: { size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#111827',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const isCount = ctx.label === 'Defaulters' || ctx.label === 'Transactions';
            return ` ${ctx.label}: ${isCount ? ctx.parsed : '₹' + ctx.parsed.toLocaleString()}`;
          },
        },
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
          <StatCard label="Today" value={`₹${summary.collectionToday.toLocaleString()}`} icon={FaRupeeSign} accent="green" />
          <StatCard label="This Month" value={`₹${summary.collectionThisMonth.toLocaleString()}`} icon={FiTrendingUp} accent="primary" />
          <StatCard label="Pending Dues" value={`₹${summary.pendingDues.toLocaleString()}`} icon={FiAlertTriangle} accent="red" />
          <StatCard label="Defaulters" value={summary.defaulterCount} icon={FiUsers} accent="amber" />
          <StatCard label="Transactions" value={summary.totalTransactions} icon={FiCreditCard} accent="primary" />
        </div>
      )}

      {!loading && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2">
            <h2 className="font-semibold mb-1">Revenue Trend</h2>
            <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
            {!revenuePoints.length ? (
              <p className="text-gray-400 text-sm py-10 text-center">No revenue data yet.</p>
            ) : (
              <div style={{ height: 340 }}>
                <Line data={revenueData} options={revenueOptions} plugins={[gradientFillPlugin]} />
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-1">Collection Breakdown</h2>
            <p className="text-xs text-gray-400 mb-4">Overall snapshot</p>
            <div style={{ height: 340 }}>
              <Doughnut data={breakdownData} options={breakdownOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;