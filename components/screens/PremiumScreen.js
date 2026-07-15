import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const FEATURES = [
  { icon: 'play-skip-back', title: 'Backward Button', desc: 'Go back to the previous song anytime', premium: true },
  { icon: 'shuffle', title: 'Unlimited Skips', desc: 'Skip as many songs as you like, no limits', premium: true },
  { icon: 'cloud-download-outline', title: 'Offline Downloads', desc: 'Download songs to play without Wi-Fi', premium: true },
  { icon: 'videocam-outline', title: 'Audio / Video Switch', desc: 'Watch music videos while you listen', premium: true },
  { icon: 'list', title: 'Create Playlists', desc: 'Build and curate unlimited personal playlists', premium: true },
  { icon: 'ban-outline', title: 'Zero Ads', desc: 'Pure music with absolutely no interruptions', premium: true },
  { icon: 'mic-outline', title: 'Song Recognition', desc: 'Identify any song playing around you', premium: true },
  { icon: 'sparkles-outline', title: 'AI Lyrics Generator', desc: 'Generate original lyrics powered by AI', premium: true },
  { icon: 'moon-outline', title: 'Sleep Timer', desc: 'Auto-stop music when you drift off', premium: false },
  { icon: 'heart-outline', title: 'Like & Save Songs', desc: 'Build your personal music library', premium: false },
];

export default function PremiumScreen({ navigation }) {
  const { isPremium } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
    ]).start();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {isPremium ? (
          <>
            <View style={styles.heroIconCircle}>
              <Ionicons name="diamond" size={44} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>You're Premium 🎉</Text>
            <Text style={styles.heroSub}>All features are unlocked and ready to enjoy.</Text>
            <View style={styles.activePill}>
              <Ionicons name="checkmark-circle" size={15} color="#0A0A0A" />
              <Text style={styles.activePillText}>Active Subscription · $1/month</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.heroIconCircle}>
              <Ionicons name="diamond-outline" size={44} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>Sonara Premium</Text>
            <Text style={styles.heroSub}>The best music experience for just $1/month</Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
              <Ionicons name="flash" size={18} color="#000" />
              <Text style={styles.upgradeBtnText}>Upgrade Now — $1/month</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Features grid */}
      <Text style={styles.sectionTitle}>What you get</Text>

      {FEATURES.map((f, i) => (
        <Animated.View
          key={i}
          style={[
            styles.featureCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={[styles.featureIconBox, !f.premium && styles.featureIconBoxFree]}>
            <Ionicons name={f.icon} size={20} color={f.premium ? '#FFD700' : '#1DB954'} />
          </View>
          <View style={styles.featureInfo}>
            <View style={styles.featureTitleRow}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              {f.premium && !isPremium && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={10} color="#FFD700" />
                  <Text style={styles.lockBadgeText}>Premium</Text>
                </View>
              )}
              {(f.premium && isPremium) && (
                <Ionicons name="checkmark-circle" size={16} color="#1DB954" />
              )}
            </View>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        </Animated.View>
      ))}

      {/* CTA (non-premium only) */}
      {!isPremium && (
        <TouchableOpacity style={styles.bigCta} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
          <Ionicons name="diamond" size={20} color="#000" />
          <Text style={styles.bigCtaText}>Get Premium for $1/month</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>Cancel anytime · No hidden fees · Secure payments via Flutterwave</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },

  hero: {
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 28,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: '#FFD70040',
  },
  heroIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFD70015',
    borderWidth: 2,
    borderColor: '#FFD70050',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  activePillText: { color: '#0A0A0A', fontSize: 13, fontWeight: '700' },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },

  sectionTitle: { fontSize: 12, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 4 },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFD70015',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconBoxFree: { backgroundColor: '#1DB95415' },
  featureInfo: { flex: 1 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFD70020',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockBadgeText: { fontSize: 9, color: '#FFD700', fontWeight: '700' },
  featureDesc: { fontSize: 12, color: '#666', lineHeight: 17 },

  bigCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  bigCtaText: { color: '#000', fontSize: 17, fontWeight: '800' },

  disclaimer: { color: '#444', fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
});
