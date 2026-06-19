 import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useUser } from '../context/UserContext';

export default function MiniPlayer({ navigation, currentSong, isPlaying, onPlayPause }) {
  if (!currentSong) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}>
      <View style={styles.songInfo}>
        <View style={styles.albumArt}>
          <Text style={styles.albumEmoji}>🎵</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{currentSong.artist}</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={onPlayPause} style={styles.controlButton}>
          <Text style={styles.controlIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    right: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArt: {
    width: 45,
    height: 45,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  albumEmoji: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    padding: 5,
  },
  controlIcon: {
    fontSize: 22,
  },
});
