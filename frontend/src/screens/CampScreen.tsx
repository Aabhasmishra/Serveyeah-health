import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';
import { Camp } from '../types/api';
import { shareCampViaWhatsApp } from '../services/shareService';
import { formatBackendDate } from '../services/api';

export const CampScreen: React.FC = () => {
  const {
    userRole,
    entries,
    apiCamps,
    apiCampsLoading,
    apiError,
    startNewEntry,
    loadCamps,
  } = useScreening();

  const handleShare = () => {
    shareCampViaWhatsApp();
  };

  // Use API data for worker, fallback to CAMP_DETAILS for patient
  const isWorker = userRole === 'worker';
  const camps = isWorker ? apiCamps : [];
  
  // For worker, get active camps; for patient, use static details
  const activeCamp = isWorker 
    ? camps.find(c => c.is_active) 
    : {
        camp_name: CAMP_DETAILS.campTitle,
        camp_category: CAMP_DETAILS.campCategory,
        camp_date: CAMP_DETAILS.campDate,
        camp_location: CAMP_DETAILS.campLocation,
        is_active: true,
        organizer_institution_1: CAMP_DETAILS.institution1,
        organizer_institution_2: CAMP_DETAILS.institution2,
        association_details: CAMP_DETAILS.associations.join(', '),
        venue_name: CAMP_DETAILS.venueName,
        venue_address: CAMP_DETAILS.venueAddress,
        created_at: new Date().toISOString(),
      } as Camp;

  // Count screenings for this camp
  const screeningsThisCamp = isWorker && activeCamp
    ? entries.filter(e => e.createdAt && new Date(e.createdAt).getFullYear() === 2026).length
    : entries.filter(e => e.createdAt && new Date(e.createdAt).getFullYear() === 2026).length;

  // For worker, show loading states
  if (isWorker && apiCampsLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Camp Information" />
        <View style={styles.stateBlock}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading camp info…</Text>
        </View>
      </View>
    );
  }

  if (isWorker && apiError && !activeCamp) {
    return (
      <View style={styles.container}>
        <AppHeader title="Camp Information" />
        <View style={styles.stateBlock}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
          <Text style={styles.stateText}>{apiError}</Text>
          <TouchableOpacity
            onPress={loadCamps}
            style={styles.retryBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Use fallback if no active camp found
  const displayCamp: Camp = activeCamp || {
    id: 'fallback-camp',
    camp_name: CAMP_DETAILS.campTitle,
    camp_category: CAMP_DETAILS.campCategory,
    camp_date: CAMP_DETAILS.campDate,
    camp_location: CAMP_DETAILS.campLocation,
    is_active: false,
    organizer_institution_1: CAMP_DETAILS.institution1,
    organizer_institution_2: CAMP_DETAILS.institution2,
    association_details: CAMP_DETAILS.associations.join(', '),
    venue_name: CAMP_DETAILS.venueName,
    venue_address: CAMP_DETAILS.venueAddress,
    max_capacity: null,
    registered_count: 0,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const formattedDate = displayCamp.camp_date
    ? formatBackendDate(displayCamp.camp_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : CAMP_DETAILS.campDate;

  return (
    <View style={styles.container}>
      <AppHeader
        title="Camp Information"
        subtitle={displayCamp.camp_category || 'Health Camp'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== CAMPAIGN HERO ===== */}
        <View style={[styles.heroCard, SHADOWS.md]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroCategory, { backgroundColor: COLORS.primaryPale }]}>
              <Ionicons name="medical-outline" size={14} color={COLORS.primary} />
              <Text style={styles.heroCategoryText}>{displayCamp.camp_category || 'Health Camp'}</Text>
            </View>

            <TouchableOpacity
              style={styles.heroShareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
              accessibilityLabel="Share camp"
            >
              <Ionicons name="share-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{displayCamp.camp_name}</Text>

          <View style={styles.heroMeta}>
            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.heroMetaText}>{formattedDate}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.heroMetaText}>{displayCamp.camp_location}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <Ionicons name="people-outline" size={16} color={COLORS.accent} />
              <Text style={[styles.heroMetaText, { color: COLORS.accent, fontWeight: FONT_WEIGHTS.semibold }]}>
                {screeningsThisCamp} screenings recorded
              </Text>
            </View>
          </View>
        </View>

        {/* ===== CAMP OVERVIEW STATS ===== */}
        <View style={styles.statsOverview}>
          <View style={styles.statTile}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={styles.statTileValue}>Free</Text>
            <Text style={styles.statTileLabel}>Registration</Text>
          </View>
          <View style={styles.statTile}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
            <Text style={styles.statTileValue}>Full</Text>
            <Text style={styles.statTileLabel}>Medical Coverage</Text>
          </View>
          <View style={styles.statTile}>
            <Ionicons name="heart-outline" size={20} color={COLORS.danger} />
            <Text style={styles.statTileValue}>ECG & Echo</Text>
            <Text style={styles.statTileLabel}>Screening Type</Text>
          </View>
        </View>

        {/* ===== CAMPAIGN DETAILS ===== */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailSectionTitle}>About This Camp</Text>
          <View style={styles.detailCard}>
            <Text style={styles.detailDescription}>
              {isWorker && displayCamp.association_details
                ? displayCamp.association_details
                : CAMP_DETAILS.subDescription}
            </Text>
          </View>

          <Text style={styles.detailSectionTitle}>Organized By</Text>
          <View style={styles.detailCard}>
            <View style={styles.orgItem}>
              <Ionicons name="business-outline" size={16} color={COLORS.primary} />
              <Text style={styles.orgText}>{displayCamp.organizer_institution_1 || CAMP_DETAILS.institution1}</Text>
            </View>
            <Text style={styles.orgConjunction}>{CAMP_DETAILS.conjunction}</Text>
            <View style={styles.orgItem}>
              <Ionicons name="business-outline" size={16} color={COLORS.primary} />
              <Text style={styles.orgText}>{displayCamp.organizer_institution_2 || CAMP_DETAILS.institution2}</Text>
            </View>
          </View>

          <Text style={styles.detailSectionTitle}>Associations</Text>
          <View style={styles.detailCard}>
            {isWorker && displayCamp.association_details
              ? displayCamp.association_details.split(',').map((assoc, index) => (
                  <View key={index} style={styles.assocItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.assocText}>{assoc.trim()}</Text>
                  </View>
                ))
              : CAMP_DETAILS.associations.map((assoc, index) => (
                  <View key={index} style={styles.assocItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.assocText}>{assoc}</Text>
                  </View>
                ))}
          </View>

          <Text style={styles.detailSectionTitle}>Venue</Text>
          <View style={styles.detailCard}>
            <View style={styles.venueItem}>
              <Ionicons name="location-outline" size={16} color={COLORS.accent} />
              <Text style={styles.venueName}>{displayCamp.venue_name || CAMP_DETAILS.venueName}</Text>
            </View>
            <Text style={styles.venueAddress}>{displayCamp.venue_address || CAMP_DETAILS.venueAddress}</Text>
          </View>
        </View>

        {/* ===== CTA ===== */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaButtons}>
            <PrimaryButton
              title="New Screening"
              onPress={startNewEntry}
              icon="add-circle-outline"
              style={styles.primaryBtn}
            />
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={22} color={COLORS.card} />
              <Text style={styles.shareBtnText}>Share on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {CAMP_DETAILS.appName} • {CAMP_DETAILS.website}
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
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  heroCategoryText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.body,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  heroShareBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.textDark,
    lineHeight: 24,
    marginBottom: SPACING.sm,
    fontFamily: FONT_FAMILY.body,
    letterSpacing: -0.3,
  },
  heroMeta: {
    gap: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
    flexWrap: 'wrap',
  },
  statsOverview: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statTileValue: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body,
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
  detailsSection: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY.body,
    marginLeft: 4,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailDescription: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.body,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orgText: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    flex: 1,
    fontFamily: FONT_FAMILY.body,
  },
  orgConjunction: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 2,
    fontFamily: FONT_FAMILY.body,
  },
  assocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  assocText: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  venueName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  venueAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: FONT_FAMILY.body,
  },
  ctaSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  ctaButtons: {
    gap: SPACING.sm,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.lg,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.full,
  },
  shareBtnText: {
    color: COLORS.card,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILY.body,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
  },
  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  stateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
  retryBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {
    color: COLORS.card,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
});
