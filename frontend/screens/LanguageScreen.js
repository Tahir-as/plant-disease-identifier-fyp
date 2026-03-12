import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useLanguage, TRANSLATIONS } from '../context/LanguageContext';

const C = {
  forest:      '#1B4332',
  forestMid:   '#2D6A4F',
  forestLight: '#40916C',
  mintPale:    '#D8F3DC',
  ochre:       '#D4A017',
  soil:        '#7B4F2E',
  cream:       '#FDF8EE',
  creamDark:   '#F0E6CE',
  paper:       '#FEFCF7',
  text:        '#1A2E1C',
  textMid:     '#4A6741',
  textLight:   '#7A9E7E',
  white:       '#FFFFFF',
  amberLight:  '#FEF9E7',
  ochreLight:  '#F3C95F',
};

const LANG_META = {
  en: { native: 'English',   region: 'International',     script: 'Latin',     rtl: false },
  ur: { native: 'اردو',      region: 'Pakistan (National)', script: 'Nastaliq', rtl: true  },
  sd: { native: 'سنڌي',     region: 'Sindh Province',    script: 'Nastaliq',   rtl: true  },
  pa: { native: 'پنجابی',    region: 'Punjab Province',   script: 'Nastaliq',   rtl: true  },
};

export default function LanguageScreen({ navigation }) {
  const { langCode, switchLanguage, t, isRTL } = useLanguage();
  const [selected, setSelected] = useState(langCode);
  const [toast,    setToast]    = useState(false);

  const handleSelect = async (code) => {
    if (code === selected) return;
    setSelected(code);
    await switchLanguage(code);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isRTL && styles.rtl]}>{t.language}</Text>
        <Text style={[styles.headerSub,   isRTL && styles.rtl]}>{t.selectLanguage}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>AVAILABLE LANGUAGES</Text>

        {Object.values(TRANSLATIONS).map((lang) => {
          const meta    = LANG_META[lang.code];
          const isActive = selected === lang.code;

          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langCard, isActive && styles.langCardActive]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.flagText}>{lang.flag}</Text>

              <View style={styles.langInfo}>
                <View style={styles.langNameRow}>
                  <Text style={[
                    styles.langNative,
                    meta.rtl && styles.rtlText,
                    isActive && styles.langNativeActive,
                  ]}>
                    {meta.native}
                  </Text>
                  <Text style={[styles.langEnglish, isActive && styles.langEnglishActive]}>
                    {lang.label !== meta.native ? lang.label : ''}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{meta.region}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{meta.script}</Text>
                  {meta.rtl && (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <View style={styles.rtlBadge}>
                        <Text style={styles.rtlBadgeText}>RTL</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Checkmark */}
              {isActive && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* RTL info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Urdu, Sindhi, and Punjabi use right-to-left (RTL) text layout. The entire app interface adapts automatically when you select these languages.
          </Text>
        </View>

        {/* Auto-detect note — FR-11 */}
        <View style={styles.autoCard}>
          <Text style={styles.autoTitle}>⚙️ Auto-Detection</Text>
          <Text style={styles.autoText}>
            Language is automatically detected from your device locale on first launch. You can override it here anytime.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Toast notification */}
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {t.langChanged}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  // ── Header ──
  header: {
    backgroundColor: C.soil,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 28,
  },
  headerTitle: { color: C.white, fontSize: 24, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },

  // ── Content ──
  content: { padding: 20, flexGrow: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // ── Language card ──
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: C.creamDark,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  langCardActive: {
    borderColor: C.forestLight,
    backgroundColor: C.mintPale,
  },
  flagText: { fontSize: 36 },
  langInfo: { flex: 1 },
  langNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  langNative: { fontSize: 18, fontWeight: '700', color: C.text },
  langNativeActive: { color: C.forest },
  rtlText: { textAlign: 'right' },
  langEnglish: { fontSize: 13, color: C.textLight, fontWeight: '500' },
  langEnglishActive: { color: C.textMid },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: C.textLight },
  metaDot: { fontSize: 11, color: C.textLight },
  rtlBadge: {
    backgroundColor: '#E8F0FE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  rtlBadgeText: { fontSize: 10, color: '#1967D2', fontWeight: '700' },

  // Checkmark
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: C.forestMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: C.white, fontSize: 13, fontWeight: '700' },

  // ── Info cards ──
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: C.amberLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.ochreLight,
    marginTop: 8,
    marginBottom: 10,
  },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 12, color: '#7D5A08', lineHeight: 18 },

  autoCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.creamDark,
  },
  autoTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  autoText: { fontSize: 12, color: C.textMid, lineHeight: 18 },

  // ── Toast ──
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: C.forest,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: { color: C.white, fontWeight: '700', fontSize: 14 },

  // ── RTL ──
  rtl: { textAlign: 'right' },
});
