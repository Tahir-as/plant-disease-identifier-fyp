import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ── Base API URL — reads Vite env var or falls back to localhost ──────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Async thunk: upload image → POST /api/predict → return prediction ─────────
export const scanPlant = createAsyncThunk(
  'disease/scanPlant',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Retrieve JWT from localStorage if user is logged in
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE}/api/predict`, {
        method:  'POST',
        headers,          // no Content-Type — browser sets multipart boundary automatically
        body:    formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Prediction failed');
      }

      return data; // { disease, plant, label, confidence, is_healthy, top_results, solutions }
    } catch (err) {
      return rejectWithValue('Network error — could not reach the server.');
    }
  }
);

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  status:     'idle',       // 'idle' | 'uploading' | 'finished' | 'error'
  imageUrl:   null,         // local object URL for preview
  imageFile:  null,         // actual File object (not serialisable — stored outside Redux normally)
  disease:    null,         // primary disease name
  plant:      null,         // plant name
  label:      null,         // raw class label e.g. "Tomato___Early_blight"
  confidence: null,         // 0–1 float
  is_healthy: false,
  top_results: [],          // [{label, confidence}, …]
  solution: {               // multilingual treatment text
    en: '',
    ur: '',
    pa: '',
    sd: '',
  },
  language:   'en',
  error:      null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const diseaseSlice = createSlice({
  name: 'disease',
  initialState,
  reducers: {
    // Set language for result display
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    // Store local preview URL when user picks a file
    setImagePreview: (state, action) => {
      state.imageUrl  = action.payload;
      state.status    = 'idle';
      state.disease   = null;
      state.error     = null;
    },
    // Reset entire state (Scan Another button)
    resetState: () => initialState,
  },

  // ── Handle async thunk lifecycle ──────────────────────────────────────────
  extraReducers: (builder) => {
    builder
      .addCase(scanPlant.pending, (state) => {
        state.status = 'uploading';
        state.error  = null;
      })
      .addCase(scanPlant.fulfilled, (state, action) => {
        const p = action.payload;
        state.status      = 'finished';
        state.disease     = p.disease;
        state.plant       = p.plant;
        state.label       = p.label;
        state.confidence  = p.confidence;
        state.is_healthy  = p.is_healthy;
        state.top_results = p.top_results || [];
        state.solution    = p.solutions   || { en: '', ur: '', pa: '', sd: '' };
        state.error       = null;
      })
      .addCase(scanPlant.rejected, (state, action) => {
        state.status = 'error';
        state.error  = action.payload || 'Something went wrong';
      });
  },
});

export const { setLanguage, setImagePreview, resetState } = diseaseSlice.actions;

export default diseaseSlice.reducer;
