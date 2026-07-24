# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Version Warning

**Always read the versioned Expo docs before writing any code**: https://docs.expo.dev/versions/v54.0.0/
The app targets **Expo SDK 54** (React Native 0.81.5, React 19.1.0). Expo APIs change significantly between versions — do not rely on outdated examples.

## Commands

```bash
# Start the dev server
npx expo start

# Use tunnel mode when the phone and computer are on different networks or behind a firewall
npx expo start --tunnel

# Run on a specific platform
npx expo start --android
npx expo start --ios

# Install a new package (use this, not npm install directly)
npx expo install <package>

# Clear Metro cache if things break
npx expo start --clear

# Backend (separate repo, see below)
cd ../SonaraBackend && node server.js
```

There is no test suite and no lint script configured. Changes to `app.json` (orientation, permissions) need a full restart — a hot reload will not pick them up.

## Architecture

Sonara is a Spotify-like **global** music streaming app spanning all genres and markets. Its early launch markets are Nigeria and Cameroon (hence the strong Afrobeats/Amapiano/Gospel catalog and local mobile-money payments), but the product scope is worldwide. Freemium is enforced entirely client-side.

```
App.js                    Root: UserProvider + AppContent; locks portrait; renders MiniPlayer
firebaseConfig.js         Firebase Auth + Firestore exports
context/UserContext.js    ALL global state + the audio engine
services/api.js           Backend API layer — calls return null/[]/error objects if backend is down
components/MiniPlayer.js  Persistent mini player bar (floats above tab bar)
components/screens/       All screen components
```

### Navigation

Nested navigators inside a single `NavigationContainer`:

- **Root Stack**: Login → SignUp → Onboarding → Main
- **Main** renders `MainInner` (a second Stack): `MainTabs` as the base, with `Player`, `Paywall`, `Artist`, `Profile`, `QRScanner`, `AIGen`, `AIPlaylist`, `AILyrics`, `Visualizer` pushed full-screen over the tabs
- **Bottom Tabs**: Home, Search, Library, Create, Premium
- `MiniPlayer` renders **outside** the `NavigationContainer` in `App.js`, absolutely positioned, navigating via `onOpenPlayer` / `onUpgrade` callback props

### Global State: UserContext

`context/UserContext.js` is the single source of truth — Redux store, audio service, and session manager combined. All state is **in-memory only**; it resets on app restart except Firebase-backed data (onboarding artists, profile image). Groups:

- **Audio engine**: `soundRef`, `nextSoundRef` (preload), `currentTrack`, `isPlayingGlobal`, `miniPlayerPosition`, `miniPlayerDuration`, `queueRef`, `queueIndexRef`, `currentQueue`
- **Audio controls**: `loadAndPlay(song, queue, queueIndex)`, `playPause()`, `playNextInQueue(isShuffle)`, `playPreviousInQueue(isShuffle)`, `seekTo(millis)`
- **Sleep timer** (lives in context so it survives leaving PlayerScreen): `sleepTimerLabel`, `setSleepTimer(minutes|'end', label)`, `cancelSleepTimer()`
- **Freemium**: `isPremium`, `useSkip()` (8 skips/hour), `canCreatePlaylist()`, `canAddSongToPlaylist(id)`, `customPlaylistCount`, `FREE_PLAYLIST_LIMIT` (1), `FREE_SONGS_PER_PLAYLIST` (11)
- **Playlists**: `createPlaylist(name, emoji)` → **returns `null`** when the free limit is hit; `createGeneratedPlaylist(name, emoji, songs)` (bypasses caps — for the premium AI generator); `addSongToPlaylist(song, id)` → **returns `false`** when the free 11-song cap is hit; `deletePlaylist`, `updatePlaylist`
- **Content stores**: `likedSongs`, `userPlaylists`, `recentlyPlayed` (cap 20), `searchHistory` + `addToSearchHistory` (shared so the QR scanner can write to it), `createdSongs` + `addCreatedSong`/`updateCreatedSong` (AI-generated songs → Create ▸ Upload Music and Library ▸ AI Music), `downloadedSongs` + `downloadSong`/`isDownloaded` (→ Library ▸ Downloads)
- **Listening intelligence**: `listeningHabits` (`{ genres, artists, songs }` play-count maps), `getTopGenres(n)`, `getTopArtists(n)` — Home and Search adapt to these
- **Privacy**: `privateSession` (when true `trackSongPlay` records nothing), `clearListeningHistory()`
- **Backend sync**: `syncPremiumFromBackend(firebaseUser)` — non-blocking after login

