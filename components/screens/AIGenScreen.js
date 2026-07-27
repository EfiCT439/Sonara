import { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../context/UserContext';
import api from '../../services/api';
import { generateSongLyrics } from '../../services/lyrics';

// ─── Constants ───────────────────────────────────────────────────────────────

const GENRES = [
  'Afrobeats', 'Amapiano', 'Gospel', 'Hip Hop', 'R&B',
  'Pop', 'Soul', 'Jazz', 'Reggae', 'Dancehall',
  'Highlife', 'Rock', 'Electronic', 'Classical', 'Country', 'Bongo Flava',
];

const CYCLE_MESSAGES = [
  'Composing your melody…',
  'Building the rhythm section…',
  'Adding harmonics…',
  'Layering instruments…',
  'Mixing your track…',
  'Finalizing production…',
];

const NUM_GEN_BARS = 18;

// Pre-computed wave params so animation is consistent across re-renders
const GEN_BAR_PARAMS = Array.from({ length: NUM_GEN_BARS }, (_, i) => {
  const center = (NUM_GEN_BARS - 1) / 2;
  const dist = Math.abs(i - center) / center;
  return {
    peak: Math.round((0.45 + (1 - dist) * 0.45) * 80),
    trough: 6 + (i % 4) * 4,
    duration: 320 + (i % 7) * 65,
  };
});

// ─── Module-scope sub-components (keyboard-bug rule) ─────────────────────────

function GenreChip({ styles, c, genre, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.genreChip, selected && styles.genreChipActive]}
      onPress={onPress}
      activeOpacity={0.75}>
      <Text style={[styles.genreChipText, selected && styles.genreChipTextActive]}>
        {genre}
      </Text>
    </TouchableOpacity>
  );
}

