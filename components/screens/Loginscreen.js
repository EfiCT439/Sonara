import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Sonara 🎵</Text>
      <Text style={styles.tagline}>Music for everyone</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline}>
        <Text style={styles.buttonOutlineText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#1DB954',
    width: '80%',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#fff',
    width: '80%',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

