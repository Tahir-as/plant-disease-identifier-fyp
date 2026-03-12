import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── i18n helper ─────────────────────────────────────────────────────────────
import { useLanguage } from '../context/LanguageContext';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  forest:      '#1B4332',
  forestMid:   '#2D6A4F',
  forestLight: '#40916C',
  mint:        '#74C69D',
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
};

// ─── API base URL (update to your backend) ───────────────────────────────────
const API_BASE = 'https://your-api.com/api';

export default function LoginScreen({ navigation }) {
  const { t, isRTL } = useLanguage();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── FR-03: Authenticate user and redirect to Dashboard ──────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token (FR-Security: JWT sessions)
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── FR-02: Social login ──────────────────────────────────────────────────
  const handleSocialLogin = (provider) => {
    Alert.alert(`${provider} Login`, `${provider} OAuth flow would launch here.`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🌱</Text>
            </View>
            <Text style={styles.appName}>PhytoScan</Text>
          </View>
          <Text style={[styles.heroTitle, isRTL && styles.rtl]}>{t.welcomeBack}</Text>
          <Text style={[styles.heroSub,   isRTL && styles.rtl]}>{t.startJourney}</Text>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, isRTL && styles.rtl]}>{t.login}</Text>

          {/* Email / Phone — FR-01 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.rtl]}>{t.email}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
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
                placeholder="••••••••"
                placeholderTextColor={C.textLight}
                secureTextEntry={!showPass}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={[styles.forgotRow, isRTL && styles.forgotRowRTL]}>
            <Text style={styles.forgotText}>{t.forgotPass}</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnPrimaryText}>{t.login}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social login — FR-02 */}
          <View style={styles.socialRow}>
            {['Google', 'Facebook'].map(provider => (
              <TouchableOpacity
                key={provider}
                style={styles.socialBtn}
                onPress={() => handleSocialLogin(provider)}
                activeOpacity={0.8}
              >
                <Text style={styles.socialBtnText}>
                  {provider === 'Google' ? '🇬 ' : '🇫 '}{provider}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Go to Register */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t.noAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>{t.register}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.forest,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ──
  hero: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 48,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 24 },
  appName: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: C.white,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 42,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    marginTop: 6,
  },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: C.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
    minHeight: 500,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 28,
  },

  // ── Inputs ──
  inputGroup: { marginBottom: 16 },
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
  passWrap: { position: 'relative' },
  passInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },

  // ── Forgot ──
  forgotRow: { alignItems: 'flex-end', marginBottom: 24 },
  forgotRowRTL: { alignItems: 'flex-start' },
  forgotText: { color: C.forestLight, fontSize: 13, fontWeight: '600' },

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
  btnPrimaryText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.creamDark },
  dividerText: { fontSize: 12, color: C.textLight, fontWeight: '500' },

  // ── Social ──
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.creamDark,
    backgroundColor: C.white,
    alignItems: 'center',
  },
  socialBtnText: { fontSize: 13, fontWeight: '600', color: C.textMid },

  // ── Switch ──
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  switchText: { fontSize: 14, color: C.textLight },
  switchLink: { fontSize: 14, color: C.forestMid, fontWeight: '700' },

  // ── RTL ──
  rtl: { textAlign: 'right' },
});
