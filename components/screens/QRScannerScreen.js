import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert,
  Vibration, Animated, Dimensions, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const { height: SCREEN_H } = Dimensions.get('window');

// Parse a Sonara song share link into a playable song object.
// Links look like: https://sonara.app/song/<id>?title=...&artist=...
const parseSongUrl = (data) => {
  try {
    if (typeof data !== 'string' || !data.includes('sonara.app/song/')) return null;
    const afterSong = data.split('/song/')[1] || '';
    const id = decodeURIComponent((afterSong.split('?')[0] || '').trim());
    const queryStr = afterSong.includes('?') ? afterSong.slice(afterSong.indexOf('?') + 1) : '';
    const params = {};
    queryStr.split('&').forEach(pair => {
      const [k, v = ''] = pair.split('=');
      if (k) params[k] = decodeURIComponent(v.replace(/\+/g, ' '));
    });
    const title = params.title || 'Unknown Title';
    const artist = params.artist || 'Unknown Artist';
    // Real catalog isn't wired yet — assign a deterministic placeholder track so
    // the song is playable. Once the backend exists, fetch the real audioUrl by id.
    const sum = (id || title).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const trackNo = (sum % 6) + 1;
    return {
      id: id || `qr_${Date.now()}`,
      title,
      artist,
      genre: 'Music',
      emoji: '🎵',
      audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${trackNo}.mp3`,
    };
  } catch (_) {
    return null;
  }
};

export default function QRScannerScreen({ navigation }) {
  const { createPlaylist, addSongToPlaylist, loadAndPlay, addToSearchHistory } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  // Parsed QR results
  const [song, setSong] = useState(null);              // sonara song link
  const [playlist, setPlaylist] = useState(null);       // sonara-playlist type
  const [genericContent, setGenericContent] = useState(null); // any other QR

  const [saved, setSaved] = useState(false);
  const [songSaved, setSongSaved] = useState(false);   // song added to search history

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanLineLoopRef = useRef(null);
  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // Scan line loop
  useEffect(() => {
    scanLineLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    scanLineLoopRef.current.start();
    return () => { if (scanLineLoopRef.current) scanLineLoopRef.current.stop(); };
  }, []);

  const slideSheetIn = () => {
    Animated.spring(sheetAnim, { toValue: 0, bounciness: 3, useNativeDriver: true }).start();
  };

  const slideSheetOut = (cb) => {
    Animated.timing(sheetAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true })
      .start(cb);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(80);

    // 1. Sonara song link → show the song with play / save options
    const songObj = parseSongUrl(data);
    if (songObj) {
      setSong(songObj);
      slideSheetIn();
      return;
    }

    // 2. Sonara playlist JSON
    try {
      const parsed = JSON.parse(data);
      if (parsed?.type === 'sonara-playlist' && parsed.name) {
        setPlaylist(parsed);
        slideSheetIn();
        return;
      }
    } catch (_) {}

    // 3. Any other QR code
    setGenericContent(data);
    slideSheetIn();
  };

  const playSong = () => {
    if (!song) return;
    loadAndPlay(song, [song], 0);
    navigation.navigate('Player', { song });
  };

  const saveSongToSearch = () => {
    if (!song || songSaved) return;
    addToSearchHistory(song);
    setSongSaved(true);
  };

  const resetScan = () => {
    slideSheetOut(() => {
      setScanned(false);
      setSong(null);
      setPlaylist(null);
      setGenericContent(null);
      setSaved(false);
      setSongSaved(false);
    });
  };

  const savePlaylist = () => {
    if (!playlist || saved) return;
    const newPl = createPlaylist(playlist.name, '🎶');
    if (!newPl) {
      Alert.alert(
        'Playlist Limit Reached',
        'Free members get one playlist. Upgrade to Premium to save shared playlists.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }
    // addSongToPlaylist stops at the free cap on its own; extra songs are ignored.
    (playlist.songs || []).forEach(song => addSongToPlaylist(song, newPl.id));
    setSaved(true);
  };

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  // ── Permission screens ───────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off-outline" size={72} color={c.textFaint} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan Sonara QR codes and open playlists instantly.
        </Text>
        <TouchableOpacity style={styles.allowBtn} onPress={requestPermission}>
          <Text style={styles.allowBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.ghostBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main scanner ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={c.icon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity
            style={[styles.headerBtn, torch && styles.headerBtnActive]}
            onPress={() => setTorch(t => !t)}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={c.icon} />
          </TouchableOpacity>
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          {/* Dimmed sides */}
          <View style={styles.dimTop} />
          <View style={styles.dimRow}>
            <View style={styles.dimSide} />

            {/* Scan frame */}
            <View style={[styles.frame, scanned && styles.frameSuccess]}>
              <View style={[styles.corner, styles.tl, scanned && styles.cornerGreen]} />
              <View style={[styles.corner, styles.tr, scanned && styles.cornerGreen]} />
              <View style={[styles.corner, styles.bl, scanned && styles.cornerGreen]} />
              <View style={[styles.corner, styles.br, scanned && styles.cornerGreen]} />

              {!scanned && (
                <Animated.View
                  style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
                />
              )}

              {scanned && (
                <View style={styles.successMark}>
                  <Ionicons name="checkmark-circle" size={56} color={c.icon} />
                </View>
              )}
            </View>

            <View style={styles.dimSide} />
          </View>
          <View style={styles.dimBottom}>
            <Text style={styles.hint}>
              {scanned ? 'Code scanned!' : 'Point camera at a Sonara QR code'}
            </Text>
            <View style={styles.sonaraBadge}>
              <Text style={styles.sonaraBadgeText}>🎵 Sonara</Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* ── Bottom Sheet ──────────────────────────────────────────────── */}
      {(song || playlist || genericContent) && (
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>

          {song ? (
            // ── Song sheet — save & play ────────────────────────────────
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={styles.songArtWrap}>
                  <Text style={styles.songArtEmoji}>{song.emoji || '🎵'}</Text>
                </View>
                <View style={styles.sheetHeaderInfo}>
                  <Text style={styles.songFoundLabel}>SONG FOUND</Text>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={playSong}>
                <Ionicons name="play" size={18} color={c.icon} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Play Song</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, songSaved && styles.outlineBtnDone]}
                onPress={saveSongToSearch}
                disabled={songSaved}
                activeOpacity={0.8}>
                <Ionicons
                  name={songSaved ? 'checkmark-circle' : 'time-outline'}
                  size={17}
                  color={c.icon}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.outlineBtnText}>
                  {songSaved ? 'Saved to Search History' : 'Save to Search History'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={resetScan}>
                <Text style={styles.secondaryBtnText}>Scan Another</Text>
              </TouchableOpacity>
            </>
          ) : playlist ? (
            // ── Playlist sheet ──────────────────────────────────────────
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={styles.playlistIconWrap}>
                  <Text style={styles.playlistIconEmoji}>🎶</Text>
                </View>
                <View style={styles.sheetHeaderInfo}>
                  <Text style={styles.playlistName} numberOfLines={1}>
                    {playlist.name}
                  </Text>
                  {playlist.creator && (
                    <Text style={styles.playlistCreator}>By {playlist.creator}</Text>
                  )}
                  <Text style={styles.playlistCount}>
                    {(playlist.songs || []).length} song{(playlist.songs || []).length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Song previews */}
              {(playlist.songs || []).length > 0 && (
                <ScrollView
                  style={styles.songPreviewList}
                  scrollEnabled={false}>
                  {(playlist.songs || []).slice(0, 3).map((song, i) => (
                    <View key={song.id || i} style={styles.songPreviewRow}>
                      <View style={styles.songPreviewNum}>
                        <Text style={styles.songPreviewNumText}>{i + 1}</Text>
                      </View>
                      <View style={styles.songPreviewInfo}>
                        <Text style={styles.songPreviewTitle} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={styles.songPreviewArtist} numberOfLines={1}>
                          {song.artist}
                        </Text>
                      </View>
                      <Text style={styles.songPreviewEmoji}>{song.emoji || '🎵'}</Text>
                    </View>
                  ))}
                  {(playlist.songs || []).length > 3 && (
                    <Text style={styles.moreSongs}>
                      +{(playlist.songs || []).length - 3} more songs
                    </Text>
                  )}
                </ScrollView>
              )}

              {saved ? (
                <View style={styles.savedRow}>
                  <Ionicons name="checkmark-circle" size={22} color={c.icon} />
                  <Text style={styles.savedText}>Saved to your library!</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={savePlaylist}>
                  <Ionicons name="add-circle-outline" size={18} color={c.icon} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Save Playlist</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryBtn} onPress={resetScan}>
                <Text style={styles.secondaryBtnText}>
                  {saved ? 'Scan Another' : 'Skip'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // ── Generic QR sheet ────────────────────────────────────────
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.genericHeader}>
                <Ionicons name="qr-code" size={28} color={c.icon} />
                <Text style={styles.genericTitle}>QR Code Detected</Text>
              </View>
              <View style={styles.genericContentBox}>
                <Text style={styles.genericContent} numberOfLines={4}>
                  {genericContent}
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={resetScan}>
                <Ionicons name="scan-outline" size={18} color={c.icon} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryBtnText}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  camera: { flex: 1 },

  // Permission
  permissionContainer: {
    flex: 1, backgroundColor: c.bg,
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16,
  },
  permissionTitle: { color: c.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  permissionText: { color: c.textFaint, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  allowBtn: {
    backgroundColor: c.accent, borderRadius: 30,
    paddingHorizontal: 32, paddingVertical: 14, marginTop: 8,
  },
  allowBtnText: { color: c.text, fontSize: 15, fontWeight: '800' },
  ghostBtn: { paddingVertical: 12, paddingHorizontal: 32 },
  ghostBtnText: { color: c.textFaint, fontSize: 14, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnActive: { backgroundColor: c.accent },
  headerTitle: { color: c.text, fontSize: 18, fontWeight: '700' },

  // Viewfinder
  viewfinder: { flex: 1 },
  dimTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)' },
  dimRow: { flexDirection: 'row', height: 260 },
  dimSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)' },
  dimBottom: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center', justifyContent: 'flex-start', paddingTop: 28, gap: 16,
  },
  hint: { color: '#ddd', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  sonaraBadge: {
    backgroundColor: c.elevated,
    borderWidth: 1, borderColor: c.accent,
    paddingHorizontal: 22, paddingVertical: 8, borderRadius: 24,
  },
  sonaraBadgeText: { color: c.text, fontSize: 14, fontWeight: '700' },

  // Scan frame
  frame: { width: 260, height: 260, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  frameSuccess: { backgroundColor: c.elevated },
  corner: { position: 'absolute', width: 38, height: 38, borderColor: c.accent, borderWidth: 4 },
  cornerGreen: { borderColor: c.accent },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanLine: {
    position: 'absolute', top: 0, left: 12, right: 12,
    height: 2, backgroundColor: c.accent, borderRadius: 1,
    shadowColor: c.bg, shadowOpacity: 0.8, shadowRadius: 4,
  },
  successMark: { alignItems: 'center', justifyContent: 'center' },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    minHeight: 320,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginBottom: 20,
  },

  // Song sheet
  songArtWrap: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: c.elevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  songArtEmoji: { fontSize: 30 },
  songFoundLabel: { color: c.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  songTitle: { color: c.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  songArtist: { color: c.textDim, fontSize: 14, fontWeight: '600', marginTop: 3 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.elevated, borderRadius: 30,
    paddingVertical: 13, width: '100%', marginTop: 8,
    borderWidth: 1, borderColor: c.border,
  },
  outlineBtnDone: { backgroundColor: c.elevated },
  outlineBtnText: { color: c.text, fontSize: 14, fontWeight: '800' },

  // Playlist sheet
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  playlistIconWrap: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: c.elevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  playlistIconEmoji: { fontSize: 28 },
  sheetHeaderInfo: { flex: 1 },
  playlistName: { color: c.text, fontSize: 18, fontWeight: '800' },
  playlistCreator: { color: c.textDim, fontSize: 13, marginTop: 3 },
  playlistCount: { color: c.text, fontSize: 12, fontWeight: '600', marginTop: 4 },

  // Song previews
  songPreviewList: { marginBottom: 20 },
  songPreviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  songPreviewNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
  },
  songPreviewNumText: { color: c.textFaint, fontSize: 11, fontWeight: '700' },
  songPreviewInfo: { flex: 1 },
  songPreviewTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  songPreviewArtist: { color: c.textFaint, fontSize: 11, marginTop: 2 },
  songPreviewEmoji: { fontSize: 20 },
  moreSongs: { color: c.textFaint, fontSize: 12, textAlign: 'center', marginTop: 10 },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 8 },
  savedText: { color: c.text, fontSize: 15, fontWeight: '700' },

  // Generic sheet
  genericHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  genericTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
  genericContentBox: {
    backgroundColor: c.elevated, borderRadius: 12,
    padding: 14, marginBottom: 20,
  },
  genericContent: { color: c.textDim, fontSize: 13, lineHeight: 20 },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.accent, borderRadius: 30,
    paddingVertical: 14, width: '100%', marginBottom: 8,
  },
  primaryBtnText: { color: c.accentText, fontSize: 15, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: c.textFaint, fontSize: 14, fontWeight: '600' },
});
