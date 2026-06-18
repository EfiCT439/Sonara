 import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export default function PaywallScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.logo}>Sonara 🎵</Text>
      <Text style={styles.title}>Upgrade to Premium</Text>
      <Text style={styles.price}>$1/month</Text>

      {/* Features comparison */}
      <View style={styles.comparisonContainer}>
        {/* Free tier */}
        <View style={styles.tierCard}>
          <Text style={styles.tierTitle}>Free</Text>
          <Text style={styles.tierPrice}>$0</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✅ Stream music online</Text>
            <Text style={styles.featureItem}>✅ Next button</Text>
            <Text style={styles.featureItem}>✅ Lyrics</Text>
            <Text style={styles.featureItem}>✅ Favourite songs</Text>
            <Text style={styles.featureItem}>✅ Sleep timer</Text>
            <Text style={styles.featureItemNo}>❌ Backward button</Text>
            <Text style={styles.featureItemNo}>❌ Download songs</Text>
            <Text style={styles.featureItemNo}>❌ Create playlists</Text>
            <Text style={styles.featureItemNo}>❌ Audio/Video switch</Text>
            <Text style={styles.featureItemNo}>❌ Ads every 3 songs</Text>
            <Text style={styles.featureItemNo}>❌ 8 skips/hour limit</Text>
          </View>
        </View>

        {/* Premium tier */}
        <View style={[styles.tierCard, styles.premiumCard]}>
          <Text style={styles.premiumBadge}>BEST</Text>
          <Text style={styles.tierTitle}>Premium</Text>
          <Text style={styles.tierPrice}>$1/mo</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✅ Stream music online</Text>
            <Text style={styles.featureItem}>✅ Next button</Text>
            <Text style={styles.featureItem}>✅ Lyrics</Text>
            <Text style={styles.featureItem}>✅ Favourite songs</Text>
            <Text style={styles.featureItem}>✅ Sleep timer</Text>
            <Text style={styles.featureItem}>✅ Backward button</Text>
            <Text style={styles.featureItem}>✅ Download songs</Text>
            <Text style={styles.featureItem}>✅ Create playlists</Text>
            <Text style={styles.featureItem}>✅ Audio/Video switch</Text>
            <Text style={styles.featureItem}>✅ No ads</Text>
            <Text style={styles.featureItem}>✅ Unlimited skips</Text>
          </View>
        </View>
      </View>

      {/* Payment methods */}
      <Text style={styles.paymentTitle}>Payment Methods</Text>
      <View style={styles.paymentMethods}>
        <Text style={styles.paymentMethod}>💳 Credit/Debit Card</Text>
        <Text style={styles.paymentMethod}>📱 MTN Mobile Money</Text>
        <Text style={styles.paymentMethod}>🟠 Orange Money</Text>
      </View>

      {/* Upgrade button */}
      <TouchableOpacity style={styles.upgradeButton}>
        <Text style={styles.upgradeButtonText}>Upgrade to Premium 🚀</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Cancel anytime. No hidden fees.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#1DB954',
    fontSize: 16,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1DB954',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    color: '#1DB954',
    textAlign: 'center',
    marginBottom: 30,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#282828',
    borderRadius: 10,
    padding: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  premiumCard: {
    borderColor: '#1DB954',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#1DB954',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  tierPrice: {
    fontSize: 16,
    color: '#1DB954',
    textAlign: 'center',
    marginBottom: 15,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    color: '#fff',
    fontSize: 12,
  },
  featureItemNo: {
    color: '#888',
    fontSize: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentMethods: {
    backgroundColor: '#282828',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    gap: 10,
  },
  paymentMethod: {
    color: '#fff',
    fontSize: 16,
  },
  upgradeButton: {
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
  },
});
