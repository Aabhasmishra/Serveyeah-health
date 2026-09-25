import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';

interface MenuAction {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}

export const MoreScreen: React.FC = () => {
  const { userRole, setUserRole, navigateTo } = useScreening();

  const handleRoleSwitch = () => {
    Alert.alert(
      'Switch Role',
      'Switch between Worker/Staff and Patient/User views.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Worker / Staff', onPress: () => setUserRole('worker') },
        { text: 'Patient / User', onPress: () => setUserRole('patient') },
      ]
    );
  };

  const handleShareApp = () => {
    const url = CAMP_DETAILS.website ? `https://${CAMP_DETAILS.website}` : undefined;
    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) Linking.openURL(url);
      });
    }
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Thank you for using ServeYeah Health!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings panel coming soon.');
  };

  const handleAbout = () => {
    navigateTo('roleSelection');
  };

  const menuActions: MenuAction[] = [
    {
      key: 'role-switch',
      label: 'Switch Role',
      description: userRole === 'worker' ? 'Currently: Worker/Staff' : 'Currently: Patient/User',
      icon: 'people-outline',
      iconColor: COLORS.primary,
      iconBg: COLORS.primaryPale,
      onPress: handleRoleSwitch,
    },
    {
      key: 'settings',
      label: 'Settings',
      description: 'App preferences and configuration',
      icon: 'settings-outline',
      iconColor: COLORS.secondary,
      iconBg: COLORS.secondaryLight,
      onPress: handleSettings,
    },
    {
      key: 'share',
      label: 'Share App',
      description: 'Share ServeYeah Health with others',
      icon: 'share-outline',
      iconColor: COLORS.accent,
      iconBg: COLORS.accentPale,
      onPress: handleShareApp,
    },
    {
      key: 'rate',
      label: 'Rate Us',
      description: 'Rate ServeYeah Health in your app store',
      icon: 'star-outline',
      iconColor: COLORS.warning,
      iconBg: COLORS.warningPale,
      onPress: handleRateApp,
    },
    {
      key: 'about',
      label: 'About',
      description: 'App version and credits',
      icon: 'information-circle-outline',
      iconColor: COLORS.info,
      iconBg: COLORS.infoPale,
      onPress: handleAbout,
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title="More"
        subtitle={userRole === 'worker' ? 'Worker Mode' : 'Patient Mode'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.menuList, SHADOWS.xs]}>
          {menuActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.menuItem}
              onPress={action.onPress}
              activeOpacity={0.7}
              accessibilityLabel={action.label}
            >
              <View style={[styles.menuIcon, { backgroundColor: action.iconBg }]}>
                <Ionicons name={action.icon} size={20} color={action.iconColor} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{action.label}</Text>
                <Text style={styles.menuDesc}>{action.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.versionSection}>
          <Text style={styles.versionText}>
            {CAMP_DETAILS.appName} v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 48,
  },
  menuList: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
  },
});
