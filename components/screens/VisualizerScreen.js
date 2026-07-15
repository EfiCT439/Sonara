import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useUser } from '../../context/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');

const NUM_BARS = 28;
const BAR_MAX_H = 90;
const BAR_W = Math.floor((SCREEN_W - 80) / NUM_BARS) - 2;

// Pre-computed at module load — consistent wave shape every session
const WAVE_PARAMS = Array.from({ length: NUM_BARS }, (_, i) => {
  const center = (NUM_BARS - 1) / 2;
  const dist = Math.abs(i - center) / center;
  // Middle bars taller, edges shorter — classic waveform shape
  const peakRatio = 0.35 + (1 - dist) * 0.65;
  return {
    peak: Math.round(peakRatio * BAR_MAX_H * (0.75 + (i % 5) * 0.07)),
    trough: 4 + (i % 6) * 3,
    duration: 280 + (i % 9) * 55,   // 280–720ms
    phase: i * 45,                    // stagger offset in ms
  };
});

const GENRE_COLORS = {
  Afrobeats:   '#1a1a0d',
  Amapiano:    '#0d1a15',
  Gospel:      '#0d0d1a',
  'Hip Hop':   '#1a0d0d',
  'R&B':       '#1a0d15',
  Pop:         '#1a1a1a',
  Soul:        '#150d1a',
  Jazz:        '#0d150a',
  Reggae:      '#0a1a0d',
  Rock:        '#1a0a0a',
  default:     '#111',
};

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function VisualizerScreen({ navigation }) {
  const {
    currentTrack,
    isPlayingGlobal,
    playPause,
    playNextInQueue,
    playPreviousInQueue,
    miniPlayerPosition,
    miniPlayerDuration,
    isPremium,
  } = useUser();

  const [videoMode, setVideoMode] = useState(false);
  const pausedForVideo = useRef(false);

  const bars = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(4))
  ).current;

  const artPulse = useRef(new Animated.Value(1)).current;
  const animRefs = useRef([]);

  const hasVideo = !!currentTrack?.videoUrl;

  const enterVideoMode = () => {
    if (isPlayingGlobal) {
      playPause();
      pausedForVideo.current = true;
    }
    setVideoMode(true);
  };

  const exitVideoMode = () => {
    if (pausedForVideo.current) {
      playPause();
      pausedForVideo.current = false;
    }
    setVideoMode(false);
  };

  // ── Waveform bars animation ───────────────────────────────────────
  useEffect(() => {
    // Stop and reset all
    animRefs.current.forEach(a => a?.stop());
    animRefs.current = [];

    if (!isPlayingGlobal || !currentTrack) {
      // Settle bars to resting state
      bars.forEach(bar => {
        Animated.spring(bar, { toValue: 4, useNativeDriver: false, speed: 6 }).start();
      });
      return;
    }

    const animations = WAVE_PARAMS.map(({ peak, trough, duration, phase }, i) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(bars[i], { toValue: peak, duration, useNativeDriver: false }),
          Animated.timing(bars[i], { toValue: trough, duration: duration * 0.8, useNativeDriver: false }),
        ])
      );
      return { anim, phase };
    });

    animations.forEach(({ anim, phase }) => {
      setTimeout(() => anim.start(), phase);
    });
    animRefs.current = animations.map(({ anim }) => anim);

    return () => animRefs.current.forEach(a => a?.stop());
  }, [isPlayingGlobal, currentTrack]);

  // ── Artwork pulse animation ───────────────────────────────────────
  useEffect(() => {
    let pulse;
    if (isPlayingGlobal && currentTrack) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(artPulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(artPulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
    } else {
      Animated.spring(artPulse, { toValue: 1, useNativeDriver: true }).start();
    }
    return () => pulse?.stop();
  }, [isPlayingGlobal, currentTrack]);

  // ── Progress ──────────────────────────────────────────────────────
  const progress = miniPlayerDuration > 0
    ? Math.min(miniPlayerPosition / miniPlayerDuration, 1)
    : 0;

  const bgColor = GENRE_COLORS[currentTrack?.genre] || GENRE_COLORS.default;

  // ── No track playing ──────────────────────────────────────────────
  if (!currentTrack) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="musical-notes-outline" size={56} color="#1E1E1E" />
        <Text style={styles.emptyTitle}>Nothing Playing</Text>
        <Text style={styles.emptySub}>Play a song to see the visualizer</Text>
      </View>
    );
  }

  // ── VIDEO MODE: full-screen in-app video player ──────────────────
  if (videoMode && hasVideo) {
    return (
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: currentTrack.videoUrl }}
          style={styles.videoPlayer}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
        />
        <TouchableOpacity style={styles.videoBack} onPress={exitVideoMode} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.videoArtist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topLabel}>Visualizer</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{currentTrack.artist}</Text>
        {currentTrack.genre ? (
          <View style={styles.genrePill}>
            <Text style={styles.genrePillText}>{currentTrack.genre}</Text>
          </View>
        ) : null}
      </View>

      {/* Artwork */}
      <View style={styles.artworkWrap}>
        <Animated.View style={[styles.artworkOuter, { transform: [{ scale: artPulse }] }]}>
          <View style={styles.artworkInner}>
            <Text style={styles.artworkEmoji}>{currentTrack.emoji || '🎵'}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Waveform */}
      <View style={styles.waveformWrap}>
        <View style={styles.waveformRow}>
          {bars.map((bar, i) => (
            <View key={i} style={styles.barWrap}>
              <Animated.View style={[styles.bar, { height: bar }]} />
            </View>
          ))}
        </View>
        {/* Mirror — reflected copy below the baseline */}
        <View style={[styles.waveformRow, styles.waveformMirror]}>
          {bars.map((bar, i) => (
            <View key={i} style={styles.barWrap}>
              <Animated.View
                style={[
                  styles.bar,
                  styles.barMirror,
                  { height: Animated.multiply ? bar : bar },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(miniPlayerPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(miniPlayerDuration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, !isPremium && styles.ctrlBtnLocked]}
          onPress={() => {
            if (!isPremium) { navigation.navigate('Premium'); return; }
            playPreviousInQueue(false);
          }}
          activeOpacity={0.75}>
          <Ionicons name="play-skip-back" size={24} color={isPremium ? '#fff' : '#2A2A2A'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playBtn} onPress={playPause} activeOpacity={0.85}>
          <Ionicons name={isPlayingGlobal ? 'pause' : 'play'} size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={playNextInQueue} activeOpacity={0.75}>
          <Ionicons name="play-skip-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Watch Video button — only shown when song has a videoUrl */}
      {hasVideo && (
        <TouchableOpacity style={styles.watchVideoBtn} onPress={enterVideoMode} activeOpacity={0.8}>
          <Ionicons name="film-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.watchVideoText}>Watch Music Video</Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 14 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  topLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' },

  songInfo: { alignItems: 'center', paddingHorizontal: 32, marginTop: 16, marginBottom: 24, gap: 6 },
  songTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  songArtist: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  genrePill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, marginTop: 2,
  },
  genrePillText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  artworkWrap: { alignItems: 'center', marginBottom: 32 },
  artworkOuter: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  artworkInner: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  artworkEmoji: { fontSize: 60 },

  waveformWrap: { alignItems: 'center', marginBottom: 28 },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 40,
  },
  waveformMirror: {
    alignItems: 'flex-start',
    opacity: 0.18,
    transform: [{ scaleY: -1 }],
    marginTop: 1,
  },
  barWrap: {
    width: BAR_W + 2,
    height: BAR_MAX_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: Math.max(BAR_W, 2),
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  barMirror: { backgroundColor: '#fff' },

  progressSection: { paddingHorizontal: 32, marginBottom: 32 },
  progressTrack: {
    height: 2, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingBottom: 48,
  },
  ctrlBtn: {
    width: 52, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnLocked: { opacity: 0.3 },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  // Watch video button
  watchVideoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingBottom: 24,
  },
  watchVideoText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },

  // Full-screen video player
  videoContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoPlayer: { width: SCREEN_W, height: SCREEN_W * (9 / 16) },
  videoBack: {
    position: 'absolute', top: 56, left: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoInfo: {
    position: 'absolute', bottom: 60, left: 20, right: 20,
  },
  videoTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  videoArtist: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },

  // Empty state
  emptyTitle: { color: '#333', fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptySub: { color: '#222', fontSize: 13 },
});
