import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator, ScrollView, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

// The auth screens are BRAND surfaces — always Sonara green, never theme-following.
// This fixed palette is shaped like the app's theme tokens so the shared InputRow
// (which reads c.text / c.textFaint / c.accent) works unchanged on the white card.
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
  danger: '#E5484D',
  icon: '#0F1113',
  onGreen: '#FFFFFF',
  onGreenDim: 'rgba(255,255,255,0.82)',
};

function InputRow({
  icon, placeholder, value, onChangeText, field, secureEntry,
  toggleShow, showToggle, keyboardType, autoCapitalize,
  focusedField, setFocusedField, styles, c,
}) {
  const focused = focusedField === field;
  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <Ionicons name={icon} size={18} color={focused ? c.accent : c.textFaint} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField(null)}
      />
      {showToggle && (
        <TouchableOpacity onPress={toggleShow} style={styles.eyeBtn}>
          <Ionicons name={!secureEntry ? 'eye-off-outline' : 'eye-outline'} size={19} color={c.textFaint} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const c = AUTH;
  const styles = makeStyles(c);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 14, delay: 120 }),
    ]).start();
  }, []);

  const passwordStrength = () => {
    if (password.length === 0) return { level: 0, label: '', color: c.borderStrong };
    if (password.length < 6) return { level: 1, label: 'Weak', color: c.danger };
    if (password.length < 10 || !/[A-Z]/.test(password)) return { level: 2, label: 'Fair', color: '#E0A800' };
    return { level: 3, label: 'Strong', color: c.green };
  };
  const strength = passwordStrength();

  const handleSignUp = async () => {
    if (!name.trim()) { Alert.alert('Missing Name', 'Please enter your full name.'); return; }
    if (!email.trim()) { Alert.alert('Missing Email', 'Please enter your email address.'); return; }
    if (password.length < 6) { Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { Alert.alert('Password Mismatch', "Passwords don't match. Please try again."); return; }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigation.navigate('Onboarding');
    } catch (error) {
      const msg =
        error.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        error.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
        error.code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
        'Sign up failed. Please try again.';
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
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
              <Ionicons name="musical-notes" size={26} color={c.green} />
            </View>
            <Text style={styles.brandName}>Sonara</Text>
            <Text style={styles.brandTagline}>Music for everyone</Text>
          </Animated.View>

          {/* White form card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSub}>Free forever · upgrade anytime</Text>

            <InputRow
              styles={styles} c={c}
              icon="person-outline" placeholder="Full name" value={name}
              onChangeText={setName} field="name"
              focusedField={focusedField} setFocusedField={setFocusedField}
            />
            <InputRow
              styles={styles} c={c}
              icon="mail-outline" placeholder="Email address" value={email}
              onChangeText={setEmail} field="email"
              keyboardType="email-address" autoCapitalize="none"
              focusedField={focusedField} setFocusedField={setFocusedField}
            />
            <InputRow
              styles={styles} c={c}
              icon="lock-closed-outline" placeholder="Create a password" value={password}
              onChangeText={setPassword} field="password"
              secureEntry={!showPassword} showToggle toggleShow={() => setShowPassword(v => !v)}
              autoCapitalize="none"
              focusedField={focusedField} setFocusedField={setFocusedField}
            />

            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map(n => (
                    <View key={n} style={[styles.strengthBar, { backgroundColor: strength.level >= n ? strength.color : c.borderStrong }]} />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <InputRow
              styles={styles} c={c}
              icon="shield-checkmark-outline" placeholder="Confirm password" value={confirmPassword}
              onChangeText={setConfirmPassword} field="confirm"
              secureEntry={!showConfirm} showToggle toggleShow={() => setShowConfirm(v => !v)}
              autoCapitalize="none"
              focusedField={focusedField} setFocusedField={setFocusedField}
            />

            {confirmPassword.length > 0 && (
              <View style={styles.matchRow}>
                <Ionicons
                  name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                  size={15}
                  color={password === confirmPassword ? c.green : c.danger}
                />
                <Text style={[styles.matchText, { color: password === confirmPassword ? c.textDim : c.danger }]}>
                  {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color={c.accentText} size="small" />
                : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By continuing you agree to Sonara's{' '}
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

  brand: { alignItems: 'center', paddingTop: 72, paddingBottom: 34 },
  logoMark: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: c.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  brandName: { fontSize: 30, fontWeight: '900', color: c.onGreen, letterSpacing: 0.5 },
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

  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 13, marginTop: -3 },
  strengthBars: { flexDirection: 'row', gap: 5, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '800', marginLeft: 10, width: 46 },

  matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: -3, marginBottom: 13, gap: 6 },
  matchText: { fontSize: 12, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: c.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
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
