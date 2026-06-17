import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});

export default function PlayerScreen({ navigation, route }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);

  const song = route?.params?.song || {
    title: 'Sample Song',
    artist: 'Sample Artist',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverImage: null,
    lyrics: 'These are the sample lyrics for this song...',
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        Alert.alert('No Internet', 'You need an internet connection to play music!');
        if (sound) sound.pauseAsync();
      }
    });

    return () => {
      unsubscribe();
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const playPauseSound = async () => {
    if (!isConnected) {
      Alert.alert('No Internet', 'You need an internet connection to play music!');
      return;
    }
    try {
      if (sound === null) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: song.audioUrl },
          { shouldPlay: true }
        );
        newSound.setOnPlaybackStatusUpdate((status) => {
          setIsPlaying(status.isPlaying);
        });
        setSound(newSound);
        setIsPlaying(true);
      } else {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not play this song: ' + error.message);
    }
  };

  const toggleFavourite = () => {
    setIsFavourite(!isFavourite);
    Alert.alert(
      isFavourite ? 'Removed from Favourites' : 'Added to Favourites',
      isFavourite ? `${song.title} removed from your favourites` : `${song.title} added to your favourites`
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.albumArt}>
        {song.coverImage ? (
          <Image source={{ uri: song.coverImage }} style={styles.albumImage} />
        ) : (
          <Text style={styles.albumEmoji}>🎵</Text>
        )}
      </View>

      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songArtist}>{song.artist}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleFavourite}>
          <Text style={styles.controlIcon}>{isFavourite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={playPauseSound}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lyricsContainer}>
        <Text style={styles.lyricsTitle}>Lyrics</Text>
        <Text style={styles.lyrics}>{song.lyrics}</Text>
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ No internet connection</Text>
        </View>
      )}
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
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#1DB954',
    fontSize: 16,
  },
  albumArt: {
    width: 250,
    height: 250,
    backgroundColor: '#282828',
    borderRadius: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  albumImage: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  albumEmoji: {
    fontSize: 80,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  songArtist: {
    fontSize: 16,
    color: '#888',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 30,
  },
  controlIcon: {
    fontSize: 30,
  },
  playButton: {
    width: 70,
    height: 70,
    backgroundColor: '#1DB954',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 30,
  },
  lyricsContainer: {
    backgroundColor: '#282828',
    borderRadius: 10,
    padding: 15,
    flex: 1,
  },
  lyricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 10,
  },
  lyrics: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 24,
  },
  offlineBanner: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});