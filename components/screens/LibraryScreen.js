import { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Alert, TextInput, Modal, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

// ─── All sub-components at module scope (keyboard-bug rule) ─────────────────

function QuickCard({ icon, label, count, onPress }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={20} color="#aaa" />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
      {count !== undefined && count !== null && (
        <Text style={styles.quickCount}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

function LibSectionHeader({ title }) {
  return (
    <View style={styles.libSectionHeader}>
      <Text style={styles.libSectionTitle}>{title}</Text>
    </View>
  );
}

function CollectionRow({ icon, label, count, badge, locked, comingSoon, onPress }) {
  return (
    <TouchableOpacity style={styles.collRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.collIconWrap}>
        <Ionicons name={icon} size={18} color="#666" />
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
          <Ionicons name="lock-closed" size={9} color="#555" />
          <Text style={styles.lockText}>Premium</Text>
        </View>
      )}
      {comingSoon && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      )}
      {!locked && !comingSoon && (
        <Ionicons name="chevron-forward" size={15} color="#2A2A2A" />
      )}
    </TouchableOpacity>
  );
}

function PlaylistItem({ playlist, onPress, onLongPress }) {
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
      <Ionicons name="chevron-forward" size={15} color="#2A2A2A" />
    </TouchableOpacity>
  );
}

function ArtistItem({ artist, onPress }) {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.artistArt}>
        {artist.imageUrl
          ? <Image source={{ uri: artist.imageUrl }} style={styles.artistArtImage} />
          : <Text style={styles.itemEmoji}>{artist.emoji || '🎤'}</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{artist.name}</Text>
        <Text style={styles.itemSub}>{artist.genre || 'Artist'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#2A2A2A" />
    </TouchableOpacity>
  );
}

function SongItem({ song, index, onPress }) {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.songIdx}>{index + 1}</Text>
      <View style={styles.itemArt}>
        {song.imageUrl
          ? <Image source={{ uri: song.imageUrl }} style={styles.itemArtImage} />
          : <Text style={styles.itemEmoji}>{song.emoji || '🎵'}</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{song.title}</Text>
        <Text style={styles.itemSub}>{song.artist}</Text>
      </View>
      <Ionicons name="play" size={13} color="#333" />
    </TouchableOpacity>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={44} color="#1E1E1E" />
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

function DrillHeader({ title, count, onBack, onAction, actionIcon }) {
  return (
    <View style={styles.drillHeader}>
      <TouchableOpacity style={styles.drillBackBtn} onPress={onBack} activeOpacity={0.75}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <View style={styles.drillTitleWrap}>
        <Text style={styles.drillTitle}>{title}</Text>
        {count !== undefined && <Text style={styles.drillCount}>{count}</Text>}
      </View>
      {actionIcon ? (
        <TouchableOpacity style={styles.drillBackBtn} onPress={onAction} activeOpacity={0.75}>
          <Ionicons name={actionIcon} size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 38 }} />
      )}
    </View>
  );
}

