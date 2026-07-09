import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../store/slices/uiSlice';
import api from '../api/axios';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.role === 'student') {
      api.get('/notifications').then((res) => setNotifications(res.data.notifications));
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium">Dark Mode</p>
          <p className="text-sm text-gray-500">Toggle between light and dark theme</p>
        </div>
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              darkMode ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {user?.role === 'student' && (
        <div className="card">
          <p className="font-medium mb-3">Recent Notifications</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
            {notifications.map((n) => (
              <div key={n._id} className={`text-sm p-2 rounded-lg ${n.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-primary-50 dark:bg-primary-900/30'}`}>
                <p>{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;