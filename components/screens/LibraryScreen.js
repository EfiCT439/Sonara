import { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Alert, TextInput, Modal, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useArtwork, useArtistImage } from '../../services/artwork';

// ─── All sub-components at module scope (keyboard-bug rule) ─────────────────

function QuickCard({ styles, c, icon, label, count, image, onPress }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickIconWrap}>
        {image
          ? <Image source={{ uri: image }} style={styles.quickCardImage} />
          : <Ionicons name={icon} size={20} color={c.textDim} />}
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
      {count !== undefined && count !== null && (
        <Text style={styles.quickCount}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

function LibSectionHeader({ styles, c, title }) {
  return (
    <View style={styles.libSectionHeader}>
      <Text style={styles.libSectionTitle}>{title}</Text>
    </View>
  );
}

function CollectionRow({ styles, c, icon, label, count, badge, locked, comingSoon, onPress }) {
  return (
    <TouchableOpacity style={styles.collRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.collIconWrap}>
        <Ionicons name={icon} size={18} color={c.textFaint} />
      </View>
      <View style={styles.collInfo}>
        <Text style={[styles.collLabel, (locked || comingSoon) && styles.collLabelMuted]}>
          {label}
        </Text>
        {count !== undefined && count !== null && (
          <Text style={styles.collCount}>{count} {count === 1 ? 'item' : 'items'}</Text>
        )}
      </View>
      {locked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={9} color={c.textFaint} />
          <Text style={styles.lockText}>Premium</Text>
        </View>
      )}
      {comingSoon && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      )}
      {!locked && !comingSoon && (
        <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
      )}
    </TouchableOpacity>
  );
}

function PlaylistItem({ styles, c, playlist, onPress, onLongPress }) {
  return (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}>
      <View style={styles.itemArt}>
        {playlist.imageUrl
          ? <Image source={{ uri: playlist.imageUrl }} style={styles.itemArtImage} />
          : <Text style={styles.itemEmoji}>{playlist.emoji || '🎵'}</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{playlist.name}</Text>
        <Text style={styles.itemSub}>{playlist.songs?.length || 0} songs · Playlist</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
    </TouchableOpacity>
  );
}

function ArtistItem({ styles, c, artist, onPress }) {
  // Use the artist's own imageUrl if present, else fetch a real photo from Deezer.
  const fetchedPhoto = useArtistImage(artist.name);
  const photo = artist.imageUrl || fetchedPhoto;
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.artistArt}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.artistArtImage} />
          : <Text style={styles.itemEmoji}>{artist.emoji || '🎤'}</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{artist.name}</Text>
        <Text style={styles.itemSub}>{artist.genre || 'Artist'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
    </TouchableOpacity>
  );
}

function SongItem({ styles, c, song, index, onPress }) {
  const art = useArtwork(song);
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.songIdx}>{index + 1}</Text>
      <View style={styles.itemArt}>
        {art
          ? <Image source={{ uri: art }} style={styles.itemArtImage} resizeMode="cover" />
          : <Text style={styles.itemEmoji}>{song.emoji || '🎵'}</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{song.title}</Text>
        <Text style={styles.itemSub}>{song.artist}</Text>
      </View>
      <Ionicons name="play" size={13} color={c.textFaint} />
    </TouchableOpacity>
  );
}

