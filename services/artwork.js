// Real cover art for songs, from the iTunes Search API (free, no key).
// Songs that already carry an imageUrl (e.g. Audius tracks) skip the lookup;
// everything else (the placeholder catalog) is enriched lazily with the real
// album cover for that title + artist, so emoji fallbacks turn into real images.
import { useState, useEffect } from 'react';
import jpeg from 'jpeg-js';

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

// ── Dominant colour of a cover image (pure JS, works in Expo Go) ─────────────
// Decodes the cover JPEG and averages its pixels, weighting colourful ones so the
// result is a real accent from the image rather than a muddy grey. Used to tint
// the Player background to match whatever song is playing, any genre.
const colorCache = new Map();     // imageUrl -> hex | null
const colorInflight = new Map();

const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

function dominantFromPixels(data) {
  let r = 0, g = 0, b = 0, w = 0;
  // step by 8 (2 px) to keep it fast on-device; covers are small anyway
  for (let i = 0; i < data.length; i += 8) {
    const R = data[i], G = data[i + 1], B = data[i + 2];
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
    if (mx > 240 && mn > 240) continue; // skip near-white
    if (mx < 20) continue;              // skip near-black
    const wt = 1 + (mx - mn) * 0.06;    // colourful pixels weigh more
    r += R * wt; g += G * wt; b += B * wt; w += wt;
  }
  if (!w) return null;
  return [Math.round(r / w), Math.round(g / w), Math.round(b / w)];
}

export async function getDominantColor(imageUrl) {
  if (!imageUrl) return null;
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl);
  if (colorInflight.has(imageUrl)) return colorInflight.get(imageUrl);

  const p = (async () => {
    try {
      // shrink iTunes covers to 100x100 so the decode is quick
      const small = imageUrl.replace(/\/\d+x\d+bb\./, '/100x100bb.');
      const res = await fetch(small);
      const buf = await res.arrayBuffer();
      const { data } = jpeg.decode(new Uint8Array(buf), { useTArray: true, maxMemoryUsageInMB: 100 });
      const rgb = dominantFromPixels(data);
      const hex = rgb ? toHex(rgb) : null;
      colorCache.set(imageUrl, hex);
      return hex;
    } catch {
      colorCache.set(imageUrl, null); // e.g. a PNG cover — jpeg-js can't decode it
      return null;
    } finally {
      colorInflight.delete(imageUrl);
    }
  })();
  colorInflight.set(imageUrl, p);
  return p;
}

// The dominant colour of an image URL, falling back to `fallback` until (or unless)
// one is extracted. Safe everywhere: any failure just keeps the fallback.
export function useDominantColor(imageUrl, fallback) {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    let alive = true;
    setColor(fallback);
    if (imageUrl) getDominantColor(imageUrl).then((c) => { if (alive && c) setColor(c); });
    return () => { alive = false; };
  }, [imageUrl, fallback]);
  return color;
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
