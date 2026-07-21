import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const ARTIST_SONGS = {
  'Burna Boy': [
    { id: 'bb1', title: 'Last Last', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🔥', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'bb2', title: 'Anybody', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'bb3', title: 'Ye', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'bb4', title: 'On The Low', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'bb5', title: 'Gbona', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '✨', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'Wizkid': [
    { id: 'wz1', title: 'Essence', artist: 'Wizkid', genre: 'Afrobeats', emoji: '💫', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'wz2', title: 'Ojuelegba', artist: 'Wizkid', genre: 'Afrobeats', emoji: '🌟', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'wz3', title: 'Come Closer', artist: 'Wizkid', genre: 'Afrobeats', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'wz4', title: 'Fever', artist: 'Wizkid', genre: 'Afrobeats', emoji: '🔥', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'wz5', title: 'Joro', artist: 'Wizkid', genre: 'Afrobeats', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'Drake': [
    { id: 'dr1', title: "God's Plan", artist: 'Drake', genre: 'Hip Hop', emoji: '🙏', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'dr2', title: 'Hotline Bling', artist: 'Drake', genre: 'Hip Hop', emoji: '📱', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'dr3', title: 'One Dance', artist: 'Drake', genre: 'Hip Hop', emoji: '💃', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'dr4', title: 'Nonstop', artist: 'Drake', genre: 'Hip Hop', emoji: '⚡', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'dr5', title: 'In My Feelings', artist: 'Drake', genre: 'Hip Hop', emoji: '💚', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'default': [
    { id: 'd1', title: 'Popular Hit', artist: 'Artist', genre: 'Afrobeats', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'd2', title: 'Top Track', artist: 'Artist', genre: 'Afrobeats', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'd3', title: 'Fan Favourite', artist: 'Artist', genre: 'Afrobeats', emoji: '🔥', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'd4', title: 'Latest Release', artist: 'Artist', genre: 'Afrobeats', emoji: '✨', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'd5', title: 'Classic Banger', artist: 'Artist', genre: 'Afrobeats', emoji: '💥', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
};

export default function ArtistScreen({ navigation, route }) {
  const { artist } = route.params;
  const { toggleFollowArtist, isFollowingArtist, loadAndPlay } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);
  const isFollowing = isFollowingArtist(artist.id);
  const songs = ARTIST_SONGS[artist.name] || ARTIST_SONGS['default'];

  // Real follower count: artists start with 0 and only gain followers when real
  // Sonara users follow them. `artist.followers` comes from the backend once the
  // artist has an account; until then it's 0. The current user's follow counts too.
  const followerCount = (artist.followers || 0) + (isFollowing ? 1 : 0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
    ]).start();
  }, []);

  const handleFollow = () => toggleFollowArtist(artist);

  const playAll = () => {
    if (songs.length > 0) loadAndPlay(songs[0], songs, 0);
    navigation.navigate('Player', { song: songs[0] });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.icon} />
        </TouchableOpacity>

        {/* Artist hero */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{artist.emoji || '🎤'}</Text>
          </View>

          <Text style={styles.artistName}>{artist.name}</Text>

          <View style={styles.genreTag}>
            <Text style={styles.genreTagText}>{artist.genre}</Text>
          </View>

          {/* Stats row — real numbers only */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{followerCount}</Text>
              <Text style={styles.statLabel}>{followerCount === 1 ? 'Follower' : 'Followers'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{songs.length}</Text>
              <Text style={styles.statLabel}>{songs.length === 1 ? 'Song' : 'Songs'}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.playAllBtn} onPress={playAll} activeOpacity={0.85}>
              <Ionicons name="play" size={16} color={c.accentText} />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={handleFollow}
              activeOpacity={0.8}>
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={16}
                color={isFollowing ? c.accentText : c.text}
              />
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Songs list */}
        <Text style={styles.sectionTitle}>Popular Songs</Text>

        {songs.map((song, index) => (
          <TouchableOpacity
            key={song.id}
            style={styles.songRow}
            onPress={() => {
              loadAndPlay(song, songs, index);
              navigation.navigate('Player', { song });
            }}
            activeOpacity={0.7}>
            <Text style={styles.songIndex}>{index + 1}</Text>
            <View style={styles.songArt}>
              <Text style={styles.songEmoji}>{song.emoji}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songArtist}>{song.artist}</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color={c.textFaint} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingBottom: 20 },

  backBtn: {
    margin: 20,
    marginTop: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28 },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 18,
    overflow: 'hidden',
  },
  avatarEmoji: { fontSize: 56 },
  artistName: { fontSize: 27, fontWeight: '900', color: c.text, marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 22,
  },
  genreTagText: { fontSize: 11, fontWeight: '800', color: c.textDim, textTransform: 'uppercase', letterSpacing: 1.1 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: c.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: c.text },
  statLabel: { fontSize: 10, color: c.textDim, marginTop: 3, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 },
  statDivider: { width: 1, backgroundColor: c.elevated },

  actionRow: { flexDirection: 'row', gap: 12 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: c.accent,
  },
  playAllText: { color: c.accentText, fontSize: 15, fontWeight: '800' },
  followBtnActive: { backgroundColor: c.accent, borderColor: c.accent },
  followBtnTextActive: { color: c.accentText },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  followBtnText: { color: c.text, fontSize: 15, fontWeight: '800' },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: c.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  songIndex: { color: c.textFaint, fontSize: 13, width: 22, textAlign: 'center', fontWeight: '700' },
  songArt: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  songEmoji: { fontSize: 24 },
  songInfo: { flex: 1 },
  songTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
  songArtist: { color: c.textDim, fontSize: 12, marginTop: 3, fontWeight: '600' },
});
