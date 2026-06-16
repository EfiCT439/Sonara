 import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';

const ARTISTS = [
  { id: '1', name: 'Drake', genre: 'Hip Hop' },
  { id: '2', name: 'Burna Boy', genre: 'Afrobeats' },
  { id: '3', name: 'Taylor Swift', genre: 'Pop' },
  { id: '4', name: 'Wizkid', genre: 'Afrobeats' },
  { id: '5', name: 'The Weeknd', genre: 'R&B' },
  { id: '6', name: 'Davido', genre: 'Afrobeats' },
  { id: '7', name: 'Adele', genre: 'Soul' },
  { id: '8', name: 'Rema', genre: 'Afrobeats' },
  { id: '9', name: 'Ed Sheeran', genre: 'Pop' },
  { id: '10', name: 'Tiwa Savage', genre: 'Afrobeats' },
  { id: '11', name: 'Post Malone', genre: 'Hip Hop' },
  { id: '12', name: 'Beyonce', genre: 'R&B' },
  { id: '13', name: 'Bad Bunny', genre: 'Latin' },
  { id: '14', name: 'Asake', genre: 'Afrobeats' },
  { id: '15', name: 'Harry Styles', genre: 'Pop' },
  { id: '16', name: 'Fireboy DML', genre: 'Afrobeats' },
];

export default function OnboardingScreen({ navigation }) {
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [customArtists, setCustomArtists] = useState([]);

  const filteredArtists = [...ARTISTS, ...customArtists].filter(artist =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleArtist = (artist) => {
    if (selectedArtists.find(a => a.id === artist.id)) {
      setSelectedArtists(selectedArtists.filter(a => a.id !== artist.id));
    } else {
      if (selectedArtists.length >= 3) {
        Alert.alert('Limit reached', 'You can only select 3 artists');
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
    };
    setCustomArtists([...customArtists, newArtist]);
    setSearch('');
  };

  const handleContinue = () => {
    if (selectedArtists.length < 3) {
      Alert.alert('Select 3 artists', 'Please select exactly 3 favourite artists to continue');
      return;
    }
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Favourite Artists</Text>
      <Text style={styles.subtitle}>Select 3 artists you love ({selectedArtists.length}/3)</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search or add an artist..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && filteredArtists.length === 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddCustomArtist}>
            <Text style={styles.addButtonText}>+ Add "{search}"</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.artistList}>
        <View style={styles.grid}>
          {filteredArtists.map(artist => {
            const isSelected = selectedArtists.find(a => a.id === artist.id);
            return (
              <TouchableOpacity
                key={artist.id}
                style={[styles.artistCard, isSelected && styles.artistCardSelected]}
                onPress={() => toggleArtist(artist)}>
                <Text style={styles.artistEmoji}>🎵</Text>
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistGenre}>{artist.genre}</Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, selectedArtists.length < 3 && styles.buttonDisabled]}
        onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
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
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#282828',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artistCard: {
    width: '48%',
    backgroundColor: '#282828',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  artistCardSelected: {
    borderColor: '#1DB954',
    backgroundColor: '#1a3a2a',
  },
  artistEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  artistGenre: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  checkmark: {
    color: '#1DB954',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
