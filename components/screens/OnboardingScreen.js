import { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert, Animated, ActivityIndicator, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const GENRE_COLORS = {
  Afrobeats: '#FF6B35', 'Hip Hop': '#9B59B6', Pop: '#E91E63',
  'R&B': '#3498DB', Soul: '#E67E22', Gospel: '#2ECC71',
  Amapiano: '#1ABC9C', Latin: '#F39C12', Cameroonian: '#E74C3C', Custom: '#888',
};

const ARTISTS = [
  // Afrobeats / Nigeria
  { id: '1',  name: 'Burna Boy',       genre: 'Afrobeats',    emoji: '🎤' },
  { id: '2',  name: 'Wizkid',          genre: 'Afrobeats',    emoji: '🎸' },
  { id: '3',  name: 'Davido',          genre: 'Afrobeats',    emoji: '🎶' },
  { id: '4',  name: 'Rema',            genre: 'Afrobeats',    emoji: '🎺' },
  { id: '5',  name: 'Asake',           genre: 'Afrobeats',    emoji: '🎤' },
  { id: '6',  name: 'Fireboy DML',     genre: 'Afrobeats',    emoji: '🎸' },
  { id: '7',  name: 'Tems',            genre: 'Afrobeats',    emoji: '🎵' },
  { id: '8',  name: 'Ayra Starr',      genre: 'Afrobeats',    emoji: '🎶' },
  { id: '9',  name: 'Omah Lay',        genre: 'Afrobeats',    emoji: '🎹' },
  { id: '10', name: 'CKay',            genre: 'Afrobeats',    emoji: '🎧' },
  { id: '11', name: 'Tiwa Savage',     genre: 'Afrobeats',    emoji: '🎤' },
  { id: '12', name: 'Fave',            genre: 'Afrobeats',    emoji: '🎵' },
  { id: '13', name: 'Amaarae',         genre: 'Afrobeats',    emoji: '🎶' },
  { id: '14', name: 'Mr Eazi',         genre: 'Afrobeats',    emoji: '🎸' },
  { id: '15', name: 'Kizz Daniel',     genre: 'Afrobeats',    emoji: '🎤' },
  { id: '16', name: 'Joeboy',          genre: 'Afrobeats',    emoji: '🎵' },
  // Cameroonian
  { id: '17', name: 'Stanley Enow',    genre: 'Cameroonian',  emoji: '🎤' },
  { id: '18', name: 'Locko',           genre: 'Cameroonian',  emoji: '🎶' },
  { id: '19', name: 'Charlotte Dipanda', genre: 'Cameroonian', emoji: '🎵' },
  { id: '20', name: 'Daphne',          genre: 'Cameroonian',  emoji: '🎸' },
  { id: '21', name: 'Askia',           genre: 'Cameroonian',  emoji: '🎹' },
  // Amapiano / South Africa
  { id: '22', name: 'Kabza De Small',  genre: 'Amapiano',     emoji: '🎧' },
  { id: '23', name: 'DJ Maphorisa',    genre: 'Amapiano',     emoji: '🎛' },
  { id: '24', name: 'DBN Gogo',        genre: 'Amapiano',     emoji: '🎤' },
  { id: '25', name: 'Focalistic',      genre: 'Amapiano',     emoji: '🎵' },
  // Gospel
  { id: '26', name: 'Tasha Cobbs',     genre: 'Gospel',       emoji: '🙏' },
  { id: '27', name: 'Sinach',          genre: 'Gospel',       emoji: '🎵' },
  { id: '28', name: 'Kirk Franklin',   genre: 'Gospel',       emoji: '🎹' },
  { id: '29', name: 'Elevation Worship', genre: 'Gospel',     emoji: '🎶' },
  // Hip Hop
  { id: '30', name: 'Drake',           genre: 'Hip Hop',      emoji: '🎤' },
  { id: '31', name: 'Kendrick Lamar',  genre: 'Hip Hop',      emoji: '🎸' },
  { id: '32', name: 'Travis Scott',    genre: 'Hip Hop',      emoji: '🎵' },
  { id: '33', name: 'J. Cole',         genre: 'Hip Hop',      emoji: '🎶' },
  { id: '34', name: 'Lil Baby',        genre: 'Hip Hop',      emoji: '🎹' },
  { id: '35', name: 'Post Malone',     genre: 'Hip Hop',      emoji: '🎧' },
  { id: '36', name: 'Cardi B',         genre: 'Hip Hop',      emoji: '🎤' },
  { id: '37', name: 'Nicki Minaj',     genre: 'Hip Hop',      emoji: '🎵' },
  // R&B / Soul
  { id: '38', name: 'The Weeknd',      genre: 'R&B',          emoji: '🎶' },
  { id: '39', name: 'SZA',             genre: 'R&B',          emoji: '🎸' },
  { id: '40', name: 'Beyonce',         genre: 'R&B',          emoji: '🎤' },
  { id: '41', name: 'Chris Brown',     genre: 'R&B',          emoji: '🎵' },
  { id: '42', name: 'Usher',           genre: 'R&B',          emoji: '🎶' },
  { id: '43', name: 'Adele',           genre: 'Soul',         emoji: '🎼' },
  // Pop
  { id: '44', name: 'Taylor Swift',    genre: 'Pop',          emoji: '🎹' },
  { id: '45', name: 'Ed Sheeran',      genre: 'Pop',          emoji: '🎸' },
  { id: '46', name: 'Harry Styles',    genre: 'Pop',          emoji: '🎵' },
  { id: '47', name: 'Dua Lipa',        genre: 'Pop',          emoji: '🎤' },
  { id: '48', name: 'Ariana Grande',   genre: 'Pop',          emoji: '🎶' },
  { id: '49', name: 'Billie Eilish',   genre: 'Pop',          emoji: '🎧' },
  { id: '50', name: 'Justin Bieber',   genre: 'Pop',          emoji: '🎹' },
  // Latin
  { id: '51', name: 'Bad Bunny',       genre: 'Latin',        emoji: '🎤' },
  { id: '52', name: 'J Balvin',        genre: 'Latin',        emoji: '🎵' },
  { id: '53', name: 'Maluma',          genre: 'Latin',        emoji: '🎶' },
];

const ARTIST_SONGS = {
  'Burna Boy':   [{ id: 'bb1', title: 'Last Last', artist: 'Burna Boy', emoji: '🎵', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'bb2', title: 'Anybody', artist: 'Burna Boy', emoji: '🎶', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'bb3', title: 'Ye', artist: 'Burna Boy', emoji: '🎸', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
  'Wizkid':      [{ id: 'wz1', title: 'Essence', artist: 'Wizkid', emoji: '🎵', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'wz2', title: 'Ojuelegba', artist: 'Wizkid', emoji: '🎶', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'wz3', title: 'Come Closer', artist: 'Wizkid', emoji: '🎸', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
  'Drake':       [{ id: 'dr1', title: "God's Plan", artist: 'Drake', emoji: '🎵', genre: 'Hip Hop', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'dr2', title: 'Hotline Bling', artist: 'Drake', emoji: '🎶', genre: 'Hip Hop', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'dr3', title: 'One Dance', artist: 'Drake', emoji: '🎸', genre: 'Hip Hop', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
  'Davido':      [{ id: 'dv1', title: 'Fall', artist: 'Davido', emoji: '🎵', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'dv2', title: 'Assurance', artist: 'Davido', emoji: '🎶', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'dv3', title: 'Jowo', artist: 'Davido', emoji: '🎸', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
  'Taylor Swift':[{ id: 'ts1', title: 'Anti-Hero', artist: 'Taylor Swift', emoji: '🎵', genre: 'Pop', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'ts2', title: 'Shake It Off', artist: 'Taylor Swift', emoji: '🎶', genre: 'Pop', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'ts3', title: 'Love Story', artist: 'Taylor Swift', emoji: '🎸', genre: 'Pop', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
  'The Weeknd':  [{ id: 'tw1', title: 'Blinding Lights', artist: 'The Weeknd', emoji: '🎵', genre: 'R&B', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'tw2', title: 'Save Your Tears', artist: 'The Weeknd', emoji: '🎶', genre: 'R&B', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'tw3', title: 'Die For You', artist: 'The Weeknd', emoji: '🎸', genre: 'R&B', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
  'default':     [{ id: 'd1', title: 'Song 1', artist: 'Artist', emoji: '🎵', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'd2', title: 'Song 2', artist: 'Artist', emoji: '🎶', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, { id: 'd3', title: 'Song 3', artist: 'Artist', emoji: '🎸', genre: 'Afrobeats', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }],
};

// Relevance-sorted search: exact > starts-with > contains
function searchArtists(query, artists) {
  if (!query.trim()) return artists;
  const q = query.toLowerCase().trim();
  const exact = [];
  const starts = [];
  const contains = [];
  for (const a of artists) {
    const n = a.name.toLowerCase();
    if (n === q) exact.push(a);
    else if (n.startsWith(q)) starts.push(a);
    else if (n.includes(q)) contains.push(a);
  }
  return [...exact, ...starts, ...contains];
}

// Featured artists shown in the browse grid (top picks)
const FEATURED_IDS = ['1', '2', '3', '4', '5', '17', '26', '30', '38', '44', '22', '51'];

export default function OnboardingScreen({ navigation }) {
  const { setFavouriteArtists } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [customArtists, setCustomArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const searchRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: selectedArtists.length / 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selectedArtists.length]);

  const allArtists = [...ARTISTS, ...customArtists];
  const isSearching = search.trim().length > 0;
  const searchResults = isSearching ? searchArtists(search, allArtists) : [];
  const featuredArtists = FEATURED_IDS.map(id => ARTISTS.find(a => a.id === id)).filter(Boolean);

  const noResults = isSearching && searchResults.length === 0;
  // Always let the user add whatever they typed — even if a catalog match exists
  const typedName = search.trim();
  const alreadySelected = !!selectedArtists.find(a => a.name.toLowerCase() === typedName.toLowerCase());
  const canAddCustom = isSearching && typedName.length > 0 && !alreadySelected;

  const toggleArtist = useCallback((artist) => {
    setSelectedArtists(prev => {
      if (prev.find(a => a.id === artist.id)) {
        return prev.filter(a => a.id !== artist.id);
      }
      if (prev.length >= 3) {
        Alert.alert('Limit reached', 'You can select up to 3 artists. Deselect one to choose another.');
        return prev;
      }
      return [...prev, artist];
    });
  }, []);

  const handleAddCustom = () => {
    const name = search.trim();
    if (!name) return;
    const newArtist = { id: `custom-${Date.now()}`, name, genre: 'Custom', emoji: '🎤' };
    setCustomArtists(prev => [...prev, newArtist]);
    setSearch('');
    toggleArtist(newArtist);
    searchRef.current?.blur();
  };

  const handleContinue = async () => {
    if (selectedArtists.length < 3) {
      const remaining = 3 - selectedArtists.length;
      Alert.alert('Almost there!', `Select ${remaining} more artist${remaining !== 1 ? 's' : ''} to continue.`);
      return;
    }
    setLoading(true);
    try {
      const artistsWithSongs = selectedArtists.map(a => ({
        ...a,
        songs: ARTIST_SONGS[a.name] || ARTIST_SONGS['default'],
      }));
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          favouriteArtists: artistsWithSongs,
          createdAt: new Date().toISOString(),
        });
      }
      setFavouriteArtists(artistsWithSongs);
      navigation.navigate('Main');
    } catch {
      Alert.alert('Error', 'Could not save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const ArtistRow = ({ artist }) => {
    const isSelected = !!selectedArtists.find(a => a.id === artist.id);
    const selIdx = selectedArtists.findIndex(a => a.id === artist.id);
    const color = GENRE_COLORS[artist.genre] || '#888';
    return (
      <TouchableOpacity
        style={[styles.resultRow, isSelected && { backgroundColor: color + '14', borderColor: color + '60' }]}
        onPress={() => toggleArtist(artist)}
        activeOpacity={0.7}>
        <View style={[styles.resultAvatar, { backgroundColor: isSelected ? color : '#2A2A2A' }]}>
          <Text style={styles.resultEmoji}>{artist.emoji}</Text>
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{artist.name}</Text>
          <Text style={[styles.resultGenre, { color }]}>{artist.genre}</Text>
        </View>
        {isSelected ? (
          <View style={[styles.resultCheck, { backgroundColor: color }]}>
            <Text style={styles.resultCheckNum}>{selIdx + 1}</Text>
          </View>
        ) : (
          <View style={styles.resultAdd}>
            <Ionicons name="add" size={18} color={c.textFaint} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ArtistCard = ({ artist }) => {
    const isSelected = !!selectedArtists.find(a => a.id === artist.id);
    const selIdx = selectedArtists.findIndex(a => a.id === artist.id);
    const color = GENRE_COLORS[artist.genre] || '#888';
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && { borderColor: color, backgroundColor: color + '18' }]}
        onPress={() => toggleArtist(artist)}
        activeOpacity={0.75}>
        <View style={[styles.avatarCircle, isSelected && { backgroundColor: color }]}>
          <Text style={styles.avatarEmoji}>{artist.emoji}</Text>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>{artist.name}</Text>
        <View style={[styles.genreTag, { backgroundColor: color + '22' }]}>
          <Text style={[styles.genreText, { color }]}>{artist.genre}</Text>
        </View>
        {isSelected && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeNum}>{selIdx + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.stepRow}>
          <View style={styles.stepPill}>
            <Ionicons name="musical-notes" size={12} color={c.text} />
            <Text style={styles.stepText}>Step 1 of 1</Text>
          </View>
          <Text style={styles.selectedCountText}>{selectedArtists.length}/3 selected</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.title}>Who do you vibe with?</Text>
        <Text style={styles.subtitle}>Pick 3 artists to personalise your Sonara experience</Text>

        {/* Selection slots */}
        <View style={styles.slotsRow}>
          {[0, 1, 2].map(i => {
            const artist = selectedArtists[i];
            const color = artist ? (GENRE_COLORS[artist.genre] || '#888') : '#2A2A2A';
            return (
              <TouchableOpacity
                key={i}
                style={[styles.slot, { borderColor: artist ? color : '#2A2A2A', backgroundColor: artist ? color + '20' : '#161616' }]}
                onPress={() => artist && toggleArtist(artist)}
                activeOpacity={artist ? 0.7 : 1}>
                {artist ? (
                  <>
                    <Text style={styles.slotEmoji}>{artist.emoji}</Text>
                    <Text style={styles.slotName} numberOfLines={1}>{artist.name.split(' ')[0]}</Text>
                    <View style={styles.slotRemove}>
                      <Ionicons name="close" size={9} color={c.icon} />
                    </View>
                  </>
                ) : (
                  <Ionicons name="add" size={18} color={c.textFaint} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? c.text : c.textFaint} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search any artist..."
            placeholderTextColor="#444"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearch(''); searchRef.current?.focus(); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={c.textFaint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content: search results or browse grid */}
      {isSearching ? (
        /* ── Search mode ── */
        <ScrollView
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Always-visible "Add" row — lets users add any artist, in or out of catalog */}
          {canAddCustom && (
            <TouchableOpacity style={styles.addRow} onPress={handleAddCustom} activeOpacity={0.75}>
              <View style={styles.addRowIcon}>
                <Ionicons name="add" size={22} color={c.text} />
              </View>
              <View style={styles.addRowInfo}>
                <Text style={styles.addRowName} numberOfLines={1}>"{typedName}"</Text>
                <Text style={styles.addRowSub}>Add as custom artist</Text>
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={22} color={c.text} />
            </TouchableOpacity>
          )}

          {searchResults.length > 0 && (
            <Text style={styles.resultsLabel}>
              {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} in catalog
            </Text>
          )}

          {searchResults.map(artist => (
            <ArtistRow key={artist.id} artist={artist} />
          ))}

          {/* No catalog matches */}
          {noResults && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={36} color={c.textFaint} />
              <Text style={styles.noResultsTitle}>Not in our catalog yet</Text>
              <Text style={styles.noResultsSub}>
                Use the button above to add them — your feed will be personalised around your picks.
              </Text>
            </View>
          )}

          <View style={{ height: 160 }} />
        </ScrollView>
      ) : (
        /* ── Browse mode ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.grid}>

          <Text style={styles.browseLabel}>Popular artists</Text>
          <View style={styles.gridInner}>
            {featuredArtists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </View>

          <Text style={[styles.browseLabel, { marginTop: 24 }]}>All artists</Text>
          <View style={styles.gridInner}>
            {allArtists.filter(a => !FEATURED_IDS.includes(a.id)).map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>
      )}

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, selectedArtists.length < 3 && styles.ctaBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.88}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={c.icon} size="small" />
          ) : selectedArtists.length < 3 ? (
            <>
              <Ionicons name="musical-notes-outline" size={18} color={c.textFaint} />
              <Text style={styles.ctaBtnTextMuted}>
                {`Select ${3 - selectedArtists.length} more artist${3 - selectedArtists.length !== 1 ? 's' : ''}`}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="headset-outline" size={18} color={c.icon} />
              <Text style={styles.ctaBtnText}>Start Listening</Text>
              <Ionicons name="arrow-forward" size={18} color={c.icon} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },

  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },

  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  stepPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.elevated, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stepText: { color: c.text, fontSize: 12, fontWeight: '700' },
  selectedCountText: { color: c.textFaint, fontSize: 12, fontWeight: '600' },

  progressTrack: { height: 3, backgroundColor: c.elevated, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: c.accent, borderRadius: 2 },

  title: { fontSize: 26, fontWeight: '900', color: c.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: c.textFaint, marginBottom: 18, lineHeight: 20 },

  slotsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  slot: { flex: 1, height: 64, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  slotEmoji: { fontSize: 20, marginBottom: 2 },
  slotName: { color: c.text, fontSize: 10, fontWeight: '700' },
  slotRemove: { position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0A0A0A' },

  searchWrapper: { paddingHorizontal: 20, marginBottom: 10, marginTop: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, gap: 10, borderWidth: 1.5, borderColor: c.borderStrong },
  searchBarFocused: { borderColor: c.accent },
  searchInput: { flex: 1, color: c.text, fontSize: 15 },

  /* Search results */
  resultsList: { flex: 1, paddingHorizontal: 20 },
  resultsLabel: { color: c.textFaint, fontSize: 12, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  resultAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resultEmoji: { fontSize: 22 },
  resultInfo: { flex: 1 },
  resultName: { color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  resultGenre: { fontSize: 12, fontWeight: '600' },
  resultCheck: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  resultCheckNum: { color: c.text, fontSize: 13, fontWeight: '900' },
  resultAdd: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center' },

  noResults: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 20 },
  noResultsTitle: { color: c.text, fontSize: 17, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  noResultsSub: { color: c.textFaint, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.accent, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center' },
  addBtnText: { color: c.text, fontSize: 14, fontWeight: '700' },

  addRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.elevated, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1.5, borderColor: c.border },
  addRowIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addRowInfo: { flex: 1 },
  addRowName: { color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  addRowSub: { color: c.text, fontSize: 12, fontWeight: '600' },

  /* Browse grid */
  grid: { paddingHorizontal: 16 },
  browseLabel: { color: c.textFaint, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 2 },
  gridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  card: { width: '30.5%', backgroundColor: c.surface, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  avatarCircle: { width: 52, height: 52, backgroundColor: c.elevated, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarEmoji: { fontSize: 24 },
  cardName: { color: c.text, fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  genreTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  genreText: { fontSize: 9, fontWeight: '700' },
  badge: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0A0A0A' },
  badgeNum: { color: c.text, fontSize: 11, fontWeight: '900' },

  bottomBar: { paddingHorizontal: 20, paddingBottom: 44, paddingTop: 12, backgroundColor: c.bg },
  ctaBtn: { backgroundColor: c.accent, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, shadowColor: c.bg, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  ctaBtnDisabled: { backgroundColor: c.surface, shadowOpacity: 0 },
  ctaBtnText: { color: c.text, fontSize: 16, fontWeight: '800' },
  ctaBtnTextMuted: { color: c.textFaint, fontSize: 15, fontWeight: '600' },
});
