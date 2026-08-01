import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import api from '../services/api';
import { resolvePlayableUrl } from '../services/audius';
import { themeFor } from '../services/theme';

// The default playlist set for a signed-out / brand-new user.
const EMPTY_PLAYLISTS = [
  { id: 'liked_songs', name: 'Liked Songs', emoji: '❤️', songs: [], isLikedSongs: true },
];

// Firestore rejects `undefined`; normalized songs carry undefined imageUrl/videoUrl/
// lyrics. JSON round-trip drops those keys and leaves a plain, storable object.
const forFirestore = (obj) => JSON.parse(JSON.stringify(obj));

const UserContext = createContext();

export function UserProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [skipsResetTime, setSkipsResetTime] = useState(Date.now());
  const [favouriteArtists, setFavouriteArtists] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [createdSongs, setCreatedSongs] = useState([]); // AI-generated / uploaded songs → "Upload Music"
  const [downloadedSongs, setDownloadedSongs] = useState([]); // downloaded audio/video → Library "Downloads"
  const [likedSongs, setLikedSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState(EMPTY_PLAYLISTS);

  // ── Account persistence (Firestore) ──
  // The signed-in user's library (playlists, likes, follows, AI songs, downloads)
  // is mirrored to users/{uid} so it survives logout and app updates. currentUid
  // gates saving; hydratedRef ensures we never overwrite stored data with the empty
  // defaults before the load has finished.
  const [currentUid, setCurrentUid] = useState(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef(null);

  // ── Global player state ──
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlayingGlobal, setIsPlayingGlobal] = useState(false);
  const [miniPlayerPosition, setMiniPlayerPosition] = useState(0);
  const [miniPlayerDuration, setMiniPlayerDuration] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentQueue, setCurrentQueue] = useState([]);

  // ── Sleep timer (lives in context so it survives screen navigation) ──
  const [sleepTimerLabel, setSleepTimerLabel] = useState(null);
  const sleepTimerTimeoutRef = useRef(null);

  const soundRef = useRef(null);
  // Which song soundRef currently holds, so re-tapping it can restart in place
  // instead of paying for a fresh stream.
  const loadedSongIdRef = useRef(null);
  // Which song a load is CURRENTLY streaming in. Tapping a row and then landing on
  // PlayerScreen fires loadAndPlay twice for the same song (the screen's mount
  // effect can't yet see the currentTrack the row just set). Without this guard the
  // second call tears down the stream the first one started and re-streams from
  // scratch — doubling startup — and clobbers the real queue with a one-song queue.
  const loadingSongIdRef = useRef(null);
  // The upcoming track, downloaded in the background while the current one plays,
  // so auto-advance (and the next button) start with no wait.
  const nextSoundRef = useRef(null); // { sound, songId }
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  // Every loadAndPlay claims a token. If a newer load starts, older ones abandon
  // themselves — this is what stops two songs ever playing at once.
  const loadTokenRef = useRef(0);
  // Mirrors isPlayingGlobal so play/pause can flip instantly without awaiting status.
  const isPlayingRef = useRef(false);
  // When the user just tapped play/pause, briefly ignore in-flight status updates
  // so a stale callback can't flicker the icon back.
  const lastToggleAtRef = useRef(0);

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Welcome to Sonara! 🎵', message: 'Start listening to your favourite music!', time: 'Just now', read: false },
    { id: '2', title: 'New Release!', message: 'Burna Boy just dropped a new song!', time: '2 hours ago', read: false },
    { id: '3', title: 'Upgrade to Premium', message: 'Get unlimited skips and more for just $1/month!', time: '1 day ago', read: true },
  ]);
  const [listeningHabits, setListeningHabits] = useState({ genres: {}, artists: {}, songs: {} });

  // Privacy: when on, played songs are NOT recorded to history or habits.
  const [privateSession, setPrivateSession] = useState(false);

  // ── Appearance ──
  // 'dark' | 'light'. Saved with the rest of the account data so the choice
  // survives logout and reinstall, same as the library.
  const [themeKey, setThemeKey] = useState('dark');
  const colors = themeFor(themeKey);
  const isDark = themeKey === 'dark';
  const toggleTheme = () => setThemeKey(k => (k === 'dark' ? 'light' : 'dark'));

  // Audio mode — set once for the whole app
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
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      if (nextSoundRef.current?.sound) nextSoundRef.current.sound.unloadAsync().catch(() => {});
      if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    };
  }, []);

  // ── Load the user's library on sign-in; clear it on sign-out ──────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Signed out: stop saving first, then wipe this user's data from memory so
        // the next account can't see it. hydratedRef=false blocks the save effect.
        hydratedRef.current = false;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setCurrentUid(null);
        setUserPlaylists(EMPTY_PLAYLISTS);
        setLikedSongs([]);
        setFollowedArtists([]);
        setCreatedSongs([]);
        setDownloadedSongs([]);
        setFavouriteArtists([]);
        setProfileImage(null);
        setThemeKey('dark');
        return;
      }
      // Signed in: pull the stored library before allowing any save.
      hydratedRef.current = false;
      setCurrentUid(user.uid);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.favouriteArtists) setFavouriteArtists(d.favouriteArtists);
          if (d.profileImage) setProfileImage(d.profileImage);
          if (Array.isArray(d.userPlaylists) && d.userPlaylists.length) setUserPlaylists(d.userPlaylists);
          if (Array.isArray(d.likedSongs)) setLikedSongs(d.likedSongs);
          if (Array.isArray(d.followedArtists)) setFollowedArtists(d.followedArtists);
          if (Array.isArray(d.createdSongs)) setCreatedSongs(d.createdSongs);
          if (Array.isArray(d.downloadedSongs)) setDownloadedSongs(d.downloadedSongs);
          if (d.themeKey === 'light' || d.themeKey === 'dark') setThemeKey(d.themeKey);
        }
        // Only enable saving once we've actually read the stored copy. If the read
        // failed (offline), we deliberately leave saving OFF for this session rather
        // than risk overwriting the user's real data with empty startup defaults.
        hydratedRef.current = true;
      } catch (_) {
        hydratedRef.current = false;
      }
    });
    return unsub;
  }, []);

  // ── Auto-save the library to the account whenever it changes (debounced) ──
  // Skips until a user is present AND their data has been hydrated, so the empty
  // startup defaults can never overwrite what's stored.
  useEffect(() => {
    if (!currentUid || !hydratedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setDoc(
        doc(db, 'users', currentUid),
        forFirestore({ userPlaylists, likedSongs, followedArtists, createdSongs, downloadedSongs, themeKey }),
        { merge: true },
      ).catch(() => {});
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [currentUid, userPlaylists, likedSongs, followedArtists, createdSongs, downloadedSongs, themeKey]);

  // ── GLOBAL AUDIO CONTROLS ──────────────────────────────────

  // Throw away whatever is currently preloaded.
  const disposePreload = () => {
    const pre = nextSoundRef.current;
    nextSoundRef.current = null;
    if (pre?.sound) {
      try { pre.sound.setOnPlaybackStatusUpdate(null); } catch (_) {}
      pre.sound.unloadAsync().catch(() => {});
    }
  };

  // Download the upcoming track in the background while the current one plays.
  // downloadFirst:true is deliberate here — we have a whole song's worth of time,
  // and a fully-downloaded track starts instantly when we advance to it.
  const preloadNext = async (currentToken) => {
    const q = queueRef.current;
    if (q.length < 2) return;
    const nextSong = q[(queueIndexRef.current + 1) % q.length];
    if (!nextSong?.audioUrl) return;
    if (nextSoundRef.current?.songId === nextSong.id) return; // already warm
    disposePreload();
    try {
      const uri = await resolvePlayableUrl(nextSong);
      if (currentToken !== loadTokenRef.current) return; // superseded while resolving
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: 1.0 },
        null,
        true,
      );
      // The track changed while we were preloading — this is no longer useful.
      if (currentToken !== loadTokenRef.current) {
        sound.unloadAsync().catch(() => {});
        return;
      }
      nextSoundRef.current = { sound, songId: nextSong.id };
    } catch (_) {}
  };

  const loadAndPlay = async (song, queue = null, queueIndex = 0) => {
    // Re-tapping the track that is already loaded (a Library row, the queue sheet,
    // the same song twice) restarts it in place. Tearing the sound down and
    // re-streaming would spend a network round trip to play audio we already hold.
    if (soundRef.current && loadedSongIdRef.current === song.id) {
      if (queue && queue.length > 0) {
        queueRef.current = queue;
        queueIndexRef.current = queueIndex;
        setCurrentQueue(queue);
      }
      setIsPlayingGlobal(true);
      isPlayingRef.current = true;
      lastToggleAtRef.current = Date.now();
      try {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
        setMiniPlayerPosition(0);
        trackSongPlay(song);
        return;
      } catch (_) {
        // The sound is unusable — fall through and load it properly.
      }
    }

    // A load for this exact song is already streaming in. This is the duplicate
    // trigger from the Library-row → PlayerScreen hand-off; ignore it rather than
    // restart the stream and lose the queue. A new queue still updates the UI.
    if (loadingSongIdRef.current === song.id) {
      if (queue && queue.length > 1) {
        queueRef.current = queue;
        queueIndexRef.current = queueIndex;
        setCurrentQueue(queue);
      }
      return;
    }

    // Claim this load. Any load already in flight is now stale and will bail out.
    const token = ++loadTokenRef.current;
    loadingSongIdRef.current = song.id;

    // Detach the old sound's listener FIRST and drop the ref, so it can no longer
    // push positions into the UI (this is what caused the progress bar to jump).
    // Tear it down fire-and-forget so the new song never waits on the old one.
    const prev = soundRef.current;
    soundRef.current = null;
    loadedSongIdRef.current = null;
    if (prev) {
      try { prev.setOnPlaybackStatusUpdate(null); } catch (_) {}
      prev.stopAsync().catch(() => {}).then(() => prev.unloadAsync().catch(() => {}));
    }

    // Update the UI immediately so tapping a song feels instant.
    if (queue && queue.length > 0) {
      queueRef.current = queue;
      queueIndexRef.current = queueIndex;
      setCurrentQueue(queue);
    }
    setCurrentTrack(song);
    setMiniPlayerPosition(0);
    setMiniPlayerDuration(0);
    setIsPlayingGlobal(true);
    isPlayingRef.current = true;
    lastToggleAtRef.current = 0; // new track — let its status updates through

    try {
      let sound;
      let needsPlay = false;

      // If we already preloaded this exact track, use it — it's downloaded and
      // starts with no wait. This is what makes auto-advance instant.
      const pre = nextSoundRef.current;
      if (pre && pre.songId === song.id) {
        nextSoundRef.current = null; // claim it
        sound = pre.sound;
        needsPlay = true;           // it was preloaded paused
      } else {
        disposePreload();           // preloaded a different track — drop it
        // Resolve a real, directly-playable URL for ANY song: the placeholder
        // (soundhelix) catalog is matched to a real Audius track, Audius endpoints
        // resolve to their direct mp3, and real urls pass through. This is what
        // makes tapping a local song play real audio instead of the sample.
        const uri = await resolvePlayableUrl(song);
        if (token !== loadTokenRef.current) return; // superseded while resolving
        const created = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 500 },
          null,   // status listener attached below, once we know this load is current
          false,  // downloadFirst: stream it — don't wait for the whole file to download
        );
        sound = created.sound;
      }

      // Superseded while loading — kill it so two songs can never overlap.
      if (token !== loadTokenRef.current) {
        // Only clear if a newer load hasn't already claimed the slot for its song.
        if (loadingSongIdRef.current === song.id) loadingSongIdRef.current = null;
        sound.stopAsync().catch(() => {}).then(() => sound.unloadAsync().catch(() => {}));
        return;
      }

      let preloadStarted = false;

      sound.setOnPlaybackStatusUpdate((status) => {
        // Ignore anything from a sound that is no longer the current one.
        if (token !== loadTokenRef.current) return;
        if (!status.isLoaded) return;

        // Warm the next track only once this one is actually playing. preloadNext
        // downloads a whole MP3, and firing it while the tapped song is still
        // buffering makes the user wait on a track they haven't asked for yet.
        if (!preloadStarted && status.isPlaying) {
          preloadStarted = true;
          preloadNext(token);
        }
        // Don't let a status update that was already in flight override the
        // play/pause the user just tapped.
        if (Date.now() - lastToggleAtRef.current > 400) {
          setIsPlayingGlobal(status.isPlaying);
          isPlayingRef.current = status.isPlaying;
        }
        setMiniPlayerPosition(status.positionMillis || 0);
        setMiniPlayerDuration(status.durationMillis || 0);
        if (status.didJustFinish) {
          const q = queueRef.current;
          // Roll into the next track — wrapping to the top of the queue, the same
          // way the next button behaves, so playback never dead-ends.
          if (q.length > 1) {
            queueIndexRef.current = (queueIndexRef.current + 1) % q.length;
            loadAndPlay(q[queueIndexRef.current]);
          } else {
            setIsPlayingGlobal(false);
            isPlayingRef.current = false;
          }
        }
      });

      soundRef.current = sound;
      loadedSongIdRef.current = song.id;
      if (loadingSongIdRef.current === song.id) loadingSongIdRef.current = null;
      if (needsPlay) sound.playAsync().catch(() => {}); // preloaded → starts instantly
      trackSongPlay(song);
      // preloadNext is kicked from the status listener once this track is playing,
      // so the background download can't compete with the stream being waited on.
    } catch (error) {
      if (loadingSongIdRef.current === song.id) loadingSongIdRef.current = null;
      if (token === loadTokenRef.current) {
        setIsPlayingGlobal(false);
        isPlayingRef.current = false;
      }
      console.log('Audio error:', error.message);
    }
  };

  const playPause = async () => {
    const sound = soundRef.current;
    if (!sound) {
      // No sound loaded but we have a track — restart it
      if (currentTrack) await loadAndPlay(currentTrack);
      return;
    }
    // Decide from the ref (no await) and flip the UI first, so the icon responds
    // on the very same frame as the tap.
    const willPlay = !isPlayingRef.current;
    isPlayingRef.current = willPlay;
    lastToggleAtRef.current = Date.now();
    setIsPlayingGlobal(willPlay);
    try {
      if (willPlay) await sound.playAsync();
      else await sound.pauseAsync();
    } catch (e) {
      // Roll back the optimistic flip if the call failed
      isPlayingRef.current = !willPlay;
      setIsPlayingGlobal(!willPlay);
    }
  };

  const playNextInQueue = async (isShuffle = false) => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const next = isShuffle
      ? Math.floor(Math.random() * q.length)
      : (queueIndexRef.current + 1) % q.length;
    queueIndexRef.current = next;
    await loadAndPlay(q[next]);
  };

  const playPreviousInQueue = async (isShuffle = false) => {
    if (miniPlayerPosition > 3000 && soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      return;
    }
    const q = queueRef.current;
    if (q.length === 0) return;
    const prev = isShuffle
      ? Math.floor(Math.random() * q.length)
      : (queueIndexRef.current - 1 + q.length) % q.length;
    queueIndexRef.current = prev;
    await loadAndPlay(q[prev]);
  };

  const seekTo = async (value) => {
    if (soundRef.current) await soundRef.current.setPositionAsync(value);
  };

  // ── SLEEP TIMER ────────────────────────────────────────────
  // Lives in context so it keeps running regardless of which screen is active.

  const setSleepTimer = (minutes, label) => {
    if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    setSleepTimerLabel(label);
    if (minutes === 'end') return; // "End of song" — auto-stops via didJustFinish
    sleepTimerTimeoutRef.current = setTimeout(async () => {
      try {
        if (soundRef.current) await soundRef.current.pauseAsync();
      } catch {}
      setIsPlayingGlobal(false);
      setSleepTimerLabel(null);
      Alert.alert('Sleep Timer 🌙', 'Music stopped. Sleep well!');
    }, minutes * 60 * 1000);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    setSleepTimerLabel(null);
  };

  // ── USER DATA ──────────────────────────────────────────────

  const useSkip = () => {
    if (Date.now() - skipsResetTime > 3600000) {
      setSkipsUsed(0);
      setSkipsResetTime(Date.now());
    }
    if (!isPremium && skipsUsed >= 8) return false;
    setSkipsUsed(prev => prev + 1);
    return true;
  };

  const skipsRemaining = isPremium ? 'Unlimited' : Math.max(0, 8 - skipsUsed);

  const trackSongPlay = (song) => {
    if (privateSession) return; // private session — don't record activity
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 20);
    });
    setListeningHabits(prev => {
      const n = { ...prev };
      if (song.genre) n.genres = { ...n.genres, [song.genre]: (n.genres[song.genre] || 0) + 1 };
      if (song.artist) n.artists = { ...n.artists, [song.artist]: (n.artists[song.artist] || 0) + 1 };
      n.songs = { ...n.songs, [song.id]: (n.songs[song.id] || 0) + 1 };
      return n;
    });
  };

  const clearListeningHistory = () => {
    setRecentlyPlayed([]);
    setListeningHabits({ genres: {}, artists: {}, songs: {} });
  };

  // Search history — shared so QR-scanned songs can be saved to it too
  const addToSearchHistory = (song) => {
    setSearchHistory(prev => [song, ...prev.filter(s => s.id !== song.id)].slice(0, 20));
  };

  const getTopGenres = (limit = 3) =>
    Object.entries(listeningHabits.genres).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([g]) => g);

  const getTopArtists = (limit = 5) =>
    Object.entries(listeningHabits.artists).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([a]) => a);

  const toggleFollowArtist = (artist) => {
    const isFollowing = followedArtists.find(a => a.id === artist.id);
    if (isFollowing) setFollowedArtists(followedArtists.filter(a => a.id !== artist.id));
    else setFollowedArtists([...followedArtists, artist]);
  };

  const addFollowedArtist = (artist) => {
    if (!followedArtists.find(a => a.id === artist.id)) {
      setFollowedArtists(prev => [...prev, artist]);
    }
  };

  const isFollowingArtist = (artistId) => followedArtists.some(a => a.id === artistId);

  const toggleLikeSong = (song) => {
    const isLiked = likedSongs.find(s => s.id === song.id);
    if (isLiked) {
      setLikedSongs(likedSongs.filter(s => s.id !== song.id));
      setUserPlaylists(prev => prev.map(pl =>
        pl.isLikedSongs ? { ...pl, songs: pl.songs.filter(s => s.id !== song.id) } : pl
      ));
    } else {
      setLikedSongs([song, ...likedSongs]);
      setUserPlaylists(prev => prev.map(pl =>
        pl.isLikedSongs ? { ...pl, songs: [song, ...pl.songs.filter(s => s.id !== song.id)] } : pl
      ));
    }
  };

  const isSongLiked = (songId) => likedSongs.some(s => s.id === songId);

  // ── FREEMIUM PLAYLIST LIMITS ───────────────────────────────
  // Free users get exactly ONE custom playlist that holds up to 11 songs.
  // "Liked Songs" is a system playlist and is never counted or capped.
  const FREE_PLAYLIST_LIMIT = 1;
  const FREE_SONGS_PER_PLAYLIST = 11;

  const customPlaylistCount = userPlaylists.filter(p => !p.isLikedSongs).length;

  // Can this user create another custom playlist right now?
  const canCreatePlaylist = () => isPremium || customPlaylistCount < FREE_PLAYLIST_LIMIT;

  // Can this user add one more song to the given playlist right now?
  const canAddSongToPlaylist = (playlistId) => {
    if (isPremium) return true;
    const pl = userPlaylists.find(p => p.id === playlistId);
    if (!pl || pl.isLikedSongs) return true; // Liked Songs is uncapped
    return pl.songs.length < FREE_SONGS_PER_PLAYLIST;
  };

  // Returns true if the song was added, false if blocked by the free cap.
  const addSongToPlaylist = (song, playlistId) => {
    const target = userPlaylists.find(p => p.id === playlistId);
    if (target && !target.isLikedSongs && !isPremium) {
      const already = target.songs.some(s => s.id === song.id);
      if (!already && target.songs.length >= FREE_SONGS_PER_PLAYLIST) {
        return false; // free 11-song cap reached
      }
    }
    setUserPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        const already = pl.songs.find(s => s.id === song.id);
        if (!already) return { ...pl, songs: [...pl.songs, song] };
      }
      return pl;
    }));
    return true;
  };

  // Returns the new playlist, or null if the free 1-playlist limit is reached.
  const createPlaylist = (name, emoji) => {
    if (!isPremium && customPlaylistCount >= FREE_PLAYLIST_LIMIT) return null;
    const pl = { id: Date.now().toString(), name, emoji: emoji || '🎵', songs: [], isLikedSongs: false };
    setUserPlaylists(prev => [...prev, pl]);
    return pl;
  };

  // Create a playlist pre-filled with songs in one shot. Used by the AI Playlist
  // Generator (a premium feature), so it is not subject to the free tier caps.
  const createGeneratedPlaylist = (name, emoji, songs = []) => {
    const pl = { id: Date.now().toString(), name, emoji: emoji || '✨', songs, isLikedSongs: false };
    setUserPlaylists(prev => [...prev, pl]);
    return pl;
  };

  // Created content (AI-generated / uploaded songs) shown under "Upload Music".
  const addCreatedSong = (song) => {
    setCreatedSongs(prev => [song, ...prev.filter(s => s.id !== song.id)]);
  };

  const updateCreatedSong = (id, patch) => {
    setCreatedSongs(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  // Downloads → shown under Library "Downloads" (videos vs audio split by videoUrl).
  const downloadSong = (song) => {
    setDownloadedSongs(prev => (prev.some(s => s.id === song.id) ? prev : [song, ...prev]));
  };
  const isDownloaded = (id) => downloadedSongs.some(s => s.id === id);
  const removeDownload = (id) => {
    setDownloadedSongs(prev => prev.filter(s => s.id !== id));
  };

  const deletePlaylist = (id) => {
    setUserPlaylists(prev => prev.filter(p => p.id !== id || p.isLikedSongs));
  };

  const removeSongFromPlaylist = (songId, playlistId) => {
    setUserPlaylists(prev => prev.map(pl =>
      pl.id === playlistId ? { ...pl, songs: pl.songs.filter(s => s.id !== songId) } : pl
    ));
  };

  const updatePlaylist = (id, name, emoji) => {
    setUserPlaylists(prev => prev.map(pl =>
      pl.id === id && !pl.isLikedSongs ? { ...pl, name, emoji } : pl
    ));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── BACKEND SYNC ──────────────────────────────────────────────

  // Called after Firebase login/signup. Creates user in MongoDB if new,
  // then syncs isPremium so website payments are reflected in the app.
  const syncPremiumFromBackend = async (firebaseUser, displayName = '') => {
    if (!firebaseUser?.uid) return;
    try {
      // Ensure user record exists in MongoDB
      await api.createUser({
        firebaseUid: firebaseUser.uid,
        name: displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email.toLowerCase(),
      });
      // Pull latest user data (includes isPremium set by website payment)
      const backendUser = await api.getUser(firebaseUser.uid);
      if (backendUser?.isPremium) {
        setIsPremium(true);
      }
    } catch {
      // Backend unavailable — app still works with default state
    }
  };

  return (
    <UserContext.Provider value={{
      isPremium, setIsPremium,
      skipsUsed, skipsRemaining, useSkip,
      favouriteArtists, setFavouriteArtists,
      profileImage, setProfileImage,
      followedArtists, toggleFollowArtist, addFollowedArtist, isFollowingArtist,
      recentlyPlayed, setRecentlyPlayed,
      searchHistory, setSearchHistory, addToSearchHistory,
      likedSongs, toggleLikeSong, isSongLiked,
      userPlaylists, setUserPlaylists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist, createGeneratedPlaylist, deletePlaylist, updatePlaylist,
      createdSongs, addCreatedSong, updateCreatedSong,
      downloadedSongs, downloadSong, isDownloaded, removeDownload,
      canCreatePlaylist, canAddSongToPlaylist, customPlaylistCount, FREE_SONGS_PER_PLAYLIST, FREE_PLAYLIST_LIMIT,
      notifications, setNotifications, markAllNotificationsRead, unreadCount,
      listeningHabits, trackSongPlay, getTopGenres, getTopArtists,
      privateSession, setPrivateSession, clearListeningHistory,
      themeKey, setThemeKey, toggleTheme, colors, isDark,
      syncPremiumFromBackend,
      // Global player
      currentTrack, setCurrentTrack,
      isPlayingGlobal,
      miniPlayerPosition, miniPlayerDuration,
      isPlayerOpen, setIsPlayerOpen,
      currentQueue,
      loadAndPlay, playPause, playNextInQueue, playPreviousInQueue, seekTo,
      // Sleep timer (persists across screens)
      sleepTimerLabel, setSleepTimer, cancelSleepTimer,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}