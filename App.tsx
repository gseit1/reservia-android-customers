import React from 'react';
import { View, ActivityIndicator, Image as RNImage } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Lucide from 'lucide-react-native';
const HomeIcon = Lucide.Home as any;
const SearchIcon = Lucide.Search as any;
const Calendar = Lucide.Calendar as any;
const Heart = Lucide.Heart as any;
const User = Lucide.User as any;
import tw, { useDeviceContext } from 'twrnc';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CityProvider } from './src/contexts/CityContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Pages
import Welcome from './src/pages/Welcome';
import Home from './src/pages/Home';
import Search from './src/pages/Search';
import Account from './src/pages/Account';
import VenueDetail from './src/pages/VenueDetail';
import BookingFlow from './src/pages/BookingFlow';
import Login from './src/pages/Login';

// Components
import { Navbar } from './src/components/layout/Navbar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const activeColor = isDark ? '#ffffff' : '#000000';
  const inactiveColor = '#71717a';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: tw`h-16 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-900 pb-2.5`,
        tabBarLabelStyle: tw`text-[9px] font-bold tracking-wide`,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Αρχική',
          tabBarIcon: ({ color }) => <HomeIcon size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={Search}
        options={{
          tabBarLabel: 'Αναζήτηση',
          tabBarIcon: ({ color }) => <SearchIcon size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={Account}
        options={{
          tabBarLabel: 'Κρατήσεις',
          tabBarIcon: ({ color }) => <Calendar size={20} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Reservations', { initialTab: 'reservations' });
          },
        })}
      />
      <Tab.Screen
        name="Favorites"
        component={Account}
        options={{
          tabBarLabel: 'Αγαπημένα',
          tabBarIcon: ({ color }) => <Heart size={20} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Favorites', { initialTab: 'favorites' });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={Account}
        options={{
          tabBarLabel: 'Προφίλ',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Profile', { initialTab: 'profile' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <View style={tw`flex-1 justify-center items-center bg-white dark:bg-black`}>
      <RNImage
        source={require('./assets/logo3.png')}
        style={tw`h-16 w-48 mb-4`}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} />
    </View>
  );
}

function AppContent() {
  useDeviceContext(tw);
  const { theme } = useTheme();
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const isDark = theme === 'dark';

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000000',
      card: '#000000',
      text: '#ffffff',
      border: '#18181b',
    },
  };

  const MyLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
      card: '#ffffff',
      text: '#000000',
      border: '#f4f4f5',
    },
  };

  if (isLoading) {
    return (
      <NavigationContainer theme={isDark ? MyDarkTheme : MyLightTheme}>
        <View style={tw`flex-grow bg-white dark:bg-black`}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <SplashScreen />
        </View>
      </NavigationContainer>
    );
  }

  const showAuthGate = !isAuthenticated && !isGuest;

  return (
    <NavigationContainer theme={isDark ? MyDarkTheme : MyLightTheme}>
      <View style={tw`flex-grow bg-white dark:bg-black`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            header: () => <Navbar />,
            contentStyle: tw`bg-white dark:bg-black`,
          }}
        >
          {showAuthGate ? (
            <>
              <Stack.Screen
                name="Welcome"
                component={Welcome}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="VenueDetail" component={VenueDetail} />
              <Stack.Screen name="BookingFlow" component={BookingFlow} />
              <Stack.Screen name="Login" component={Login} />
            </>
          )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CityProvider>
          <AppContent />
        </CityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
