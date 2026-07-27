import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, Modal,
  ScrollView, Animated, Dimensions, StatusBar, ActivityIndicator,
  TextInput, Clipboard, Image, TouchableWithoutFeedback, Switch, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import NetInfo from '@react-native-community/netinfo';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useUser } from '../../context/UserContext';
import { useArtwork, useDominantColor } from '../../services/artwork';
import { useLyrics, activeSyncedIndex } from '../../services/lyricsApi';
import { findYouTubeId } from '../../services/youtube';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const INLINE_VIDEO_H = Math.round(SCREEN_WIDTH * 9 / 16); // 16:9, full-width like YouTube
// Landscape fullscreen dimensions (the long side becomes the width).
const FS_W = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
const FS_H = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);

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

// Lyrics arrive as a plain string — nothing in the app carries per-line timestamps
// (no LRC data, no lyrics provider), so there is nothing to sync against precisely.
// The full-screen view therefore paces the lines evenly across the track: each
// singable line gets an equal slice of the duration. It follows the song's progress
// honestly, but it is an approximation and will not land exactly on the vocal.
// Swap this for real timestamps the moment the catalog carries them.
const SECTION_RE = /^\s*(\[.*\]|(intro|verse|pre-chorus|chorus|hook|bridge|outro|refrain)\b.*:?)\s*$/i;

const parseLyrics = (raw) => {
  if (!raw || !raw.trim()) return [];
  return raw
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(text => ({ text, isSection: SECTION_RE.test(text) || /:$/.test(text) }));
};

// Index of the line that should be lit up right now, counted over singable lines
// only so section headers don't eat a slot of the song's time.
const activeLyricLine = (lines, position, duration) => {
  const singable = lines.filter(l => !l.isSection);
  if (!singable.length || !duration) return -1;
  const progress = Math.min(Math.max(position / duration, 0), 0.999);
  const nth = Math.floor(progress * singable.length);
  return lines.indexOf(singable[nth]);
};

const LYRIC_LINE_H = 46;

// YouTube-style double-tap seek. A second tap on the same side within this window
// counts as a double tap; while the indicator is still on screen any further tap on
// that side keeps stacking (10s, 20s, 30s…). A lone tap just toggles the controls,
// but only after the window closes — otherwise the controls flash before the second
// tap of a double tap lands.
const DOUBLE_TAP_MS = 300;
const SEEK_HINT_LINGER_MS = 850;
const FORWARD_STEP_MS = 10000;
const BACK_STEP_MS = 5000;

