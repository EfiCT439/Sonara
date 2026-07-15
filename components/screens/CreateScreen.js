import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, Share, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const EMOJIS = ['🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '❤️', '🔥', '⚡', '🌙', '🌊', '🦋', '🎯', '✨'];

// ─── Module-scope components (keyboard-bug rule) ─────────────────────────────

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function CreateRow({ icon, title, sub, locked, comingSoon, onPress }) {
  return (
    <TouchableOpacity style={styles.createRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.createRowIcon, locked && styles.createRowIconMuted]}>
        <Ionicons name={icon} size={24} color={locked ? '#3A3A3A' : '#ccc'} />
      </View>
      <View style={styles.createRowInfo}>
        <Text style={[styles.createRowTitle, (locked || comingSoon) && styles.createRowTitleMuted]}>
          {title}
        </Text>
        {sub ? <Text style={styles.createRowSub}>{sub}</Text> : null}
      </View>
      {locked ? (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={9} color="#444" />
          <Text style={styles.lockText}>Premium</Text>
        </View>
      ) : comingSoon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={15} color="#222" />
      )}
    </TouchableOpacity>
  );
}

function MyPlaylistRow({ playlist, onPress }) {
  return (
    <TouchableOpacity style={styles.createRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.playlistArt}>
        {playlist.imageUrl
          ? <Image source={{ uri: playlist.imageUrl }} style={styles.playlistArtImage} />
          : <Text style={styles.playlistArtEmoji}>{playlist.emoji || '🎵'}</Text>}
      </View>
      <View style={styles.createRowInfo}>
        <Text style={styles.createRowTitle} numberOfLines={1}>{playlist.name}</Text>
        <Text style={styles.createRowSub}>
          {playlist.songs?.length || 0} {(playlist.songs?.length || 0) === 1 ? 'song' : 'songs'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#555" />
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CreateScreen({ navigation }) {
  const {
    isPremium, createPlaylist, userPlaylists, updatePlaylist, loadAndPlay,
    canCreatePlaylist, customPlaylistCount, FREE_SONGS_PER_PLAYLIST, createdSongs,
  } = useUser();

  const myPlaylists = userPlaylists.filter(pl => !pl.isLikedSongs);

  const [showModal, setShowModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');

  const [detailPlaylist, setDetailPlaylist] = useState(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [collabIntent, setCollabIntent] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('🎵');

  // Share flow
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStep, setShareStep] = useState('pick');      // pick | mode | select | format | qr
  const [sharePlaylist, setSharePlaylist] = useState(null);
  const [shareSelectedIds, setShareSelectedIds] = useState([]);
  const [shareQrUrl, setShareQrUrl] = useState(null);
  const [shareQrLoading, setShareQrLoading] = useState(true);

  const shareablePlaylists = userPlaylists.filter(pl => (pl.songs?.length || 0) > 0);

  const promptUpgrade = (title, message) => {
    Alert.alert(title, message, [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Go Premium 💎', onPress: () => navigation.navigate('Premium') },
    ]);
  };

  const handleOpenCreate = () => {
    // Free users get a single playlist — block the second before opening the form.
    if (!canCreatePlaylist()) {
      promptUpgrade(
        'Playlist Limit Reached',
        `Free members get one playlist. Upgrade to Premium to build unlimited playlists with no song limits.`
      );
      return;
    }
    setPlaylistName('');
    setSelectedEmoji('🎵');
    setShowModal(true);
  };

  const handleCollaborative = () => {
    if (!canCreatePlaylist()) {
      promptUpgrade(
        'Playlist Limit Reached',
        'Free members get one playlist. Upgrade to Premium for unlimited playlists.'
      );
      return;
    }
    setCollabIntent(true);
    setPlaylistName('');
    setSelectedEmoji('🎵');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!playlistName.trim()) {
      Alert.alert('Name Required', 'Please give your playlist a name.');
      return;
    }
    const pl = createPlaylist(playlistName.trim(), selectedEmoji);
    if (!pl) {
      setShowModal(false);
      setCollabIntent(false);
      promptUpgrade(
        'Playlist Limit Reached',
        'Free members get one playlist. Upgrade to Premium for unlimited playlists.'
      );
      return;
    }
    setShowModal(false);
    if (collabIntent) {
      setCollabIntent(false);
      Alert.alert(
        'Collaborative Playlist Created 🎉',
        `"${pl.name}" is ready. Add songs, then use Share to invite friends to listen and add to it.`
      );
      return;
    }
    Alert.alert(
      'Playlist Created 🎉',
      isPremium
        ? `"${pl.name}" is ready. Add songs to it from any Player screen.`
        : `"${pl.name}" is ready — add up to ${FREE_SONGS_PER_PLAYLIST} songs from the Player screen. Upgrade to Premium for unlimited songs and playlists.`
    );
  };

  const playFromPlaylist = (song, queue, index) => {
    setDetailPlaylist(null);
    loadAndPlay(song, queue, index);
    navigation.navigate('Player', { song });
  };

  const playCreatedSong = (song, index) => {
    setShowMusicModal(false);
    loadAndPlay(song, createdSongs, index);
    navigation.navigate('Player', { song });
  };

  const handleComingSoon = (feature) => {
    Alert.alert(feature, "This feature is coming soon. We're working on it!");
  };

  // ── Share flow ─────────────────────────────────────────────────────────────
  const openShareFlow = () => {
    if (shareablePlaylists.length === 0) {
      Alert.alert('Nothing to Share', 'Add songs to a playlist first, then share it.');
      return;
    }
    setSharePlaylist(null);
    setShareSelectedIds([]);
    setShareQrUrl(null);
    setShareStep('pick');
    setShowShareModal(true);
  };

  const closeShare = () => setShowShareModal(false);

  const pickSharePlaylist = (pl) => {
    setSharePlaylist(pl);
    setShareSelectedIds([]);
    setShareStep('mode');
  };

  const shareWholePlaylist = () => {
    setShareSelectedIds((sharePlaylist.songs || []).map(s => s.id));
    setShareStep('format');
  };

  const toggleShareSong = (id) => {
    setShareSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getShareSongs = () =>
    (sharePlaylist?.songs || []).filter(s => shareSelectedIds.includes(s.id));

  const buildSharePayload = (songs) => JSON.stringify({
    type: 'sonara-playlist',
    name: sharePlaylist?.name || 'Shared Playlist',
    creator: 'Sonara user',
    songs: songs.map(s => ({
      id: s.id, title: s.title, artist: s.artist, emoji: s.emoji || '🎵', audioUrl: s.audioUrl,
    })),
  });

  const shareAsLink = async () => {
    const songs = getShareSongs();
    const total = sharePlaylist?.songs?.length || 0;
    const heading = songs.length === total
      ? `my playlist "${sharePlaylist.name}"`
      : `${songs.length} song${songs.length === 1 ? '' : 's'} from "${sharePlaylist.name}"`;
    const list = songs.map((s, i) => `${i + 1}. ${s.title} — ${s.artist}`).join('\n');
    const message = `🎵 Check out ${heading} on Sonara!\n\n${list}\n\nGet Sonara 👉 https://sonara.app`;
    try { await Share.share({ message, title: sharePlaylist.name }); } catch (_) {}
    setShowShareModal(false);
  };

  const shareAsQR = () => {
    const payload = buildSharePayload(getShareSongs());
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}&format=png&margin=12`;
    setShareQrUrl(url);
    setShareQrLoading(true);
    setShareStep('qr');
  };

  const handleOpenEdit = () => {
    const editable = userPlaylists.filter(pl => !pl.isLikedSongs);
    if (editable.length === 0) {
      Alert.alert('No Playlists', 'Create a playlist first, then come back to edit it.');
      return;
    }
    setEditTarget(null);
    setShowEditModal(true);
  };

  const handleSelectPlaylist = (playlist) => {
    setEditTarget(playlist);
    setEditName(playlist.name);
    setEditEmoji(playlist.emoji);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your playlist.');
      return;
    }
    updatePlaylist(editTarget.id, editName.trim(), editEmoji);
    setShowEditModal(false);
    setEditTarget(null);
  };

  const handlePremiumGate = (feature, onGranted) => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        `${feature} is available for Sonara Premium members.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
        ]
      );
    } else {
      onGranted();
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>Build playlists, make music & share the vibe</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── 1. Create Playlist ── */}
        <SectionHeader title="Create Playlist" />
        <View style={styles.block}>
          <CreateRow
            icon="add-circle-outline"
            title="New Playlist"
            sub={isPremium
              ? 'Build unlimited playlists with no song limits'
              : customPlaylistCount >= 1
                ? 'Free limit reached — upgrade for unlimited playlists'
                : `Free: one playlist, up to ${FREE_SONGS_PER_PLAYLIST} songs`}
            onPress={handleOpenCreate}
          />
          {/* Existing playlists — tap to open & play */}
          {myPlaylists.map(pl => (
            <MyPlaylistRow
              key={pl.id}
              playlist={pl}
              onPress={() => setDetailPlaylist(pl)}
            />
          ))}
          {/* REVIEW MODE: Collaborative Playlist temporarily active — re-gate to premium after review */}
          <CreateRow
            icon="people-outline"
            title="Collaborative Playlist"
            sub="Create a playlist, then share it so friends can add songs"
            onPress={handleCollaborative}
          />
        </View>

        {/* ── 2. AI Music ── */}
        <SectionHeader title="AI Music" />
        <View style={styles.block}>
          {/* REVIEW MODE: Generate AI Song temporarily open — re-add locked={!isPremium} + handlePremiumGate after review */}
          <CreateRow
            icon="sparkles-outline"
            title="Generate AI Song"
            sub="Describe a song — AI writes and produces it. Add cover art after."
            onPress={() => navigation.navigate('AIGen')}
          />
          {/* REVIEW MODE: AI Playlist Generator temporarily open — re-add locked={!isPremium} + handlePremiumGate after review */}
          <CreateRow
            icon="albums-outline"
            title="AI Playlist Generator"
            sub="Pick a mood and genre — get a full playlist of related songs"
            onPress={() => navigation.navigate('AIPlaylist')}
          />
          {/* REVIEW MODE: AI Lyrics Generator temporarily active — re-gate to premium after review */}
          <CreateRow
            icon="document-text-outline"
            title="AI Lyrics Generator"
            sub="Turn a theme into full song lyrics"
            onPress={() => navigation.navigate('AILyrics')}
          />
        </View>

        {/* ── 3. Upload Content ── */}
        <SectionHeader title="Upload Content" />
        <View style={styles.block}>
          <CreateRow
            icon="cloud-upload-outline"
            title="Upload Music"
            sub={createdSongs.length > 0
              ? `${createdSongs.length} created ${createdSongs.length === 1 ? 'song' : 'songs'} · tap to view`
              : 'Your AI-created songs are saved here'}
            onPress={() => setShowMusicModal(true)}
          />
        </View>

        {/* ── 4. Edit & Share ── */}
        <SectionHeader title="Edit & Share" />
        <View style={styles.block}>
          <CreateRow
            icon="create-outline"
            title="Edit Content"
            sub="Rename playlists and change their icon"
            onPress={handleOpenEdit}
          />
          <CreateRow
            icon="share-social-outline"
            title="Share"
            sub="Share a playlist or songs — as a link or QR code"
            onPress={openShareFlow}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Edit Playlist Modal ── */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => { setShowEditModal(false); setEditTarget(null); }}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {!editTarget ? (
              <>
                <Text style={styles.sheetTitle}>Edit Playlist</Text>
                <Text style={styles.sheetLabel}>Select a playlist</Text>
                {userPlaylists.filter(pl => !pl.isLikedSongs).map(pl => (
                  <TouchableOpacity key={pl.id} style={styles.playlistPickRow} onPress={() => handleSelectPlaylist(pl)} activeOpacity={0.75}>
                    <View style={styles.playlistPickArt}>
                      {pl.imageUrl
                        ? <Image source={{ uri: pl.imageUrl }} style={styles.playlistPickImage} />
                        : <Text style={{ fontSize: 20 }}>{pl.emoji}</Text>}
                    </View>
                    <Text style={styles.playlistPickName} numberOfLines={1}>{pl.name}</Text>
                    <Ionicons name="chevron-forward" size={15} color="#333" />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setEditTarget(null)}>
                  <Ionicons name="arrow-back" size={16} color="#555" />
                  <Text style={styles.backRowText}>All playlists</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Edit Playlist</Text>

                <Text style={styles.sheetLabel}>Playlist Name</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Playlist name"
                  placeholderTextColor="#333"
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  maxLength={40}
                />

                <Text style={styles.sheetLabel}>Choose Icon</Text>
                <View style={styles.emojiGrid}>
                  {EMOJIS.map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.emojiBtn, editEmoji === emoji && styles.emojiBtnSelected]}
                      onPress={() => setEditEmoji(emoji)}>
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.sheetCreateBtn} onPress={handleSaveEdit} activeOpacity={0.85}>
                  <Text style={styles.sheetCreateBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => { setShowEditModal(false); setEditTarget(null); }}>
              <Text style={styles.sheetCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── New Playlist Modal ── */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Playlist</Text>

            <Text style={styles.sheetLabel}>Playlist Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Late Night Vibes"
              placeholderTextColor="#333"
              value={playlistName}
              onChangeText={setPlaylistName}
              autoFocus
              maxLength={40}
            />

            <Text style={styles.sheetLabel}>Choose Icon</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnSelected]}
                  onPress={() => setSelectedEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewRow}>
              <View style={styles.previewArt}>
                <Text style={{ fontSize: 28 }}>{selectedEmoji}</Text>
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {playlistName || 'Untitled Playlist'}
              </Text>
            </View>

            <TouchableOpacity style={styles.sheetCreateBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.sheetCreateBtnText}>Create Playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => { setShowModal(false); setCollabIntent(false); }}>
              <Text style={styles.sheetCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Playlist Detail ── */}
      <Modal visible={!!detailPlaylist} transparent animationType="slide" onRequestClose={() => setDetailPlaylist(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '80%' }]}>
            <View style={styles.sheetHandle} />

            {detailPlaylist && (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailHeaderArt}>
                    {detailPlaylist.imageUrl
                      ? <Image source={{ uri: detailPlaylist.imageUrl }} style={styles.detailHeaderImage} />
                      : <Text style={styles.detailHeaderEmoji}>{detailPlaylist.emoji || '🎵'}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailHeaderName} numberOfLines={1}>{detailPlaylist.name}</Text>
                    <Text style={styles.detailHeaderCount}>
                      {detailPlaylist.songs?.length || 0} {(detailPlaylist.songs?.length || 0) === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                </View>

                {(detailPlaylist.songs?.length || 0) > 0 ? (
                  <>
                    <TouchableOpacity
                      style={styles.playAllBtn}
                      onPress={() => playFromPlaylist(detailPlaylist.songs[0], detailPlaylist.songs, 0)}
                      activeOpacity={0.85}>
                      <Ionicons name="play" size={16} color="#000" />
                      <Text style={styles.playAllBtnText}>Play All</Text>
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 6 }}>
                      {detailPlaylist.songs.map((song, index) => (
                        <TouchableOpacity
                          key={`${song.id}_${index}`}
                          style={styles.detailSongRow}
                          onPress={() => playFromPlaylist(song, detailPlaylist.songs, index)}
                          activeOpacity={0.75}>
                          <Text style={styles.detailSongIdx}>{index + 1}</Text>
                          <View style={styles.detailSongArt}>
                            {song.imageUrl
                              ? <Image source={{ uri: song.imageUrl }} style={styles.detailSongImage} />
                              : <Text style={styles.detailSongEmoji}>{song.emoji || '🎵'}</Text>}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailSongTitle} numberOfLines={1}>{song.title}</Text>
                            <Text style={styles.detailSongArtist} numberOfLines={1}>{song.artist}</Text>
                          </View>
                          <Ionicons name="play-circle-outline" size={24} color="#555" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.detailEmpty}>
                    <Ionicons name="musical-notes-outline" size={40} color="#2A2A2A" />
                    <Text style={styles.detailEmptyText}>No songs yet</Text>
                    <Text style={styles.detailEmptySub}>Add songs to this playlist from any Player screen.</Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setDetailPlaylist(null)}>
              <Text style={styles.sheetCancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Upload Music (created songs) ── */}
      <Modal visible={showMusicModal} transparent animationType="slide" onRequestClose={() => setShowMusicModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '82%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Your Music</Text>
            <Text style={styles.shareStepSub}>Songs you've created with AI</Text>

            {createdSongs.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {createdSongs.map((song, index) => (
                  <TouchableOpacity
                    key={`${song.id}_${index}`}
                    style={styles.detailSongRow}
                    onPress={() => playCreatedSong(song, index)}
                    activeOpacity={0.75}>
                    <View style={styles.detailSongArt}>
                      {song.imageUrl
                        ? <Image source={{ uri: song.imageUrl }} style={styles.detailSongImage} />
                        : <Text style={styles.detailSongEmoji}>{song.emoji || '✨'}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailSongTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.detailSongArtist} numberOfLines={1}>{song.artist} · {song.genre}</Text>
                    </View>
                    <Ionicons name="play-circle-outline" size={24} color="#555" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.detailEmpty}>
                <Ionicons name="cloud-upload-outline" size={40} color="#2A2A2A" />
                <Text style={styles.detailEmptyText}>No music yet</Text>
                <Text style={styles.detailEmptySub}>Create a song with Generate AI Song and it'll show up here.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setShowMusicModal(false)}>
              <Text style={styles.sheetCancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Share Flow ── */}
      <Modal visible={showShareModal} transparent animationType="slide" onRequestClose={closeShare}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '82%' }]}>
            <View style={styles.sheetHandle} />

            {/* Step 1 — pick a playlist */}
            {shareStep === 'pick' && (
              <>
                <Text style={styles.sheetTitle}>Share a Playlist</Text>
                <Text style={styles.shareStepSub}>Choose a playlist to share</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {shareablePlaylists.map(pl => (
                    <TouchableOpacity key={pl.id} style={styles.shareRow} onPress={() => pickSharePlaylist(pl)} activeOpacity={0.75}>
                      <View style={styles.shareRowArt}>
                        {pl.imageUrl
                          ? <Image source={{ uri: pl.imageUrl }} style={styles.shareRowImage} />
                          : <Text style={styles.shareRowEmoji}>{pl.isLikedSongs ? '❤️' : (pl.emoji || '🎵')}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shareRowName} numberOfLines={1}>{pl.name}</Text>
                        <Text style={styles.shareRowSub}>{pl.songs.length} {pl.songs.length === 1 ? 'song' : 'songs'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color="#555" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Step 2 — whole playlist or select songs */}
            {shareStep === 'mode' && sharePlaylist && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep('pick')}>
                  <Ionicons name="arrow-back" size={16} color="#888" />
                  <Text style={styles.backRowText}>Playlists</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle} numberOfLines={1}>{sharePlaylist.name}</Text>
                <Text style={styles.shareStepSub}>What do you want to share?</Text>

                <TouchableOpacity style={styles.shareOptionCard} onPress={shareWholePlaylist} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="albums-outline" size={22} color="#fff" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Entire Playlist</Text>
                    <Text style={styles.shareOptionSub}>Share all {sharePlaylist.songs.length} songs</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#555" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOptionCard} onPress={() => { setShareSelectedIds([]); setShareStep('select'); }} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="checkmark-done-outline" size={22} color="#fff" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Select Songs</Text>
                    <Text style={styles.shareOptionSub}>Pick specific songs to share</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#555" />
                </TouchableOpacity>
              </>
            )}

            {/* Step 3 — select songs */}
            {shareStep === 'select' && sharePlaylist && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep('mode')}>
                  <Ionicons name="arrow-back" size={16} color="#888" />
                  <Text style={styles.backRowText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Select Songs</Text>
                <Text style={styles.shareStepSub}>{shareSelectedIds.length} selected</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {sharePlaylist.songs.map(song => {
                    const on = shareSelectedIds.includes(song.id);
                    return (
                      <TouchableOpacity key={song.id} style={styles.selectRow} onPress={() => toggleShareSong(song.id)} activeOpacity={0.75}>
                        <View style={[styles.checkbox, on && styles.checkboxOn]}>
                          {on && <Ionicons name="checkmark" size={14} color="#000" />}
                        </View>
                        <View style={styles.shareRowArt}>
                          {song.imageUrl
                            ? <Image source={{ uri: song.imageUrl }} style={styles.shareRowImage} />
                            : <Text style={styles.shareRowEmoji}>{song.emoji || '🎵'}</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.shareRowName} numberOfLines={1}>{song.title}</Text>
                          <Text style={styles.shareRowSub} numberOfLines={1}>{song.artist}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.sheetCreateBtn, shareSelectedIds.length === 0 && styles.shareBtnDisabled]}
                  onPress={() => shareSelectedIds.length > 0 && setShareStep('format')}
                  disabled={shareSelectedIds.length === 0}
                  activeOpacity={0.85}>
                  <Text style={styles.sheetCreateBtnText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 4 — choose format */}
            {shareStep === 'format' && sharePlaylist && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep(getShareSongs().length === sharePlaylist.songs.length ? 'mode' : 'select')}>
                  <Ionicons name="arrow-back" size={16} color="#888" />
                  <Text style={styles.backRowText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Share As</Text>
                <Text style={styles.shareStepSub}>
                  {getShareSongs().length} {getShareSongs().length === 1 ? 'song' : 'songs'} from "{sharePlaylist.name}"
                </Text>

                <TouchableOpacity style={styles.shareOptionCard} onPress={shareAsLink} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="link-outline" size={22} color="#fff" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Share as Link</Text>
                    <Text style={styles.shareOptionSub}>Send via WhatsApp, messages, and more</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#555" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOptionCard} onPress={shareAsQR} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="qr-code-outline" size={22} color="#fff" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Share as QR Code</Text>
                    <Text style={styles.shareOptionSub}>Scan in Sonara to save the playlist</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#555" />
                </TouchableOpacity>
              </>
            )}

            {/* Step 5 — QR code */}
            {shareStep === 'qr' && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep('format')}>
                  <Ionicons name="arrow-back" size={16} color="#888" />
                  <Text style={styles.backRowText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Scan to Save</Text>
                <Text style={styles.shareStepSub}>Screenshot and send it — they scan it in Sonara</Text>
                <View style={styles.qrBox}>
                  {shareQrLoading && (
                    <View style={styles.qrLoading}><Text style={styles.qrLoadingText}>Generating QR…</Text></View>
                  )}
                  {shareQrUrl && (
                    <Image
                      source={{ uri: shareQrUrl }}
                      style={styles.qrImage}
                      onLoad={() => setShareQrLoading(false)}
                      onError={() => setShareQrLoading(false)}
                    />
                  )}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.sheetCancelBtn} onPress={closeShare}>
              <Text style={styles.sheetCancelBtnText}>{shareStep === 'qr' ? 'Done' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
  },
  title: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9A9A9A', marginTop: 5, fontWeight: '700' },

  scroll: { paddingBottom: 20 },

  // Section headers
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8A8A8A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Grouped block
  block: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },

  // Create row
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
    gap: 16,
  },
  createRowIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRowIconMuted: { backgroundColor: '#141414' },
  createRowInfo: { flex: 1 },
  createRowTitle: { color: '#fff', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  createRowTitleMuted: { color: '#666' },
  createRowSub: { color: '#9A9A9A', fontSize: 12.5, marginTop: 4, lineHeight: 18, fontWeight: '600' },

  // Existing playlist row art
  playlistArt: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playlistArtImage: { width: '100%', height: '100%', borderRadius: 13 },
  playlistArtEmoji: { fontSize: 24 },

  // Badges
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  lockText: { color: '#888', fontSize: 10, fontWeight: '800' },
  soonBadge: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  soonText: { color: '#888', fontSize: 10, fontWeight: '800' },

  // Modal / sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 28,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: '#1E1E1E',
  },
  sheetHandle: {
    width: 36, height: 3,
    backgroundColor: '#222', borderRadius: 2,
    alignSelf: 'center', marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 21, fontWeight: '900', color: '#fff', letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 24,
  },
  sheetLabel: {
    fontSize: 11, color: '#888', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  sheetInput: {
    backgroundColor: '#1A1A1A',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  emojiBtn: {
    width: 46, height: 46,
    backgroundColor: '#1A1A1A',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: '#fff', backgroundColor: '#2A2A2A' },
  emojiText: { fontSize: 22 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    gap: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  previewArt: {
    width: 46, height: 46,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { color: '#fff', fontSize: 15, fontWeight: '900', flex: 1 },
  sheetCreateBtn: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetCreateBtnText: { color: '#000', fontSize: 15.5, fontWeight: '900', letterSpacing: -0.2 },
  sheetCancelBtn: { paddingVertical: 12, alignItems: 'center' },
  sheetCancelBtnText: { color: '#888', fontSize: 14, fontWeight: '700' },

  playlistPickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  playlistPickArt: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  playlistPickImage: { width: '100%', height: '100%', borderRadius: 10 },
  playlistPickName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '800' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backRowText: { color: '#888', fontSize: 13, fontWeight: '700' },

  // Playlist detail
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  detailHeaderArt: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailHeaderImage: { width: '100%', height: '100%', borderRadius: 14 },
  detailHeaderEmoji: { fontSize: 32 },
  detailHeaderName: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  detailHeaderCount: { color: '#9A9A9A', fontSize: 13, fontWeight: '700', marginTop: 4 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 13, borderRadius: 12, marginBottom: 6,
  },
  playAllBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  detailSongRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10,
  },
  detailSongIdx: { color: '#888', fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  detailSongArt: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailSongImage: { width: '100%', height: '100%', borderRadius: 10 },
  detailSongEmoji: { fontSize: 22 },
  detailSongTitle: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  detailSongArtist: { color: '#9A9A9A', fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  detailEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  detailEmptyText: { color: '#bbb', fontSize: 16, fontWeight: '800' },
  detailEmptySub: { color: '#777', fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },

  // Share flow
  shareStepSub: { color: '#9A9A9A', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: -14, marginBottom: 18 },
  shareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  shareRowArt: {
    width: 46, height: 46, borderRadius: 11,
    backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  shareRowImage: { width: '100%', height: '100%', borderRadius: 11 },
  shareRowEmoji: { fontSize: 22 },
  shareRowName: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  shareRowSub: { color: '#9A9A9A', fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  shareOptionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  shareOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },
  shareOptionTitle: { color: '#fff', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  shareOptionSub: { color: '#9A9A9A', fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: '#3A3A3A',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#fff', borderColor: '#fff' },
  shareBtnDisabled: { opacity: 0.4 },
  qrBox: {
    width: 240, height: 240, borderRadius: 16, alignSelf: 'center',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 8, marginTop: 4,
  },
  qrImage: { width: 240, height: 240 },
  qrLoading: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', zIndex: 1 },
  qrLoadingText: { color: '#333', fontSize: 14, fontWeight: '700' },
});
