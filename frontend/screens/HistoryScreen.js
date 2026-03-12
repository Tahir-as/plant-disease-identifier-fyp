import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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
  amber:       '#E67E22',
  amberLight:  '#FEF9E7',
};

const API_BASE = 'https://your-api.com/api';

// ── Severity badge config ─────────────────────────────────────────────────────
const BADGE = {
  high:    { bg: C.redLight,    text: C.red,         label: '🔴 High'   },
  medium:  { bg: C.amberLight,  text: C.amber,       label: '🟡 Medium' },
  low:     { bg: C.mintPale,    text: C.forestLight, label: '🟢 Low'    },
  healthy: { bg: C.mintPale,    text: C.forest,      label: '✅ Healthy' },
};

// ── Filter options ────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',      label: 'All'      },
  { key: 'diseased', label: 'Diseased' },
  { key: 'healthy',  label: 'Healthy'  },
  { key: 'high',     label: '🔴 High'  },
  { key: 'medium',   label: '🟡 Medium'},
];

export default function HistoryScreen({ navigation }) {
  const { t, isRTL } = useLanguage();

  const [scans,      setScans]      = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');

  // ── FR-14: Load scan history on focus ────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res   = await fetch(`${API_BASE}/scans/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setScans(data.scans || []);
        applyFilter(data.scans || [], filter, search);
      }
    } catch {
      Alert.alert('Error', 'Could not load scan history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Apply filter + search ─────────────────────────────────────────────────
  const applyFilter = (data, activeFilter, searchText) => {
    let result = [...data];

    if (activeFilter === 'diseased') result = result.filter(s => !s.healthy);
    else if (activeFilter === 'healthy') result = result.filter(s => s.healthy);
    else if (activeFilter === 'high')   result = result.filter(s => s.severity === 'high');
    else if (activeFilter === 'medium') result = result.filter(s => s.severity === 'medium');

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(s =>
        (s.plantName || '').toLowerCase().includes(q) ||
        (s.diseaseName || '').toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  };

  useEffect(() => {
    applyFilter(scans, filter, search);
  }, [filter, search, scans]);

  // ── Delete scan — swipe-to-delete ─────────────────────────────────────────
  const handleDelete = (scanId) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await fetch(`${API_BASE}/scans/${scanId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const updated = scans.filter(s => s.id !== scanId);
              setScans(updated);
            } catch {
              Alert.alert('Error', 'Could not delete scan.');
            }
          },
        },
      ]
    );
  };

  // ── Render individual scan item ───────────────────────────────────────────
  const renderItem = ({ item }) => {
    const sev  = item.healthy ? 'healthy' : (item.severity || 'medium');
    const conf = BADGE[sev] || BADGE.medium;

    return (
      <TouchableOpacity
        style={styles.scanCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Result', { scanId: item.id, result: item })}
        onLongPress={() => handleDelete(item.id)}
      >
        {/* Plant icon */}
        <View style={[styles.iconWrap, { backgroundColor: item.healthy ? C.mintPale : C.redLight }]}>
          <Text style={styles.iconText}>{item.icon || '🌿'}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.infoRow}>
            <Text style={styles.plantName}>{item.plantName || 'Unknown Plant'}</Text>
            <View style={[styles.badge, { backgroundColor: conf.bg }]}>
              <Text style={[styles.badgeText, { color: conf.text }]}>{conf.label}</Text>
            </View>
          </View>

          <Text style={[styles.diseaseName, { color: item.healthy ? C.forestLight : C.red }]}>
            {item.diseaseName}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.date}>📅 {item.date}</Text>
            <Text style={styles.conf}>{item.confidence}% confidence</Text>
          </View>

          {/* Mini confidence bar */}
          <View style={styles.miniBarWrap}>
            <View style={[styles.miniBarFill, {
              width: `${item.confidence}%`,
              backgroundColor: item.healthy ? C.forestLight : (sev === 'high' ? C.red : C.amber),
            }]} />
          </View>
        </View>

        {/* Arrow */}
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const ListEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🌱</Text>
      <Text style={styles.emptyTitle}>{t.noHistory}</Text>
      <Text style={styles.emptyDesc}>{t.noHistoryDesc}</Text>
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.btnPrimaryText}>{t.scanPlant}</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Header with stats ─────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryValue}>{scans.length}</Text>
          <Text style={styles.summaryLabel}>{t.totalScans}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={[styles.summaryValue, { color: C.red }]}>
            {scans.filter(s => !s.healthy).length}
          </Text>
          <Text style={styles.summaryLabel}>{t.diseasesFound}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={[styles.summaryValue, { color: C.forest }]}>
            {scans.filter(s => s.healthy).length}
          </Text>
          <Text style={styles.summaryLabel}>{t.plantsHealthy}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, isRTL && styles.rtl]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search plant or disease..."
          placeholderTextColor={C.textLight}
          textAlign={isRTL ? 'right' : 'left'}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f.key}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Result count */}
      {(filter !== 'all' || search) && (
        <Text style={styles.resultCount}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={[styles.headerTitle, isRTL && styles.rtl]}>{t.history}</Text>
          <Text style={styles.headerSub}>{scans.length} scans recorded</Text>
        </View>
        <TouchableOpacity
          style={styles.newScanBtn}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.newScanText}>+ Scan</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.forestLight} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(true)}
              tintColor={C.forestLight}
            />
          }
        />
      )}

      {/* Long-press hint */}
      <Text style={styles.hint}>Long-press any item to delete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  // ── Screen header ──
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 20,
    backgroundColor: C.forest,
  },
  headerTitle: { color: C.white, fontSize: 24, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  newScanBtn: {
    backgroundColor: C.ochre,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  newScanText: { color: C.white, fontWeight: '700', fontSize: 14 },

  // ── Loading ──
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── List ──
  listContent: { paddingBottom: 100, flexGrow: 1 },

  // ── Summary ──
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: C.forest },
  summaryLabel: { fontSize: 10, color: C.textLight, marginTop: 2, fontWeight: '500' },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: C.creamDark,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },
  clearBtn: { fontSize: 16, color: C.textLight, padding: 4 },

  // ── Filters ──
  filterList: { marginTop: 12 },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.creamDark,
    backgroundColor: C.white,
  },
  filterChipActive: { backgroundColor: C.forestMid, borderColor: C.forestMid },
  filterText: { fontSize: 12, fontWeight: '600', color: C.textMid },
  filterTextActive: { color: C.white },
  resultCount: {
    fontSize: 12,
    color: C.textLight,
    marginLeft: 20,
    marginTop: 10,
    fontWeight: '500',
  },

  // ── Scan card ──
  scanCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 28 },
  infoCol: { flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  plantName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  diseaseName: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  date: { fontSize: 11, color: C.textLight },
  conf: { fontSize: 11, color: C.textLight },
  miniBarWrap: {
    height: 4,
    backgroundColor: C.creamDark,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  miniBarFill: { height: '100%', borderRadius: 999 },
  arrow: { fontSize: 22, color: C.textLight, alignSelf: 'center', marginLeft: 4 },

  // ── Badge ──
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // ── Empty ──
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnPrimary: {
    backgroundColor: C.forestMid,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  btnPrimaryText: { color: C.white, fontWeight: '700', fontSize: 15 },

  // ── Hint ──
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: C.textLight,
    paddingBottom: 8,
  },

  // ── RTL ──
  rtl: { textAlign: 'right' },
});
