import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';

interface CampBannerProps {
  onSharePress?: () => void;
  compact?: boolean;
  camp?: {
    campTitle: string;
    campCategory: string;
    campDate: string;
    campLocation: string;
  };
}

export const CampBanner: React.FC<CampBannerProps> = ({ onSharePress, compact = false, camp }) => {
  const displayCamp = camp || {
    campTitle: CAMP_DETAILS.campTitle,
    campCategory: CAMP_DETAILS.campCategory,
    campDate: CAMP_DETAILS.campDate,
    campLocation: CAMP_DETAILS.campLocation,
  };

  return (
    <View style={[styles.promoSection, SHADOWS.xs]}>
      <View style={styles.promoHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: COLORS.primaryPale }]}>
          <Ionicons name="medical-outline" size={12} color={COLORS.primary} />
          <Text style={styles.categoryText}>{displayCamp.campCategory}</Text>
        </View>
        <TouchableOpacity
          style={styles.promoShareBtn}
          onPress={onSharePress}
          activeOpacity={0.7}
          accessibilityLabel="Share camp"
        >
          <Ionicons name="share-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.campTitle}>{displayCamp.campTitle}</Text>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.metaText}>{displayCamp.campDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.metaText}>{displayCamp.campLocation}</Text>
        </View>
      </View>

      {!compact && camp && camp.campTitle !== CAMP_DETAILS.campTitle && (
        <View style={styles.orgSection}>
          <Text style={styles.orgText}>Organized by</Text>
        </View>
      )}

      {!compact && !camp && (
        <View style={styles.orgSection}>
          <Text style={styles.orgText}>{CAMP_DETAILS.institution1}</Text>
          <Text style={styles.orgConjunction}>{CAMP_DETAILS.conjunction}</Text>
          <Text style={styles.orgText}>{CAMP_DETAILS.institution2}</Text>
        </View>
      )}

      {onSharePress && (
        <View style={styles.promoShareRow}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: COLORS.accentPale }]}
            onPress={onSharePress}
            activeOpacity={0.8}
            accessibilityLabel="Share on WhatsApp"
          >
            <Ionicons name="logo-whatsapp" size={20} color={COLORS.accent} />
            <Text style={[styles.shareText, { color: COLORS.accent }]}>Share Campaign</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  promoSection: {
    backgroundColor: COLORS.promoBg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.body,
  },
  promoShareBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  campTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: SPACING.sm,
    fontFamily: FONT_FAMILY.body,
    letterSpacing: -0.3,
  },
  metaGrid: {
    gap: 6,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13.5,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
  orgSection: {
    gap: 2,
    marginBottom: SPACING.sm,
  },
  orgText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body,
  },
  orgConjunction: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
  promoShareRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  shareText: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILY.body,
  },
});
