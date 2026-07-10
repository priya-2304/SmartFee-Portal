import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile } from 'react-icons/fi';

const CsvUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a CSV file first');

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setResult(null);
    try {
      const res = await api.post('/admin/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(`${res.data.created} student(s) created`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CSV Upload — Bulk Student Onboarding</h1>

      <div className="card max-w-xl">
        <p className="text-sm text-gray-500 mb-4">
          CSV must include columns: <code className="text-xs">enrollmentNo, name, email, phone, branch, year, batch, password</code>.
          Each row is validated before being inserted; rows with missing required fields are skipped and reported below.
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
      </div>

      {result && (
        <div className="card max-w-xl">
          <h2 className="font-semibold mb-2">Upload Result</h2>
          <p className="text-sm">Total rows: {result.totalRows}</p>
          <p className="text-sm text-green-600">Created: {result.created}</p>
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
  );
};

export default CsvUploadPage;
