import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

// ─── Catalog (per-screen static data, per project convention) ────────────────
const AU = n => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

const GENRE_COLORS = {
  Afrobeats: '#FF6B35', Amapiano: '#1ABC9C', Pop: '#E91E63', 'Hip Hop': '#9B59B6',
  'R&B': '#3498DB', Soul: '#E67E22', Gospel: '#2ECC71', Reggae: '#27AE60',
  Jazz: '#16A085', Rock: '#C0392B', Country: '#D35400', Instrumental: '#607D8B',
};

const GENRE_SONGS = {
  Afrobeats: [
    { id: 'afr1', title: 'Last Last', artist: 'Burna Boy', genre: 'Afrobeats', emoji: '🔥', audioUrl: AU(1) },
    { id: 'afr2', title: 'Essence', artist: 'Wizkid', genre: 'Afrobeats', emoji: '🎵', audioUrl: AU(2) },
    { id: 'afr3', title: 'Fall', artist: 'Davido', genre: 'Afrobeats', emoji: '🎶', audioUrl: AU(3) },
    { id: 'afr4', title: 'Calm Down', artist: 'Rema', genre: 'Afrobeats', emoji: '🌙', audioUrl: AU(4) },
    { id: 'afr5', title: 'Sability', artist: 'Asake', genre: 'Afrobeats', emoji: '⚡', audioUrl: AU(5) },
  ],
  Amapiano: [
    { id: 'ama1', title: 'Adiwele', artist: 'Kabza De Small', genre: 'Amapiano', emoji: '🎹', audioUrl: AU(2) },
    { id: 'ama2', title: 'Lengoma', artist: 'DJ Maphorisa', genre: 'Amapiano', emoji: '🎶', audioUrl: AU(3) },
    { id: 'ama3', title: 'Umsebenzi Wethu', artist: 'Busta 929', genre: 'Amapiano', emoji: '🔊', audioUrl: AU(4) },
    { id: 'ama4', title: 'Nkulunkulu', artist: 'DJ Maphorisa', genre: 'Amapiano', emoji: '🎵', audioUrl: AU(5) },
    { id: 'ama5', title: 'Izolo', artist: 'Kabza De Small', genre: 'Amapiano', emoji: '💫', audioUrl: AU(6) },
  ],
  Pop: [
    { id: 'pop1', title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop', emoji: '🦸', audioUrl: AU(1) },
    { id: 'pop2', title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', emoji: '🎵', audioUrl: AU(2) },
    { id: 'pop3', title: 'As It Was', artist: 'Harry Styles', genre: 'Pop', emoji: '🌊', audioUrl: AU(3) },
    { id: 'pop4', title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', emoji: '💡', audioUrl: AU(4) },
    { id: 'pop5', title: 'Stay', artist: 'Justin Bieber', genre: 'Pop', emoji: '🎶', audioUrl: AU(5) },
  ],
  'Hip Hop': [
    { id: 'hip1', title: "God's Plan", artist: 'Drake', genre: 'Hip Hop', emoji: '🙏', audioUrl: AU(1) },
    { id: 'hip2', title: 'Sicko Mode', artist: 'Travis Scott', genre: 'Hip Hop', emoji: '🌀', audioUrl: AU(2) },
    { id: 'hip3', title: 'HUMBLE', artist: 'Kendrick Lamar', genre: 'Hip Hop', emoji: '👑', audioUrl: AU(3) },
    { id: 'hip4', title: 'Rockstar', artist: 'Post Malone', genre: 'Hip Hop', emoji: '🎸', audioUrl: AU(4) },
    { id: 'hip5', title: 'Nonstop', artist: 'Drake', genre: 'Hip Hop', emoji: '⚡', audioUrl: AU(5) },
  ],
  'R&B': [
    { id: 'rnb1', title: 'Adorn', artist: 'Miguel', genre: 'R&B', emoji: '❤️', audioUrl: AU(2) },
    { id: 'rnb2', title: 'Best Part', artist: 'Daniel Caesar', genre: 'R&B', emoji: '💜', audioUrl: AU(3) },
    { id: 'rnb3', title: 'Boo\'d Up', artist: 'Ella Mai', genre: 'R&B', emoji: '💞', audioUrl: AU(4) },
    { id: 'rnb4', title: 'Earned It', artist: 'The Weeknd', genre: 'R&B', emoji: '🖤', audioUrl: AU(5) },
    { id: 'rnb5', title: 'Come Through', artist: 'Miguel', genre: 'R&B', emoji: '🌹', audioUrl: AU(6) },
  ],
  Soul: [
    { id: 'sol1', title: "Ain't No Sunshine", artist: 'Bill Withers', genre: 'Soul', emoji: '🌧️', audioUrl: AU(1) },
    { id: 'sol2', title: 'I Say a Little Prayer', artist: 'Aretha Franklin', genre: 'Soul', emoji: '🙏', audioUrl: AU(2) },
    { id: 'sol3', title: "Let's Stay Together", artist: 'Al Green', genre: 'Soul', emoji: '❤️', audioUrl: AU(3) },
    { id: 'sol4', title: 'Superstition', artist: 'Stevie Wonder', genre: 'Soul', emoji: '✨', audioUrl: AU(4) },
    { id: 'sol5', title: 'Dock of the Bay', artist: 'Otis Redding', genre: 'Soul', emoji: '🌊', audioUrl: AU(5) },
  ],
  Gospel: [
    { id: 'gos1', title: 'Way Maker', artist: 'Sinach', genre: 'Gospel', emoji: '🙏', audioUrl: AU(1) },
    { id: 'gos2', title: 'Oceans', artist: 'Hillsong', genre: 'Gospel', emoji: '🕊️', audioUrl: AU(2) },
    { id: 'gos3', title: 'Goodness of God', artist: 'Bethel Music', genre: 'Gospel', emoji: '🙌', audioUrl: AU(3) },
    { id: 'gos4', title: 'Jireh', artist: 'Elevation Worship', genre: 'Gospel', emoji: '⭐', audioUrl: AU(4) },
    { id: 'gos5', title: 'Beautiful Name', artist: 'Hillsong', genre: 'Gospel', emoji: '✝️', audioUrl: AU(5) },
  ],
  Reggae: [
    { id: 'reg1', title: 'No Woman No Cry', artist: 'Bob Marley', genre: 'Reggae', emoji: '🌿', audioUrl: AU(1) },
    { id: 'reg2', title: 'One Love', artist: 'Bob Marley', genre: 'Reggae', emoji: '☮️', audioUrl: AU(2) },
    { id: 'reg3', title: 'Redemption Song', artist: 'Bob Marley', genre: 'Reggae', emoji: '🎵', audioUrl: AU(3) },
    { id: 'reg4', title: 'Three Little Birds', artist: 'Bob Marley', genre: 'Reggae', emoji: '🐦', audioUrl: AU(4) },
    { id: 'reg5', title: 'Is This Love', artist: 'Bob Marley', genre: 'Reggae', emoji: '❤️', audioUrl: AU(5) },
  ],
  Jazz: [
    { id: 'jaz1', title: 'Take Five', artist: 'Dave Brubeck', genre: 'Jazz', emoji: '🎷', audioUrl: AU(1) },
    { id: 'jaz2', title: 'So What', artist: 'Miles Davis', genre: 'Jazz', emoji: '🎺', audioUrl: AU(2) },
    { id: 'jaz3', title: 'Autumn Leaves', artist: 'Bill Evans', genre: 'Jazz', emoji: '🍂', audioUrl: AU(3) },
    { id: 'jaz4', title: 'Fly Me to the Moon', artist: 'Frank Sinatra', genre: 'Jazz', emoji: '🌙', audioUrl: AU(4) },
    { id: 'jaz5', title: 'Wonderful World', artist: 'Louis Armstrong', genre: 'Jazz', emoji: '🌍', audioUrl: AU(5) },
  ],
  Rock: [
    { id: 'roc1', title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock', emoji: '🎸', audioUrl: AU(1) },
    { id: 'roc2', title: 'Hotel California', artist: 'Eagles', genre: 'Rock', emoji: '🏨', audioUrl: AU(2) },
    { id: 'roc3', title: "Sweet Child O' Mine", artist: "Guns N' Roses", genre: 'Rock', emoji: '⚡', audioUrl: AU(3) },
    { id: 'roc4', title: 'Back in Black', artist: 'AC/DC', genre: 'Rock', emoji: '🖤', audioUrl: AU(4) },
    { id: 'roc5', title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: 'Rock', emoji: '🎶', audioUrl: AU(5) },
  ],
  Country: [
    { id: 'cou1', title: 'Jolene', artist: 'Dolly Parton', genre: 'Country', emoji: '🤠', audioUrl: AU(1) },
    { id: 'cou2', title: 'Country Roads', artist: 'John Denver', genre: 'Country', emoji: '🌄', audioUrl: AU(2) },
    { id: 'cou3', title: 'Tennessee Whiskey', artist: 'Chris Stapleton', genre: 'Country', emoji: '🥃', audioUrl: AU(3) },
    { id: 'cou4', title: 'Ring of Fire', artist: 'Johnny Cash', genre: 'Country', emoji: '🔥', audioUrl: AU(4) },
    { id: 'cou5', title: 'Wagon Wheel', artist: 'Darius Rucker', genre: 'Country', emoji: '🎵', audioUrl: AU(5) },
  ],
  Instrumental: [
    { id: 'ins1', title: 'Clair de Lune', artist: 'Debussy', genre: 'Instrumental', emoji: '🌙', audioUrl: AU(1) },
    { id: 'ins2', title: 'River Flows in You', artist: 'Yiruma', genre: 'Instrumental', emoji: '🌊', audioUrl: AU(2) },
    { id: 'ins3', title: 'Experience', artist: 'Einaudi', genre: 'Instrumental', emoji: '🎹', audioUrl: AU(3) },
    { id: 'ins4', title: 'Nuvole Bianche', artist: 'Einaudi', genre: 'Instrumental', emoji: '☁️', audioUrl: AU(4) },
    { id: 'ins5', title: 'Comptine', artist: 'Yann Tiersen', genre: 'Instrumental', emoji: '🎼', audioUrl: AU(5) },
  ],
};

const GENRES = Object.keys(GENRE_SONGS);

// Each mood is anchored to a few fitting genres so results feel on-theme.
const MOODS = [
  { key: 'Heartbreak', emoji: '💔', genres: ['Soul', 'R&B', 'Gospel', 'Pop'] },
  { key: 'Romance', emoji: '❤️', genres: ['R&B', 'Soul', 'Afrobeats', 'Pop'] },
  { key: 'Party', emoji: '🎉', genres: ['Amapiano', 'Afrobeats', 'Hip Hop', 'Pop'] },
  { key: 'Chill', emoji: '😌', genres: ['Jazz', 'Instrumental', 'Soul', 'R&B'] },
  { key: 'Happy', emoji: '😄', genres: ['Pop', 'Afrobeats', 'Reggae', 'Amapiano'] },
  { key: 'Sad', emoji: '😢', genres: ['Soul', 'Instrumental', 'Gospel', 'Jazz'] },
  { key: 'Workout', emoji: '💪', genres: ['Hip Hop', 'Amapiano', 'Rock', 'Afrobeats'] },
  { key: 'Focus', emoji: '🎯', genres: ['Instrumental', 'Jazz', 'Country'] },
  { key: 'Worship', emoji: '🙏', genres: ['Gospel', 'Soul'] },
  { key: 'Throwback', emoji: '📼', genres: ['Country', 'Rock', 'Soul', 'Reggae'] },
];

const MOOD_EMOJI = { Heartbreak: '💔', Romance: '❤️', Party: '🎉', Chill: '😌', Happy: '😄', Sad: '😢', Workout: '💪', Focus: '🎯', Worship: '🙏', Throwback: '📼' };

// Build a playlist: anchor on the chosen genre, then fill from mood-related genres.
const buildPlaylist = (moodKey, genre) => {
  const cfg = MOODS.find(m => m.key === moodKey);
  const order = [genre, ...((cfg?.genres || []).filter(g => g !== genre))];
  const seen = new Set();
  const out = [];
  order.forEach(g => {
    (GENRE_SONGS[g] || []).forEach(s => {
      if (!seen.has(s.id)) { seen.add(s.id); out.push(s); }
    });
  });
  return out.slice(0, 15);
};

const CYCLE = [
  'Reading the mood…',
  'Matching the vibe…',
  'Picking related tracks…',
  'Sequencing the flow…',
  'Finishing your playlist…',
];

// ─── Module-scope chips (keyboard-bug rule) ──────────────────────────────────
function MoodChip({ mood, selected, onPress }) {
  return (
    <TouchableOpacity style={[styles.moodChip, selected && styles.moodChipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
      <Text style={[styles.moodChipText, selected && styles.moodChipTextActive]}>{mood.key}</Text>
    </TouchableOpacity>
  );
}

function GenreChip({ genre, selected, onPress }) {
  return (
    <TouchableOpacity style={[styles.genreChip, selected && styles.genreChipActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.genreChipText, selected && styles.genreChipTextActive]}>{genre}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AIPlaylistScreen({ navigation }) {
  const { loadAndPlay, createGeneratedPlaylist } = useUser();

  const [step, setStep] = useState('form'); // form | generating | result
  const [selectedMood, setSelectedMood] = useState(null);
  const [customMood, setCustomMood] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);

  const [result, setResult] = useState(null); // { name, mood, genre, songs }
  const [savedMsg, setSavedMsg] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);

  const pulse = useRef(new Animated.Value(1)).current;
  const genTimer = useRef(null);

  const effectiveMood = (customMood.trim() || selectedMood || '').trim();
  const canGenerate = !!effectiveMood && !!genre;

  useEffect(() => () => { if (genTimer.current) clearTimeout(genTimer.current); }, []);

  // Generating animation + message cycle + build
  useEffect(() => {
    if (step !== 'generating') return;
    setMsgIdx(0);
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % CYCLE.length), 700);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();

    genTimer.current = setTimeout(() => {
      const songs = buildPlaylist(selectedMood, genre);
      const moodLabel = customMood.trim() || selectedMood || 'Vibes';
      setResult({
        name: `${moodLabel} · ${genre}`,
        mood: moodLabel,
        genre,
        songs,
      });
      setStep('result');
    }, 2600);

    return () => { clearInterval(iv); loop.stop(); if (genTimer.current) clearTimeout(genTimer.current); };
  }, [step]);

  const handleGenerate = () => {
    if (!canGenerate) {
      Alert.alert('Almost there', 'Pick a mood and a genre first.');
      return;
    }
    setSavedMsg('');
    setStep('generating');
  };

  const playAll = () => {
    if (!result?.songs?.length) return;
    loadAndPlay(result.songs[0], result.songs, 0);
    navigation.navigate('Player', { song: result.songs[0] });
  };

  const playOne = (song, index) => {
    loadAndPlay(song, result.songs, index);
    navigation.navigate('Player', { song });
  };

  const savePlaylist = () => {
    if (!result?.songs?.length) return;
    const pl = createGeneratedPlaylist(result.name, MOOD_EMOJI[result.mood] || '✨', result.songs);
    setSavedMsg(`Saved "${pl.name}" to your library`);
  };

  const startOver = () => {
    setStep('form');
    setResult(null);
    setSavedMsg('');
  };

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Playlist Generator</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Tell us the vibe — we'll build a playlist of related songs.</Text>

          <Text style={styles.fieldLabel}>1 · Pick a mood</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(m => (
              <MoodChip
                key={m.key}
                mood={m}
                selected={selectedMood === m.key && !customMood.trim()}
                onPress={() => { setSelectedMood(m.key); setCustomMood(''); }}
              />
            ))}
          </View>

          <Text style={styles.orText}>or describe your own</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. late-night drive, sunday morning…"
            placeholderTextColor="#333"
            value={customMood}
            onChangeText={(t) => { setCustomMood(t); if (t.trim()) setSelectedMood(null); }}
            maxLength={40}
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>2 · Pick a genre</Text>
          <View style={styles.genreGrid}>
            {GENRES.map(g => (
              <GenreChip key={g} genre={g} selected={genre === g} onPress={() => setGenre(g)} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color={canGenerate ? '#000' : '#444'} />
            <Text style={[styles.generateBtnText, !canGenerate && styles.generateBtnTextDisabled]}>Generate Playlist</Text>
          </TouchableOpacity>

          <Text style={styles.footNote}>
            {effectiveMood ? `Building a ${effectiveMood} · ${genre} playlist` : 'Choose a mood and a genre to begin'}
          </Text>
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  // ── GENERATING ──────────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Animated.View style={[styles.genOrb, { transform: [{ scale: pulse }] }]}>
          <Ionicons name="sparkles" size={40} color="#fff" />
        </Animated.View>
        <Text style={styles.genTitle}>Generating your playlist</Text>
        <Text style={styles.genSub}>{(customMood.trim() || selectedMood)} · {genre}</Text>
        <Text style={styles.genMsg}>{CYCLE[msgIdx]}</Text>
      </View>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  const accent = GENRE_COLORS[result.genre] || '#1DB954';
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Playlist</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View style={styles.resultHero}>
          <View style={[styles.resultArt, { backgroundColor: accent + '22' }]}>
            <Text style={styles.resultArtEmoji}>{MOOD_EMOJI[result.mood] || '✨'}</Text>
          </View>
          <Text style={styles.resultName} numberOfLines={2}>{result.name}</Text>
          <Text style={styles.resultCount}>{result.songs.length} songs · AI-generated</Text>
        </View>

        {savedMsg ? (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#1DB954" />
            <Text style={styles.savedText}>{savedMsg}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.playAllBtn, { backgroundColor: accent }]} onPress={playAll} activeOpacity={0.85}>
            <Ionicons name="play" size={17} color="#fff" />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={savePlaylist} activeOpacity={0.85}>
            <Ionicons name="bookmark-outline" size={17} color="#fff" />
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {result.songs.map((song, index) => (
          <TouchableOpacity key={`${song.id}_${index}`} style={styles.songRow} onPress={() => playOne(song, index)} activeOpacity={0.75}>
            <Text style={styles.songIdx}>{index + 1}</Text>
            <View style={[styles.songArt, { backgroundColor: (GENRE_COLORS[song.genre] || '#333') + '22' }]}>
              {song.imageUrl
                ? <Image source={{ uri: song.imageUrl }} style={styles.songArtImg} />
                : <Text style={styles.songArtEmoji}>{song.emoji || '🎵'}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{song.artist} · {song.genre}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={24} color="#555" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.againBtn} onPress={startOver} activeOpacity={0.75}>
          <Ionicons name="refresh" size={16} color="#888" />
          <Text style={styles.againText}>Generate Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },

  formScroll: { paddingHorizontal: 20 },
  intro: { color: '#9A9A9A', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 4, marginBottom: 8 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: '#8A8A8A',
    textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 24, marginBottom: 14,
  },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  moodChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  moodEmoji: { fontSize: 16 },
  moodChipText: { color: '#ccc', fontSize: 13.5, fontWeight: '700' },
  moodChipTextActive: { color: '#000' },

  orText: { color: '#555', fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 10, textAlign: 'center' },
  textInput: {
    backgroundColor: '#111', color: '#fff',
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, fontSize: 15, fontWeight: '600',
    borderWidth: 1, borderColor: '#1E1E1E',
  },

  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  genreChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  genreChipText: { color: '#9A9A9A', fontSize: 13, fontWeight: '700' },
  genreChipTextActive: { color: '#000' },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14,
    marginTop: 30, marginBottom: 14,
  },
  generateBtnDisabled: { backgroundColor: '#111', borderWidth: 1, borderColor: '#1E1E1E' },
  generateBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  generateBtnTextDisabled: { color: '#444' },
  footNote: { color: '#555', fontSize: 12, textAlign: 'center', fontWeight: '600' },

  // Generating
  genOrb: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    marginBottom: 36, borderWidth: 1, borderColor: '#2A2A2A',
  },
  genTitle: { fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  genSub: { fontSize: 14, color: '#888', fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  genMsg: { fontSize: 14, color: '#555', fontWeight: '600', textAlign: 'center' },

  // Result
  resultHero: { alignItems: 'center', marginTop: 4, marginBottom: 22 },
  resultArt: {
    width: 130, height: 130, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  resultArtEmoji: { fontSize: 60 },
  resultName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' },
  resultCount: { color: '#9A9A9A', fontSize: 13, fontWeight: '700', marginTop: 6 },

  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: 'rgba(29,185,84,0.10)', borderRadius: 12,
    paddingVertical: 10, marginBottom: 16,
  },
  savedText: { color: '#1DB954', fontSize: 13, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  playAllBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  playAllText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1E1E1E',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  songRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  songIdx: { color: '#888', fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  songArt: {
    width: 48, height: 48, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  songArtImg: { width: '100%', height: '100%', borderRadius: 11 },
  songArtEmoji: { fontSize: 22 },
  songTitle: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  songArtist: { color: '#9A9A9A', fontSize: 12.5, fontWeight: '600', marginTop: 3 },

  againBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, marginTop: 8 },
  againText: { color: '#888', fontSize: 14, fontWeight: '700' },
});
