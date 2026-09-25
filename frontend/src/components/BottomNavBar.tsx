import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreening } from '../context/ScreeningContext';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS } from '../constants/theme';
import { TabName } from '../types/student';

interface TabConfig {
  key: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

export const BottomNavBar: React.FC<{ activeTab: TabName; onTabPress: (tab: TabName) => void }> = ({
  activeTab,
  onTabPress,
}) => {
  const { userRole } = useScreening();
  const insets = useSafeAreaInsets();

  const WORKER_TABS: TabConfig[] = [
    { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { key: 'history', label: 'Screenings', icon: 'time-outline', iconActive: 'time' },
    { key: 'camp', label: 'Camp', icon: 'medical-outline', iconActive: 'medical' },
    { key: 'more', label: 'More', icon: 'ellipsis-horizontal-outline', iconActive: 'ellipsis-horizontal' },
  ];

  const USER_TABS: TabConfig[] = [
    { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { key: 'records', label: 'Records', icon: 'document-text-outline', iconActive: 'document-text' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
    { key: 'more', label: 'More', icon: 'ellipsis-horizontal-outline', iconActive: 'ellipsis-horizontal' },
  ];

  const tabs = userRole === 'patient' ? USER_TABS : WORKER_TABS;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 24 : 12),
          height: 56 + (insets.bottom || 0),
        },
      ]}
    >
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
              accessibilityLabel={tab.label}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={isActive ? 22 : 20}
                color={isActive ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? COLORS.primary : COLORS.textMuted,
                    fontWeight: isActive ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.regular,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
  },
});
