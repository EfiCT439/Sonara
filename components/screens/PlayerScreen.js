import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Modal, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { useUser } from '../../context/UserContext';

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
  interruptionModeIOS: 1,
  interruptionModeAndroid: 1,
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
  const { isPremium, skipsRemaining, useSkip } = useUser();
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerLabel, setSleepTimerLabel] = useState(null);
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const sleepTimerRef = useRef(null);
  const currentSongIndexRef = useRef(0);
  const soundRef = useRef(null);

  const currentSong = SAMPLE_SONGS[currentSongIndex];

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        Alert.alert('No Internet', 'You need an internet connection to play music!');
        if (soundRef.current) soundRef.current.pauseAsync();
      }
    });

    return () => {
      unsubscribe();
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const loadAndPlaySong = async (song, songIndex) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          // Auto play next song when current song finishes
          if (status.didJustFinish) {
            const nextIndex = (currentSongIndexRef.current + 1) % SAMPLE_SONGS.length;
            currentSongIndexRef.current = nextIndex;
            setCurrentSongIndex(nextIndex);
            loadAndPlaySong(SAMPLE_SONGS[nextIndex], nextIndex);
          }
        }
      });

      soundRef.current = newSound;
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
      if (soundRef.current === null) {
        currentSongIndexRef.current = currentSongIndex;
        await loadAndPlaySong(currentSong, currentSongIndex);
      } else {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not play this song: ' + error.message);
    }
  };

  const playNext = async () => {
    const canSkip = useSkip();
    if (!canSkip) {
      Alert.alert(
        'Skip Limit Reached',
        'You have used all 8 skips for this hour! Upgrade to Premium for unlimited skips! 💎',
        [
          { text: 'Maybe Later' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }
        ]
      );
      return;
    }

    if (!isPremium) {
      const newSongsPlayed = songsPlayed + 1;
      setSongsPlayed(newSongsPlayed);
      if (newSongsPlayed % 3 === 0) {
        Alert.alert(
          '📢 Advertisement',
          'Tired of ads? Upgrade to Sonara Premium for just $1/month and enjoy ad-free music! 🎵',
          [
            { text: 'Maybe Later' },
            { text: 'Go Premium 💎', onPress: () => navigation.navigate('Paywall') }
          ]
        );
        return;
      }
    }

    const nextIndex = (currentSongIndex + 1) % SAMPLE_SONGS.length;
    currentSongIndexRef.current = nextIndex;
    setCurrentSongIndex(nextIndex);
    setIsFavourite(false);
    await loadAndPlaySong(SAMPLE_SONGS[nextIndex], nextIndex);
  };

  const playPrevious = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature 💎',
        'The backward button is a Premium feature! Upgrade for just $1/month!',
        [
          { text: 'Maybe Later' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }
        ]
      );
      return;
    }
    const prevIndex = (currentSongIndex - 1 + SAMPLE_SONGS.length) % SAMPLE_SONGS.length;
    currentSongIndexRef.current = prevIndex;
    setCurrentSongIndex(prevIndex);
    setIsFavourite(false);
    await loadAndPlaySong(SAMPLE_SONGS[prevIndex], prevIndex);
  };

  const toggleFavourite = () => {
    setIsFavourite(!isFavourite);
    Alert.alert(
      isFavourite ? 'Removed from Favourites' : 'Added to Favourites',
      isFavourite ? `${currentSong.title} removed` : `${currentSong.title} added to favourites`
    );
  };

  const toggleVideoAudio = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature 💎',
        'Audio/Video switch is a Premium feature! Upgrade for just $1/month!',
        [
          { text: 'Maybe Later' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }
        ]
      );
      return;
    }
    setShowVideo(!showVideo);
    Alert.alert(
      showVideo ? '🎵 Audio Mode' : '🎬 Video Mode',
      showVideo ? 'Switched to audio mode' : 'Switched to video mode — video feature coming soon!'
    );
  };

  const setSleepTimer = (minutes, label) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepTimerLabel(label);
    setShowSleepTimer(false);

    if (minutes === 'end') {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate((status) => {
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            soundRef.current.unloadAsync();
            soundRef.current = null;
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
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
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
        <View style={styles.headerRight}>
          {!isPremium && (
            <Text style={styles.skipsText}>⏭ {skipsRemaining} skips left</Text>
          )}
          <TouchableOpacity onPress={() => setShowSleepTimer(true)}>
            <Text style={styles.timerIcon}>🌙 {sleepTimerLabel || 'Timer'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Badge */}
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>💎 Premium</Text>
        </View>
      )}

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

      {/* Audio/Video Toggle */}
      <TouchableOpacity
        style={[styles.videoToggle, !isPremium && styles.videoToggleLocked]}
        onPress={toggleVideoAudio}>
        <Text style={styles.videoToggleText}>
          {showVideo ? '🎵 Switch to Audio' : '🎬 Switch to Video'}
          {!isPremium && ' 💎'}
        </Text>
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleFavourite}>
          <Text style={styles.controlIcon}>{isFavourite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
          <Text style={[styles.controlIcon, !isPremium && styles.lockedControl]}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={playPauseSound}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
          <Text style={styles.controlIcon}>💎</Text>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backText: {
    color: '#1DB954',
    fontSize: 16,
  },
  skipsText: {
    color: '#888',
    fontSize: 12,
  },
  timerIcon: {
    color: '#1DB954',
    fontSize: 14,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    padding: 5,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 10,
  },
  premiumBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  albumArt: {
    width: 200,
    height: 200,
    backgroundColor: '#282828',
    borderRadius: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  albumImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  albumEmoji: {
    fontSize: 70,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  songArtist: {
    fontSize: 16,
    color: '#888',
  },
  videoToggle: {
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  videoToggleLocked: {
    borderColor: '#FFD700',
  },
  videoToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 20,
  },
  controlButton: {
    padding: 5,
  },
  controlIcon: {
    fontSize: 28,
  },
  lockedControl: {
    opacity: 0.3,
  },
  playButton: {
    width: 65,
    height: 65,
    backgroundColor: '#1DB954',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
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