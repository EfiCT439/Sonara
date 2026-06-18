import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Modal, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});

const SAMPLE_SONGS = [
  {
    id: '1',
    title: 'Sample Song 1',
    artist: 'Sample Artist',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverImage: null,
    lyrics: 'These are the lyrics for Sample Song 1...',
  },
  {
    id: '2',
    title: 'Sample Song 2',
    artist: 'Sample Artist 2',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverImage: null,
    lyrics: 'These are the lyrics for Sample Song 2...',
  },
  {
    id: '3',
    title: 'Sample Song 3',
    artist: 'Sample Artist 3',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverImage: null,
    lyrics: 'These are the lyrics for Sample Song 3...',
  },
];

export default function PlayerScreen({ navigation, route }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerLabel, setSleepTimerLabel] = useState(null);
  const sleepTimerRef = useRef(null);

  const currentSong = SAMPLE_SONGS[currentSongIndex];

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
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [sound]);

  const loadAndPlaySong = async (song) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
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
    } catch (error) {
      Alert.alert('Error', 'Could not play this song: ' + error.message);
    }
  };

  const playPauseSound = async () => {
    if (!isConnected) {
      Alert.alert('No Internet', 'You need an internet connection to play music!');
      return;
    }
    try {
      if (sound === null) {
        await loadAndPlaySong(currentSong);
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

  const playNext = async () => {
    const nextIndex = (currentSongIndex + 1) % SAMPLE_SONGS.length;
    setCurrentSongIndex(nextIndex);
    setIsFavourite(false);
    await loadAndPlaySong(SAMPLE_SONGS[nextIndex]);
  };

  const toggleFavourite = () => {
    setIsFavourite(!isFavourite);
    Alert.alert(
      isFavourite ? 'Removed from Favourites' : 'Added to Favourites',
      isFavourite ? `${currentSong.title} removed` : `${currentSong.title} added to favourites`
    );
  };

  const setSleepTimer = (minutes, label) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepTimerLabel(label);
    setShowSleepTimer(false);

    if (minutes === 'end') {
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
            setSleepTimerLabel(null);
            Alert.alert('Sleep Timer', 'Music stopped. Sleep well! 🌙');
          }
        });
      }
      return;
    }

    const ms = minutes * 60 * 1000;
    sleepTimerRef.current = setTimeout(async () => {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
      setSleepTimerLabel(null);
      Alert.alert('Sleep Timer', 'Music stopped. Sleep well! 🌙');
    }, ms);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepTimerLabel(null);
    setShowSleepTimer(false);
    Alert.alert('Sleep Timer', 'Sleep timer cancelled!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSleepTimer(true)}>
          <Text style={styles.timerIcon}>🌙 {sleepTimerLabel || 'Timer'}</Text>
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.albumArt}>
        {currentSong.coverImage ? (
          <Image source={{ uri: currentSong.coverImage }} style={styles.albumImage} />
        ) : (
          <Text style={styles.albumEmoji}>🎵</Text>
        )}
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{currentSong.title}</Text>
        <Text style={styles.songArtist}>{currentSong.artist}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleFavourite}>
          <Text style={styles.controlIcon}>{isFavourite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={playPauseSound}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Lyrics */}
      <ScrollView style={styles.lyricsContainer}>
        <Text style={styles.lyricsTitle}>Lyrics</Text>
        <Text style={styles.lyrics}>{currentSong.lyrics}</Text>
      </ScrollView>

      {/* Offline Banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ No internet connection</Text>
        </View>
      )}

      {/* Sleep Timer Modal */}
      <Modal visible={showSleepTimer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🌙 Sleep Timer</Text>

            {[
              { label: '30 minutes', value: 30 },
              { label: '45 minutes', value: 45 },
              { label: '1 hour', value: 60 },
              { label: '2 hours', value: 120 },
              { label: '3 hours', value: 180 },
              { label: 'End of song', value: 'end' },
            ].map(option => (
              <TouchableOpacity
                key={option.label}
                style={styles.timerOption}
                onPress={() => setSleepTimer(option.value, option.label)}>
                <Text style={styles.timerOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            {sleepTimerLabel && (
              <TouchableOpacity style={styles.cancelTimer} onPress={cancelSleepTimer}>
                <Text style={styles.cancelTimerText}>❌ Cancel Timer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeModal}
              onPress={() => setShowSleepTimer(false)}>
              <Text style={styles.closeModalText}>Close</Text>
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
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: '#1DB954',
    fontSize: 16,
  },
  timerIcon: {
    color: '#1DB954',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#282828',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timerOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelTimer: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelTimerText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeModal: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  closeModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});