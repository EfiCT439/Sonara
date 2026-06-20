import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigation.navigate('Onboarding');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🎵</Text>
          </View>
          <Text style={styles.logo}>Sonara</Text>
          <Text style={styles.tagline}>Join millions of music lovers</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Create Account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#555"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#555"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#555"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonOutlineText}>Already have an account? Login</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By creating an account you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
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
    marginBottom: 12,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },
  formSection: {
    backgroundColor: '#111',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    minHeight: 500,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#282828',
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#145c30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#282828',
  },
  dividerText: {
    color: '#555',
    paddingHorizontal: 15,
    fontSize: 13,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#1DB954',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonOutlineText: {
    color: '#1DB954',
    fontSize: 15,
    fontWeight: 'bold',
  },
  terms: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
});