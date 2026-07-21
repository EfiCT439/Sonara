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

export const MAX_ARTISTS = 4;

// A generated playlist must always land between these bounds.
export const MIN_SONGS = 10;
export const MAX_SONGS = 40;

// The catalog is keyed by MOOD, not genre. Every song listed under a mood belongs
// to that mood, and an artist only appears under a mood they actually record for —
// that is what guarantees a Worship pick can never surface a non-worship track.
// An artist may appear under more than one mood, but only with the songs that fit it.
const MOOD_DEFS = {
  Worship: {
    emoji: '🙏',
    artists: {
      'Sinach': { genre: 'Gospel', emoji: '🙏', songs: ['Way Maker', 'I Know Who I Am', 'Great Are You Lord', 'The Name of Jesus'] },
      'Hillsong Worship': { genre: 'Gospel', emoji: '🕊️', songs: ['Oceans', 'What A Beautiful Name', 'Cornerstone', 'Mighty To Save'] },
      'Bethel Music': { genre: 'Gospel', emoji: '🙌', songs: ['Goodness of God', 'Raise a Hallelujah', 'No Longer Slaves', 'Ever Be'] },
      'Elevation Worship': { genre: 'Gospel', emoji: '⭐', songs: ['Jireh', 'Graves Into Gardens', 'Do It Again', 'See A Victory'] },
      'Nathaniel Bassey': { genre: 'Gospel', emoji: '🎺', songs: ['Onise Iyanu', 'Imela', 'Olowogbogboro', 'Ebenezer'] },
      'Tasha Cobbs': { genre: 'Gospel', emoji: '✝️', songs: ['Break Every Chain', 'For Your Glory', 'You Know My Name', 'Gracefully Broken'] },
      'Mercy Chinwo': { genre: 'Gospel', emoji: '🎶', songs: ['Excess Love', 'Akamdinelu', 'Obinasom', 'Bor Ekom'] },
      'Maverick City Music': { genre: 'Gospel', emoji: '🌟', songs: ['Promises', 'Man of Your Word', 'Jireh My Provider', 'Wait On You'] },
      'Travis Greene': { genre: 'Gospel', emoji: '🙏', songs: ['Intentional', 'Made a Way', 'You Waited', 'Won’t Let Go'] },
      'Don Moen': { genre: 'Gospel', emoji: '🕊️', songs: ['God Will Make a Way', 'Give Thanks', 'I Just Want to Be Where You Are'] },
      'Frank Edwards': { genre: 'Gospel', emoji: '🎹', songs: ['Okaka', 'Under the Canopy', 'Miyanda', 'Chukwu Nnaya'] },
      'Judikay': { genre: 'Gospel', emoji: '✨', songs: ['Man of Galilee', 'Capable God', 'Song of Angels', 'More Than Gold'] },
    },
  },
  Heartbreak: {
    emoji: '💔',
    artists: {
      'Adele': { genre: 'Soul', emoji: '💔', songs: ['Someone Like You', 'Hello', 'Easy On Me', 'Turning Tables'] },
      'Sam Smith': { genre: 'Pop', emoji: '🥀', songs: ['Stay With Me', 'Too Good At Goodbyes', "I'm Not The Only One", 'Lay Me Down'] },
      'Tems': { genre: 'R&B', emoji: '🌧️', songs: ['Free Mind', 'Crazy Tings', 'Higher', 'Damages'] },
      'Bill Withers': { genre: 'Soul', emoji: '☔', songs: ["Ain't No Sunshine", 'Who Is He', "Hope She'll Be Happier"] },
      'Toni Braxton': { genre: 'R&B', emoji: '💧', songs: ['Un-Break My Heart', 'Breathe Again', 'Another Sad Love Song'] },
      'Simi': { genre: 'Afrobeats', emoji: '🥀', songs: ['Joromi', 'Duduke', 'Smile For Me', 'By You'] },
      'Johnny Drille': { genre: 'Afrobeats', emoji: '🎸', songs: ['Wait For Me', 'Shine', 'How Are You (My Friend)', 'Believe Me'] },
      'Whitney Houston': { genre: 'Soul', emoji: '💫', songs: ['I Will Always Love You', 'Didn’t We Almost Have It All', 'Where Do Broken Hearts Go'] },
      'Céline Dion': { genre: 'Pop', emoji: '🌙', songs: ['All By Myself', 'My Heart Will Go On', 'It’s All Coming Back to Me Now'] },
      'Brandy': { genre: 'R&B', emoji: '💜', songs: ['Have You Ever', 'Almost Doesn’t Count', 'Full Moon'] },
    },
  },
  Romance: {
    emoji: '❤️',
    artists: {
      'Miguel': { genre: 'R&B', emoji: '🌹', songs: ['Adorn', 'Sure Thing', 'Come Through', 'Coffee'] },
      'Daniel Caesar': { genre: 'R&B', emoji: '💜', songs: ['Best Part', 'Get You', 'Japanese Denim', 'Blessed'] },
      'Wizkid': { genre: 'Afrobeats', emoji: '💫', songs: ['Essence', 'Come Closer', 'Smile', 'True Love'] },
      'Ella Mai': { genre: 'R&B', emoji: '💞', songs: ["Boo'd Up", 'Trip', 'Shot Clock'] },
      'Al Green': { genre: 'Soul', emoji: '❤️', songs: ["Let's Stay Together", 'Love and Happiness', 'Tired of Being Alone'] },
      'John Legend': { genre: 'Soul', emoji: '🎹', songs: ['All of Me', 'Ordinary People', 'Stay With You', 'Conversations in the Dark'] },
      'Alicia Keys': { genre: 'R&B', emoji: '🎼', songs: ['If I Aint Got You', 'No One', 'Un-thinkable', 'Fallin’'] },
      'Joeboy': { genre: 'Afrobeats', emoji: '💘', songs: ['Baby', 'Beginning', 'Lonely', 'Sip (Alcohol)'] },
      'Chike': { genre: 'Afrobeats', emoji: '🌷', songs: ['Roju', 'Nakupenda', 'Running (To You)', 'Insecure'] },
      'Tiwa Savage': { genre: 'Afrobeats', emoji: '👑', songs: ['All Over', 'Ma Lo', 'Attention', '49-99'] },
    },
  },
  Party: {
    emoji: '🕺',
    artists: {
      'Burna Boy': { genre: 'Afrobeats', emoji: '🔥', songs: ['Last Last', 'Ye', 'On The Low', 'Anybody'] },
      'Davido': { genre: 'Afrobeats', emoji: '🎶', songs: ['Fall', 'If', 'Unavailable', 'Aye'] },
      'Asake': { genre: 'Afrobeats', emoji: '⚡', songs: ['Sability', 'Terminator', 'Joha', 'Palazzo'] },
      'Rema': { genre: 'Afrobeats', emoji: '🌙', songs: ['Calm Down', 'Dumebi', 'Woman'] },
      'Kabza De Small': { genre: 'Amapiano', emoji: '🎹', songs: ['Adiwele', 'Izolo', 'Sponono'] },
      'DJ Maphorisa': { genre: 'Amapiano', emoji: '🔊', songs: ['Lengoma', 'Nkulunkulu', 'Banyana'] },
      'Olamide': { genre: 'Afrobeats', emoji: '🎤', songs: ['Wo!!', 'Science Student', 'Rock', 'Infinity'] },
      'Kizz Daniel': { genre: 'Afrobeats', emoji: '💃', songs: ['Buga', 'Cough', 'Odo', 'Pour Me Water'] },
      'Focalistic': { genre: 'Amapiano', emoji: '🕺', songs: ['Ke Star', 'Gupta', 'Sheshalaza'] },
      'Diamond Platnumz': { genre: 'Afrobeats', emoji: '🎵', songs: ['Jeje', 'Waah!', 'Number One', 'Iyo'] },
      'Shatta Wale': { genre: 'Afrobeats', emoji: '🎵', songs: ['On God', 'My Level', 'Already', 'Bad Man'] },
    },
  },
  Chill: {
    emoji: '😌',
    artists: {
      'Sade': { genre: 'Soul', emoji: '🌊', songs: ['Smooth Operator', 'No Ordinary Love', 'By Your Side'] },
      'Norah Jones': { genre: 'Jazz', emoji: '☕', songs: ["Don't Know Why", 'Come Away With Me', 'Sunrise'] },
      'Yiruma': { genre: 'Instrumental', emoji: '🎹', songs: ['River Flows in You', 'Kiss the Rain', 'Maybe'] },
      'Einaudi': { genre: 'Instrumental', emoji: '☁️', songs: ['Experience', 'Nuvole Bianche', 'Una Mattina'] },
      'Bill Evans': { genre: 'Jazz', emoji: '🍂', songs: ['Autumn Leaves', 'Peace Piece', 'Waltz for Debby'] },
      'Jhené Aiko': { genre: 'R&B', emoji: '🌙', songs: ['Sativa', 'While Were Young', 'Bed Peace', 'Spotless Mind'] },
      'Tom Misch': { genre: 'Jazz', emoji: '🎸', songs: ['It Runs Through Me', 'Movie', 'Disco Yes', 'Water Baby'] },
      'Masego': { genre: 'Jazz', emoji: '🎷', songs: ['Tadow', 'Navajo', 'Queen Tings', 'Mystery Lady'] },
      'Bonobo': { genre: 'Instrumental', emoji: '🌿', songs: ['Kerala', 'Cirrus', 'Kiara', 'Break Apart'] },
      'Lianne La Havas': { genre: 'Soul', emoji: '🍃', songs: ['Green & Gold', 'Bittersweet', 'Weird Fishes', 'Is Your Love Big Enough?'] },
    },
  },
  Happy: {
    emoji: '😄',
    artists: {
      'Pharrell Williams': { genre: 'Pop', emoji: '😄', songs: ['Happy', 'Freedom', 'Come Get It Bae'] },
      'Bob Marley': { genre: 'Reggae', emoji: '🌿', songs: ['Three Little Birds', 'One Love', 'Is This Love'] },
      'Ed Sheeran': { genre: 'Pop', emoji: '🎵', songs: ['Shape of You', 'Sing', 'Galway Girl'] },
      'Justin Bieber': { genre: 'Pop', emoji: '🍑', songs: ['Stay', 'Peaches', 'Yummy'] },
      'Daphne': { genre: 'Afrobeats', emoji: '💃', songs: ['Njama Njama', 'No Stress', 'Calee'] },
      'Bruno Mars': { genre: 'Pop', emoji: '🌞', songs: ['Uptown Funk', '24K Magic', 'Treasure', 'Finesse'] },
      'Sauti Sol': { genre: 'Afrobeats', emoji: '🎊', songs: ['Sura Yako', 'Melanin', 'Suzanna', 'Short N Sweet'] },
      'Fally Ipupa': { genre: 'Afrobeats', emoji: '🕺', songs: ['Eloko Oyo', 'Original', 'Kiname', 'Bloqué'] },
      'Mr Eazi': { genre: 'Afrobeats', emoji: '🌴', songs: ['Leg Over', 'Pour Me Water', 'Property', 'Overload'] },
      'Teni': { genre: 'Afrobeats', emoji: '🎈', songs: ['Case', 'Uyo Meyo', 'Billionaire', 'Askamaya'] },
    },
  },
  Sad: {
    emoji: '😢',
    artists: {
      'Billie Eilish': { genre: 'Pop', emoji: '🖤', songs: ["when the party's over", 'everything i wanted', 'Happier Than Ever'] },
      'Lewis Capaldi': { genre: 'Pop', emoji: '😢', songs: ['Someone You Loved', 'Before You Go', 'Bruises'] },
      'Johnny Cash': { genre: 'Country', emoji: '🕯️', songs: ['Hurt', 'I See a Darkness', 'Give My Love to Rose'] },
      'Charlotte Dipanda': { genre: 'Soul', emoji: '💧', songs: ['Mama', "Elle n'a pas", 'Ndolo Bukate'] },
      'Otis Redding': { genre: 'Soul', emoji: '🌊', songs: ['Dock of the Bay', "I've Been Loving You Too Long", 'Cigarettes and Coffee'] },
      'Hozier': { genre: 'Rock', emoji: '🍂', songs: ['Cherry Wine', 'Work Song', 'Shrike', 'Movement'] },
      'Damien Rice': { genre: 'Rock', emoji: '🕯️', songs: ['9 Crimes', 'The Blowers Daughter', 'Cannonball', 'Delicate'] },
      'Asa': { genre: 'Soul', emoji: '💧', songs: ['Jailer', 'Fire on the Mountain', 'Bibanke', 'So Beautiful'] },
      'Adekunle Gold': { genre: 'Afrobeats', emoji: '🌧️', songs: ['Pick Up', 'Ire', 'Orente', 'Damn Delilah'] },
      'Yebba': { genre: 'Soul', emoji: '🖤', songs: ['Distance', 'My Mind', 'Evergreen', 'Boomerang'] },
    },
  },
  Workout: {
    emoji: '💪',
    artists: {
      'Kendrick Lamar': { genre: 'Hip Hop', emoji: '👑', songs: ['HUMBLE', 'DNA', 'Alright', 'King Kunta'] },
      'Travis Scott': { genre: 'Hip Hop', emoji: '🌀', songs: ['Sicko Mode', 'Goosebumps', 'Antidote'] },
      'Eminem': { genre: 'Hip Hop', emoji: '🔥', songs: ['Lose Yourself', 'Till I Collapse', 'Not Afraid'] },
      'AC/DC': { genre: 'Rock', emoji: '⚡', songs: ['Back in Black', 'Thunderstruck', 'Highway to Hell'] },
      'Busta 929': { genre: 'Amapiano', emoji: '🏋️', songs: ['Umsebenzi Wethu', 'Ngixolele', 'Bunga Beke'] },
      'Drake': { genre: 'Hip Hop', emoji: '🦉', songs: ['Nonstop', 'Started From the Bottom', 'Energy', 'Forever'] },
      'Nasty C': { genre: 'Hip Hop', emoji: '💥', songs: ['Jack', 'SMA', 'Hell Naw', 'Strings and Bling'] },
      'Cassper Nyovest': { genre: 'Hip Hop', emoji: '🏆', songs: ['Doc Shebeleza', 'Tito Mboweni', 'Gets Getsa', 'Ksazobalit'] },
      '50 Cent': { genre: 'Hip Hop', emoji: '🎯', songs: ['In Da Club', 'Many Men', 'Patiently Waiting', 'Ill Still Kill'] },
      'DMX': { genre: 'Hip Hop', emoji: '🐺', songs: ['X Gon Give It To Ya', 'Ruff Ryders Anthem', 'Party Up', 'Where the Hood At'] },
    },
  },
  Focus: {
    emoji: '🎯',
    artists: {
      'Debussy': { genre: 'Instrumental', emoji: '🌙', songs: ['Clair de Lune', 'Arabesque No. 1', 'Reverie'] },
      'Yann Tiersen': { genre: 'Instrumental', emoji: '🎼', songs: ['Comptine', "La Valse d'Amelie", 'Summer 78'] },
      'Max Richter': { genre: 'Instrumental', emoji: '📖', songs: ['On the Nature of Daylight', 'Written on the Sky', 'Vladimir Blues'] },
      'Miles Davis': { genre: 'Jazz', emoji: '🎺', songs: ['So What', 'Blue in Green', 'Flamenco Sketches'] },
      'Dave Brubeck': { genre: 'Jazz', emoji: '🎷', songs: ['Take Five', 'Blue Rondo à la Turk', 'Unsquare Dance'] },
      'Chopin': { genre: 'Instrumental', emoji: '🎹', songs: ['Nocturne Op. 9 No. 2', 'Prelude in E Minor', 'Ballade No. 1', 'Fantaisie-Impromptu'] },
      'Erik Satie': { genre: 'Instrumental', emoji: '☁️', songs: ['Gymnopédie No. 1', 'Gnossienne No. 1', 'Je te veux'] },
      'Nils Frahm': { genre: 'Instrumental', emoji: '🎧', songs: ['Says', 'Ambre', 'Re', 'Hammers'] },
      'Ólafur Arnalds': { genre: 'Instrumental', emoji: '❄️', songs: ['Near Light', 'Saman', 'Þú Ert Sólin', 'Only the Winds'] },
      'John Coltrane': { genre: 'Jazz', emoji: '🎼', songs: ['Naima', 'In a Sentimental Mood', 'Blue Train', 'Equinox'] },
    },
  },
  Throwback: {
    emoji: '📼',
    artists: {
      'Queen': { genre: 'Rock', emoji: '👑', songs: ['Bohemian Rhapsody', "Don't Stop Me Now", 'Somebody To Love'] },
      'Michael Jackson': { genre: 'Pop', emoji: '🕺', songs: ['Billie Jean', 'Thriller', 'Beat It', 'Smooth Criminal'] },
      'Eagles': { genre: 'Rock', emoji: '🏨', songs: ['Hotel California', 'Take It Easy', 'Desperado'] },
      'Stevie Wonder': { genre: 'Soul', emoji: '✨', songs: ['Superstition', 'Sir Duke', "Isn't She Lovely"] },
      'Aretha Franklin': { genre: 'Soul', emoji: '🎤', songs: ['Respect', 'I Say a Little Prayer', 'Think'] },
      'Dolly Parton': { genre: 'Country', emoji: '🤠', songs: ['Jolene', '9 to 5', 'Coat of Many Colors'] },
      'Fela Kuti': { genre: 'Afrobeats', emoji: '🎺', songs: ['Zombie', 'Water No Get Enemy', 'Lady', 'Sorrow Tears and Blood'] },
      'Brenda Fassie': { genre: 'Pop', emoji: '🌍', songs: ['Vulindlela', 'Weekend Special', 'Too Late for Mama'] },
      'Koffi Olomide': { genre: 'Afrobeats', emoji: '🎊', songs: ['Loi', 'Selfie', 'Papa Bonheur', 'Ninja'] },
      'Awilo Longomba': { genre: 'Afrobeats', emoji: '🥁', songs: ['Coupé Bibamba', 'Karolina', 'Bundelele'] },
    },
  },
};

