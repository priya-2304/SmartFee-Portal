import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { TableSkeleton } from '../components/Skeletons';
import { FiSearch, FiX, FiUser, FiAward, FiCreditCard, FiTrash2 } from 'react-icons/fi';

const AllStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); 
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', { params: q ? { search: q } : {} });
      setStudents(res.data.students);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchStudents(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openDetail = async (student) => {
    setSelected(student);
    setDetailLoading(true);
    try {
      const [feeRes, scholarRes] = await Promise.all([
        api.get(`/fees/student/${student._id}`),
        api.get('/admin/scholarships', { params: { studentId: student._id } }),
      ]);
      setDetail({ fees: feeRes.data, scholarships: scholarRes.data.scholarships });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Delete ${student.name} (${student.enrollmentNo})? This will permanently remove the student and all their fee, transaction, and scholarship records. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/students/${student._id}`);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      closeDetail();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">All Students</h1>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, enrollment no, email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="card">
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Enroll No.</th>
                  <th className="pb-2 hidden sm:table-cell">Branch / Year</th>
                  <th className="pb-2 hidden sm:table-cell">Email</th>
                  <th className="pb-2">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {students.map((s) => (
                  <tr
                    key={s._id}
                    onClick={() => openDetail(s)}
                    className="cursor-pointer hover:bg-primary-50/50 dark:hover:bg-gray-700/40"
                  >
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 font-mono text-xs">{s.enrollmentNo}</td>
                    <td className="py-3 hidden sm:table-cell text-gray-500">{s.branch} / Y{s.year}</td>
                    <td className="py-3 hidden sm:table-cell text-gray-500">{s.email}</td>
                    <td className={`py-3 font-semibold ${s.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{s.pendingAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-400">No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />
          <div className="relative w-full max-w-md h-full glass border-l border-white/30 dark:border-gray-700/50 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><FiUser /> {selected.name}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={deleting}
                  title="Delete student"
                  className="text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  <FiTrash2 size={18} />
                </button>
                <button onClick={closeDetail}><FiX size={20} /></button>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1 mb-4">
              <p>{selected.enrollmentNo} · {selected.branch} · Year {selected.year}</p>
              <p>{selected.email} {selected.phone ? `· ${selected.phone}` : ''}</p>
            </div>

            {detailLoading ? <p className="text-sm text-gray-400">Loading details...</p> : detail && (
              <>
                <div className="mb-5">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><FiCreditCard size={14} /> Fee Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="card !p-3"><p className="text-xs text-gray-500">Total</p><p className="font-bold">₹{detail.fees.summary.totalFees}</p></div>
                    <div className="card !p-3"><p className="text-xs text-gray-500">Paid</p><p className="font-bold text-green-600">₹{detail.fees.summary.paidFees}</p></div>
                    <div className="card !p-3"><p className="text-xs text-gray-500">Pending</p><p className="font-bold text-red-600">₹{detail.fees.summary.pendingFees}</p></div>
                    <div className="card !p-3"><p className="text-xs text-gray-500">Scholarship</p><p className="font-bold text-primary-600">₹{detail.fees.summary.scholarshipCredits}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><FiAward size={14} /> Scholarships</h3>
                  {detail.scholarships.length === 0 ? (
                    <p className="text-sm text-gray-400">No scholarships applied</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.scholarships.map((sc) => (
                        <div key={sc._id} className="card !p-3 text-sm flex justify-between">
                          <div>
                            <p className="font-medium capitalize">{sc.type}</p>
                            <p className="text-xs text-gray-500">{sc.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{sc.amount}</p>
                            <p className={`text-xs capitalize ${sc.status === 'approved' ? 'text-green-600' : sc.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>{sc.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllStudentsPage;