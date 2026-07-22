// YouTube search → Sonara-shaped song objects. Playback is handled by the embedded
// YouTube player (react-native-youtube-iframe), so these songs are marked
// source:'youtube' and carry a youtubeId instead of a streamable audioUrl.
//
// This is the path to the REAL famous catalog (official videos/audio on YouTube),
// legally, by embedding YouTube's own player — nothing is downloaded or re-hosted.
import { YOUTUBE_API_KEY } from '../youtubeConfig';

const API = 'https://www.googleapis.com/youtube/v3';

export const hasYouTubeKey = () => !!(YOUTUBE_API_KEY && YOUTUBE_API_KEY.trim());

// Channel names often carry a "- Topic" suffix (auto-generated artist channels) or
// "VEVO"; strip them so the artist reads cleanly.
const cleanArtist = (name = '') =>
  name.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim() || 'YouTube';

function normalize(item) {
  const id = item?.id?.videoId;
  if (!id) return null;
  const s = item.snippet || {};
  const thumb = s.thumbnails || {};
  return {
    id: `yt_${id}`,
    youtubeId: id,
    source: 'youtube',
    title: (s.title || 'Untitled')
      .replace(/\s*\(official.*?\)/i, '')
      .replace(/\s*\[official.*?\]/i, '')
      .trim(),
    artist: cleanArtist(s.channelTitle),
    genre: '',
    emoji: '🎬',
    imageUrl: thumb.high?.url || thumb.medium?.url || thumb.default?.url || undefined,
    // no audioUrl: YouTube songs play through the embedded player, not the audio engine
  };
}

// Search YouTube's Music category for a query. Returns [] on any failure (no key,
// quota exceeded, offline) so callers can fall back cleanly.
export async function searchYouTube(query, limit = 20) {
  const term = (query || '').trim();
  if (!term || !hasYouTubeKey()) return [];
  try {
    const url = `${API}/search?part=snippet&type=video&videoCategoryId=10` +
      `&maxResults=${limit}&q=${encodeURIComponent(term)}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    return items.map(normalize).filter(Boolean);
  } catch {
    return [];
  }
}

export const isYouTubeSong = (song) => song?.source === 'youtube' || (typeof song?.id === 'string' && song.id.startsWith('yt_'));

// Find the YouTube video id for ANY song so the Player can show its real music
// video. YouTube-sourced songs already carry one; for everything else we search
// "<title> <artist> official" and take the top hit. Cached per song, returns null
// when there's no key / no match so the caller can fall back cleanly.
const _idCache = {};
export async function findYouTubeId(song) {
  if (!song) return null;
  if (song.youtubeId) return song.youtubeId;
  const key = song.id || `${song.title || ''}|${song.artist || ''}`;
  if (key in _idCache) return _idCache[key];
  const q = [song.title, song.artist].filter(Boolean).join(' ').trim();
  if (!q) return null;
  const results = await searchYouTube(`${q} official`, 1);
  const id = results[0]?.youtubeId || null;
  _idCache[key] = id;
  return id;
}
