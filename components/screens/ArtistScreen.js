import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const GENRE_COLORS = {
  Afrobeats: '#FF6B35', 'Hip Hop': '#9B59B6', Pop: '#E91E63',
  'R&B': '#3498DB', Soul: '#E67E22', Gospel: '#2ECC71',
  Amapiano: '#1ABC9C', Rap: '#E74C3C',
};

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
  const isFollowing = isFollowingArtist(artist.id);
  const songs = ARTIST_SONGS[artist.name] || ARTIST_SONGS['default'];
  const accentColor = GENRE_COLORS[artist.genre] || '#1DB954';

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
      {/* Glow background */}
      <View style={[styles.glowBg, { backgroundColor: accentColor + '25' }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Artist hero */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.avatarCircle, { borderColor: accentColor, shadowColor: accentColor }]}>
            <Text style={styles.avatarEmoji}>{artist.emoji || '🎤'}</Text>
          </View>

          <Text style={styles.artistName}>{artist.name}</Text>

          <View style={styles.genreTag}>
            <Text style={[styles.genreTagText, { color: accentColor }]}>{artist.genre}</Text>
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
            <TouchableOpacity
              style={[styles.playAllBtn, { backgroundColor: accentColor }]}
              onPress={playAll}
              activeOpacity={0.85}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.followBtn, isFollowing && { backgroundColor: accentColor, borderColor: accentColor }]}
              onPress={handleFollow}
              activeOpacity={0.8}>
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={16}
                color={isFollowing ? '#fff' : accentColor}
              />
              <Text style={[styles.followBtnText, isFollowing && { color: '#fff' }]}>
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
            <View style={[styles.songArt, { backgroundColor: accentColor + '25' }]}>
              <Text style={styles.songEmoji}>{song.emoji}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songArtist}>{song.artist}</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color="#444" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  glowBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scroll: { paddingBottom: 20 },

  backBtn: {
    margin: 20,
    marginTop: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28 },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarEmoji: { fontSize: 60 },
  artistName: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  genreTag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  genreTagText: { fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 22,
    width: '100%',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 3, fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#2A2A2A' },

  actionRow: { flexDirection: 'row', gap: 12 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  playAllText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#444',
  },
  followBtnText: { color: '#ccc', fontSize: 15, fontWeight: '700' },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  songIndex: { color: '#444', fontSize: 13, width: 22, textAlign: 'center', fontWeight: '600' },
  songArt: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songEmoji: { fontSize: 24 },
  songInfo: { flex: 1 },
  songTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  songArtist: { color: '#666', fontSize: 12, marginTop: 3 },
});
