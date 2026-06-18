import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Sonara 🎵</Text>
      <Text style={styles.welcome}>Welcome to Sonara!</Text>
      <Text style={styles.subtitle}>Your music is ready 🎶</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Player')}>
        <Text style={styles.buttonText}>▶️ Play Sample Song</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.premiumButton}
        onPress={() => navigation.navigate('Paywall')}>
        <Text style={styles.premiumButtonText}>💎 Go Premium - $1/month</Text>
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
    padding: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  premiumButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});