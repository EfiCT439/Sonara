// Real cover art for songs, from the iTunes Search API (free, no key).
// Songs that already carry an imageUrl (e.g. Audius tracks) skip the lookup;
// everything else (the placeholder catalog) is enriched lazily with the real
// album cover for that title + artist, so emoji fallbacks turn into real images.
import { useState, useEffect } from 'react';

const cache = new Map();     // "title|artist" -> url | null (null = looked up, none found)
const inflight = new Map();  // "title|artist" -> Promise<url|null>

const keyOf = (title, artist) => `${(title || '').toLowerCase()}|${(artist || '').toLowerCase()}`;

export async function getArtwork(title, artist) {
  if (!title && !artist) return null;
  const k = keyOf(title, artist);
  if (cache.has(k)) return cache.get(k);
  if (inflight.has(k)) return inflight.get(k);

  const p = (async () => {
    try {
      const term = encodeURIComponent(`${artist || ''} ${title || ''}`.trim());
      const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
      const json = await res.json();
      const art = json?.results?.[0]?.artworkUrl100;
      // iTunes returns 100x100; bump the dimension in the URL for a crisp image.
      const url = art ? art.replace('100x100bb', '300x300bb') : null;
      cache.set(k, url);
      return url;
    } catch {
      cache.set(k, null);
      return null;
    } finally {
      inflight.delete(k);
    }
  })();
  inflight.set(k, p);
  return p;
}

// ── Artist photos (Deezer, free, no key) ────────────────────────────────────
const artistCache = new Map();     // name -> url | null
const artistInflight = new Map();  // name -> Promise

export async function getArtistImage(name) {
  if (!name) return null;
  const k = name.toLowerCase();
  if (artistCache.has(k)) return artistCache.get(k);
  if (artistInflight.has(k)) return artistInflight.get(k);

  const p = (async () => {
    try {
      const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`);
      const json = await res.json();
      const a = json?.data?.[0];
      const url = a?.picture_medium || a?.picture_big || a?.picture || null;
      artistCache.set(k, url);
      return url;
    } catch {
      artistCache.set(k, null);
      return null;
    } finally {
      artistInflight.delete(k);
    }
  })();
  artistInflight.set(k, p);
  return p;
}

// Returns a real photo for an artist by name (or its own imageUrl if present).
export function useArtistImage(artist) {
  const own = artist?.imageUrl;
  const name = artist?.name || (typeof artist === 'string' ? artist : undefined);
  const [url, setUrl] = useState(own || null);
  useEffect(() => {
    if (own) { setUrl(own); return; }
    let alive = true;
    setUrl(null);
    getArtistImage(name).then((u) => { if (alive && u) setUrl(u); });
    return () => { alive = false; };
  }, [own, name]);
  return url;
}

// Returns the best image for a song: its own imageUrl if present, otherwise a
// real cover fetched (and cached) from iTunes. Null until/unless one is found,
// so callers keep their emoji fallback in the meantime.
export function useArtwork(song) {
  const [url, setUrl] = useState(song?.imageUrl || null);
  const title = song?.title;
  const artist = song?.artist;
  const own = song?.imageUrl;

  useEffect(() => {
    if (own) { setUrl(own); return; }
    let alive = true;
    setUrl(null);
    getArtwork(title, artist).then((u) => { if (alive && u) setUrl(u); });
    return () => { alive = false; };
  }, [own, title, artist]);

  return url;
}
