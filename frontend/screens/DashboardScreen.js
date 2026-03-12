import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  forest:      '#1B4332',
  forestMid:   '#2D6A4F',
  forestLight: '#40916C',
  mint:        '#74C69D',
  mintPale:    '#D8F3DC',
  ochre:       '#D4A017',
  ochreLight:  '#F3C95F',
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

// ── Severity badge colors ────────────────────────────────────────────────────
const SEVERITY_STYLE = {
  high:    { bg: C.redLight,   text: C.red },
  medium:  { bg: C.amberLight, text: C.amber },
  low:     { bg: C.mintPale,   text: C.forestLight },
  healthy: { bg: C.mintPale,   text: C.forest },
};

// ── Crop tips (static + localizable) ────────────────────────────────────────
const CROP_TIPS = [
  { icon: '💧', text: 'Water plants early morning to reduce fungal risk' },
  { icon: '☀️', text: 'Cotton needs 6+ hours of direct sunlight daily' },
  { icon: '🌡️', text: 'High humidity increases blight risk in tomatoes' },
  { icon: '🌿', text: 'Remove infected leaves immediately to prevent spread' },
  { icon: '🧪', text: 'Test soil pH before applying fertilizers' },
];

export default function DashboardScreen({ navigation }) {
  const { t, isRTL } = useLanguage();

  const [user,        setUser]        = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [stats,       setStats]       = useState({ total: 0, diseased: 0, healthy: 0 });
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Load data whenever screen is focused — FR-14 ─────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token    = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));

      // FR-14: Fetch recent scans
      const historyRes = await fetch(`${API_BASE}/scans/history?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyData = await historyRes.json();

      if (historyRes.ok) {
        setRecentScans(historyData.scans || []);
        setStats({
          total:    historyData.totalCount    || 0,
          diseased: historyData.diseasedCount || 0,
          healthy:  historyData.healthyCount  || 0,
        });
      }
    } catch {
      // Use cached data silently — offline support
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t.logout, 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t.logout, style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(['authToken', 'user']);
          navigation.replace('Login');
        },
      },
    ]);
  };

  // ── Recent scan card ─────────────────────────────────────────────────────
  const renderScanCard = ({ item, index }) => {
    const sev = item.healthy ? 'healthy' : (item.severity || 'medium');
    const { bg, text: textColor } = SEVERITY_STYLE[sev] || SEVERITY_STYLE.medium;

    return (
      <TouchableOpacity
        style={styles.scanCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Result', { scanId: item.id, result: item })}
      >
        <View style={[styles.scanIcon, { backgroundColor: item.healthy ? C.mintPale : C.redLight }]}>
          <Text style={styles.scanIconText}>{item.icon || '🌿'}</Text>
        </View>
        <View style={styles.scanInfo}>
          <View style={styles.scanRow}>
            <Text style={styles.scanPlant}>{item.plantName || 'Unknown Plant'}</Text>
            <View style={[styles.badge, { backgroundColor: bg }]}>
              <Text style={[styles.badgeText, { color: textColor }]}>
                {item.healthy ? '✓ Healthy' : `${item.confidence || 0}%`}
              </Text>
            </View>
          </View>
          <Text style={styles.scanDisease}>{item.diseaseName || t.healthy}</Text>
          <Text style={styles.scanDate}>{item.date || ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={C.forestLight} />
    </View>
  );

  const statsData = [
    { label: t.totalScans,    value: stats.total,    icon: '🔬' },
    { label: t.diseasesFound, value: stats.diseased,  icon: '⚠️' },
    { label: t.plantsHealthy, value: stats.healthy,   icon: '✅' },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboard(true)}
          tintColor={C.forestLight}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, isRTL && styles.rtl]}>
            {t.goodMorning} 👋
          </Text>
          <Text style={[styles.userName, isRTL && styles.rtl]}>
            {user?.name || t.farmer}
          </Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={handleLogout}>
          <Text style={styles.avatarEmoji}>👨‍🌾</Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick Scan CTA — FR-04, FR-05 ── */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Scanner')}
      >
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaIcon}>🔬</Text>
          <View>
            <Text style={[styles.ctaTitle, isRTL && styles.rtl]}>{t.quickScan}</Text>
            <Text style={[styles.ctaSub,   isRTL && styles.rtl]}>{t.tapToScan}</Text>
          </View>
        </View>
        <View style={styles.ctaBadge}>
          <Text style={styles.ctaBadgeText}>GO →</Text>
        </View>
      </TouchableOpacity>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        {statsData.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Recent Scans — FR-14 ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{t.recentScans}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAll}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>

        {recentScans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>{t.noHistory}</Text>
            <Text style={styles.emptyDesc}>{t.noHistoryDesc}</Text>
          </View>
        ) : (
          recentScans.map((item, i) => renderScanCard({ item, index: i }))
        )}
      </View>

      {/* ── Crop Tips ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtl, { marginBottom: 12 }]}>{t.tips}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CROP_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  content: { flexGrow: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 24,
    backgroundColor: C.forest,
  },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  userName: { color: C.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 24 },

  // ── CTA Card ──
  ctaCard: {
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 20,
    backgroundColor: C.forestMid,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  ctaIcon: { fontSize: 32 },
  ctaTitle: { color: C.white, fontSize: 16, fontWeight: '700' },
  ctaSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  ctaBadge: {
    backgroundColor: C.ochre,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  ctaBadgeText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.forest },
  statLabel: { fontSize: 10, color: C.textLight, fontWeight: '500', textAlign: 'center', marginTop: 2 },

  // ── Section ──
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  viewAll: { fontSize: 13, color: C.forestLight, fontWeight: '600' },

  // ── Scan card ──
  scanCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIconText: { fontSize: 26 },
  scanInfo: { flex: 1 },
  scanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanPlant: { fontSize: 15, fontWeight: '700', color: C.text },
  scanDisease: { fontSize: 13, color: C.textMid, marginTop: 2, fontWeight: '500' },
  scanDate: { fontSize: 11, color: C.textLight, marginTop: 4 },

  // ── Badge ──
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ── Empty ──
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '700', color: C.text },
  emptyDesc: { fontSize: 13, color: C.textLight, marginTop: 4, textAlign: 'center' },

  // ── Tip cards ──
  tipCard: {
    width: 150,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tipIcon: { fontSize: 26, marginBottom: 8 },
  tipText: { fontSize: 12, color: C.textMid, lineHeight: 18 },

  // ── RTL ──
  rtl: { textAlign: 'right' },
});
