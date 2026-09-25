import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { CampBanner } from '../components/CampBanner';
import { RecentEntryCard } from '../components/RecentEntryCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';
import { StudentScreeningEntry } from '../types/student';
import { Screening } from '../types/api';
import { mapScreeningToEntry, formatBackendDate } from '../services/api';
import { printScreeningForm } from '../services/printService';
import { shareCampViaWhatsApp } from '../services/shareService';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardScreen: React.FC = () => {
  const {
    userRole,
    entries,
    apiScreenings,
    apiCamps,
    apiScreeningsLoading,
    apiCampsLoading,
    apiError,
    startNewEntry,
    selectEntryForPreview,
    navigateTo,
    loadWorkerScreenings,
    loadCamps,
  } = useScreening();

  const handlePrint = async (entry: StudentScreeningEntry) => {
    try {
      await printScreeningForm(entry);
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handleCampShare = () => {
    shareCampViaWhatsApp();
  };

  // Use API data for worker, local entries for patient
  const isWorker = userRole === 'worker';
  const screenings = isWorker ? apiScreenings : entries;
  const camps = isWorker ? apiCamps : [];

  // Type guard to check if item is Screening (from API)
  const isApiScreening = (item: StudentScreeningEntry | Screening | null | undefined): item is Screening => {
    return item !== null && item !== undefined && 'screening_date' in item;
  };

  // Sort by screening_date (primary) then created_at (tie-breaker)
  const sortedScreenings = [...screenings].sort((a, b) => {
    const dateA = isApiScreening(a) ? (a.screening_date ?? a.created_at ?? '') : (a.createdAt ?? '');
    const dateB = isApiScreening(b) ? (b.screening_date ?? b.created_at ?? '') : (b.createdAt ?? '');
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    const createdA = isApiScreening(a) ? (a.created_at ?? 0) : new Date(a.createdAt ?? 0).getTime();
    const createdB = isApiScreening(b) ? (b.created_at ?? 0) : new Date(b.createdAt ?? 0).getTime();
    return new Date(createdB).getTime() - new Date(createdA).getTime();
  });

  const recentScreenings = sortedScreenings.slice(0, 2);
  const lastScreening = sortedScreenings[0];
  const lastScreeningDate = lastScreening
    ? isApiScreening(lastScreening) && lastScreening.screening_date
      ? formatBackendDate(lastScreening.screening_date, { month: 'short', day: 'numeric' })
      : !isApiScreening(lastScreening) && lastScreening.createdAt
        ? new Date(lastScreening.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '—'
    : '—';

  // For camps - use API camp data or fallback to CAMP_DETAILS
  const activeCamp = isWorker ? camps.find(c => c.is_active) : null;
  const campDisplay = activeCamp || {
    campName: CAMP_DETAILS.campTitle,
    campCategory: CAMP_DETAILS.campCategory,
    campDate: CAMP_DETAILS.campDate,
    campLocation: CAMP_DETAILS.campLocation,
  };

  // For worker, show loading states
  if (isWorker && (apiScreeningsLoading || apiCampsLoading)) {
    return (
      <View style={styles.container}>
        <AppHeader showBrand />
        <View style={styles.stateBlock}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading dashboard…</Text>
        </View>
      </View>
    );
  }

  if (isWorker && apiError && sortedScreenings.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader showBrand />
        <View style={styles.stateBlock}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
          <Text style={styles.stateText}>{apiError}</Text>
          <PrimaryButton
            title="Retry"
            onPress={() => { loadWorkerScreenings(); loadCamps(); }}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showBrand />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== WELCOME / TODAY'S SUMMARY ===== */}
        <View style={styles.welcomeSection}>
          <Text style={styles.hospitalName}>{CAMP_DETAILS.hospitalName}</Text>
          <Text style={styles.welcomeTitle}>Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>
            {isWorker ? "Worker's screening summary" : "Today's screening summary"}
          </Text>

          <View style={styles.screeningSummaryRow}>
            <View style={[styles.summaryStat, { backgroundColor: COLORS.primaryPale }]}>
              <Text style={[styles.summaryValue, { color: COLORS.primaryDark }]}>{sortedScreenings.length}</Text>
              <Text style={styles.summaryLabel}>Total Screenings</Text>
            </View>
            <View style={[styles.summaryStat, { backgroundColor: COLORS.accentPale }]}>
              <Text style={[styles.summaryValue, { color: COLORS.accent }]}>{isWorker && activeCamp ? 'Active' : '—'}</Text>
              <Text style={styles.summaryLabel}>Current Camp</Text>
            </View>
            <View style={[styles.summaryStat, { backgroundColor: COLORS.infoPale }]}>
              <Text style={[styles.summaryValue, { color: COLORS.info }]}>{lastScreeningDate}</Text>
              <Text style={styles.summaryLabel}>Last Screening</Text>
            </View>
          </View>
        </View>

        {/* ===== PRIMARY ACTION AREA ===== */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="New Screening"
            onPress={startNewEntry}
            icon="add-circle-outline"
            style={styles.newScreeningBtn}
          />
          <TouchableOpacity
            style={styles.viewHistoryBtn}
            onPress={() => navigateTo('history')}
            activeOpacity={0.8}
            accessibilityLabel="View screening history"
          >
            <Ionicons name="time-outline" size={22} color={COLORS.primary} />
            <Text style={styles.viewHistoryText}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* ===== UPCOMING CAMP ===== */}
        <View style={styles.campSection}>
          <Text style={styles.sectionTitle}>Upcoming Camp</Text>
          <CampBanner
            onSharePress={handleCampShare}
            compact={false}
            camp={activeCamp ? {
              campTitle: activeCamp.camp_name,
              campCategory: activeCamp.camp_category || 'Health Camp',
              campDate: activeCamp.camp_date,
              campLocation: activeCamp.camp_location,
            } : undefined}
          />
        </View>

        {/* ===== RECENT SCREENINGS ===== */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Screenings</Text>
            {sortedScreenings.length > 0 && (
              <TouchableOpacity onPress={() => navigateTo('history')}>
                <Text style={styles.seeAllLink}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentScreenings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Screenings Yet</Text>
              <Text style={styles.emptyDesc}>
                {isWorker
                  ? 'Tap "New Screening" to record your first health screening.'
                  : 'Tap "New Screening" to record your first health screening.'}
              </Text>
            </View>
          ) : (
            <View>
              {recentScreenings.map((screening) => {
                // Convert Screening to StudentScreeningEntry for RecentEntryCard
                const entry = isApiScreening(screening) ? mapScreeningToEntry(screening) : screening;
                return (
                  <RecentEntryCard
                    key={screening.id}
                    entry={entry}
                    onPress={() => selectEntryForPreview(screening.id)}
                    onPrintPress={() => handlePrint(entry)}
                  />
                );
              })}
            </View>
          )}
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
    paddingBottom: SPACING.md,
  },
  welcomeSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  hospitalName: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.body,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
    marginTop: 4,
  },
  screeningSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  summaryStat: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: FONT_WEIGHTS.black,
    fontFamily: FONT_FAMILY.heading,
  },
  summaryLabel: {
    fontSize: 10.5,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
  actionSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  newScreeningBtn: {
    minHeight: 52,
    borderRadius: BORDER_RADIUS.lg,
  },
  viewHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
  },
  viewHistoryText: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.body,
  },
  campSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontFamily: FONT_FAMILY.body,
    letterSpacing: 0.3,
  },
  recentSection: {
    paddingHorizontal: SPACING.md,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  seeAllLink: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  emptyState: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textDark,
    marginTop: 12,
    fontFamily: FONT_FAMILY.body,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    fontFamily: FONT_FAMILY.body,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
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
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
});
