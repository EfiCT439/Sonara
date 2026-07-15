import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, Modal,
  ScrollView, Animated, Dimensions, Linking, StatusBar,
  TextInput, Clipboard, Image, TouchableWithoutFeedback, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import NetInfo from '@react-native-community/netinfo';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useUser } from '../../context/UserContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const INLINE_VIDEO_H = Math.round(SCREEN_WIDTH * 9 / 16); // 16:9, full-width like YouTube

// Demo fallback so the video experience is watchable until real tracks carry a
// videoUrl. Replace with real music-video URLs from the catalog/backend.
const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

const SAMPLE_SONGS = [
  { id: '1', title: 'Sample Song 1', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', lyrics: 'Verse 1:\nWalking through the city lights\nFeeling the rhythm of the night\nEvery beat takes me higher\nMusic is my burning fire\n\nChorus:\nSing it loud, sing it proud\nLet the music fill the crowd\nThis is our moment tonight\nEverything gonna be alright' },
  { id: '2', title: 'Sample Song 2', artist: 'Drake', genre: 'Hip Hop', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', lyrics: 'Verse 1:\nStarted from the bottom now we here\nEvery day I grind without any fear\n\nChorus:\nThis is my story this is my song\nEvery step I take I grow more strong' },
  { id: '3', title: 'Sample Song 3', artist: 'Taylor Swift', genre: 'Pop', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', lyrics: 'Verse 1:\nIn the golden light of afternoon\nWe were dancing underneath the moon\n\nChorus:\nWe are the stories that never end\nEvery heartbreak helps us mend' },
];

// Top songs are now REAL playable song objects
const ARTIST_INFO = {
  'Burna Boy': {
    bio: 'Burna Boy is a Nigerian singer, songwriter, and record producer. Known as the African Giant, he has redefined Afrobeats globally and won a Grammy Award for Best Global Music Album.',
    genre: 'Afrobeats',
    topSongs: [
      { id: 'bb1', title: 'Last Last', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🔥', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { id: 'bb2', title: 'Anybody', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '⚡', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { id: 'bb3', title: 'Ye', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🌟', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    ],
  },
  'Drake': {
    bio: 'Drake is a Canadian rapper, singer, and songwriter. One of the best-selling music artists of all time, he dominated charts worldwide with his unique blend of rap and R&B.',
    genre: 'Hip Hop',
    topSongs: [
      { id: 'dr1', title: "God's Plan", artist: 'Drake', genre: 'Hip Hop', emoji: '🙏', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { id: 'dr2', title: 'Hotline Bling', artist: 'Drake', genre: 'Hip Hop', emoji: '📱', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { id: 'dr3', title: 'One Dance', artist: 'Drake', genre: 'Hip Hop', emoji: '💃', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    ],
  },
  'Taylor Swift': {
    bio: 'Taylor Swift is an American singer-songwriter. One of the most influential artists of her generation, she has broken numerous records and won multiple Grammy Awards.',
    genre: 'Pop',
    topSongs: [
      { id: 'ts1', title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop', emoji: '🦸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { id: 'ts2', title: 'Shake It Off', artist: 'Taylor Swift', genre: 'Pop', emoji: '💫', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { id: 'ts3', title: 'Love Story', artist: 'Taylor Swift', genre: 'Pop', emoji: '💕', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    ],
  },
};

const VIDEO_QUALITIES = ['Auto', '360p', '480p', '720p', '1080p'];

const GENRE_COLORS = {
  Afrobeats: '#FF6B35',
  'Hip Hop': '#9B59B6',
  Pop: '#E91E63',
  'R&B': '#3498DB',
  Soul: '#E67E22',
  Gospel: '#2ECC71',
  Amapiano: '#1ABC9C',
  Rap: '#E74C3C',
};

const EMOJIS = ['🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '❤️', '🔥', '⚡', '🌙'];

const SHARE_APPS = [
  { name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', key: 'whatsapp' },
  { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', key: 'instagram' },
  { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2', key: 'twitter' },
  { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', key: 'facebook' },
];

export default function PlayerScreen({ navigation, route }) {
  const {
    isPremium, useSkip,
    toggleLikeSong, isSongLiked,
    userPlaylists, addSongToPlaylist, createPlaylist,
    canCreatePlaylist, FREE_SONGS_PER_PLAYLIST,
    currentTrack, isPlayingGlobal,
    miniPlayerPosition, miniPlayerDuration,
    currentQueue,
    loadAndPlay, playPause, playNextInQueue, playPreviousInQueue, seekTo,
    setIsPlayerOpen,
    sleepTimerLabel, setSleepTimer, cancelSleepTimer,
    downloadSong, isDownloaded,
  } = useUser();

  const [isConnected, setIsConnected] = useState(true);
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedShareApp, setSelectedShareApp] = useState(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showAboutArtist, setShowAboutArtist] = useState(false);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showLikeOptions, setShowLikeOptions] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');
  const [pendingSong, setPendingSong] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  const lyricsAnim = useRef(new Animated.Value(0)).current;

  // Fullscreen video (YouTube-style)
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [showFsSettings, setShowFsSettings] = useState(false); // fullscreen settings overlay (no Modal, safe in landscape)
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});
  const videoRef = useRef(null);
  const pausedForVideoRef = useRef(false);
  const controlsTimerRef = useRef(null);

  // Seek state — prevents external position updates from fighting the slider thumb
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const displaySong = currentTrack || route?.params?.song || SAMPLE_SONGS[0];

  const artistInfo = ARTIST_INFO[displaySong.artist] || {
    bio: `${displaySong.artist} is a talented musician creating amazing music for fans worldwide.`,
    genre: 'Music',
    topSongs: [],
  };

  const isLiked = isSongLiked(displaySong.id);
  const bgColor = GENRE_COLORS[displaySong.genre] || '#1DB954';
  const shareLink = `https://sonara.app/song/${displaySong.id}?title=${encodeURIComponent(displaySong.title)}&artist=${encodeURIComponent(displaySong.artist)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareLink)}&format=png&margin=10`;

  const position = miniPlayerPosition;
  const duration = miniPlayerDuration;
  // While the user drags the slider, show the seek position instead of the
  // live audio position — this prevents the thumb from jumping back and forth.
  const displayPosition = isSeeking ? seekPosition : position;
  const progressPercent = duration > 0 ? (displayPosition / duration) * 100 : 0;
  const selectedAppInfo = SHARE_APPS.find(a => a.key === selectedShareApp);

  // Video to play in video mode — real videoUrl if present, else demo fallback.
  const videoSource = displaySong.videoUrl || SAMPLE_VIDEO_URL;

  // Demo caption shown when subtitles are enabled (real subtitle tracks TBD).
  const captionText = displaySong.lyrics
    ? (displaySong.lyrics.split('\n').find(l => l.trim() && !l.includes(':')) || displaySong.title)
    : `♪ ${displaySong.title} ♪`;

  // ── Fullscreen video (YouTube-style, landscape) ──
  const enterFullScreen = async () => {
    // Pause the audio engine so we don't get double sound behind the video
    if (isPlayingGlobal) {
      pausedForVideoRef.current = true;
      await playPause();
    }
    setShowVideoControls(true);
    setIsFullScreen(true);
    try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); } catch (_) {}
  };

  const exitFullScreen = async () => {
    try { if (videoRef.current) await videoRef.current.pauseAsync(); } catch (_) {}
    try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch (_) {}
    setIsFullScreen(false);
    if (pausedForVideoRef.current) {
      pausedForVideoRef.current = false;
      await playPause(); // resume the audio we paused for the video
    }
  };

  const toggleVideoPlay = async () => {
    if (!videoRef.current) return;
    if (videoStatus.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      if (videoStatus.didJustFinish) await videoRef.current.setPositionAsync(0);
      await videoRef.current.playAsync();
    }
    setShowVideoControls(true);
  };

  const seekVideo = async (millis) => {
    if (videoRef.current) await videoRef.current.setPositionAsync(millis);
  };

  const handleDownloadVideo = () => {
    setShowVideoSettings(false);
    if (isDownloaded(displaySong.id)) {
      Alert.alert('Already Downloaded', `"${displaySong.title}" is in Library › Downloads.`);
      return;
    }
    downloadSong({ ...displaySong, videoUrl: videoSource });
    Alert.alert('Downloaded ✅', `"${displaySong.title}" saved to Library › Downloads › Music Videos.`);
  };

  // Auto-hide the video controls while playing (like YouTube)
  useEffect(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isFullScreen && showVideoControls && videoStatus.isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowVideoControls(false), 3500);
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [isFullScreen, showVideoControls, videoStatus.isPlaying]);

  // Always restore portrait when leaving the screen
  useEffect(() => {
    return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); };
  }, []);

  // ── CRITICAL: tell context when player screen is open/closed ──
  useEffect(() => {
    setIsPlayerOpen(true);
    const unsubFocus = navigation.addListener('focus', () => setIsPlayerOpen(true));
    const unsubBlur = navigation.addListener('blur', () => setIsPlayerOpen(false));
    return () => {
      setIsPlayerOpen(false);
      unsubFocus();
      unsubBlur();
    };
  }, [navigation]);

  // Only load the route song if it's genuinely different from what's already playing
  useEffect(() => {
    const routeSong = route?.params?.song;
    if (routeSong && routeSong.id !== currentTrack?.id) {
      loadAndPlay(routeSong, [routeSong], 0);
    }
  }, [route?.params?.song]);

  // Network
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => setIsConnected(state.isConnected));
    return () => unsubscribe();
  }, []);

  const formatTime = (millis) => {
    if (!millis || millis <= 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!isConnected) { Alert.alert('No Internet', 'You need an internet connection!'); return; }
    await playPause();
  };

  const handleNext = async () => {
    if (!isPremium) {
      const canSkip = useSkip();
      if (!canSkip) {
        Alert.alert('Skip Limit Reached', 'Upgrade to Premium for unlimited skips! 💎',
          [{ text: 'Maybe Later' }, { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }]);
        return;
      }
      const n = songsPlayed + 1;
      setSongsPlayed(n);
      if (n % 3 === 0) {
        Alert.alert('📢 Ad', 'Upgrade to Premium — no ads!',
          [{ text: 'Maybe Later' }, { text: 'Go Premium 💎', onPress: () => navigation.navigate('Paywall') }]);
        return;
      }
    }
    await playNextInQueue(isShuffle);
  };

  const handlePrevious = async () => {
    if (!isPremium) {
      Alert.alert('Premium Feature 💎', 'Backward is Premium!',
        [{ text: 'Maybe Later' }, { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }]);
      return;
    }
    await playPreviousInQueue(isShuffle);
  };

  // Play a top song from About Artist directly
  const playTopSong = (song, index) => {
    setShowAboutArtist(false);
    loadAndPlay(song, artistInfo.topSongs, index);
  };

  const toggleLyrics = () => {
    if (showLyrics) {
      Animated.timing(lyricsAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => setShowLyrics(false));
    } else {
      setShowLyrics(true);
      Animated.timing(lyricsAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  };

  const handleLikePress = () => {
    if (isLiked) { toggleLikeSong(displaySong); return; }
    setShowLikeOptions(true);
  };

  const promptPlaylistUpgrade = (title, message) => {
    Alert.alert(title, message, [
      { text: 'Maybe Later', style: 'cancel' },
      { text: 'Go Premium 💎', onPress: () => navigation.navigate('Paywall') },
    ]);
  };

  // Add-to-playlist entry point.
  // Premium: open the full picker (choose a playlist or create a new one).
  // Free: drop the song straight into their single playlist (creating it the
  // first time), capped at FREE_SONGS_PER_PLAYLIST — then show the upgrade prompt.
  const handleAddToPlaylist = (song) => {
    if (isPremium) {
      setPendingSong(song);
      setShowAddToPlaylist(true);
      return;
    }
    let target = userPlaylists.find(p => !p.isLikedSongs);
    if (!target) {
      target = createPlaylist('My Playlist', '🎵');
      if (!target) {
        promptPlaylistUpgrade(
          'Playlist Limit Reached',
          'Free members get one playlist. Upgrade to Premium for unlimited playlists.'
        );
        return;
      }
    }
    const added = addSongToPlaylist(song, target.id);
    if (added) {
      Alert.alert('Added ✅', `"${song.title}" was added to "${target.name}".`);
    } else {
      promptPlaylistUpgrade(
        'Playlist Full',
        `Free playlists hold up to ${FREE_SONGS_PER_PLAYLIST} songs. Upgrade to Premium for unlimited songs and playlists.`
      );
    }
  };

  const handleSaveNewPlaylist = () => {
    if (!newPlaylistName.trim()) { Alert.alert('Name Required', 'Please give your playlist a name.'); return; }
    const playlist = createPlaylist(newPlaylistName.trim(), selectedEmoji);
    if (!playlist) {
      setShowCreatePlaylist(false);
      setShowAddToPlaylist(false);
      promptPlaylistUpgrade(
        'Playlist Limit Reached',
        'Free members get one playlist. Upgrade to Premium for unlimited playlists.'
      );
      return;
    }
    if (pendingSong) setTimeout(() => addSongToPlaylist(pendingSong, playlist.id), 100);
    setNewPlaylistName('');
    setSelectedEmoji('🎵');
    setShowCreatePlaylist(false);
    setShowAddToPlaylist(false);
    setPendingSong(null);
    Alert.alert('Playlist Created 🎉', `"${playlist.name}" is ready and your song was added.`);
  };

  const handleShareAppTap = (app) => {
    setShowShare(false);
    setSelectedShareApp(app);
    setShowShareOptions(true);
  };

  const shareViaLink = async () => {
    setShowShareOptions(false);
    const message = `🎵 Listen to "${displaySong.title}" by ${displaySong.artist} on Sonara!\n\n👉 Open here: ${shareLink}`;
    const encoded = encodeURIComponent(message);
    const appUrls = {
      whatsapp: `whatsapp://send?text=${encoded}`,
      instagram: `instagram://`,
      twitter: `twitter://post?message=${encoded}`,
      facebook: `fb://`,
    };
    const webUrls = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      instagram: `https://www.instagram.com`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}`,
    };
    try {
      const canOpen = await Linking.canOpenURL(appUrls[selectedShareApp]);
      await Linking.openURL(canOpen ? appUrls[selectedShareApp] : webUrls[selectedShareApp]);
    } catch {
      try { await Linking.openURL(webUrls[selectedShareApp]); }
      catch { Alert.alert('Error', `Could not open ${selectedShareApp}.`); }
    }
  };

  const shareViaQR = () => {
    setShowShareOptions(false);
    setQrLoading(true);
    setShowQRCode(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.bgGlow, { backgroundColor: bgColor }]} />
      <View style={styles.bgDark} />

      {isVideoMode && isFullScreen && (
        <View style={styles.fsContainer}>
          <StatusBar hidden />
          <TouchableWithoutFeedback onPress={() => setShowVideoControls(v => !v)}>
            <View style={styles.fsVideoWrap}>
              <Video
                ref={videoRef}
                source={{ uri: videoSource }}
                style={styles.fsVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                onPlaybackStatusUpdate={setVideoStatus}
              />

              {subtitlesOn && (
                <View style={styles.fsCaption}>
                  <Text style={styles.videoCaptionText} numberOfLines={2}>{captionText}</Text>
                </View>
              )}

              {showVideoControls && (
                <View style={styles.fsControls}>
                  {/* Top bar */}
                  <View style={styles.fsTopBar}>
                    <TouchableOpacity onPress={exitFullScreen} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <Ionicons name="chevron-down" size={26} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.fsTitle} numberOfLines={1}>{displaySong.title}</Text>
                    <TouchableOpacity onPress={() => setShowVideoSettings(true)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <Ionicons name="settings-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Center play / pause */}
                  <View style={styles.fsCenter}>
                    <TouchableOpacity style={styles.fsPlayBtn} onPress={toggleVideoPlay}>
                      <Ionicons name={videoStatus.isPlaying ? 'pause' : 'play'} size={40} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Bottom bar: time + seek + minimize */}
                  <View style={styles.fsBottomBar}>
                    <Text style={styles.fsTime}>{formatTime(videoStatus.positionMillis || 0)}</Text>
                    <Slider
                      style={styles.fsSlider}
                      minimumValue={0}
                      maximumValue={videoStatus.durationMillis || 1}
                      value={videoStatus.positionMillis || 0}
                      onSlidingComplete={seekVideo}
                      minimumTrackTintColor="#FF0000"
                      maximumTrackTintColor="rgba(255,255,255,0.4)"
                      thumbTintColor="#FF0000"
                    />
                    <Text style={styles.fsTime}>{formatTime(videoStatus.durationMillis || 0)}</Text>
                    <TouchableOpacity onPress={exitFullScreen} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ marginLeft: 6 }}>
                      <Ionicons name="contract" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {(!isVideoMode || !isFullScreen) && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {isVideoMode ? (
            /* YouTube-style inline video: full-width across the very top */
            <View style={styles.inlineVideoWrap}>
              <Video
                source={{ uri: videoSource }}
                style={styles.inlineVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
                isMuted
              />
              {/* Back — top-left */}
              <TouchableOpacity style={styles.inlineBack} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </TouchableOpacity>
              {/* Settings (download, timer, subtitles, quality) + queue — top-right */}
              <View style={styles.inlineTopRight}>
                <TouchableOpacity style={styles.inlineIconBtn} onPress={() => setShowVideoSettings(true)}>
                  <Ionicons name="settings-outline" size={14} color="#fff" />
                  <Text style={styles.videoBtnText}>{videoQuality}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inlineIconBtnPlain} onPress={() => setShowQueue(true)}>
                  <Ionicons name="list" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              {/* Subtitles caption */}
              {subtitlesOn && (
                <View style={styles.videoCaption}>
                  <Text style={styles.videoCaptionText} numberOfLines={2}>{captionText}</Text>
                </View>
              )}
              {/* Expand — bottom-right */}
              <TouchableOpacity style={styles.inlineExpand} onPress={enterFullScreen}>
                <Ionicons name="expand" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* HEADER */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-down" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerLabel}>NOW PLAYING</Text>
                  <View style={[styles.genreBadge, { backgroundColor: bgColor + '50', borderColor: bgColor }]}>
                    <Text style={styles.genreBadgeText}>{displaySong.genre || 'Music'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={() => setShowQueue(true)}>
                  <Ionicons name="list" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* ALBUM ART */}
              <View style={[styles.albumArtWrapper, { shadowColor: bgColor }]}>
                <View style={[styles.albumArt, { backgroundColor: bgColor + '40' }]}>
                  <Text style={styles.albumEmoji}>{displaySong.emoji || '🎵'}</Text>
                </View>
              </View>
            </>
          )}

          {/* SONG INFO */}
          <View style={styles.songInfoRow}>
            <View style={styles.songInfoLeft}>
              <Text style={styles.songTitle} numberOfLines={1}>{displaySong.title || 'Unknown Title'}</Text>
              <TouchableOpacity onPress={() => setShowAboutArtist(true)}>
                <Text style={[styles.songArtist, { color: bgColor }]}>{displaySong.artist || 'Unknown'}  ›</Text>
              </TouchableOpacity>
              {displaySong.album ? <Text style={styles.songAlbum}>{displaySong.album}</Text> : null}
            </View>
            <View style={styles.songInfoRight}>
              <TouchableOpacity
                onPress={() => handleAddToPlaylist(displaySong)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="add-circle-outline" size={28} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLikePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? bgColor : 'rgba(255,255,255,0.7)'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* PROGRESS BAR */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: bgColor }]} />
              <View style={[styles.progressThumb, { left: `${Math.min(progressPercent, 97)}%`, backgroundColor: '#fff', shadowColor: bgColor }]} />
            </View>
            <Slider
              style={styles.sliderOverlay}
              minimumValue={0}
              maximumValue={duration || 1}
              value={displayPosition}
              onSlidingStart={() => { setIsSeeking(true); setSeekPosition(position); }}
              onValueChange={(v) => setSeekPosition(v)}
              onSlidingComplete={async (v) => { await seekTo(v); setIsSeeking(false); }}
              minimumTrackTintColor="transparent"
              maximumTrackTintColor="transparent"
              thumbTintColor="transparent"
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>-{formatTime(duration - position)}</Text>
            </View>
          </View>

          {/* CONTROLS */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlSideBtn} onPress={() => setIsShuffle(!isShuffle)}>
              <Ionicons name="shuffle" size={24} color={isShuffle ? bgColor : 'rgba(255,255,255,0.5)'} />
              {isShuffle && <View style={[styles.activeDot, { backgroundColor: bgColor }]} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handlePrevious}>
              <Ionicons name="play-skip-back" size={34} color={isPremium ? '#fff' : 'rgba(255,255,255,0.3)'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: bgColor, shadowColor: bgColor }]}
              onPress={handlePlayPause}>
              <Ionicons name={isPlayingGlobal ? 'pause' : 'play'} size={36} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handleNext}>
              <Ionicons name="play-skip-forward" size={34} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlSideBtn}
              onPress={() => {
                if (repeatMode === 0) setRepeatMode(1);
                else if (repeatMode === 1) setRepeatMode(2);
                else setRepeatMode(0);
              }}
              onLongPress={() => setShowRepeatOptions(true)}>
              <Ionicons name={repeatMode > 0 ? 'repeat' : 'repeat-outline'} size={24} color={repeatMode > 0 ? bgColor : 'rgba(255,255,255,0.5)'} />
              {repeatMode === 2 && (
                <View style={[styles.repeatBadge, { backgroundColor: bgColor }]}>
                  <Text style={styles.repeatBadgeText}>{repeatCount}</Text>
                </View>
              )}
              {repeatMode > 0 && <View style={[styles.activeDot, { backgroundColor: bgColor }]} />}
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSleepTimer(true)}>
              <Ionicons name="timer-outline" size={22} color={sleepTimerLabel ? bgColor : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.actionLabel, sleepTimerLabel && { color: bgColor }]}>
                {sleepTimerLabel ? 'Active' : 'Timer'}
              </Text>
            </TouchableOpacity>
            {/* REVIEW MODE: Audio/Video switch temporarily open — restore the isPremium gate + premiumDot after review */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setIsVideoMode(!isVideoMode)}>
              <View>
                <Ionicons name={isVideoMode ? 'musical-notes' : 'videocam-outline'} size={22} color={isVideoMode ? bgColor : 'rgba(255,255,255,0.5)'} />
              </View>
              <Text style={[styles.actionLabel, isVideoMode && { color: bgColor }]}>{isVideoMode ? 'Audio' : 'Video'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={toggleLyrics}>
              <Ionicons name="text-outline" size={22} color={showLyrics ? bgColor : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.actionLabel, showLyrics && { color: bgColor }]}>Lyrics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowShare(true)}>
              <Ionicons name="share-social-outline" size={22} color="rgba(255,255,255,0.5)" />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* LYRICS */}
          {showLyrics && (
            <Animated.View style={[
              styles.lyricsPanel, { borderColor: bgColor + '40' },
              { opacity: lyricsAnim, transform: [{ translateY: lyricsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }
            ]}>
              <View style={styles.lyricsPanelHeader}>
                <Text style={[styles.lyricsPanelTitle, { color: bgColor }]}>Lyrics</Text>
                <TouchableOpacity onPress={toggleLyrics}>
                  <Ionicons name="chevron-up" size={22} color="#555" />
                </TouchableOpacity>
              </View>
              <Text style={styles.lyricsText}>{displaySong.lyrics || 'No lyrics available.'}</Text>
            </Animated.View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* ══ MODALS ══ */}

      {/* About Artist — top songs are PLAYABLE */}
      <Modal visible={showAboutArtist} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: SCREEN_HEIGHT * 0.85 }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.artistHero, { backgroundColor: bgColor + '20' }]}>
                <View style={[styles.artistAvatarCircle, { backgroundColor: bgColor + '40', borderColor: bgColor }]}>
                  <Text style={styles.artistAvatarEmoji}>🎤</Text>
                </View>
                <Text style={styles.artistHeroName}>{displaySong.artist}</Text>
                <View style={[styles.artistGenreBadge, { backgroundColor: bgColor + '30', borderColor: bgColor }]}>
                  <Text style={[styles.artistGenreBadgeText, { color: bgColor }]}>{artistInfo.genre}</Text>
                </View>
              </View>
              <Text style={styles.artistBio}>{artistInfo.bio}</Text>
              <Text style={[styles.topSongsHeading, { color: bgColor }]}>🔥 Top 3 Songs — Tap to Play</Text>
              {artistInfo.topSongs.map((topSong, i) => (
                <TouchableOpacity
                  key={topSong.id}
                  style={styles.topSongRow}
                  onPress={() => playTopSong(topSong, i)}>
                  <View style={[styles.topSongNum, { backgroundColor: bgColor + '20' }]}>
                    <Text style={[styles.topSongNumText, { color: bgColor }]}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 20, marginRight: 4 }}>{topSong.emoji}</Text>
                  <Text style={styles.topSongName}>{topSong.title}</Text>
                  <Ionicons name="play-circle" size={28} color={bgColor} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.viewProfileBtn, { backgroundColor: bgColor }]}
                onPress={() => {
                  setShowAboutArtist(false);
                  navigation.navigate('Artist', { artist: { id: '1', name: displaySong.artist, genre: artistInfo.genre, emoji: '🎤' } });
                }}>
                <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowAboutArtist(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share */}
      <Modal visible={showShare} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Song</Text>
            <View style={[styles.shareCard, { borderColor: bgColor + '40' }]}>
              <View style={[styles.shareCardArt, { backgroundColor: bgColor + '25' }]}>
                <Text style={{ fontSize: 30 }}>{displaySong.emoji || '🎵'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareCardTitle} numberOfLines={1}>{displaySong.title}</Text>
                <Text style={[styles.shareCardArtist, { color: bgColor }]}>{displaySong.artist}</Text>
              </View>
            </View>
            <Text style={styles.shareSubLabel}>Choose an app to share:</Text>
            <View style={styles.shareGrid}>
              {SHARE_APPS.map(app => (
                <TouchableOpacity key={app.key} style={styles.shareAppBtn} onPress={() => handleShareAppTap(app.key)}>
                  <View style={[styles.shareAppIcon, { backgroundColor: app.color }]}>
                    <Ionicons name={app.icon} size={28} color="#fff" />
                  </View>
                  <Text style={styles.shareAppName}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowShare(false)}>
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Options — Link or QR */}
      <Modal visible={showShareOptions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {selectedAppInfo && (
              <View style={styles.shareAppHeader}>
                <View style={[styles.shareAppIconLarge, { backgroundColor: selectedAppInfo.color }]}>
                  <Ionicons name={selectedAppInfo.icon} size={36} color="#fff" />
                </View>
                <Text style={styles.shareAppHeaderTitle}>Share via {selectedAppInfo.name}</Text>
              </View>
            )}
            <TouchableOpacity style={[styles.shareOptionBtn, { backgroundColor: bgColor }]} onPress={shareViaLink}>
              <View style={styles.shareOptionLeft}>
                <Ionicons name="link" size={24} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareOptionTitle}>Send as Link</Text>
                  <Text style={styles.shareOptionSub}>They tap the link to open in Sonara</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareOptionBtnOutline, { borderColor: bgColor + '50' }]} onPress={shareViaQR}>
              <View style={styles.shareOptionLeft}>
                <Ionicons name="qr-code" size={24} color={bgColor} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shareOptionTitle, { color: bgColor }]}>Send as QR Code</Text>
                  <Text style={styles.shareOptionSub}>They scan it to open the song</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowShareOptions(false)}>
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code */}
      <Modal visible={showQRCode} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { alignItems: 'center' }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>QR Code 📱</Text>
            <Text style={styles.modalSub}>
              Screenshot and send via {selectedAppInfo?.name || 'the app'}.{'\n'}They scan it to open the song!
            </Text>
            <View style={[styles.qrBox, { borderColor: bgColor }]}>
              {qrLoading && (
                <View style={styles.qrLoadingOverlay}>
                  <Text style={styles.qrLoadingText}>Generating QR...</Text>
                </View>
              )}
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrImage}
                onLoad={() => setQrLoading(false)}
                onError={() => setQrLoading(false)}
              />
            </View>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowQRCode(false)}>
              <Text style={styles.sheetCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Like Options */}
      <Modal visible={showLikeOptions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.likeHeader}>
              <Text style={styles.likeEmoji}>❤️</Text>
              <Text style={styles.modalTitle}>Like this song?</Text>
            </View>
            <TouchableOpacity
              style={[styles.likeOptionBtn, { backgroundColor: bgColor }]}
              onPress={() => {
                toggleLikeSong(displaySong);
                setShowLikeOptions(false);
                Alert.alert('❤️ Liked!', 'Added to Liked Songs in your Library!');
              }}>
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.likeOptionBtnText}>Add to Liked Songs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.likeOptionOutline}
              onPress={() => {
                toggleLikeSong(displaySong);
                setShowLikeOptions(false);
                handleAddToPlaylist(displaySong);
              }}>
              <Ionicons name="musical-notes-outline" size={20} color="#fff" />
              <Text style={styles.likeOptionOutlineText}>Also add to a Playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowLikeOptions(false)}>
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add to Playlist */}
      <Modal visible={showAddToPlaylist} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => { setShowAddToPlaylist(false); setPendingSong(null); }}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.createPlaylistBtn, { borderColor: bgColor }]}
              onPress={() => {
                if (!canCreatePlaylist()) {
                  setShowAddToPlaylist(false);
                  promptPlaylistUpgrade(
                    'Playlist Limit Reached',
                    'Free members get one playlist. Upgrade to Premium for unlimited playlists.'
                  );
                  return;
                }
                setShowAddToPlaylist(false);
                setShowCreatePlaylist(true);
              }}>
              <View style={[styles.createPlaylistIcon, { backgroundColor: bgColor }]}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
              <Text style={[styles.createPlaylistText, { color: bgColor }]}>Create New Playlist</Text>
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {userPlaylists.map(pl => (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.sheetOption}
                  onPress={() => {
                    const songToAdd = pendingSong || displaySong;
                    const added = addSongToPlaylist(songToAdd, pl.id);
                    setShowAddToPlaylist(false);
                    setPendingSong(null);
                    if (added) {
                      Alert.alert('Added ✅', `Added to "${pl.name}".`);
                    } else {
                      promptPlaylistUpgrade(
                        'Playlist Full',
                        `Free playlists hold up to ${FREE_SONGS_PER_PLAYLIST} songs. Upgrade to Premium to add unlimited songs.`
                      );
                    }
                  }}>
                  <View style={styles.playlistOptionLeft}>
                    <Text style={styles.playlistOptionEmoji}>{pl.emoji}</Text>
                    <View>
                      <Text style={styles.sheetOptionText}>{pl.name}</Text>
                      <Text style={styles.sheetOptionSub}>
                        {pl.songs?.length || 0}{!isPremium && !pl.isLikedSongs ? ` / ${FREE_SONGS_PER_PLAYLIST}` : ''} songs
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => { setShowAddToPlaylist(false); setPendingSong(null); }}>
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Playlist */}
      <Modal visible={showCreatePlaylist} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name..."
              placeholderTextColor="#555"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <Text style={styles.emojiLabel}>Choose an emoji:</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiOption, selectedEmoji === emoji && { borderColor: bgColor, backgroundColor: bgColor + '20' }]}
                  onPress={() => setSelectedEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: bgColor }]} onPress={handleSaveNewPlaylist}>
              <Text style={styles.saveBtnText}>Create & Add Song</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowCreatePlaylist(false)}>
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sleep Timer */}
      <Modal visible={showSleepTimer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Ionicons name="timer-outline" size={22} color={bgColor} />
              <Text style={styles.modalTitle}>  Sleep Timer</Text>
            </View>
            {[
              { label: '15 minutes', value: 15 },
              { label: '30 minutes', value: 30 },
              { label: '45 minutes', value: 45 },
              { label: '1 hour', value: 60 },
              { label: '2 hours', value: 120 },
              { label: '3 hours', value: 180 },
              { label: 'End of song', value: 'end' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.sheetOption, sleepTimerLabel === opt.label && { backgroundColor: bgColor + '20', borderColor: bgColor, borderWidth: 1 }]}
                onPress={() => { setSleepTimer(opt.value, opt.label); setShowSleepTimer(false); }}>
                <Text style={[styles.sheetOptionText, sleepTimerLabel === opt.label && { color: bgColor }]}>{opt.label}</Text>
                {sleepTimerLabel === opt.label && <Ionicons name="checkmark-circle" size={20} color={bgColor} />}
              </TouchableOpacity>
            ))}
            {sleepTimerLabel && (
              <TouchableOpacity style={styles.dangerBtn} onPress={() => {
                cancelSleepTimer();
                setShowSleepTimer(false);
              }}>
                <Text style={styles.dangerBtnText}>Cancel Timer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowSleepTimer(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Repeat */}
      <Modal visible={showRepeatOptions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Repeat Count</Text>
            <View style={styles.countGrid}>
              {[1, 2, 3, 4, 5, 10].map(count => (
                <TouchableOpacity
                  key={count}
                  style={[styles.countBtn, repeatCount === count && { borderColor: bgColor, backgroundColor: bgColor + '20' }]}
                  onPress={() => { setRepeatCount(count); setRepeatMode(2); setShowRepeatOptions(false); }}>
                  <Text style={[styles.countBtnText, repeatCount === count && { color: bgColor }]}>{count}×</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowRepeatOptions(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Video Settings — download, sleep timer, subtitles, quality */}
      <Modal visible={showVideoSettings} transparent animationType="slide" onRequestClose={() => setShowVideoSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Video Settings</Text>

            {/* Download */}
            <TouchableOpacity style={styles.vsRow} onPress={handleDownloadVideo} activeOpacity={0.75}>
              <View style={styles.vsIcon}>
                <Ionicons name={isDownloaded(displaySong.id) ? 'checkmark-circle' : 'download-outline'} size={20} color={isDownloaded(displaySong.id) ? '#1DB954' : '#fff'} />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Download</Text>
                <Text style={styles.vsSub}>{isDownloaded(displaySong.id) ? 'Saved to your Downloads' : 'Save this video to watch offline'}</Text>
              </View>
              {!isDownloaded(displaySong.id) && <Ionicons name="chevron-forward" size={16} color="#555" />}
            </TouchableOpacity>

            {/* Sleep Timer */}
            <TouchableOpacity style={styles.vsRow} onPress={() => { setShowVideoSettings(false); setShowSleepTimer(true); }} activeOpacity={0.75}>
              <View style={styles.vsIcon}>
                <Ionicons name="timer-outline" size={20} color="#fff" />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Sleep Timer</Text>
                <Text style={styles.vsSub}>{sleepTimerLabel ? `On · ${sleepTimerLabel}` : 'Off'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>

            {/* Subtitles */}
            <View style={styles.vsRow}>
              <View style={styles.vsIcon}>
                <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Subtitles</Text>
                <Text style={styles.vsSub}>{subtitlesOn ? 'On' : 'Off'}</Text>
              </View>
              <Switch
                value={subtitlesOn}
                onValueChange={setSubtitlesOn}
                trackColor={{ false: '#2A2A2A', true: bgColor }}
                thumbColor="#fff"
              />
            </View>

            {/* Quality */}
            <TouchableOpacity style={styles.vsRow} onPress={() => { setShowVideoSettings(false); setShowQualityOptions(true); }} activeOpacity={0.75}>
              <View style={styles.vsIcon}>
                <Ionicons name="options-outline" size={20} color="#fff" />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Quality</Text>
                <Text style={styles.vsSub}>Choose the video resolution</Text>
              </View>
              <Text style={styles.vsValue}>{videoQuality}</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowVideoSettings(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Video Quality */}
      <Modal visible={showQualityOptions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Video Quality</Text>
            {VIDEO_QUALITIES.map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.sheetOption, videoQuality === q && { backgroundColor: bgColor + '20', borderColor: bgColor, borderWidth: 1 }]}
                onPress={() => { setVideoQuality(q); setShowQualityOptions(false); }}>
                <Text style={[styles.sheetOptionText, videoQuality === q && { color: bgColor }]}>{q}</Text>
                {videoQuality === q && <Ionicons name="checkmark-circle" size={20} color={bgColor} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowQualityOptions(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Queue */}
      <Modal visible={showQueue} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: SCREEN_HEIGHT * 0.75 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Queue</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(currentQueue.length > 0 ? currentQueue : [displaySong]).map((s, index) => (
                <TouchableOpacity
                  key={s.id + index}
                  style={[styles.queueItem, s.id === displaySong.id && { backgroundColor: bgColor + '15', borderLeftWidth: 3, borderLeftColor: bgColor }]}
                  onPress={() => {
                    loadAndPlay(s, currentQueue.length > 0 ? currentQueue : [s], index);
                    setShowQueue(false);
                  }}>
                  <View style={[styles.queueArt, { backgroundColor: bgColor + '20' }]}>
                    <Text style={styles.queueEmoji}>{s.emoji || '🎵'}</Text>
                  </View>
                  <View style={styles.queueInfo}>
                    <Text style={[styles.queueTitle, s.id === displaySong.id && { color: bgColor }]}>{s.title}</Text>
                    <Text style={styles.queueArtist}>{s.artist}</Text>
                  </View>
                  {s.id === displaySong.id && <Ionicons name="musical-notes" size={18} color={bgColor} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowQueue(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  bgGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 260, opacity: 0.2 },
  bgDark: { position: 'absolute', top: 160, left: 0, right: 0, bottom: 0, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, marginBottom: 20 },
  headerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', gap: 6 },
  headerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  genreBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  genreBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  albumArtWrapper: { alignSelf: 'center', marginBottom: 28, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15 },
  albumArt: { width: SCREEN_WIDTH - 80, height: SCREEN_WIDTH - 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  albumEmoji: { fontSize: 100 },
  videoContainer: { marginHorizontal: 20, height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoEmoji: { fontSize: 70 },
  videoActions: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 8 },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  videoBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  videoPosterPlay: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  videoPosterHint: { position: 'absolute', bottom: 44, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  // Inline (half-screen) YouTube-style video at the top
  inlineVideoWrap: { width: SCREEN_WIDTH, backgroundColor: '#000', paddingTop: 44, marginBottom: 22, position: 'relative' },
  inlineVideo: { width: SCREEN_WIDTH, height: INLINE_VIDEO_H, backgroundColor: '#000' },
  inlineBack: { position: 'absolute', top: 52, left: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  inlineTopRight: { position: 'absolute', top: 54, right: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  inlineIconBtnPlain: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  inlineExpand: { position: 'absolute', bottom: 10, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  videoCaption: { position: 'absolute', bottom: 12, left: 16, right: 60, alignItems: 'center' },
  fsCaption: { position: 'absolute', bottom: 70, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 30 },
  videoCaptionText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },

  // ── YouTube-style fullscreen ──
  fsContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000 },
  fsVideoWrap: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  fsVideo: { width: '100%', height: '100%' },
  fsControls: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'space-between' },
  fsTopBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 22, paddingTop: 22 },
  fsTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  fsCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fsPlayBtn: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  fsBottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 20, gap: 8 },
  fsTime: { color: '#fff', fontSize: 12, fontWeight: '600', width: 46, textAlign: 'center' },
  fsSlider: { flex: 1, height: 40 },
  songInfoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  songInfoLeft: { flex: 1, marginRight: 16 },
  songTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 6 },
  songArtist: { fontSize: 15, fontWeight: '600' },
  songAlbum: { fontSize: 12, color: '#555', marginTop: 3 },
  songInfoRight: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  progressSection: { paddingHorizontal: 24, marginBottom: 20 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, position: 'relative' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, top: -5, marginLeft: -7, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.9, shadowRadius: 4, elevation: 5 },
  sliderOverlay: { position: 'absolute', left: 16, right: 16, height: 40, top: -18, opacity: 0 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 30 },
  controlSideBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  controlBtn: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 10 },
  activeDot: { width: 4, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 3 },
  repeatBadge: { position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  repeatBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  actionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  premiumDot: { position: 'absolute', top: -3, right: -3 },
  lyricsPanel: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1 },
  lyricsPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  lyricsPanelTitle: { fontSize: 16, fontWeight: '800' },
  lyricsText: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 30, textAlign: 'center' },
  offlineBanner: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#ff4444', padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offlineText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#161616', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: SCREEN_HEIGHT * 0.9 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4, textAlign: 'center' },
  modalSub: { color: '#555', fontSize: 13, marginBottom: 16, textAlign: 'center', lineHeight: 20 },
  shareSubLabel: { color: '#888', fontSize: 13, marginBottom: 16 },
  shareCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1E1E1E', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1 },
  shareCardArt: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  shareCardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareCardArtist: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  shareGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  shareAppBtn: { alignItems: 'center', gap: 8 },
  shareAppIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  shareAppName: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  shareAppHeader: { alignItems: 'center', marginBottom: 20 },
  shareAppIconLarge: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  shareAppHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  shareOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 10 },
  shareOptionBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1.5 },
  shareOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  shareOptionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  shareOptionSub: { color: '#666', fontSize: 12 },
  qrBox: { width: 250, height: 250, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: '#fff', overflow: 'hidden' },
  qrImage: { width: 250, height: 250 },
  qrLoadingOverlay: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', zIndex: 1 },
  qrLoadingText: { color: '#333', fontSize: 14, fontWeight: '600' },
  likeHeader: { alignItems: 'center', marginBottom: 20 },
  likeEmoji: { fontSize: 40, marginBottom: 8 },
  likeOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 10 },
  likeOptionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  likeOptionOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  likeOptionOutlineText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createPlaylistBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  createPlaylistIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  createPlaylistText: { fontSize: 15, fontWeight: '700' },
  playlistOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playlistOptionEmoji: { fontSize: 24 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: '#1E1E1E' },
  sheetOptionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sheetOptionSub: { color: '#555', fontSize: 12, marginTop: 2 },

  // Video settings rows
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  vsIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center' },
  vsInfo: { flex: 1 },
  vsLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  vsSub: { color: '#666', fontSize: 12, marginTop: 3 },
  vsValue: { color: '#888', fontSize: 14, fontWeight: '700', marginRight: 4 },

  sheetCloseBtn: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  sheetCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  input: { backgroundColor: '#1E1E1E', color: '#fff', padding: 15, borderRadius: 14, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  emojiLabel: { color: '#555', fontSize: 13, marginBottom: 10 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emojiOption: { width: 44, height: 44, backgroundColor: '#1E1E1E', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  emojiText: { fontSize: 22 },
  saveBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  dangerBtn: { padding: 14, alignItems: 'center' },
  dangerBtnText: { color: '#ff4444', fontSize: 15, fontWeight: '700' },
  countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, justifyContent: 'center' },
  countBtn: { width: 68, height: 68, backgroundColor: '#1E1E1E', borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  countBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  queueItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, backgroundColor: '#1E1E1E', gap: 12 },
  queueArt: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  queueEmoji: { fontSize: 22 },
  queueInfo: { flex: 1 },
  queueTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  queueArtist: { color: '#555', fontSize: 12, marginTop: 2 },
  artistHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  artistAvatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  artistAvatarEmoji: { fontSize: 44 },
  artistHeroName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  artistGenreBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  artistGenreBadgeText: { fontSize: 12, fontWeight: '700' },
  artistBio: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  topSongsHeading: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  topSongRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#1E1E1E', borderRadius: 14, marginBottom: 8, gap: 10 },
  topSongNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  topSongNumText: { fontSize: 13, fontWeight: '800' },
  topSongName: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, marginTop: 12, marginBottom: 8 },
  viewProfileBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});