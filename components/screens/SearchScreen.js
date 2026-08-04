import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput,
  FlatList, Modal, Animated, Dimensions, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useUser } from '../../context/UserContext';
import api from '../../services/api';
import { searchAudius } from '../../services/audius';
import { useArtwork, useTrendingSongs, useArtistImage, useArtistTopSongs } from '../../services/artwork';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.floor(SCREEN_W * 0.38);

const GENRE_COLORS = {
  Afrobeats: '#FF6B35', 'Hip Hop': '#9B59B6', Rap: '#E74C3C',
  Amapiano: '#1ABC9C', Pop: '#E91E63', Gospel: '#2ECC71',
  Praise: '#F39C12', Worship: '#3498DB',
  Rock: '#C0392B', Reggae: '#27AE60', Radio: '#2980B9',
  Country: '#D35400', Decades: '#8E44AD', Jazz: '#16A085',
  Classic: '#34495E', Instrumental: '#607D8B',
};

const GENRE_ICONS = {
  Afrobeats: 'musical-notes', 'Hip Hop': 'mic', Rap: 'mic-circle',
  Amapiano: 'headset', Pop: 'star', Gospel: 'heart',
  Praise: 'sunny', Worship: 'sparkles',
  Rock: 'flash', Reggae: 'leaf', Radio: 'radio',
  Country: 'compass', Decades: 'time', Jazz: 'cafe',
  Classic: 'library', Instrumental: 'musical-note',
};

const AU = n => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