### Audio Engine — invariants (do not break these)

Reworked to fix overlapping playback, a jumping progress bar, and laggy controls. Each guard exists for a reason:

- **`loadTokenRef`** — every `loadAndPlay` claims `++loadTokenRef.current`. Any load already in flight is stale: it unloads its sound and bails, and the status listener ignores updates whose token no longer matches. **This is what prevents two songs playing at once** (the old symptom: progress bar jumping back and forth, pause not working). The old sound's listener is detached and its ref nulled *before* any await.
- **Old sound teardown is fire-and-forget** — never `await` it; it used to sit on the critical path and delay the new song.
- **`downloadFirst` matters.** `Audio.Sound.createAsync(source, status, onUpdate, downloadFirst)` defaults to `true`, which downloads the whole MP3 before playing (~5s stall). User-initiated loads pass **`false`** (stream, fast start) with `shouldPlay: true`.
- **`preloadNext(token)`** downloads the upcoming queue track in the background using **`downloadFirst: true`** (there's a whole song's worth of time) and parks it in `nextSoundRef`. `loadAndPlay` reuses it when the ids match, so auto-advance and the next button start instantly. Shuffle can't match a preload and falls back to streaming.
- **`isPlayingRef` + `lastToggleAtRef`** — `playPause()` decides from the ref (no await), flips the UI optimistically on the same frame, and rolls back on failure. The status listener ignores `isPlaying` for 400ms after a toggle so an in-flight update can't fight the user's tap.
- **Auto-advance wraps** (`% q.length`) on `didJustFinish`, matching the next button, so a queue never dead-ends.
- The hardcoded catalogs still carry placeholder `soundhelix.com` `audioUrl`s — those are **not** played directly anymore (see the YouTube engine below); they're matched to the real original on YouTube.

### Audio vs Video are two SEPARATE, independent modes (do not merge them)

The Audio/Video switch is Sonara's signature feature. The two modes are deliberately independent and each shows **only its own** controls (only one progress bar visible at a time):

- **Audio mode** — the untouched expo-av/Audius engine in `context/UserContext.js` (`loadAndPlay` → `resolvePlayableUrl`, background play, mini player, queue, synced lyrics). Album art + adaptive background + the audio progress bar. This is the original engine; **don't route it through YouTube**.
- **Video mode** — the song's **real YouTube music video**, played by an **in-`PlayerScreen`** `<YoutubePlayer>` (NOT at the app root — video is a player-screen-only experience). `findYouTubeId(displaySong)` resolves the id; `controls:false` + `modestbranding` strips **all** YouTube UI; Sonara draws its own clean controls over it (play/pause, ±10s **double-tap** seek, red scrubber, queue/download/sleep-timer, and landscape **fullscreen** via `ytFull` + `expo-screen-orientation`). Entering Video **pauses the audio engine** (`pausedForYtRef`) and plays the video's own sound; leaving resumes audio. Reliable autoplay = start `ytPlaying:false`, then `onYtReady` flips it true (+ `seekTo` to restore position across the fullscreen remount).
- **Hard YouTube limits:** video plays only while PlayerScreen is open (no background), and no offline download (the download button just saves a Library reference). `youtubeConfig.js` (gitignored) holds the key; searches cached per song by `findYouTubeId`.
- **The endgame:** replace YouTube video with a **licensed provider (MassiveMusic / 7digital)** delivering clean video *and* real audio as direct streams — then both modes play in Sonara's own players with no third-party UI. See [[project-status]].

