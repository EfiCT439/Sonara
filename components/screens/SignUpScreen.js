import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

function InputRow({
  icon, placeholder, value, onChangeText, field, secureEntry,
  toggleShow, showToggle, keyboardType, autoCapitalize,
  focusedField, setFocusedField,
}) {
  return (
    <View style={[styles.inputWrapper, focusedField === field && styles.inputWrapperFocused]}>
      <Ionicons name={icon} size={18} color={focusedField === field ? '#1DB954' : '#555'} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#444"
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
          <Ionicons name={!secureEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color="#555" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 14, delay: 150 }),
    ]).start();
  }, []);

  const passwordStrength = () => {
    if (password.length === 0) return { level: 0, label: '', color: '#2A2A2A' };
    if (password.length < 6) return { level: 1, label: 'Weak', color: '#E74C3C' };
    if (password.length < 10 || !/[A-Z]/.test(password)) return { level: 2, label: 'Fair', color: '#F39C12' };
    return { level: 3, label: 'Strong', color: '#1DB954' };
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>

        {/* Logo */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="musical-notes" size={38} color="#fff" />
          </View>
          <Text style={styles.logo}>Sonara</Text>
          <Text style={styles.tagline}>Join millions of music lovers</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.formTitle}>Create Account 🎶</Text>
          <Text style={styles.formSubtitle}>Set up your free Sonara account</Text>

          <InputRow
            icon="person-outline" placeholder="Full name" value={name}
            onChangeText={setName} field="name"
            focusedField={focusedField} setFocusedField={setFocusedField}
          />
          <InputRow
            icon="mail-outline" placeholder="Email address" value={email}
            onChangeText={setEmail} field="email"
            keyboardType="email-address" autoCapitalize="none"
            focusedField={focusedField} setFocusedField={setFocusedField}
          />
          <InputRow
            icon="lock-closed-outline" placeholder="Create a password" value={password}
            onChangeText={setPassword} field="password"
            secureEntry={!showPassword} showToggle toggleShow={() => setShowPassword(v => !v)}
            autoCapitalize="none"
            focusedField={focusedField} setFocusedField={setFocusedField}
          />

          {/* Password strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map(n => (
                  <View
                    key={n}
                    style={[styles.strengthBar, { backgroundColor: strength.level >= n ? strength.color : '#2A2A2A' }]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          <InputRow
            icon="shield-checkmark-outline" placeholder="Confirm password" value={confirmPassword}
            onChangeText={setConfirmPassword} field="confirm"
            secureEntry={!showConfirm} showToggle toggleShow={() => setShowConfirm(v => !v)}
            autoCapitalize="none"
            focusedField={focusedField} setFocusedField={setFocusedField}
          />

          {/* Password match indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchRow}>
              <Ionicons
                name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={password === confirmPassword ? '#1DB954' : '#E74C3C'}
              />
              <Text style={[styles.matchText, { color: password === confirmPassword ? '#1DB954' : '#E74C3C' }]}>
                {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>Already have an account? Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By creating an account you agree to Sonara's{' '}
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
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#1DB954',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  logo: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 3 },
  tagline: { fontSize: 13, color: '#666', marginTop: 6, letterSpacing: 0.5 },

  formSection: {
    backgroundColor: '#111',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
  },
  formTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: '#666', marginBottom: 28 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    marginBottom: 14,
  },
  inputWrapperFocused: { borderColor: '#1DB954' },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 15, color: '#fff', fontSize: 15 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 15 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: -6 },
  strengthBars: { flexDirection: 'row', gap: 5, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', marginLeft: 10, width: 45 },

  matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: -6, marginBottom: 14, gap: 6 },
  matchText: { fontSize: 12, fontWeight: '600' },

  btn: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
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
