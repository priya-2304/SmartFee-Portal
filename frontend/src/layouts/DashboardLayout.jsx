import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiHome, FiCreditCard, FiClock, FiFileText, FiUsers, 
  FiSettings, FiUser, FiLogOut, FiSun, FiMoon, FiMenu, FiX,
  FiBarChart2, FiAlertCircle,FiAward,FiUserPlus , FiUploadCloud,
} from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import { toggleDarkMode, toggleSidebar, closeSidebar } from '../store/slices/uiSlice';
import NotificationBell from '../components/NotificationBell';
import { API_ORIGIN } from '../api/axios';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/pay-fee', label: 'Pay Fee', icon: FiCreditCard },
  { to: '/scholarships', label: 'Scholarships', icon: FiAward },
  { to: '/payment-history', label: 'Payment History', icon: FiClock },
  { to: '/profile', label: 'Profile', icon: FiUser },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

const staffLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiBarChart2 },
   { to: '/admin/students', label: 'Students', icon: FiUsers },
  { to: '/admin/defaulters', label: 'Defaulters', icon: FiAlertCircle },
  { to: '/admin/scholarships', label: 'Scholarships', icon: FiAward },
  { to: '/admin/fee-structure', label: 'Fee Structure', icon: FiFileText , adminOnly: true },
  { to: '/admin/csv-upload', label: 'CSV Upload', icon: FiUploadCloud, adminOnly: true },
  { to: '/admin/transactions', label: 'Transactions', icon: FiUsers , adminOnly: true },
  { to: '/admin/staff', label: 'Manage Staff', icon: FiUserPlus, adminOnly: true },
  { to: '/profile', label: 'Profile', icon: FiUser },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { darkMode, sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();

 const links = user?.role === 'student'
  ? studentLinks
  : staffLinks.filter((l) => !l.adminOnly || user?.role === 'admin');
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen z-30 inset-y-0 left-0 w-64 flex-shrink-0 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out glass border-r border-white/30 dark:border-gray-700/50 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/50">
          <div>
            <span className="text-base font-bold text-primary-700 dark:text-primary-300 block leading-tight">
              SmartFee
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Portal</span>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => dispatch(closeSidebar())}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => dispatch(closeSidebar())}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700/60 hover:text-primary-700 dark:hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/20 dark:border-gray-700/50 space-y-1">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-gray-700/60 transition-colors text-left"
            title="View Profile"
          >
            {user?.profilePicUrl ? (
              <img src={user.profilePicUrl?.startsWith('http')? user.profilePicUrl:`${API_ORIGIN}${user.profilePicUrl}?t=${Date.now()}`} alt="" className="w-8 h-8 rounded-full object-cover" />):(
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:max-h-screen lg:overflow-y-auto">
        {/* Top bar */}
        <header className="glass sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-gray-700/50">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={() => dispatch(toggleSidebar())}
          >
            <FiMenu size={20} />
          </button>

          <div className="hidden lg:block font-semibold text-sm capitalize text-gray-700 dark:text-gray-200">
            {user?.role} Portal
          </div>

          {/* Mobile: show app name in center */}
          <div className="lg:hidden font-bold text-sm text-primary-700 dark:text-primary-300 absolute left-1/2 -translate-x-1/2">
            SmartFee Portal
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <NotificationBell />
            <button
              onClick={() => navigate('/profile')}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400"
              title="View Profile"
              aria-label="View Profile"
            >
              {user?.profilePicUrl ? (
                <img
                 src={user.profilePicUrl?.startsWith('http') ? user.profilePicUrl : `${API_ORIGIN}${user.profilePicUrl}?t=${Date.now()}`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary-200 hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;