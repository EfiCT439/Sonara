# Sonara - Project Progress 🎵

## App Description
A Spotify-like music streaming app built with React Native.
Supports Android and iOS.

## Tech Stack
- React Native + Expo SDK 54 (Frontend)
- Node.js + Express (Backend)
- MongoDB Atlas (Database)
- Firebase Authentication
- expo-av (Audio/Video)
- Flutterwave (Payments - to be integrated)
- Google AdMob (Ads - to be integrated)
- @expo/vector-icons (Icons)
- @react-navigation/bottom-tabs (Bottom Navigation)

## GitHub Repositories
- Frontend: https://github.com/EfiCT439/Sonara
- Backend: https://github.com/EfiCT439/SonaraBackend

## Completed Phases ✅

### Phase 1 - Authentication & Onboarding ✅
- Beautiful Login screen with forgot password
- Beautiful Sign Up screen
- Firebase authentication (Email/Password)
- Onboarding screen with progress bar
- Choose 3 favourite artists with search & custom add
- Artists saved to UserContext for personalization

### Phase 2 - Backend & Database ✅
- Node.js + Express server running on port 5000
- MongoDB Atlas connected
- User model (premium, favourites, playlists, hidden songs, skips)
- Song model (audio, video, lyrics, plays)
- Artist model (followers, songs)
- All API routes (songs, artists, users)

### Phase 3 - Core Music Player ✅
- Audio playback with expo-av
- Play/Pause/Resume with real Ionicons
- Next button (with skip limit for free users)
- Backward button (visible but locked for free users)
- Auto-play next song when current song finishes
- Favourite button (heart icon)
- Lyrics section
- Internet connection detection
- Sleep Timer (30min, 45min, 1hr, 2hr, 3hr, end of song)
- Audio/Video switch button (Premium feature)
- Share modal (WhatsApp, Instagram, Twitter, Facebook)

### Phase 4 - Freemium System ✅
- Free tier: 8 skips/hour, no backward, ads every 3 songs
- Premium tier: unlimited skips, backward, download, playlists
- Paywall screen with feature comparison
- UserContext for tracking premium status and skips
- Premium tab in bottom navigation

### Phase 5 - Screens & Navigation ✅
- Bottom navigation (Home, Search, Library, Create, Premium)
- Home screen with trending songs by category
- Your artists section (based on onboarding choices)
- Search screen with search history and genre filters
- Library screen with liked songs, playlists, artists
- Create screen for playlist management
- Profile screen (logout, add account, update photo)
- Artist screen with follow button and songs
- Paywall screen with payment methods

## In Progress 🔄

### Remaining Features to Complete:
- Library screen — show all liked songs properly
- Search screen — show trending songs when category tapped
- Flutterwave payment integration ($1/month Premium)
- Real artist images via Last.fm API
- Background audio (requires app store build)
- Lock screen controls
- MiniPlayer (shows when leaving player screen)

## Upcoming 🔜

### Phase 6 - Polish & Submission
- UI animations and transitions
- Real artist images
- App icon and splash screen design
- Testing on Android & iOS
- App Store & Google Play submission
- Documentation & demo video

## Unique Features 🌟
- Audio/Video switch while playing (Premium)
- Sleep Timer (30min, 45min, 1hr, 2hr, 3hr, end of song)
- Auto-play next song when current finishes
- African payment methods (MTN Mobile Money, Orange Money)
- Lyrics while playing
- Custom artist search in onboarding
- Ads every 3 songs (Free tier)
- Share songs to WhatsApp, Instagram, Twitter, Facebook
- Artist personalization based on onboarding choices

## Payment Methods 💳
- Credit/Debit Card (Flutterwave)
- MTN Mobile Money (Flutterwave)
- Orange Money (Flutterwave)
- $1/month for Premium

## Target Market 🌍
- Universal (worldwide)
- Special focus on Cameroon & Nigeria

## Known Issues 🔧
- Background audio stops when app is closed (needs app store build)
- Real song URLs needed (currently using sample MP3s)
- Real artist images needed (Last.fm API - Phase 6)
- Flutterwave payment not yet integrated