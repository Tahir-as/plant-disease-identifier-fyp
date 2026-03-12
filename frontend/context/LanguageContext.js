import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Translations (EN, UR, SD, PA) ───────────────────────────────────────────
export const TRANSLATIONS = {
  en: {
    code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr',
    t: {
      appName: 'PhytoScan', tagline: 'AI Plant Disease Detection',
      login: 'Sign In', register: 'Create Account',
      email: 'Email / Phone', password: 'Password', fullName: 'Full Name',
      forgotPass: 'Forgot Password?',
      noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
      welcomeBack: 'Welcome back', startJourney: 'Protect your crops today',
      dashboard: 'Dashboard', goodMorning: 'Good morning',
      farmer: 'Farmer', quickScan: 'Quick Scan',
      recentScans: 'Recent Scans', tips: 'Crop Tips',
      viewAll: 'View all', healthy: 'Healthy',
      scanPlant: 'Scan Plant', chooseMethod: 'Choose scan method',
      useCamera: 'Use Camera', uploadGallery: 'Upload from Gallery',
      analyzing: 'Analyzing plant...', processingAI: 'AI processing image',
      diagnosisResult: 'Diagnosis Result', confidence: 'Confidence',
      solution: 'Recommended Treatment', prevention: 'Prevention Tips',
      severity: 'Severity', low: 'Low', medium: 'Medium', high: 'High',
      rescan: 'Scan Again', saveResult: 'Save Result',
      history: 'Scan History', noHistory: 'No scans yet',
      noHistoryDesc: 'Your scan results will appear here',
      settings: 'Settings', language: 'Language', selectLanguage: 'Select Language',
      home: 'Home', scan: 'Scan', hist: 'History', lang: 'Language',
      logout: 'Log Out', profile: 'My Profile',
      diseaseFound: 'Disease Detected', plantHealthy: 'Plant is Healthy',
      tapToScan: 'Tap to begin scanning',
      totalScans: 'Total Scans', diseasesFound: 'Diseases Found', plantsHealthy: 'Healthy Plants',
      registerSuccess: 'Account created successfully!',
      otp: 'Verify OTP', otpDesc: 'Enter the 6-digit code sent to your phone',
      continueBtn: 'Continue', backBtn: 'Back',
      treatment: 'Treatment', organic: 'Organic', pesticide: 'Pesticide',
      langChanged: 'Language updated!',
    },
  },

  ur: {
    code: 'ur', label: 'اردو', flag: '🇵🇰', dir: 'rtl',
    t: {
      appName: 'فائٹو اسکین', tagline: 'پودوں کی بیماری کا پتہ لگائیں',
      login: 'سائن ان', register: 'اکاؤنٹ بنائیں',
      email: 'ای میل / فون', password: 'پاس ورڈ', fullName: 'پورا نام',
      forgotPass: 'پاس ورڈ بھول گئے؟',
      noAccount: 'اکاؤنٹ نہیں ہے؟', hasAccount: 'پہلے سے اکاؤنٹ ہے؟',
      welcomeBack: 'خوش آمدید', startJourney: 'آج اپنی فصل بچائیں',
      dashboard: 'ڈیش بورڈ', goodMorning: 'صبح بخیر',
      farmer: 'کسان', quickScan: 'فوری اسکین',
      recentScans: 'حالیہ اسکین', tips: 'فصل کی تجاویز',
      viewAll: 'سب دیکھیں', healthy: 'صحتمند',
      scanPlant: 'پودا اسکین کریں', chooseMethod: 'اسکین کا طریقہ منتخب کریں',
      useCamera: 'کیمرہ استعمال کریں', uploadGallery: 'گیلری سے اپلوڈ',
      analyzing: 'پودے کا تجزیہ ہو رہا ہے...', processingAI: 'AI تصویر پر کام کر رہی ہے',
      diagnosisResult: 'تشخیص کا نتیجہ', confidence: 'اعتماد',
      solution: 'تجویز کردہ علاج', prevention: 'احتیاطی تدابیر',
      severity: 'شدت', low: 'کم', medium: 'درمیانہ', high: 'زیادہ',
      rescan: 'دوبارہ اسکین', saveResult: 'نتیجہ محفوظ کریں',
      history: 'اسکین کی تاریخ', noHistory: 'ابھی تک کوئی اسکین نہیں',
      noHistoryDesc: 'آپ کے اسکین کے نتائج یہاں ظاہر ہوں گے',
      settings: 'ترتیبات', language: 'زبان', selectLanguage: 'زبان منتخب کریں',
      home: 'گھر', scan: 'اسکین', hist: 'تاریخ', lang: 'زبان',
      logout: 'لاگ آؤٹ', profile: 'میری پروفائل',
      diseaseFound: 'بیماری پائی گئی', plantHealthy: 'پودا صحتمند ہے',
      tapToScan: 'اسکین شروع کریں',
      totalScans: 'کل اسکین', diseasesFound: 'بیماریاں', plantsHealthy: 'صحتمند پودے',
      registerSuccess: 'اکاؤنٹ بن گیا!',
      otp: 'OTP تصدیق', otpDesc: 'آپ کے فون پر بھیجا گیا 6 ہندسوں کا کوڈ درج کریں',
      continueBtn: 'جاری رکھیں', backBtn: 'واپس',
      treatment: 'علاج', organic: 'قدرتی علاج', pesticide: 'کیڑے مار دوا',
      langChanged: 'زبان تبدیل ہو گئی!',
    },
  },

  sd: {
    code: 'sd', label: 'سنڌي', flag: '🏴', dir: 'rtl',
    t: {
      appName: 'فائيٽو اسڪين', tagline: 'ٻوٽن جي بيماري سڃاڻو',
      login: 'لاگ ان', register: 'اڪائونٽ ٺاهيو',
      email: 'اي ميل / فون', password: 'پاسورڊ', fullName: 'پورو نالو',
      forgotPass: 'پاسورڊ وساري ڇڏيو؟',
      noAccount: 'اڪائونٽ ناهي؟', hasAccount: 'اڳ ۾ اڪائونٽ آهي؟',
      welcomeBack: 'ڀلي آيا', startJourney: 'اڄ پنهنجي فصل بچايو',
      dashboard: 'ڊيش بورڊ', goodMorning: 'صبح جو سلام',
      farmer: 'هاري', quickScan: 'تڪڙو اسڪين',
      recentScans: 'تازيون اسڪين', tips: 'فصل جون صلاحون',
      viewAll: 'سڀ ڏسو', healthy: 'صحتمند',
      scanPlant: 'ٻوٽو اسڪين ڪريو', chooseMethod: 'اسڪين جو طريقو چونڊيو',
      useCamera: 'ڪئميرو استعمال ڪريو', uploadGallery: 'گيلري مان اپلوڊ',
      analyzing: 'ٻوٽي جو تجزيو ٿي رهيو آهي...', processingAI: 'AI تصوير تي ڪم ڪري رهي آهي',
      diagnosisResult: 'تشخيص جو نتيجو', confidence: 'اعتماد',
      solution: 'تجويز ڪيل علاج', prevention: 'احتياطي قدم',
      severity: 'شدت', low: 'گھٽ', medium: 'وچولو', high: 'وڌيڪ',
      rescan: 'ٻيهر اسڪين', saveResult: 'نتيجو محفوظ ڪريو',
      history: 'اسڪين جي تاريخ', noHistory: 'اڃان ڪا اسڪين ناهي',
      noHistoryDesc: 'توهان جي اسڪين جا نتيجا هتي ظاهر ٿيندا',
      settings: 'سيٽنگون', language: 'ٻولي', selectLanguage: 'ٻولي چونڊيو',
      home: 'گهر', scan: 'اسڪين', hist: 'تاريخ', lang: 'ٻولي',
      logout: 'لاگ آئوٽ', profile: 'منهنجو پروفائيل',
      diseaseFound: 'بيماري مليو', plantHealthy: 'ٻوٽو صحتمند آهي',
      tapToScan: 'اسڪين شروع ڪريو',
      totalScans: 'ڪل اسڪين', diseasesFound: 'بيماريون', plantsHealthy: 'صحتمند ٻوٽا',
      registerSuccess: 'اڪائونٽ ٺهي ويو!',
      otp: 'OTP تصديق', otpDesc: 'توهان جي فون تي موڪليل 6 انگن وارو ڪوڊ داخل ڪريو',
      continueBtn: 'جاري رکو', backBtn: 'واپس',
      treatment: 'علاج', organic: 'قدرتي علاج', pesticide: 'ڪيڙا مار دوا',
      langChanged: 'ٻولي تبديل ٿي وئي!',
    },
  },

  pa: {
    code: 'pa', label: 'پنجابی', flag: '🏴', dir: 'rtl',
    t: {
      appName: 'فائیٹو اسکین', tagline: 'بوٹیاں دی بیماری پچھانو',
      login: 'لاگ ان', register: 'اکاؤنٹ بناؤ',
      email: 'ای میل / فون', password: 'پاس ورڈ', fullName: 'پورا ناں',
      forgotPass: 'پاس ورڈ بھل گئے؟',
      noAccount: 'اکاؤنٹ نئیں؟', hasAccount: 'پہلاں اکاؤنٹ اے؟',
      welcomeBack: 'جی آیاں نوں', startJourney: 'اج اپنی فصل بچاؤ',
      dashboard: 'ڈیش بورڈ', goodMorning: 'ستِ سری اکال',
      farmer: 'کسان', quickScan: 'چھیتی اسکین',
      recentScans: 'تازیاں اسکین', tips: 'فصل دیاں صلاحاں',
      viewAll: 'سب ویکھو', healthy: 'صحتمند',
      scanPlant: 'بوٹا اسکین کرو', chooseMethod: 'اسکین دا طریقہ چنو',
      useCamera: 'کیمرہ ورتو', uploadGallery: 'گیلری توں اپلوڈ',
      analyzing: 'بوٹے دا تجزیہ ہو رہا اے...', processingAI: 'AI تصویر تے کم کر رہی اے',
      diagnosisResult: 'تشخیص دا نتیجہ', confidence: 'اعتماد',
      solution: 'سفارش ڈا علاج', prevention: 'احتیاطی قدم',
      severity: 'شدت', low: 'گھٹ', medium: 'وچکارا', high: 'بہت',
      rescan: 'مڑ اسکین', saveResult: 'نتیجہ محفوظ کرو',
      history: 'اسکین دی تاریخ', noHistory: 'ہالے کوئی اسکین نئیں',
      noHistoryDesc: 'تہاڈیاں اسکین دے نتیجے ایتھے آؤن گے',
      settings: 'سیٹنگاں', language: 'بولی', selectLanguage: 'بولی چنو',
      home: 'گھر', scan: 'اسکین', hist: 'تاریخ', lang: 'بولی',
      logout: 'لاگ آؤٹ', profile: 'میری پروفائل',
      diseaseFound: 'بیماری لبھی', plantHealthy: 'بوٹا صحتمند اے',
      tapToScan: 'اسکین شروع کرو',
      totalScans: 'کل اسکین', diseasesFound: 'بیماریاں', plantsHealthy: 'صحتمند بوٹے',
      registerSuccess: 'اکاؤنٹ بن گیا!',
      otp: 'OTP تصدیق', otpDesc: 'تہاڈے فون تے بھیجیا 6 ہندسیاں والا کوڈ پاؤ',
      continueBtn: 'جاری رکھو', backBtn: 'واپس',
      treatment: 'علاج', organic: 'قدرتی علاج', pesticide: 'کیڑے مار دوا',
      langChanged: 'بولی بدل گئی!',
    },
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [langCode, setLangCode] = useState('en');

  // Load persisted language — FR-11
  useEffect(() => {
    AsyncStorage.getItem('appLanguage').then(code => {
      if (code && TRANSLATIONS[code]) setLangCode(code);
    });
  }, []);

  const switchLanguage = async (code) => {
    if (!TRANSLATIONS[code]) return;
    setLangCode(code);
    await AsyncStorage.setItem('appLanguage', code);
  };

  const lang  = TRANSLATIONS[langCode];
  const isRTL = lang.dir === 'rtl';

  return (
    <LanguageContext.Provider value={{ langCode, lang, t: lang.t, isRTL, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageContext;