// Expand the definitions into real song objects once, at module scope, so ids and
// audio urls stay stable across re-renders (never generate these inside a render).
const MOOD_CATALOG = (() => {
  const out = {};
  let n = 0;
  Object.entries(MOOD_DEFS).forEach(([mood, def]) => {
    out[mood] = Object.entries(def.artists).map(([name, a]) => ({
      name,
      emoji: a.emoji,
      genre: a.genre,
      songs: a.songs.map((title) => {
        n += 1;
        return {
          id: `mp_${n}`,
          title,
          artist: name,
          mood,
          genre: a.genre,
          emoji: a.emoji,
          audioUrl: AU((n % 7) + 1),
        };
      }),
    }));
  });
  return out;
})();

const MOODS = Object.keys(MOOD_DEFS).map(key => ({ key, emoji: MOOD_DEFS[key].emoji }));
const MOOD_EMOJI = Object.fromEntries(MOODS.map(m => [m.key, m.emoji]));

// Build the playlist from the selected artists' songs for the chosen mood.
//
// Every song is drawn from the chosen mood — that rule is absolute and holds on
// both passes below. The playlist must also land between MIN_SONGS and MAX_SONGS,
// and a single artist only carries 3-4 tracks, so when the picked artists can't
// reach the floor we top up from OTHER artists of the same mood (never another
// mood). The selected artists' songs always come first.
const buildPlaylist = (mood, artistNames) => {
  const roster = MOOD_CATALOG[mood] || [];
  const names = artistNames || [];
  const picked = roster.filter(a => names.includes(a.name));

  // Gate on what the names actually RESOLVE to, not on the array being non-empty:
  // no recognised artist means no playlist. The top-up below exists to support a
  // real selection that falls short of the floor, never to invent one from nothing.
  if (picked.length === 0) return [];

  const seen = new Set();
  const out = [];

  const take = (artist, limit) => {
    artist.songs.forEach(s => {
      if (out.length >= limit) return;
      if (s.mood === mood && !seen.has(s.id)) { seen.add(s.id); out.push(s); }
    });
  };

  picked.forEach(a => take(a, MAX_SONGS));

  if (out.length < MIN_SONGS) {
    roster.filter(a => !names.includes(a.name)).forEach(a => take(a, MIN_SONGS));
  }

  return out.slice(0, MAX_SONGS);
};

