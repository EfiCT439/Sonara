import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const GENRE_SONGS = {
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
  Gospel: [
    { id: 'g1', title: 'Way Maker', artist: 'Sinach', emoji: '🙏', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'g2', title: 'Oceans', artist: 'Hillsong', emoji: '✝️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'g3', title: 'Goodness of God', artist: 'Bethel Music', emoji: '🙌', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'g4', title: 'Too Good to Not Believe', artist: 'Brandon Lake', emoji: '🕊️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'g5', title: 'Jireh', artist: 'Elevation Worship', emoji: '⭐', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Praise: [
    { id: 'pr1', title: 'This is a Move', artist: 'Brandon Lake', emoji: '🙌', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'pr2', title: 'Champion', artist: 'Bethel Music', emoji: '👑', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'pr3', title: 'Praise', artist: 'Elevation Worship', emoji: '🙏', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'pr4', title: 'Build My Life', artist: 'Pat Barrett', emoji: '✝️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'pr5', title: 'King of Kings', artist: 'Hillsong', emoji: '👑', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Worship: [
    { id: 'w1', title: 'What a Beautiful Name', artist: 'Hillsong', emoji: '🕊️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'w2', title: 'Reckless Love', artist: 'Cory Asbury', emoji: '❤️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'w3', title: 'Graves into Gardens', artist: 'Elevation Worship', emoji: '🌿', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'w4', title: 'Holy Forever', artist: 'Chris Tomlin', emoji: '⭐', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'w5', title: 'Gratitude', artist: 'Brandon Lake', emoji: '🙏', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
};

const MORNING_VIBES = [
  { id: 'm1', title: 'Good Morning', artist: 'Kanye West', emoji: '☀️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'm2', title: 'Here Comes the Sun', artist: 'Beatles', emoji: '🌅', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'm3', title: 'Beautiful Day', artist: 'U2', emoji: '🌤️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'm4', title: 'Rise Up', artist: 'Andra Day', emoji: '🌞', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'm5', title: 'Morning', artist: 'Lecrae', emoji: '☀️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

const AFTERNOON_VIBES = [
  { id: 'af1', title: 'Afternoon Delight', artist: 'Starland Vocal', emoji: '🌤️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'af2', title: 'Summer Nights', artist: 'Various', emoji: '🌞', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'af3', title: 'Sunny', artist: 'Bobby Hebb', emoji: '☀️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'af4', title: 'Walking on Sunshine', artist: 'Katrina', emoji: '🌈', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'af5', title: 'Good Life', artist: 'OneRepublic', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

const EVENING_VIBES = [
  { id: 'ev1', title: 'Night Changes', artist: 'One Direction', emoji: '🌙', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'ev2', title: 'Midnight City', artist: 'M83', emoji: '🌃', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'ev3', title: 'Starboy', artist: 'The Weeknd', emoji: '⭐', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'ev4', title: 'Nights', artist: 'Frank Ocean', emoji: '🌠', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'ev5', title: 'Golden Hour', artist: 'JVKE', emoji: '🌅', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

const ALL_SONGS = Object.values(GENRE_SONGS).flat();

const GENRE_COLORS = {
  Afrobeats: '#FF6B35',
  'Hip Hop': '#9B59B6',
  Pop: '#E91E63',
  Gospel: '#2ECC71',
  Praise: '#F39C12',
  Worship: '#3498DB',
};

const GENRE_ICONS = {
  Afrobeats: 'musical-notes',
  'Hip Hop': 'mic',
  Pop: 'star',
  Gospel: 'heart',
  Praise: 'sunny',
  Worship: 'sparkles',
};

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [genreSearchCounts, setGenreSearchCounts] = useState({});

  const getTimeVibes = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { label: '☀️ Morning Vibes', songs: MORNING_VIBES };
    if (hour < 18) return { label: '🌤️ Afternoon Vibes', songs: AFTERNOON_VIBES };
    return { label: '🌙 Evening Vibes', songs: EVENING_VIBES };
  };

  const timeVibes = getTimeVibes();

  const handleSearch = (text) => {
    setQuery(text);
    setSelectedGenre(null);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = ALL_SONGS.filter(song =>
      song.title.toLowerCase().includes(text.toLowerCase()) ||
      song.artist.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSelectSong = (song) => {
    const alreadyExists = searchHistory.find(s => s.id === song.id);
    if (!alreadyExists) {
      setSearchHistory(prev => [song, ...prev].slice(0, 10));
    }
    navigation.navigate('Player', { song });
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setQuery('');
    setSearchResults([]);
    setShowHistory(false);
    setGenreSearchCounts(prev => ({
      ...prev,
      [genre]: (prev[genre] || 0) + 1,
    }));
  };

  const deleteFromHistory = (songId) => {
    setSearchHistory(searchHistory.filter(s => s.id !== songId));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const getSortedGenres = () => {
    return Object.keys(GENRE_SONGS).sort((a, b) =>
      (genreSearchCounts[b] || 0) - (genreSearchCounts[a] || 0)
    );
  };

  const SongCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.songCard}
      onPress={() => handleSelectSong(item)}>
      <View style={styles.songImage}>
        <Text style={styles.songEmoji}>{item.emoji}</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
      </View>
      <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Search</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Songs, artists, genres..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setShowHistory(true)}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => {
            setQuery('');
            setSearchResults([]);
            setSelectedGenre(null);
          }}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
        {showHistory && query.length === 0 && (
          <TouchableOpacity onPress={() => setShowHistory(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => (
                <SongCard item={item} index={index} />
              )}
            />
          </View>
        )}

        {/* No results */}
        {query.length > 0 && searchResults.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="musical-notes-outline" size={60} color="#333" />
            <Text style={styles.noResultsText}>No songs found for "{query}"</Text>
          </View>
        )}

        {/* Search History — stays visible even after keyboard dismissed */}
        {showHistory && query.length === 0 && searchHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map(song => (
              <TouchableOpacity
                key={song.id}
                style={styles.historyItem}
                onPress={() => handleSelectSong(song)}>
                <Ionicons name="time-outline" size={20} color="#888" style={{ marginRight: 12 }} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{song.title}</Text>
                  <Text style={styles.historyArtist}>{song.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteFromHistory(song.id)}>
                  <Ionicons name="close" size={18} color="#555" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No history message */}
        {showHistory && query.length === 0 && searchHistory.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="time-outline" size={50} color="#333" />
            <Text style={styles.noResultsText}>No recent searches</Text>
          </View>
        )}

        {/* Genre selected — show songs */}
        {selectedGenre && !query && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{selectedGenre}</Text>
              <TouchableOpacity onPress={() => setSelectedGenre(null)}>
                <Text style={styles.clearAll}>← Back</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={GENRE_SONGS[selectedGenre]}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => (
                <SongCard item={item} index={index} />
              )}
            />
          </View>
        )}

        {/* Main content when not searching */}
        {!showHistory && !selectedGenre && query.length === 0 && (
          <>
            {/* Time Based Vibes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{timeVibes.label}</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={timeVibes.songs}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <SongCard item={item} index={index} />
                )}
              />
            </View>

            {/* Browse by Genre */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse Genres</Text>
              <View style={styles.genreGrid}>
                {getSortedGenres().map(genre => (
                  <TouchableOpacity
                    key={genre}
                    style={[styles.genreCard, { backgroundColor: GENRE_COLORS[genre] }]}
                    onPress={() => handleGenreSelect(genre)}>
                    <Ionicons
                      name={GENRE_ICONS[genre]}
                      size={30}
                      color="#fff"
                      style={styles.genreIcon}
                    />
                    <Text style={styles.genreText}>{genre}</Text>
                    {genreSearchCounts[genre] > 0 && (
                      <View style={styles.frequentBadge}>
                        <Text style={styles.frequentText}>#{genreSearchCounts[genre]} searches</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recommended Songs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended For You</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={ALL_SONGS.slice(0, 10)}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <SongCard item={item} index={index} />
                )}
              />
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#282828',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 14,
  },
  cancelText: {
    color: '#1DB954',
    fontSize: 14,
    marginLeft: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  clearAll: {
    color: '#1DB954',
    fontSize: 13,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyArtist: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    width: '47%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  genreIcon: {
    marginBottom: 10,
  },
  genreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  frequentBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  frequentText: {
    color: '#fff',
    fontSize: 10,
  },
  songCard: {
    width: 140,
    marginRight: 15,
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
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 15,
  },
  noResultsText: {
    color: '#888',
    fontSize: 16,
  },
});