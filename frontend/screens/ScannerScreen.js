import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  forest:      '#1B4332',
  forestMid:   '#2D6A4F',
  forestLight: '#40916C',
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
};

// ─── Prediction API endpoint — FR-06, connect ML model ───────────────────────
const PREDICT_URL = 'https://your-api.com/api/predict';

export default function ScannerScreen({ navigation }) {
  const { t, isRTL } = useLanguage();

  const [phase,     setPhase]     = useState('choose'); // choose | analyzing | error
  const [imageUri,  setImageUri]  = useState(null);
  const [progress,  setProgress]  = useState(0);

  // Animated scan line
  const scanAnim  = useRef(new Animated.Value(0)).current;
  const dotAnim1  = useRef(new Animated.Value(1)).current;
  const dotAnim2  = useRef(new Animated.Value(1)).current;
  const dotAnim3  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'analyzing') {
      startScanAnimation();
      startDotAnimation();
    }
  }, [phase]);

  // ── Scan line sweep animation ─────────────────────────────────────────────
  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // ── Pulsing dots ──────────────────────────────────────────────────────────
  const startDotAnimation = () => {
    const pulse = (anim, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 400, useNativeDriver: true }),
      ])
    ).start();
    pulse(dotAnim1, 0);
    pulse(dotAnim2, 200);
    pulse(dotAnim3, 400);
  };

  // ── Request permissions ───────────────────────────────────────────────────
  const requestPermission = async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  // ── FR-04: Camera capture ─────────────────────────────────────────────────
  const handleCamera = async () => {
    const granted = await requestPermission('camera');
    if (!granted) {
      Alert.alert('Permission Required', 'Camera access is needed to scan plants.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      processImage(result.assets[0].uri);
    }
  };

  // ── FR-05: Gallery upload ─────────────────────────────────────────────────
  const handleGallery = async () => {
    const granted = await requestPermission('library');
    if (!granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];

      // FR-05: Validate file size ≤ 5MB
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select an image under 5MB.');
        return;
      }

      processImage(asset.uri);
    }
  };

  // ── FR-06: Send to prediction API ─────────────────────────────────────────
  const processImage = async (uri) => {
    setImageUri(uri);
    setPhase('analyzing');
    setProgress(0);

    // Simulate progress — replace with real upload progress in production
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + Math.random() * 12;
      });
    }, 300);

    try {
      const token = await AsyncStorage.getItem('authToken');

      // Build multipart form data
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'plant_scan.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(PREDICT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (response.ok) {
        // FR-07: Navigate to result with disease name + confidence + solution
        setTimeout(() => {
          navigation.navigate('Result', {
            result: {
              plantName:     data.plantName     || 'Unknown Plant',
              diseaseName:   data.diseaseName   || 'Unknown',
              scientific:    data.scientific    || '',
              confidence:    data.confidence    || 0,
              severity:      data.severity      || 'medium',
              healthy:       data.healthy       || false,
              affectedArea:  data.affectedArea  || '0',
              treatment:     data.treatment     || 'No treatment data available.',
              organicRemedy: data.organicRemedy || 'No organic remedy data available.',
              prevention:    data.prevention    || 'No prevention data available.',
              icon:          data.icon          || '🌿',
              date:          new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              }),
            },
            imageUri: uri,
          });
          setPhase('choose');
          setImageUri(null);
        }, 500);
      } else {
        throw new Error(data.message || 'Prediction failed.');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setPhase('error');
      Alert.alert(
        'Analysis Failed',
        error.message || 'Could not analyze image. Please try again.',
        [{ text: 'Retry', onPress: () => setPhase('choose') }]
      );
    }
  };

  // ════════════════════════════════════════════════════════
  // ANALYZING phase UI
  // ════════════════════════════════════════════════════════
  if (phase === 'analyzing') {
    const scanY = scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 260],
    });

    return (
      <View style={styles.analyzeScreen}>
        {/* Back button */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setPhase('choose')}>
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>

        {/* Camera frame with scan line */}
        <View style={styles.frameWrap}>
          {/* Image preview */}
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          )}

          {/* Scan line */}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />

          {/* Corner brackets */}
          {['TL', 'TR', 'BL', 'BR'].map(pos => (
            <View key={pos} style={[styles.corner, styles[`corner${pos}`]]} />
          ))}
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Dots + label */}
        <View style={styles.dotRow}>
          {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
          ))}
        </View>
        <Text style={[styles.analyzingTitle, isRTL && styles.rtl]}>{t.analyzing}</Text>
        <Text style={styles.analyzingDesc}>{t.processingAI}</Text>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════
  // CHOOSE phase UI
  // ════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isRTL && styles.rtl]}>{t.scanPlant}</Text>
        <Text style={[styles.headerSub,   isRTL && styles.rtl]}>{t.chooseMethod}</Text>
      </View>

      <View style={styles.body}>
        {/* Camera option — FR-04 */}
        <TouchableOpacity style={styles.optionCard} onPress={handleCamera} activeOpacity={0.85}>
          <View style={[styles.optionIcon, styles.optionIconGreen]}>
            <Text style={styles.optionEmoji}>📷</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, isRTL && styles.rtl]}>{t.useCamera}</Text>
            <Text style={styles.optionDesc}>Live capture · Flash control · Auto-focus</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Gallery option — FR-05 */}
        <TouchableOpacity style={styles.optionCard} onPress={handleGallery} activeOpacity={0.85}>
          <View style={[styles.optionIcon, styles.optionIconOchre]}>
            <Text style={styles.optionEmoji}>🖼️</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, isRTL && styles.rtl]}>{t.uploadGallery}</Text>
            <Text style={styles.optionDesc}>JPG / PNG · Max 5MB per image</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Tips card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Best results</Text>
          {[
            'Ensure good, even lighting on the leaf',
            'Capture the full leaf surface clearly',
            'Keep camera steady and in focus',
            'Avoid shadows covering the leaf',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipItem}>• {tip}</Text>
          ))}
        </View>

        {/* Supported plants */}
        <View style={styles.plantsRow}>
          <Text style={styles.plantsLabel}>Supported crops:</Text>
          <Text style={styles.plantsEmojis}>🍅 🌾 🌿 🥭 🌽 🧅 🫑 🍃</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  // ── Header ──
  header: {
    backgroundColor: C.forestLight,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 28,
  },
  headerTitle: { color: C.white, fontSize: 24, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 },

  // ── Body ──
  body: { flex: 1, padding: 20, gap: 14 },

  // ── Option cards ──
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 22,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  optionIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconGreen: { backgroundColor: C.forestMid },
  optionIconOchre: { backgroundColor: C.ochre },
  optionEmoji: { fontSize: 34 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  optionDesc: { fontSize: 12, color: C.textMid, marginTop: 4, lineHeight: 18 },
  chevron: { fontSize: 24, color: C.textLight },

  // ── Tips ──
  tipsCard: {
    backgroundColor: C.mintPale,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#74C69D40',
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: C.forest, marginBottom: 8 },
  tipItem: { fontSize: 12, color: C.forestMid, paddingVertical: 2, lineHeight: 18 },

  // ── Supported plants ──
  plantsRow: { alignItems: 'center', gap: 4 },
  plantsLabel: { fontSize: 12, color: C.textLight, fontWeight: '500' },
  plantsEmojis: { fontSize: 20, letterSpacing: 4 },

  // ════ Analyzing Screen ════
  analyzeScreen: {
    flex: 1,
    backgroundColor: C.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  cancelBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  cancelText: { color: C.white, fontSize: 13, fontWeight: '600' },

  // Frame
  frameWrap: {
    width: 280,
    height: 280,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: C.ochre,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    marginBottom: 32,
  },
  previewImage: { width: '100%', height: '100%' },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.ochre,
    shadowColor: C.ochre,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: C.ochreLight,
    borderWidth: 0,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },

  // Progress
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, width: '100%' },
  progressBar: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.ochre, borderRadius: 999 },
  progressText: { color: C.ochre, fontSize: 13, fontWeight: '700', width: 38, textAlign: 'right' },

  // Dots
  dotRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: C.ochre },

  // Labels
  analyzingTitle: { color: C.white, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  analyzingDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  // RTL
  rtl: { textAlign: 'right' },
});
