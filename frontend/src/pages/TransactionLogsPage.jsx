import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { TableSkeleton } from '../components/Skeletons';

const TransactionLogsPage = () => {
  const [studentId, setStudentId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/history', { params: studentId ? { studentId } : {} });
     setTransactions(res.data.transactions || []);
console.log("TRANSACTIONS:", res.data.transactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

 const handleDelete = async (id) => {
  try {
    await api.delete(`/payments/${id}`);
    load();

  } catch (error) {
    console.log("Delete Error:", error);
  }

};

  const filtered = transactions.filter((t) => statusFilter === 'all' || t.status === statusFilter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transaction Logs</h1>

      <div className="card flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Student ID</label>
          <input className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Enrollment No / Name"/>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="success" >Success</option>
            <option value="failed">Failed</option>
            <option value="initiated">Initiated</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <button onClick={load} className="btn-primary">Search</button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="py-2">Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Gateway Ref</th>
                <th>Status</th>
                <th>Action</th>            
                  </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
                 <td>
                 <div className="font-medium">
                   {t.studentId?.name}
                       </div>

                      <div className="text-xs text-gray-500">
                        {t.studentId?.enrollmentNo}
                      </div>
                    </td>
                  <td>Rs. {t.amount.toLocaleString()}</td>
                  <td className="capitalize">{t.paymentMethod}</td>
                  <td className="font-mono text-xs">{t.gatewayReference}</td>
                  <td>
  <span
    className={
      t.status === "success"
      ? "px-3 py-1 rounded-full text-xs bg-green-100 text-green-700"
      : t.status === "failed"
      ? "px-3 py-1 rounded-full text-xs bg-red-100 text-red-700"
      : "px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700"
    }
  >
    {t.status}
  </span>
</td>
<td>
  {t.status !== "success" && (
    <button
      onClick={() => handleDelete(t._id)}
      className="text-red-600 hover:text-red-800 font-medium"
    >
      Delete
    </button>
  )}
</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionLogsPage;