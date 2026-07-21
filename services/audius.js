// Audius — free, full-length, legally streamable music with NO API key and NO
// signup. The only credential is an app_name string. Tracks are independent
// artists (not major-label catalog).
//
// Usage:
//   import { searchAudius, audiusTrending } from '../services/audius';
//   const songs = await searchAudius('afrobeats');   // Sonara-shaped song objects
//
// Every returned object matches the shape the screens render:
//   { id, title, artist, genre, emoji, audioUrl, imageUrl, duration }
// so it can drop straight into loadAndPlay / SongItem / etc.

const APP_NAME = 'Sonara';
// api.audius.co is both the discovery endpoint and a valid host; we resolve a
// concrete host from it once and cache it, falling back to api.audius.co.
const BOOTSTRAP = 'https://api.audius.co';
const FALLBACK_HOST = 'https://api.audius.co';

let cachedHost = null;

async function getHost() {
  if (cachedHost) return cachedHost;
  try {
    const res = await fetch(BOOTSTRAP, { headers: { Accept: 'application/json' } });
    const json = await res.json();
    const hosts = Array.isArray(json?.data) ? json.data : [];
    cachedHost = hosts[0] || FALLBACK_HOST;
  } catch {
    cachedHost = FALLBACK_HOST;
  }
  return cachedHost;
}

const q = (params) =>
  Object.entries({ app_name: APP_NAME, ...params })
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

// Map an Audius track to the app's song shape. The stream endpoint 302-redirects
// to a signed CDN mp3; expo-av follows it, so it's a stable audioUrl to store.
export function normalizeAudiusTrack(t, host) {
  if (!t || !t.id) return null;
  const art = t.artwork || {};
  return {
    id: `audius_${t.id}`,
    audiusId: t.id,
    title: t.title || 'Untitled',
    artist: t.user?.name || t.user?.handle || 'Unknown Artist',
    genre: t.genre || '',
    emoji: '🎵',
    audioUrl: `${host}/v1/tracks/${t.id}/stream?${q({})}`,
    imageUrl: art['480x480'] || art['1000x1000'] || art['150x150'] || undefined,
    duration: t.duration || 0,
    playCount: t.play_count || 0,
  };
}

// Words that mark a track as NOT the original recording. When the user didn't ask
// for them, they're penalised so the real song ranks above remixes/covers/edits.
const VARIANT_WORDS = [
  'remix', 'cover', 'type beat', 'instrumental', 'karaoke', 'sped up', 'slowed',
  'reverb', 'edit', 'flip', 'mashup', 'live', 'acoustic', '8d', 'lofi', 'lo-fi',
  'nightcore', 'bootleg', 'rework', 'version', 'tribute', 'refix', 'freestyle',
];

// Rank a raw track for a query. The exact original — title matches, artist matches —
// ranks highest; variants (remix/cover/etc.) are pushed below it unless the user
// actually searched for one. Popularity breaks ties toward the better uploads.
function scoreTrack(t, terms, rawQuery) {
  const title = (t.title || '').toLowerCase();
  const artist = (t.user?.name || t.user?.handle || '').toLowerCase();
  let s = 0;

  if (title === rawQuery) s += 300;                 // perfect title match
  else if (title.startsWith(rawQuery)) s += 120;    // "Essence (feat. …)" style
  else if (title.includes(rawQuery)) s += 60;

  for (const w of terms) {
    if (title.includes(w)) s += 14;
    if (artist.includes(w)) s += 12;                // artist match matters a lot
  }
  // every query word present in the title -> looks like the real song
  if (terms.length && terms.every((w) => title.includes(w))) s += 40;

  // demote variants the user didn't ask for
  for (const v of VARIANT_WORDS) {
    if (title.includes(v) && !rawQuery.includes(v)) s -= 60;
  }

  s += Math.min((t.play_count || 0) / 500, 30);     // popularity, capped
  return s;
}

