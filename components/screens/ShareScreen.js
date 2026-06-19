 import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';

export default function ShareScreen({ navigation }) {
  const currentSong = {
    title: 'Sample Song 1',
    artist: 'Sample Artist',
  };

  const shareToApp = async (app) => {
    try {
      const message = `🎵 I'm listening to "${currentSong.title}" by ${currentSong.artist} on Sonara! Download Sonara and enjoy amazing music! 🎶`;
      await Share.share({
        message,
        title: 'Check out this song on Sonara!',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share right now');
    }
  };

  const scanMusicCode = () => {
    Alert.alert(
      '📸 Scan Music Code',
      'Point your camera at a Sonara music code to instantly play that song!',
      [{ text: 'OK' }]
    );
  };

  const shareOptions = [
    { id: '1', name: 'WhatsApp', emoji: '💬', color: '#25D366', app: 'whatsapp' },
    { id: '2', name: 'WhatsApp Status', emoji: '📱', color: '#25D366', app: 'whatsapp_status' },
    { id: '3', name: 'Instagram Story', emoji: '📸', color: '#E1306C', app: 'instagram' },
    { id: '4', name: 'X (Twitter)', emoji: '🐦', color: '#1DA1F2', app: 'twitter' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share 📤</Text>

      {/* Currently Playing */}
      <View style={styles.currentSong}>
        <View style={styles.songImage}>
          <Text style={styles.songEmoji}>🎵</Text>
        </View>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{currentSong.title}</Text>
          <Text style={styles.songArtist}>{currentSong.artist}</Text>
          <Text style={styles.nowPlaying}>Now Playing</Text>
        </View>
      </View>

      {/* Share Options */}
      <Text style={styles.sectionTitle}>Share to:</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {shareOptions.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[styles.shareCard, { borderColor: option.color }]}
            onPress={() => shareToApp(option.app)}>
            <View style={[styles.shareIcon, { backgroundColor: option.color }]}>
              <Text style={styles.shareEmoji}>{option.emoji}</Text>
            </View>
            <Text style={styles.shareName}>{option.name}</Text>
            <Text style={styles.shareArrow}>→</Text>
          </TouchableOpacity>
        ))}

        {/* Scan Music Code */}
        <Text style={styles.sectionTitle}>Scan Music Code:</Text>
        <TouchableOpacity style={styles.scanCard} onPress={scanMusicCode}>
          <View style={styles.scanIcon}>
            <Text style={styles.scanEmoji}>📷</Text>
          </View>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle}>Scan Sonara Code</Text>
            <Text style={styles.scanDesc}>Point camera at a music code to play instantly</Text>
          </View>
        </TouchableOpacity>

        {/* Generate Music Code */}
        <TouchableOpacity
          style={styles.generateCard}
          onPress={() => Alert.alert('🎵 Music Code', 'Your Sonara music code has been generated! Share it with friends so they can instantly play this song!')}>
          <Text style={styles.generateIcon}>🎯</Text>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle}>Generate Music Code</Text>
            <Text style={styles.scanDesc}>Create a code for this song to share with friends</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  currentSong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  songImage: {
    width: 55,
    height: 55,
    backgroundColor: '#282828',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  songEmoji: {
    fontSize: 25,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#B3B3B3',
    fontSize: 13,
    marginTop: 3,
  },
  nowPlaying: {
    color: '#1DB954',
    fontSize: 11,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  shareIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  shareEmoji: {
    fontSize: 22,
  },
  shareName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  shareArrow: {
    color: '#888',
    fontSize: 18,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#282828',
  },
  scanIcon: {
    width: 45,
    height: 45,
    backgroundColor: '#282828',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  scanEmoji: {
    fontSize: 22,
  },
  scanInfo: {
    flex: 1,
  },
  scanTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  scanDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  generateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  generateIcon: {
    fontSize: 30,
    marginRight: 15,
  },
});
