import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useUser } from '../../context/UserContext';

const TRENDING_BY_GENRE = {
  Afrobeats: [
    { id: 'a1', title: 'Last Last', artist: 'Burna Boy', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'a2', title: 'Essence', artist: 'Wizkid', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'a3', title: 'Fall', artist: 'Davido', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'a4', title: 'Calm Down', artist: 'Rema', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'a5', title: 'Sability', artist: 'Asake', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'Hip Hop': [
    { id: 'h1', title: "God's Plan", artist: 'Drake', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'h2', title: 'Sicko Mode', artist: 'Travis Scott', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'h3', title: 'HUMBLE', artist: 'Kendrick Lamar', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'h4', title: 'Rockstar', artist: 'Post Malone', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'h5', title: 'Nice For What', artist: 'Drake', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Pop: [
    { id: 'p1', title: 'Anti-Hero', artist: 'Taylor Swift', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'p2', title: 'Shape of You', artist: 'Ed Sheeran', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'p3', title: 'As It Was', artist: 'Harry Styles', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'p4', title: 'Blinding Lights', artist: 'The Weeknd', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'p5', title: 'Stay', artist: 'Justin Bieber', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'R&B': [
    { id: 'r1', title: 'Creepin', artist: 'Metro Boomin', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'r2', title: 'Die For You', artist: 'The Weeknd', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'r3', title: 'Shirt', artist: 'SZA', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'r4', title: 'Bigger', artist: 'Beyonce', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'r5', title: 'Nobody', artist: 'Tems', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
};

export default function HomeScreen({ navigation }) {
  const { isPremium, favouriteArtists } = useUser();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const GenreSection = ({ genre, songs }) => (
    <View style={styles.genreSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{genre}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={songs}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.songCard}
            onPress={() => navigation.navigate('Player', { song: item })}>
            <View style={styles.songImage}>
              <Text style={styles.songEmoji}>{item.emoji}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
            </View>
            <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const ArtistSection = ({ artist }) => (
    <View style={styles.genreSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.artistSectionHeader}>
          <View style={styles.artistSectionImage}>
            <Text style={styles.artistSectionEmoji}>{artist.emoji}</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>{artist.name}</Text>
            <Text style={styles.artistSectionGenre}>{artist.genre}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Artist', { artist })}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={artist.songs}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.songCard}
            onPress={() => navigation.navigate('Player', { song: item })}>
            <View style={styles.songImage}>
              <Text style={styles.songEmoji}>{item.emoji}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
            </View>
            <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.headerTitle}>Sonara 🎵</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarText}>👤</Text>
          {isPremium && <View style={styles.premiumDot} />}
        </TouchableOpacity>
      </View>

      {/* Upgrade banner for free users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeBanner}
          onPress={() => navigation.navigate('Paywall')}>
          <Text style={styles.upgradeBannerEmoji}>💎</Text>
          <View>
            <Text style={styles.upgradeBannerText}>Upgrade to Premium</Text>
            <Text style={styles.upgradeBannerSubtext}>No ads • Unlimited skips • $1/month</Text>
          </View>
          <Text style={styles.upgradeBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Your Favourite Artists Songs */}
      {favouriteArtists.length > 0 && (
        <View>
          <Text style={styles.trendingTitle}>🎤 Your Artists</Text>
          {favouriteArtists.map(artist => (
            <ArtistSection key={artist.id} artist={artist} />
          ))}
        </View>
      )}

      {/* Trending by Genre */}
      <Text style={styles.trendingTitle}>🔥 Trending Now</Text>
      {Object.entries(TRENDING_BY_GENRE).map(([genre, songs]) => (
        <GenreSection key={genre} genre={genre} songs={songs} />
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#888',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatar: {
    width: 45,
    height: 45,
    backgroundColor: '#1DB954',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 22,
  },
  premiumDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 12,
  },
  upgradeBannerEmoji: {
    fontSize: 28,
  },
  upgradeBannerText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
  },
  upgradeBannerSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  upgradeBannerArrow: {
    color: '#FFD700',
    fontSize: 20,
    marginLeft: 'auto',
  },
  trendingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 5,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAll: {
    color: '#1DB954',
    fontSize: 13,
  },
  artistSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  artistSectionImage: {
    width: 40,
    height: 40,
    backgroundColor: '#1DB954',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistSectionEmoji: {
    fontSize: 20,
  },
  artistSectionGenre: {
    color: '#888',
    fontSize: 12,
  },
  genreSection: {
    marginBottom: 25,
  },
  songCard: {
    width: 140,
    marginLeft: 20,
    marginRight: 5,
  },
  songImage: {
    width: 140,
    height: 140,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  songEmoji: {
    fontSize: 55,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rankText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  songTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#888',
    fontSize: 11,
    marginTop: 3,
  },
});