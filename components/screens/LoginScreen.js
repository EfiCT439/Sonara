import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator, ScrollView, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';

// Branded auth palette — matches SignUp. Always Sonara green, not theme-following.
const AUTH = {
  green: '#1DB954',
  card: '#FFFFFF',
  text: '#0F1113',
  textDim: '#5F6368',
  textFaint: '#9AA0A6',
  elevated: '#F3F4F6',
  borderStrong: '#E4E7EB',
  accent: '#1DB954',
  accentText: '#FFFFFF',
  onGreen: '#FFFFFF',
  onGreenDim: 'rgba(255,255,255,0.82)',
};

export default function LoginScreen({ navigation }) {
  const c = AUTH;
  const styles = makeStyles(c);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { setFavouriteArtists, setProfileImage, syncPremiumFromBackend } = useUser();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 14, delay: 120 }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Missing Email', 'Please enter your email address.'); return; }
    if (!password) { Alert.alert('Missing Password', 'Please enter your password.'); return; }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.favouriteArtists) setFavouriteArtists(data.favouriteArtists);
        if (data.profileImage) setProfileImage(data.profileImage);
      }
      syncPremiumFromBackend(userCredential.user);
      navigation.navigate('Main');
    } catch (error) {
      const msg =
        error.code === 'auth/user-not-found'        ? 'No account found with this email.' :
        error.code === 'auth/wrong-password'         ? 'Incorrect password. Try again.' :
        error.code === 'auth/invalid-credential'     ? 'Incorrect email or password. Try again.' :
        error.code === 'auth/invalid-login-credentials' ? 'Incorrect email or password. Try again.' :
        error.code === 'auth/invalid-email'          ? 'Please enter a valid email address.' :
        error.code === 'auth/too-many-requests'      ? 'Too many attempts. Please try again later.' :
        error.code === 'auth/network-request-failed' ? 'Network error. Check your internet connection.' :
        'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Email First', 'Type your email address in the field above, then tap "Forgot Password?"');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Send a password reset link to:\n${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            setResetLoading(true);
            try {
              await sendPasswordResetEmail(auth, email.trim());
              Alert.alert('Email Sent! 📧', 'Check your inbox for the password reset link.');
            } catch {
              Alert.alert('Error', 'Could not send reset email. Check the address and try again.');
            } finally {
              setResetLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}>

          {/* Brand header on the green */}
          <Animated.View style={[styles.brand, { opacity: fadeAnim }]}>
            <View style={styles.logoMark}>
              <Ionicons name="musical-notes" size={28} color={c.green} />
            </View>
            <Text style={styles.brandName}>Sonara</Text>
            <Text style={styles.brandTagline}>Your world of music</Text>
          </Animated.View>

          {/* White form card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to continue listening</Text>

            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Ionicons name="mail-outline" size={18} color={emailFocused ? c.accent : c.textFaint} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={c.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? c.accent : c.textFaint} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={c.textFaint}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={c.textFaint} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
              {resetLoading
                ? <ActivityIndicator size="small" color={c.green} />
                : <Text style={styles.forgotText}>Forgot password?</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color={c.accentText} size="small" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>New to Sonara? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
                <Text style={styles.signinLink}>Create account</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By signing in you agree to Sonara's{' '}
              <Text style={styles.termsLink}>Terms</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.green },
  scroll: { flexGrow: 1 },

  brand: { alignItems: 'center', paddingTop: 80, paddingBottom: 38 },
  logoMark: {
    width: 64, height: 64, borderRadius: 19,
    backgroundColor: c.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  brandName: { fontSize: 32, fontWeight: '900', color: c.onGreen, letterSpacing: 0.5 },
  brandTagline: { fontSize: 14, color: c.onGreenDim, marginTop: 6, fontWeight: '600' },

  card: {
    flex: 1,
    backgroundColor: c.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 44,
  },
  cardTitle: { fontSize: 23, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: c.textDim, marginTop: 5, marginBottom: 26, fontWeight: '500' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.elevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: c.elevated,
    marginBottom: 13,
  },
  inputWrapperFocused: { borderColor: c.accent, backgroundColor: c.card },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 15, color: c.text, fontSize: 15, fontWeight: '500' },
  eyeBtn: { paddingHorizontal: 15, paddingVertical: 15 },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  forgotText: { color: c.green, fontSize: 13, fontWeight: '700' },

  primaryBtn: {
    backgroundColor: c.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 22,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: c.accentText, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22 },
  signinText: { color: c.textDim, fontSize: 14, fontWeight: '500' },
  signinLink: { color: c.green, fontSize: 14, fontWeight: '800' },

  terms: { color: c.textFaint, fontSize: 11.5, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: c.textDim, fontWeight: '700' },
});
