 import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useUser } from '../../context/UserContext';

export default function PremiumScreen({ navigation }) {
  const { isPremium } = useUser();

  const features = [
    { emoji: '⏮', title: 'Backward Button', desc: 'Go back to previous songs anytime' },
    { emoji: '⏭', title: 'Unlimited Skips', desc: 'Skip as many songs as you want' },
    { emoji: '📥', title: 'Download Songs', desc: 'Listen offline without internet' },
    { emoji: '🎬', title: 'Audio/Video Switch', desc: 'Switch between audio and music video' },
    { emoji: '🎵', title: 'Create Playlists', desc: 'Create and manage unlimited playlists' },
    { emoji: '🚫', title: 'No Ads', desc: 'Enjoy music without interruptions' },
    { emoji: '🌙', title: 'Sleep Timer', desc: 'Auto stop music when you sleep' },
    { emoji: '📱', title: 'Offline Playback', desc: 'Play downloaded songs without internet' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>Sonara Premium</Text>
        <Text style={styles.price}>Only $1/month</Text>
        {isPremium && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>✅ You are Premium!</Text>
          </View>
        )}
      </View>

      {/* Features */}
      <Text style={styles.sectionTitle}>What you get:</Text>
      {features.map((feature, index) => (
        <View key={index} style={styles.featureCard}>
          <Text style={styles.featureEmoji}>{feature.emoji}</Text>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
          <Text style={styles.checkmark}>✅</Text>
        </View>
      ))}

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Payment Methods:</Text>
      <View style={styles.paymentCard}>
        <Text style={styles.paymentMethod}>💳 Credit/Debit Card</Text>
        <Text style={styles.paymentMethod}>📱 MTN Mobile Money</Text>
        <Text style={styles.paymentMethod}>🟠 Orange Money</Text>
      </View>

      {/* Upgrade Button */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Paywall')}>
          <Text style={styles.upgradeButtonText}>💎 Upgrade Now - $1/month</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>Cancel anytime. No hidden fees.</Text>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  crown: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    color: '#1DB954',
    fontWeight: 'bold',
  },
  activeBadge: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginTop: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: 15,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  featureDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  checkmark: {
    fontSize: 18,
  },
  paymentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    gap: 12,
  },
  paymentMethod: {
    color: '#fff',
    fontSize: 16,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
});
