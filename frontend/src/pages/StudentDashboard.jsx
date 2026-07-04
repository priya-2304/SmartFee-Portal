import React from "react";
import './StudentDashboard.css'
import {
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

const StudentDashboard = () => {
  const feeDetails = [
    {
      feeHead: "Exam Fee",
      due: 5000,
      paid: 0,
      balance: 5000,
      status: "Pending",
    },
    {
      feeHead: "Library Fee",
      due: 15000,
      paid: 0,
      balance: 15000,
      status: "Pending",
    },
    {
      feeHead: "Bus Fee",
      due: 18000,
      paid: 0,
      balance: 18000,
      status: "Pending",
    },
    {
      feeHead: "Hostel Fee",
      due: 55000,
      paid: 0,
      balance: 55000,
      status: "Pending",
    },
  ];

  return (
    <div className="student-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div>
          <h1>
            Welcome, Nitin<span>👋</span>
          </h1>
          <p>CSE • Year 3 • Batch 2024-2028</p>
        </div>

        <button className="pay-btn">
          Pay Fee <ArrowRight size={18} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon blue">
            <IndianRupee />
          </div>
          <div>
            <p>Total Fees</p>
            <h2>₹123,000</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon green">
            <CheckCircle />
          </div>
          <div>
            <p>Paid</p>
            <h2>₹0</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon red">
            <AlertTriangle />
          </div>
          <div>
            <p>Pending</p>
            <h2>₹123,000</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon yellow">
            <Calendar />
          </div>
          <div>
            <p>Due Date</p>
            <h2>13/07/2026</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon blue">
            <BadgeCheck />
          </div>
          <div>
            <p>Scholarship</p>
            <h2>₹0</h2>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="progress-card">
        <div className="progress-header">
          <h3>Payment Progress</h3>
          <span>0%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: "0%" }}
          ></div>
        </div>

        <div className="progress-footer">
          <span>₹0 paid</span>
          <span>₹123,000 remaining</span>
        </div>
      </div>

      {/* Fee Details Table */}
      <div className="table-card">
        <h2>Fee Details</h2>

        <table>
          <thead>
            <tr>
              <th>Fee Head</th>
              <th>Due</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {feeDetails.map((fee, index) => (
              <tr key={index}>
                <td>{fee.feeHead}</td>
                <td>₹{fee.due.toLocaleString()}</td>
                <td className="paid">
                  ₹{fee.paid.toLocaleString()}
                </td>
                <td className="balance">
                  ₹{fee.balance.toLocaleString()}
                </td>
                <td>
                  <span className="status pending">
                    {fee.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;