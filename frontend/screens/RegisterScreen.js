import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  forest:      '#1B4332',
  forestMid:   '#2D6A4F',
  forestLight: '#40916C',
  mintPale:    '#D8F3DC',
  ochre:       '#D4A017',
  cream:       '#FDF8EE',
  creamDark:   '#F0E6CE',
  paper:       '#FEFCF7',
  text:        '#1A2E1C',
  textMid:     '#4A6741',
  textLight:   '#7A9E7E',
  white:       '#FFFFFF',
  red:         '#C0392B',
  redLight:    '#FADBD8',
};

const API_BASE = 'https://your-api.com/api';

export default function RegisterScreen({ navigation }) {
  const { t, isRTL, langCode } = useLanguage();

  // ── Step state: 1 = form, 2 = OTP ──────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Form fields ─────────────────────────────────────────────────────────
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [prefLang,  setPrefLang]  = useState(langCode);

  // ── OTP state ───────────────────────────────────────────────────────────
  const [otp,      setOtp]      = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(45);
  const otpRefs = useRef([]);

  // ── Loading ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!fullName.trim())        { Alert.alert('Error', 'Full name is required.');        return false; }
    if (!email.trim())           { Alert.alert('Error', 'Email or phone is required.');   return false; }
    if (password.length < 6)    { Alert.alert('Error', 'Password must be 6+ characters.'); return false; }
    return true;
  };

  // ── FR-01: Register user & request OTP ──────────────────────────────────
  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             fullName.trim(),
          email:            email.trim(),
          password,
          languagePreference: prefLang,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Move to OTP step — FR-02
        setStep(2);
        startOtpTimer();
      } else {
        Alert.alert('Registration Failed', data.message || 'Please try again.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP countdown ────────────────────────────────────────────────────────
  const startOtpTimer = () => {
    setOtpTimer(45);
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── FR-02: OTP input handler ─────────────────────────────────────────────
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    // Auto-focus next cell
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── FR-02: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Error', 'Enter all 6 digits.'); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token — FR-Security
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Success', t.registerSuccess, [
          { text: 'OK', onPress: () => navigation.replace('Dashboard') },
        ]);
      } else {
        Alert.alert('Invalid OTP', data.message || 'Incorrect code. Try again.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (otpTimer > 0) return;
    try {
      await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      startOtpTimer();
    } catch {
      Alert.alert('Error', 'Could not resend OTP.');
    }
  };

  // ════════════════════════════════════════════════════════════════
  // STEP 2 — OTP Verification
  // ════════════════════════════════════════════════════════════════
  if (step === 2) return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollCenter}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={styles.backText}>← {t.backBtn}</Text>
        </TouchableOpacity>

        <Text style={styles.otpEmoji}>📱</Text>
        <Text style={styles.otpTitle}>{t.otp}</Text>
        <Text style={styles.otpDesc}>{t.otpDesc}</Text>
        <Text style={styles.otpEmail}>{email}</Text>

        {/* OTP cells */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => (otpRefs.current[i] = ref)}
              style={[styles.otpCell, digit ? styles.otpCellFilled : null]}
              value={digit}
              onChangeText={v => handleOtpChange(v, i)}
              onKeyPress={e => handleOtpKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPrimaryText}>{t.continueBtn}</Text>
          }
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity onPress={handleResend} disabled={otpTimer > 0} style={styles.resendRow}>
          <Text style={[styles.resendText, otpTimer > 0 && styles.resendDisabled]}>
            {otpTimer > 0 ? `Resend code in 0:${String(otpTimer).padStart(2, '0')}` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ════════════════════════════════════════════════════════════════
  // STEP 1 — Registration Form
  // ════════════════════════════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtnWhite} onPress={() => navigation.goBack()}>
            <Text style={styles.backTextWhite}>← {t.backBtn}</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, isRTL && styles.rtl]}>{t.register}</Text>
          <Text style={[styles.heroSub,   isRTL && styles.rtl]}>{t.startJourney}</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.rtl]}>{t.fullName}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ahmad Khan"
              placeholderTextColor={C.textLight}
              autoCapitalize="words"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Email / Phone — FR-01 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.rtl]}>{t.email}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={email}
              onChangeText={setEmail}
              placeholder="+92 300 0000000 or email"
              placeholderTextColor={C.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.rtl]}>{t.password}</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, styles.passInput, isRTL && styles.inputRTL]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={C.textLight}
                secureTextEntry={!showPass}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language preference — FR-01, FR-11 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.rtl]}>{t.language}</Text>
            <View style={styles.langRow}>
              {[
                { code: 'en', flag: '🇬🇧', label: 'English' },
                { code: 'ur', flag: '🇵🇰', label: 'اردو' },
                { code: 'sd', flag: '🏴', label: 'سنڌي' },
                { code: 'pa', flag: '🏴', label: 'پنجابی' },
              ].map(l => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langChip, prefLang === l.code && styles.langChipActive]}
                  onPress={() => setPrefLang(l.code)}
                >
                  <Text style={styles.langChipFlag}>{l.flag}</Text>
                  <Text style={[styles.langChipText, prefLang === l.code && styles.langChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Terms note */}
          <Text style={styles.termsText}>
            By registering you agree to our Terms of Service and Privacy Policy.
          </Text>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>{t.register}</Text>
            }
          </TouchableOpacity>

          {/* Switch to Login */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t.hasAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>{t.login}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.forestLight },
  scroll: { flexGrow: 1 },
  scrollCenter: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: C.paper,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 36,
  },
  backBtnWhite: { marginBottom: 20 },
  backTextWhite: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroTitle: { color: C.white, fontSize: 30, fontWeight: '400', lineHeight: 38 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6 },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: C.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
  },

  // ── Inputs ──
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.creamDark,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.text,
  },
  inputRTL: { textAlign: 'right' },
  passWrap: {},
  passInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 18 },

  // ── Language chips ──
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.creamDark,
    backgroundColor: C.cream,
  },
  langChipActive: { borderColor: C.forestLight, backgroundColor: C.mintPale },
  langChipFlag: { fontSize: 16 },
  langChipText: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  langChipTextActive: { color: C.forest, fontWeight: '700' },

  // ── Terms ──
  termsText: {
    fontSize: 11,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    marginTop: 4,
  },

  // ── Buttons ──
  btnPrimary: {
    backgroundColor: C.forestMid,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // ── Switch ──
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: { fontSize: 14, color: C.textLight },
  switchLink: { fontSize: 14, color: C.forestMid, fontWeight: '700' },

  // ── OTP Screen ──
  backBtn: { alignSelf: 'flex-start', marginBottom: 32 },
  backText: { fontSize: 14, color: C.textMid, fontWeight: '600' },
  otpEmoji: { fontSize: 64, marginBottom: 16 },
  otpTitle: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 8 },
  otpDesc: { fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 4, lineHeight: 20 },
  otpEmail: { fontSize: 14, fontWeight: '700', color: C.forestMid, marginBottom: 32 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  otpCell: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: C.creamDark,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    backgroundColor: C.cream,
  },
  otpCellFilled: { borderColor: C.forestLight, backgroundColor: C.mintPale },
  resendRow: { marginTop: 20 },
  resendText: { fontSize: 14, color: C.forestMid, fontWeight: '600' },
  resendDisabled: { color: C.textLight },

  // ── RTL ──
  rtl: { textAlign: 'right' },
});
