import { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import LoginScreen from './components/screens/LoginScreen';
import SignUpScreen from './components/screens/SignUpScreen';
import OnboardingScreen from './components/screens/OnboardingScreen';
import PlayerScreen from './components/screens/PlayerScreen';
import PaywallScreen from './components/screens/PaywallScreen';
import SearchScreen from './components/screens/SearchScreen';
import LibraryScreen from './components/screens/LibraryScreen';
import PremiumScreen from './components/screens/PremiumScreen';
import CreateScreen from './components/screens/CreateScreen';
import ArtistScreen from './components/screens/ArtistScreen';
import HomeScreen from './components/screens/HomeScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import QRScannerScreen from './components/screens/QRScannerScreen';
import AIGenScreen from './components/screens/AIGenScreen';
import AIPlaylistScreen from './components/screens/AIPlaylistScreen';
import VisualizerScreen from './components/screens/VisualizerScreen';
import MiniPlayer from './components/MiniPlayer';
import { UserProvider, useUser } from './context/UserContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors: c } = useUser();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
      }}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Search" component={SearchScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Library" component={LibraryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Create" component={CreateScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Premium" component={PremiumScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="diamond-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const navigationRef = useNavigationContainerRef();
  const { currentTrack, isPlayerOpen, colors: c } = useUser();

  // Keep the whole app in portrait; the Player's video fullscreen is the only
  // place that switches to landscape (and restores portrait on exit).
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  // Show mini player when: a song exists AND the full player is not open
  const showMiniPlayer = !!currentTrack && !isPlayerOpen;

  const openPlayer = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        screen: 'Player',
        params: { song: currentTrack },
      });
    }
  };

  const openPaywall = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', { screen: 'Paywall' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainInner} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Mini Player rendered on top of EVERYTHING */}
      {showMiniPlayer && <MiniPlayer onOpenPlayer={openPlayer} onUpgrade={openPaywall} />}
    </View>
  );
}

function MainInner() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Player" component={PlayerScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="AIGen" component={AIGenScreen} />
      <Stack.Screen name="AIPlaylist" component={AIPlaylistScreen} />
      <Stack.Screen name="Visualizer" component={VisualizerScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}