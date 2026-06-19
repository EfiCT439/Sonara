import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useUser } from '../../context/UserContext';

const SAMPLE_SONGS = [
  { id: '1', title: 'Sample Song 1', artist: 'Sample Artist', genre: 'Afrobeats', emoji: '🎵' },
  { id: '2', title: 'Sample Song 2', artist: 'Sample Artist 2', genre: 'Hip Hop', emoji: '🎶' },
  { id: '3', title: 'Sample Song 3', artist: 'Sample Artist 3', genre: 'Pop', emoji: '🎸' },
  { id: '4', title: 'Sample Song 4', artist: 'Sample Artist 4', genre: 'R&B', emoji: '🎹' },
  { id: '5', title: 'Sample Song 5', artist: 'Sample Artist 5', genre: 'Soul', emoji: '🎺' },
  { id: '6', title: 'Sample Song 6', artist: 'Sample Artist 6', genre: 'Jazz', emoji: '🎻' },
];

const SAMPLE_ARTISTS = [
  { id: '1', name: 'Burna Boy', genre: 'Afrobeats', emoji: '🎤' },
  { id: '2', name: 'Wizkid', genre: 'Afrobeats', emoji: '🎤' },
  { id: '3', name: 'Drake', genre: 'Hip Hop', emoji: '🎤' },
  { id: '4', name: 'Davido', genre: 'Afrobeats', emoji: '🎤' },
];

export default function HomeScreen({ navigation }) {
  const { isPremium } = useUser();
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()} 👋</Text>
          <Text style={styles.headerTitle}>Welcome to Sonara</Text>
        </View>
        <View style={styles.headerRight}>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>💎 Premium</Text>
            </View>
          )}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        </View>
      </View>

      {/* Upgrade banner for free users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeBanner}
          onPress={() => navigation.navigate('Paywall')}>
          <Text style={styles.upgradeBannerText}>
            💎 Upgrade to Premium for just $1/month!
          </Text>
          <Text style={styles.upgradeBannerSubtext}>No ads • Unlimited skips • Downloads</Text>
        </TouchableOpacity>
      )}

      {/* Your Artists */}
      <Text style={styles.sectionTitle}>Your Artists 🎤</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {SAMPLE_ARTISTS.map(artist => (
          <TouchableOpacity
            key={artist.id}
            style={styles.artistCard}
            onPress={() => navigation.navigate('Artist', { artist })}>
            <View style={styles.artistImage}>
              <Text style={styles.artistEmoji}>{artist.emoji}</Text>
            </View>
            <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
            <Text style={styles.artistGenre}>{artist.genre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommended Songs */}
      <Text style={styles.sectionTitle}>Recommended For You 🎵</Text>
      <View style={styles.songsContainer}>
        {SAMPLE_SONGS.map((song, index) => (
          <TouchableOpacity
            key={song.id}
            style={styles.songCard}
            onPress={() => navigation.navigate('Player', { song, songIndex: index })}>
            <View style={styles.songImage}>
              <Text style={styles.songEmoji}>{song.emoji}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              <Text style={styles.songGenre}>{song.genre}</Text>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom spacing for mini player */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#1DB954',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  upgradeBanner: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  upgradeBannerText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  upgradeBannerSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  horizontalScroll: {
    paddingLeft: 20,
    marginBottom: 25,
  },
  artistCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
  },
  artistImage: {
    width: 70,
    height: 70,
    backgroundColor: '#1A1A1A',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#1DB954',
  },
  artistEmoji: {
    fontSize: 30,
  },
  artistName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  artistGenre: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  songsContainer: {
    paddingHorizontal: 20,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  songImage: {
    width: 55,
    height: 55,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  songEmoji: {
    fontSize: 25,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  songGenre: {
    color: '#1DB954',
    fontSize: 11,
    marginTop: 3,
  },
  playButton: {
    padding: 8,
  },
  playIcon: {
    fontSize: 22,
  },
});