async function fetchRaw(path, params) {
  const host = await getHost();
  try {
    const res = await fetch(`${host}${path}?${q(params)}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { host, list: [] };
    const json = await res.json();
    const list = (Array.isArray(json?.data) ? json.data : []).filter((t) => t.is_streamable !== false);
    return { host, list };
  } catch {
    return { host, list: [] };
  }
}

// Full-text search, RANKED by relevance + popularity so the closest, best-quality
// match comes first. Returns [] on any failure so callers can fall back to local data.
export async function searchAudius(query, limit = 20) {
  const term = (query || '').trim();
  if (!term) return [];
  // Over-fetch, then rank, so a loosely-relevant top result from Audius doesn't
  // bury the actual match.
  const { host, list } = await fetchRaw('/v1/tracks/search', { query: term, limit: Math.max(limit, 15) });
  const terms = term.toLowerCase().split(/\s+/).filter(Boolean);
  const rawQuery = term.toLowerCase();
  const ranked = [...list].sort((a, b) => scoreTrack(b, terms, rawQuery) - scoreTrack(a, terms, rawQuery));
  return ranked.slice(0, limit).map((t) => normalizeAudiusTrack(t, host)).filter(Boolean);
}

// Trending, optionally within a genre (e.g. 'Afrobeats', 'Hip-Hop', 'Electronic').
export async function audiusTrending(genre, limit = 20) {
  const { host, list } = await fetchRaw('/v1/tracks/trending', { genre, limit });
  return list.map((t) => normalizeAudiusTrack(t, host)).filter(Boolean);
}

// True for the stable /stream endpoint URLs we store as audioUrl.
export const isAudiusStreamUrl = (url) =>
  typeof url === 'string' && url.includes('/v1/tracks/') && url.includes('/stream');

// The /stream endpoint 302-redirects to a signed CDN mp3, but that redirect
// response carries no Content-Type, which the native players (AVPlayer/ExoPlayer)
// can choke on. Resolving the final URL ourselves and handing the player a direct
// audio/mpeg URL is what makes playback reliable. A HEAD follows the redirect
// without downloading the audio; response.url is the resolved direct URL.
// Falls back to the original URL so a resolve failure just lets the player try.
export async function resolveAudiusStream(streamUrl) {
  if (!isAudiusStreamUrl(streamUrl)) return streamUrl;
  try {
    // HEAD follows the redirect cheaply; response.url is the resolved direct URL.
    let res = await fetch(streamUrl, { method: 'HEAD' });
    if (res?.url && res.url !== streamUrl) return res.url;
    // Some RN networking stacks don't surface the redirect on HEAD — force it with
    // a 1-byte ranged GET, which definitely follows and sets response.url.
    res = await fetch(streamUrl, { headers: { Range: 'bytes=0-1' } });
    return res?.url && res.url !== streamUrl ? res.url : streamUrl;
  } catch {
    return streamUrl;
  }
}

// Match a placeholder/local song to a real Audius track by title/artist/genre, and
// cache the (stable) stream endpoint per song id. The signed direct URL is minted
// fresh on each play by resolveAudiusStream, so only the endpoint is cached.
const matchCache = new Map(); // song.id -> stream endpoint | null

async function matchedEndpoint(song) {
  if (song.id && matchCache.has(song.id)) return matchCache.get(song.id);
  const tries = [
    `${song.artist || ''} ${song.title || ''}`,
    song.title,
    song.genre,
  ].map((s) => (s || '').trim()).filter(Boolean);
  let endpoint = null;
  for (const term of tries) {
    const r = await searchAudius(term, 1);
    if (r[0]) { endpoint = r[0].audioUrl; break; }
  }
  if (song.id) matchCache.set(song.id, endpoint);
  return endpoint;
}

// The single entry point the audio engine calls: returns a directly-playable URL
// for ANY song. Audius endpoints resolve to their direct file; the placeholder
// (soundhelix) catalog is matched to a real Audius track; real non-placeholder
// URLs pass through untouched.
export async function resolvePlayableUrl(song) {
  if (!song) return null;
  const url = song.audioUrl || '';
  if (isAudiusStreamUrl(url)) return resolveAudiusStream(url);
  const isPlaceholder = !url || url.includes('soundhelix.com');
  if (!isPlaceholder) return url;
  const endpoint = await matchedEndpoint(song);
  return endpoint ? resolveAudiusStream(endpoint) : url;
}

// A single track by its Audius id (the bare id, without the "audius_" prefix).
export async function getAudiusTrack(audiusId) {
  const host = await getHost();
  try {
    const res = await fetch(`${host}/v1/tracks/${audiusId}?${q({})}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizeAudiusTrack(json?.data, host);
  } catch {
    return null;
  }
}
