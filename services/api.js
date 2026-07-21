import { NativeModules } from 'react-native';

// Set this to the deployed backend before going live
// e.g. 'https://sonara-backend.railway.app/api'
const PROD_API_BASE = '';

const LAN_IP = /^\d{1,3}(\.\d{1,3}){3}$/;

// A phone cannot reach the dev machine's "localhost" — that resolves to the phone
// itself. Metro already knows the dev machine's address, so derive it from the
// bundler URL rather than hardcoding an IP that changes with every network.
// Tunnel mode serves an ngrok hostname, which cannot proxy port 5000, so anything
// that isn't a LAN IP falls back to localhost (correct for the simulator).
function devApiBase() {
  const host = (NativeModules.SourceCode?.scriptURL || '').split('://')[1]?.split(/[:/]/)[0];
  return host && LAN_IP.test(host) ? `http://${host}:5000/api` : 'http://localhost:5000/api';
}

const API_BASE = !__DEV__ && PROD_API_BASE ? PROD_API_BASE : devApiBase();

const api = {
  // ── Users ────────────────────────────────────────────────────────
  async getUser(firebaseUid) {
    try {
      const res = await fetch(`${API_BASE}/users/${firebaseUid}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async createUser({ firebaseUid, name, email, favouriteArtists = [] }) {
    try {
      const res = await fetch(`${API_BASE}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid, name, email, favouriteArtists }),
      });
      return res.json();
    } catch {
      return null;
    }
  },

  async likeSong(firebaseUid, songId) {
    try {
      await fetch(`${API_BASE}/users/${firebaseUid}/favourite/${songId}`, { method: 'POST' });
    } catch {}
  },

  async unlikeSong(firebaseUid, songId) {
    try {
      await fetch(`${API_BASE}/users/${firebaseUid}/favourite/${songId}`, { method: 'DELETE' });
    } catch {}
  },

  async followArtist(firebaseUid, artistId) {
    try {
      await fetch(`${API_BASE}/users/${firebaseUid}/follow/${artistId}`, { method: 'POST' });
    } catch {}
  },

  // ── Songs ────────────────────────────────────────────────────────
  async getSongs() {
    try {
      const res = await fetch(`${API_BASE}/songs`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getSongsByGenre(genre) {
    try {
      const res = await fetch(`${API_BASE}/songs/genre/${encodeURIComponent(genre)}`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async searchSongs(query) {
    try {
      const res = await fetch(`${API_BASE}/songs/search/${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  // ── Artists ──────────────────────────────────────────────────────
  async getArtists() {
    try {
      const res = await fetch(`${API_BASE}/artists`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getArtist(id) {
    try {
      const res = await fetch(`${API_BASE}/artists/${id}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  // ── AI Music ─────────────────────────────────────────────────────
  async generateSong({ genre, title, description, duration = 30 }) {
    try {
      const res = await fetch(`${API_BASE}/ai/song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, title, description, duration }),
      });
      if (!res.ok) return null;
      return res.json(); // { predictionId, status }
    } catch {
      return null;
    }
  },

  async getSongStatus(predictionId) {
    try {
      const res = await fetch(`${API_BASE}/ai/song/status/${predictionId}`);
      if (!res.ok) return null;
      return res.json(); // { status, audioUrl? }
    } catch {
      return null;
    }
  },

  // ── Song recognition ─────────────────────────────────────────────
  // Uploads the mic recording to our backend, which signs it with the
  // ACRCloud secret and forwards it. The secret never lives in the app.
  async recognizeSong({ uri, name, type }) {
    try {
      const formData = new FormData();
      formData.append('sample', { uri, name, type });
      const res = await fetch(`${API_BASE}/recognize`, {
        method: 'POST',
        body: formData,
      });
      return res.json(); // { status: 'success'|'no_match'|'error', result?, message? }
    } catch {
      return { status: 'error', message: 'Could not reach Sonara. Check your connection.' };
    }
  },

  // ── Payments ─────────────────────────────────────────────────────
  async initiateMobileMoney({ phone, email }) {
    try {
      const res = await fetch(`${API_BASE}/payment/mobile-money`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data?.message || 'Payment failed' };
      return data; // { txRef, status, message }
    } catch {
      return null;
    }
  },

  async checkMobileMoneyStatus(txRef) {
    try {
      const res = await fetch(`${API_BASE}/payment/mobile-money/status/${encodeURIComponent(txRef)}`);
      if (!res.ok) return null;
      return res.json(); // { status, isPremium }
    } catch {
      return null;
    }
  },

  async initiateCardPayment(email) {
    try {
      const res = await fetch(`${API_BASE}/payment/card-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return null;
      return res.json(); // { paymentLink }
    } catch {
      return null;
    }
  },

  // ── Premium status ───────────────────────────────────────────────
  async checkPremium(email) {
    try {
      const res = await fetch(`${API_BASE}/payment/status/${encodeURIComponent(email)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.isPremium === true;
    } catch {
      return false;
    }
  },
};

export default api;
