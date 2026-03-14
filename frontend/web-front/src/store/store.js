import { configureStore } from '@reduxjs/toolkit';
import diseaseReducer from './diseaseSlice';

export const store = configureStore({
  reducer: {
    disease: diseaseReducer,
  },
});
