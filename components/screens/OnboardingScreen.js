import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useUser } from '../../context/UserContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const ARTISTS = [
  { id: '1', name: 'Burna Boy', genre: 'Afrobeats', emoji: '🎤' },
  { id: '2', name: 'Wizkid', genre: 'Afrobeats', emoji: '🎸' },
  { id: '3', name: 'Drake', genre: 'Hip Hop', emoji: '🎵' },
  { id: '4', name: 'Davido', genre: 'Afrobeats', emoji: '🎶' },
  { id: '5', name: 'Taylor Swift', genre: 'Pop', emoji: '🎹' },
  { id: '6', name: 'The Weeknd', genre: 'R&B', emoji: '🎧' },
  { id: '7', name: 'Adele', genre: 'Soul', emoji: '🎼' },
  { id: '8', name: 'Rema', genre: 'Afrobeats', emoji: '🎤' },
  { id: '9', name: 'Ed Sheeran', genre: 'Pop', emoji: '🎸' },
  { id: '10', name: 'Tiwa Savage', genre: 'Afrobeats', emoji: '🎵' },
  { id: '11', name: 'Post Malone', genre: 'Hip Hop', emoji: '🎶' },
  { id: '12', name: 'Beyonce', genre: 'R&B', emoji: '🎹' },
  { id: '13', name: 'Bad Bunny', genre: 'Latin', emoji: '🎧' },
  { id: '14', name: 'Asake', genre: 'Afrobeats', emoji: '🎤' },
  { id: '15', name: 'Fireboy DML', genre: 'Afrobeats', emoji: '🎸' },
  { id: '16', name: 'Harry Styles', genre: 'Pop', emoji: '🎵' },
];