const SLEEP_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: 'End of song', value: 'end' },
];

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
    downloadSong, isDownloaded, colors: c,
  } = useUser();
  const styles = makeStyles(c);

  const [isConnected, setIsConnected] = useState(true);
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [showLyrics, setShowLyrics] = useState(false);
  const [showLyricsFull, setShowLyricsFull] = useState(false);
  const lyricsScrollRef = useRef(null);

  // Double-tap seek: { side: 'back'|'forward', total } while the indicator shows.
  const [seekHint, setSeekHint] = useState(null);
  const seekHintRef = useRef(null);   // mirror, so a tap can read it without a re-render
  const lastTapRef = useRef({ time: 0, side: null });
  const hintTimerRef = useRef(null);
  const singleTapTimerRef = useRef(null);
  // Measured rather than derived from Dimensions: the same handler serves the
  // portrait inline video and the landscape fullscreen one, whose widths differ.
  const videoAreaWRef = useRef(0);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false); // one "⋯" menu: Queue · Download · Sleep Timer
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
  const [fsPanel, setFsPanel] = useState('main'); // 'main' | 'sleep' | 'quality' — sub-view inside the fullscreen overlay
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});
  const videoRef = useRef(null);
  const pausedForVideoRef = useRef(false);
  const controlsTimerRef = useRef(null);

  // ── Video mode = the real YouTube music video, with Sonara-only controls ──
  // Independent of the audio engine: entering Video pauses the audio and plays the
  // video (its own sound); leaving resumes the audio. No YouTube UI is shown.
  const ytRef = useRef(null);
  const [ytId, setYtId] = useState(null);
  const [ytResolving, setYtResolving] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [ytPlaying, setYtPlaying] = useState(true); // start playing so the embed autoplays (mediaPlaybackRequiresUserAction:false)
  const [ytPos, setYtPos] = useState(0);   // millis
  const [ytDur, setYtDur] = useState(0);   // millis
  const [ytFull, setYtFull] = useState(false); // video fullscreen (landscape)
  const pausedForYtRef = useRef(false);

  // Seek state — prevents external position updates from fighting the slider thumb
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const displaySong = currentTrack || route?.params?.song || SAMPLE_SONGS[0];
  const displayArt = useArtwork(displaySong);

  const artistInfo = ARTIST_INFO[displaySong.artist] || {
    bio: `${displaySong.artist} is a talented musician creating amazing music for fans worldwide.`,
    genre: 'Music',
    topSongs: [],
  };

  const isLiked = isSongLiked(displaySong.id);
  // Background adapts to the playing song's cover art (any genre); falls back to
  // the genre colour until the art's dominant colour is extracted.
  const genreColor = GENRE_COLORS[displaySong.genre] || '#888';
  const bgColor = useDominantColor(displayArt, genreColor);
  const shareLink = `https://sonara.app/song/${displaySong.id}?title=${encodeURIComponent(displaySong.title)}&artist=${encodeURIComponent(displaySong.artist)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareLink)}&format=png&margin=10`;

  // Position/duration/playing come from context, which unifies the expo-av and
  // YouTube engines — so this screen's controls work the same for either.
  const position = miniPlayerPosition;
  const duration = miniPlayerDuration;
  // While the user drags the slider, show the seek position instead of the
  // live audio position — this prevents the thumb from jumping back and forth.
  const displayPosition = isSeeking ? seekPosition : position;
  const progressPercent = duration > 0 ? (displayPosition / duration) * 100 : 0;

  // Real lyrics from LRCLIB (plain + time-synced). A song's own embedded lyrics
  // (AI-generated tracks) take priority; otherwise we use what LRCLIB returns.
  // Time-synced lyrics drive exact line highlighting; plain lyrics fall back to
  // even pacing across the track.
  const fetchedLyrics = useLyrics(displaySong);
  const ownLyrics = (displaySong.lyrics || '').trim();
  const useSynced = !ownLyrics && fetchedLyrics.synced.length > 0;
  const plainLyrics = ownLyrics || fetchedLyrics.plain;
  const lyricsStatus = ownLyrics ? 'ok' : fetchedLyrics.status; // 'loading' | 'ok' | 'none'
  const lyricLines = useSynced
    ? fetchedLyrics.synced.map(l => ({ text: l.text, isSection: false }))
    : parseLyrics(plainLyrics);
  const activeLine = useSynced
    ? activeSyncedIndex(fetchedLyrics.synced, displayPosition)
    : activeLyricLine(lyricLines, displayPosition, duration);

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

  // Jump the video by a delta, clamped to the clip so a skip near either end
  // can't seek past the duration (which throws) or before zero.
  const skipVideo = async (deltaMs) => {
    if (!videoRef.current) return;
    const duration = videoStatus.durationMillis || 0;
    const current = videoStatus.positionMillis || 0;
    const target = Math.max(0, duration ? Math.min(current + deltaMs, duration) : current + deltaMs);
    try { await videoRef.current.setPositionAsync(target); } catch (_) {}
    setShowVideoControls(true); // keep controls up while the user is scrubbing
  };

  // A tap on the video: double-tap the right half to jump forward, the left half to
  // jump back. Repeat taps on the same side stack up while the indicator lingers.
  // Anything else is a lone tap and just shows/hides the controls.
  const handleVideoTap = (evt) => {
    const width = videoAreaWRef.current;
    if (!width) return; // not laid out yet — can't tell which half was tapped
    const x = evt?.nativeEvent?.locationX ?? 0;
    const side = x < width / 2 ? 'back' : 'forward';
    const now = Date.now();
    const prev = lastTapRef.current;
    lastTapRef.current = { time: now, side };

    const isDoubleTap = now - prev.time < DOUBLE_TAP_MS && prev.side === side;
    const stacking = seekHintRef.current?.side === side; // indicator still up — keep adding

    if (!isDoubleTap && !stacking) {
      // Defer the toggle: if a second tap lands inside the window this is cancelled.
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => setShowVideoControls(v => !v), DOUBLE_TAP_MS);
      return;
    }

    clearTimeout(singleTapTimerRef.current); // it's a seek, not a controls toggle
    const step = side === 'forward' ? FORWARD_STEP_MS : BACK_STEP_MS;
    const total = (stacking ? seekHintRef.current.total : 0) + step;

    seekHintRef.current = { side, total };
    setSeekHint({ side, total });
    skipVideo(side === 'forward' ? step : -step);

    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      seekHintRef.current = null;
      setSeekHint(null);
    }, SEEK_HINT_LINGER_MS);
  };

  // Don't leave the deferred toggle or the indicator running after unmount.
  useEffect(() => () => {
    clearTimeout(singleTapTimerRef.current);
    clearTimeout(hintTimerRef.current);
  }, []);

  const handleDownloadVideo = () => {
    setShowVideoSettings(false);
    if (isDownloaded(displaySong.id)) {
      Alert.alert('Already Downloaded', `"${displaySong.title}" is in Library › Downloads.`);
      return;
    }
    downloadSong({ ...displaySong, videoUrl: videoSource });
    Alert.alert('Downloaded ✅', `"${displaySong.title}" saved to Library › Downloads › Music Videos.`);
  };

  // ── Video mode (YouTube) lifecycle ──────────────────────────────
  // Resolve the real music-video id when Video mode opens (per song).
  useEffect(() => {
    let cancelled = false;
    if (!isVideoMode) { setYtId(null); setYtReady(false); return; }
    setShowVideoControls(true);
    setYtResolving(true);
    findYouTubeId(displaySong)
      .then(id => { if (!cancelled) setYtId(id); })
      .finally(() => { if (!cancelled) setYtResolving(false); });
    return () => { cancelled = true; };
  }, [isVideoMode, displaySong.id]);

  // Fresh video → reset position, keep play=true so the new embed autoplays.
  useEffect(() => {
    setYtReady(false); setYtPos(0); setYtDur(0); setYtPlaying(true);
  }, [ytId]);

  // Called when either the inline or the fullscreen player becomes ready: restore
  // the position (across a fullscreen swap) and make sure it's playing.
  const onYtReady = () => {
    setYtReady(true);
    if (ytPos > 1000) { try { ytRef.current?.seekTo?.(ytPos / 1000, true); } catch (_) {} }
    setYtPlaying(true);
  };

  const enterYtFull = async () => {
    setShowVideoControls(true);
    setYtReady(false); setYtPlaying(true); // the player remounts in landscape — keep autoplaying
    setYtFull(true);
    try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); } catch (_) {}
  };
  const exitYtFull = async () => {
    setYtReady(false); setYtPlaying(true); // remounts back inline (portrait) — keep autoplaying
    try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch (_) {}
    setYtFull(false);
  };

  // Keep the two engines apart: pause the audio while a video plays, resume after.
  useEffect(() => {
    if (isVideoMode) {
      if (isPlayingGlobal) { pausedForYtRef.current = true; playPause(); }
    } else if (pausedForYtRef.current) {
      pausedForYtRef.current = false; playPause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoMode]);

  // Mirror the video's position/duration into Sonara's video scrubber.
  useEffect(() => {
    if (!isVideoMode || !ytReady) return;
    const iv = setInterval(async () => {
      try {
        const cur = await ytRef.current?.getCurrentTime?.();
        const dur = await ytRef.current?.getDuration?.();
        if (typeof cur === 'number' && !isSeeking) setYtPos(cur * 1000);
        if (typeof dur === 'number' && dur > 0) setYtDur(dur * 1000);
      } catch (_) {}
    }, 500);
    return () => clearInterval(iv);
  }, [isVideoMode, ytReady, isSeeking]);

  const onYtStateChange = (state) => {
    // Keep our play/pause icon in sync with the real player — including the
    // 'unstarted'/'video cued' states you get when the embed blocks autoplay.
    if (state === 'playing') setYtPlaying(true);
    else if (state === 'paused' || state === 'ended' || state === 'unstarted' || state === 'video cued') setYtPlaying(false);
  };

  const ytTogglePlay = () => { setYtPlaying(p => !p); setShowVideoControls(true); };

  const ytSeekTo = async (ms) => {
    const target = Math.max(0, Math.min(ytDur || 0, ms));
    try { await ytRef.current?.seekTo?.(target / 1000, true); } catch (_) {}
    setYtPos(target);
  };

  // Double-tap the video: right half jumps forward, left half back; repeats stack.
  // A lone tap toggles the controls.
  const handleYtVideoTap = (evt) => {
    const width = videoAreaWRef.current;
    if (!width) return;
    const x = evt?.nativeEvent?.locationX ?? 0;
    const side = x < width / 2 ? 'back' : 'forward';
    const now = Date.now();
    const prev = lastTapRef.current;
    lastTapRef.current = { time: now, side };
    const isDoubleTap = now - prev.time < DOUBLE_TAP_MS && prev.side === side;
    const stacking = seekHintRef.current?.side === side;
    if (!isDoubleTap && !stacking) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => setShowVideoControls(v => !v), DOUBLE_TAP_MS);
      return;
    }
    clearTimeout(singleTapTimerRef.current);
    const step = side === 'forward' ? FORWARD_STEP_MS : BACK_STEP_MS;
    const total = (stacking ? seekHintRef.current.total : 0) + step;
    seekHintRef.current = { side, total };
    setSeekHint({ side, total });
    ytSeekTo((ytPos || 0) + (side === 'forward' ? step : -step));
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => { seekHintRef.current = null; setSeekHint(null); }, SEEK_HINT_LINGER_MS);
  };

  // Auto-hide the video controls while playing (like YouTube) — both the inline
  // YouTube video and the expo-av fullscreen path.
  useEffect(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    const playing = isFullScreen ? videoStatus.isPlaying : (isVideoMode && ytPlaying);
    if (showVideoControls && playing) {
      controlsTimerRef.current = setTimeout(() => setShowVideoControls(false), 3500);
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [isFullScreen, isVideoMode, showVideoControls, videoStatus.isPlaying, ytPlaying]);

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

  // Only load the route song if nothing is already playing it. Callers that open
  // the Player (e.g. a Library row) start the load themselves with the real queue,
  // then navigate here; re-loading would restart the stream and replace that queue
  // with a single song. The in-flight guard in loadAndPlay backs this up, but the
  // currentQueue check keeps this screen from ever asking for the redundant load.
  useEffect(() => {
    const routeSong = route?.params?.song;
    if (!routeSong) return;
    const alreadyActive = routeSong.id === currentTrack?.id ||
      currentQueue.some((s) => s.id === routeSong.id);
    if (!alreadyActive) {
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
    // YouTube playback doesn't need a network check (the embed handles buffering).
    if (!isConnected) { Alert.alert('No Internet', 'You need an internet connection!'); return; }
    await playPause();
  };

  const handleNext = async () => {
    if (!isPremium) {
      const canSkip = useSkip();
      if (!canSkip) {
        Alert.alert('Skip Limit Reached', 'Upgrade to Premium for unlimited skips!',
          [{ text: 'Maybe Later' }, { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }]);
        return;
      }
      const n = songsPlayed + 1;
      setSongsPlayed(n);
      if (n % 3 === 0) {
        Alert.alert('📢 Ad', 'Upgrade to Premium — no ads!',
          [{ text: 'Maybe Later' }, { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }]);
        return;
      }
    }
    await playNextInQueue(isShuffle);
  };

  const handlePrevious = async () => {
    if (!isPremium) {
      Alert.alert('Premium Feature', 'Backward is Premium!',
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

  // Keep the lit line roughly centred as the song moves through the lyrics.
  useEffect(() => {
    if (!showLyricsFull || activeLine < 0 || !lyricsScrollRef.current) return;
    lyricsScrollRef.current.scrollTo({
      y: Math.max(0, activeLine * LYRIC_LINE_H - SCREEN_HEIGHT * 0.32),
      animated: true,
    });
  }, [activeLine, showLyricsFull]);

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
      { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') },
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
    Alert.alert('Playlist Created', `"${playlist.name}" is ready and your song was added.`);
  };

  // Matches the Create screen's share: hand off to the OS share sheet rather than
  // deep-linking a fixed set of apps. The user picks the app there, so every app
  // they actually have shows up — no hardcoded list to maintain.
  const shareViaLink = async () => {
    // Present the OS share sheet BEFORE closing the modal. Closing first lets the
    // modal's dismiss animation race the native sheet's presentation, and on iOS
    // the sheet then silently fails to appear (the "nothing happens on Share" bug).
    const message = `🎵 Listen to "${displaySong.title}" by ${displaySong.artist} on Sonara!\n\n👉 Open here: ${shareLink}`;
    try {
      await Share.share({ message, title: displaySong.title });
    } catch (_) {}
    finally {
      setShowShare(false);
    }
  };

  const shareViaQR = () => {
    setShowShare(false);
    setQrLoading(true);
    setShowQRCode(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.bgGlow, { backgroundColor: bgColor }]} />
      <View style={styles.bgDark} />

      {/* ── Video fullscreen (landscape, YouTube, Sonara-only controls) ── */}
      {isVideoMode && ytFull && (
        <View style={styles.ytFsContainer}>
          <StatusBar hidden />
          <View
            style={styles.ytFsVideo}
            onLayout={(e) => { videoAreaWRef.current = e.nativeEvent.layout.width; }}>
            {/* Interactive video (tap to start); Sonara controls at the edges only. */}
            <YoutubePlayer
              ref={ytRef}
              height={FS_H}
              width={FS_W}
              play={ytPlaying}
              videoId={ytId}
              onReady={onYtReady}
              onChangeState={onYtStateChange}
              initialPlayerParams={{ controls: false, modestbranding: true, rel: false, playsinline: 1, iv_load_policy: 3, fs: 0 }}
              webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false, androidLayerType: 'hardware' }}
            />

            {!ytPlaying && (
              <View style={styles.ytTapHint} pointerEvents="none">
                <View style={styles.ytTapCircle}><Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 3 }} /></View>
                <Text style={styles.ytTapText}>Tap to play</Text>
              </View>
            )}

            <View style={styles.ytFsTop} pointerEvents="box-none">
              <TouchableOpacity style={styles.ytIconBtn} onPress={exitYtFull}>
                <Ionicons name="contract" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.ytFsTitle} numberOfLines={1}>{displaySong.title}</Text>
              <TouchableOpacity style={styles.ytIconBtn} onPress={() => setShowVideoOptions(true)}>
                <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.ytFsBottom} pointerEvents="box-none">
              <TouchableOpacity style={styles.ytBarBtn} onPress={ytTogglePlay}>
                <Ionicons name={ytPlaying ? 'pause' : 'play'} size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.inlineTime}>{formatTime(ytPos)}</Text>
              <Slider
                style={styles.inlineSlider}
                minimumValue={0}
                maximumValue={ytDur || 1}
                value={ytPos}
                onSlidingStart={() => setIsSeeking(true)}
                onValueChange={(v) => setYtPos(v)}
                onSlidingComplete={async (v) => { await ytSeekTo(v); setIsSeeking(false); }}
                minimumTrackTintColor="#FF0000"
                maximumTrackTintColor="rgba(255,255,255,0.4)"
                thumbTintColor="#FF0000"
              />
              <Text style={styles.inlineTime}>{formatTime(ytDur)}</Text>
              <TouchableOpacity style={styles.ytExpandBtn} onPress={exitYtFull}>
                <Ionicons name="contract" size={17} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isVideoMode && isFullScreen && (
        <View style={styles.fsContainer}>
          <StatusBar hidden />
          <TouchableWithoutFeedback onPress={handleVideoTap}>
            <View
              style={styles.fsVideoWrap}
              onLayout={(e) => { videoAreaWRef.current = e.nativeEvent.layout.width; }}>
              <Video
                ref={videoRef}
                source={{ uri: videoSource }}
                style={styles.fsVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                onPlaybackStatusUpdate={setVideoStatus}
              />

              {/* Double-tap seek indicator — only on screen while tapping */}
              {seekHint && (
                <View
                  pointerEvents="none"
                  style={[styles.seekHint, seekHint.side === 'back' ? styles.seekHintLeft : styles.seekHintRight]}>
                  <Ionicons
                    name={seekHint.side === 'forward' ? 'play-forward' : 'play-back'}
                    size={30}
                    color={c.icon}
                  />
                  <Text style={styles.seekHintText}>
                    {seekHint.side === 'forward' ? '+' : '−'}{Math.round(seekHint.total / 1000)}s
                  </Text>
                </View>
              )}

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
                      <Ionicons name="chevron-down" size={26} color={c.icon} />
                    </TouchableOpacity>
                    <Text style={styles.fsTitle} numberOfLines={1}>{displaySong.title}</Text>
                    <TouchableOpacity onPress={() => { setFsPanel('main'); setShowFsSettings(true); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <Ionicons name="settings-outline" size={22} color={c.icon} />
                    </TouchableOpacity>
                  </View>

                  {/* Center: play/pause only — seeking is double-tap left/right */}
                  <View style={styles.fsCenter}>
                    <TouchableOpacity style={styles.fsPlayBtn} onPress={toggleVideoPlay}>
                      <Ionicons name={videoStatus.isPlaying ? 'pause' : 'play'} size={40} color={c.icon} />
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
                      <Ionicons name="contract" size={22} color={c.icon} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Fullscreen settings — an in-place overlay, NOT a Modal (a portrait Modal
              opened while locked to landscape crashes the app). Handles Download,
              Sleep Timer, Subtitle and Quality without leaving fullscreen. */}
          {showFsSettings && (
            <View style={styles.fsSettingsOverlay}>
              <TouchableWithoutFeedback onPress={() => setShowFsSettings(false)}>
                <View style={styles.fsSettingsBackdrop} />
              </TouchableWithoutFeedback>

              <View style={styles.fsSettingsPanel}>
                <View style={styles.fsSettingsHeader}>
                  {fsPanel !== 'main' ? (
                    <TouchableOpacity onPress={() => setFsPanel('main')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="chevron-back" size={22} color={c.icon} />
                    </TouchableOpacity>
                  ) : <View style={{ width: 22 }} />}
                  <Text style={styles.fsSettingsTitle}>
                    {fsPanel === 'sleep' ? 'Sleep Timer' : fsPanel === 'quality' ? 'Quality' : 'Settings'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowFsSettings(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={22} color={c.icon} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.fsSettingsScroll}>
                  {fsPanel === 'main' && (
                    <>
                      {/* Download */}
                      <TouchableOpacity style={styles.fsRow} onPress={handleDownloadVideo} activeOpacity={0.75}>
                        <Ionicons name={isDownloaded(displaySong.id) ? 'checkmark-circle' : 'download-outline'} size={20} color={c.icon} />
                        <View style={styles.fsRowInfo}>
                          <Text style={styles.fsRowLabel}>Download</Text>
                          <Text style={styles.fsRowSub}>{isDownloaded(displaySong.id) ? 'Saved to your Downloads' : 'Save this video to watch offline'}</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Sleep Timer */}
                      <TouchableOpacity style={styles.fsRow} onPress={() => setFsPanel('sleep')} activeOpacity={0.75}>
                        <Ionicons name="timer-outline" size={20} color={c.icon} />
                        <View style={styles.fsRowInfo}>
                          <Text style={styles.fsRowLabel}>Sleep Timer</Text>
                          <Text style={styles.fsRowSub}>{sleepTimerLabel ? `On · ${sleepTimerLabel}` : 'Off'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
                      </TouchableOpacity>

                      {/* Subtitles */}
                      <View style={styles.fsRow}>
                        <Ionicons name="chatbox-ellipses-outline" size={20} color={c.icon} />
                        <View style={styles.fsRowInfo}>
                          <Text style={styles.fsRowLabel}>Subtitle</Text>
                          <Text style={styles.fsRowSub}>{subtitlesOn ? 'On' : 'Off'}</Text>
                        </View>
                        <Switch
                          value={subtitlesOn}
                          onValueChange={setSubtitlesOn}
                          trackColor={{ false: '#3A3A3A', true: '#FF0000' }}
                          thumbColor={c.bg}
                        />
                      </View>

                      {/* Quality */}
                      <TouchableOpacity style={styles.fsRow} onPress={() => setFsPanel('quality')} activeOpacity={0.75}>
                        <Ionicons name="options-outline" size={20} color={c.icon} />
                        <View style={styles.fsRowInfo}>
                          <Text style={styles.fsRowLabel}>Quality</Text>
                          <Text style={styles.fsRowSub}>Choose the video resolution</Text>
                        </View>
                        <Text style={styles.fsRowValue}>{videoQuality}</Text>
                        <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
                      </TouchableOpacity>
                    </>
                  )}

                  {fsPanel === 'sleep' && (
                    <>
                      {SLEEP_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.fsOption, sleepTimerLabel === opt.label && styles.fsOptionActive]}
                          onPress={() => { setSleepTimer(opt.value, opt.label); setFsPanel('main'); }}
                          activeOpacity={0.75}>
                          <Text style={[styles.fsOptionText, sleepTimerLabel === opt.label && { color: '#FF4444' }]}>{opt.label}</Text>
                          {sleepTimerLabel === opt.label && <Ionicons name="checkmark-circle" size={18} color="#FF4444" />}
                        </TouchableOpacity>
                      ))}
                      {sleepTimerLabel && (
                        <TouchableOpacity style={styles.fsCancelRow} onPress={() => { cancelSleepTimer(); setFsPanel('main'); }} activeOpacity={0.75}>
                          <Text style={styles.fsCancelText}>Cancel Timer</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {fsPanel === 'quality' && (
                    VIDEO_QUALITIES.map(q => (
                      <TouchableOpacity
                        key={q}
                        style={[styles.fsOption, videoQuality === q && styles.fsOptionActive]}
                        onPress={() => { setVideoQuality(q); setFsPanel('main'); }}
                        activeOpacity={0.75}>
                        <Text style={[styles.fsOptionText, videoQuality === q && { color: '#FF4444' }]}>{q}</Text>
                        {videoQuality === q && <Ionicons name="checkmark-circle" size={18} color="#FF4444" />}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      )}

      {!ytFull && (!isVideoMode || !isFullScreen) && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {isVideoMode ? (
            /* Video mode = the REAL YouTube music video, full-width at the top,
               with Sonara's own controls only (no YouTube UI). */
            <View style={styles.inlineVideoWrap}>
              {ytId ? (
                <View
                  style={styles.ytBox}
                  onLayout={(e) => { videoAreaWRef.current = e.nativeEvent.layout.width; }}>
                  {/* The video is INTERACTIVE: a tap on it starts playback (YouTube
                      embeds require one real tap; after that our controls drive it).
                      Sonara's own controls sit at the top/bottom edges only, so the
                      centre of the video stays tappable. No YouTube UI (controls:0). */}
                  <YoutubePlayer
                    ref={ytRef}
                    height={INLINE_VIDEO_H}
                    width={SCREEN_WIDTH}
                    play={ytPlaying}
                    videoId={ytId}
                    onReady={onYtReady}
                    onChangeState={onYtStateChange}
                    initialPlayerParams={{ controls: false, modestbranding: true, rel: false, playsinline: 1, iv_load_policy: 3, fs: 0 }}
                    webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false, androidLayerType: 'hardware' }}
                  />

                  {/* Tap-to-play hint (non-blocking, so the tap reaches the video) */}
                  {!ytPlaying && (
                    <View style={styles.ytTapHint} pointerEvents="none">
                      <View style={styles.ytTapCircle}><Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 3 }} /></View>
                      <Text style={styles.ytTapText}>Tap to play</Text>
                    </View>
                  )}

                  {/* Top: back to audio · one "⋯" options menu (Queue / Download / Timer) */}
                  <View style={styles.ytTopBar} pointerEvents="box-none">
                    <TouchableOpacity style={styles.ytIconBtn} onPress={() => setIsVideoMode(false)}>
                      <Ionicons name="chevron-down" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ytIconBtn} onPress={() => setShowVideoOptions(true)}>
                      <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Bottom: play/pause · scrubber · fullscreen */}
                  <View style={styles.ytBottomBar} pointerEvents="box-none">
                    <TouchableOpacity style={styles.ytBarBtn} onPress={ytTogglePlay}>
                      <Ionicons name={ytPlaying ? 'pause' : 'play'} size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.inlineTime}>{formatTime(ytPos)}</Text>
                    <Slider
                      style={styles.inlineSlider}
                      minimumValue={0}
                      maximumValue={ytDur || 1}
                      value={ytPos}
                      onSlidingStart={() => setIsSeeking(true)}
                      onValueChange={(v) => setYtPos(v)}
                      onSlidingComplete={async (v) => { await ytSeekTo(v); setIsSeeking(false); }}
                      minimumTrackTintColor="#FF0000"
                      maximumTrackTintColor="rgba(255,255,255,0.4)"
                      thumbTintColor="#FF0000"
                    />
                    <Text style={styles.inlineTime}>{formatTime(ytDur)}</Text>
                    <TouchableOpacity style={styles.ytExpandBtn} onPress={enterYtFull}>
                      <Ionicons name="expand" size={17} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Resolving the video / no match found */
                <View style={styles.ytLoading}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.ytLoadingText}>{ytResolving ? 'Loading video…' : 'No video found for this song.'}</Text>
                  <TouchableOpacity style={styles.ytBackAudio} onPress={() => setIsVideoMode(false)}>
                    <Ionicons name="musical-notes" size={15} color="#fff" />
                    <Text style={styles.ytBackAudioText}>Back to audio</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* HEADER */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-down" size={28} color={c.icon} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerLabel}>NOW PLAYING</Text>
                  <View style={[styles.genreBadge, { backgroundColor: bgColor + '50', borderColor: bgColor }]}>
                    <Text style={styles.genreBadgeText}>{displaySong.genre || 'Music'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={() => setShowQueue(true)}>
                  <Ionicons name="list" size={24} color={c.icon} />
                </TouchableOpacity>
              </View>

              {/* ALBUM ART */}
              <View style={[styles.albumArtWrapper, { shadowColor: bgColor }]}>
                <View style={[styles.albumArt, { backgroundColor: bgColor + '40' }]}>
                  {displayArt
                    ? <Image source={{ uri: displayArt }} style={styles.albumArtImg} />
                    : <Text style={styles.albumEmoji}>{displaySong.emoji || '🎵'}</Text>}
                </View>
              </View>
            </>
          )}

          {/* Audio-mode UI only — in Video mode the screen shows just the video. */}
          {!isVideoMode && (
          <>
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

          {/* PROGRESS BAR — audio only. In video mode the on-video scrubber is the
              single progress bar, so this one is hidden. */}
          {!isVideoMode && (
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: '#fff' }]} />
                <View style={[styles.progressThumb, { left: `${Math.min(progressPercent, 97)}%`, backgroundColor: '#fff', shadowColor: '#fff' }]} />
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
          )}

          {/* CONTROLS */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlSideBtn} onPress={() => setIsShuffle(!isShuffle)}>
              <Ionicons name="shuffle" size={24} color={isShuffle ? bgColor : 'rgba(255,255,255,0.5)'} />
              {isShuffle && <View style={[styles.activeDot, { backgroundColor: bgColor }]} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handlePrevious}>
              <Ionicons name="play-skip-back" size={34} color={isPremium ? c.icon : c.textFaint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: '#fff', shadowColor: '#fff' }]}
              onPress={handlePlayPause}>
              <Ionicons name={isPlayingGlobal ? 'pause' : 'play'} size={36} color={c.accentText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handleNext}>
              <Ionicons name="play-skip-forward" size={34} color={c.icon} />
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
                  <Ionicons name="chevron-up" size={22} color={c.textFaint} />
                </TouchableOpacity>
              </View>
              {/* Tapping the sheet opens the lyrics full-screen, following the song. */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => lyricLines.length > 0 && setShowLyricsFull(true)}>
                <Text style={styles.lyricsText}>
                  {plainLyrics || (lyricsStatus === 'loading' ? 'Loading lyrics…' : 'No lyrics available for this song.')}
                </Text>
                {lyricLines.length > 0 && (
                  <View style={styles.lyricsExpandHint}>
                    <Ionicons name="expand" size={13} color={bgColor} />
                    <Text style={[styles.lyricsExpandHintText, { color: bgColor }]}>Tap for full screen</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 60 }} />
          </>
          )}
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
                <Ionicons name="arrow-forward" size={18} color={c.icon} />
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowAboutArtist(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share */}
      {/* Share — one step: Link (OS share sheet) or QR, same as the Create screen */}
      <Modal visible={showShare} transparent animationType="slide" onRequestClose={() => setShowShare(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Song</Text>

            <View style={styles.shareCard}>
              <View style={styles.shareCardArt}>
                {displaySong.imageUrl
                  ? <Image source={{ uri: displaySong.imageUrl }} style={styles.shareCardArtImg} />
                  : <Text style={{ fontSize: 28 }}>{displaySong.emoji || '🎵'}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareCardTitle} numberOfLines={1}>{displaySong.title}</Text>
                <Text style={styles.shareCardArtist} numberOfLines={1}>{displaySong.artist}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.shareOptionBtn} onPress={shareViaLink} activeOpacity={0.85}>
              <View style={styles.shareOptionLeft}>
                <Ionicons name="link" size={22} color={c.accentText} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareOptionTitle}>Share as Link</Text>
                  <Text style={styles.shareOptionSub}>Send it through any app on your phone</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.45)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOptionBtnOutline} onPress={shareViaQR} activeOpacity={0.85}>
              <View style={styles.shareOptionLeft}>
                <Ionicons name="qr-code" size={22} color={c.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareOptionTitleOutline}>Share as QR Code</Text>
                  <Text style={styles.shareOptionSubOutline}>They scan it to open the song</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowShare(false)}>
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
            <Text style={styles.modalTitle}>QR Code</Text>
            <Text style={styles.modalSub}>
              Screenshot it and send it to anyone.{'\n'}They scan it to open the song.
            </Text>
            <View style={styles.qrBox}>
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
              <Ionicons name="heart" size={20} color={c.icon} />
              <Text style={styles.likeOptionBtnText}>Add to Liked Songs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.likeOptionOutline}
              onPress={() => {
                toggleLikeSong(displaySong);
                setShowLikeOptions(false);
                handleAddToPlaylist(displaySong);
              }}>
              <Ionicons name="musical-notes-outline" size={20} color={c.icon} />
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
                <Ionicons name="close" size={24} color={c.textFaint} />
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
                <Ionicons name="add" size={22} color={c.icon} />
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
                  <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
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

      {/* Full-screen lyrics — follows the song. Only ever opened from the audio
          player (portrait), so a Modal is safe here; the video fullscreen is the
          one place a Modal must not be used. */}
      <Modal visible={showLyricsFull} animationType="slide" onRequestClose={() => setShowLyricsFull(false)}>
        <View style={[styles.lyricsFullContainer, { backgroundColor: bgColor + '14' }]}>
          <View style={styles.lyricsFullHeader}>
            <TouchableOpacity
              style={styles.lyricsFullClose}
              onPress={() => setShowLyricsFull(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-down" size={26} color={c.icon} />
            </TouchableOpacity>
            <View style={styles.lyricsFullTitleWrap}>
              <Text style={styles.lyricsFullTitle} numberOfLines={1}>{displaySong.title}</Text>
              <Text style={styles.lyricsFullArtist} numberOfLines={1}>{displaySong.artist}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            ref={lyricsScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lyricsFullScroll}>
            {lyricLines.map((line, i) => (
              line.isSection ? (
                <Text key={i} style={[styles.lyricsFullSection, { color: bgColor }]}>{line.text}</Text>
              ) : (
                <Text
                  key={i}
                  style={[
                    styles.lyricsFullLine,
                    i === activeLine && [styles.lyricsFullLineActive, { color: '#fff' }],
                    i < activeLine && styles.lyricsFullLinePast,
                  ]}>
                  {line.text}
                </Text>
              )
            ))}
          </ScrollView>

          {/* Transport so the song stays controllable without leaving the lyrics */}
          <View style={styles.lyricsFullBar}>
            <Text style={styles.lyricsFullTime}>{formatTime(displayPosition)}</Text>
            <View style={styles.lyricsFullTrack}>
              <View style={[styles.lyricsFullFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.lyricsFullTime}>{formatTime(duration)}</Text>
            <TouchableOpacity style={styles.lyricsFullPlay} onPress={handlePlayPause}>
              <Ionicons name={isPlayingGlobal ? 'pause' : 'play'} size={20} color={c.accentText} />
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
                <Ionicons name={isDownloaded(displaySong.id) ? 'checkmark-circle' : 'download-outline'} size={20} color={c.icon} />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Download</Text>
                <Text style={styles.vsSub}>{isDownloaded(displaySong.id) ? 'Saved to your Downloads' : 'Save this video to watch offline'}</Text>
              </View>
              {!isDownloaded(displaySong.id) && <Ionicons name="chevron-forward" size={16} color={c.textFaint} />}
            </TouchableOpacity>

            {/* Sleep Timer */}
            <TouchableOpacity style={styles.vsRow} onPress={() => { setShowVideoSettings(false); setShowSleepTimer(true); }} activeOpacity={0.75}>
              <View style={styles.vsIcon}>
                <Ionicons name="timer-outline" size={20} color={c.icon} />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Sleep Timer</Text>
                <Text style={styles.vsSub}>{sleepTimerLabel ? `On · ${sleepTimerLabel}` : 'Off'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
            </TouchableOpacity>

            {/* Subtitles */}
            <View style={styles.vsRow}>
              <View style={styles.vsIcon}>
                <Ionicons name="chatbox-ellipses-outline" size={20} color={c.icon} />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Subtitles</Text>
                <Text style={styles.vsSub}>{subtitlesOn ? 'On' : 'Off'}</Text>
              </View>
              <Switch
                value={subtitlesOn}
                onValueChange={setSubtitlesOn}
                trackColor={{ false: '#2A2A2A', true: bgColor }}
                thumbColor={c.bg}
              />
            </View>

            {/* Quality */}
            <TouchableOpacity style={styles.vsRow} onPress={() => { setShowVideoSettings(false); setShowQualityOptions(true); }} activeOpacity={0.75}>
              <View style={styles.vsIcon}>
                <Ionicons name="options-outline" size={20} color={c.icon} />
              </View>
              <View style={styles.vsInfo}>
                <Text style={styles.vsLabel}>Quality</Text>
                <Text style={styles.vsSub}>Choose the video resolution</Text>
              </View>
              <Text style={styles.vsValue}>{videoQuality}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
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
      {/* Video options — ONE "⋯" menu holding independent Queue · Download · Timer */}
      <Modal visible={showVideoOptions} transparent animationType="slide" onRequestClose={() => setShowVideoOptions(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Options</Text>

            <TouchableOpacity style={styles.voRow} onPress={() => { setShowVideoOptions(false); setTimeout(() => setShowQueue(true), 260); }} activeOpacity={0.8}>
              <View style={styles.voIcon}><Ionicons name="list" size={20} color={c.icon} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voTitle}>Queue</Text>
                <Text style={styles.voSub}>See what's playing next</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.voRow} onPress={() => { setShowVideoOptions(false); setTimeout(handleDownloadVideo, 260); }} activeOpacity={0.8}>
              <View style={styles.voIcon}><Ionicons name={isDownloaded(displaySong.id) ? 'checkmark-circle' : 'download-outline'} size={20} color={c.icon} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voTitle}>{isDownloaded(displaySong.id) ? 'Downloaded' : 'Download'}</Text>
                <Text style={styles.voSub}>{isDownloaded(displaySong.id) ? 'Saved to Library › Downloads' : 'Save this song — Wi-Fi or mobile data'}</Text>
              </View>
              {!isDownloaded(displaySong.id) && <Ionicons name="chevron-forward" size={16} color={c.textFaint} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.voRow} onPress={() => { setShowVideoOptions(false); setTimeout(() => setShowSleepTimer(true), 260); }} activeOpacity={0.8}>
              <View style={styles.voIcon}><Ionicons name="timer-outline" size={20} color={sleepTimerLabel ? bgColor : c.icon} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voTitle}>Sleep Timer</Text>
                <Text style={styles.voSub}>{sleepTimerLabel ? `On · ${sleepTimerLabel}` : 'Off'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowVideoOptions(false)}>
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showQueue} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: SCREEN_HEIGHT * 0.75 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Queue</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <Ionicons name="close" size={24} color={c.textFaint} />
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
          <Ionicons name="wifi-outline" size={16} color={c.icon} />
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  bgGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 260, opacity: 0.2 },
  bgDark: { position: 'absolute', top: 160, left: 0, right: 0, bottom: 0, backgroundColor: c.bg },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, marginBottom: 20 },
  headerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', gap: 6 },
  headerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  genreBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  genreBadgeText: { fontSize: 11, fontWeight: '700', color: c.text },
  albumArtWrapper: { alignSelf: 'center', marginBottom: 28, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15 },
  albumArt: { width: SCREEN_WIDTH - 80, height: SCREEN_WIDTH - 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  albumArtImg: { width: '100%', height: '100%' },
  albumEmoji: { fontSize: 100 },
  videoContainer: { marginHorizontal: 20, height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoEmoji: { fontSize: 70 },
  videoActions: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 8 },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  videoBtnText: { color: c.text, fontSize: 11, fontWeight: '600' },
  videoPosterPlay: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  videoPosterHint: { position: 'absolute', bottom: 44, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  // Inline (half-screen) YouTube-style video at the top
  inlineVideoWrap: { width: SCREEN_WIDTH, backgroundColor: c.bg, paddingTop: 44, marginBottom: 22, position: 'relative' },
  inlineVideo: { width: SCREEN_WIDTH, height: INLINE_VIDEO_H, backgroundColor: c.bg },

  inlineBack: { position: 'absolute', top: 52, left: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  inlineTopRight: { position: 'absolute', top: 54, right: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  inlineIconBtnPlain: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  inlineExpand: { position: 'absolute', bottom: 10, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  inlineSlider: { flex: 1, height: 30, marginHorizontal: 4 },
  inlineTime: { color: '#fff', fontSize: 10, fontWeight: '700', width: 32, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3 },

  // ── Video mode (YouTube) ──
  ytBox: { width: SCREEN_WIDTH, height: INLINE_VIDEO_H, backgroundColor: '#000', position: 'relative' },
  ytScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  ytTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 6, paddingBottom: 20, backgroundColor: 'rgba(0,0,0,0.35)' },
  ytTopRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ytIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  ytCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ytPlayBtn: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  ytBarBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  // Tap-to-play hint over a paused video
  ytTapHint: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ytTapCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  ytTapText: { color: '#fff', fontSize: 12, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  ytBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.35)' },
  ytLoading: { width: SCREEN_WIDTH, height: INLINE_VIDEO_H, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 },
  ytLoadingText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  ytBackAudio: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  ytBackAudioText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  ytExpandBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },

  // Video fullscreen (landscape)
  ytFsContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  ytFsVideo: { width: FS_W, height: FS_H, backgroundColor: '#000', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ytFsTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 22, backgroundColor: 'rgba(0,0,0,0.35)' },
  ytFsTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700', marginHorizontal: 10 },
  ytFsBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 22, backgroundColor: 'rgba(0,0,0,0.35)' },

  // Inline video transport (back 5s · play/pause · forward 10s)
  inlineTransport: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  inlinePlayBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  videoCaption: { position: 'absolute', bottom: 12, left: 16, right: 60, alignItems: 'center' },
  fsCaption: { position: 'absolute', bottom: 70, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 30 },
  videoCaptionText: { color: c.text, fontSize: 14, fontWeight: '700', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },

  // ── YouTube-style fullscreen ──
  fsContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg, zIndex: 1000 },
  fsVideoWrap: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
  fsVideo: { width: '100%', height: '100%' },
  fsControls: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'space-between' },
  fsTopBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 22, paddingTop: 22 },
  fsTitle: { flex: 1, color: c.text, fontSize: 16, fontWeight: '700' },
  fsCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fsPlayBtn: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  // Double-tap seek indicator — appears only while tapping, then fades out
  seekHint: {
    position: 'absolute', top: 0, bottom: 0, width: '38%',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  seekHintLeft: { left: 0, borderTopRightRadius: 160, borderBottomRightRadius: 160 },
  seekHintRight: { right: 0, borderTopLeftRadius: 160, borderBottomLeftRadius: 160 },
  seekHintText: { color: c.text, fontSize: 14, fontWeight: '900' },
  fsBottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 20, gap: 8 },
  fsTime: { color: c.text, fontSize: 12, fontWeight: '600', width: 46, textAlign: 'center' },
  fsSlider: { flex: 1, height: 40 },

  // Fullscreen settings overlay (landscape-safe, no Modal)
  fsSettingsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'flex-end', zIndex: 1200,
  },
  fsSettingsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  fsSettingsPanel: {
    width: 360, maxWidth: '55%', height: '100%',
    backgroundColor: 'rgba(18,18,18,0.98)', paddingTop: 16, paddingHorizontal: 18,
    borderLeftWidth: 1, borderLeftColor: c.borderStrong,
  },
  fsSettingsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  fsSettingsTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
  fsSettingsScroll: { paddingTop: 6 },
  fsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  fsRowInfo: { flex: 1 },
  fsRowLabel: { color: c.text, fontSize: 15, fontWeight: '700' },
  fsRowSub: { color: c.textDim, fontSize: 12, marginTop: 2 },
  fsRowValue: { color: c.textDim, fontSize: 13, fontWeight: '700', marginRight: 4 },
  fsOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10,
    marginBottom: 8, backgroundColor: c.elevated,
  },
  fsOptionActive: { backgroundColor: 'rgba(255,68,68,0.12)', borderWidth: 1, borderColor: '#FF4444' },
  fsOptionText: { color: c.text, fontSize: 15, fontWeight: '600' },
  fsCancelRow: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  fsCancelText: { color: '#FF5555', fontSize: 14, fontWeight: '700' },
  songInfoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  songInfoLeft: { flex: 1, marginRight: 16 },
  songTitle: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.3, marginBottom: 6 },
  songArtist: { fontSize: 15, fontWeight: '600' },
  songAlbum: { fontSize: 12, color: c.textFaint, marginTop: 3 },
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
  repeatBadgeText: { color: c.text, fontSize: 8, fontWeight: '800' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  actionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  premiumDot: { position: 'absolute', top: -3, right: -3 },
  lyricsPanel: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1 },
  lyricsExpandHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  lyricsExpandHintText: { fontSize: 12, fontWeight: '800' },

  // Full-screen lyrics
  lyricsFullContainer: { flex: 1, backgroundColor: c.bg },
  lyricsFullHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
  },
  lyricsFullClose: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  lyricsFullTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  lyricsFullTitle: { color: c.text, fontSize: 15, fontWeight: '800' },
  lyricsFullArtist: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  lyricsFullScroll: { paddingHorizontal: 26, paddingTop: 20, paddingBottom: 220 },
  lyricsFullSection: {
    fontSize: 12, fontWeight: '900', letterSpacing: 1.4,
    textTransform: 'uppercase', marginTop: 26, marginBottom: 10,
  },
  lyricsFullLine: {
    fontSize: 21, lineHeight: 30, fontWeight: '800',
    color: 'rgba(255,255,255,0.35)', marginBottom: 16, letterSpacing: -0.3,
  },
  lyricsFullLineActive: { fontSize: 24, lineHeight: 32 },
  lyricsFullLinePast: { color: 'rgba(255,255,255,0.2)' },
  lyricsFullBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 38,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  lyricsFullTime: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', width: 38, textAlign: 'center' },
  lyricsFullTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  lyricsFullFill: { height: '100%', backgroundColor: c.accent, borderRadius: 2 },
  lyricsFullPlay: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  lyricsPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  lyricsPanelTitle: { fontSize: 16, fontWeight: '800' },
  lyricsText: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 30, textAlign: 'center' },
  offlineBanner: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#ff4444', padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offlineText: { color: c.text, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: SCREEN_HEIGHT * 0.9 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 4, textAlign: 'center' },
  modalSub: { color: c.textFaint, fontSize: 13, marginBottom: 16, textAlign: 'center', lineHeight: 20 },
  shareCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: c.elevated, borderRadius: 12, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: c.border,
  },
  shareCardArt: {
    width: 52, height: 52, borderRadius: 10, backgroundColor: c.surface,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  shareCardArtImg: { width: '100%', height: '100%' },
  shareCardTitle: { color: c.text, fontSize: 15, fontWeight: '800' },
  shareCardArtist: { color: c.textDim, fontSize: 13, fontWeight: '600', marginTop: 3 },
  shareOptionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, marginBottom: 10, backgroundColor: c.accent,
  },
  shareOptionBtnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, marginBottom: 10,
    backgroundColor: c.elevated, borderWidth: 1, borderColor: c.borderStrong,
  },
  shareOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  shareOptionTitle: { color: c.accentText, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  shareOptionSub: { color: 'rgba(0,0,0,0.55)', fontSize: 12, fontWeight: '600' },
  shareOptionTitleOutline: { color: c.text, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  shareOptionSubOutline: { color: c.textDim, fontSize: 12, fontWeight: '600' },
  qrBox: { width: 250, height: 250, borderRadius: 16, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: c.accent, overflow: 'hidden' },
  qrImage: { width: 250, height: 250 },
  qrLoadingOverlay: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', zIndex: 1 },
  qrLoadingText: { color: c.textFaint, fontSize: 14, fontWeight: '600' },
  likeHeader: { alignItems: 'center', marginBottom: 20 },
  likeEmoji: { fontSize: 40, marginBottom: 8 },
  likeOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 10 },
  likeOptionBtnText: { color: c.text, fontSize: 16, fontWeight: '700' },
  likeOptionOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: c.borderStrong },
  likeOptionOutlineText: { color: c.text, fontSize: 16, fontWeight: '600' },
  createPlaylistBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  createPlaylistIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  createPlaylistText: { fontSize: 15, fontWeight: '700' },
  playlistOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playlistOptionEmoji: { fontSize: 24 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: c.elevated },
  sheetOptionText: { color: c.text, fontSize: 15, fontWeight: '600' },
  sheetOptionSub: { color: c.textFaint, fontSize: 12, marginTop: 2 },

  // Video settings rows
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  vsIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center' },
  vsInfo: { flex: 1 },
  vsLabel: { color: c.text, fontSize: 15, fontWeight: '700' },
  vsSub: { color: c.textFaint, fontSize: 12, marginTop: 3 },
  vsValue: { color: c.textDim, fontSize: 14, fontWeight: '700', marginRight: 4 },

  sheetCloseBtn: { backgroundColor: c.elevated, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  sheetCloseBtnText: { color: c.text, fontSize: 15, fontWeight: '700' },
  input: { backgroundColor: c.elevated, color: c.text, padding: 15, borderRadius: 14, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: c.borderStrong },
  emojiLabel: { color: c.textFaint, fontSize: 13, marginBottom: 10 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emojiOption: { width: 44, height: 44, backgroundColor: c.elevated, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  emojiText: { fontSize: 22 },
  saveBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: c.text, fontSize: 15, fontWeight: '800' },
  dangerBtn: { padding: 14, alignItems: 'center' },
  dangerBtnText: { color: '#ff4444', fontSize: 15, fontWeight: '700' },
  countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, justifyContent: 'center' },
  countBtn: { width: 68, height: 68, backgroundColor: c.elevated, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  countBtnText: { color: c.text, fontSize: 20, fontWeight: '800' },
  voRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  voIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center' },
  voTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
  voSub: { color: c.textDim, fontSize: 12, marginTop: 2 },
  queueItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, backgroundColor: c.elevated, gap: 12 },
  queueArt: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  queueEmoji: { fontSize: 22 },
  queueInfo: { flex: 1 },
  queueTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  queueArtist: { color: c.textFaint, fontSize: 12, marginTop: 2 },
  artistHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  artistAvatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  artistAvatarEmoji: { fontSize: 44 },
  artistHeroName: { color: c.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  artistGenreBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  artistGenreBadgeText: { fontSize: 12, fontWeight: '700' },
  artistBio: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  topSongsHeading: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  topSongRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: c.elevated, borderRadius: 14, marginBottom: 8, gap: 10 },
  topSongNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  topSongNumText: { fontSize: 13, fontWeight: '800' },
  topSongName: { color: c.text, fontSize: 14, fontWeight: '600', flex: 1 },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, marginTop: 12, marginBottom: 8 },
  viewProfileBtnText: { color: c.text, fontSize: 15, fontWeight: '800' },
});