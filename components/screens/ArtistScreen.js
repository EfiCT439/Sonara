import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useUser } from '../../context/UserContext';

const ARTIST_SONGS = {
  'Burna Boy': [
    { id: '1', title: 'Last Last', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Anybody', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Ye', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'Wizkid': [
    { id: '1', title: 'Essence', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Ojuelegba', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Come Closer', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
  'default': [
    { id: '1', title: 'Song 1', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Song 2', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Song 3', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ],
};

export default function ArtistScreen({ navigation, route }) {
  const { artist } = route.params;
  const [isFollowing, setIsFollowing] = useState(false);
  const songs = ARTIST_SONGS[artist.name] || ARTIST_SONGS['default'];

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? 'Unfollowed' : 'Following',
      isFollowing ? `You unfollowed ${artist.name}` : `You are now following ${artist.name}! 🎤`
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.artistHeader}>
        <View style={styles.artistImage}>
          <Text style={styles.artistEmoji}>🎤</Text>
        </View>
        <Text style={styles.artistName}>{artist.name}</Text>
        <Text style={styles.artistGenre}>{artist.genre}</Text>

        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={toggleFollow}>
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? '✓ Following' : '+ Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Popular Songs</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {songs.map(song => (
          <TouchableOpacity
            key={song.id}
            style={styles.songCard}
            onPress={() => navigation.navigate('Player', { song: { ...song, artist: artist.name } })}>
            <View style={styles.songImage}>
              <Text style={styles.songEmoji}>{song.emoji}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songArtist}>{artist.name}</Text>
            </View>
            <Text style={styles.playIcon}>▶️</Text>
          </TouchableOpacity>
        ))}
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
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#1DB954',
    fontSize: 16,
  },
  artistHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  artistImage: {
    width: 100,
    height: 100,
    backgroundColor: '#1A1A1A',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  artistEmoji: {
    fontSize: 50,
  },
  artistName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  artistGenre: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  followButton: {
    borderWidth: 2,
    borderColor: '#1DB954',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
  },
  followingButton: {
    backgroundColor: '#1DB954',
  },
  followButtonText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
});