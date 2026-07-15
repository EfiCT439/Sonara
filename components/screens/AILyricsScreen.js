import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GENRES = ['Afrobeats', 'Amapiano', 'Pop', 'Hip Hop', 'R&B', 'Soul', 'Gospel', 'Reggae'];
const MOODS = ['Love', 'Heartbreak', 'Celebration', 'Hope', 'Faith', 'Nostalgia'];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
};

// Mood-flavoured line pools. {t} = the user's theme.
const VERSE_LINES = {
  Love: [
    'Every time I see you, {t} feels brand new',
    'Holding on to {t}, there\'s nothing I won\'t do',
    'In your eyes I found a reason to believe',
    'You and me together, that\'s all I need',
    'Whisper me your secrets in the dark',
    'Your love is the fire lighting up my heart',
  ],
  Heartbreak: [
    'Now the room is empty where {t} used to be',
    'I keep chasing shadows of a memory',
    'Every song reminds me of the words you said',
    'Tears on my pillow, echoes in my head',
    'I gave you my everything, you gave me goodbye',
    'Still I keep pretending that I\'m doing fine',
  ],
  Celebration: [
    'Turn the music up, tonight we own the {t}',
    'Hands up to the sky, we\'re never coming down',
    'Feel the rhythm moving, let the good times roll',
    'This is our moment, let the story unfold',
    'Dancing till the morning, no we won\'t stop now',
    'Living for the feeling, taking every bow',
  ],
  Hope: [
    'Through the darkest night I\'m holding on to {t}',
    'Every fallen dream can find its wings to fly',
    'One more step, I\'m stronger than before',
    'Brighter days are waiting right outside my door',
    'I won\'t let the storm decide my name',
    'From the ashes rising, lighting up the flame',
  ],
  Faith: [
    'When I lift my hands, {t} carries me',
    'In the quiet moments, that\'s where grace is free',
    'Every mountain moves when I begin to pray',
    'Light will always find me, guiding me the way',
    'I will keep believing through the highs and lows',
    'Peace beyond my understanding gently flows',
  ],
  Nostalgia: [
    'Take me back to {t}, the days we used to know',
    'Faded polaroids and the radio',
    'We were young and fearless, chasing summer rain',
    'Wish I could relive it all again',
    'Old streets and laughter, echoes of our youth',
    'Holding every memory, holding on to truth',
  ],
};

const CHORUS_LINES = [
  'Oh, {t}, you\'re the melody in me',
  'We\'re singing {t} for the world to see',
  'Hold me close, don\'t let the moment fade',
  'This is the song that {t} made',
  'Whoa-oh, we\'re rising with the sound',
  'Whoa-oh, {t} turns it all around',
];

const BRIDGE_LINES = [
  'And when the lights go low',
  'I\'ll still be here, you know',
  'No matter where we go',
  '{t} will never let me go',
];

function generateLyrics(theme, genre, mood) {
  const t = (theme || '').trim() || 'the night';
  const pool = VERSE_LINES[mood] || VERSE_LINES.Love;
  const fill = (line) => line.replace(/\{t\}/g, t);

  return {
    title: cap(t),
    tag: `${mood} · ${genre}`,
    sections: [
      { label: 'Verse 1', lines: pickN(pool, 4).map(fill) },
      { label: 'Chorus', lines: pickN(CHORUS_LINES, 4).map(fill) },
      { label: 'Verse 2', lines: pickN(pool, 4).map(fill) },
      { label: 'Chorus', lines: pickN(CHORUS_LINES, 4).map(fill) },
      { label: 'Bridge', lines: BRIDGE_LINES.map(fill) },
    ],
  };
}

// ─── Module-scope chips ──────────────────────────────────────────────────────
function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AILyricsScreen({ navigation }) {
  const [step, setStep] = useState('form'); // form | result
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [mood, setMood] = useState(MOODS[0]);
  const [lyrics, setLyrics] = useState(null);

  const handleGenerate = () => {
    if (!theme.trim()) {
      Alert.alert('Add a theme', 'Type what the song should be about (a word or a phrase).');
      return;
    }
    setLyrics(generateLyrics(theme, genre, mood));
    setStep('result');
  };

  const lyricsToText = () => {
    if (!lyrics) return '';
    const body = lyrics.sections
      .map(s => `[${s.label}]\n${s.lines.join('\n')}`)
      .join('\n\n');
    return `"${lyrics.title}" (${lyrics.tag})\n\n${body}\n\n— Written with Sonara`;
  };

  const shareLyrics = async () => {
    try { await Share.share({ message: lyricsToText(), title: lyrics.title }); } catch (_) {}
  };

  // ── FORM ────────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Lyrics Generator</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Give a theme and a vibe — we'll write the lyrics.</Text>

          <Text style={styles.fieldLabel}>What's the song about?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. long-distance love, my hometown, never giving up"
            placeholderTextColor="#333"
            value={theme}
            onChangeText={setTheme}
            maxLength={60}
          />

          <Text style={styles.fieldLabel}>Mood</Text>
          <View style={styles.chipWrap}>
            {MOODS.map(m => <Chip key={m} label={m} selected={mood === m} onPress={() => setMood(m)} />)}
          </View>

          <Text style={styles.fieldLabel}>Genre</Text>
          <View style={styles.chipWrap}>
            {GENRES.map(g => <Chip key={g} label={g} selected={genre === g} onPress={() => setGenre(g)} />)}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, !theme.trim() && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!theme.trim()}
            activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color={theme.trim() ? '#000' : '#444'} />
            <Text style={[styles.generateBtnText, !theme.trim() && styles.generateBtnTextDisabled]}>Write Lyrics</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  // ── RESULT ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('form')} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lyrics.title}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={shareLyrics} activeOpacity={0.75}>
          <Ionicons name="share-social-outline" size={19} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.resultTag}>{lyrics.tag}</Text>

        {lyrics.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionLabel}>{s.label}</Text>
            {s.lines.map((line, j) => (
              <Text key={j} style={styles.line}>{line}</Text>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.primaryBtn} onPress={shareLyrics} activeOpacity={0.85}>
          <Ionicons name="share-social" size={18} color="#000" />
          <Text style={styles.primaryBtnText}>Share Lyrics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleGenerate} activeOpacity={0.85}>
          <Ionicons name="refresh" size={17} color="#fff" />
          <Text style={styles.secondaryBtnText}>Regenerate</Text>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  headerTitle: { flex: 1, textAlign: 'center', marginHorizontal: 8, fontSize: 17, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20 },
  intro: { color: '#9A9A9A', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 4, marginBottom: 8 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: '#8A8A8A',
    textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 22, marginBottom: 12,
  },
  input: {
    backgroundColor: '#111', color: '#fff',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: '#1E1E1E',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1E1E1E',
  },
  chipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  chipText: { color: '#9A9A9A', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#000' },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, marginTop: 30,
  },
  generateBtnDisabled: { backgroundColor: '#111', borderWidth: 1, borderColor: '#1E1E1E' },
  generateBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  generateBtnTextDisabled: { color: '#444' },

  resultTag: { color: '#9A9A9A', fontSize: 13, fontWeight: '700', marginTop: 4, marginBottom: 18 },
  section: { marginBottom: 22 },
  sectionLabel: {
    color: '#8A8A8A', fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
  },
  line: { color: '#eee', fontSize: 16, lineHeight: 26, fontWeight: '500' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', paddingVertical: 15, borderRadius: 14, marginTop: 10, marginBottom: 12,
  },
  primaryBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#111', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