function AddArtistSheet({ visible, value, onChangeText, onSubmit, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Follow Artist</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="Type artist name…"
            placeholderTextColor="#333"
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

function PlaylistDetailModal({ visible, playlist, onClose, onPlaySong }) {
  if (!playlist) return null;
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.drillBackBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle} numberOfLines={1}>{playlist.name}</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.detailHero}>
          <View style={styles.detailHeroArt}>
            {playlist.isLikedSongs
              ? <Ionicons name="heart" size={54} color="#fff" />
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
              <Ionicons name="play" size={15} color="#000" />
              <Text style={styles.detailPlayAllText}>Play All</Text>
            </TouchableOpacity>
          )}
        </View>

        {(!playlist.songs || playlist.songs.length === 0) ? (
          <EmptyState
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
              <TouchableOpacity
                style={styles.detailSongRow}
                onPress={() => { onClose(); onPlaySong(item, playlist.songs, index); }}
                activeOpacity={0.75}>
                <Text style={styles.detailSongIdx}>{index + 1}</Text>
                <View style={styles.detailSongArt}>
                  {item.imageUrl
                    ? <Image source={{ uri: item.imageUrl }} style={styles.detailSongImage} />
                    : <Text style={styles.itemEmoji}>{item.emoji || '🎵'}</Text>}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>{item.artist}</Text>
                </View>
                <Ionicons name="play-circle-outline" size={24} color="#333" />
              </TouchableOpacity>
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

  const filteredRecent = useMemo(() => {
    if (!drillSearch.trim()) return recentlyPlayed;
    const q = drillSearch.toLowerCase();
    return recentlyPlayed.filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [recentlyPlayed, drillSearch]);

  const filteredLiked = useMemo(() => {
    if (!drillSearch.trim()) return likedSongs;
    const q = drillSearch.toLowerCase();
    return likedSongs.filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [likedSongs, drillSearch]);

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
          { text: 'Go Premium 💎', onPress: () => navigation.navigate('Premium') },
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
        <Ionicons name="search" size={15} color="#444" />
        <TextInput
          style={styles.drillSearchInput}
          placeholder="Search…"
          placeholderTextColor="#333"
          value={drillSearch}
          onChangeText={setDrillSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {drillSearch.length > 0 && (
          <TouchableOpacity onPress={() => setDrillSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={15} color="#444" />
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
        <DrillHeader
          title="Liked Songs"
          count={likedSongs.length}
          onBack={exitDrill}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {filteredLiked.length === 0 ? (
            <EmptyState
              icon="heart-outline"
              title={drillSearch ? 'No matches' : 'No liked songs yet'}
              sub={drillSearch ? 'Try a different search' : 'Tap the heart on any song to save it here'}
            />
          ) : (
            filteredLiked.map((song, idx) => (
              <SongItem
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
        <DrillHeader
          title="Playlists"
          count={userPlaylists2.length}
          onBack={exitDrill}
          actionIcon="add"
          onAction={handleCreatePlaylist}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {filteredPlaylists.length === 0 ? (
            <EmptyState
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
              <PlaylistItem
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

        <PlaylistDetailModal
          visible={showPlaylistDetail}
          playlist={selectedPlaylist}
          onClose={() => setShowPlaylistDetail(false)}
          onPlaySong={openSong}
        />
      </View>
    );
  }

  // ── DRILLDOWN: Artists ───────────────────────────────────────────────────
  if (drilldownView === 'artists') {
    const noResults = filteredFavArtists.length === 0 && filteredFollowedArtists.length === 0;
    return (
      <View style={styles.container}>
        <DrillHeader
          title="Artists"
          count={totalArtistCount}
          onBack={exitDrill}
          actionIcon="add"
          onAction={() => setShowAddArtist(true)}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {noResults ? (
            <EmptyState
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
                    <ArtistItem
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
                    <ArtistItem
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
                  <Ionicons name="add-circle-outline" size={18} color="#333" />
                  <Text style={styles.artistFollowHintText}>Tap + to follow more artists</Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        <AddArtistSheet
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
        <DrillHeader
          title="Recently Played"
          count={recentlyPlayed.length}
          onBack={exitDrill}
        />
        {renderDrillToolbar()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {filteredRecent.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title={drillSearch ? 'No matches' : 'Nothing played yet'}
              sub={drillSearch ? 'Try a different search' : 'Songs you play will appear here'}
            />
          ) : (
            filteredRecent.map((song, idx) => (
              <SongItem
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
        <DrillHeader title="Downloads" count={downloadPool.length} onBack={exitDrill} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {empty ? (
            <EmptyState
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
                  <SongItem
                    key={`dlv_${song.id}_${idx}`}
                    song={song}
                    index={idx}
                    onPress={() => openVideo(song, downloadVideos, idx)}
                  />
                ))
              ) : (
                <View style={styles.artistFollowHint}>
                  <Ionicons name="videocam-outline" size={18} color="#333" />
                  <Text style={styles.artistFollowHintText}>No downloaded videos yet</Text>
                </View>
              )}

              {/* Songs — downloaded audio (outside the video group) */}
              <View style={styles.artistGroupHeader}>
                <Text style={styles.artistGroupLabel}>Songs</Text>
              </View>
              {downloadAudios.length > 0 ? (
                downloadAudios.map((song, idx) => (
                  <SongItem
                    key={`dla_${song.id}_${idx}`}
                    song={song}
                    index={idx}
                    onPress={() => openSong(song, downloadAudios, idx)}
                  />
                ))
              ) : (
                <View style={styles.artistFollowHint}>
                  <Ionicons name="musical-notes-outline" size={18} color="#333" />
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
        <DrillHeader title="AI Music" count={createdSongs.length} onBack={exitDrill} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {createdSongs.length === 0 ? (
            <EmptyState
              icon="sparkles-outline"
              title="No AI music yet"
              sub="Create a song in Create → Generate AI Song and it'll appear here"
            />
          ) : (
            createdSongs.map((song, idx) => (
              <SongItem
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
        <DrillHeader title="Albums" count={albums.length} onBack={exitDrill} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drillScroll}>
          {albums.length === 0 ? (
            <EmptyState
              icon="albums-outline"
              title="No albums yet"
              sub="Play or like songs and they'll group into albums here"
            />
          ) : (
            <View style={styles.albumGrid}>
              {albums.map(al => (
                <TouchableOpacity key={al.id} style={styles.albumCard} onPress={() => openPlaylist(al)} activeOpacity={0.8}>
                  <View style={styles.albumArt}>
                    {al.imageUrl
                      ? <Image source={{ uri: al.imageUrl }} style={styles.albumArtImg} />
                      : <Text style={styles.albumEmoji}>{al.emoji}</Text>}
                  </View>
                  <Text style={styles.albumName} numberOfLines={1}>{al.name}</Text>
                  <Text style={styles.albumCount}>{al.songs.length} {al.songs.length === 1 ? 'song' : 'songs'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        <PlaylistDetailModal
          visible={showPlaylistDetail}
          playlist={selectedPlaylist}
          onClose={() => setShowPlaylistDetail(false)}
          onPlaySong={openSong}
        />
      </View>
    );
  }

  // ── MAIN LIBRARY VIEW ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}>
          <Ionicons name="search" size={19} color="#aaa" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>

        {/* ── Quick access row ── */}
        <View style={styles.quickRow}>
          <QuickCard
            icon="heart"
            label="Liked Songs"
            count={likedSongs.length}
            onPress={() => setDrilldownView('liked')}
          />
          <QuickCard
            icon="time-outline"
            label="Recent"
            count={recentlyPlayed.length}
            onPress={() => setDrilldownView('recent')}
          />
          <QuickCard
            icon="cloud-download-outline"
            label="Downloads"
            count={downloadPool.length}
            onPress={() => setDrilldownView('downloads')}
          />
        </View>

        {/* ── My Collection ── */}
        <LibSectionHeader title="My Collection" />

        <View style={styles.collectionBlock}>
          <CollectionRow
            icon="musical-notes-outline"
            label="Liked Songs"
            count={likedSongs.length}
            onPress={() => setDrilldownView('liked')}
          />
          <CollectionRow
            icon="list-outline"
            label="Playlists"
            count={userPlaylists2.length}
            onPress={handlePlaylists}
          />
          <CollectionRow
            icon="albums-outline"
            label="Albums"
            count={albums.length}
            onPress={() => setDrilldownView('albums')}
          />
          <CollectionRow
            icon="person-outline"
            label="Artists"
            count={totalArtistCount}
            onPress={() => setDrilldownView('artists')}
          />
          <CollectionRow
            icon="cloud-download-outline"
            label="Downloads"
            count={downloadPool.length}
            onPress={() => setDrilldownView('downloads')}
          />
        </View>

        {/* ── Personal Content ── */}
        <LibSectionHeader title="Personal" />

        <View style={styles.collectionBlock}>
          <CollectionRow
            icon="time-outline"
            label="Recently Played"
            count={recentlyPlayed.length}
            onPress={() => setDrilldownView('recent')}
          />
          <CollectionRow
            icon="heart-outline"
            label="Favorites"
            count={likedSongs.length}
            onPress={() => setDrilldownView('liked')}
          />
          <CollectionRow
            icon="sparkles-outline"
            label="AI Music"
            count={createdSongs.length}
            onPress={() => setDrilldownView('aimusic')}
          />
        </View>

        {/* ── Organization ── */}
        <LibSectionHeader title="Organization" />

        <View style={styles.collectionBlock}>
          <CollectionRow
            icon="search-outline"
            label="Search Library"
            onPress={() => navigation.navigate('Search')}
          />
          <CollectionRow
            icon="filter-outline"
            label="Sort & Filter"
            onPress={() => {
              Alert.alert('Sort & Filter', 'Choose how to sort your library', [
                { text: 'Recently Added', onPress: () => setSortBy('added') },
                { text: 'Recently Played', onPress: () => setSortBy('recent') },
                { text: 'A – Z', onPress: () => setSortBy('alpha') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
        </View>

        {/* ── Account ── */}
        <LibSectionHeader title="Account" />

        <View style={styles.collectionBlock}>
          <CollectionRow
            icon="person-circle-outline"
            label="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <CollectionRow
            icon={isPremium ? 'diamond-outline' : 'star-outline'}
            label={isPremium ? 'Manage Premium' : 'Upgrade to Premium'}
            onPress={() => navigation.navigate('Premium')}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Playlist detail modal — accessible from main view */}
      <PlaylistDetailModal
        visible={showPlaylistDetail}
        playlist={selectedPlaylist}
        onClose={() => setShowPlaylistDetail(false)}
        onPlaySong={openSong}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1E1E1E',
  },

  mainScroll: { paddingBottom: 20 },

  // Quick cards row
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  quickCard: {
    flex: 1, backgroundColor: '#111', borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#1A1A1A', gap: 8,
  },
  quickIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { color: '#ccc', fontSize: 11.5, fontWeight: '800', textAlign: 'center' },
  quickCount: { color: '#fff', fontSize: 17, fontWeight: '900' },

  // Section headers
  libSectionHeader: {
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10,
  },
  libSectionTitle: { fontSize: 12, fontWeight: '900', color: '#8A8A8A', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Collection block
  collectionBlock: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  collRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#161616',
    gap: 14,
  },
  collIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  collInfo: { flex: 1 },
  collLabel: { color: '#fff', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  collLabelMuted: { color: '#666' },
  collCount: { color: '#9A9A9A', fontSize: 12.5, marginTop: 3, fontWeight: '700' },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A',
  },
  lockText: { color: '#888', fontSize: 10, fontWeight: '800' },
  soonBadge: {
    backgroundColor: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A',
  },
  soonText: { color: '#888', fontSize: 10, fontWeight: '800' },

  // Drilldown
  drillHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  drillBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  drillTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drillTitle: { fontSize: 21, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  drillCount: {
    fontSize: 12, fontWeight: '800', color: '#ccc',
    backgroundColor: '#1A1A1A', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
  },

  drillToolbar: { paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  drillSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  drillSearchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  sortPillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  sortPillText: { color: '#9A9A9A', fontSize: 12, fontWeight: '800' },
  sortPillTextActive: { color: '#000' },

  drillScroll: { paddingHorizontal: 20 },

  // Albums grid — responsive 2-column, square art
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  albumCard: { width: '48%', marginBottom: 18 },
  albumArt: {
    width: '100%', aspectRatio: 1, borderRadius: 12,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: '#1A1A1A',
  },
  albumArtImg: { width: '100%', height: '100%' },
  albumEmoji: { fontSize: 46 },
  albumName: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  albumCount: { color: '#9A9A9A', fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Generic item row
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 10,
    padding: 12, marginBottom: 8, gap: 12,
  },
  itemArt: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  artistArt: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden',
  },
  itemEmoji: { fontSize: 24 },
  itemArtImage: { width: '100%', height: '100%', borderRadius: 10 },
  artistArtImage: { width: '100%', height: '100%', borderRadius: 24 },
  itemInfo: { flex: 1 },
  itemTitle: { color: '#fff', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  itemSub: { color: '#9A9A9A', fontSize: 12.5, marginTop: 3, fontWeight: '700' },
  songIdx: { color: '#888', fontSize: 13, fontWeight: '800', width: 22, textAlign: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { color: '#bbb', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  emptySub: { color: '#777', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30, fontWeight: '600' },
  emptyActionBtn: {
    marginTop: 8, paddingHorizontal: 22, paddingVertical: 11,
    backgroundColor: '#fff', borderRadius: 20,
  },
  emptyActionText: { color: '#000', fontSize: 13, fontWeight: '800' },

  // Add artist sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 48, borderTopWidth: 1, borderColor: '#1E1E1E',
  },
  sheetHandle: { width: 36, height: 3, backgroundColor: '#222', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 18, textAlign: 'center', letterSpacing: -0.3 },
  sheetInput: {
    backgroundColor: '#1A1A1A', color: '#fff',
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, fontSize: 15, marginBottom: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  sheetBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  sheetBtnText: { color: '#000', fontSize: 15.5, fontWeight: '900', letterSpacing: -0.2 },
  sheetCancel: { paddingVertical: 12, alignItems: 'center' },
  sheetCancelText: { color: '#888', fontSize: 14, fontWeight: '700' },

  // Artist group headers
  artistGroupHeader: {
    paddingTop: 20, paddingBottom: 8,
  },
  artistGroupLabel: {
    fontSize: 11, fontWeight: '800', color: '#8A8A8A',
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  artistFollowHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 18, justifyContent: 'center',
  },
  artistFollowHintText: { color: '#888', fontSize: 13, fontWeight: '600' },

  // Playlist detail modal
  detailContainer: { flex: 1, backgroundColor: '#000', paddingTop: 56 },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 24,
  },
  detailHeaderTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center', marginHorizontal: 8, letterSpacing: -0.2 },
  detailHero: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 28 },
  detailHeroArt: {
    width: 150, height: 150, borderRadius: 18,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E',
  },
  detailHeroImage: { width: '100%', height: '100%', borderRadius: 18 },
  detailHeroName: { color: '#fff', fontSize: 23, fontWeight: '900', marginBottom: 4, letterSpacing: -0.3 },
  detailHeroCount: { color: '#9A9A9A', fontSize: 13, fontWeight: '700', marginBottom: 16 },
  detailPlayAll: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 20,
  },
  detailPlayAllText: { color: '#000', fontSize: 14, fontWeight: '800' },
  detailSongRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  detailSongIdx: { color: '#888', fontSize: 13, width: 22, textAlign: 'center', fontWeight: '800' },
  detailSongArt: {
    width: 48, height: 48, backgroundColor: '#111',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailSongImage: { width: '100%', height: '100%', borderRadius: 10 },
});
