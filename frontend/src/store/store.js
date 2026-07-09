import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feeReducer from './slices/feeSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fee: feeReducer,
    ui: uiReducer,
  },
});


// export default store;