import { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  FlatList, Image, Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useArtwork, useArtistImage } from '../../services/artwork';

const GENRES = ['All', 'Afrobeats', 'Hip Hop', 'Pop', 'R&B', 'Soul', 'Gospel', 'Amapiano'];

const GENRE_COLORS = {
  All: '#888', Afrobeats: '#FF6B35', 'Hip Hop': '#9B59B6', Pop: '#E91E63',
  'R&B': '#3498DB', Soul: '#E67E22', Gospel: '#2ECC71', Amapiano: '#1ABC9C',
};

const ALL_SONGS = {
  All: [
    { id: 'all1', title: 'Last Last',   artist: 'Burna Boy',    genre: 'Afrobeats', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'all2', title: 'Essence',     artist: 'Wizkid',       genre: 'Afrobeats', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'all3', title: "God's Plan",  artist: 'Drake',        genre: 'Hip Hop',   emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'all4', title: 'Anti-Hero',   artist: 'Taylor Swift', genre: 'Pop',       emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'all5', title: 'Calm Down',   artist: 'Rema',         genre: 'Afrobeats', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'Hip Hop': [
    { id: 'h1', title: "God's Plan",   artist: 'Drake',          genre: 'Hip Hop', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'h2', title: 'Sicko Mode',   artist: 'Travis Scott',   genre: 'Hip Hop', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'h3', title: 'HUMBLE',       artist: 'Kendrick Lamar', genre: 'Hip Hop', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'h4', title: 'Rockstar',     artist: 'Post Malone',    genre: 'Hip Hop', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'h5', title: 'Nice For What', artist: 'Drake',         genre: 'Hip Hop', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Pop: [
    { id: 'p1', title: 'Anti-Hero',       artist: 'Taylor Swift', genre: 'Pop', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'p2', title: 'Shape of You',    artist: 'Ed Sheeran',   genre: 'Pop', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'p3', title: 'As It Was',       artist: 'Harry Styles', genre: 'Pop', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'p4', title: 'Blinding Lights', artist: 'The Weeknd',   genre: 'Pop', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'p5', title: 'Stay',            artist: 'Justin Bieber', genre: 'Pop', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  'R&B': [
    { id: 'r1', title: 'Die For You',  artist: 'The Weeknd',    genre: 'R&B', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'r2', title: 'Nobody',       artist: 'Tems',           genre: 'R&B', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'r3', title: 'Shirt',        artist: 'SZA',            genre: 'R&B', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'r4', title: 'Bigger',       artist: 'Beyonce',        genre: 'R&B', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'r5', title: 'Creepin',      artist: 'Metro Boomin',   genre: 'R&B', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Afrobeats: [
    { id: 'a1', title: 'Last Last',    artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'a2', title: 'Essence',      artist: 'Wizkid',    genre: 'Afrobeats', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'a3', title: 'Fall',         artist: 'Davido',    genre: 'Afrobeats', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'a4', title: 'Calm Down',    artist: 'Rema',      genre: 'Afrobeats', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'a5', title: 'Sability',     artist: 'Asake',     genre: 'Afrobeats', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Soul: [
    { id: 's1', title: 'Rolling in the Deep', artist: 'Adele',     genre: 'Soul', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 's2', title: 'Someone Like You',    artist: 'Adele',     genre: 'Soul', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 's3', title: 'Rise Up',             artist: 'Andra Day', genre: 'Soul', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 's4', title: 'All of Me',           artist: 'John Legend', genre: 'Soul', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 's5', title: 'Glory',               artist: 'John Legend', genre: 'Soul', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Gospel: [
    { id: 'g1', title: 'Way Maker',          artist: 'Sinach',             genre: 'Gospel', emoji: '🙏', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'g2', title: 'Oceans',             artist: 'Hillsong',           genre: 'Gospel', emoji: '✝️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'g3', title: 'Goodness of God',    artist: 'Bethel Music',       genre: 'Gospel', emoji: '🙌', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'g4', title: 'Jireh',              artist: 'Elevation Worship',  genre: 'Gospel', emoji: '🕊️', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'g5', title: 'What a Beautiful Name', artist: 'Hillsong',        genre: 'Gospel', emoji: '⭐', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Amapiano: [
    { id: 'am1', title: 'Adiwele',         artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎵', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'am2', title: 'Lengoma',         artist: 'DJ Maphorisa',   genre: 'Amapiano', emoji: '🎶', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'am3', title: 'Umsebenzi Wethu', artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎸', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'am4', title: 'Nkulunkulu',      artist: 'DJ Maphorisa',   genre: 'Amapiano', emoji: '🎹', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'am5', title: 'Izolo',           artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎺', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
};

const POPULAR_ARTISTS = [
  { id: 'pa1', name: 'Burna Boy',    genre: 'Afrobeats', emoji: '🎤' },
  { id: 'pa2', name: 'Drake',        genre: 'Hip Hop',   emoji: '🎤' },
  { id: 'pa3', name: 'Taylor Swift', genre: 'Pop',       emoji: '🎤' },
  { id: 'pa4', name: 'Wizkid',       genre: 'Afrobeats', emoji: '🎤' },
  { id: 'pa5', name: 'The Weeknd',   genre: 'R&B',       emoji: '🎤' },
  { id: 'pa6', name: 'Davido',       genre: 'Afrobeats', emoji: '🎤' },
];

// Artists keyed by genre — used to build the dynamic "Artists You May Like" list
const GENRE_ARTISTS = {
  Afrobeats: [
    { id: 'ga_a1', name: 'Burna Boy',  genre: 'Afrobeats', emoji: '🎤' },
    { id: 'ga_a2', name: 'Wizkid',     genre: 'Afrobeats', emoji: '🎤' },
    { id: 'ga_a3', name: 'Davido',     genre: 'Afrobeats', emoji: '🎤' },
    { id: 'ga_a4', name: 'Rema',       genre: 'Afrobeats', emoji: '🎤' },
    { id: 'ga_a5', name: 'Asake',      genre: 'Afrobeats', emoji: '🎤' },
  ],
  'Hip Hop': [
    { id: 'ga_h1', name: 'Drake',          genre: 'Hip Hop', emoji: '🎤' },
    { id: 'ga_h2', name: 'Travis Scott',   genre: 'Hip Hop', emoji: '🎤' },
    { id: 'ga_h3', name: 'Kendrick Lamar', genre: 'Hip Hop', emoji: '🎤' },
    { id: 'ga_h4', name: 'Post Malone',    genre: 'Hip Hop', emoji: '🎤' },
  ],
  Pop: [
    { id: 'ga_p1', name: 'Taylor Swift', genre: 'Pop', emoji: '🎤' },
    { id: 'ga_p2', name: 'Ed Sheeran',   genre: 'Pop', emoji: '🎤' },
    { id: 'ga_p3', name: 'Harry Styles', genre: 'Pop', emoji: '🎤' },
    { id: 'ga_p4', name: 'The Weeknd',   genre: 'Pop', emoji: '🎤' },
  ],
  'R&B': [
    { id: 'ga_r1', name: 'The Weeknd',   genre: 'R&B', emoji: '🎤' },
    { id: 'ga_r2', name: 'Tems',         genre: 'R&B', emoji: '🎤' },
    { id: 'ga_r3', name: 'SZA',          genre: 'R&B', emoji: '🎤' },
    { id: 'ga_r4', name: 'Beyonce',      genre: 'R&B', emoji: '🎤' },
  ],
  Soul: [
    { id: 'ga_s1', name: 'Adele',       genre: 'Soul', emoji: '🎤' },
    { id: 'ga_s2', name: 'Andra Day',   genre: 'Soul', emoji: '🎤' },
    { id: 'ga_s3', name: 'John Legend', genre: 'Soul', emoji: '🎤' },
  ],
  Gospel: [
    { id: 'ga_g1', name: 'Sinach',            genre: 'Gospel', emoji: '🎤' },
    { id: 'ga_g2', name: 'Hillsong',          genre: 'Gospel', emoji: '🎤' },
    { id: 'ga_g3', name: 'Bethel Music',      genre: 'Gospel', emoji: '🎤' },
    { id: 'ga_g4', name: 'Elevation Worship', genre: 'Gospel', emoji: '🎤' },
    { id: 'ga_g5', name: 'Chris Tomlin',      genre: 'Gospel', emoji: '🎤' },
  ],
  Amapiano: [
    { id: 'ga_am1', name: 'Kabza De Small', genre: 'Amapiano', emoji: '🎤' },
    { id: 'ga_am2', name: 'DJ Maphorisa',   genre: 'Amapiano', emoji: '🎤' },
    { id: 'ga_am3', name: 'DBN Gogo',       genre: 'Amapiano', emoji: '🎤' },
  ],
  Jazz: [
    { id: 'ga_j1', name: 'Miles Davis',    genre: 'Jazz', emoji: '🎤' },
    { id: 'ga_j2', name: 'Dave Brubeck',   genre: 'Jazz', emoji: '🎤' },
    { id: 'ga_j3', name: 'Frank Sinatra',  genre: 'Jazz', emoji: '🎤' },
    { id: 'ga_j4', name: 'Louis Armstrong', genre: 'Jazz', emoji: '🎤' },
  ],
  Reggae: [
    { id: 'ga_re1', name: 'Bob Marley',   genre: 'Reggae', emoji: '🎤' },
    { id: 'ga_re2', name: 'Damian Marley', genre: 'Reggae', emoji: '🎤' },
  ],
  Rock: [
    { id: 'ga_rk1', name: 'Queen',        genre: 'Rock', emoji: '🎤' },
    { id: 'ga_rk2', name: 'Eagles',       genre: 'Rock', emoji: '🎤' },
    { id: 'ga_rk3', name: 'Led Zeppelin', genre: 'Rock', emoji: '🎤' },
  ],
  Classic: [
    { id: 'ga_cl1', name: 'Beethoven',   genre: 'Classic', emoji: '🎤' },
    { id: 'ga_cl2', name: 'Vivaldi',     genre: 'Classic', emoji: '🎤' },
    { id: 'ga_cl3', name: 'Tchaikovsky', genre: 'Classic', emoji: '🎤' },
  ],
  Instrumental: [
    { id: 'ga_in1', name: 'Yiruma',        genre: 'Instrumental', emoji: '🎤' },
    { id: 'ga_in2', name: 'Einaudi',       genre: 'Instrumental', emoji: '🎤' },
    { id: 'ga_in3', name: 'Yann Tiersen', genre: 'Instrumental', emoji: '🎤' },
  ],
};

const getDailyRecommendations = () => {
  const allSongs = Object.values(ALL_SONGS).flat();
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash;
  }
  const startIndex = Math.abs(hash) % allSongs.length;
  const seen = new Set();
  const recommended = [];
  let i = 0;
  while (recommended.length < 5 && i < allSongs.length) {
    const song = allSongs[(startIndex + i) % allSongs.length];
    if (!seen.has(song.id)) {
      seen.add(song.id);
      recommended.push({ ...song, id: `daily_${song.id}` });
    }
    i++;
  }
  return recommended;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: 'sunny-outline' };
  if (h < 18) return { text: 'Good Afternoon', icon: 'partly-sunny-outline' };
  return { text: 'Good Evening', icon: 'moon-outline' };
}

function SongCard({ styles, c, item, onPress }) {
  const art = useArtwork(item);
  return (
    <TouchableOpacity style={styles.songCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.songArt}>
        {art
          ? <Image source={{ uri: art }} style={styles.songArtImg} />
          : <Text style={styles.songEmoji}>{item.emoji}</Text>}
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={14} color={c.icon} />
        </View>
      </View>
      <Text style={styles.songCardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.songCardArtist} numberOfLines={1}>{item.artist}</Text>
    </TouchableOpacity>
  );
}

function RecentCard({ styles, c, item, onPress }) {
  const art = useArtwork(item);
  return (
    <TouchableOpacity style={styles.recentCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.recentArt}>
        {art
          ? <Image source={{ uri: art }} style={styles.recentArtImg} />
          : <Text style={styles.recentEmoji}>{item.emoji}</Text>}
      </View>
      <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );
}

function ArtistChip({ styles, c, item, onPress }) {
  const photo = useArtistImage(item);
  return (
    <TouchableOpacity style={styles.artistChip} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.artistCircle}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.artistCircleImg} />
          : <Text style={styles.artistEmoji}>{item.emoji}</Text>}
      </View>
      <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.artistGenre} numberOfLines={1}>{item.genre}</Text>
    </TouchableOpacity>
  );
}

const MFY_CELL_BG = ['#111', '#181818', '#181818', '#111'];

function MadeForYouCard({ styles, c, playlist, onPress }) {
  const cover = useArtwork(playlist.songs?.[0]);
  const songEmojis = playlist.songs.slice(0, 4).map(s => s.emoji);
  const hasFour = songEmojis.length >= 4;
  return (
    <TouchableOpacity style={styles.mfyCard} onPress={() => onPress(playlist)} activeOpacity={0.75}>
      <View style={styles.mfyArt}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.mfyCoverImg} />
        ) : hasFour ? (
          <View style={styles.mfyGrid}>
            {songEmojis.map((emoji, i) => (
              <View key={i} style={[styles.mfyGridCell, { backgroundColor: MFY_CELL_BG[i] }]}>
                <Text style={styles.mfyGridEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.mfySingleEmoji}>{playlist.emoji}</Text>
        )}
        <View style={styles.mfyPlayBtn}>
          <Ionicons name="play" size={13} color={c.icon} />
        </View>
      </View>
      <Text style={styles.mfyTitle} numberOfLines={1}>{playlist.name}</Text>
      <Text style={styles.mfyDesc} numberOfLines={1}>{playlist.description}</Text>
    </TouchableOpacity>
  );
}

// Real cover art for a song inside the "Made For You" mix detail sheet.
// Module scope so useArtwork is legal inside the songs .map.
function MixSongRow({ styles, c, song, index, onPress }) {
  const art = useArtwork(song);
  return (
    <TouchableOpacity
      style={styles.mixSongRow}
      onPress={() => onPress(song, index)}
      activeOpacity={0.75}>
      <Text style={styles.mixSongIdx}>{index + 1}</Text>
      <View style={[styles.mixSongArt, { backgroundColor: (GENRE_COLORS[song.genre] || '#333') + '25' }]}>
        {art
          ? <Image source={{ uri: art }} style={styles.mixSongArtImg} resizeMode="cover" />
          : <Text style={styles.mixSongEmoji}>{song.emoji || '🎵'}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.mixSongTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.mixSongArtist} numberOfLines={1}>{song.artist} · {song.genre}</Text>
      </View>
      <Ionicons name="play-circle-outline" size={24} color={c.textFaint} />
    </TouchableOpacity>
  );
}

// The mix's hero cover — the first song's real artwork (falls back to the emoji).
function MixHeaderArt({ styles, song, emoji, color }) {
  const art = useArtwork(song);
  return (
    <View style={[styles.mixHeadArt, { backgroundColor: color + '25' }]}>
      {art
        ? <Image source={{ uri: art }} style={styles.mixHeadArtImg} resizeMode="cover" />
        : <Text style={styles.mixHeadEmoji}>{emoji || '🎵'}</Text>}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const {
    isPremium, favouriteArtists, profileImage,
    notifications, markAllNotificationsRead, unreadCount,
    recentlyPlayed, loadAndPlay,
    listeningHabits, getTopGenres, getTopArtists,
  } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);

  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [detailMix, setDetailMix] = useState(null); // tapped "Made For You" mix

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const { text: greetingText, icon: greetingIcon } = getGreeting();

  const topGenres = getTopGenres(3);
  const topGenre = topGenres.find(g => ALL_SONGS[g]) || null;
  const hasListeningData = Object.keys(listeningHabits.genres).length > 0;

  // Genre chips — most-listened genres float to the front
  const adaptiveGenres = useMemo(() => {
    if (!hasListeningData || topGenres.length === 0) return GENRES;
    const topInList = topGenres.filter(g => GENRES.includes(g) && g !== 'All');
    const rest = GENRES.filter(g => g !== 'All' && !topInList.includes(g));
    return ['All', ...topInList, ...rest];
  }, [hasListeningData, listeningHabits]);

  // Trending songs — personalized mix from top genres when "All" selected
  const trendingSongs = useMemo(() => {
    if (selectedGenre !== 'All' || !hasListeningData || topGenres.length === 0) {
      return ALL_SONGS[selectedGenre] || ALL_SONGS['All'];
    }
    const seen = new Set();
    const mixed = [];
    topGenres.forEach(genre => {
      (ALL_SONGS[genre] || []).slice(0, 2).forEach(s => {
        if (!seen.has(s.id) && mixed.length < 5) {
          seen.add(s.id);
          mixed.push({ ...s, id: `trend_${s.id}` });
        }
      });
    });
    return mixed.length >= 3 ? mixed : (ALL_SONGS['All'] || []);
  }, [selectedGenre, hasListeningData, listeningHabits]);

  const trendingTitle = selectedGenre !== 'All'
    ? selectedGenre
    : hasListeningData && topGenre
      ? 'Your Top Picks'
      : 'Trending Now';

  const personalRecs = topGenre && ALL_SONGS[topGenre]
    ? ALL_SONGS[topGenre].map(s => ({ ...s, id: `rec_${s.id}` }))
    : getDailyRecommendations();

  const secondGenre = topGenres.find((g, i) => i > 0 && ALL_SONGS[g]) || 'Amapiano';
  const newForYou = (ALL_SONGS[secondGenre] || ALL_SONGS['Amapiano'])
    .map(s => ({ ...s, id: `nfy_${s.id}` }));

  // Popular artists — built from top genres, falls back to curated list
  const popularArtists = useMemo(() => {
    if (!hasListeningData || topGenres.length === 0) return POPULAR_ARTISTS;
    const seen = new Set();
    const list = [];
    topGenres.forEach(genre => {
      (GENRE_ARTISTS[genre] || []).forEach(a => {
        if (!seen.has(a.name) && list.length < 6) {
          seen.add(a.name);
          list.push(a);
        }
      });
    });
    return list.length >= 3 ? list : POPULAR_ARTISTS;
  }, [hasListeningData, listeningHabits]);

  // Made For You — fully adaptive: top genres, fav artists, variety discovery, time-of-day
  const madeForYouPlaylists = useMemo(() => {
    const hour = new Date().getHours();
    const playlists = [];

    // Whole catalog minus the "All" sampler, which duplicates genre entries
    const catalog = Object.entries(ALL_SONGS)
      .filter(([key]) => key !== 'All')
      .flatMap(([, songs]) => songs);

    const songPlays = listeningHabits.songs || {};
    const totalPlays = Object.values(songPlays).reduce((a, b) => a + b, 0);
    const playedGenres = Object.keys(listeningHabits.genres || {});
    const topArtists = getTopArtists(3);

    // What we build everything from: the genres they actually play. Before there
    // is any history, fall back to the genres of the artists they chose at
    // onboarding — still their taste, never a hardcoded guess.
    const onboardingGenres = [...new Set(
      favouriteArtists.map(a => a.genre).filter(g => ALL_SONGS[g])
    )];
    const tasteGenres = hasListeningData
      ? topGenres.filter(g => ALL_SONGS[g])
      : onboardingGenres;

    // 1. Most-played genre
    const g1 = tasteGenres[0];
    if (g1) {
      playlists.push({
        id: 'mfy_top',
        name: `${g1} Mix`,
        description: hasListeningData ? 'Your most played genre' : 'From the artists you picked',
        songs: ALL_SONGS[g1].map(s => ({ ...s, id: `mfy_top_${s.id}` })),
        emoji: '🎵',
      });
    }

    // 2. Second most-played genre
    const g2 = tasteGenres[1];
    if (g2) {
      playlists.push({
        id: 'mfy_second',
        name: `${g2} Vibes`,
        description: hasListeningData ? 'Another genre you love' : 'More of your taste',
        songs: ALL_SONGS[g2].map(s => ({ ...s, id: `mfy_sec_${s.id}` })),
        emoji: '🎶',
      });
    }

    // 3. Artist radio — the artist they play most (not just an onboarding pick).
    // Leads with that artist, then branches to similar artists in their genre.
    const radioArtist = topArtists[0] || favouriteArtists[0]?.name;
    if (radioArtist) {
      const theirs = catalog.filter(s => s.artist === radioArtist);
      const artistGenre = theirs[0]?.genre
        || favouriteArtists.find(a => a.name === radioArtist)?.genre;
      const similar = (ALL_SONGS[artistGenre] || ALL_SONGS['All'] || [])
        .filter(s => s.artist !== radioArtist);

      const seen = new Set();
      const radioSongs = [...theirs, ...similar].filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });

      if (radioSongs.length > 0) {
        playlists.push({
          id: 'mfy_artist',
          name: `${radioArtist} Radio`,
          description: topArtists[0]
            ? 'Your most played artist'
            : `Because you like ${radioArtist}`,
          songs: radioSongs.map(s => ({ ...s, id: `mfy_art_${s.id}` })),
          emoji: '🎤',
        });
      }
    }

    // 4. On Repeat — the songs they actually replay the most
    const playedById = {};
    recentlyPlayed.forEach(s => { playedById[s.id] = s; });
    const repeatSongs = Object.entries(songPlays)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => playedById[id])
      .filter(Boolean)
      .slice(0, 8);
    if (repeatSongs.length >= 2) {
      playlists.push({
        id: 'mfy_repeat',
        name: 'On Repeat',
        description: 'The songs you keep coming back to',
        songs: repeatSongs.map(s => ({ ...s, id: `mfy_rep_${s.id}` })),
        emoji: '🔁',
      });
    }

    // 5. Time-of-day mix — built from their own taste, not a fixed genre
    const isNight = hour >= 21 || hour < 6;
    const isMorning = hour >= 6 && hour < 12;
    const todGenre = tasteGenres[0];
    const todSongs = (todGenre && ALL_SONGS[todGenre]) || getDailyRecommendations();
    playlists.push(isNight ? {
      id: 'mfy_night',
      name: 'Late Night Mix',
      description: todGenre ? `Your ${todGenre} to wind down` : 'Wind down',
      songs: todSongs.slice(0, 5).map(s => ({ ...s, id: `mfy_night_${s.id}` })),
      emoji: '🌙',
    } : isMorning ? {
      id: 'mfy_morning',
      name: 'Morning Energy',
      description: todGenre ? `Your ${todGenre} to start the day` : 'Start your day right',
      songs: todSongs.slice(0, 5).map(s => ({ ...s, id: `mfy_morn_${s.id}` })),
      emoji: '☀️',
    } : {
      id: 'mfy_daily',
      name: 'Daily Mix',
      description: todGenre ? `Fresh ${todGenre} picks` : 'Fresh picks for today',
      songs: todSongs.slice(0, 5).map(s => ({ ...s, id: `mfy_daily_${s.id}` })),
      emoji: '📅',
    });

    // 6. Discovery — a genre they have never played. The pick rotates as they
    // listen more, so the suggestion keeps moving instead of going stale.
    const unexplored = GENRES.filter(g => g !== 'All' && !playedGenres.includes(g) && ALL_SONGS[g]);
    if (unexplored.length > 0) {
      const pick = unexplored[totalPlays % unexplored.length];
      playlists.push({
        id: 'mfy_discover',
        name: `Discover ${pick}`,
        description: hasListeningData ? "A genre you haven't played yet" : 'Something new for you',
        songs: ALL_SONGS[pick].map(s => ({ ...s, id: `mfy_disc_${s.id}` })),
        emoji: '🌟',
      });
    }

    return playlists;
  }, [hasListeningData, listeningHabits, favouriteArtists, recentlyPlayed]);

  const openPlayer = (song, queue, index = 0) => {
    loadAndPlay(song, queue, index);
    navigation.navigate('Player', { song });
  };

  // Tapping a mix opens its song list (only that mix's songs) rather than
  // jumping straight into the player.
  const openPlaylist = (playlist) => {
    if (playlist?.songs?.length > 0) setDetailMix(playlist);
  };

  const playFromMix = (song, index) => {
    const songs = detailMix.songs;
    setDetailMix(null);
    openPlayer(song, songs, index);
  };

  const playMixAll = () => {
    const songs = detailMix.songs;
    setDetailMix(null);
    openPlayer(songs[0], songs, 0);
  };

  return (
    <View style={styles.container}>
      {/* Sticky header */}
      <View style={styles.stickyHeader}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <View style={styles.greetingRow}>
              <Ionicons name={greetingIcon} size={15} color={c.textFaint} />
              <Text style={styles.greeting}>{greetingText}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Premium')} activeOpacity={0.8}>
              <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
                <Ionicons
                  name={isPremium ? 'diamond' : 'musical-note-outline'}
                  size={11}
                  color={isPremium ? c.accentText : c.textFaint}
                />
                <Text style={[styles.planText, isPremium && styles.planTextPremium]}>
                  {isPremium ? 'Premium' : 'Free Plan'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => { setShowNotifications(true); markAllNotificationsRead(); }}>
              <Ionicons name="notifications-outline" size={22} color={c.textDim} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
              {profileImage
                ? <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                : <Ionicons name="person" size={20} color={c.textDim} />}
              {isPremium && <View style={styles.premiumDot} />}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Genre chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={adaptiveGenres}
          keyExtractor={g => g}
          style={styles.genreList}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const active = selectedGenre === item;
            return (
              <TouchableOpacity
                style={[styles.genreChip, active && styles.genreChipActive]}
                onPress={() => setSelectedGenre(item)}
                activeOpacity={0.75}>
                <Text style={[styles.genreChipText, active && styles.genreChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Scrollable content */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Trending / Genre songs — adaptive */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{trendingTitle}</Text>
              {selectedGenre === 'All' && hasListeningData && topGenre && (
                <Text style={styles.sectionSubtitle}>
                  From your top {topGenres.filter(g => ALL_SONGS[g]).slice(0, 2).join(' & ')}
                </Text>
              )}
            </View>
            <View style={styles.sectionDot} />
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={trendingSongs}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            renderItem={({ item, index }) => (
              <SongCard styles={styles} c={c}
                item={item}
                onPress={() => openPlayer(item, trendingSongs, index)}
              />
            )}
          />
        </View>

        {/* Made For You — fully adaptive */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Made For You</Text>
              <Text style={styles.sectionSubtitle}>
                {hasListeningData
                  ? `${madeForYouPlaylists.length} playlists built around your taste`
                  : favouriteArtists.length > 0
                    ? 'From the artists you picked — play more to refine'
                    : 'Play songs to personalise your mixes'}
              </Text>
            </View>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={madeForYouPlaylists}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            renderItem={({ item }) => (
              <MadeForYouCard styles={styles} c={c} playlist={item} onPress={openPlaylist} />
            )}
          />
        </View>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <Ionicons name="time-outline" size={14} color={c.textFaint} />
            </View>
            <View style={styles.recentGrid}>
              {recentlyPlayed.slice(0, 5).map((item, index) => (
                <RecentCard styles={styles} c={c}
                  key={`recent_${item.id}_${index}`}
                  item={item}
                  onPress={() => openPlayer(item, recentlyPlayed.slice(0, 5), index)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Your Artists */}
        {favouriteArtists.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Artists</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={favouriteArtists}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8, gap: 16 }}
              renderItem={({ item }) => (
                <ArtistChip styles={styles} c={c}
                  item={item}
                  onPress={() => navigation.navigate('Artist', { artist: item })}
                />
              )}
            />
          </View>
        )}

        {/* Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {hasListeningData && topGenre ? `More ${topGenre}` : 'Recommended For You'}
            </Text>
            {hasListeningData && topGenre ? (
              <View style={styles.labelPill}>
                <Text style={styles.labelPillText}>YOUR TOP</Text>
              </View>
            ) : (
              <View style={styles.labelPill}>
                <Text style={styles.labelPillText}>DAILY</Text>
              </View>
            )}
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={personalRecs}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            renderItem={({ item, index }) => (
              <SongCard styles={styles} c={c}
                item={item}
                onPress={() => openPlayer(item, personalRecs, index)}
              />
            )}
          />
        </View>

        {/* New Releases */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {hasListeningData && topGenres[1] ? `Explore ${secondGenre}` : 'New Releases'}
            </Text>
            <View style={styles.labelPill}>
              <Text style={styles.labelPillText}>NEW</Text>
            </View>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={newForYou}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            renderItem={({ item, index }) => (
              <SongCard styles={styles} c={c}
                item={item}
                onPress={() => openPlayer(item, newForYou, index)}
              />
            )}
          />
        </View>

        {/* Popular Artists — adapts to user's top genres */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {hasListeningData ? 'Artists You May Like' : 'Popular Artists'}
              </Text>
              {hasListeningData && topGenres.length > 0 && (
                <Text style={styles.sectionSubtitle}>
                  Based on your {topGenres.slice(0, 2).join(' & ')} listening
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>Explore</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={popularArtists}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8, gap: 16 }}
            renderItem={({ item }) => (
              <ArtistChip styles={styles} c={c}
                item={item}
                onPress={() => navigation.navigate('Artist', { artist: item })}
              />
            )}
          />
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Made For You — mix detail (only this mix's songs) */}
      <Modal visible={!!detailMix} transparent animationType="slide" onRequestClose={() => setDetailMix(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '85%' }]}>
            <View style={styles.sheetHandle} />

            {detailMix && (
              <>
                <View style={styles.mixHead}>
                  <MixHeaderArt styles={styles} song={detailMix.songs[0]} emoji={detailMix.emoji}
                    color={GENRE_COLORS[detailMix.songs[0]?.genre] || '#888'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mixHeadName} numberOfLines={1}>{detailMix.name}</Text>
                    <Text style={styles.mixHeadSub}>{detailMix.description}</Text>
                    <Text style={styles.mixHeadCount}>
                      {detailMix.songs.length} {detailMix.songs.length === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailMix(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={22} color={c.textFaint} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.mixPlayAll} onPress={playMixAll} activeOpacity={0.85}>
                  <Ionicons name="play" size={16} color={c.accentText} />
                  <Text style={styles.mixPlayAllText}>Play All</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {detailMix.songs.map((song, index) => (
                    <MixSongRow styles={styles} c={c}
                      key={`${song.id}_${index}`}
                      song={song}
                      index={index}
                      onPress={playFromMix}
                    />
                  ))}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Notifications modal */}
      <Modal visible={showNotifications} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={c.textFaint} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.map(n => (
                <View
                  key={n.id}
                  style={[styles.notifItem, !n.read && styles.notifUnread]}>
                  <View style={styles.notifIcon}>
                    <Ionicons name="musical-notes" size={18} color={c.textDim} />
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  stickyHeader: { backgroundColor: c.bg, paddingTop: 56, zIndex: 10 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  greeting: { fontSize: 13, color: c.textFaint },

  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    alignSelf: 'flex-start',
  },
  planBadgePremium: { backgroundColor: c.accent, borderColor: c.accent },
  planText: { color: c.textFaint, fontSize: 12, fontWeight: '700' },
  planTextPremium: { color: c.accentText },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    backgroundColor: c.surface,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    backgroundColor: '#333',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.bg,
    paddingHorizontal: 3,
  },
  badgeText: { color: c.text, fontSize: 9, fontWeight: '800' },

  avatar: {
    width: 42,
    height: 42,
    backgroundColor: c.elevated,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  premiumDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: c.accent,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.bg,
  },

  genreList: { marginBottom: 14 },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#222',
  },
  genreChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  genreChipText: { color: c.textFaint, fontSize: 13, fontWeight: '700' },
  genreChipTextActive: { color: c.accentText },

  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: c.text },
  sectionSubtitle: { fontSize: 12, color: c.textFaint, marginTop: 2 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  seeAll: { color: c.textDim, fontSize: 13, fontWeight: '600' },

  labelPill: {
    backgroundColor: c.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  labelPillText: { color: c.textFaint, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  songCard: { width: 140, marginRight: 12 },
  songArt: {
    width: 140,
    height: 140,
    borderRadius: 14,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  songArtImg: { ...StyleSheet.absoluteFillObject, width: 140, height: 140 },
  songEmoji: { fontSize: 52 },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songCardTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  songCardArtist: { color: c.textFaint, fontSize: 11, marginTop: 2 },

  recentGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  recentCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentArt: {
    width: 54,
    height: 54,
    backgroundColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recentArtImg: { width: '100%', height: '100%' },
  recentEmoji: { fontSize: 24 },
  recentTitle: { color: c.text, fontSize: 12, fontWeight: '700', flex: 1, paddingHorizontal: 10 },

  artistChip: { alignItems: 'center', width: 82 },
  artistCircle: {
    width: 76,
    height: 76,
    backgroundColor: c.surface,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  artistCircleImg: { width: '100%', height: '100%' },
  artistEmoji: { fontSize: 34 },
  artistName: { color: c.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  artistGenre: { color: c.textFaint, fontSize: 10, textAlign: 'center', marginTop: 2 },

  // Made For You — mix detail sheet
  mixHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  mixHeadArt: {
    width: 64, height: 64, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  mixHeadArtImg: { width: '100%', height: '100%' },
  mixHeadEmoji: { fontSize: 30 },
  mixHeadName: { color: c.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  mixHeadSub: { color: c.textDim, fontSize: 12, fontWeight: '600', marginTop: 3 },
  mixHeadCount: { color: c.textFaint, fontSize: 11, fontWeight: '700', marginTop: 4 },
  mixPlayAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.accent, paddingVertical: 13, borderRadius: 12, marginBottom: 10,
  },
  mixPlayAllText: { color: c.accentText, fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  mixSongRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  mixSongIdx: { color: c.textFaint, fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  mixSongArt: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  mixSongArtImg: { width: '100%', height: '100%' },
  mixSongEmoji: { fontSize: 22 },
  mixSongTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
  mixSongArtist: { color: c.textFaint, fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Made For You card
  mfyCard: { width: 150, marginRight: 12 },
  mfyArt: {
    width: 150,
    height: 150,
    borderRadius: 14,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  mfyCoverImg: { ...StyleSheet.absoluteFillObject, width: 150, height: 150 },
  mfyGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mfyGridCell: {
    width: '50%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfyGridEmoji: { fontSize: 28 },
  mfySingleEmoji: { fontSize: 62 },
  mfyPlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfyTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  mfyDesc: { color: c.textFaint, fontSize: 11, marginTop: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '70%',
  },
  sheetHandle: { width: 36, height: 3, backgroundColor: '#222', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: c.text },

  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: c.elevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  notifUnread: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong },
  notifIcon: {
    width: 38,
    height: 38,
    backgroundColor: '#222',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: { flex: 1 },
  notifTitle: { color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 3 },
  notifMsg: { color: c.textFaint, fontSize: 12, lineHeight: 17 },
  notifTime: { color: c.textFaint, fontSize: 10, marginTop: 4 },
  unreadDot: { width: 7, height: 7, backgroundColor: '#555', borderRadius: 4, marginTop: 4 },
});