const GENRE_SONGS = {
  Afrobeats: [
    { id: 'a1', title: 'Last Last',   artist: 'Burna Boy',  genre: 'Afrobeats', emoji: '🎵', audioUrl: AU(1) },
    { id: 'a2', title: 'Essence',     artist: 'Wizkid',     genre: 'Afrobeats', emoji: '🎶', audioUrl: AU(2) },
    { id: 'a3', title: 'Fall',        artist: 'Davido',     genre: 'Afrobeats', emoji: '🎸', audioUrl: AU(3) },
    { id: 'a4', title: 'Calm Down',   artist: 'Rema',       genre: 'Afrobeats', emoji: '🎹', audioUrl: AU(4) },
    { id: 'a5', title: 'Sability',    artist: 'Asake',      genre: 'Afrobeats', emoji: '🎺', audioUrl: AU(5) },
  ],
  'Hip Hop': [
    { id: 'h1', title: "God's Plan",    artist: 'Drake',          genre: 'Hip Hop', emoji: '🎵', audioUrl: AU(1) },
    { id: 'h2', title: 'Sicko Mode',    artist: 'Travis Scott',   genre: 'Hip Hop', emoji: '🎶', audioUrl: AU(2) },
    { id: 'h3', title: 'HUMBLE',        artist: 'Kendrick Lamar', genre: 'Hip Hop', emoji: '🎸', audioUrl: AU(3) },
    { id: 'h4', title: 'Rockstar',      artist: 'Post Malone',    genre: 'Hip Hop', emoji: '🎹', audioUrl: AU(4) },
    { id: 'h5', title: 'Nice For What', artist: 'Drake',          genre: 'Hip Hop', emoji: '🎺', audioUrl: AU(5) },
  ],
  Rap: [
    { id: 'ra1', title: 'SICKO MODE',      artist: 'Travis Scott',   genre: 'Rap', emoji: '🎤', audioUrl: AU(1) },
    { id: 'ra2', title: 'Goosebumps',      artist: 'Travis Scott',   genre: 'Rap', emoji: '🎵', audioUrl: AU(2) },
    { id: 'ra3', title: 'DNA',             artist: 'Kendrick Lamar', genre: 'Rap', emoji: '🎶', audioUrl: AU(3) },
    { id: 'ra4', title: 'Lucid Dreams',    artist: 'Juice WRLD',     genre: 'Rap', emoji: '🎸', audioUrl: AU(4) },
    { id: 'ra5', title: 'Congratulations', artist: 'Post Malone',    genre: 'Rap', emoji: '🎹', audioUrl: AU(5) },
  ],
  Amapiano: [
    { id: 'am1', title: 'Adiwele',         artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎵', audioUrl: AU(1) },
    { id: 'am2', title: 'Lengoma',         artist: 'DJ Maphorisa',   genre: 'Amapiano', emoji: '🎶', audioUrl: AU(2) },
    { id: 'am3', title: 'Umsebenzi Wethu', artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎸', audioUrl: AU(3) },
    { id: 'am4', title: 'Nkulunkulu',      artist: 'DJ Maphorisa',   genre: 'Amapiano', emoji: '🎹', audioUrl: AU(4) },
    { id: 'am5', title: 'Izolo',           artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎺', audioUrl: AU(5) },
  ],
  Pop: [
    { id: 'p1', title: 'Anti-Hero',       artist: 'Taylor Swift',  genre: 'Pop', emoji: '🎵', audioUrl: AU(1) },
    { id: 'p2', title: 'Shape of You',    artist: 'Ed Sheeran',    genre: 'Pop', emoji: '🎶', audioUrl: AU(2) },
    { id: 'p3', title: 'As It Was',       artist: 'Harry Styles',  genre: 'Pop', emoji: '🎸', audioUrl: AU(3) },
    { id: 'p4', title: 'Blinding Lights', artist: 'The Weeknd',    genre: 'Pop', emoji: '🎹', audioUrl: AU(4) },
    { id: 'p5', title: 'Stay',            artist: 'Justin Bieber', genre: 'Pop', emoji: '🎺', audioUrl: AU(5) },
  ],
  Gospel: [
    { id: 'g1', title: 'Way Maker',           artist: 'Sinach',            genre: 'Gospel', emoji: '🙏', audioUrl: AU(1) },
    { id: 'g2', title: 'Oceans',              artist: 'Hillsong',          genre: 'Gospel', emoji: '🕊️', audioUrl: AU(2) },
    { id: 'g3', title: 'Goodness of God',     artist: 'Bethel Music',      genre: 'Gospel', emoji: '🙌', audioUrl: AU(3) },
    { id: 'g4', title: 'Jireh',               artist: 'Elevation Worship', genre: 'Gospel', emoji: '⭐', audioUrl: AU(4) },
    { id: 'g5', title: 'What a Beautiful Name', artist: 'Hillsong',        genre: 'Gospel', emoji: '✝️', audioUrl: AU(5) },
  ],
  Praise: [
    { id: 'pr1', title: 'This is a Move', artist: 'Brandon Lake',      genre: 'Praise', emoji: '🙌', audioUrl: AU(1) },
    { id: 'pr2', title: 'Champion',       artist: 'Bethel Music',      genre: 'Praise', emoji: '👑', audioUrl: AU(2) },
    { id: 'pr3', title: 'Praise',         artist: 'Elevation Worship', genre: 'Praise', emoji: '🙏', audioUrl: AU(3) },
    { id: 'pr4', title: 'Build My Life',  artist: 'Pat Barrett',       genre: 'Praise', emoji: '✝️', audioUrl: AU(4) },
    { id: 'pr5', title: 'King of Kings',  artist: 'Hillsong',          genre: 'Praise', emoji: '👑', audioUrl: AU(5) },
  ],
  Worship: [
    { id: 'w1', title: 'What a Beautiful Name', artist: 'Hillsong',          genre: 'Worship', emoji: '🕊️', audioUrl: AU(1) },
    { id: 'w2', title: 'Reckless Love',          artist: 'Cory Asbury',       genre: 'Worship', emoji: '❤️', audioUrl: AU(2) },
    { id: 'w3', title: 'Graves into Gardens',    artist: 'Elevation Worship', genre: 'Worship', emoji: '🌿', audioUrl: AU(3) },
    { id: 'w4', title: 'Holy Forever',           artist: 'Chris Tomlin',      genre: 'Worship', emoji: '⭐', audioUrl: AU(4) },
    { id: 'w5', title: 'Gratitude',              artist: 'Brandon Lake',      genre: 'Worship', emoji: '🙏', audioUrl: AU(5) },
  ],
  Rock: [
    { id: 'rk1', title: 'Bohemian Rhapsody',  artist: 'Queen',         genre: 'Rock', emoji: '🎸', audioUrl: AU(1) },
    { id: 'rk2', title: 'Hotel California',   artist: 'Eagles',        genre: 'Rock', emoji: '🎵', audioUrl: AU(2) },
    { id: 'rk3', title: 'Sweet Child O Mine', artist: "Guns N' Roses", genre: 'Rock', emoji: '⚡', audioUrl: AU(3) },
    { id: 'rk4', title: 'Back in Black',      artist: 'AC/DC',         genre: 'Rock', emoji: '🎶', audioUrl: AU(4) },
    { id: 'rk5', title: 'Stairway to Heaven', artist: 'Led Zeppelin',  genre: 'Rock', emoji: '🎸', audioUrl: AU(5) },
  ],
  Reggae: [
    { id: 're1', title: 'No Woman No Cry',    artist: 'Bob Marley', genre: 'Reggae', emoji: '🌿', audioUrl: AU(1) },
    { id: 're2', title: 'One Love',           artist: 'Bob Marley', genre: 'Reggae', emoji: '☮️', audioUrl: AU(2) },
    { id: 're3', title: 'Redemption Song',    artist: 'Bob Marley', genre: 'Reggae', emoji: '🎵', audioUrl: AU(3) },
    { id: 're4', title: 'Three Little Birds', artist: 'Bob Marley', genre: 'Reggae', emoji: '🐦', audioUrl: AU(4) },
    { id: 're5', title: 'Is This Love',       artist: 'Bob Marley', genre: 'Reggae', emoji: '❤️', audioUrl: AU(5) },
  ],
  Radio: [
    { id: 'rad1', title: 'Flowers',          artist: 'Miley Cyrus',    genre: 'Radio', emoji: '🌸', audioUrl: AU(1) },
    { id: 'rad2', title: 'Levitating',       artist: 'Dua Lipa',       genre: 'Radio', emoji: '🎵', audioUrl: AU(2) },
    { id: 'rad3', title: 'Watermelon Sugar', artist: 'Harry Styles',   genre: 'Radio', emoji: '🍉', audioUrl: AU(3) },
    { id: 'rad4', title: 'drivers license',  artist: 'Olivia Rodrigo', genre: 'Radio', emoji: '🎶', audioUrl: AU(4) },
    { id: 'rad5', title: 'Peaches',          artist: 'Justin Bieber',  genre: 'Radio', emoji: '🍑', audioUrl: AU(5) },
  ],
  Country: [
    { id: 'co1', title: 'Jolene',            artist: 'Dolly Parton',    genre: 'Country', emoji: '🤠', audioUrl: AU(1) },
    { id: 'co2', title: 'Country Roads',     artist: 'John Denver',     genre: 'Country', emoji: '🌄', audioUrl: AU(2) },
    { id: 'co3', title: 'Tennessee Whiskey', artist: 'Chris Stapleton', genre: 'Country', emoji: '🥃', audioUrl: AU(3) },
    { id: 'co4', title: 'Ring of Fire',      artist: 'Johnny Cash',     genre: 'Country', emoji: '🔥', audioUrl: AU(4) },
    { id: 'co5', title: 'Wagon Wheel',       artist: 'Darius Rucker',   genre: 'Country', emoji: '🎵', audioUrl: AU(5) },
  ],
  Decades: [
    { id: 'dec1', title: 'Billie Jean',                 artist: 'Michael Jackson', genre: 'Decades', emoji: '👑', audioUrl: AU(1) },
    { id: 'dec2', title: 'Like a Prayer',               artist: 'Madonna',         genre: 'Decades', emoji: '🎵', audioUrl: AU(2) },
    { id: 'dec3', title: 'Sweet Dreams',                artist: 'Eurythmics',      genre: 'Decades', emoji: '💭', audioUrl: AU(3) },
    { id: 'dec4', title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper',    genre: 'Decades', emoji: '🎶', audioUrl: AU(4) },
    { id: 'dec5', title: 'Africa',                      artist: 'Toto',            genre: 'Decades', emoji: '🌍', audioUrl: AU(5) },
  ],
  Jazz: [
    { id: 'jz1', title: 'Take Five',              artist: 'Dave Brubeck',    genre: 'Jazz', emoji: '🎷', audioUrl: AU(1) },
    { id: 'jz2', title: 'So What',                artist: 'Miles Davis',     genre: 'Jazz', emoji: '🎺', audioUrl: AU(2) },
    { id: 'jz3', title: 'Autumn Leaves',          artist: 'Bill Evans',      genre: 'Jazz', emoji: '🍂', audioUrl: AU(3) },
    { id: 'jz4', title: 'Fly Me to the Moon',     artist: 'Frank Sinatra',   genre: 'Jazz', emoji: '🌙', audioUrl: AU(4) },
    { id: 'jz5', title: 'What a Wonderful World', artist: 'Louis Armstrong', genre: 'Jazz', emoji: '🌍', audioUrl: AU(5) },
  ],
  Classic: [
    { id: 'cl1', title: 'Symphony No. 5',   artist: 'Beethoven',   genre: 'Classic', emoji: '🎻', audioUrl: AU(1) },
    { id: 'cl2', title: 'Four Seasons',     artist: 'Vivaldi',     genre: 'Classic', emoji: '🌿', audioUrl: AU(2) },
    { id: 'cl3', title: 'Moonlight Sonata', artist: 'Beethoven',   genre: 'Classic', emoji: '🌙', audioUrl: AU(3) },
    { id: 'cl4', title: 'Canon in D',       artist: 'Pachelbel',   genre: 'Classic', emoji: '🎶', audioUrl: AU(4) },
    { id: 'cl5', title: 'Swan Lake',        artist: 'Tchaikovsky', genre: 'Classic', emoji: '🦢', audioUrl: AU(5) },
  ],
  Instrumental: [
    { id: 'in1', title: 'Clair de Lune',      artist: 'Debussy',      genre: 'Instrumental', emoji: '🌙', audioUrl: AU(1) },
    { id: 'in2', title: 'River Flows in You', artist: 'Yiruma',       genre: 'Instrumental', emoji: '🌊', audioUrl: AU(2) },
    { id: 'in3', title: 'Experience',         artist: 'Einaudi',      genre: 'Instrumental', emoji: '🎵', audioUrl: AU(3) },
    { id: 'in4', title: 'Nuvole Bianche',     artist: 'Einaudi',      genre: 'Instrumental', emoji: '☁️', audioUrl: AU(4) },
    { id: 'in5', title: 'Comptine',           artist: 'Yann Tiersen', genre: 'Instrumental', emoji: '🎶', audioUrl: AU(5) },
  ],
};

const ALL_SONGS = Object.values(GENRE_SONGS).flat();

const localMatches = (text) => {
  const q = (text || '').toLowerCase();
  return ALL_SONGS.filter(s =>
    s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );
};

// ── Song recognition ─────────────────────────────────────────────────────────
// Handled by SonaraBackend (POST /api/recognize), which holds the ACRCloud
// credentials and signs the request. No keys live in this app.

// ── DiscoverCard (module scope — TextInput keyboard-bug rule) ────────────────
function DiscoverCard({ styles, c, item, onPress }) {
  const color = GENRE_COLORS[item.genre] || '#333';
  const art = useArtwork(item);
  return (
    <TouchableOpacity
      style={styles.discoverCard}
      onPress={onPress}
      activeOpacity={0.82}>
      <View style={[styles.discoverArt, { backgroundColor: color + '22' }]}>
        {art
          ? <Image source={{ uri: art }} style={styles.discoverArtImg} />
          : <Text style={styles.discoverEmoji}>{item.emoji}</Text>}
        <View style={[styles.discoverPlayBtn, { backgroundColor: color }]}>
          <Ionicons name="play" size={11} color={c.icon} />
        </View>
      </View>
      <View style={styles.discoverMeta}>
        <Text style={styles.discoverTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.discoverArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── GenreCard (module scope) ─────────────────────────────────────────────────
// Browse tile: shows the REAL cover art of the genre's top song (via useArtwork)
// instead of a flat icon. Falls back to the icon until/unless a cover is found.
function GenreCard({ styles, genre, color, icon, song, onPress }) {
  const art = useArtwork(song);
  return (
    <TouchableOpacity
      style={[styles.genreCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.82}>
      <View style={styles.genreImgSlot}>
        {art
          ? <Image source={{ uri: art }} style={styles.genreImg} resizeMode="cover" />
          : <Ionicons name={icon} size={20} color="rgba(255,255,255,0.9)" />}
      </View>
      <Text style={styles.genreLabel}>{genre}</Text>
    </TouchableOpacity>
  );
}

// ── GenreSongCard (module scope) ─────────────────────────────────────────────
// Big square cover card used inside a genre page (same look as the Player's
// Explore cards). Shows real artwork via useArtwork, falls back to the emoji.
function GenreSongCard({ styles, c, item, color, onPress, cardStyle }) {
  const art = useArtwork(item);
  return (
    <TouchableOpacity style={[styles.gCard, cardStyle]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.gCardArt, { backgroundColor: color + '22' }]}>
        {art
          ? <Image source={{ uri: art }} style={styles.gCardArtImg} resizeMode="cover" />
          : <Text style={styles.gCardEmoji}>{item.emoji || '🎵'}</Text>}
        <View style={[styles.gCardPlay, { backgroundColor: color }]}>
          <Ionicons name="play" size={14} color={c.icon} />
        </View>
      </View>
      <Text style={styles.gCardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.gCardArtist} numberOfLines={1}>{item.artist}</Text>
    </TouchableOpacity>
  );
}

// ── ArtistCircle (module scope) ──────────────────────────────────────────────
// Round artist photo + name, used in a genre page's "Top Artists" row.
function ArtistCircle({ styles, c, name, color, onPress }) {
  const photo = useArtistImage(name);
  return (
    <TouchableOpacity style={styles.gArtist} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.gArtistArt, { backgroundColor: color + '22', borderColor: color }]}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.gArtistImg} resizeMode="cover" />
          : <Ionicons name="person" size={30} color={color} />}
      </View>
      <Text style={styles.gArtistName} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

// ── MoreFromGenre (module scope) ─────────────────────────────────────────────
// Real songs pulled from a genre's artist (Deezer), shown as a horizontal row of
// big covers. Renders nothing until/unless real songs come back.
function MoreFromGenre({ styles, c, artist, color, onPlay }) {
  const { songs } = useArtistTopSongs(artist);
  if (!songs.length) return null;
  const list = songs.slice(0, 12);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gHRow}>
      {list.map((item, i) => (
        <GenreSongCard key={item.id} styles={styles} c={c} item={item} color={color}
          cardStyle={styles.gHCard} onPress={() => onPlay(item, list, i)} />
      ))}
    </ScrollView>
  );
}

// ── SongRow (module scope) ───────────────────────────────────────────────────
function SongRow({ styles, c, item, index, onPress, accentColor }) {
  const art = useArtwork(item);
  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={() => onPress(item, index)}
      activeOpacity={0.7}>
      <View style={styles.resultArt}>
        {art
          ? <Image source={{ uri: art }} style={styles.resultArtImg} />
          : <Text style={styles.resultEmoji}>{item.emoji}</Text>}
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultArtist}>{item.artist}</Text>
      </View>
      <Ionicons name="play" size={15} color={c.textFaint} />
    </TouchableOpacity>
  );
}

// ── HistoryRow (module scope) — recent searches, now with the song's cover art ──
function HistoryRow({ styles, c, song, onOpen, onRemove }) {
  const art = useArtwork(song);
  return (
    <TouchableOpacity style={styles.historyItem} onPress={() => onOpen(song)} activeOpacity={0.7}>
      <View style={styles.historyArt}>
        {art
          ? <Image source={{ uri: art }} style={styles.historyArtImg} />
          : (song.emoji
            ? <Text style={styles.historyEmoji}>{song.emoji}</Text>
            : <Ionicons name="time-outline" size={15} color={c.textFaint} />)}
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.historyArtist} numberOfLines={1}>{song.artist}</Text>
      </View>
      <TouchableOpacity onPress={() => onRemove(song)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={15} color={c.textFaint} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation }) {
  const {
    listeningHabits, getTopGenres, loadAndPlay, recentlyPlayed,
    searchHistory, setSearchHistory, addToSearchHistory,
  } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const catalogReqRef = useRef(0); // guards against stale (out-of-order) catalog responses
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [focused, setFocused] = useState(false);

  const [showRecognition, setShowRecognition] = useState(false);
  const [recognitionState, setRecognitionState] = useState('listening');
  const [recognizedSong, setRecognizedSong] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [recognitionError, setRecognitionError] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const recordingRef = useRef(null);
  const countdownRef = useRef(null);
  const pulseLoopRef = useRef(null);

  // Real trending songs (Deezer) carry their own cover art, so the Discover cards
  // actually show images. Falls back to the hardcoded genre picks if the fetch fails.
  const trendingSongs = useTrendingSongs(20);
  const discoverFallback = useMemo(() => {
    const seen = new Set();
    const results = [];
    recentlyPlayed.slice(0, 5).forEach(s => {
      if (!seen.has(s.id)) { seen.add(s.id); results.push(s); }
    });
    getTopGenres(3).forEach(g => {
      (GENRE_SONGS[g] || []).forEach(s => {
        if (!seen.has(s.id) && results.length < 10) { seen.add(s.id); results.push(s); }
      });
    });
    const curated = [
      GENRE_SONGS.Afrobeats[0], GENRE_SONGS.Amapiano[0], GENRE_SONGS.Gospel[0],
      GENRE_SONGS.Jazz[0], GENRE_SONGS.Pop[0], GENRE_SONGS.Rock[0], GENRE_SONGS.Reggae[0],
    ];
    curated.forEach(s => {
      if (!seen.has(s.id) && results.length < 10) { seen.add(s.id); results.push(s); }
    });
    return results;
  }, [listeningHabits, recentlyPlayed]);
  const discoverSongs = trendingSongs.length ? trendingSongs : discoverFallback;

  // ── Song Recognition ─────────────────────────────────────────────────────
  const stopPulse = useCallback(() => {
    if (pulseLoopRef.current) { pulseLoopRef.current.stop(); pulseLoopRef.current = null; }
    pulseAnim.stopAnimation(); pulseAnim.setValue(1);
    pulseOpacity.stopAnimation(); pulseOpacity.setValue(0.6);
  }, []);

  const cleanupRecognition = useCallback(async () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    stopPulse();
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch (_) {}
      recordingRef.current = null;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (_) {}
  }, []);

  useEffect(() => { return () => { cleanupRecognition(); }; }, []);

  const identifySong = async (uri) => {
    setRecognitionState('searching');
    setRecognitionError(null);
    try {
      const ext = (uri.split('.').pop() || 'm4a').toLowerCase().split('?')[0];
      const mime = ext === 'm4a' || ext === 'mp4' ? 'audio/mp4'
        : ext === 'caf' ? 'audio/x-caf'
        : ext === 'wav' ? 'audio/wav'
        : `audio/${ext}`;

      // The backend signs this with the ACRCloud secret and forwards it.
      const json = await api.recognizeSong({ uri, name: `sample.${ext}`, type: mime });

      if (json?.status === 'success' && json.result) {
        const r = json.result;
        setRecognizedSong({
          title: r.title,
          artist: r.artist,
          album: r.album || null,
          emoji: '🎵',
          genre: r.genre || 'Music',
          songLink: r.songLink || null,
          releaseDate: r.releaseDate || null,
        });
        setRecognitionState('found');
      } else {
        setRecognitionError(json?.message || 'Could not identify the song. Please try again.');
        setRecognitionState('notFound');
      }
    } catch (err) {
      setRecognitionError(err.message || 'Network error — check your connection');
      setRecognitionState('notFound');
    }
  };

  const startPulse = useCallback(() => {
    pulseLoopRef.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    pulseLoopRef.current.start();
  }, []);

  const openRecognition = async () => {
    setRecognitionState('listening');
    setRecognizedSong(null);
    setRecognitionError(null);
    setCountdown(10);
    setShowRecognition(true);
    startPulse();

    // Microphone permission — surface the failure instead of silently closing
    let granted = false;
    try {
      const perm = await Audio.requestPermissionsAsync();
      granted = perm.granted;
    } catch (_) {}
    if (!granted) {
      stopPulse();
      setRecognitionError('Microphone access is off. Enable it in Settings to identify songs.');
      setRecognitionState('notFound');
      return;
    }

    // Start recording — surface any failure so it's not an invisible dead-end
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
    } catch (e) {
      stopPulse();
      setRecognitionError(`Couldn't start recording: ${e?.message || 'unknown error'}`);
      setRecognitionState('notFound');
      return;
    }
    let remaining = 10;
    countdownRef.current = setInterval(async () => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        stopPulse();
        let uri = null;
        if (recordingRef.current) {
          uri = recordingRef.current.getURI();
          try { await recordingRef.current.stopAndUnloadAsync(); } catch (_) {}
          recordingRef.current = null;
        }
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          });
        } catch (_) {}
        if (uri) { await identifySong(uri); } else { setRecognitionState('notFound'); }
      }
    }, 1000);
  };

  const closeRecognition = async () => {
    await cleanupRecognition();
    setShowRecognition(false);
  };

  const retryRecognition = async () => {
    await cleanupRecognition();
    await openRecognition();
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (text) => {
    setQuery(text);
    if (!text.trim()) { setSearchResults([]); setCatalogLoading(false); return; }
    // Instant local matches so results feel immediate; real YouTube + Audius songs
    // stream in via the debounced effect below.
    setSearchResults(localMatches(text));
  };

  // Fetch the real catalog (Audius) and merge it with the instant local matches.
  // Debounced, and guarded so a slow response for an old query can't overwrite
  // results for the current one.
  useEffect(() => {
    const term = query.trim();
    if (!term) { setCatalogLoading(false); return; }
    const reqId = ++catalogReqRef.current;
    setCatalogLoading(true);
    const timer = setTimeout(async () => {
      const catalog = await searchAudius(term, 15);
      if (reqId !== catalogReqRef.current) return; // a newer query superseded this one
      const seen = new Set();
      const merged = [];
      for (const s of [...localMatches(term), ...catalog]) {
        if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); }
      }
      setSearchResults(merged);
      setCatalogLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const openSong = (song, queue, index = 0) => {
    addToSearchHistory(song);
    // One path for every song: context routes catalog + YouTube songs to the root
    // YouTube engine (real originals) and real-audio songs to expo-av.
    loadAndPlay(song, queue || [song], index);
    navigation.navigate('Player', { song });
  };

  const cancel = () => { setQuery(''); setSearchResults([]); setFocused(false); };
  const openGenre = (genre) => { setSelectedGenre(genre); setQuery(''); setSearchResults([]); setFocused(false); };
  const closeGenre = () => setSelectedGenre(null);

  const showResults = query.length > 0;
  // When the search bar is focused (and nothing typed), show a dedicated
  // Recent Searches page instead of the Discover + genre browse content.
  const showRecent = focused && !showResults;

  // ── GENRE FULL-SCREEN VIEW ───────────────────────────────────────────────
  if (selectedGenre) {
    const songs = GENRE_SONGS[selectedGenre] || [];
    const color = GENRE_COLORS[selectedGenre] || '#555';
    const genreArtists = [...new Set(songs.map(s => s.artist).filter(Boolean))];
    return (
      <View style={styles.container}>
        <View style={styles.genreHeader}>
          <TouchableOpacity style={styles.genreBackBtn} onPress={closeGenre} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color={c.icon} />
          </TouchableOpacity>
          <View style={styles.genreHeaderCenter}>
            <View style={[styles.genreIconBadge, { backgroundColor: color + '28' }]}>
              <Ionicons name={GENRE_ICONS[selectedGenre]} size={18} color={color} />
            </View>
            <Text style={[styles.genreHeaderTitle, { color }]}>{selectedGenre}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Popular — the genre's songs as big cover cards */}
          <Text style={[styles.gSectionTitle, { color }]}>Popular in {selectedGenre}</Text>
          <View style={styles.gGrid}>
            {songs.map((item, index) => (
              <GenreSongCard styles={styles} c={c}
                key={item.id}
                item={item}
                color={color}
                onPress={() => openSong(item, songs, index)}
              />
            ))}
          </View>

          {/* Top Artists — the real artists behind this genre's songs */}
          {genreArtists.length > 0 && (
            <>
              <Text style={[styles.gSectionTitle, { color }]}>Top Artists</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gHRow}>
                {genreArtists.map(name => (
                  <ArtistCircle key={name} styles={styles} c={c} name={name} color={color}
                    onPress={() => navigation.navigate('Artist', { artist: { id: name, name, genre: selectedGenre, emoji: '🎤' } })} />
                ))}
              </ScrollView>
            </>
          )}

          {/* More — real tracks pulled from this genre's lead artist */}
          {genreArtists[0] && (
            <>
              <Text style={[styles.gSectionTitle, { color }]}>More {selectedGenre}</Text>
              <MoreFromGenre styles={styles} c={c} artist={genreArtists[0]} color={color}
                onPlay={(item, list, i) => openSong(item, list, i)} />
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── BROWSE / SEARCH VIEW ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header: title left, recognition + camera right (parallel) */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.headerBtns}>
          {/* Song recognition — Sonara musical-notes logo */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={openRecognition}
            activeOpacity={0.75}>
            <Ionicons name="musical-notes" size={19} color={c.textDim} />
          </TouchableOpacity>
          {/* QR / camera scanner */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('QRScanner')}
            activeOpacity={0.75}>
            <Ionicons name="camera-outline" size={20} color={c.textDim} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Ionicons name="search" size={17} color={c.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Songs, artists, genres..."
            placeholderTextColor={c.textFaint}
            value={query}
            onChangeText={handleSearch}
            onFocus={() => setFocused(true)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => { setQuery(''); setSearchResults([]); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={c.textFaint} />
            </TouchableOpacity>
          )}
        </View>
        {focused && (
          <TouchableOpacity onPress={cancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Search results */}
        {showResults && (
          <View style={styles.section}>
            {searchResults.length > 0 ? (
              <>
                <View style={styles.resultsHeader}>
                  <Text style={styles.sectionTitle}>Results · {searchResults.length}</Text>
                  {catalogLoading && <ActivityIndicator size="small" color={c.textDim} />}
                </View>
                <View style={{ marginTop: 14 }}>
                  {searchResults.map((item, index) => (
                    <SongRow styles={styles} c={c}
                      key={item.id}
                      item={item}
                      index={index}
                      onPress={(s, i) => openSong(s, searchResults, i)}
                      accentColor={GENRE_COLORS[item.genre]}
                    />
                  ))}
                </View>
              </>
            ) : catalogLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={c.textDim} />
                <Text style={styles.emptySub}>Searching…</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={44} color={c.textFaint} />
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptySub}>Try a different song or artist name</Text>
              </View>
            )}
          </View>
        )}

        {/* Recent searches — dedicated page shown when the search bar is focused */}
        {showRecent && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {searchHistory.length > 0 && (
                <TouchableOpacity onPress={() => setSearchHistory([])}>
                  <Text style={styles.clearAll}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchHistory.length > 0 ? (
              searchHistory.map(song => (
                <HistoryRow
                  key={song.id}
                  styles={styles} c={c} song={song}
                  onOpen={openSong}
                  onRemove={(s) => setSearchHistory(prev => prev.filter(x => x.id !== s.id))}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={44} color={c.textFaint} />
                <Text style={styles.emptyTitle}>No recent searches</Text>
                <Text style={styles.emptySub}>Songs you search and play will show up here</Text>
              </View>
            )}
          </View>
        )}

        {/* Browse content — hidden while the search bar is focused */}
        {!focused && !showResults && (
          <>
            {/* Discover Something New */}
            <View style={{ marginBottom: 28 }}>
              <View style={styles.discoverHeaderRow}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
                  Discover Something New
                </Text>
              </View>
              <Text style={styles.discoverSub}>
                {recentlyPlayed.length > 0 ? "Based on what you've played" : 'Curated picks for you'}
              </Text>
              <FlatList
                data={discoverSongs}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.discoverList}
                renderItem={({ item }) => (
                  <DiscoverCard styles={styles} c={c}
                    item={item}
                    onPress={() => openSong(item, discoverSongs, discoverSongs.indexOf(item))}
                  />
                )}
              />
            </View>

            {/* Genre grid */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Browse</Text>
              <View style={styles.genreGrid}>
                {Object.keys(GENRE_SONGS).map(genre => (
                  <GenreCard
                    key={genre}
                    styles={styles}
                    genre={genre}
                    color={GENRE_COLORS[genre]}
                    icon={GENRE_ICONS[genre]}
                    song={(GENRE_SONGS[genre] || [])[0]}
                    onPress={() => openGenre(genre)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Song Recognition Modal ─────────────────────────────────────── */}
      <Modal
        visible={showRecognition}
        transparent
        animationType="fade"
        onRequestClose={closeRecognition}>
        <View style={styles.recognitionOverlay}>

          <TouchableOpacity style={styles.recognitionClose} onPress={closeRecognition}>
            <Ionicons name="close" size={22} color={c.textFaint} />
          </TouchableOpacity>

          {recognitionState === 'listening' && (
            <>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                ]}>
                <View style={styles.pulseCore}>
                  <Ionicons name="musical-notes" size={34} color={c.icon} />
                </View>
              </Animated.View>
              <Text style={styles.countdownNum}>{countdown}</Text>
              <Text style={styles.recognitionLabel}>Listening...</Text>
              <Text style={styles.recognitionSub}>Hold your phone close to the music</Text>
              <TouchableOpacity style={styles.cancelRecognitionBtn} onPress={closeRecognition}>
                <Text style={styles.cancelRecognitionText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {recognitionState === 'searching' && (
            <>
              <ActivityIndicator size={52} color={c.icon} />
              <Text style={styles.recognitionLabel}>Identifying song...</Text>
              <Text style={styles.recognitionSub}>Searching millions of tracks</Text>
            </>
          )}

          {recognitionState === 'found' && recognizedSong && (
            <View style={styles.foundCard}>
              <View style={styles.foundArtBox}>
                <Text style={styles.foundEmoji}>{recognizedSong.emoji || '🎵'}</Text>
              </View>
              <View style={styles.foundIdentifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color={c.icon} />
                <Text style={styles.foundIdentifiedText}>Song Identified</Text>
              </View>
              <Text style={styles.foundTitle}>{recognizedSong.title}</Text>
              <Text style={styles.foundArtist}>{recognizedSong.artist}</Text>
              {recognizedSong.album && <Text style={styles.foundAlbum}>{recognizedSong.album}</Text>}
              {recognizedSong.releaseDate && <Text style={styles.foundDate}>{recognizedSong.releaseDate}</Text>}
              <TouchableOpacity
                style={styles.recognitionBtn}
                onPress={() => { closeRecognition(); openSong(recognizedSong, [recognizedSong], 0); }}>
                <Ionicons name="play" size={15} color={c.icon} style={{ marginRight: 8 }} />
                <Text style={styles.recognitionBtnText}>Play on Sonara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryBtn} onPress={retryRecognition}>
                <Text style={styles.retryText}>Identify Another</Text>
              </TouchableOpacity>
            </View>
          )}

          {recognitionState === 'notFound' && (
            <>
              <View style={styles.notFoundIcon}>
                <Ionicons name="musical-note-outline" size={38} color={c.textFaint} />
              </View>
              <Text style={styles.recognitionLabel}>Song not found</Text>
              <Text style={styles.recognitionSub}>
                {recognitionError || 'Try playing the song louder or in a quieter place'}
              </Text>
              <TouchableOpacity style={styles.recognitionBtn} onPress={retryRecognition}>
                <Text style={styles.recognitionBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryBtn} onPress={closeRecognition}>
                <Text style={styles.retryText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, paddingTop: 56 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: { fontSize: 26, fontWeight: '900', color: c.text },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.surface, borderRadius: 19,
    borderWidth: 1, borderColor: c.border,
  },

  // Search bar
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    borderWidth: 1, borderColor: c.border,
  },
  searchBarFocused: { borderColor: c.borderStrong },
  searchInput: { flex: 1, color: c.text, fontSize: 14 },
  cancelBtn: { marginLeft: 12 },
  cancelText: { color: c.textDim, fontSize: 14, fontWeight: '600' },

  // Sections
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: c.text },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearAll: { color: c.textFaint, fontSize: 13, fontWeight: '600' },

  // Discover
  discoverHeaderRow: { marginBottom: 4 },
  discoverSub: { fontSize: 12, color: c.textFaint, marginTop: 2, paddingHorizontal: 20, marginBottom: 14 },
  discoverList: { paddingHorizontal: 20, paddingBottom: 4, gap: 10 },

  // DiscoverCard — same scale as genre cards
  discoverCard: {
    width: CARD_W, borderRadius: 12,
    backgroundColor: c.surface, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
  },
  discoverArt: {
    width: '100%', height: CARD_W * 0.82,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    overflow: 'hidden',
  },
  discoverArtImg: { ...StyleSheet.absoluteFillObject },
  discoverEmoji: { fontSize: 36 },
  discoverPlayBtn: {
    position: 'absolute', bottom: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  discoverMeta: { padding: 10 },
  discoverTitle: { color: c.text, fontSize: 12, fontWeight: '700' },
  discoverArtist: { color: c.textFaint, fontSize: 10, marginTop: 2 },

  // SongRow
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 10,
    padding: 11, marginBottom: 8, gap: 12,
  },
  resultArt: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: c.elevated,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  resultArtImg: { width: '100%', height: '100%' },
  resultEmoji: { fontSize: 20 },
  resultInfo: { flex: 1 },
  resultTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  resultArtist: { color: c.textFaint, fontSize: 11, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { color: c.textFaint, fontSize: 15, fontWeight: '700' },
  emptySub: { color: c.textFaint, fontSize: 12 },

  // History
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 10,
    padding: 11, marginBottom: 8, gap: 10,
  },
  historyArt: {
    width: 40, height: 40, backgroundColor: c.elevated,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  historyArtImg: { width: '100%', height: '100%' },
  historyEmoji: { fontSize: 18 },
  historyInfo: { flex: 1 },
  historyTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  historyArtist: { color: c.textFaint, fontSize: 11, marginTop: 2 },

  // Genre grid
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreCard: {
    width: '47%',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  // Image slot at top-left — swap Ionicons for <Image> when real assets are ready
  genreImgSlot: {
    width: 36, height: 36,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  genreImg: { width: 36, height: 36, borderRadius: 8 },
  genreLabel: { color: c.text, fontSize: 13, fontWeight: '800' },

  // Genre full-screen view
  genreHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  genreBackBtn: {
    width: 38, height: 38, backgroundColor: c.surface,
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  genreHeaderCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  genreIconBadge: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  genreHeaderTitle: { fontSize: 20, fontWeight: '900' },
  genreSongList: { paddingHorizontal: 20, marginTop: 8 },
  // Genre page — big square cover cards in a 2-col grid (like the Player's Explore)
  gSectionTitle: { fontSize: 18, fontWeight: '900', paddingHorizontal: 20, marginTop: 10, marginBottom: 14 },
  gGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, justifyContent: 'space-between' },
  gCard: { width: '47%', marginBottom: 20 },
  gCardArt: { width: '100%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  gCardArtImg: { width: '100%', height: '100%' },
  gCardEmoji: { fontSize: 54 },
  gCardPlay: { position: 'absolute', bottom: 8, right: 8, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  gCardTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  gCardArtist: { color: c.textFaint, fontSize: 12, marginTop: 2 },
  // Horizontal rows (Top Artists, More <genre>)
  gHRow: { paddingHorizontal: 20, paddingBottom: 6, gap: 14 },
  gHCard: { width: 150 },
  gArtist: { width: 96, alignItems: 'center' },
  gArtistArt: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, marginBottom: 8 },
  gArtistImg: { width: '100%', height: '100%' },
  gArtistName: { color: c.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Recognition modal
  recognitionOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.96)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  recognitionClose: {
    position: 'absolute', top: 56, right: 24,
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.surface, borderRadius: 19,
  },

  pulseRing: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  pulseCore: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#222',
    alignItems: 'center', justifyContent: 'center',
  },
  recognitionLabel: { color: c.text, fontSize: 20, fontWeight: '800', marginTop: 28, textAlign: 'center' },
  recognitionSub: { color: c.textFaint, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  cancelRecognitionBtn: { marginTop: 36, paddingVertical: 12, paddingHorizontal: 32 },
  cancelRecognitionText: { color: c.textFaint, fontSize: 14, fontWeight: '600' },

  foundCard: {
    width: '100%', backgroundColor: c.surface,
    borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  foundArtBox: {
    width: 100, height: 100, borderRadius: 16,
    backgroundColor: c.elevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  foundEmoji: { fontSize: 54 },
  foundIdentifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.elevated,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginBottom: 10,
  },
  foundIdentifiedText: { color: c.textDim, fontSize: 12, fontWeight: '700' },
  foundTitle: { color: c.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  foundArtist: { color: c.textFaint, fontSize: 13, marginTop: 4, textAlign: 'center' },
  foundAlbum: { color: c.textFaint, fontSize: 12, marginTop: 4 },
  foundDate: { color: c.textFaint, fontSize: 11, marginTop: 2 },

  recognitionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.elevated, borderRadius: 28,
    paddingVertical: 13, width: '100%', marginTop: 20,
    borderWidth: 1, borderColor: c.borderStrong,
  },
  recognitionBtnText: { color: c.text, fontSize: 14, fontWeight: '800' },
  retryBtn: { paddingVertical: 12, marginTop: 4, width: '100%', alignItems: 'center' },
  retryText: { color: c.textFaint, fontSize: 13, fontWeight: '600' },

  notFoundIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },

  countdownNum: {
    color: c.text, fontSize: 44, fontWeight: '900',
    marginTop: 18, lineHeight: 50,
  },
});
