import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const storedUser = localStorage.getItem('smartfee_user');

export const loginUser = createAsyncThunk('auth/login', async ({ enrollmentNo, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { enrollmentNo, password });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Request failed');
  }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Reset failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: localStorage.getItem('smartfee_token') || null,
    loading: false,
    error: null,
  },
 reducers: {
  logout: (state) => {
    state.user = null;
    state.token = null;
    localStorage.removeItem('smartfee_token');
    localStorage.removeItem('smartfee_user');
  },
  updateUser: (state, action) => {        // YE ADD KARO
    state.user = { ...state.user, ...action.payload };
    localStorage.setItem('smartfee_user', JSON.stringify(state.user));
  },
},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('smartfee_token', action.payload.token);
        localStorage.setItem('smartfee_user', JSON.stringify(action.payload.user));
        toast.success(`Welcome back, ${action.payload.user.name}!`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Login failed');
      })
      
      .addCase(forgotPassword.fulfilled, (state, action) => {
        toast.success(action.payload.message);
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        toast.error(action.payload || 'Request failed');
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        toast.success(action.payload.message);
      })
      .addCase(resetPassword.rejected, (state, action) => {
        toast.error(action.payload || 'Reset failed');
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
