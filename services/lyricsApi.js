// Real song lyrics via LRCLIB (https://lrclib.net) — free, no API key, returning
// BOTH plain text and time-synced (LRC) lyrics. The synced form is what lets the
// player highlight the exact line that's playing (real karaoke sync, not an
// even-spacing guess). Results are cached per song; every failure degrades quietly
// to "no lyrics" so the player never breaks.
//
// This is the fetcher for real catalog songs. It is separate from `lyrics.js`,
// which *generates* template lyrics for AI-created songs.
import { useEffect, useState } from 'react';

const API = 'https://lrclib.net/api';

// Parse an LRC blob ("[mm:ss.xx] line") into a sorted [{ time(ms), text }] list.
// A single line can carry several timestamps ("[00:10][00:20] text") — each one
// becomes its own entry so repeated hooks highlight correctly.
function parseLrc(lrc) {
  if (!lrc) return [];
  const out = [];
  for (const raw of lrc.split('\n')) {
    const stamps = raw.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g);
    if (!stamps) continue;
    const text = raw.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, '').trim();
    for (const s of stamps) {
      const m = s.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/);
      if (!m) continue;
      const ms = (+m[1]) * 60000 + (+m[2]) * 1000 + (m[3] ? +m[3].padEnd(3, '0') : 0);
      out.push({ time: ms, text });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

const _cache = {};
const NONE = { synced: [], plain: '', status: 'none' };

// Fetch lyrics for a song. Uses LRCLIB's /search (fuzzy — forgiving of missing
// album/duration) and prefers a result that carries synced lyrics.
export async function getLyrics(song) {
  if (!song) return NONE;
  const artist = (song.artist || '').trim();
  const title = (song.title || '').trim();
  if (!artist || !title) return NONE;

  const key = (song.id || `${title}|${artist}`).toLowerCase();
  if (_cache[key]) return _cache[key];

  try {
    const qs = new URLSearchParams({ track_name: title, artist_name: artist }).toString();
    const res = await fetch(`${API}/search?${qs}`, { headers: { 'Lrclib-Client': 'Sonara' } });
    if (!res.ok) return NONE;
    const arr = await res.json();
    if (!Array.isArray(arr) || !arr.length) {
      _cache[key] = NONE;
      return NONE;
    }
    // Prefer synced lyrics, then any plain lyrics, then the first hit.
    const best = arr.find(x => x.syncedLyrics) || arr.find(x => x.plainLyrics) || arr[0];
    const synced = parseLrc(best?.syncedLyrics);
    const plain = (best?.plainLyrics || (synced.length ? synced.map(l => l.text).join('\n') : '')).trim();
    const result = { synced, plain, status: (synced.length || plain) ? 'ok' : 'none' };
    _cache[key] = result;
    return result;
  } catch (_) {
    return NONE; // don't cache transient network errors — allow a later retry
  }
}

// Index of the line that should be lit right now for synced lyrics (the last line
// whose timestamp has passed). Returns -1 before the first line.
export function activeSyncedIndex(synced, positionMs) {
  if (!synced || !synced.length) return -1;
  let idx = -1;
  for (let i = 0; i < synced.length; i++) {
    if (synced[i].time <= positionMs) idx = i;
    else break;
  }
  return idx;
}

// Hook: returns { synced, plain, status } for a song, refetching when it changes.
// status: 'loading' | 'ok' | 'none'.
export function useLyrics(song) {
  const [state, setState] = useState({ synced: [], plain: '', status: 'loading' });
  const id = song?.id;
  const artist = song?.artist;
  const title = song?.title;

  useEffect(() => {
    let cancelled = false;
    if (!artist || !title) { setState(NONE); return; }
    setState(s => ({ ...s, status: 'loading' }));
    getLyrics(song).then(r => { if (!cancelled) setState(r); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, artist, title]);

  return state;
}
