import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Share,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  redLight:    '#FADBD8',
  amber:       '#E67E22',
  amberLight:  '#FEF9E7',
};

const API_BASE = 'https://your-api.com/api';

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY = {
  high:    { color: C.red,         bg: C.redLight,    label: 'High',   dot: '🔴' },
  medium:  { color: C.amber,       bg: C.amberLight,  label: 'Medium', dot: '🟡' },
  low:     { color: C.forestLight, bg: C.mintPale,    label: 'Low',    dot: '🟢' },
  healthy: { color: C.forest,      bg: C.mintPale,    label: 'Healthy',dot: '✅' },
};

// ── Animated confidence bar ───────────────────────────────────────────────────
function ConfidenceBar({ value, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View style={styles.barWrap}>
      <Animated.View
        style={[
          styles.barFill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export default function ResultScreen({ route, navigation }) {
  const { t, isRTL } = useLanguage();

  // ── Accept result from Scanner or scan history ──────────────────────────
  const { result: passedResult, scanId, imageUri } = route.params || {};

  const [result,    setResult]    = useState(passedResult || null);
  const [loading,   setLoading]   = useState(!passedResult);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [activeTab, setActiveTab] = useState('treatment');

  // ── FR-06, FR-07: Fetch result if arriving via scanId only ───────────────
  useEffect(() => {
    if (!passedResult && scanId) fetchResult();
  }, [scanId]);

  const fetchResult = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res   = await fetch(`${API_BASE}/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setResult(data.scan);
    } catch {
      Alert.alert('Error', 'Could not load result.');
    } finally {
      setLoading(false);
    }
  };

  // ── FR-14: Save scan to history ───────────────────────────────────────────
  const handleSave = async () => {
    if (saved || !result) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res   = await fetch(`${API_BASE}/scans/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diseaseName:   result.diseaseName,
          plantName:     result.plantName,
          confidence:    result.confidence,
          severity:      result.severity,
          healthy:       result.healthy,
          treatment:     result.treatment,
          prevention:    result.prevention,
          organicRemedy: result.organicRemedy,
          imageUri,
        }),
      });
      if (res.ok) {
        setSaved(true);
        Alert.alert('Saved', 'Result saved to your scan history.');
      } else {
        Alert.alert('Error', 'Could not save result.');
      }
    } catch {
      Alert.alert('Network Error', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Share result ──────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `PhytoScan Result 🌿\n\nPlant: ${result.plantName}\nDisease: ${result.diseaseName}\nConfidence: ${result.confidence}%\nSeverity: ${result.severity}\n\nTreatment: ${result.treatment}\n\nScanned with PhytoScan App`,
        title: 'Plant Disease Diagnosis',
      });
    } catch {}
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={C.forestLight} />
      <Text style={styles.loadingText}>Loading result...</Text>
    </View>
  );

  if (!result) return (
    <View style={styles.loadingScreen}>
      <Text style={styles.loadingText}>No result found.</Text>
      <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Scanner')}>
        <Text style={styles.btnPrimaryText}>{t.rescan}</Text>
      </TouchableOpacity>
    </View>
  );

  const sev     = result.healthy ? 'healthy' : (result.severity || 'medium');
  const sevConf = SEVERITY[sev] || SEVERITY.medium;

  const TABS = [
    { key: 'treatment',   label: t.treatment,  icon: '💊', content: result.treatment     },
    { key: 'organic',     label: t.organic,    icon: '🌿', content: result.organicRemedy },
    { key: 'prevention',  label: t.prevention, icon: '🛡️', content: result.prevention    },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── FR-07: Disease name + plant type header ── */}
      <View style={[
        styles.header,
        { backgroundColor: result.healthy ? C.forestMid : C.red },
      ]}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareText}>↑ Share</Text>
        </TouchableOpacity>

        {/* Plant + Status */}
        <View style={styles.headerBody}>
          <View style={[styles.plantIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text style={styles.plantIconText}>{result.icon || '🌿'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.plantLabel}>{result.plantName || 'Plant'}</Text>
            <Text style={[styles.statusTitle, isRTL && styles.rtl]}>
              {result.healthy ? t.plantHealthy : t.diseaseFound}
            </Text>
            {!result.healthy && (
              <>
                <Text style={styles.diseaseName}>{result.diseaseName}</Text>
                <Text style={styles.diseaseScientific}>{result.scientific || ''}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ── FR-07: Confidence score ── */}
      <View style={styles.confCard}>
        <View style={styles.confRow}>
          <Text style={styles.confLabel}>{t.confidence}</Text>
          <View style={styles.confRight}>
            <View style={[styles.badge, { backgroundColor: sevConf.bg }]}>
              <Text style={[styles.badgeText, { color: sevConf.color }]}>
                {sevConf.dot} {sevConf.label} {t.severity}
              </Text>
            </View>
            <Text style={[styles.confValue, { color: sevConf.color }]}>
              {result.confidence}%
            </Text>
          </View>
        </View>
        <ConfidenceBar value={result.confidence} color={sevConf.color} />
        {!result.healthy && result.affectedArea && (
          <Text style={styles.affectedText}>
            Affected area: ~{result.affectedArea}% of plant
          </Text>
        )}
      </View>

      {/* ── FR-08: Treatment + FR-09: Prevention — Tabs ── */}
      <View style={styles.tabCard}>
        {/* Tab headers */}
        <View style={styles.tabHeader}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {TABS.map(tab =>
            activeTab === tab.key ? (
              <Text key={tab.key} style={[styles.tabText, isRTL && styles.rtl]}>
                {tab.content || 'No information available.'}
              </Text>
            ) : null
          )}
        </View>
      </View>

      {/* ── FR-09: Severity explanation ── */}
      {!result.healthy && (
        <View style={[styles.alertCard, { borderColor: sevConf.color, backgroundColor: sevConf.bg }]}>
          <Text style={styles.alertTitle}>{sevConf.dot} {t.severity}: {sevConf.label}</Text>
          <Text style={[styles.alertText, { color: sevConf.color }]}>
            {sev === 'high'   && 'Immediate action required. Apply treatment within 24–48 hours.'}
            {sev === 'medium' && 'Monitor closely and apply treatment within the week.'}
            {sev === 'low'    && 'Early stage detected. Apply preventive measures promptly.'}
          </Text>
        </View>
      )}

      {/* ── Action buttons ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Scanner')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnSecondaryText}>{t.rescan}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, (saving || saved) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving || saved}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={C.white} />
            : <Text style={styles.btnPrimaryText}>{saved ? '✓ Saved' : t.saveResult}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  content: { flexGrow: 1 },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
    gap: 16,
    padding: 28,
  },
  loadingText: { fontSize: 15, color: C.textMid },

  // ── Header ──
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backText: { color: C.white, fontSize: 18, fontWeight: '600' },
  shareBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  shareText: { color: C.white, fontSize: 13, fontWeight: '600' },
  headerBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginTop: 52,
  },
  plantIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantIconText: { fontSize: 30 },
  plantLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  statusTitle: { color: C.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  diseaseName: { color: C.white, fontSize: 16, fontWeight: '600', marginTop: 4, opacity: 0.9 },
  diseaseScientific: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic', marginTop: 2 },

  // ── Confidence card ──
  confCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  confLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  confRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confValue: { fontSize: 22, fontWeight: '800' },
  barWrap: {
    height: 10,
    backgroundColor: C.creamDark,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 999 },
  affectedText: { fontSize: 11, color: C.textLight, marginTop: 8 },

  // ── Badge ──
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ── Tab card ──
  tabCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.creamDark,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    gap: 2,
  },
  tabBtnActive: { borderBottomColor: C.forestMid },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textLight },
  tabLabelActive: { color: C.forestMid, fontWeight: '700' },
  tabContent: { padding: 18 },
  tabText: { fontSize: 13, color: C.textMid, lineHeight: 22 },

  // ── Alert card ──
  alertCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  alertText: { fontSize: 13, lineHeight: 20 },

  // ── Actions ──
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.forestLight,
    alignItems: 'center',
  },
  btnSecondaryText: { color: C.forestMid, fontSize: 15, fontWeight: '700' },
  btnPrimary: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: C.forestMid,
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: { color: C.white, fontSize: 15, fontWeight: '700' },

  // ── RTL ──
  rtl: { textAlign: 'right' },
});
