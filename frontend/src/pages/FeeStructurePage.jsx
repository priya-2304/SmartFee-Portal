import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/Skeletons';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiSearch, FiUserCheck, FiUserPlus } from 'react-icons/fi';

const FEE_HEAD_OPTIONS = ['Tuition Fee', 'Hostel Fee', 'Bus Fee', 'Exam Fee', 'Library Fee'];

const emptyForm = {
  batch: '',
  branch: '',
  year: 1,
  semester: 1,
  dueDate: '',
  feeHeads: FEE_HEAD_OPTIONS.map((name) => ({ name, amount: 0 })),
};

const emptyIndividualForm = {
  semester: 1,
  feeHeads: FEE_HEAD_OPTIONS.map((name) => ({ name, amount: 0 })),
};

const FeeStructurePage = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Individual (per-student) fee add state
  const [showIndividualForm, setShowIndividualForm] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [individualForm, setIndividualForm] = useState(emptyIndividualForm);
  const [savingIndividual, setSavingIndividual] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/fees/structure')
      .then((res) => setStructures(res.data.structures))
      .catch(() => toast.error('Failed to load fee structures'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      batch: s.batch,
      branch: s.branch,
      year: s.year,
      semester: s.semester,
      dueDate: s.dueDate ? s.dueDate.slice(0, 10) : '',
      feeHeads: FEE_HEAD_OPTIONS.map((name) => {
        const existing = s.feeHeads.find((h) => h.name === name);
        return { name, amount: existing ? existing.amount : 0 };
      }),
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const updateHeadAmount = (name, amount) => {
    setForm((prev) => ({
      ...prev,
      feeHeads: prev.feeHeads.map((h) => (h.name === name ? { ...h, amount: Number(amount) || 0 } : h)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      batch: form.batch,
      branch: form.branch,
      year: Number(form.year),
      semester: Number(form.semester),
      dueDate: form.dueDate,
      feeHeads: form.feeHeads.filter((h) => h.amount > 0),
    };

    try {
      if (editingId) {
        await api.put(`/fees/structure/${editingId}`, payload);
        toast.success('Fee structure updated');
      } else {
        await api.post('/fees/structure', payload);
        toast.success('Fee structure created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee structure? This cannot be undone.')) return;
    try {
      await api.delete(`/fees/structure/${id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const openIndividualForm = () => {
    setStudentQuery('');
    setStudentResults([]);
    setSelectedStudent(null);
    setIndividualForm(emptyIndividualForm);
    setShowIndividualForm(true);
  };

  const handleStudentSearch = async (e) => {
    e.preventDefault();
    if (studentQuery.trim().length < 2) {
      toast.error('Type at least 2 characters');
      return;
    }
    setSearchingStudent(true);
    try {
      const { data } = await api.get('/admin/students/search', { params: { q: studentQuery.trim() } });
      setStudentResults(data.students || []);
      if ((data.students || []).length === 0) toast.error('No student found');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setSearchingStudent(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentResults([]);
  };

  const updateIndividualHeadAmount = (name, amount) => {
    setIndividualForm((prev) => ({
      ...prev,
      feeHeads: prev.feeHeads.map((h) => (h.name === name ? { ...h, amount: Number(amount) || 0 } : h)),
    }));
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const payload = {
      semester: Number(individualForm.semester),
      feeHeads: individualForm.feeHeads.filter((h) => h.amount > 0),
    };

    if (payload.feeHeads.length === 0) {
      toast.error('Enter at least one fee head amount');
      return;
    }

    setSavingIndividual(true);
    try {
      await api.post(`/fees/student/${selectedStudent._id}/add-fee`, payload);
      toast.success(`Fee added for ${selectedStudent.name} (Semester ${payload.semester})`);
      setShowIndividualForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add fee');
    } finally {
      setSavingIndividual(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Fee Structure Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={openIndividualForm} className="btn-primary flex items-center gap-2 text-sm">
            <FiUserPlus /> Add Individual Fee
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <FiPlus /> New Fee Structure
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="py-2">Batch</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Total Amount</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => (
                <tr key={s._id} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-2">{s.batch}</td>
                  <td>{s.branch}</td>
                  <td>{s.year}</td>
                  <td>Sem {s.semester}</td>
                  <td>Rs. {s.totalAmount?.toLocaleString()}</td>
                  <td>{new Date(s.dueDate).toDateString()}</td>
                  <td className="flex gap-3">
                    <button onClick={() => openEdit(s)} className="text-primary-600 hover:underline flex items-center gap-1">
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:underline flex items-center gap-1">
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && structures.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">No fee structures created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit fee structure modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editingId ? 'Edit' : 'Create'} Fee Structure</h2>
              <button onClick={() => setShowForm(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Batch</label>
                  <input className="input-field" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="2023-2027" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Branch</label>
                  <input className="input-field" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="CSE" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input type="number" min={1} max={5} className="input-field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Semester</label>
                  <input type="number" min={1} max={8} className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fee Heads (₹)</label>
                <div className="space-y-2">
                  {form.feeHeads.map((h) => (
                    <div key={h.name} className="flex items-center gap-3">
                      <span className="w-32 text-sm">{h.name}</span>
                      <input
                        type="number"
                        min={0}
                        className="input-field"
                        value={h.amount}
                        onChange={(e) => updateHeadAmount(h.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : editingId ? 'Update Structure' : 'Create Structure'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Individual Student Fee modal */}
      {showIndividualForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Add Individual Fee</h2>
              <button onClick={() => setShowIndividualForm(false)}><FiX /></button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Find Student</label>
              <form onSubmit={handleStudentSearch} className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Enrollment no, name, or email"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
                <button type="submit" disabled={searchingStudent} className="btn-primary flex items-center gap-2 px-4">
                  <FiSearch size={15} /> {searchingStudent ? '...' : 'Search'}
                </button>
              </form>

              {studentResults.length > 0 && (
                <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-700/50 border rounded-xl dark:border-gray-700 overflow-hidden">
                  {studentResults.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => selectStudent(s)}
                      className="w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-700/60 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {s.enrollmentNo} &bull; {s.branch} &bull; Year {s.year} &bull; Batch {s.batch}
                        </p>
                      </div>
                      <FiUserCheck className="text-primary-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <>
                <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <div>
                    <p className="text-sm font-semibold">{selectedStudent.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedStudent.enrollmentNo} &bull; {selectedStudent.branch} &bull; Batch {selectedStudent.batch}
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedStudent(null)} className="text-xs text-gray-500 hover:text-red-600">
                    Change
                  </button>
                </div>

                <form onSubmit={handleIndividualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      className="input-field w-32"
                      value={individualForm.semester}
                      onChange={(e) => setIndividualForm({ ...individualForm, semester: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Fee Heads (₹)</label>
                    <div className="space-y-2">
                      {individualForm.feeHeads.map((h) => (
                        <div key={h.name} className="flex items-center gap-3">
                          <span className="w-32 text-sm">{h.name}</span>
                          <input
                            type="number"
                            min={0}
                            className="input-field"
                            value={h.amount}
                            onChange={(e) => updateIndividualHeadAmount(h.name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={savingIndividual} className="btn-primary w-full">
                    {savingIndividual ? 'Adding...' : 'Add Fee for This Student'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructurePage;