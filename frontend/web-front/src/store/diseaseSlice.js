import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'idle', // 'idle' | 'uploading' | 'finished'
  imageUrl: null,
  disease: null,
  solution: {
    en: '',
    ur: '',
    pa: '',
    sd: ''
  },
  language: 'en', // default language
};

const diseaseSlice = createSlice({
  name: 'disease',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    uploadImage: (state, action) => {
      state.status = 'uploading';
      state.imageUrl = action.payload.imageUrl;
      
      // Simulate API call processing
      // In a real application, this would be handled by an async thunk
      state.status = 'finished';
      
      // Mock Data
      state.disease = "Tomato Early Blight";
      state.solution = {
        en: "Remove infected lower leaves. Apply copper-based fungicide to protect healthy foliage. Ensure good air circulation.",
        ur: "متاثرہ نچلے پتوں کو ہٹا دیں۔ صحت مند پتوں کی حفاظت کے لیے تانبے پر مبنی فنگسائڈ استعمال کریں۔ اچھی ہوا کی گردش کو یقینی بنائیں۔",
        pa: "ਪ੍ਰਭਾਵਿਤ ਹੇਠਲੇ ਪੱਤਿਆਂ ਨੂੰ ਹਟਾਓ। ਸਿਹਤਮੰਦ ਪੱਤਿਆਂ ਦੀ ਰੱਖਿਆ ਲਈ ਤਾਂਬੇ-ਅਧਾਰਤ ਫੰਗਸਾਈਡ ਲਾਗੂ ਕਰੋ। ਹਵਾ ਦੇ ਚੰਗੇ ਗੇੜ ਨੂੰ ਯਕੀਨੀ ਬਣਾਓ।",
        sd: "متاثر ٿيل هيٺين پنن کي هٽايو. صحتمند پنن جي حفاظت لاءِ ٽامي تي ٻڌل فنگسائڊ استعمال ڪريو. سٺي هوا جي گردش کي يقيني بڻايو."
      };
    },
    resetState: (state) => {
      state.status = 'idle';
      state.imageUrl = null;
      state.disease = null;
      state.solution = { en: '', ur: '', pa: '', sd: '' };
    }
  }
});

export const { setLanguage, uploadImage, resetState } = diseaseSlice.actions;

export default diseaseSlice.reducer;
