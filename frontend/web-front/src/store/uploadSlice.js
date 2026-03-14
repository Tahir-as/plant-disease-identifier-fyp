import { createSlice } from '@reduxjs/toolkit';

// Define the initial state for the upload feature
const initialState = {
  selectedImage: null, // Stores the URL or data of the selected image
  isScanning: false,   // Boolean flag to show loading state during analysis
  scanResult: null,    // Stores the prediction/result from the backend
  error: null,         // Stores any error messages that occur during scanning
};

// Create a Redux slice which automatically generates action creators and action types
const uploadSlice = createSlice({
  name: 'upload', // Name of the slice used in action types
  initialState,   // The initial state defined above
  reducers: {
    // Action to set the currently selected image
    setImage: (state, action) => {
      state.selectedImage = action.payload; // action.payload contains the image data
      state.scanResult = null; // Clear any previous results when a new image is selected
      state.error = null;      // Clear any previous errors
    },
    // Action to reset/clear the image and results
    clearImage: (state) => {
      state.selectedImage = null;
      state.scanResult = null;
      state.error = null;
    },
    // Action to mark the scanning process as started
    startScanning: (state) => {
      state.isScanning = true;
      state.error = null;
    },
    // Action to save the result once scanning finishes
    setScanResult: (state, action) => {
      state.isScanning = false;           // Turn off loading state
      state.scanResult = action.payload;  // Save the result data
    },
    // Action to save an error if scanning fails
    setScanError: (state, action) => {
      state.isScanning = false;         // Turn off loading state
      state.error = action.payload;     // Save the error message
    },
  },
});

// Export the automatically generated action creators for use in components
export const {
  setImage,
  clearImage,
  startScanning,
  setScanResult,
  setScanError,
} = uploadSlice.actions;

// Export the reducer to be included in the main store configuration
export default uploadSlice.reducer;
