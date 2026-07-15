import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Alert, Image, Switch, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen({ navigation }) {
  const {
    isPremium, favouriteArtists, profileImage, setProfileImage,
    likedSongs, userPlaylists, followedArtists, listeningHabits,
    privateSession, setPrivateSession, clearListeningHistory,
  } = useUser();
  const [user] = useState(auth.currentUser);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Listener';
  const totalSongsPlayed = Object.values(listeningHabits?.songs || {}).reduce((a, b) => a + b, 0);
  const topGenre = Object.entries(listeningHabits?.genres || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleAddAccount = () => {
    Alert.alert('Add Account', 'You will be signed out to create a new account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: async () => {
          await signOut(auth);
          navigation.reset({ index: 0, routes: [{ name: 'SignUp' }] });
        },
      },
    ]);
  };

  const handleUploadPhoto = async () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo',
        onPress: async () => {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            const u = auth.currentUser;
            if (u) await setDoc(doc(db, 'users', u.uid), { profileImage: uri }, { merge: true });
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) { Alert.alert('Permission needed', 'Please allow gallery access.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            const u = auth.currentUser;
            if (u) await setDoc(doc(db, 'users', u.uid), { profileImage: uri }, { merge: true });
          }
        },
      },
      { text: 'Remove Photo', style: 'destructive', onPress: () => setProfileImage(null) },
    ]);
  };

  const handleChangePassword = () => {
    if (!user?.email) { Alert.alert('Error', 'No email found on this account.'); return; }
    Alert.alert(
      'Change Password',
      `We'll send a password reset link to ${user.email}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, user.email);
              Alert.alert('Email Sent 📧', 'Check your inbox for the password reset link.');
            } catch {
              Alert.alert('Error', 'Could not send the reset email. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Listening History',
      'This removes your recently played songs and listening stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearListeningHistory();
            Alert.alert('History Cleared', 'Your listening history has been cleared.');
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, label, onPress, danger, right }) => (
    <TouchableOpacity style={[styles.menuItem, danger && styles.menuItemDanger]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
        <Ionicons name={icon} size={18} color={danger ? '#ff4444' : '#1DB954'} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {right || <Ionicons name="chevron-forward" size={16} color="#444" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar & Name */}
      <View style={styles.heroSection}>
        <TouchableOpacity style={styles.avatarWrap} onPress={handleUploadPhoto} activeOpacity={0.8}>
          {profileImage
            ? <Image source={{ uri: profileImage }} style={styles.avatar} />
            : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={44} color="#fff" />
              </View>
            )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={13} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>

        {isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={13} color="#000" />
            <Text style={styles.premiumBadgeText}>Premium Member</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{likedSongs.length}</Text>
          <Text style={styles.statLabel}>Liked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{userPlaylists.length}</Text>
          <Text style={styles.statLabel}>Playlists</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{followedArtists.length}</Text>
          <Text style={styles.statLabel}>Artists</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalSongsPlayed}</Text>
          <Text style={styles.statLabel}>Played</Text>
        </View>
      </View>

      {/* Listening insight */}
      {topGenre !== 'None yet' && (
        <View style={styles.insightCard}>
          <Ionicons name="musical-note" size={20} color="#1DB954" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.insightTitle}>Your Top Genre</Text>
            <Text style={styles.insightValue}>{topGenre}</Text>
          </View>
          <Text style={styles.insightEmoji}>🎧</Text>
        </View>
      )}

      {/* Favourite Artists */}
      {favouriteArtists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favourite Artists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistsScroll}>
            {favouriteArtists.map(artist => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistChip}
                onPress={() => navigation.navigate('Artist', { artist })}
                activeOpacity={0.75}>
                <View style={styles.artistChipAvatar}>
                  <Text style={styles.artistChipEmoji}>{artist.emoji || '🎤'}</Text>
                </View>
                <Text style={styles.artistChipName} numberOfLines={1}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={[styles.subCard, isPremium && styles.subCardPremium]}>
          <View style={styles.subLeft}>
            <Ionicons name={isPremium ? 'diamond' : 'musical-note'} size={26} color={isPremium ? '#FFD700' : '#1DB954'} />
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.subTitle}>{isPremium ? 'Premium Plan' : 'Free Plan'}</Text>
              <Text style={styles.subDesc}>{isPremium ? 'All features unlocked · $1/month' : '8 skips/hr · Ads · No backward'}</Text>
            </View>
          </View>
          {!isPremium && (
            <TouchableOpacity style={styles.subUpgradeBtn} onPress={() => navigation.navigate('Paywall')}>
              <Text style={styles.subUpgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="notifications-outline" label="Notifications"
            onPress={() => {}}
            right={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: '#2A2A2A', true: '#1DB954' }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            }
          />
          <View style={styles.menuSeparator} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => setShowPrivacy(true)} />
          <View style={styles.menuSeparator} />
          <MenuItem icon="person-add-outline" label="Add Account" onPress={handleAddAccount} />
        </View>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>Sonara v1.0.0</Text>

      {/* Privacy & Security */}
      <Modal visible={showPrivacy} transparent animationType="slide" onRequestClose={() => setShowPrivacy(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Privacy & Security</Text>
            <Text style={styles.modalSub}>Control your data and account security</Text>

            {/* Private Session */}
            <View style={styles.privacyRow}>
              <View style={styles.privacyIconBox}>
                <Ionicons name="eye-off-outline" size={18} color="#1DB954" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyRowTitle}>Private Session</Text>
                <Text style={styles.privacyRowSub}>Songs you play won't be saved to history</Text>
              </View>
              <Switch
                value={privateSession}
                onValueChange={setPrivateSession}
                trackColor={{ false: '#2A2A2A', true: '#1DB954' }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>

            {/* Change Password */}
            <TouchableOpacity style={styles.privacyRow} onPress={handleChangePassword} activeOpacity={0.7}>
              <View style={styles.privacyIconBox}>
                <Ionicons name="key-outline" size={18} color="#1DB954" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyRowTitle}>Change Password</Text>
                <Text style={styles.privacyRowSub}>Email a reset link to your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>

            {/* Clear History */}
            <TouchableOpacity style={styles.privacyRow} onPress={handleClearHistory} activeOpacity={0.7}>
              <View style={styles.privacyIconBoxDanger}>
                <Ionicons name="trash-outline" size={18} color="#ff4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyRowTitle}>Clear Listening History</Text>
                <Text style={styles.privacyRowSub}>Remove recently played songs & stats</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacy(false)} activeOpacity={0.85}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  avatarPlaceholder: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1DB954',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  displayName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4, textTransform: 'capitalize' },
  email: { fontSize: 13, color: '#666', marginBottom: 14 },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  premiumBadgeText: { color: '#000', fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#2A2A2A' },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2b1a',
    borderRadius: 14,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1DB95430',
  },
  insightTitle: { fontSize: 11, color: '#1DB954', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightValue: { fontSize: 16, color: '#fff', fontWeight: '700', marginTop: 2 },
  insightEmoji: { fontSize: 26 },

  section: { paddingHorizontal: 20, marginBottom: 22 },
  sectionTitle: { fontSize: 12, color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  artistsScroll: { paddingRight: 20, gap: 14 },
  artistChip: { alignItems: 'center', width: 72 },
  artistChipAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB95420',
    borderWidth: 2,
    borderColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  artistChipEmoji: { fontSize: 26 },
  artistChipName: { fontSize: 11, color: '#ccc', fontWeight: '600', textAlign: 'center' },

  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  subCardPremium: { borderColor: '#FFD70050' },
  subLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  subTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  subDesc: { fontSize: 12, color: '#666', marginTop: 3 },
  subUpgradeBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subUpgradeBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },

  menuGroup: { backgroundColor: '#161616', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemDanger: {},
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1DB95420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconBoxDanger: { backgroundColor: '#ff444420' },
  menuLabel: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '500' },
  menuLabelDanger: { color: '#ff4444' },
  menuSeparator: { height: 1, backgroundColor: '#2A2A2A', marginLeft: 66 },

  version: { textAlign: 'center', color: '#333', fontSize: 11, marginBottom: 20 },

  // Privacy & Security modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  privacyIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1DB95420', alignItems: 'center', justifyContent: 'center',
  },
  privacyIconBoxDanger: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ff444420', alignItems: 'center', justifyContent: 'center',
  },
  privacyRowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  privacyRowSub: { color: '#666', fontSize: 12, marginTop: 3, fontWeight: '500' },
  modalCloseBtn: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
