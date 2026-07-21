import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, Share, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useArtwork } from '../../services/artwork';

const EMOJIS = ['🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '❤️', '🔥', '⚡', '🌙', '🌊', '🦋', '🎯', '✨'];

// Renders a song's real cover art (via iTunes) with an emoji fallback. A component
// so the hook can be used inside the inline song maps below.
function SongThumb({ song, imgStyle, emojiStyle }) {
  const art = useArtwork(song);
  return art
    ? <Image source={{ uri: art }} style={imgStyle} />
    : <Text style={emojiStyle}>{song.emoji || '🎵'}</Text>;
}

// ─── Module-scope components (keyboard-bug rule) ─────────────────────────────

function SectionHeader({ styles, c, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function CreateRow({ styles, c, icon, title, sub, locked, comingSoon, onPress }) {
  return (
    <TouchableOpacity style={styles.createRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.createRowIcon, locked && styles.createRowIconMuted]}>
        <Ionicons name={icon} size={24} color={locked ? c.textFaint : c.textDim} />
      </View>
      <View style={styles.createRowInfo}>
        <Text style={[styles.createRowTitle, (locked || comingSoon) && styles.createRowTitleMuted]}>
          {title}
        </Text>
        {sub ? <Text style={styles.createRowSub}>{sub}</Text> : null}
      </View>
      {locked ? (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={9} color={c.textFaint} />
          <Text style={styles.lockText}>Premium</Text>
        </View>
      ) : comingSoon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
      )}
    </TouchableOpacity>
  );
}

function MyPlaylistRow({ styles, c, playlist, onPress }) {
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
      <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CreateScreen({ navigation }) {
  const {
    isPremium, createPlaylist, createGeneratedPlaylist, userPlaylists, updatePlaylist, loadAndPlay,
    canCreatePlaylist, customPlaylistCount, FREE_SONGS_PER_PLAYLIST, createdSongs,
    deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, canAddSongToPlaylist,
    likedSongs, recentlyPlayed, downloadedSongs,
  } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);

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
  const [editAddMode, setEditAddMode] = useState(false); // song-picker sub-view inside edit

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
      { text: 'Go Premium', onPress: () => navigation.navigate('Premium') },
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
    // Collaborative playlists are free for everyone — no playlist-cap gate here.
    // handleSave routes the collab path through createGeneratedPlaylist, which
    // bypasses the free 1-playlist limit.
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
    // Collaborative playlists are unlocked for free users, so they bypass the free
    // 1-playlist cap via createGeneratedPlaylist. Regular playlists still respect it.
    if (collabIntent) {
      const pl = createGeneratedPlaylist(playlistName.trim(), selectedEmoji, []);
      setShowModal(false);
      setCollabIntent(false);
      Alert.alert(
        'Collaborative Playlist Created',
        `"${pl.name}" is ready. Add songs, then use Share to invite friends to listen and add to it.`
      );
      return;
    }
    const pl = createPlaylist(playlistName.trim(), selectedEmoji);
    if (!pl) {
      setShowModal(false);
      promptUpgrade(
        'Playlist Limit Reached',
        'Free members get one playlist. Upgrade to Premium for unlimited playlists.'
      );
      return;
    }
    setShowModal(false);
    Alert.alert(
      'Playlist Created',
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
    setEditAddMode(false);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your playlist.');
      return;
    }
    updatePlaylist(editTarget.id, editName.trim(), editEmoji);
    setShowEditModal(false);
    setEditTarget(null);
    setEditAddMode(false);
  };

  const closeEdit = () => { setShowEditModal(false); setEditTarget(null); setEditAddMode(false); };

  // Live view of the playlist being edited, so add/remove reflect immediately
  // (editTarget is only the snapshot captured when it was selected).
  const editingPlaylist = editTarget
    ? (userPlaylists.find(p => p.id === editTarget.id) || editTarget)
    : null;

  // Songs the user can add: their own library, minus what's already in the playlist.
  const editAddPool = (() => {
    if (!editingPlaylist) return [];
    const inPlaylist = new Set((editingPlaylist.songs || []).map(s => s.id));
    const seen = new Set();
    const pool = [];
    [...likedSongs, ...recentlyPlayed, ...createdSongs, ...downloadedSongs].forEach(s => {
      if (s && !seen.has(s.id) && !inPlaylist.has(s.id)) { seen.add(s.id); pool.push(s); }
    });
    return pool;
  })();

  const handleRemoveSong = (songId) => removeSongFromPlaylist(songId, editTarget.id);

  const handleAddSongToEdit = (song) => {
    const ok = addSongToPlaylist(song, editTarget.id);
    if (!ok) {
      promptUpgrade(
        'Song Limit Reached',
        `Free playlists hold up to ${FREE_SONGS_PER_PLAYLIST} songs. Upgrade to Premium for unlimited songs.`
      );
    }
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
        <SectionHeader styles={styles} c={c} title="Create Playlist" />
        <View style={styles.block}>
          <CreateRow styles={styles} c={c}
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
            <MyPlaylistRow styles={styles} c={c}
              key={pl.id}
              playlist={pl}
              onPress={() => setDetailPlaylist(pl)}
            />
          ))}
          {/* Collaborative Playlist is free for everyone (bypasses the 1-playlist cap). */}
          <CreateRow styles={styles} c={c}
            icon="people-outline"
            title="Collaborative Playlist"
            sub="Create a playlist, then share it so friends can add songs"
            onPress={handleCollaborative}
          />
        </View>

        {/* ── 2. AI Music ── */}
        <SectionHeader styles={styles} c={c} title="AI Music" />
        <View style={styles.block}>
          {/* REVIEW MODE: Generate AI Song temporarily open — re-add locked={!isPremium} + handlePremiumGate after review */}
          <CreateRow styles={styles} c={c}
            icon="sparkles-outline"
            title="Generate AI Song"
            sub="Describe a song — AI writes, produces and writes the lyrics. Add cover art after."
            onPress={() => navigation.navigate('AIGen')}
          />
          {/* REVIEW MODE: AI Playlist Generator temporarily open — re-add locked={!isPremium} + handlePremiumGate after review */}
          <CreateRow styles={styles} c={c}
            icon="albums-outline"
            title="AI Playlist Generator"
            sub="Pick a mood and genre — get a full playlist of related songs"
            onPress={() => navigation.navigate('AIPlaylist')}
          />
        </View>

        {/* ── 3. Upload Content ── */}
        <SectionHeader styles={styles} c={c} title="Upload Content" />
        <View style={styles.block}>
          <CreateRow styles={styles} c={c}
            icon="cloud-upload-outline"
            title="Upload Music"
            sub={createdSongs.length > 0
              ? `${createdSongs.length} created ${createdSongs.length === 1 ? 'song' : 'songs'} · tap to view`
              : 'Your AI-created songs are saved here'}
            onPress={() => setShowMusicModal(true)}
          />
        </View>

        {/* ── 4. Edit & Share ── */}
        <SectionHeader styles={styles} c={c} title="Edit & Share" />
        <View style={styles.block}>
          <CreateRow styles={styles} c={c}
            icon="create-outline"
            title="Edit Content"
            sub="Rename a playlist, add or remove its songs"
            onPress={handleOpenEdit}
          />
          <CreateRow styles={styles} c={c}
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
                    <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
                  </TouchableOpacity>
                ))}
              </>
            ) : editAddMode ? (
              /* ── Add songs: pick from the user's own library ── */
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setEditAddMode(false)}>
                  <Ionicons name="arrow-back" size={16} color={c.textFaint} />
                  <Text style={styles.backRowText}>Back to edit</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Add Songs</Text>

                {editAddPool.length === 0 ? (
                  <Text style={styles.editEmptyText}>
                    Nothing left to add. Songs you like, play, create or download show up here.
                  </Text>
                ) : (
                  <ScrollView style={styles.editSongScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {editAddPool.map(song => (
                      <TouchableOpacity
                        key={song.id}
                        style={styles.editSongRow}
                        onPress={() => handleAddSongToEdit(song)}
                        activeOpacity={0.75}>
                        <View style={styles.editSongArt}>
                          <SongThumb song={song} imgStyle={styles.editSongImage} emojiStyle={{ fontSize: 18 }} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.editSongTitle} numberOfLines={1}>{song.title}</Text>
                          <Text style={styles.editSongArtist} numberOfLines={1}>{song.artist}</Text>
                        </View>
                        <Ionicons name="add-circle" size={24} color={c.text} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : (
              /* ── Edit: rename, icon, and manage songs ── */
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setEditTarget(null)}>
                  <Ionicons name="arrow-back" size={16} color={c.textFaint} />
                  <Text style={styles.backRowText}>All playlists</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Edit Playlist</Text>

                <Text style={styles.sheetLabel}>Playlist Name</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Playlist name"
                  placeholderTextColor={c.textFaint}
                  value={editName}
                  onChangeText={setEditName}
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

                <View style={styles.editSongsHeader}>
                  <Text style={[styles.sheetLabel, { marginBottom: 0 }]}>
                    Songs ({editingPlaylist?.songs?.length || 0})
                  </Text>
                  <TouchableOpacity style={styles.addSongsBtn} onPress={() => setEditAddMode(true)} activeOpacity={0.8}>
                    <Ionicons name="add" size={15} color={c.icon} />
                    <Text style={styles.addSongsBtnText}>Add Songs</Text>
                  </TouchableOpacity>
                </View>

                {(editingPlaylist?.songs?.length || 0) === 0 ? (
                  <Text style={styles.editEmptyText}>No songs yet — tap “Add Songs” to fill this playlist.</Text>
                ) : (
                  <ScrollView style={styles.editSongScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {editingPlaylist.songs.map(song => (
                      <View key={song.id} style={styles.editSongRow}>
                        <View style={styles.editSongArt}>
                          <SongThumb song={song} imgStyle={styles.editSongImage} emojiStyle={{ fontSize: 18 }} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.editSongTitle} numberOfLines={1}>{song.title}</Text>
                          <Text style={styles.editSongArtist} numberOfLines={1}>{song.artist}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveSong(song.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name="remove-circle" size={24} color={c.danger} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity style={styles.sheetCreateBtn} onPress={handleSaveEdit} activeOpacity={0.85}>
                  <Text style={styles.sheetCreateBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.sheetCancelBtn} onPress={closeEdit}>
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
              placeholderTextColor={c.textFaint}
              value={playlistName}
              onChangeText={setPlaylistName}
              autoFocus
              maxLength={40}
            />

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
                      <Ionicons name="play" size={16} color={c.accentText} />
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
                            <SongThumb song={song} imgStyle={styles.detailSongImage} emojiStyle={styles.detailSongEmoji} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailSongTitle} numberOfLines={1}>{song.title}</Text>
                            <Text style={styles.detailSongArtist} numberOfLines={1}>{song.artist}</Text>
                          </View>
                          <Ionicons name="play-circle-outline" size={24} color={c.textFaint} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.detailEmpty}>
                    <Ionicons name="musical-notes-outline" size={40} color={c.textFaint} />
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
                      <SongThumb song={song} imgStyle={styles.detailSongImage} emojiStyle={styles.detailSongEmoji} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailSongTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.detailSongArtist} numberOfLines={1}>{song.artist} · {song.genre}</Text>
                    </View>
                    <Ionicons name="play-circle-outline" size={24} color={c.textFaint} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.detailEmpty}>
                <Ionicons name="cloud-upload-outline" size={40} color={c.textFaint} />
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
                      <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Step 2 — whole playlist or select songs */}
            {shareStep === 'mode' && sharePlaylist && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep('pick')}>
                  <Ionicons name="arrow-back" size={16} color={c.textDim} />
                  <Text style={styles.backRowText}>Playlists</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle} numberOfLines={1}>{sharePlaylist.name}</Text>
                <Text style={styles.shareStepSub}>What do you want to share?</Text>

                <TouchableOpacity style={styles.shareOptionCard} onPress={shareWholePlaylist} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="albums-outline" size={22} color={c.icon} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Entire Playlist</Text>
                    <Text style={styles.shareOptionSub}>Share all {sharePlaylist.songs.length} songs</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOptionCard} onPress={() => { setShareSelectedIds([]); setShareStep('select'); }} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="checkmark-done-outline" size={22} color={c.icon} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Select Songs</Text>
                    <Text style={styles.shareOptionSub}>Pick specific songs to share</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
                </TouchableOpacity>
              </>
            )}

            {/* Step 3 — select songs */}
            {shareStep === 'select' && sharePlaylist && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep('mode')}>
                  <Ionicons name="arrow-back" size={16} color={c.textDim} />
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
                          {on && <Ionicons name="checkmark" size={14} color={c.accentText} />}
                        </View>
                        <View style={styles.shareRowArt}>
                          <SongThumb song={song} imgStyle={styles.shareRowImage} emojiStyle={styles.shareRowEmoji} />
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
                  <Ionicons name="arrow-back" size={16} color={c.textDim} />
                  <Text style={styles.backRowText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Share As</Text>
                <Text style={styles.shareStepSub}>
                  {getShareSongs().length} {getShareSongs().length === 1 ? 'song' : 'songs'} from "{sharePlaylist.name}"
                </Text>

                <TouchableOpacity style={styles.shareOptionCard} onPress={shareAsLink} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="link-outline" size={22} color={c.icon} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Share as Link</Text>
                    <Text style={styles.shareOptionSub}>Send via WhatsApp, messages, and more</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOptionCard} onPress={shareAsQR} activeOpacity={0.8}>
                  <View style={styles.shareOptionIcon}><Ionicons name="qr-code-outline" size={22} color={c.icon} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareOptionTitle}>Share as QR Code</Text>
                    <Text style={styles.shareOptionSub}>Scan in Sonara to save the playlist</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={c.textFaint} />
                </TouchableOpacity>
              </>
            )}

            {/* Step 5 — QR code */}
            {shareStep === 'qr' && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setShareStep('format')}>
                  <Ionicons name="arrow-back" size={16} color={c.textDim} />
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

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
  },
  title: { fontSize: 30, fontWeight: '900', color: c.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: c.textDim, marginTop: 5, fontWeight: '700' },

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
    color: c.textDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Grouped block
  block: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
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
    backgroundColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRowIconMuted: { backgroundColor: c.surface },
  createRowInfo: { flex: 1 },
  createRowTitle: { color: c.text, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  createRowTitleMuted: { color: c.textFaint },
  createRowSub: { color: c.textDim, fontSize: 12.5, marginTop: 4, lineHeight: 18, fontWeight: '600' },

  // Existing playlist row art
  playlistArt: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: c.elevated,
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
    backgroundColor: c.elevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  lockText: { color: c.textDim, fontSize: 10, fontWeight: '800' },
  soonBadge: {
    backgroundColor: c.elevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  soonText: { color: c.textDim, fontSize: 10, fontWeight: '800' },

  // Modal / sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 28,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: c.border,
  },
  sheetHandle: {
    width: 36, height: 3,
    backgroundColor: '#222', borderRadius: 2,
    alignSelf: 'center', marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 21, fontWeight: '900', color: c.text, letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 24,
  },
  sheetLabel: {
    fontSize: 11, color: c.textDim, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  sheetInput: {
    backgroundColor: c.elevated,
    color: c.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  emojiBtn: {
    width: 46, height: 46,
    backgroundColor: c.elevated,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: c.accent, backgroundColor: c.elevated },
  emojiText: { fontSize: 22 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.elevated,
    borderRadius: 12,
    padding: 14,
    gap: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  previewArt: {
    width: 46, height: 46,
    backgroundColor: c.elevated,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { color: c.text, fontSize: 15, fontWeight: '900', flex: 1 },
  sheetCreateBtn: {
    backgroundColor: c.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetCreateBtnText: { color: c.accentText, fontSize: 15.5, fontWeight: '900', letterSpacing: -0.2 },
  sheetCancelBtn: { paddingVertical: 12, alignItems: 'center' },
  sheetCancelBtnText: { color: c.textDim, fontSize: 14, fontWeight: '700' },

  playlistPickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  playlistPickArt: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  playlistPickImage: { width: '100%', height: '100%', borderRadius: 10 },
  playlistPickName: { flex: 1, color: c.text, fontSize: 15, fontWeight: '800' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backRowText: { color: c.textDim, fontSize: 13, fontWeight: '700' },

  // Edit playlist — song management
  editSongsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 22, marginBottom: 12,
  },
  addSongsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: c.elevated, borderWidth: 1, borderColor: c.borderStrong,
  },
  addSongsBtnText: { color: c.text, fontSize: 12.5, fontWeight: '800' },
  editSongScroll: { maxHeight: 220 },
  editSongRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  editSongArt: {
    width: 40, height: 40, borderRadius: 9,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  editSongImage: { width: '100%', height: '100%' },
  editSongTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  editSongArtist: { color: c.textDim, fontSize: 12, fontWeight: '600', marginTop: 2 },
  editEmptyText: { color: c.textFaint, fontSize: 13, fontWeight: '600', lineHeight: 19, paddingVertical: 14 },

  // Playlist detail
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  detailHeaderArt: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailHeaderImage: { width: '100%', height: '100%', borderRadius: 14 },
  detailHeaderEmoji: { fontSize: 32 },
  detailHeaderName: { color: c.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  detailHeaderCount: { color: c.textDim, fontSize: 13, fontWeight: '700', marginTop: 4 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.accent, paddingVertical: 13, borderRadius: 12, marginBottom: 6,
  },
  playAllBtnText: { color: c.accentText, fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  detailSongRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10,
  },
  detailSongIdx: { color: c.textDim, fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  detailSongArt: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailSongImage: { width: '100%', height: '100%', borderRadius: 10 },
  detailSongEmoji: { fontSize: 22 },
  detailSongTitle: { color: c.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  detailSongArtist: { color: c.textDim, fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  detailEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  detailEmptyText: { color: c.textDim, fontSize: 16, fontWeight: '800' },
  detailEmptySub: { color: '#777', fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },

  // Share flow
  shareStepSub: { color: c.textDim, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: -14, marginBottom: 18 },
  shareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  shareRowArt: {
    width: 46, height: 46, borderRadius: 11,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  shareRowImage: { width: '100%', height: '100%', borderRadius: 11 },
  shareRowEmoji: { fontSize: 22 },
  shareRowName: { color: c.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  shareRowSub: { color: c.textDim, fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  shareOptionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: c.elevated, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: c.borderStrong,
  },
  shareOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
  },
  shareOptionTitle: { color: c.text, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  shareOptionSub: { color: c.textDim, fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: '#3A3A3A',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: c.accent, borderColor: c.accent },
  shareBtnDisabled: { opacity: 0.4 },
  qrBox: {
    width: 240, height: 240, borderRadius: 16, alignSelf: 'center',
    backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 8, marginTop: 4,
  },
  qrImage: { width: 240, height: 240 },
  qrLoading: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', zIndex: 1 },
  qrLoadingText: { color: c.textFaint, fontSize: 14, fontWeight: '700' },
});
