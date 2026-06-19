 import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { useUser } from '../../context/UserContext';

export default function CreateScreen({ navigation }) {
  const { isPremium } = useUser();
  const [playlists, setPlaylists] = useState([
    { id: '1', name: 'My Favourites', songs: 5, emoji: '❤️' },
    { id: '2', name: 'Chill Vibes', songs: 8, emoji: '😌' },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const emojis = ['🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '❤️', '🔥', '⚡', '🌙'];
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');

  const handleCreate = () => {
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
    setShowCreateModal(true);
  };

  const handleSavePlaylist = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name!');
      return;
    }
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      songs: 0,
      emoji: selectedEmoji,
    };
    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setSelectedEmoji('🎵');
    setShowCreateModal(false);
    Alert.alert('Success', `Playlist "${newPlaylist.name}" created! 🎵`);
  };

  const deletePlaylist = (id) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setPlaylists(playlists.filter(p => p.id !== id))
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create 🎵</Text>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonIcon}>+</Text>
        <Text style={styles.createButtonText}>Create New Playlist</Text>
        {!isPremium && <Text style={styles.lockIcon}>💎</Text>}
      </TouchableOpacity>

      {!isPremium && (
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => navigation.navigate('Paywall')}>
          <Text style={styles.premiumBannerText}>
            💎 Upgrade to Premium to use your playlists!
          </Text>
        </TouchableOpacity>
      )}

      {/* Playlists */}
      <Text style={styles.sectionTitle}>Your Playlists</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {playlists.map(playlist => (
          <TouchableOpacity
            key={playlist.id}
            style={styles.playlistCard}
            onLongPress={() => deletePlaylist(playlist.id)}>
            <View style={styles.playlistImage}>
              <Text style={styles.playlistEmoji}>{playlist.emoji}</Text>
            </View>
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistSongs}>{playlist.songs} songs</Text>
            </View>
            {!isPremium && <Text style={styles.lockBadge}>🔒</Text>}
            {isPremium && <Text style={styles.playIcon}>▶️</Text>}
          </TouchableOpacity>
        ))}
        <Text style={styles.hint}>💡 Long press a playlist to delete it</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎵 New Playlist</Text>

            <TextInput
              style={styles.input}
              placeholder="Playlist name..."
              placeholderTextColor="#888"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />

            <Text style={styles.emojiLabel}>Choose an emoji:</Text>
            <View style={styles.emojiGrid}>
              {emojis.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleSavePlaylist}>
              <Text style={styles.modalButtonText}>Create Playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    gap: 10,
  },
  createButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  lockIcon: {
    fontSize: 18,
  },
  premiumBanner: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBannerText: {
    color: '#FFD700',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
    width: 55,
    height: 55,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playlistEmoji: {
    fontSize: 25,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  playlistSongs: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  lockBadge: {
    fontSize: 18,
  },
  playIcon: {
    fontSize: 20,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
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
  emojiLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  emojiOption: {
    width: 45,
    height: 45,
    backgroundColor: '#282828',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#1DB954',
    backgroundColor: '#1a3a2a',
  },
  emojiText: {
    fontSize: 22,
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
