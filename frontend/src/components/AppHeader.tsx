import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';
import { Logo } from './Logo';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBrand?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  showBrand = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
        ) : null}

        {showBrand ? (
          <View style={styles.brandRow}>
            <Logo variant="symbol" width={32} />
            <View>
              <Text style={styles.brandAppName}>{CAMP_DETAILS.appName}</Text>
              <Text style={styles.brandTagline}>{CAMP_DETAILS.tagline}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle}>{title}</Text>
            {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
        )}
      </View>

      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundAlt,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandAppName: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  titleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.2,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body,
  },
  rightAction: {
    marginLeft: 12,
  },
});
