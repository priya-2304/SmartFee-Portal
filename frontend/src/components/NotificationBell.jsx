

import React, { useEffect, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import api from '../api/axios';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (e) {
     
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // har 30 sec me refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (e) {}
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 max-h-96 overflow-y-auto glass rounded-xl border border-white/30 dark:border-gray-700/50 shadow-lg z-40">
          <div className="px-4 py-2.5 border-b border-white/20 dark:border-gray-700/50 font-semibold text-sm">
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.read && handleMarkRead(n._id)}
                className={`px-4 py-2.5 text-sm border-b border-white/10 dark:border-gray-700/40 cursor-pointer ${
                  n.read ? 'text-gray-500 dark:text-gray-400' : 'font-medium text-gray-800 dark:text-gray-100 bg-primary-50/50 dark:bg-primary-900/10'
                }`}
              >
                <p>{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;