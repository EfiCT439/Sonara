// Jamendo — free, full-length, legally streamable music via a self-serve API key
// (a public `client_id`, obtained free at https://devportal.jamendo.com). Tracks are
// independent / Creative Commons artists (not major-label catalog), and — unlike
// Audius — the API hands back a DIRECT mp3 URL, so there's no redirect to resolve.
//
// This service is a drop-in replacement for services/audius.js: it exports the same
// resolvePlayableUrl(song) the audio engine calls, plus searchJamendo / jamendoTrending.
//
// Every returned object matches the shape the screens render:
//   { id, title, artist, genre, emoji, audioUrl, imageUrl, duration }
// so it drops straight into loadAndPlay / SongItem / etc.

import { JAMENDO_CLIENT_ID } from '../jamendoConfig';

const BASE = 'https://api.jamendo.com/v3.0';
// mp32 = ~higher-bitrate mp3; audio field is a direct, streamable file URL.
const AUDIO_FORMAT = 'mp32';

export const hasJamendoKey = () => !!(JAMENDO_CLIENT_ID && JAMENDO_CLIENT_ID.trim() && JAMENDO_CLIENT_ID !== 'YOUR_JAMENDO_CLIENT_ID');

const q = (params) =>
  Object.entries({ client_id: JAMENDO_CLIENT_ID, format: 'json', ...params })
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

// Map a Jamendo track to the app's song shape. `audio` is already a direct mp3 URL.
export function normalizeJamendoTrack(t) {
  if (!t || !t.id) return null;
  const genres = t.musicinfo?.tags?.genres;
  return {
    id: `jamendo_${t.id}`,
    jamendoId: t.id,
    title: t.name || 'Untitled',
    artist: t.artist_name || 'Unknown Artist',
    genre: Array.isArray(genres) && genres.length ? genres[0] : '',
    emoji: '🎵',
    audioUrl: t.audio || undefined,
    imageUrl: t.album_image || t.image || undefined,
    duration: (t.duration || 0) * 1000, // Jamendo gives seconds; app uses ms
    downloadUrl: t.audiodownload || undefined,
  };
}

// Words that mark a track as NOT the original recording. When the user didn't ask
// for them, they're penalised so the real song ranks above remixes/covers/edits.
const VARIANT_WORDS = [
  'remix', 'cover', 'type beat', 'instrumental', 'karaoke', 'sped up', 'slowed',
  'reverb', 'edit', 'flip', 'mashup', 'live', 'acoustic', '8d', 'lofi', 'lo-fi',
  'nightcore', 'bootleg', 'rework', 'version', 'tribute', 'refix', 'freestyle',
];

// Rank a raw track for a query. The exact original — title + artist match — ranks
// highest; variants are pushed below unless the user actually searched for one.
// Popularity breaks ties toward the better uploads.
function scoreTrack(t, terms, rawQuery) {
  const title = (t.name || '').toLowerCase();
  const artist = (t.artist_name || '').toLowerCase();
  let s = 0;

  if (title === rawQuery) s += 300;
  else if (title.startsWith(rawQuery)) s += 120;
  else if (title.includes(rawQuery)) s += 60;

  for (const w of terms) {
    if (title.includes(w)) s += 14;
    if (artist.includes(w)) s += 12;
  }
  if (terms.length && terms.every((w) => title.includes(w))) s += 40;

  for (const v of VARIANT_WORDS) {
    if (title.includes(v) && !rawQuery.includes(v)) s -= 60;
  }

  s += Math.min((Number(t.popularity_total) || 0) / 500, 30);
  return s;
}

async function fetchRaw(path, params) {
  if (!hasJamendoKey()) return [];
  try {
    const res = await fetch(`${BASE}${path}?${q(params)}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.results) ? json.results : [];
  } catch {
    return [];
  }
}

// Full-text search, RANKED by relevance + popularity so the closest, best-quality
// match comes first. Returns [] on any failure so callers fall back to local data.
export async function searchJamendo(query, limit = 20) {
  const term = (query || '').trim();
  if (!term) return [];
  // Over-fetch, then rank, so a loosely-relevant top result doesn't bury the match.
  const list = await fetchRaw('/tracks/', {
    search: term,
    limit: Math.max(limit, 15),
    audioformat: AUDIO_FORMAT,
    include: 'musicinfo',
    order: 'relevance',
  });
  const terms = term.toLowerCase().split(/\s+/).filter(Boolean);
  const rawQuery = term.toLowerCase();
  const ranked = [...list].sort((a, b) => scoreTrack(b, terms, rawQuery) - scoreTrack(a, terms, rawQuery));
  return ranked.slice(0, limit).map(normalizeJamendoTrack).filter((s) => s && s.audioUrl);
}

// Trending/popular, optionally within a genre tag (e.g. 'afrobeat', 'pop', 'hiphop').
export async function jamendoTrending(genre, limit = 20) {
  const list = await fetchRaw('/tracks/', {
    order: 'popularity_month',
    tags: (genre || '').toLowerCase().replace(/[^a-z]/g, ''),
    limit,
    audioformat: AUDIO_FORMAT,
    include: 'musicinfo',
  });
  return list.map(normalizeJamendoTrack).filter((s) => s && s.audioUrl);
}

// True for a stored Jamendo audio URL (already a direct, playable file).
export const isJamendoStreamUrl = (url) =>
  typeof url === 'string' && url.includes('jamendo.com') && url.includes('trackid');

// Match a placeholder/local song to a real Jamendo track by title/artist/genre, and
// cache the direct audio URL per song id. (No redirect resolution needed.)
const matchCache = new Map(); // song.id -> audio url | null

async function matchedUrl(song) {
  if (song.id && matchCache.has(song.id)) return matchCache.get(song.id);
  const tries = [
    `${song.artist || ''} ${song.title || ''}`,
    song.title,
    song.genre,
  ].map((s) => (s || '').trim()).filter(Boolean);
  let url = null;
  for (const term of tries) {
    const r = await searchJamendo(term, 1);
    if (r[0]?.audioUrl) { url = r[0].audioUrl; break; }
  }
  if (song.id) matchCache.set(song.id, url);
  return url;
}

// The single entry point the audio engine calls: returns a directly-playable URL for
// ANY song. Real Jamendo (or other real) URLs pass through untouched; the placeholder
// (soundhelix) catalog is matched to a real Jamendo track.
export async function resolvePlayableUrl(song) {
  if (!song) return null;
  const url = song.audioUrl || '';
  const isPlaceholder = !url || url.includes('soundhelix.com');
  if (!isPlaceholder) return url; // already a real, direct URL (Jamendo or otherwise)
  const matched = await matchedUrl(song);
  return matched || url;
}

// A single track by its Jamendo id (the bare id, without the "jamendo_" prefix).
export async function getJamendoTrack(jamendoId) {
  const list = await fetchRaw('/tracks/', { id: jamendoId, audioformat: AUDIO_FORMAT, include: 'musicinfo' });
  return list[0] ? normalizeJamendoTrack(list[0]) : null;
}
