import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api, { API_ORIGIN } from '../api/axios';
import toast from 'react-hot-toast';
import { updateUser } from '../store/slices/authSlice';  
import { FiCamera, FiUser, FiMail, FiPhone, FiBook, FiCalendar, FiTag } from 'react-icons/fi';
import { loginUser } from '../store/slices/authSlice';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data?.user) {
      dispatch(
      updateUser({
    phone: data.user.phone || null,
    profilePicUrl: data.user.profilePicUrl || null,
     }));
        setPhoneInput((prev) => prev || data.user.phone || '');
      }
    }).catch(() => {});
  }, []);

  const handleSavePhone = async () => {
    const cleaned = phoneInput.trim();
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setSavingPhone(true);
    try {
      const res = await api.put('/auth/update-profile', { phone: cleaned });
      dispatch(updateUser({ phone: res.data.phone }));
      toast.success('Phone number updated!');
      setEditingPhone(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => setPreview(reader.result);
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append('profilePic', file);
  setUploading(true);
  try {
    const res = await api.post('/auth/upload-profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    dispatch(updateUser({ profilePicUrl: res.data.profilePicUrl }));
    toast.success('Profile picture updated!');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Upload failed');
    setPreview(null);
  } finally {
    setUploading(false);
  }
};

 const picSrc =
  preview ||
  (user?.profilePicUrl
    ? user.profilePicUrl.startsWith("http")
      ? `${user.profilePicUrl}?t=${Date.now()}`
      : `${API_ORIGIN}${user.profilePicUrl}?t=${Date.now()}`
    : null);

  const fields = [
    { icon: FiUser,     label: 'Full Name',          value: user?.name },
    { icon: FiTag,      label: 'Enrollment Number',  value: user?.enrollmentNo },
    { icon: FiMail,     label: 'Email Address',       value: user?.email },
    { icon: FiBook,     label: 'Branch',              value: user?.branch },
    ...(user?.role === 'student'
      ? [
          { icon: FiCalendar, label: 'Year',  value: user?.year ? `Year ${user.year}` : '-' },
          { icon: FiCalendar, label: 'Batch', value: user?.batch },
        ]
      : []),
    { icon: FiTag,      label: 'Role',                value: user?.role },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold">My Profile</h1>

  
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
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG or WebP · Max 5 MB</p>
        </div>
      </div>

      {/* Details card */}
      <div className="card">
        <h2 className="font-semibold mb-4 text-sm text-gray-500 uppercase tracking-wide">Personal Information</h2>
        <dl className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700/60">
          {/* Phone Number — editable */}
          <div className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <FiPhone size={15} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-gray-400">Phone Number</dt>
              {editingPhone ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit phone number"
                    className="flex-1 border rounded-lg px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePhone}
                    disabled={savingPhone}
                    className="text-xs bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium"
                  >
                    {savingPhone ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPhone(false);
                      setPhoneInput(user?.phone || '');
                    }}
                    disabled={savingPhone}
                    className="text-xs text-gray-500 hover:underline px-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <dd className="text-sm font-medium truncate flex items-center gap-2">
                  {user?.phone || '—'}
                  <button
                    onClick={() => {
                      setPhoneInput(user?.phone || '');
                      setEditingPhone(true);
                    }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {user?.phone ? 'Edit' : 'Add phone number'}
                  </button>
                </dd>
              )}
            </div>
          </div>

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