function SaveSheet({ styles, c, visible, playlists, onSaveToExisting, onCreateNew, onClose }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const regularPlaylists = (playlists || []).filter(p => !p.isLikedSongs);

  const reset = () => { setNewName(''); setCreating(false); };

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateNew(newName.trim());
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.saveSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Save to Playlist</Text>

          {!creating ? (
            <>
              <TouchableOpacity
                style={styles.createNewRow}
                onPress={() => setCreating(true)}
                activeOpacity={0.75}>
                <View style={styles.createNewIcon}>
                  <Ionicons name="add" size={18} color={c.textDim} />
                </View>
                <Text style={styles.createNewText}>Create New Playlist</Text>
                <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
              </TouchableOpacity>

              {regularPlaylists.length > 0 && (
                <>
                  <Text style={styles.orLabel}>or choose existing</Text>
                  <ScrollView style={styles.playlistScroll} showsVerticalScrollIndicator={false}>
                    {regularPlaylists.map(pl => (
                      <TouchableOpacity
                        key={pl.id}
                        style={styles.playlistPickRow}
                        onPress={() => onSaveToExisting(pl.id)}
                        activeOpacity={0.75}>
                        <Text style={styles.playlistPickEmoji}>{pl.emoji}</Text>
                        <Text style={styles.playlistPickName}>{pl.name}</Text>
                        <Text style={styles.playlistPickCount}>{pl.songs?.length || 0}</Text>
                        <Ionicons name="chevron-forward" size={14} color={c.textFaint} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.sheetLabel}>Playlist name</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="e.g. My AI Vibes"
                placeholderTextColor={c.textFaint}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                maxLength={40}
              />
              <TouchableOpacity
                style={styles.sheetCreateBtn}
                onPress={handleCreate}
                activeOpacity={0.85}>
                <Text style={styles.sheetCreateBtnText}>Create & Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backRow} onPress={reset}>
                <Ionicons name="arrow-back" size={15} color={c.textFaint} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.cancelRow} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AIGenScreen({ navigation }) {
  const { userPlaylists, createPlaylist, addSongToPlaylist, loadAndPlay, addCreatedSong, updateCreatedSong } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);

  // Form state
  const [genre, setGenre] = useState('Afrobeats');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Flow state
  const [step, setStep] = useState('form'); // 'form' | 'generating' | 'result'
  const [predictionId, setPredictionId] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [coverUri, setCoverUri] = useState(null); // optional cover art for the generated song
  const [songId, setSongId] = useState(null);     // stable id for the created song
  const [lyrics, setLyrics] = useState(null);     // { mood, lyrics, text } — generated with the song
  const [showLyrics, setShowLyrics] = useState(false);

  // Generating animation
  const [msgIdx, setMsgIdx] = useState(0);
  const genBars = useRef(
    Array.from({ length: NUM_GEN_BARS }, () => new Animated.Value(8))
  ).current;

  // ── Generating: cycle messages ────────────────────────────────────
  useEffect(() => {
    if (step !== 'generating') return;
    setMsgIdx(0);
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % CYCLE_MESSAGES.length), 3500);
    return () => clearInterval(iv);
  }, [step]);

  // ── Generating: animate bars ──────────────────────────────────────
  useEffect(() => {
    if (step !== 'generating') {
      genBars.forEach(b => b.setValue(8));
      return;
    }

    const animations = genBars.map((bar, i) => {
      const { peak, trough, duration } = GEN_BAR_PARAMS[i];
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: peak, duration, useNativeDriver: false }),
          Animated.timing(bar, { toValue: trough, duration: duration * 0.85, useNativeDriver: false }),
        ])
      );
    });

    // Stagger start so bars don't all peak together
    genBars.forEach((_, i) => {
      setTimeout(() => animations[i].start(), i * 55);
    });

    return () => animations.forEach(a => a.stop());
  }, [step]);

  // ── Poll Suno for status (full songs WITH vocals; ~30s–3min) ──────────
  useEffect(() => {
    if (step !== 'generating' || !predictionId) return;

    const poll = async () => {
      const result = await api.getSunoStatus(predictionId);
      if (!result) return;

      if (result.status === 'succeeded') {
        const id = `ai_${Date.now()}`;
        setSongId(id);
        setAudioUrl(result.audioUrl);
        // Suno returns real cover art with the track — use it as the default cover
        // (the user can still replace it via "Upload Cover Art").
        if (result.imageUrl) setCoverUri(result.imageUrl);
        // Template lyrics as a placeholder (Suno writes its own real lyrics, which
        // this endpoint doesn't return) — shown in the Player's lyrics panel.
        const generated = generateSongLyrics({
          title: title.trim(), description: description.trim(), genre,
        });
        setLyrics(generated);
        // Save into "created content" → shown under Upload Music
        addCreatedSong({
          id, title: title.trim() || result.title || 'Untitled', artist: 'AI Generated',
          genre, emoji: '✨', audioUrl: result.audioUrl, imageUrl: result.imageUrl, lyrics: generated.text,
        });
        setStep('result');
      } else if (result.status === 'failed') {
        setError(result.error || 'Generation failed. Please try again.');
        setStep('form');
      }
      // 'starting' | 'processing' — keep polling
    };

    const iv = setInterval(poll, 4000);
    poll(); // immediate first check
    return () => clearInterval(iv);
  }, [step, predictionId]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a song title before generating.');
      return;
    }
    setError(null);
    setStep('generating');

    const result = await api.generateSunoSong({ genre, title: title.trim(), description: description.trim() });

    if (!result?.taskId) {
      setError(result?.error || 'Could not start generation. Make sure the backend is running and SUNO_API_KEY is set in .env.');
      setStep('form');
      return;
    }

    setPredictionId(result.taskId);
  };

  const handlePickCover = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert('Permission needed', 'Please allow photo access to add a cover.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setCoverUri(uri);
      if (songId) updateCreatedSong(songId, { imageUrl: uri }); // keep Upload Music copy in sync
    }
  };

  const generatedSong = useMemo(() => ({
    id: songId || `ai_${Date.now()}`,
    title: title.trim() || 'Untitled',
    artist: 'AI Generated',
    genre,
    emoji: '✨',
    audioUrl,
    imageUrl: coverUri || undefined,
    lyrics: lyrics?.text,
  }), [songId, audioUrl, title, genre, coverUri, lyrics]);

  const handlePlay = () => {
    if (!audioUrl) return;
    loadAndPlay(generatedSong, [generatedSong], 0);
    navigation.navigate('Player', { song: generatedSong });
  };

  const handleSaveToExisting = (playlistId) => {
    addSongToPlaylist(generatedSong, playlistId);
    setShowSaveSheet(false);
    const pl = userPlaylists.find(p => p.id === playlistId);
    setSavedMsg(`Saved to "${pl?.name || 'playlist'}"`);
  };

  const handleCreateAndSave = (name) => {
    const pl = createPlaylist(name, '✨');
    if (!pl) { setShowSaveSheet(false); return; }
    addSongToPlaylist(generatedSong, pl.id);
    setShowSaveSheet(false);
    setSavedMsg(`Saved to "${pl.name}"`);
  };

  const resetForm = () => {
    setStep('form');
    setTitle('');
    setDescription('');
    setGenre('Afrobeats');
    setAudioUrl(null);
    setPredictionId(null);
    setSavedMsg('');
    setError(null);
    setCoverUri(null);
    setSongId(null);
    setLyrics(null);
    setShowLyrics(false);
  };

  // ── Render: FORM ──────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color={c.icon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Song Generator</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={c.textDim} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Genre selector */}
          <Text style={styles.fieldLabel}>Genre</Text>
          <View style={styles.genreGrid}>
            {GENRES.map(g => (
              <GenreChip styles={styles} c={c}
                key={g}
                genre={g}
                selected={genre === g}
                onPress={() => setGenre(g)}
              />
            ))}
          </View>

          {/* Title */}
          <Text style={styles.fieldLabel}>Song Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Midnight in Lagos"
            placeholderTextColor={c.textFaint}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
            autoCorrect={false}
          />

          {/* Description */}
          <Text style={styles.fieldLabel}>Describe the song</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={
              'Describe what the song is about — the mood, instruments, story, and feeling.\n\ne.g. "An upbeat Afrobeats track about celebrating with friends at night, with talking drum and vibrant rhythm section."'
            }
            placeholderTextColor={c.textFaint}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>

          <Text style={styles.tipText}>
            The more detail you give, the better the result. Include mood, instruments, tempo, and story.
          </Text>

          <TouchableOpacity
            style={[styles.generateBtn, !title.trim() && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            activeOpacity={0.85}
            disabled={!title.trim()}>
            <Ionicons name="sparkles" size={18} color={title.trim() ? c.accentText : c.textFaint} />
            <Text style={[styles.generateBtnText, !title.trim() && styles.generateBtnTextDisabled]}>
              Generate Song
            </Text>
          </TouchableOpacity>

          <Text style={styles.footNote}>Generation takes 30–60 seconds · Powered by MusicGen</Text>
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Render: GENERATING ────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        {/* Animated waveform */}
        <View style={styles.genWaveRow}>
          {genBars.map((bar, i) => (
            <View key={i} style={styles.genBarWrap}>
              <Animated.View style={[styles.genBar, { height: bar }]} />
            </View>
          ))}
        </View>

        <Text style={styles.genTitle}>Creating your {genre} song</Text>
        <Text style={styles.genTitle2}>"{title}"</Text>
        <Text style={styles.genMsg}>{CYCLE_MESSAGES[msgIdx]}</Text>
        <Text style={styles.genEta}>This usually takes 30–60 seconds</Text>

        <TouchableOpacity
          style={styles.cancelGenBtn}
          onPress={resetForm}
          activeOpacity={0.75}>
          <Text style={styles.cancelGenText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: RESULT ────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.centeredContainer]}>
      <View style={styles.resultCard}>
        <TouchableOpacity style={styles.resultArtwork} onPress={handlePickCover} activeOpacity={0.8}>
          {coverUri ? (
            <>
              <Image source={{ uri: coverUri }} style={styles.resultArtworkImg} />
              <View style={styles.coverEditBadge}>
                <Ionicons name="camera" size={13} color={c.icon} />
              </View>
            </>
          ) : (
            <Text style={styles.resultEmoji}>✨</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.resultMeta}>AI Generated · {genre} · 30s</Text>

        {lyrics ? (
          <TouchableOpacity style={styles.lyricsBadge} onPress={() => setShowLyrics(true)} activeOpacity={0.75}>
            <Ionicons name="text" size={13} color={c.textDim} />
            <Text style={styles.lyricsBadgeText}>Lyrics generated · {lyrics.mood}</Text>
            <Ionicons name="chevron-forward" size={13} color={c.textFaint} />
          </TouchableOpacity>
        ) : null}

        {savedMsg ? (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={c.textDim} />
            <Text style={styles.savedText}>{savedMsg}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.85}>
        <Ionicons name="play" size={20} color={c.accentText} />
        <Text style={styles.playBtnText}>Play Song</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.coverBtn} onPress={handlePickCover} activeOpacity={0.85}>
        <Ionicons name={coverUri ? 'image' : 'image-outline'} size={18} color={c.icon} />
        <Text style={styles.coverBtnText}>{coverUri ? 'Change Cover Art' : 'Upload Cover Art'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => setShowSaveSheet(true)}
        activeOpacity={0.85}>
        <Ionicons name="bookmark-outline" size={18} color={c.icon} />
        <Text style={styles.saveBtnText}>Save to Playlist</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.againBtn} onPress={resetForm} activeOpacity={0.75}>
        <Ionicons name="refresh" size={16} color={c.textFaint} />
        <Text style={styles.againText}>Generate Another</Text>
      </TouchableOpacity>

      {/* Lyrics — generated automatically with the song */}
      <Modal visible={showLyrics} transparent animationType="slide" onRequestClose={() => setShowLyrics(false)}>
        <View style={styles.overlay}>
          <View style={styles.lyricsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.lyricsSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle2}>{lyrics?.lyrics?.title || title}</Text>
                {lyrics ? <Text style={styles.lyricsSheetTag}>{lyrics.lyrics.tag}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => setShowLyrics(false)} activeOpacity={0.75}>
                <Ionicons name="close" size={22} color={c.textFaint} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.lyricsScroll}>
              {lyrics?.lyrics?.sections.map((s, i) => (
                <View key={i} style={styles.lyricsSection}>
                  <Text style={styles.lyricsSectionLabel}>{s.label}</Text>
                  {s.lines.map((line, j) => (
                    <Text key={j} style={styles.lyricsLine}>{line}</Text>
                  ))}
                </View>
              ))}
              <Text style={styles.lyricsFootNote}>Generated with your song · edit anytime in your library</Text>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveSheet styles={styles} c={c}
        visible={showSaveSheet}
        playlists={userPlaylists}
        onSaveToExisting={handleSaveToExisting}
        onCreateNew={handleCreateAndSave}
        onClose={() => setShowSaveSheet(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  centeredContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: c.text },

  // Form
  formScroll: { paddingHorizontal: 20 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: c.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 12, marginTop: 22,
  },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  genreChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border,
  },
  genreChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  genreChipText: { color: c.textFaint, fontSize: 13, fontWeight: '600' },
  genreChipTextActive: { color: c.accentText },

  textInput: {
    backgroundColor: c.surface, color: c.text,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, fontSize: 15,
    borderWidth: 1, borderColor: c.border,
    marginBottom: 4,
  },
  textArea: { height: 130, paddingTop: 14 },
  charCount: { color: c.textFaint, fontSize: 11, textAlign: 'right', marginBottom: 8 },

  tipText: {
    color: c.textFaint, fontSize: 12, lineHeight: 18,
    marginTop: 6, marginBottom: 28,
  },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.accent, paddingVertical: 16,
    borderRadius: 14, marginBottom: 14,
  },
  generateBtnDisabled: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  generateBtnText: { color: c.accentText, fontSize: 16, fontWeight: '800' },
  generateBtnTextDisabled: { color: c.textFaint },
  footNote: { color: c.textFaint, fontSize: 11, textAlign: 'center' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: c.surface, borderRadius: 10,
    padding: 14, marginBottom: 8, marginTop: 8,
    borderWidth: 1, borderColor: c.border,
  },
  errorText: { color: c.textFaint, fontSize: 13, flex: 1, lineHeight: 18 },

  // Generating
  genWaveRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 4, height: 90, marginBottom: 40,
  },
  genBarWrap: { width: 7, height: 90, justifyContent: 'flex-end', alignItems: 'center' },
  genBar: { width: 5, borderRadius: 3, backgroundColor: c.accent },

  genTitle: { fontSize: 18, fontWeight: '800', color: c.text, textAlign: 'center', marginBottom: 4 },
  genTitle2: { fontSize: 14, color: c.textFaint, textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  genMsg: { fontSize: 14, color: c.textFaint, textAlign: 'center', marginBottom: 10 },
  genEta: { fontSize: 12, color: c.textFaint, textAlign: 'center', marginBottom: 40 },
  cancelGenBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: c.border,
  },
  cancelGenText: { color: c.textFaint, fontSize: 14 },

  // Result
  resultCard: {
    width: '100%', backgroundColor: c.surface,
    borderRadius: 20, padding: 28,
    alignItems: 'center', marginBottom: 28,
    borderWidth: 1, borderColor: c.border,
  },
  resultArtwork: {
    width: 110, height: 110, borderRadius: 22,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    marginBottom: 18, borderWidth: 1, borderColor: '#222', overflow: 'hidden',
  },
  resultArtworkImg: { width: '100%', height: '100%' },
  coverEditBadge: {
    position: 'absolute', bottom: 6, right: 6,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  resultEmoji: { fontSize: 52 },
  resultTitle: { fontSize: 20, fontWeight: '800', color: c.text, textAlign: 'center', marginBottom: 6 },
  resultMeta: { fontSize: 13, color: c.textFaint, marginBottom: 14 },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.elevated, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12,
  },
  savedText: { color: c.textFaint, fontSize: 12, fontWeight: '600' },

  lyricsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.elevated, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: '#222',
  },
  lyricsBadgeText: { color: c.textDim, fontSize: 12, fontWeight: '700' },

  // Lyrics sheet
  lyricsSheet: {
    backgroundColor: c.surface, maxHeight: '82%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 34,
    borderTopWidth: 1, borderColor: c.border,
  },
  lyricsSheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  sheetTitle2: { fontSize: 19, fontWeight: '800', color: c.text },
  lyricsSheetTag: { color: c.textDim, fontSize: 12, fontWeight: '700', marginTop: 4 },
  lyricsScroll: { },
  lyricsSection: { marginBottom: 20 },
  lyricsSectionLabel: {
    color: c.textDim, fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
  },
  lyricsLine: { color: c.text, fontSize: 15, lineHeight: 25, fontWeight: '500' },
  lyricsFootNote: { color: c.textFaint, fontSize: 12, marginTop: 6, fontStyle: 'italic' },

  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.accent, paddingVertical: 15, borderRadius: 14,
    width: '100%', marginBottom: 12,
  },
  playBtnText: { color: c.accentText, fontSize: 16, fontWeight: '800' },

  coverBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.surface, paddingVertical: 14, borderRadius: 14,
    width: '100%', marginBottom: 12,
    borderWidth: 1, borderColor: c.border,
  },
  coverBtnText: { color: c.text, fontSize: 15, fontWeight: '700' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.surface, paddingVertical: 14, borderRadius: 14,
    width: '100%', marginBottom: 16,
    borderWidth: 1, borderColor: c.border,
  },
  saveBtnText: { color: c.text, fontSize: 15, fontWeight: '700' },

  againBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10,
  },
  againText: { color: c.textFaint, fontSize: 14 },

  // Save sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  saveSheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
    borderTopWidth: 1, borderColor: c.border,
  },
  sheetHandle: {
    width: 36, height: 3, backgroundColor: '#222',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: c.text, marginBottom: 20, textAlign: 'center' },
  sheetLabel: { fontSize: 11, fontWeight: '700', color: c.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  sheetInput: {
    backgroundColor: c.elevated, color: c.text,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, fontSize: 15,
    borderWidth: 1, borderColor: c.borderStrong, marginBottom: 14,
  },
  sheetCreateBtn: {
    backgroundColor: c.accent, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginBottom: 10,
  },
  sheetCreateBtnText: { color: c.accentText, fontSize: 15, fontWeight: '800' },

  createNewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.elevated, borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#222',
  },
  createNewIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
  },
  createNewText: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },

  orLabel: { fontSize: 11, color: c.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  playlistScroll: { maxHeight: 220, marginBottom: 4 },
  playlistPickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  playlistPickEmoji: { fontSize: 22 },
  playlistPickName: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },
  playlistPickCount: { color: c.textFaint, fontSize: 12 },

  createForm: { marginBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, justifyContent: 'center' },
  backText: { color: c.textFaint, fontSize: 14 },
  cancelRow: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelText: { color: c.textFaint, fontSize: 14 },
});
