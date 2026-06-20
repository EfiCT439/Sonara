import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { UserProvider } from './context/UserContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Library',
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Create',
        }}
      />
      <Tab.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="diamond-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Premium',
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Player" component={PlayerScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}