// Maps backend documents onto the shape the screens render.
//
// The two models drift in three ways: Mongo uses `_id`, `artist` arrives as a
// populated document rather than a name, and artwork is `coverImage`. The screens
// also render an `emoji` whenever a song has no artwork, and the backend has no
// such field — so it is derived from the genre here. Every seeded song currently
// has an empty `coverImage`, which makes that fallback the common path, not an
// edge case.
//
// Genres span three disjoint sets today (SearchScreen's 16, HomeScreen's 8, and
// the 7 in the seed), so this map covers their union. Keep it in sync when adding
// a genre anywhere.
const GENRE_EMOJI = {
  Afrobeats: '🥁', 'Hip Hop': '🎤', Rap: '🎙️', Amapiano: '🎧',
  Pop: '⭐', Gospel: '🙏', Praise: '☀️', Worship: '✨',
  Rock: '🎸', Reggae: '🌿', Radio: '📻', Country: '🤠',
  Decades: '⏰', Jazz: '🎷', Classic: '🎻', Instrumental: '🎹',
  'R&B': '💜', Soul: '🎺',
};

const DEFAULT_EMOJI = '🎵';

export function emojiForGenre(genre) {
  return GENRE_EMOJI[genre] || DEFAULT_EMOJI;
}

// Mongo sends '' for unset strings; the screens test these fields for truthiness
// and must not receive an empty string that reads as "present but blank".
const clean = (value) => (value ? value : undefined);

export function normalizeSong(raw) {
  if (!raw) return null;
  const artist = raw.artist;
  return {
    id: raw._id || raw.id,
    title: raw.title,
    // `artist` is populated on every songs route, but a lean query would leave a
    // bare ObjectId behind — which must not be rendered as a name.
    artist: typeof artist === 'string' ? undefined : artist?.name,
    artistId: typeof artist === 'string' ? artist : artist?._id,
    genre: raw.genre,
    emoji: emojiForGenre(raw.genre),
    audioUrl: raw.audioUrl,
    imageUrl: clean(raw.coverImage),
    videoUrl: clean(raw.videoUrl),
    album: clean(raw.album),
    duration: raw.duration,
    lyrics: clean(raw.lyrics),
    isPremium: raw.isPremium === true,
  };
}

export function normalizeArtist(raw) {
  if (!raw) return null;
  const id = raw._id || raw.id;
  // GET /artists leaves `songs` as bare ObjectIds; only GET /artists/:id populates
  // them. Skip the unpopulated ids rather than mapping them into empty songs. That
  // route also populates songs without their artist, so backfill the name we know
  // from the parent.
  const songs = Array.isArray(raw.songs)
    ? raw.songs
        .filter((song) => song && typeof song === 'object')
        .map((song) => ({ ...normalizeSong(song), artist: raw.name, artistId: id }))
    : [];
  return {
    id,
    name: raw.name,
    genre: raw.genre,
    emoji: emojiForGenre(raw.genre),
    imageUrl: clean(raw.image),
    bio: clean(raw.bio),
    followers: raw.followers || 0,
    songs,
  };
}

export const normalizeSongs = (list) => (Array.isArray(list) ? list.map(normalizeSong).filter(Boolean) : []);
export const normalizeArtists = (list) => (Array.isArray(list) ? list.map(normalizeArtist).filter(Boolean) : []);
