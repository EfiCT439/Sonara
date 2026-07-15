import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

const GENRE_COLORS = {
  Afrobeats: '#FF6B35',
  'Hip Hop': '#9B59B6',
  Pop: '#E91E63',
  'R&B': '#3498DB',
  Soul: '#E67E22',
  Gospel: '#2ECC71',
  Amapiano: '#1ABC9C',
  Rap: '#E74C3C',
};

export default function MiniPlayer({ onOpenPlayer, onUpgrade }) {
  const {
    currentTrack,
    isPlayingGlobal,
    isPremium,
    playPause,
    playPreviousInQueue,
    playNextInQueue,
    miniPlayerPosition,
    miniPlayerDuration,
  } = useUser();

  const handlePrevious = () => {
    if (isPremium) {
      playPreviousInQueue(false);
    } else {
      Alert.alert(
        '⭐ Premium Feature',
        'The backward button is available for Premium members.\n\nUpgrade for just $1/month!',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade ⭐', onPress: onUpgrade },
        ]
      );
    }
  };

  const slideAnim = useRef(new Animated.Value(120)).current;

  const genreColor = currentTrack
    ? (GENRE_COLORS[currentTrack.genre] || '#1DB954')
    : '#1DB954';

  const progressPercent =
    miniPlayerDuration > 0
      ? Math.min((miniPlayerPosition / miniPlayerDuration) * 100, 100)
      : 0;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, []);

  if (!currentTrack) return null;

  const formatTime = (millis) => {
    if (!millis || millis <= 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onOpenPlayer}
        style={[styles.container, { borderColor: genreColor + '60' }]}>

        {/* PROGRESS BAR — top edge, updates in real time */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: genreColor },
            ]}
          />
        </View>

        {/* Main content */}
        <View style={styles.row}>
          {/* Album art */}
          <View style={[styles.albumArt, { backgroundColor: genreColor + '30' }]}>
            <Text style={styles.albumEmoji}>{currentTrack.emoji || '🎵'}</Text>
            {isPlayingGlobal && (
              <View style={[styles.playingDot, { backgroundColor: genreColor }]} />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={[styles.artist, { color: genreColor }]} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Controls — these control the REAL sound via context */}
          <TouchableOpacity
            style={[styles.prevBtn, !isPremium && styles.lockedBtn]}
            onPress={handlePrevious}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="play-skip-back" size={18} color={isPremium ? '#ccc' : '#555'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: genreColor }]}
            onPress={playPause}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name={isPlayingGlobal ? 'pause' : 'play'} size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => playNextInQueue(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="play-skip-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Time row */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(miniPlayerPosition)}</Text>
          <Text style={styles.timeText}>
            {miniPlayerDuration > 0
              ? `-${formatTime(miniPlayerDuration - miniPlayerPosition)}`
              : '0:00'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
    zIndex: 9999,
    elevation: 99,
  },
  container: {
    backgroundColor: '#161616',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  progressBg: {
    width: '100%',
    height: 3,
    backgroundColor: '#2a2a2a',
  },
  progressFill: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 12,
  },
  albumArt: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  albumEmoji: { fontSize: 24 },
  playingDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#161616',
  },
  info: { flex: 1, gap: 3 },
  title: { color: '#fff', fontSize: 13, fontWeight: '700' },
  artist: { fontSize: 11, fontWeight: '600' },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 17,
  },
  lockedBtn: {
    opacity: 0.45,
  },
  nextBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 17,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '500',
  },
});