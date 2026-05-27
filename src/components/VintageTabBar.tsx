import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

// Tab bar configuration
const TAB_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconActive: React.ComponentProps<typeof Ionicons>['name'];
  }
> = {
  Passport:   { label: 'JOURNAL',  icon: 'book-outline',    iconActive: 'book' },
  Search:     { label: 'SEARCH',   icon: 'search-outline',  iconActive: 'search' },
  Create:     { label: 'STAMP',    icon: 'pencil-outline',  iconActive: 'pencil' },
  Collection: { label: 'PROFILE',  icon: 'person-outline',  iconActive: 'person' },
};

/**
 * Custom vintage-style tab bar component for the bottom navigation.
 * Features a literary, editorial design with dynamic active states.
 */
export function VintageTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Check if the focused tab requested to hide the bar (e.g., PassportScreen closed)
  const focusedRoute   = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  if (focusedOptions.tabBarStyle) {
    const s = Array.isArray(focusedOptions.tabBarStyle)
      ? Object.assign({}, ...focusedOptions.tabBarStyle)
      : focusedOptions.tabBarStyle;
    if ((s as Record<string, unknown>).display === 'none') return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={focused ? config.iconActive : config.icon}
              size={20}
              color={focused ? COLORS.secondary : COLORS.onSurfaceVariant}
            />
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
