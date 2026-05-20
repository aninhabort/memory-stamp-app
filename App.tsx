import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
import { PassportScreen }    from './src/screens/PassportScreen';
import { CreateStampScreen } from './src/screens/CreateStampScreen';
import { CollectionScreen }  from './src/screens/CollectionScreen';
import { SearchScreen }      from './src/screens/SearchScreen';
import { StampDetailScreen } from './src/screens/StampDetailScreen';
import { COLORS, FONTS } from './src/constants/theme';
import {
  RootTabParamList,
  PassporteStackParamList,
  ColeçãoStackParamList,
  BuscarStackParamList,
} from './src/navigation/types';

const Tab             = createBottomTabNavigator<RootTabParamList>();
const PassaporteStack = createNativeStackNavigator<PassporteStackParamList>();
const ColeçãoStack    = createNativeStackNavigator<ColeçãoStackParamList>();
const BuscarStack     = createNativeStackNavigator<BuscarStackParamList>();

// ── Configuração visual das tabs ──────────────────────────────────────────────
const TAB_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconActive: React.ComponentProps<typeof Ionicons>['name'];
  }
> = {
  Passaporte: { label: 'JOURNAL',  icon: 'book-outline',    iconActive: 'book' },
  Buscar:     { label: 'SEARCH',   icon: 'search-outline',  iconActive: 'search' },
  Criar:      { label: 'STAMP',    icon: 'pencil-outline',  iconActive: 'pencil' },
  'Coleção':  { label: 'VOLUMES',  icon: 'albums-outline',  iconActive: 'albums' },
};

// ── Tab bar vintage editorial ─────────────────────────────────────────────────
function VintageTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Verifica se a tab focada pediu para esconder a barra (PassportScreen fechado)
  const focusedRoute   = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  if (focusedOptions.tabBarStyle) {
    const s = Array.isArray(focusedOptions.tabBarStyle)
      ? Object.assign({}, ...focusedOptions.tabBarStyle)
      : focusedOptions.tabBarStyle;
    if ((s as Record<string, unknown>).display === 'none') return null;
  }

  return (
    <View style={[tabStyles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const config  = TAB_CONFIG[route.name] ?? {
          label: route.name,
          icon: 'ellipse-outline',
          iconActive: 'ellipse',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={focused ? config.iconActive : config.icon}
              size={20}
              color={focused ? COLORS.secondary : COLORS.onSurfaceVariant}
            />
            <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    // Sombra suave no topo (simula elevação)
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 3,
  },
  // Sem pill — apenas cor muda (ativo/inativo tratado nos filhos icon/label)
  tabItemActive: {},
  tabLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  tabLabelActive: {
    color: COLORS.secondary,
  },
});

// ── Navigators ────────────────────────────────────────────────────────────────

function PassaporteNavigator() {
  return (
    <PassaporteStack.Navigator screenOptions={{ headerShown: false }}>
      <PassaporteStack.Screen name="PassaporteHome" component={PassportScreen} />
      <PassaporteStack.Screen
        name="StampDetail"
        component={StampDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </PassaporteStack.Navigator>
  );
}

function BuscarNavigator() {
  return (
    <BuscarStack.Navigator screenOptions={{ headerShown: false }}>
      <BuscarStack.Screen name="BuscarHome" component={SearchScreen} />
      <BuscarStack.Screen
        name="StampDetail"
        component={StampDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </BuscarStack.Navigator>
  );
}

function ColeçãoNavigator() {
  return (
    <ColeçãoStack.Navigator screenOptions={{ headerShown: false }}>
      <ColeçãoStack.Screen name="ColeçãoHome" component={CollectionScreen} />
      <ColeçãoStack.Screen
        name="StampDetail"
        component={StampDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </ColeçãoStack.Navigator>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────

function AppContent() {
  const [fontsLoaded] = useFonts({
    LibreCaslonText_400Regular,
    LibreCaslonText_700Bold,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <VintageTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Passaporte" component={PassaporteNavigator} />
        <Tab.Screen name="Buscar"     component={BuscarNavigator} />
        <Tab.Screen name="Criar"      component={CreateStampScreen} />
        <Tab.Screen name="Coleção"    component={ColeçãoNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// SafeAreaProvider envolve tudo para que useSafeAreaInsets funcione em qualquer tela
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
