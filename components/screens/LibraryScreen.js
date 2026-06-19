 import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { useUser } from '../../context/UserContext';

export default function LibraryScreen({ navigation }) {
  const { isPremium } = useUser();
  const [likedSongs] = useState([
    { id: '1', title: 'Sample Song 1', artist: 'Sample Artist', emoji: '🎵' },
    { id: '2', title: 'Sample Song 2', artist: 'Sample Artist 2', emoji: '🎶' },
  ]);
  const [playlists, setPlaylists] = useState([
    { id: '1', name: 'My Favourites', songs: 5, emoji: '❤️' },
    { id: '2', name: 'Chill Vibes', songs: 8, emoji: '😌' },
  ]);
  const [artists, setArtists] = useState([
    { id: '1', name: 'Burna Boy', genre: 'Afrobeats' },
    { id: '2', name: 'Wizkid', genre: 'Afrobeats' },
  ]);
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [newArtist, setNewArtist] = useState('');

  const handleAddArtist = () => {
    if (!newArtist.trim()) return;
    const artist = {
      id: Date.now().toString(),
      name: newArtist.trim(),
      genre: 'Unknown',
    };
    setArtists([...artists, artist]);
    setNewArtist('');
    setShowAddArtist(false);
    Alert.alert('Success', `${artist.name} added to your artists! 🎤`);
  };

  const handleCreatePlaylist = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature 💎',
        'Creating playlists is a Premium feature! Upgrade for just $1/month!',
        [
          { text: 'Maybe Later' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }
        ]
      );
      return;
    }
    navigation.navigate('Create');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Library 📚</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Liked Songs */}
        <Text style={styles.sectionTitle}>❤️ Liked Songs</Text>
        {likedSongs.map(song => (
          <TouchableOpacity
            key={song.id}
            style={styles.songCard}
            onPress={() => navigation.navigate('Player', { song })}>
            <View style={styles.songImage}>
              <Text style={styles.songEmoji}>{song.emoji}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songArtist}>{song.artist}</Text>
            </View>
            <Text style={styles.playIcon}>▶️</Text>
          </TouchableOpacity>
        ))}

        {/* Playlists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎵 Your Playlists</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreatePlaylist}>
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
        {playlists.map(playlist => (
          <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
            <View style={styles.playlistImage}>
              <Text style={styles.playlistEmoji}>{playlist.emoji}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{playlist.name}</Text>
              <Text style={styles.songArtist}>{playlist.songs} songs</Text>
            </View>
            <Text style={styles.playIcon}>▶️</Text>
          </TouchableOpacity>
        ))}

        {/* Your Artists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎤 Your Artists</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddArtist(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {artists.map(artist => (
          <TouchableOpacity
            key={artist.id}
            style={styles.artistCard}
            onPress={() => navigation.navigate('Artist', { artist })}>
            <View style={styles.artistImage}>
              <Text style={styles.artistEmoji}>🎤</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{artist.name}</Text>
              <Text style={styles.songArtist}>{artist.genre}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Artist Modal */}
      <Modal visible={showAddArtist} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Add Artist</Text>
            <TextInput
              style={styles.input}
              placeholder="Artist name..."
              placeholderTextColor="#888"
              value={newArtist}
              onChangeText={setNewArtist}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddArtist}>
              <Text style={styles.modalButtonText}>Add Artist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddArtist(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
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
  playIcon: {
    fontSize: 20,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  playlistImage: {
    width: 50,
    height: 50,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playlistEmoji: {
    fontSize: 22,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  artistImage: {
    width: 50,
    height: 50,
    backgroundColor: '#1DB954',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artistEmoji: {
    fontSize: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#282828',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