function DetailSongRow({ styles, c, song, index, onPress }) {
  const art = useArtwork(song);
  return (
    <TouchableOpacity style={styles.detailSongRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.detailSongIdx}>{index + 1}</Text>
      <View style={styles.detailSongArt}>
        {art
          ? <Image source={{ uri: art }} style={styles.detailSongImage} />
          : <Text style={styles.itemEmoji}>{song.emoji || '🎵'}</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{song.title}</Text>
        <Text style={styles.itemSub}>{song.artist}</Text>
      </View>
      <Ionicons name="play-circle-outline" size={24} color={c.textFaint} />
    </TouchableOpacity>
  );
}

function AlbumCard({ styles, c, album, onPress }) {
  // Album is a group of a user's songs by artist; use its own art, else the
  // artist's real photo, else the first song's cover.
  const artistPhoto = useArtistImage(album?.name);
  const songCover = useArtwork(album?.songs?.[0]);
  const img = album?.imageUrl || artistPhoto || songCover;
  return (
    <TouchableOpacity style={styles.albumCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.albumArt}>
        {img
          ? <Image source={{ uri: img }} style={styles.albumArtImg} />
          : <Text style={styles.albumEmoji}>{album.emoji}</Text>}
      </View>
      <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
      <Text style={styles.albumCount}>{album.songs.length} {album.songs.length === 1 ? 'song' : 'songs'}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ styles, c, icon, title, sub, action, onAction }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={44} color={c.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
      {action && (
        <TouchableOpacity style={styles.emptyActionBtn} onPress={onAction}>
          <Text style={styles.emptyActionText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function DrillHeader({ styles, c, title, count, onBack, onAction, actionIcon }) {
  return (
    <View style={styles.drillHeader}>
      <TouchableOpacity style={styles.drillBackBtn} onPress={onBack} activeOpacity={0.75}>
        <Ionicons name="arrow-back" size={20} color={c.icon} />
      </TouchableOpacity>
      <View style={styles.drillTitleWrap}>
        <Text style={styles.drillTitle}>{title}</Text>
        {count !== undefined && <Text style={styles.drillCount}>{count}</Text>}
      </View>
      {actionIcon ? (
        <TouchableOpacity style={styles.drillBackBtn} onPress={onAction} activeOpacity={0.75}>
          <Ionicons name={actionIcon} size={20} color={c.icon} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 38 }} />
      )}
    </View>
  );
}

function AddArtistSheet({ styles, c, visible, value, onChangeText, onSubmit, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Follow Artist</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="Type artist name…"
            placeholderTextColor={c.textFaint}
            value={value}
            onChangeText={onChangeText}
            autoFocus
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.sheetBtn} onPress={onSubmit} activeOpacity={0.85}>
            <Text style={styles.sheetBtnText}>Add to Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PlaylistDetailModal({ styles, c, visible, playlist, onClose, onPlaySong, onDelete }) {
  if (!playlist) return null;
  const canDelete = onDelete && !playlist.isLikedSongs;
  const confirmDelete = () => {
    Alert.alert(
      'Delete Playlist',
      `Delete "${playlist.name}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { onDelete(playlist.id); onClose(); } },
      ]
    );
  };
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.drillBackBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color={c.icon} />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle} numberOfLines={1}>{playlist.name}</Text>
          {canDelete ? (
            <TouchableOpacity style={styles.drillBackBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={20} color={c.danger} />
            </TouchableOpacity>
          ) : <View style={{ width: 38 }} />}
        </View>

        <View style={styles.detailHero}>
          <View style={styles.detailHeroArt}>
            {playlist.isLikedSongs
              ? <Ionicons name="heart" size={54} color={c.icon} />
              : playlist.imageUrl
                ? <Image source={{ uri: playlist.imageUrl }} style={styles.detailHeroImage} />
                : <Text style={{ fontSize: 54 }}>{playlist.emoji}</Text>}
          </View>
          <Text style={styles.detailHeroName}>{playlist.name}</Text>
          <Text style={styles.detailHeroCount}>{playlist.songs?.length || 0} songs</Text>
          {playlist.songs?.length > 0 && (
            <TouchableOpacity
              style={styles.detailPlayAll}
              onPress={() => { onClose(); onPlaySong(playlist.songs[0], playlist.songs, 0); }}
              activeOpacity={0.8}>
              <Ionicons name="play" size={15} color={c.accentText} />
              <Text style={styles.detailPlayAllText}>Play All</Text>
            </TouchableOpacity>
          )}
        </View>

        {(!playlist.songs || playlist.songs.length === 0) ? (
          <EmptyState styles={styles} c={c}
            icon="musical-notes-outline"
            title="No songs yet"
            sub={playlist.isLikedSongs
              ? 'Like songs from the Player to see them here'
              : 'Add songs to this playlist from the Player'}
          />
        ) : (
          <FlatList
            data={playlist.songs}
            keyExtractor={(item, i) => `${item.id}_${i}`}
            renderItem={({ item, index }) => (
              <DetailSongRow styles={styles} c={c}
                song={item}
                index={index}
                onPress={() => { onClose(); onPlaySong(item, playlist.songs, index); }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LibraryScreen({ navigation }) {
  const {
    isPremium, likedSongs, userPlaylists, followedArtists, favouriteArtists,
    recentlyPlayed, createPlaylist, deletePlaylist, addFollowedArtist,
    loadAndPlay, canCreatePlaylist, FREE_SONGS_PER_PLAYLIST, createdSongs, downloadedSongs,
  } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);

  // "Downloads" = songs the user actually downloaded, split into videos
  // (have a videoUrl) and audio.
  const downloadPool = downloadedSongs;
  const downloadVideos = useMemo(() => downloadedSongs.filter(s => s.videoUrl), [downloadedSongs]);
  const downloadAudios = useMemo(() => downloadedSongs.filter(s => !s.videoUrl), [downloadedSongs]);

  // Albums = the user's songs grouped by artist, so the section fills as they listen.
  const albums = useMemo(() => {
    const seen = new Set();
    const pool = [];
    [...likedSongs, ...recentlyPlayed, ...createdSongs].forEach(s => {
      if (s && !seen.has(s.id)) { seen.add(s.id); pool.push(s); }
    });
    const byArtist = {};
    pool.forEach(s => {
      const key = s.artist || 'Unknown Artist';
      (byArtist[key] = byArtist[key] || []).push(s);
    });
    return Object.entries(byArtist).map(([artist, songs]) => ({
      id: `album_${artist}`,
      name: artist,
      songs,
      emoji: songs[0]?.emoji || '💿',
      imageUrl: songs.find(s => s.imageUrl)?.imageUrl,
    }));
  }, [likedSongs, recentlyPlayed, createdSongs]);

  const [drilldownView, setDrilldownView] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistDetail, setShowPlaylistDetail] = useState(false);
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [sortBy, setSortBy] = useState('added');
  const [drillSearch, setDrillSearch] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  const userPlaylists2 = userPlaylists.filter(p => !p.isLikedSongs);

  const sortedPlaylists = useMemo(() => {
    const list = [...userPlaylists2];
    if (sortBy === 'alpha') return list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'recent') return list.reverse();
    return list;
  }, [userPlaylists2, sortBy]);

  // Onboarding picks (always shown first in Artists drilldown)
  const favArtists = useMemo(() => {
    const list = [...(favouriteArtists || [])];
    if (sortBy === 'alpha') return list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [favouriteArtists, sortBy]);

  // Manually followed artists, deduped against onboarding picks
  const uniqueFollowed = useMemo(() => {
    const favNames = new Set((favouriteArtists || []).map(a => a.name.toLowerCase()));
    const list = (followedArtists || []).filter(a => !favNames.has(a.name.toLowerCase()));
    if (sortBy === 'alpha') return list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [followedArtists, favouriteArtists, sortBy]);

  const totalArtistCount = favArtists.length + uniqueFollowed.length;

  const filteredPlaylists = useMemo(() => {
    if (!drillSearch.trim()) return sortedPlaylists;
    const q = drillSearch.toLowerCase();
    return sortedPlaylists.filter(p => p.name.toLowerCase().includes(q));
  }, [sortedPlaylists, drillSearch]);

  const filteredFavArtists = useMemo(() => {
    if (!drillSearch.trim()) return favArtists;
    const q = drillSearch.toLowerCase();
    return favArtists.filter(a => a.name.toLowerCase().includes(q));
  }, [favArtists, drillSearch]);

  const filteredFollowedArtists = useMemo(() => {
    if (!drillSearch.trim()) return uniqueFollowed;
    const q = drillSearch.toLowerCase();
    return uniqueFollowed.filter(a => a.name.toLowerCase().includes(q));
  }, [uniqueFollowed, drillSearch]);

  // The sort pills used to be inert in the song drilldowns: only the name-based
  // lists above read `sortBy`, so tapping a pill restyled it and reordered nothing.
  // likedSongs and recentlyPlayed are both stored newest-first, which makes "Added"
  // the natural order — keeping it as the default preserves what users see today.
  // "Recent" means play recency, which only recentlyPlayed records, so anything
  // never played sorts last.
  const recencyRank = useMemo(() => {
    const rank = new Map();
    recentlyPlayed.forEach((s, i) => rank.set(s.id, i));
    return rank;
  }, [recentlyPlayed]);

  const sortSongs = (list) => {
    if (sortBy === 'alpha') {
      return [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    if (sortBy === 'recent') {
      const at = (s) => (recencyRank.has(s.id) ? recencyRank.get(s.id) : Infinity);
      return [...list].sort((a, b) => at(a) - at(b));
    }
    return list;
  };

  const matchesDrill = (song) => {
    const q = drillSearch.trim().toLowerCase();
    if (!q) return true;
    return (song.title || '').toLowerCase().includes(q) ||
           (song.artist || '').toLowerCase().includes(q);
  };

  const filteredRecent = useMemo(
    () => sortSongs(recentlyPlayed.filter(matchesDrill)),
    [recentlyPlayed, drillSearch, sortBy, recencyRank]
  );

  const filteredLiked = useMemo(
    () => sortSongs(likedSongs.filter(matchesDrill)),
    [likedSongs, drillSearch, sortBy, recencyRank]
  );

  // ── In-library search ─────────────────────────────────────────────────────
  // Searches only what the user already has. The Search tab covers the whole
  // catalog; this covers the library, so neither entry point here navigates away.
  const librarySongPool = useMemo(() => {
    const seen = new Set();
    const pool = [];
    [...likedSongs, ...recentlyPlayed, ...downloadedSongs, ...createdSongs].forEach((s) => {
      if (s && !seen.has(s.id)) { seen.add(s.id); pool.push(s); }
    });
    return pool;
  }, [likedSongs, recentlyPlayed, downloadedSongs, createdSongs]);

  // null (rather than empty groups) distinguishes "no query yet" from "no matches".
  const searchResults = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    if (!q) return null;
    const has = (value) => (value || '').toLowerCase().includes(q);
    return {
      songs: librarySongPool.filter((s) => has(s.title) || has(s.artist)),
      playlists: userPlaylists2.filter((p) => has(p.name)),
      artists: [...favArtists, ...uniqueFollowed].filter((a) => has(a.name)),
      albums: albums.filter((al) => has(al.name)),
    };
  }, [librarySearch, librarySongPool, userPlaylists2, favArtists, uniqueFollowed, albums]);

  const resultCount = searchResults
    ? searchResults.songs.length + searchResults.playlists.length +
      searchResults.artists.length + searchResults.albums.length
    : 0;

  const exitSearch = () => { setSearchMode(false); setLibrarySearch(''); };

  const handleAddArtist = () => {
    const name = newArtistName.trim();
    if (!name) return;
    addFollowedArtist({ id: Date.now().toString(), name, genre: 'Artist', emoji: '🎤' });
    setNewArtistName('');
    setShowAddArtist(false);
  };

  const handleCreatePlaylist = () => {
    // Free users can create their one playlist; block only once the limit is hit.
    if (!canCreatePlaylist()) {
      Alert.alert(
        'Playlist Limit Reached',
        'Free members get one playlist. Upgrade to Premium for unlimited playlists.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }
    navigation.navigate('Create');
  };

  // Playlists are viewable by everyone — free users see their single playlist.
  const handlePlaylists = () => setDrilldownView('playlists');

  const openPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistDetail(true);
  };

  const openSong = (song, queue, index = 0) => {
    loadAndPlay(song, queue || [song], index);
    navigation.navigate('Player', { song });
  };

  const openVideo = (song, queue, index = 0) => {
    loadAndPlay(song, queue || [song], index);
    navigation.navigate('Visualizer');
  };



  const exitDrill = () => { setDrilldownView(null); setDrillSearch(''); };

  // ── Shared sort pills + search bar (direct JSX, no inline component) ───────
  const renderDrillToolbar = () => (
    <View style={styles.drillToolbar}>
      {/* Search input */}
      <View style={styles.drillSearchBar}>
        <Ionicons name="search" size={15} color={c.textFaint} />
        <TextInput
          style={styles.drillSearchInput}
          placeholder="Search…"
          placeholderTextColor={c.textFaint}
          value={drillSearch}
          onChangeText={setDrillSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {drillSearch.length > 0 && (
          <TouchableOpacity onPress={() => setDrillSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={15} color={c.textFaint} />
          </TouchableOpacity>
        )}
      </View>
      {/* Sort pills */}
      <View style={styles.sortRow}>
        {[
          { key: 'added', label: 'Added' },
          { key: 'recent', label: 'Recent' },
          { key: 'alpha', label: 'A–Z' },
        ].map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortPill, sortBy === s.key && styles.sortPillActive]}
            onPress={() => setSortBy(s.key)}
            activeOpacity={0.75}>
            <Text style={[styles.sortPillText, sortBy === s.key && styles.sortPillTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── DRILLDOWN: Liked Songs ───────────────────────────────────────────────
  if (drilldownView === 'liked') {
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c}
          title="Liked Songs"
          count={likedSongs.length}
          onBack={exitDrill}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {filteredLiked.length === 0 ? (
            <EmptyState styles={styles} c={c}
              icon="heart-outline"
              title={drillSearch ? 'No matches' : 'No liked songs yet'}
              sub={drillSearch ? 'Try a different search' : 'Tap the heart on any song to save it here'}
            />
          ) : (
            filteredLiked.map((song, idx) => (
              <SongItem styles={styles} c={c}
                key={`liked_${song.id}_${idx}`}
                song={song}
                index={idx}
                onPress={() => openSong(song, filteredLiked, idx)}
              />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── DRILLDOWN: Playlists ─────────────────────────────────────────────────
  if (drilldownView === 'playlists') {
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c}
          title="Playlists"
          count={userPlaylists2.length}
          onBack={exitDrill}
          actionIcon="add"
          onAction={handleCreatePlaylist}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {filteredPlaylists.length === 0 ? (
            <EmptyState styles={styles} c={c}
              icon="musical-notes-outline"
              title={drillSearch ? 'No matches' : 'No playlists yet'}
              sub={drillSearch
                ? 'Try a different name'
                : isPremium
                  ? 'Tap + to create your first playlist'
                  : `Tap + to create your free playlist (up to ${FREE_SONGS_PER_PLAYLIST} songs)`}
            />
          ) : (
            filteredPlaylists.map(pl => (
              <PlaylistItem styles={styles} c={c}
                key={pl.id}
                playlist={pl}
                onPress={() => openPlaylist(pl)}
                onLongPress={() =>
                  Alert.alert(
                    'Delete Playlist',
                    `Delete "${pl.name}"? This cannot be undone.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(pl.id) },
                    ]
                  )
                }
              />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        <PlaylistDetailModal styles={styles} c={c}
          visible={showPlaylistDetail}
          playlist={selectedPlaylist}
          onClose={() => setShowPlaylistDetail(false)}
          onPlaySong={openSong}
          onDelete={deletePlaylist}
        />
      </View>
    );
  }

  // ── DRILLDOWN: Artists ───────────────────────────────────────────────────
  if (drilldownView === 'artists') {
    const noResults = filteredFavArtists.length === 0 && filteredFollowedArtists.length === 0;
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c}
          title="Artists"
          count={totalArtistCount}
          onBack={exitDrill}
          actionIcon="add"
          onAction={() => setShowAddArtist(true)}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {noResults ? (
            <EmptyState styles={styles} c={c}
              icon="person-outline"
              title={drillSearch ? 'No matches' : 'No artists yet'}
              sub={drillSearch ? 'Try a different name' : 'Tap + to follow an artist'}
            />
          ) : (
            <>
              {/* Favourite Artists — chosen at onboarding */}
              {filteredFavArtists.length > 0 && (
                <>
                  <View style={styles.artistGroupHeader}>
                    <Text style={styles.artistGroupLabel}>Favourite Artists</Text>
                  </View>
                  {filteredFavArtists.map(a => (
                    <ArtistItem styles={styles} c={c}
                      key={`fav_${a.id || a.name}`}
                      artist={a}
                      onPress={() => navigation.navigate('Artist', { artist: a })}
                    />
                  ))}
                </>
              )}

              {/* Following — manually followed artists */}
              {filteredFollowedArtists.length > 0 && (
                <>
                  <View style={styles.artistGroupHeader}>
                    <Text style={styles.artistGroupLabel}>Following</Text>
                  </View>
                  {filteredFollowedArtists.map(a => (
                    <ArtistItem styles={styles} c={c}
                      key={`fol_${a.id || a.name}`}
                      artist={a}
                      onPress={() => navigation.navigate('Artist', { artist: a })}
                    />
                  ))}
                </>
              )}

              {/* Prompt to follow more when only onboarding picks exist */}
              {uniqueFollowed.length === 0 && filteredFavArtists.length > 0 && !drillSearch && (
                <View style={styles.artistFollowHint}>
                  <Ionicons name="add-circle-outline" size={18} color={c.textFaint} />
                  <Text style={styles.artistFollowHintText}>Tap + to follow more artists</Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        <AddArtistSheet styles={styles} c={c}
          visible={showAddArtist}
          value={newArtistName}
          onChangeText={setNewArtistName}
          onSubmit={handleAddArtist}
          onClose={() => { setShowAddArtist(false); setNewArtistName(''); }}
        />
      </View>
    );
  }

  // ── DRILLDOWN: Recently Played ───────────────────────────────────────────
  if (drilldownView === 'recent') {
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c}
          title="Recently Played"
          count={recentlyPlayed.length}
          onBack={exitDrill}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {filteredRecent.length === 0 ? (
            <EmptyState styles={styles} c={c}
              icon="time-outline"
              title={drillSearch ? 'No matches' : 'Nothing played yet'}
              sub={drillSearch ? 'Try a different search' : 'Songs you play will appear here'}
            />
          ) : (
            filteredRecent.map((song, idx) => (
              <SongItem styles={styles} c={c}
                key={`rec_${song.id}_${idx}`}
                song={song}
                index={idx}
                onPress={() => openSong(song, filteredRecent, idx)}
              />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── DRILLDOWN: Downloads (Music Videos + Audio) ──────────────────────────
  if (drilldownView === 'downloads') {
    const empty = downloadVideos.length === 0 && downloadAudios.length === 0;
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c} title="Downloads" count={downloadPool.length} onBack={exitDrill} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {empty ? (
            <EmptyState styles={styles} c={c}
              icon="cloud-download-outline"
              title="No downloads yet"
              sub="Songs and music videos you save will appear here"
            />
          ) : (
            <>
              {/* Music Videos — downloaded videos */}
              <View style={styles.artistGroupHeader}>
                <Text style={styles.artistGroupLabel}>Music Videos</Text>
              </View>
              {downloadVideos.length > 0 ? (
                downloadVideos.map((song, idx) => (
                  <SongItem styles={styles} c={c}
                    key={`dlv_${song.id}_${idx}`}
                    song={song}
                    index={idx}
                    onPress={() => openVideo(song, downloadVideos, idx)}
                  />
                ))
              ) : (
                <View style={styles.artistFollowHint}>
                  <Ionicons name="videocam-outline" size={18} color={c.textFaint} />
                  <Text style={styles.artistFollowHintText}>No downloaded videos yet</Text>
                </View>
              )}

              {/* Songs — downloaded audio (outside the video group) */}
              <View style={styles.artistGroupHeader}>
                <Text style={styles.artistGroupLabel}>Songs</Text>
              </View>
              {downloadAudios.length > 0 ? (
                downloadAudios.map((song, idx) => (
                  <SongItem styles={styles} c={c}
                    key={`dla_${song.id}_${idx}`}
                    song={song}
                    index={idx}
                    onPress={() => openSong(song, downloadAudios, idx)}
                  />
                ))
              ) : (
                <View style={styles.artistFollowHint}>
                  <Ionicons name="musical-notes-outline" size={18} color={c.textFaint} />
                  <Text style={styles.artistFollowHintText}>No downloaded songs yet</Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── DRILLDOWN: AI Music (user's created songs) ───────────────────────────
  if (drilldownView === 'aimusic') {
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c} title="AI Music" count={createdSongs.length} onBack={exitDrill} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {createdSongs.length === 0 ? (
            <EmptyState styles={styles} c={c}
              icon="sparkles-outline"
              title="No AI music yet"
              sub="Create a song in Create → Generate AI Song and it'll appear here"
            />
          ) : (
            createdSongs.map((song, idx) => (
              <SongItem styles={styles} c={c}
                key={`ai_${song.id}_${idx}`}
                song={song}
                index={idx}
                onPress={() => openSong(song, createdSongs, idx)}
              />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── DRILLDOWN: Albums (grouped by artist, responsive grid) ───────────────
  if (drilldownView === 'albums') {
    return (
      <View style={styles.container}>
        <DrillHeader styles={styles} c={c} title="Albums" count={albums.length} onBack={exitDrill} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {albums.length === 0 ? (
            <EmptyState styles={styles} c={c}
              icon="albums-outline"
              title="No albums yet"
              sub="Play or like songs and they'll group into albums here"
            />
          ) : (
            <View style={styles.albumGrid}>
              {albums.map(al => (
                <AlbumCard styles={styles} c={c} key={al.id} album={al} onPress={() => openPlaylist(al)} />
              ))}
            </View>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        <PlaylistDetailModal styles={styles} c={c}
          visible={showPlaylistDetail}
          playlist={selectedPlaylist}
          onClose={() => setShowPlaylistDetail(false)}
          onPlaySong={openSong}
          onDelete={deletePlaylist}
        />
      </View>
    );
  }

  // ── MAIN LIBRARY VIEW ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      <View style={styles.header}>
        {searchMode ? (
          <>
            <View style={styles.headerSearchBar}>
              <Ionicons name="search" size={16} color={c.textFaint} />
              <TextInput
                style={styles.headerSearchInput}
                placeholder="Search your library"
                placeholderTextColor={c.textFaint}
                value={librarySearch}
                onChangeText={setLibrarySearch}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {librarySearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setLibrarySearch('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={c.textFaint} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={exitSearch} activeOpacity={0.7}>
              <Text style={styles.searchCancel}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Your Library</Text>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setSearchMode(true)}
              activeOpacity={0.8}>
              <Ionicons name="search" size={19} color={c.textDim} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {searchMode ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainScroll}
          keyboardShouldPersistTaps="handled">
          {!searchResults ? (
            <EmptyState styles={styles} c={c}
              icon="search-outline"
              title="Search your library"
              sub="Find songs, playlists, artists and albums you've saved."
            />
          ) : resultCount === 0 ? (
            <EmptyState styles={styles} c={c}
              icon="sad-outline"
              title="No results"
              sub={`Nothing in your library matches "${librarySearch.trim()}".`}
            />
          ) : (
            <>
              {searchResults.songs.length > 0 && (
                <>
                  <LibSectionHeader styles={styles} c={c} title={`Songs · ${searchResults.songs.length}`} />
                  <View style={styles.collectionBlock}>
                    {searchResults.songs.map((song, i) => (
                      <SongItem styles={styles} c={c}
                        key={song.id}
                        song={song}
                        index={i}
                        onPress={() => openSong(song, searchResults.songs, i)}
                      />
                    ))}
                  </View>
                </>
              )}

              {searchResults.playlists.length > 0 && (
                <>
                  <LibSectionHeader styles={styles} c={c} title={`Playlists · ${searchResults.playlists.length}`} />
                  <View style={styles.collectionBlock}>
                    {searchResults.playlists.map((playlist) => (
                      <PlaylistItem styles={styles} c={c}
                        key={playlist.id}
                        playlist={playlist}
                        onPress={() => openPlaylist(playlist)}
                      />
                    ))}
                  </View>
                </>
              )}

              {searchResults.artists.length > 0 && (
                <>
                  <LibSectionHeader styles={styles} c={c} title={`Artists · ${searchResults.artists.length}`} />
                  <View style={styles.collectionBlock}>
                    {searchResults.artists.map((artist) => (
                      <ArtistItem styles={styles} c={c}
                        key={artist.id || artist.name}
                        artist={artist}
                        onPress={() => navigation.navigate('Artist', { artist })}
                      />
                    ))}
                  </View>
                </>
              )}

              {searchResults.albums.length > 0 && (
                <>
                  <LibSectionHeader styles={styles} c={c} title={`Albums · ${searchResults.albums.length}`} />
                  <View style={styles.collectionBlock}>
                    {searchResults.albums.map((album) => (
                      <PlaylistItem styles={styles} c={c}
                        key={album.id}
                        playlist={album}
                        onPress={() => openPlaylist(album)}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>

        {/* ── Quick access row ── */}
        <View style={styles.quickRow}>
          <QuickCard styles={styles} c={c}
            icon="heart"
            label="Liked Songs"
            count={likedSongs.length}
            image={likedSongs.find(s => s.imageUrl)?.imageUrl}
            onPress={() => setDrilldownView('liked')}
          />
          <QuickCard styles={styles} c={c}
            icon="time-outline"
            label="Recent"
            count={recentlyPlayed.length}
            image={recentlyPlayed.find(s => s.imageUrl)?.imageUrl}
            onPress={() => setDrilldownView('recent')}
          />
          <QuickCard styles={styles} c={c}
            icon="cloud-download-outline"
            label="Downloads"
            count={downloadPool.length}
            image={downloadPool.find(s => s.imageUrl)?.imageUrl}
            onPress={() => setDrilldownView('downloads')}
          />
        </View>

        {/* ── Library — the browseable collections (quick cards cover Liked / Recent / Downloads) ── */}
        <LibSectionHeader styles={styles} c={c} title="Library" />

        <View style={styles.collectionBlock}>
          <CollectionRow styles={styles} c={c}
            icon="list-outline"
            label="Playlists"
            count={userPlaylists2.length}
            onPress={handlePlaylists}
          />
          <CollectionRow styles={styles} c={c}
            icon="albums-outline"
            label="Albums"
            count={albums.length}
            onPress={() => setDrilldownView('albums')}
          />
          <CollectionRow styles={styles} c={c}
            icon="person-outline"
            label="Artists"
            count={totalArtistCount}
            onPress={() => setDrilldownView('artists')}
          />
          <CollectionRow styles={styles} c={c}
            icon="sparkles-outline"
            label="AI Music"
            count={createdSongs.length}
            onPress={() => setDrilldownView('aimusic')}
          />
        </View>

        {/* ── Account ── */}
        <LibSectionHeader styles={styles} c={c} title="Account" />

        <View style={styles.collectionBlock}>
          <CollectionRow styles={styles} c={c}
            icon="person-circle-outline"
            label="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <CollectionRow styles={styles} c={c}
            icon={isPremium ? 'diamond-outline' : 'star-outline'}
            label={isPremium ? 'Manage Premium' : 'Upgrade to Premium'}
            onPress={() => navigation.navigate('Premium')}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      )}

      {/* Playlist detail modal — accessible from main view */}
      <PlaylistDetailModal styles={styles} c={c}
        visible={showPlaylistDetail}
        playlist={selectedPlaylist}
        onClose={() => setShowPlaylistDetail(false)}
        onPlaySong={openSong}
          onDelete={deletePlaylist}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
  },
  title: { fontSize: 28, fontWeight: '900', color: c.text, letterSpacing: -0.5 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerSearchBar: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: c.border,
  },
  headerSearchInput: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600', padding: 0 },
  searchCancel: { color: c.textDim, fontSize: 14, fontWeight: '800', marginLeft: 14 },

  mainScroll: { paddingBottom: 20 },

  // Quick cards row
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  quickCard: {
    flex: 1, backgroundColor: c.surface, borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center',
    borderWidth: 1, borderColor: c.border, gap: 8,
  },
  quickIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  quickCardImage: { width: '100%', height: '100%' },
  quickLabel: { color: c.textDim, fontSize: 11.5, fontWeight: '800', textAlign: 'center' },
  quickCount: { color: c.text, fontSize: 17, fontWeight: '900' },

  // Section headers
  libSectionHeader: {
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10,
  },
  libSectionTitle: { fontSize: 12, fontWeight: '900', color: c.textDim, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Collection block
  collectionBlock: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.border,
    overflow: 'hidden',
  },
  collRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border,
    gap: 14,
  },
  collIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
  },
  collInfo: { flex: 1 },
  collLabel: { color: c.text, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  collLabelMuted: { color: c.textFaint },
  collCount: { color: c.textDim, fontSize: 12.5, marginTop: 3, fontWeight: '700' },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.elevated, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: c.borderStrong,
  },
  lockText: { color: c.textDim, fontSize: 10, fontWeight: '800' },
  soonBadge: {
    backgroundColor: c.elevated, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: c.borderStrong,
  },
  soonText: { color: c.textDim, fontSize: 10, fontWeight: '800' },

  // Drilldown
  drillHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  drillBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  drillTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drillTitle: { fontSize: 21, fontWeight: '900', color: c.text, letterSpacing: -0.3 },
  drillCount: {
    fontSize: 12, fontWeight: '800', color: c.textDim,
    backgroundColor: c.elevated, paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
  },

  drillToolbar: { paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  drillSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: c.border,
  },
  drillSearchInput: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border,
  },
  sortPillActive: { backgroundColor: c.accent, borderColor: c.accent },
  sortPillText: { color: c.textDim, fontSize: 12, fontWeight: '800' },
  sortPillTextActive: { color: c.accentText },

  drillScroll: { paddingHorizontal: 20 },

  // Albums grid — responsive 2-column, square art
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  albumCard: { width: '48%', marginBottom: 18 },
  albumArt: {
    width: '100%', aspectRatio: 1, borderRadius: 12,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: c.border,
  },
  albumArtImg: { width: '100%', height: '100%' },
  albumEmoji: { fontSize: 46 },
  albumName: { color: c.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  albumCount: { color: c.textDim, fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Generic item row
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 10,
    padding: 12, marginBottom: 8, gap: 12,
  },
  itemArt: {
    width: 60, height: 60, borderRadius: 10,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  artistArt: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.borderStrong, overflow: 'hidden',
  },
  itemEmoji: { fontSize: 24 },
  itemArtImage: { width: '100%', height: '100%', borderRadius: 10 },
  artistArtImage: { width: '100%', height: '100%', borderRadius: 24 },
  itemInfo: { flex: 1 },
  itemTitle: { color: c.text, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  itemSub: { color: c.textDim, fontSize: 12.5, marginTop: 3, fontWeight: '700' },
  songIdx: { color: c.textDim, fontSize: 13, fontWeight: '800', width: 22, textAlign: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { color: c.textDim, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  emptySub: { color: c.textFaint, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30, fontWeight: '600' },
  emptyActionBtn: {
    marginTop: 8, paddingHorizontal: 22, paddingVertical: 11,
    backgroundColor: c.accent, borderRadius: 20,
  },
  emptyActionText: { color: c.accentText, fontSize: 13, fontWeight: '800' },

  // Add artist sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 48, borderTopWidth: 1, borderColor: c.border,
  },
  sheetHandle: { width: 36, height: 3, backgroundColor: c.borderStrong, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: c.text, marginBottom: 18, textAlign: 'center', letterSpacing: -0.3 },
  sheetInput: {
    backgroundColor: c.elevated, color: c.text,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, fontSize: 15, marginBottom: 14,
    borderWidth: 1, borderColor: c.borderStrong,
  },
  sheetBtn: { backgroundColor: c.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  sheetBtnText: { color: c.accentText, fontSize: 15.5, fontWeight: '900', letterSpacing: -0.2 },
  sheetCancel: { paddingVertical: 12, alignItems: 'center' },
  sheetCancelText: { color: c.textDim, fontSize: 14, fontWeight: '700' },

  // Artist group headers
  artistGroupHeader: {
    paddingTop: 20, paddingBottom: 8,
  },
  artistGroupLabel: {
    fontSize: 11, fontWeight: '800', color: c.textDim,
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  artistFollowHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 18, justifyContent: 'center',
  },
  artistFollowHintText: { color: c.textDim, fontSize: 13, fontWeight: '600' },

  // Playlist detail modal
  detailContainer: { flex: 1, backgroundColor: c.bg, paddingTop: 56 },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 24,
  },
  detailHeaderTitle: { color: c.text, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center', marginHorizontal: 8, letterSpacing: -0.2 },
  detailHero: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 28 },
  detailHeroArt: {
    width: 150, height: 150, borderRadius: 18,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: c.border,
  },
  detailHeroImage: { width: '100%', height: '100%', borderRadius: 18 },
  detailHeroName: { color: c.text, fontSize: 23, fontWeight: '900', marginBottom: 4, letterSpacing: -0.3 },
  detailHeroCount: { color: c.textDim, fontSize: 13, fontWeight: '700', marginBottom: 16 },
  detailPlayAll: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.accent, paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 20,
  },
  detailPlayAllText: { color: c.accentText, fontSize: 14, fontWeight: '800' },
  detailSongRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 12,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  detailSongIdx: { color: c.textDim, fontSize: 13, width: 22, textAlign: 'center', fontWeight: '800' },
  detailSongArt: {
    width: 48, height: 48, backgroundColor: c.surface,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailSongImage: { width: '100%', height: '100%', borderRadius: 10 },
});
