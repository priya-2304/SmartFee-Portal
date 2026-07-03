import { createSlice } from '@reduxjs/toolkit';

const initialDark = localStorage.getItem('smartfee_theme') === 'dark';
if (initialDark) document.documentElement.classList.add('dark');

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: initialDark,
    sidebarOpen: false,
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      document.documentElement.classList.toggle('dark', state.darkMode);
      localStorage.setItem('smartfee_theme', state.darkMode ? 'dark' : 'light');
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
  },
});

export const { toggleDarkMode, toggleSidebar, closeSidebar } = uiSlice.actions;
export default uiSlice.reducer;