Real synced lyrics come from **LRCLIB** (`services/lyricsApi.js`, free/no-key) — `useLyrics` returns plain + time-synced lines; PlayerScreen highlights the exact line by timestamp, falling back to even pacing for plain-only lyrics. (`services/lyrics.js` is a *different* file — it *generates* template lyrics for AI songs.)

### Firebase

`firebaseConfig.js` exports `auth` and `db` for project `sonara-302a2`.

- **Auth**: email/password only. Password reset uses `sendPasswordResetEmail` (Profile ▸ Privacy & Security).
- **Firestore**: one-shot `getDoc`/`setDoc` on `users/{uid}` — no real-time listeners
- **No Firebase Storage** (profile images are base64/local URIs in Firestore)

### Backend (`SonaraBackend`, sibling repo)

Node + Express + MongoDB Atlas at `http://localhost:5000`, also serving a marketing/payment site (`public/index.html`). `services/api.js` is a thin fetch wrapper over it; every method swallows errors so the app still works offline.

- **`API_BASE`** is `http://localhost:5000/api`. A phone cannot reach the dev machine's `localhost` — use the LAN IP for on-device testing, and the deployed URL before going live.
- `routes/payment.js` — `POST /api/payment/verify`, `POST /api/payment/mobile-money` (Cameroon `mobile_money_franco`/XAF STK push, Nigeria `ussd`/NGN; phone sanitized server-side), `GET /api/payment/mobile-money/status/:txRef`, `POST /api/payment/webhook`. Country from phone prefix: `+237` → Cameroon, `+234` → Nigeria. Flutterwave test keys in `.env`; live keys need Flutterwave KYC.
- `routes/ai.js` at `/api/ai` — `POST /api/ai/song` (Replicate MusicGen) → `{ predictionId }`, `GET /api/ai/song/status/:id` → `{ status, audioUrl }`. Needs `REPLICATE_API_TOKEN`.
- `routes/recognize.js` at `/api/recognize` — song recognition. Accepts the mic clip as multipart field **`sample`** (multer, memory, 10MB), signs it with **HMAC-SHA1** (Node built-in `crypto`) and forwards to ACRCloud. Returns `{ status: 'success', result }` | `{ status: 'no_match' }` (ACR code 1001) | `{ status: 'error', message }`. Needs `ACR_HOST` (must match the project's region, e.g. `identify-eu-west-1.acrcloud.com`), `ACR_ACCESS_KEY`, `ACR_ACCESS_SECRET` in `.env`.
  **The ACRCloud secret must stay server-side** — it was deliberately moved out of the app so it can't be extracted from the bundle. Do not reintroduce keys or signing into the client.

### Screen-specific Notes

**HomeScreen**: Genre chips reorder by top genres. **Made For You** is fully usage-adaptive — every mix derives from `listeningHabits` (top genre, 2nd genre, most-played *artist* radio that leads with that artist then branches to same-genre artists, **On Repeat** from replayed songs, a time-of-day mix built from the user's own top genre, and a rotating `Discover <genre>` for genres never played). With no history it falls back to the genres of onboarding `favouriteArtists` — never hardcoded genres. Tapping a mix opens a detail sheet listing only that mix's songs (it must not jump straight into the Player).

**SearchScreen**: Three view states — results (`query.length > 0`), a **dedicated Recent Searches page** (`focused && !showResults`, which hides Discover + the genre grid), and browse (`!focused`). Cancel returns to browse. Tapping a genre is a full-screen takeover. `DiscoverCard`/`SongRow` are module-scope.
Song recognition: green mic pill opens an in-screen modal with 4 states (`listening` 10s countdown + `expo-av` recording → `searching` → `found`/`notFound`). It uploads the clip to **`api.recognizeSong()`** (backend ▸ ACRCloud). Permission/recording failures surface a visible message — do not restore the old silent `catch` that just closed the modal.

**LibraryScreen**: Drilldowns for liked, playlists, artists, recent, **downloads**, **aimusic**, **albums**. Downloads splits `downloadedSongs` into **Music Videos** (have `videoUrl`) and **Songs** — Music Videos lives *inside* Downloads, not as its own row. AI Music lists `createdSongs`. Albums groups the user's songs by artist into a responsive 2-column grid (`width: '48%'`, `aspectRatio: 1`) and reuses `PlaylistDetailModal`. Playlists are viewable by free users (they get one). Artists drilldown shows "Favourite Artists" (onboarding) then "Following", deduped.

**CreateScreen**: Sections — Create Playlist (with existing playlists listed under **New Playlist**, tappable to a detail sheet), AI Music, Upload Content, Edit & Share. There is **no "Save to Library"** feature; it was removed. **Upload Music** shows `createdSongs`. **Share** is a multi-step flow: pick playlist → whole or select songs → link (`Share.share`) or **QR** (encodes `sonara-playlist` JSON via api.qrserver.com, round-trips through QRScannerScreen).

**PlayerScreen**: Add-to-playlist is tier-split — premium opens the full picker; **free users' songs go straight into their single playlist** (auto-created as "My Playlist" if absent), capped at 11 with an upgrade prompt. Video mode renders a **full-width inline video across the very top** (replacing the header; back top-left, settings/quality + queue top-right, expand bottom-right) and a **YouTube-style landscape fullscreen** (`expo-screen-orientation` → LANDSCAPE on enter, PORTRAIT_UP on exit/unmount; tap toggles auto-hiding controls; red scrubber). Entering fullscreen pauses the audio engine and resumes it on exit. `SAMPLE_VIDEO_URL` is a demo fallback used when a track has no `videoUrl`.
**Fullscreen settings must not use a React Native `Modal`** — opening a portrait Modal while locked to landscape crashes the app. Fullscreen uses an in-place overlay panel (`showFsSettings`); the portrait inline settings use a normal Modal (`showVideoSettings`).

**PaywallScreen**: The sticky "Upgrade Now" CTA opens a **payment-method picker sheet**; each method has its own independent modal — Card (name/number/expiry/CVV), MTN & Orange Mobile Money (phone → `api.initiateMobileMoney` → polls `checkMobileMoneyStatus`), and Bank Transfer (**user enters their own** bank name/account holder/account number — never show pre-filled Sonara account details). All input components are module-scope. PremiumScreen has no payment methods list; its CTA just navigates here.

**AIGenScreen**: form → generating (polls `api.getSongStatus` every 3s) → result. On success the song is auto-saved via `addCreatedSong` with a **stable `songId`** (the id must not be regenerated on re-render — it previously used `Date.now()` inside `useMemo` and changed whenever cover art was picked). The result step hosts **Upload Cover Art** (`expo-image-picker`, syncs via `updateCreatedSong`) — this is the only place cover art lives; there is no standalone row for it.

**AIPlaylistScreen** / **AILyricsScreen**: self-contained (own catalog/templates, per the hardcoded-data convention). AI Playlist = mood + genre → rule-based mix (chosen genre anchors, mood pulls related genres) → Play All / Save via `createGeneratedPlaylist`. AI Lyrics = theme + mood + genre → template-based lyrics + Share. Both are honest approximations, not real AI — no mood metadata or lyrics API exists.

**QRScannerScreen**: Parses three payloads — a **Sonara song link** (`sonara.app/song/<id>?title=&artist=`, offering **Play Song** or **Save to Search History**; assigns a deterministic placeholder `audioUrl` since the link carries no audio), `sonara-playlist` JSON (save to library), and any other QR (raw display). Always an animated bottom sheet — never revert to Alerts.

**OnboardingScreen**: searches 53+ artists, allows adding unknown ones, minimum 3.

### Key Patterns and Constraints

- **TextInput keyboard bug**: Never define a component inside another component's function body. React treats each render's inline component as a new type and remounts it, so the `TextInput` loses focus every keystroke. Define helpers at **module scope** and pass state as props. Inline JSX *functions* (e.g. `renderDrillToolbar()` in LibraryScreen) are fine.
- **`useNativeDriver`**: `false` for `height`/`width`/layout; `true` only for `transform`/`opacity`. Mixing them throws at runtime.
- **Pre-computed animation params**: `WAVE_PARAMS`, `GEN_BAR_PARAMS` are computed at module scope with fixed math — never `Math.random()` inside a render.
- **Orientation**: `app.json` is `"orientation": "default"` **on purpose** (portrait-only would block the video fullscreen). `App.js` locks `PORTRAIT_UP` at startup, and PlayerScreen's video fullscreen is the only place that goes landscape. Don't set it back to `"portrait"`.
- **Permissions in `app.json`**: `ios.infoPlist.UIBackgroundModes: ["audio"]` (needs a native build), `NSMicrophoneUsageDescription` + `android.permissions: ["RECORD_AUDIO"]` for recognition.
- **expo-file-system**: SDK 54 removed `readAsStringAsync`/`getInfoAsync` from the default export — import from **`expo-file-system/legacy`**. Recognition no longer needs it (the backend handles the upload).
- **Hardcoded data**: Song catalogs and artist info are static JS objects inside individual screen files; `services/api.js` exists but screens aren't wired to it yet.
- **`imageUrl` / `videoUrl`**: optional song/artist/playlist fields. Render `<Image source={{ uri: item.imageUrl }}>` when present, else fall back to `emoji`. `videoUrl` drives the Visualizer's video button and the Downloads ▸ Music Videos split; it already exists in `SonaraBackend/models/Song.js`.
- **`currentQueue` vs `queueRef`**: `queueRef` is the mutable engine queue (not reactive); `currentQueue` is the state mirror — use it for any UI.
- **Freemium is client-side only** — no server-side validation. The playlist caps are enforced in `UserContext` (single source of truth) so they hold from Player, Create, and the QR import alike; screens only surface the prompt.
- **Design system**: Older screens (Home, Search, Player, Paywall, Premium) use `#0A0A0A` bg, `#161616` cards, `#2A2A2A` elevated, `#1DB954` green, `#FFD700` gold. Newer screens (Library, Create, AIGen, AIPlaylist, AILyrics, Visualizer) are strict monochrome: `#000` bg, `#111` cards, `#1A1A1A` elevated, `#fff` primary. Follow the surrounding screen.
- **Genre accent colors**: each screen defines its own local `GENRE_COLORS`. The canonical 16-genre set is in `SearchScreen.js`; update all relevant maps when adding a genre.
- **`ShareScreen.js` is orphaned** — never imported. Sharing lives in PlayerScreen modals and the CreateScreen share flow.
- **Babel**: `babel.config.js` uses `babel-preset-expo` with `react-native-reanimated/plugin` last — required ordering.
- **File name casing**: Metro's resolver is case-sensitive even on Windows; imports must match exactly (`LoginScreen.js`).
- **Firebase Auth error codes**: newer SDKs return `auth/invalid-credential` instead of `auth/user-not-found` / `auth/wrong-password` — handle both.

### In progress — REVIEW MODE

Several premium features are **temporarily unlocked** so the owner can review them, each marked with a `REVIEW MODE:` comment stating how to restore the gate. Re-gate them (add `locked={!isPremium}` + route through `handlePremiumGate`) once review is signed off:

- `CreateScreen.js` — Collaborative Playlist, Generate AI Song, AI Playlist Generator, AI Lyrics Generator
- `PlayerScreen.js` — the Audio/Video switch

Library ▸ Downloads and Library ▸ AI Music are currently open to all users (they surface the user's own content); confirm intent before gating.
