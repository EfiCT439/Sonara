import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { setFavouriteArtists, setProfileImage, syncPremiumFromBackend } = useUser();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 14, delay: 200 }),
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
      // Sync premium status from MongoDB (non-blocking — app works regardless)
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>

        {/* ── Logo ── */}
        <Animated.View
          style={[
            styles.logoSection,
            { opacity: fadeAnim, transform: [{ scale: logoAnim }] },
          ]}>
          <View style={styles.logoCircle}>
            <Ionicons name="musical-notes" size={42} color="#fff" />
          </View>
          <Text style={styles.logo}>Sonara</Text>
          <Text style={styles.tagline}>Your world of music</Text>
        </Animated.View>

        {/* ── Form Card ── */}
        <Animated.View
          style={[
            styles.formSection,
            { transform: [{ translateY: formAnim }], opacity: fadeAnim },
          ]}>
          <Text style={styles.formTitle}>Welcome back 👋</Text>
          <Text style={styles.formSubtitle}>Sign in to continue listening</Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={emailFocused ? '#1DB954' : '#555'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="Email address"
              placeholderTextColor="#444"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? '#1DB954' : '#555'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithToggle, passwordFocused && styles.inputFocused]}
              placeholder="Password"
              placeholderTextColor="#444"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
            {resetLoading
              ? <ActivityIndicator size="small" color="#1DB954" />
              : <Text style={styles.forgotText}>Forgot Password?</Text>}
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign up */}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>Create New Account</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing in you agree to Sonara's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flexGrow: 1 },

  logoSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoCircle: {
    width: 88,
    height: 88,
    backgroundColor: '#1DB954',
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  formSection: {
    flex: 1,
    backgroundColor: '#111',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
  },

  inputWrapper: {
    position: 'relative',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 15,
  },
  inputWithToggle: { paddingRight: 0 },
  inputFocused: { borderColor: '#1DB954' },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: '600',
  },

  btn: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { backgroundColor: '#145c30', shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  dividerText: { color: '#444', paddingHorizontal: 14, fontSize: 12, fontWeight: '600' },

  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#1DB954',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  outlineBtnText: { color: '#1DB954', fontSize: 15, fontWeight: '700' },

  terms: { color: '#444', fontSize: 11, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: '#666', textDecorationLine: 'underline' },
});
