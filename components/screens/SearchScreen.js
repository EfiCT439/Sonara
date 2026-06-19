 import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';

const ALL_SONGS = [
  { id: '1', title: 'Sample Song 1', artist: 'Sample Artist', genre: 'Afrobeats', emoji: '🎵' },
  { id: '2', title: 'Sample Song 2', artist: 'Sample Artist 2', genre: 'Hip Hop', emoji: '🎶' },
  { id: '3', title: 'Sample Song 3', artist: 'Sample Artist 3', genre: 'Pop', emoji: '🎸' },
  { id: '4', title: 'Sample Song 4', artist: 'Sample Artist 4', genre: 'R&B', emoji: '🎹' },
  { id: '5', title: 'Sample Song 5', artist: 'Sample Artist 5', genre: 'Soul', emoji: '🎺' },
  { id: '6', title: 'Sample Song 6', artist: 'Sample Artist 6', genre: 'Jazz', emoji: '🎻' },
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = ALL_SONGS.filter(song =>
      song.title.toLowerCase().includes(text.toLowerCase()) ||
      song.artist.toLowerCase().includes(text.toLowerCase()) ||
      song.genre.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSelectSong = (song) => {
    // Add to search history
    const alreadyExists = searchHistory.find(s => s.id === song.id);
    if (!alreadyExists) {
      setSearchHistory([song, ...searchHistory]);
    }
    navigation.navigate('Player', { song });
  };

  const deleteFromHistory = (songId) => {
    setSearchHistory(searchHistory.filter(s => s.id !== songId));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Search 🔍</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, genres..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearchResults([]); }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            {searchResults.map(song => (
              <TouchableOpacity
                key={song.id}
                style={styles.songCard}
                onPress={() => handleSelectSong(song)}>
                <View style={styles.songImage}>
                  <Text style={styles.songEmoji}>{song.emoji}</Text>
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                  <Text style={styles.songGenre}>{song.genre}</Text>
                </View>
                <Text style={styles.playIcon}>▶️</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No results */}
        {query.length > 0 && searchResults.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsEmoji}>😔</Text>
            <Text style={styles.noResultsText}>No songs found for "{query}"</Text>
          </View>
        )}

        {/* Search History */}
        {query.length === 0 && searchHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search History</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearHistory}>🗑️ Clear All</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map(song => (
              <View key={song.id} style={styles.historyCard}>
                <TouchableOpacity
                  style={styles.historyInfo}
                  onPress={() => handleSelectSong(song)}>
                  <Text style={styles.historyIcon}>🕐</Text>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.songArtist}>{song.artist}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteFromHistory(song.id)}>
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Browse by Genre when no search */}
        {query.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Genre</Text>
            <View style={styles.genreGrid}>
             {['Afrobeats', 'Hip Hop', 'Pop', 'R&B', 'Soul', 'Jazz'].map(genre => (
                <TouchableOpacity 
                  key={genre} 
                  style={styles.genreCard}
                  onPress={() => handleSearch(genre)}>
                  <Text style={styles.genreText}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#282828',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  clearIcon: {
    color: '#888',
    fontSize: 16,
    padding: 4,
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
  clearHistory: {
    color: '#888',
    fontSize: 14,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  songImage: {
    width: 50,
    height: 50,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  songEmoji: {
    fontSize: 22,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  songGenre: {
    color: '#1DB954',
    fontSize: 11,
    marginTop: 3,
  },
  playIcon: {
    fontSize: 20,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  deleteIcon: {
    color: '#888',
    fontSize: 16,
    padding: 4,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  noResultsText: {
    color: '#888',
    fontSize: 16,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreCard: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
