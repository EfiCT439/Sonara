import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen({ navigation }) {
  const { isPremium, setIsPremium, favouriteArtists } = useUser();
  const [user] = useState(auth.currentUser);
  const [profileImage, setProfileImage] = useState(null);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Could not logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleAddAccount = () => {
    Alert.alert(
      'Add Account',
      'You will be logged out to add a new account. Continue?',
      [
        { text: 'Cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await signOut(auth);
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignUp' }],
            });
          }
        }
      ]
    );
  };

  const handleUploadPhoto = () => {
    Alert.alert(
      '📸 Profile Photo',
      'Choose an option',
      [
        { text: 'Cancel' },
        {
          text: '📷 Take Photo',
          onPress: () => Alert.alert('Coming Soon', 'Camera feature coming in next update!')
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => Alert.alert('Coming Soon', 'Gallery feature coming in next update!')
        },
        {
          text: '🗑️ Remove Photo',
          style: 'destructive',
          onPress: () => setProfileImage(null)
        }
      ]
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      '🔔 Notifications',
      'Your Notifications',
      [
        { text: 'No new notifications' },
        { text: 'OK' }
      ]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      '🔒 Privacy & Security',
      'Privacy Settings',
      [
        { text: 'Data & Privacy Policy' },
        { text: 'Delete Account', style: 'destructive' },
        { text: 'Close' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadPhoto}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>+</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.uploadHint}>Tap to update photo</Text>
        <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>💎 Premium Member</Text>
          </View>
        )}
      </View>

      {/* Your Artists */}
      {favouriteArtists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Favourite Artists</Text>
          {favouriteArtists.map(artist => (
            <TouchableOpacity
              key={artist.id}
              style={styles.artistCard}
              onPress={() => navigation.navigate('Artist', { artist })}>
              <View style={styles.artistImage}>
                <Text style={styles.artistEmoji}>{artist.emoji}</Text>
              </View>
              <View style={styles.artistInfo}>
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistGenre}>{artist.genre}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Premium Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionEmoji}>{isPremium ? '💎' : '🎵'}</Text>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionTitle}>
              {isPremium ? 'Premium Plan' : 'Free Plan'}
            </Text>
            <Text style={styles.subscriptionDesc}>
              {isPremium ? '$1/month • Cancel anytime' : 'Upgrade for $1/month'}
            </Text>
          </View>
          {!isPremium && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Paywall')}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
          <Text style={styles.menuItemText}>Notifications</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAddAccount}>
          <Text style={styles.menuItemText}>Add Account</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>
      </View>

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
  backText: {
    color: '#1DB954',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: '#1DB954',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  avatarEmoji: {
    fontSize: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#1DB954',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  editBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  uploadHint: {
    color: '#1DB954',
    fontSize: 12,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 5,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  artistImage: {
    width: 45,
    height: 45,
    backgroundColor: '#1DB954',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artistEmoji: {
    fontSize: 22,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  artistGenre: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    color: '#888',
    fontSize: 16,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    gap: 12,
  },
  subscriptionEmoji: {
    fontSize: 30,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  subscriptionDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  menuItemArrow: {
    color: '#888',
    fontSize: 16,
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  logoutText: {
    color: '#ff4444',
    fontSize: 15,
    flex: 1,
    fontWeight: 'bold',
  },
});