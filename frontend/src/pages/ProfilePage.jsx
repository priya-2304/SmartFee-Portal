import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiCamera, FiUser, FiMail, FiPhone, FiBook, FiCalendar, FiTag } from 'react-icons/fi';
import { loginUser } from '../store/slices/authSlice';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview instantly
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to backend
    const formData = new FormData();
    formData.append('profilePic', file);
    setUploading(true);
    try {
      const res = await api.post('/auth/upload-profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update stored user with new profilePicUrl
      const updatedUser = { ...user, profilePicUrl: res.data.profilePicUrl };
      localStorage.setItem('smartfee_user', JSON.stringify(updatedUser));
      // Force a re-render by re-saving to redux state via a small trick
      window.dispatchEvent(new Event('storage'));
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const picSrc = preview
    || (user?.profilePicUrl ? `http://localhost:5000${user.profilePicUrl}` : null);

  const fields = [
    { icon: FiUser,     label: 'Full Name',          value: user?.name },
    { icon: FiTag,      label: 'Enrollment Number',  value: user?.enrollmentNo },
    { icon: FiMail,     label: 'Email Address',       value: user?.email },
    { icon: FiPhone,    label: 'Phone Number',        value: user?.phone || 'Not set' },
    { icon: FiBook,     label: 'Branch',              value: user?.branch },
    { icon: FiCalendar, label: 'Year',                value: user?.year ? `Year ${user.year}` : '-' },
    { icon: FiCalendar, label: 'Batch',               value: user?.batch },
    { icon: FiTag,      label: 'Role',                value: user?.role },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold">My Profile</h1>

      {/* Profile picture card */}
      <div className="card flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center shadow-md">
            {picSrc ? (
              <img src={picSrc} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary-600 dark:text-primary-300">
                {user?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          {/* Camera button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
            title="Change profile picture"
          >
            <FiCamera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name + info */}
        <div className="text-center sm:text-left">
          <p className="text-lg font-bold">{user?.name}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          <p className="text-xs text-gray-400 mt-1">{user?.enrollmentNo}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-3 text-xs text-primary-600 hover:underline disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Change profile picture'}
          </button>
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG or WebP · Max 2 MB</p>
        </div>
      </div>

      {/* Details card */}
      <div className="card">
        <h2 className="font-semibold mb-4 text-sm text-gray-500 uppercase tracking-wide">Personal Information</h2>
        <dl className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700/60">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="text-sm font-medium truncate">{value || '—'}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default ProfilePage;
