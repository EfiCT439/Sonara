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
  { icon: 'sparkles-outline', title: 'AI Song Generator', desc: 'Describe a song — AI produces the track and writes the lyrics', premium: true },
  { icon: 'moon-outline', title: 'Sleep Timer', desc: 'Auto-stop music when you drift off', premium: false },
  { icon: 'heart-outline', title: 'Like & Save Songs', desc: 'Build your personal music library', premium: false },
];

export default function PremiumScreen({ navigation }) {
  const { isPremium } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);
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
            <Text style={styles.heroEyebrow}>Sonara</Text>
            <Text style={styles.heroTitle}>Premium</Text>
            <Text style={styles.heroSub}>All features are unlocked and ready to enjoy.</Text>
            <View style={styles.activePill}>
              <Ionicons name="checkmark-circle" size={14} color={c.accentText} />
              <Text style={styles.activePillText}>Active · $1/month</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroEyebrow}>Sonara</Text>
            <Text style={styles.heroTitle}>Premium</Text>
            <Text style={styles.heroSub}>The best music experience for just $1/month</Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
              <Text style={styles.upgradeBtnText}>Upgrade — $1/month</Text>
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
          <View style={styles.featureIconBox}>
            <Ionicons name={f.icon} size={20} color={c.icon} />
          </View>
          <View style={styles.featureInfo}>
            <View style={styles.featureTitleRow}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              {f.premium && !isPremium && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={9} color={c.textDim} />
                  <Text style={styles.lockBadgeText}>Premium</Text>
                </View>
              )}
              {(f.premium && isPremium) && (
                <Ionicons name="checkmark-circle" size={15} color={c.textDim} />
              )}
            </View>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        </Animated.View>
      ))}

      {/* CTA (non-premium only) */}
      {!isPremium && (
        <TouchableOpacity style={styles.bigCta} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
          <Text style={styles.bigCtaText}>Get Premium for $1/month</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>Cancel anytime · No hidden fees · Secure payments via Flutterwave</Text>
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },

  hero: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 30,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: c.border,
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: '800', color: c.textDim,
    textTransform: 'uppercase', letterSpacing: 2.4, marginBottom: 8,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: c.text, marginBottom: 10, textAlign: 'center', letterSpacing: -0.8 },
  heroSub: { fontSize: 14, color: c.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 22, fontWeight: '600' },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: c.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  activePillText: { color: c.accentText, fontSize: 13, fontWeight: '800' },
  upgradeBtn: {
    backgroundColor: c.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  upgradeBtnText: { color: c.accentText, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  sectionTitle: { fontSize: 11, color: c.textDim, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14, marginTop: 4 },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: { flex: 1 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  featureTitle: { fontSize: 14, fontWeight: '800', color: c.text },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: c.elevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: c.border,
  },
  lockBadgeText: { fontSize: 9, color: c.textDim, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  featureDesc: { fontSize: 12, color: c.textDim, lineHeight: 17, fontWeight: '600' },

  bigCta: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.accent,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bigCtaText: { color: c.accentText, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },

  disclaimer: { color: c.textFaint, fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 20, fontWeight: '600' },
});
