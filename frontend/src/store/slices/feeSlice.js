import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const fetchStudentFees = createAsyncThunk('fee/fetchStudentFees', async (studentId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/fees/student/${studentId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load fee details');
  }
});

export const fetchPaymentHistory = createAsyncThunk('fee/fetchPaymentHistory', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/payments/history');
    return data.transactions;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load history');
  }
});

export const initiatePayment = createAsyncThunk(
  'fee/initiatePayment',
  async ({ feePaymentId, amount, paymentMethod }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/payments/initiate', { feePaymentId, amount, paymentMethod });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not initiate payment');
    }
  }
);

export const verifyPayment = createAsyncThunk('fee/verifyPayment', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/payments/verify', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Payment verification failed');
  }
});

const feeSlice = createSlice({
  name: 'fee',
  initialState: {
    summary: null,
    feeHeads: [],
    history: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentFees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentFees.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.feeHeads = action.payload.feeHeads;
      })
      .addCase(fetchStudentFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        toast.error(action.payload);
      })
      .addCase(verifyPayment.fulfilled, (state) => {
        toast.success('Payment successful! Receipt is ready.');
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export default feeSlice.reducer;