const ARTIST_SONGS = {
  'Burna Boy': [
    { id: 'bb1', title: 'Last Last', artist: 'Burna Boy', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'bb2', title: 'Anybody', artist: 'Burna Boy', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'bb3', title: 'Ye', artist: 'Burna Boy', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'Wizkid': [
    { id: 'wz1', title: 'Essence', artist: 'Wizkid', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'wz2', title: 'Ojuelegba', artist: 'Wizkid', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'wz3', title: 'Come Closer', artist: 'Wizkid', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'Drake': [
    { id: 'dr1', title: "God's Plan", artist: 'Drake', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'dr2', title: 'Hotline Bling', artist: 'Drake', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'dr3', title: 'One Dance', artist: 'Drake', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'Davido': [
    { id: 'dv1', title: 'Fall', artist: 'Davido', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'dv2', title: 'Assurance', artist: 'Davido', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'dv3', title: 'Jowo', artist: 'Davido', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'Taylor Swift': [
    { id: 'ts1', title: 'Anti-Hero', artist: 'Taylor Swift', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'ts2', title: 'Shake It Off', artist: 'Taylor Swift', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'ts3', title: 'Love Story', artist: 'Taylor Swift', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'The Weeknd': [
    { id: 'tw1', title: 'Blinding Lights', artist: 'The Weeknd', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'tw2', title: 'Save Your Tears', artist: 'The Weeknd', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'tw3', title: 'Die For You', artist: 'The Weeknd', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'default': [
    { id: 'd1', title: 'Song 1', artist: 'Artist', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'd2', title: 'Song 2', artist: 'Artist', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'd3', title: 'Song 3', artist: 'Artist', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
};

export default function OnboardingScreen({ navigation }) {
  const { setFavouriteArtists } = useUser();
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [customArtists, setCustomArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredArtists = [...ARTISTS, ...customArtists].filter(artist =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleArtist = (artist) => {
    if (selectedArtists.find(a => a.id === artist.id)) {
      setSelectedArtists(selectedArtists.filter(a => a.id !== artist.id));
    } else {
      if (selectedArtists.length >= 3) {
        Alert.alert('Limit reached', 'You can only select 3 artists! Deselect one to choose another.');
        return;
      }
      setSelectedArtists([...selectedArtists, artist]);
    }
  };

  const handleAddCustomArtist = () => {
    if (!search.trim()) return;
    const exists = [...ARTISTS, ...customArtists].find(
      a => a.name.toLowerCase() === search.toLowerCase()
    );
    if (exists) {
      Alert.alert('Artist exists', 'This artist is already in the list!');
      return;
    }
    const newArtist = {
      id: `custom-${Date.now()}`,
      name: search.trim(),
      genre: 'Custom',
      emoji: '🎤',
    };
    setCustomArtists([...customArtists, newArtist]);
    setSearch('');
  };

  const handleContinue = async () => {
    if (selectedArtists.length < 3) {
      Alert.alert('Select 3 artists', 'Please select exactly 3 favourite artists to continue');
      return;
    }

    setLoading(true);
    try {
      const artistsWithSongs = selectedArtists.map(artist => ({
        ...artist,
        songs: ARTIST_SONGS[artist.name] || ARTIST_SONGS['default'],
      }));

      // Save to Firebase Firestore
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          favouriteArtists: artistsWithSongs,
          createdAt: new Date().toISOString(),
        });
      }

      // Save to UserContext
      setFavouriteArtists(artistsWithSongs);
      navigation.navigate('Main');
    } catch (error) {
      Alert.alert('Error', 'Could not save your artists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>Step 1 of 1</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(selectedArtists.length / 3) * 100}%` }]} />
        </View>
        <Text style={styles.title}>Choose Your Favourite Artists</Text>
        <Text style={styles.subtitle}>
          Select 3 artists you love to personalize your experience
        </Text>

        <View style={styles.selectedCount}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[styles.dot, selectedArtists[i] && styles.dotFilled]}>
              {selectedArtists[i] && (
                <Text style={styles.dotText}>{selectedArtists[i].emoji}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search or add an artist..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {search.length > 0 && filteredArtists.length === 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddCustomArtist}>
            <Text style={styles.addButtonText}>+ Add "{search}"</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.artistList} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredArtists.map(artist => {
            const isSelected = selectedArtists.find(a => a.id === artist.id);
            const selectionIndex = selectedArtists.findIndex(a => a.id === artist.id);
            return (
              <TouchableOpacity
                key={artist.id}
                style={[styles.artistCard, isSelected && styles.artistCardSelected]}
                onPress={() => toggleArtist(artist)}>
                <View style={[styles.artistImageCircle, isSelected && styles.artistImageCircleSelected]}>
                  <Text style={styles.artistEmoji}>{artist.emoji}</Text>
                </View>
                <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
                <Text style={styles.artistGenre}>{artist.genre}</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>{selectionIndex + 1}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.button, (selectedArtists.length < 3 || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' :
              selectedArtists.length < 3
                ? `Select ${3 - selectedArtists.length} more artist${3 - selectedArtists.length !== 1 ? 's' : ''}`
                : 'Continue to Sonara →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  stepText: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    lineHeight: 20,
  },
  selectedCount: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  dot: {
    width: 45,
    height: 45,
    backgroundColor: '#1A1A1A',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#282828',
  },
  dotFilled: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  dotText: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#282828',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
  },
  clearIcon: {
    color: '#555',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artistList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artistCard: {
    width: '30%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  artistCardSelected: {
    borderColor: '#1DB954',
    backgroundColor: '#0d2b1a',
  },
  artistImageCircle: {
    width: 55,
    height: 55,
    backgroundColor: '#282828',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artistImageCircleSelected: {
    backgroundColor: '#1DB954',
  },
  artistEmoji: {
    fontSize: 25,
  },
  artistName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  artistGenre: {
    fontSize: 10,
    color: '#888',
    marginTop: 3,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    backgroundColor: '#1DB954',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  checkText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bottomButton: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#0A0A0A',
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#1A1A1A',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});