const CYCLE = [
  'Reading the mood…',
  'Gathering your artists…',
  'Pulling their tracks…',
  'Sequencing the flow…',
  'Finishing your playlist…',
];

// ─── Module-scope sub-components (keyboard-bug rule) ─────────────────────────
function MoodChip({ styles, c, mood, selected, onPress }) {
  return (
    <TouchableOpacity style={[styles.moodChip, selected && styles.moodChipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
      <Text style={[styles.moodChipText, selected && styles.moodChipTextActive]}>{mood.key}</Text>
    </TouchableOpacity>
  );
}

function ArtistCard({ styles, c, artist, selected, onPress }) {
  return (
    <TouchableOpacity style={[styles.artistCard, selected && styles.artistCardActive]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.artistArt, selected && styles.artistArtActive]}>
        {artist.imageUrl
          ? <Image source={{ uri: artist.imageUrl }} style={styles.artistArtImg} />
          : <Text style={styles.artistArtEmoji}>{artist.emoji}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.artistName, selected && styles.artistNameActive]} numberOfLines={1}>{artist.name}</Text>
        <Text style={styles.artistMeta} numberOfLines={1}>{artist.songs.length} songs · {artist.genre}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? c.accentText : c.textFaint}
      />
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AIPlaylistScreen({ navigation }) {
  const { loadAndPlay, createGeneratedPlaylist } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);

  const [step, setStep] = useState('form'); // form | generating | result
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [artistQuery, setArtistQuery] = useState('');

  const [result, setResult] = useState(null); // { name, mood, songs, artists }
  const [savedMsg, setSavedMsg] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);

  const pulse = useRef(new Animated.Value(1)).current;
  const genTimer = useRef(null);

  const roster = selectedMood ? (MOOD_CATALOG[selectedMood] || []) : [];
  const canGenerate = !!selectedMood && selectedArtists.length > 0;

  // Search only ever narrows this mood's roster. An artist outside it has no
  // songs for this mood in the catalog, so surfacing them would only produce a
  // pick that contributes nothing — the empty state says so plainly instead.
  const q = artistQuery.trim().toLowerCase();
  const visibleRoster = q ? roster.filter(a => a.name.toLowerCase().includes(q)) : roster;

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
      const songs = buildPlaylist(selectedMood, selectedArtists);
      setResult({
        name: `${selectedMood} Mix`,
        mood: selectedMood,
        artists: [...selectedArtists],
        songs,
      });
      setStep('result');
    }, 2600);

    return () => { clearInterval(iv); loop.stop(); if (genTimer.current) clearTimeout(genTimer.current); };
  }, [step]);

  // Picking a mood resets the artist picks — a roster is only valid for its own mood.
  const pickMood = (key) => {
    setSelectedMood(key);
    setSelectedArtists([]);
    setArtistQuery('');
  };

  const toggleArtist = (name) => {
    setSelectedArtists(prev => {
      if (prev.includes(name)) return prev.filter(a => a !== name);
      if (prev.length >= MAX_ARTISTS) {
        Alert.alert('Up to 4 artists', `You can pick between 1 and ${MAX_ARTISTS} artists. Remove one to add another.`);
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleGenerate = () => {
    if (!canGenerate) {
      Alert.alert('Almost there', 'Pick a mood, then choose 1 to 4 artists.');
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
            <Ionicons name="arrow-back" size={20} color={c.icon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Playlist Generator</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <Text style={styles.intro}>Pick a mood, choose the artists you want, and we'll build the playlist.</Text>

          <Text style={styles.fieldLabel}>1 · Pick a mood</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(m => (
              <MoodChip styles={styles} c={c}
                key={m.key}
                mood={m}
                selected={selectedMood === m.key}
                onPress={() => pickMood(m.key)}
              />
            ))}
          </View>

          {selectedMood && (
            <>
              <Text style={styles.fieldLabel}>
                2 · Choose artists  ·  {selectedArtists.length}/{MAX_ARTISTS}
              </Text>
              <Text style={styles.artistHint}>
                {selectedMood} artists only — pick between 1 and {MAX_ARTISTS}.
              </Text>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={15} color={c.textFaint} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${selectedMood} artists`}
                  placeholderTextColor={c.textFaint}
                  value={artistQuery}
                  onChangeText={setArtistQuery}
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                {artistQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setArtistQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={15} color={c.textFaint} />
                  </TouchableOpacity>
                )}
              </View>

              {visibleRoster.length === 0 ? (
                <View style={styles.noArtist}>
                  <Ionicons name="person-outline" size={26} color={c.textFaint} />
                  <Text style={styles.noArtistTitle}>No {selectedMood} artist called “{artistQuery.trim()}”</Text>
                  <Text style={styles.noArtistSub}>
                    Sonara has no {selectedMood.toLowerCase()} songs for that artist yet, so they can’t be added to this
                    playlist. Try another name, or clear the search to see all {roster.length} {selectedMood.toLowerCase()} artists.
                  </Text>
                </View>
              ) : (
                <View style={styles.artistList}>
                  {visibleRoster.map(a => (
                    <ArtistCard styles={styles} c={c}
                      key={a.name}
                      artist={a}
                      selected={selectedArtists.includes(a.name)}
                      onPress={() => toggleArtist(a.name)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color={canGenerate ? c.accentText : c.textFaint} />
            <Text style={[styles.generateBtnText, !canGenerate && styles.generateBtnTextDisabled]}>Generate Playlist</Text>
          </TouchableOpacity>

          <Text style={styles.footNote}>
            {!selectedMood
              ? 'Choose a mood to see its artists'
              : selectedArtists.length === 0
                ? `Pick 1 to ${MAX_ARTISTS} ${selectedMood} artists`
                : `Building a ${selectedMood} playlist from ${selectedArtists.length} artist${selectedArtists.length === 1 ? '' : 's'}`}
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
          <Ionicons name="sparkles" size={40} color={c.icon} />
        </Animated.View>
        <Text style={styles.genTitle}>Generating your playlist</Text>
        <Text style={styles.genSub}>{selectedMood} · {selectedArtists.length} artist{selectedArtists.length === 1 ? '' : 's'}</Text>
        <Text style={styles.genMsg}>{CYCLE[msgIdx]}</Text>
      </View>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={c.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Playlist</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View style={styles.resultHero}>
          <View style={styles.resultArt}>
            <Text style={styles.resultArtEmoji}>{MOOD_EMOJI[result.mood] || '✨'}</Text>
          </View>
          <Text style={styles.resultName} numberOfLines={2}>{result.name}</Text>
          <Text style={styles.resultCount}>{result.songs.length} songs · {result.artists.join(', ')}</Text>
        </View>

        {savedMsg ? (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={15} color={c.text} />
            <Text style={styles.savedText}>{savedMsg}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.playAllBtn} onPress={playAll} activeOpacity={0.85}>
            <Ionicons name="play" size={17} color={c.accentText} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={savePlaylist} activeOpacity={0.85}>
            <Ionicons name="bookmark-outline" size={17} color={c.icon} />
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
              <Text style={styles.songArtist} numberOfLines={1}>{song.artist} · {song.mood}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={24} color={c.textFaint} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.againBtn} onPress={startOver} activeOpacity={0.75}>
          <Ionicons name="refresh" size={16} color={c.textDim} />
          <Text style={styles.againText}>Generate Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: c.text },

  formScroll: { paddingHorizontal: 20 },
  intro: { color: c.textDim, fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 4, marginBottom: 8 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: c.textDim,
    textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 24, marginBottom: 14,
  },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border,
  },
  moodChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  moodEmoji: { fontSize: 16 },
  moodChipText: { color: c.textDim, fontSize: 13.5, fontWeight: '700' },
  moodChipTextActive: { color: c.accentText },

  artistHint: { color: c.textFaint, fontSize: 12.5, fontWeight: '600', marginTop: -6, marginBottom: 14 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600', padding: 0 },

  noArtist: {
    alignItems: 'center', paddingVertical: 26, paddingHorizontal: 10,
    backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.border,
  },
  noArtistTitle: { color: c.textDim, fontSize: 14, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  noArtistSub: { color: c.textFaint, fontSize: 12.5, fontWeight: '600', lineHeight: 18, marginTop: 6, textAlign: 'center' },

  artistList: { gap: 10 },
  artistCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 12, borderRadius: 14,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  artistCardActive: { backgroundColor: c.accent, borderColor: c.accent },
  artistArt: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  artistArtActive: { backgroundColor: '#EEE' },
  artistArtImg: { width: '100%', height: '100%' },
  artistArtEmoji: { fontSize: 22 },
  artistName: { color: c.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  artistNameActive: { color: c.accentText },
  artistMeta: { color: c.textDim, fontSize: 12, fontWeight: '600', marginTop: 3 },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.accent, paddingVertical: 16, borderRadius: 14,
    marginTop: 30, marginBottom: 14,
  },
  generateBtnDisabled: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  generateBtnText: { color: c.accentText, fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  generateBtnTextDisabled: { color: c.textFaint },
  footNote: { color: c.textFaint, fontSize: 12, textAlign: 'center', fontWeight: '600' },

  // Generating
  genOrb: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    marginBottom: 36, borderWidth: 1, borderColor: c.borderStrong,
  },
  genTitle: { fontSize: 19, fontWeight: '800', color: c.text, textAlign: 'center', marginBottom: 6 },
  genSub: { fontSize: 14, color: c.textDim, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  genMsg: { fontSize: 14, color: c.textFaint, fontWeight: '600', textAlign: 'center' },

  // Result
  resultHero: { alignItems: 'center', marginTop: 4, marginBottom: 22 },
  resultArt: {
    width: 130, height: 130, borderRadius: 24, backgroundColor: c.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: c.border,
  },
  resultArtEmoji: { fontSize: 60 },
  resultName: { color: c.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' },
  resultCount: { color: c.textDim, fontSize: 13, fontWeight: '700', marginTop: 6, textAlign: 'center' },

  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: c.elevated, borderRadius: 12,
    paddingVertical: 10, marginBottom: 16,
  },
  savedText: { color: c.text, fontSize: 13, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  playAllBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: c.accent,
  },
  playAllText: { color: c.accentText, fontSize: 15, fontWeight: '800' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  saveText: { color: c.text, fontSize: 15, fontWeight: '800' },

  songRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  songIdx: { color: c.textDim, fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  songArt: {
    width: 48, height: 48, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  songArtImg: { width: '100%', height: '100%', borderRadius: 11 },
  songArtEmoji: { fontSize: 22 },
  songTitle: { color: c.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  songArtist: { color: c.textDim, fontSize: 12.5, fontWeight: '600', marginTop: 3 },

  againBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, marginTop: 8 },
  againText: { color: c.textDim, fontSize: 14, fontWeight: '700' },
});
