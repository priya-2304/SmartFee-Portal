import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { TableSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';
import { FiMail, FiSend , FiSearch } from 'react-icons/fi';

const DefaultersPage = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/accounts/defaulters')
      .then((res) => setDefaulters(res.data.defaulters))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === defaulters.length ? [] : defaulters.map((d) => d.studentId));

  const filteredDefaulters = defaulters.filter((d) => {
  const q = search.toLowerCase();
  return (
    d.name.toLowerCase().includes(q) ||
    d.enrollmentNo.toLowerCase().includes(q) ||
    d.branch.toLowerCase().includes(q)
  );
});

  const sendSingle = async (id) => {
    try {
      await api.post('/notifications/bulk-reminder', { studentIds: [id] });
      toast.success('Reminder sent');
    } catch { toast.error('Failed'); }
  };

  const sendBulk = async () => {
    if (!selected.length) return toast.error('Select at least one student');
    try {
      const res = await api.post('/notifications/bulk-reminder', { studentIds: selected });
      toast.success(res.data.message);
      setSelected([]);
    } catch { toast.error('Failed to send reminders'); }
  };

  return (
    <div className="space-y-5">
     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <h1 className="text-xl sm:text-2xl font-bold">Defaulters</h1>
  <div className="flex items-center gap-2 flex-wrap">
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, enroll no, branch..."
        className="pl-8 pr-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
      />
    </div>
    <button onClick={sendBulk} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
      <FiSend size={15} /> Bulk Reminders
    </button>
  </div>
</div>

      {loading ? <TableSkeleton /> : (
        <div className="card">
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-2 w-8">
                    <input type="checkbox"
                      checked={selected.length === defaulters.length && defaulters.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Enroll No.</th>
                  <th className="pb-2 hidden sm:table-cell">Branch</th>
                  <th className="pb-2">Pending</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredDefaulters.map((d) => (
                    <tr key={d.studentId}>
                    <td className="py-3"><input type="checkbox" checked={selected.includes(d.studentId)} onChange={() => toggle(d.studentId)} /></td>
                    <td className="py-3 font-medium">{d.name}</td>
                    <td className="py-3 font-mono text-xs">{d.enrollmentNo}</td>
                    <td className="py-3 hidden sm:table-cell text-gray-500">{d.branch}</td>
                    <td className="py-3 text-red-600 font-semibold">₹{d.pendingAmount.toLocaleString()}</td>
                    <td className="py-3">
                      <button onClick={() => sendSingle(d.studentId)} className="text-primary-600 hover:underline flex items-center gap-1 text-xs">
                        <FiMail size={13} /> Remind
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDefaulters.length === 0 && (
  <tr><td colSpan={6} className="py-10 text-center text-gray-400">No defaulters found 🎉</td></tr>
)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefaultersPage;