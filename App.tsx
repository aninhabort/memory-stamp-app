import React from 'react';
import { View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Libre Caslon Text — headlines com autoridade literária
import {
  LibreCaslonText_400Regular,
  LibreCaslonText_700Bold,
} from '@expo-google-fonts/libre-caslon-text';
// Courier Prime — stamps e metadados estilo máquina de escrever
import {
  CourierPrime_400Regular,
  CourierPrime_700Bold,
} from '@expo-google-fonts/courier-prime';
// Public Sans — body text moderno e legível
import {
  PublicSans_400Regular,
  PublicSans_600SemiBold,
} from '@expo-google-fonts/public-sans';
import { PassportScreen }       from './src/screens/PassportScreen';
import { CreateStampScreen }    from './src/screens/CreateStampScreen';
import { CollectionScreen }     from './src/screens/CollectionScreen';
import { SearchScreen }         from './src/screens/SearchScreen';
import { StampDetailScreen }    from './src/screens/StampDetailScreen';
import { EditStampScreen }      from './src/screens/EditStampScreen';
import { SettingsScreen }       from './src/screens/SettingsScreen';
import { ContactSupportScreen } from './src/screens/ContactSupportScreen';
import { FAQScreen }            from './src/screens/FAQScreen';
import { PrivacyPolicyScreen }  from './src/screens/PrivacyPolicyScreen';
import { TermsOfUseScreen }     from './src/screens/TermsOfUseScreen';
import { LoadingScreen }        from './src/screens/LoadingScreen';
import { LoginScreen }          from './src/screens/LoginScreen';
import { SignUpScreen }         from './src/screens/SignUpScreen';
import { VintageTabBar } from './src/components/VintageTabBar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { COLORS } from './src/constants/theme';
import {
  RootTabParamList,
  PassportStackParamList,
  CollectionStackParamList,
  SearchStackParamList,
} from './src/navigation/types';

const Tab             = createBottomTabNavigator<RootTabParamList>();
const PassportStack   = createNativeStackNavigator<PassportStackParamList>();
const CollectionStack = createNativeStackNavigator<CollectionStackParamList>();
const SearchStack     = createNativeStackNavigator<SearchStackParamList>();

// Navigators

function PassportNavigator() {
  return (
    <PassportStack.Navigator screenOptions={{ headerShown: false }}>
      <PassportStack.Screen name="PassportHome" component={PassportScreen} />
      <PassportStack.Screen
        name="StampDetail"
        component={StampDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <PassportStack.Screen
        name="EditStamp"
        component={EditStampScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <PassportStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <PassportStack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <PassportStack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <PassportStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <PassportStack.Screen
        name="TermsOfUse"
        component={TermsOfUseScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </PassportStack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchHome" component={SearchScreen} />
      <SearchStack.Screen
        name="StampDetail"
        component={StampDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <SearchStack.Screen
        name="EditStamp"
        component={EditStampScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </SearchStack.Navigator>
  );
}

function CollectionNavigator() {
  return (
    <CollectionStack.Navigator screenOptions={{ headerShown: false }}>
      <CollectionStack.Screen name="CollectionHome" component={CollectionScreen} />
      <CollectionStack.Screen
        name="StampDetail"
        component={StampDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CollectionStack.Screen
        name="EditStamp"
        component={EditStampScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CollectionStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CollectionStack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CollectionStack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CollectionStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CollectionStack.Screen
        name="TermsOfUse"
        component={TermsOfUseScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </CollectionStack.Navigator>
  );
}

// Main app

function AppContent() {
  const { isAuthenticated, isLoading, hasAccount, login, signup } = useAuth();
  const [showSignUp, setShowSignUp] = React.useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    LibreCaslonText_400Regular,
    LibreCaslonText_700Bold,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
  });

  // Show loading screen while fonts are loading or checking auth
  if (!fontsLoaded || isLoading) {
    return <LoadingScreen />;
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    // Determine which screen to show
    // If user explicitly navigated, use their choice
    // Otherwise, show SignUp if no account, Login if account exists
    const shouldShowSignUp = showSignUp !== null ? showSignUp : !hasAccount;

    if (shouldShowSignUp) {
      return (
        <SignUpScreen
          onSignUp={async (name, email, password) => {
            try {
              await signup(name, email, password);
            } catch (error) {
              Alert.alert(
                'Sign Up Failed',
                error instanceof Error ? error.message : 'Could not create your account.'
              );
            }
          }}
          onNavigateToLogin={() => setShowSignUp(false)}
        />
      );
    }

    // Show login screen
    return (
      <LoginScreen
        onLogin={async (email, password) => {
          try {
            await login(email, password);
          } catch (error) {
            Alert.alert(
              'Login Failed',
              error instanceof Error ? error.message : 'Invalid email or password'
            );
          }
        }}
        onNavigateToSignUp={() => setShowSignUp(true)}
      />
    );
  }

  // Show main app if authenticated
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <VintageTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Passport"   component={PassportNavigator} />
        <Tab.Screen name="Search"     component={SearchNavigator} />
        <Tab.Screen name="Create"     component={CreateStampScreen} />
        <Tab.Screen name="Collection" component={CollectionNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// SafeAreaProvider wraps everything so useSafeAreaInsets works in any screen
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
