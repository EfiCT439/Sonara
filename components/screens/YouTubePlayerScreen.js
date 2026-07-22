import { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useUser } from '../../context/UserContext';
import { useArtwork } from '../../services/artwork';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_H = Math.round(SCREEN_W * 9 / 16); // 16:9

// Plays a real YouTube song by embedding YouTube's own player (legal, no download).
// Separate from the expo-av audio engine, which can't play YouTube.
export default function YouTubePlayerScreen({ navigation, route }) {
  const { colors: c } = useUser();
  const styles = makeStyles(c);
  const song = route?.params?.song || {};
  const art = useArtwork(song);

  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const playerRef = useRef(null);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') setPlaying(false);
    if (state === 'playing') setPlaying(true);
    if (state === 'paused') setPlaying(false);
  }, []);

  if (!song.youtubeId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={44} color={c.textFaint} />
        <Text style={styles.emptyText}>This song can't be played.</Text>
        <TouchableOpacity style={styles.backPill} onPress={() => navigation.goBack()}>
          <Text style={styles.backPillText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={26} color={c.icon} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>NOW PLAYING</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* YouTube player (audio + video) */}
      <View style={styles.playerWrap}>
        {!ready && (
          <View style={styles.playerLoading}>
            <ActivityIndicator color={c.text} />
          </View>
        )}
        <YoutubePlayer
          ref={playerRef}
          height={PLAYER_H}
          width={SCREEN_W}
          play={playing}
          videoId={song.youtubeId}
          onReady={() => setReady(true)}
          onChangeState={onStateChange}
          initialPlayerParams={{ controls: true, modestbranding: true, rel: false }}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{song.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        <View style={styles.sourcePill}>
          <Ionicons name="logo-youtube" size={13} color={c.textDim} />
          <Text style={styles.sourceText}>Playing from YouTube</Text>
        </View>
      </View>

      {/* Big play/pause */}
      <TouchableOpacity style={styles.playBtn} onPress={() => setPlaying(p => !p)} activeOpacity={0.85}>
        <Ionicons name={playing ? 'pause' : 'play'} size={32} color={c.accentText} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: c.textDim, fontSize: 15, marginTop: 12, marginBottom: 20, fontWeight: '600' },
  backPill: { backgroundColor: c.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backPillText: { color: c.accentText, fontSize: 15, fontWeight: '800' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { color: c.textDim, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

  playerWrap: { width: SCREEN_W, height: PLAYER_H, backgroundColor: '#000', justifyContent: 'center' },
  playerLoading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 1 },

  info: { paddingHorizontal: 26, paddingTop: 32, alignItems: 'center' },
  title: { color: c.text, fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4 },
  artist: { color: c.textDim, fontSize: 15, fontWeight: '600', marginTop: 8 },
  sourcePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  sourceText: { color: c.textDim, fontSize: 12, fontWeight: '700' },

  playBtn: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 40,
  },
});
