import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiUsers } from 'react-icons/fi';

const CsvUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const [studentFile, setStudentFile] = useState(null);
  const [studentUploading, setStudentUploading] = useState(false);
  const [studentResult, setStudentResult] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a CSV file first');

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setResult(null);
    try {
      const res = await api.post('/fees/structure/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(
        `${res.data.structuresCreated} fee structure(s) created, ${res.data.structuresUpdated} updated`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleStudentUpload = async (e) => {
    e.preventDefault();

    if (!studentFile) {
      return toast.error('Choose a Student CSV file first');
    }
    const formData = new FormData();
    formData.append('file', studentFile);

    setStudentUploading(true);
    setStudentResult(null);

    try {
     const res = await api.post('/admin/upload-csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
  setStudentResult(res.data);
      toast.success('Students uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Student upload failed');
    } finally {
      setStudentUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Batch CSV Upload</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       
        <div className="card">
          <h2 className="font-semibold mb-2">Assign Fee Structure</h2>
          <p className="text-sm text-gray-500 mb-4">
            CSV must include columns: <code className="text-xs">batch, branch, year, semester, feeHead, amount, dueDate</code>.
            Rows that share the same batch, branch, year and semester are grouped together into a single fee structure for that batch. 
          </p>
          <form onSubmit={handleUpload} className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-primary-400 transition-colors">
              <FiUploadCloud size={28} className="text-primary-600 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {file ? file.name : 'Click to select a .csv file'}
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <button type="submit" disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiFile /> {uploading ? 'Uploading...' : 'Upload & Validate'}
            </button>
          </form>

          {result && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-2 text-sm">Upload Result</h3>
              <p className="text-sm">Total rows: {result.totalRows}</p>
              <p className="text-sm">Batches processed: {result.batchesProcessed}</p>
              <p className="text-sm text-green-600">Fee structures created: {result.structuresCreated}</p>
              <p className="text-sm text-blue-600">Fee structures updated: {result.structuresUpdated}</p>
              {result.errors?.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-red-600 font-medium">Errors ({result.errors.length}):</p>
                  <ul className="text-xs text-red-500 list-disc pl-5 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Bulk Upload Students</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a CSV containing student records (name, roll number, batch, branch, year, semester, etc.)
            to create or update student profiles in bulk.Required columns: enrollmentNo, name, email, phone, branch, year, batch, password.
          </p>
          <form onSubmit={handleStudentUpload} className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-primary-400 transition-colors">
              <FiUsers size={28} className="text-primary-600 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {studentFile ? studentFile.name : 'Click to select a .csv file'}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setStudentFile(e.target.files[0])}
              />
            </label>
            <button
              type="submit"
              disabled={studentUploading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FiFile /> {studentUploading ? 'Uploading...' : 'Upload Students'}
            </button>
          </form>

          {studentResult && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-2 text-sm">Upload Result</h3>
              <p className="text-sm">Total rows: {studentResult.totalRows}</p>
              <p className="text-sm text-green-600">Students created: {studentResult.created}</p>
              <p className="text-sm text-blue-600">Students updated: {studentResult.updated}</p>
              {studentResult.warning && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <p className="text-sm text-amber-700 font-medium">⚠️ {studentResult.warning}</p>
                  {studentResult.noFeeStructure?.length > 0 && (
                    <ul className="text-xs text-amber-600 list-disc pl-5 mt-1 max-h-32 overflow-y-auto">
                      {studentResult.noFeeStructure.map((s, i) => (
                        <li key={i}>Row {s.row}: {s.enrollmentNo}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {studentResult.errors?.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-red-600 font-medium">Errors ({studentResult.errors.length}):</p>
                  <ul className="text-xs text-red-500 list-disc pl-5 max-h-40 overflow-y-auto">
                    {studentResult.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvUploadPage;