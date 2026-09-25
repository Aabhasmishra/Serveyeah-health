import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  children,
}) => {
  return (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon ? (
            <View style={[styles.iconBox, { backgroundColor: COLORS.primaryPale }]}>
              <Ionicons name={icon} size={18} color={COLORS.primary} />
            </View>
          ) : null}
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {badge ? (
          <View style={[styles.badgeContainer, { backgroundColor: COLORS.secondaryLight }]}>
            <Text style={[styles.badgeText, { color: COLORS.secondary }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY.body,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  content: {
    width: '100%',
  },
});
