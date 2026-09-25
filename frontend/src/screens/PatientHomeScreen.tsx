import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { CampBanner } from '../components/CampBanner';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { formatBackendDate, computeAgeFromDob } from '../services/api';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const PatientHomeScreen: React.FC = () => {
  const {
    apiPatient,
    apiScreenings,
    apiPatientLoading,
    apiScreeningsLoading,
    apiError,
    switchTab,
  } = useScreening();

  const latestScreening = apiScreenings.length > 0
    ? [...apiScreenings].sort((a, b) => {
        // Primary: screening_date descending (string comparison works for YYYY-MM-DD)
        if (a.screening_date !== b.screening_date) {
          return b.screening_date.localeCompare(a.screening_date);
        }
        // Tie-breaker: created_at descending
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })[0]
    : null;

  const displayName = apiPatient?.full_name ?? 'Patient';
  const firstName = displayName.split(' ')[0];
  const age = computeAgeFromDob(apiPatient?.date_of_birth);
  const gender = apiPatient?.gender ?? '';

  const healthMetrics: Array<{
    label: string;
    value: string;
    unit: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }> = [
    {
      label: 'BMI',
      value: latestScreening?.bmi != null ? String(latestScreening.bmi) : '—',
      unit: 'kg/m²',
      icon: 'speedometer-outline',
      color: COLORS.primary,
    },
    {
      label: 'Blood Pressure',
      value: latestScreening?.blood_pressure ?? '—',
      unit: '',
      icon: 'water-outline',
      color: COLORS.accent,
    },
    {
      label: 'Glucose',
      value: latestScreening?.blood_sugar ?? '—',
      unit: 'mg/dL',
      icon: 'analytics-outline',
      color: COLORS.secondary,
    },
    {
      label: 'Pulse',
      value: latestScreening?.heart_rate != null ? String(latestScreening.heart_rate) : '—',
      unit: 'bpm',
      icon: 'pulse',
      color: COLORS.danger,
    },
  ];

  if (!apiPatient && apiPatientLoading) {
    return (
      <View style={styles.container}>
        <AppHeader showBrand />
        <View style={styles.stateBlock}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading your profile…</Text>
        </View>
      </View>
    );
  }

  if (!apiPatient) {
    return (
      <View style={styles.container}>
        <AppHeader showBrand />
        <View style={styles.stateBlock}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.stateText}>{apiError ?? 'Unable to load your profile.'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        showBrand
        rightAction={
          <TouchableOpacity
            style={styles.switchPatientBtn}
            onPress={() => switchTab('more')}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-vertical-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ===== GREETING ===== */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getTimeOfDay()}, {firstName}
          </Text>
        </View>

        {/* ===== PROFILE SUMMARY ===== */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              {apiPatient.photo_url ? (
                <Image source={{ uri: apiPatient.photo_url }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={38} color={COLORS.primaryLight} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.patientName}>{apiPatient.full_name}</Text>
              <Text style={styles.patientMeta}>
                {age ? `${age} years` : ''}
                {age && gender ? ' • ' : ''}
                {gender}
              </Text>
            </View>
          </View>

          <View style={styles.conditionsContainer}>
            <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
            <Text style={styles.conditionsText}>
              {apiPatient.chronic_conditions || apiPatient.allergies || 'No known conditions'}
            </Text>
          </View>
        </View>

        {/* ===== HEALTH OVERVIEW ===== */}
        <View style={styles.healthOverviewSection}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <View style={styles.metricsGrid}>
            {healthMetrics.map((metric) => (
              <View key={metric.label} style={styles.metricTile}>
                <View style={[styles.metricIconBox, { backgroundColor: metric.color + '15' }]}>
                  <Ionicons name={metric.icon} size={18} color={metric.color} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                {metric.unit ? <Text style={styles.metricUnit}>{metric.unit}</Text> : null}
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== LAST SCREENING ===== */}
        <View style={styles.lastScreeningSection}>
          <Text style={styles.sectionTitle}>Last Screening</Text>
          <View style={styles.screeningCard}>
            {apiScreeningsLoading && apiScreenings.length === 0 ? (
              <View style={styles.screeningLoading}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.screeningFinding}>Loading screenings…</Text>
              </View>
            ) : latestScreening ? (
              <>
                <View style={styles.screeningDateRow}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.screeningDate}>
                    {formatBackendDate(latestScreening.screening_date)}
                  </Text>
                </View>

                {latestScreening.ecg ? (
                  <Text style={styles.screeningFinding} numberOfLines={2}>
                    ECG: {latestScreening.ecg}
                  </Text>
                ) : null}
                {latestScreening.echo_heart ? (
                  <Text style={styles.screeningFinding} numberOfLines={2}>
                    Echo: {latestScreening.echo_heart}
                  </Text>
                ) : null}
                {latestScreening.advice ? (
                  <Text style={styles.screeningFinding} numberOfLines={2}>
                    Advice: {latestScreening.advice}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.viewReportBtn}
                  onPress={() => switchTab('records')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewReportText}>View Full Report</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.screeningFinding}>
                  No previous screening records yet. Records will appear here after your next health camp visit.
                </Text>
                <TouchableOpacity
                  style={styles.viewReportBtn}
                  onPress={() => switchTab('records')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewReportText}>View Records</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ===== UPCOMING CAMP ===== */}
        <View style={styles.campSection}>
          <Text style={styles.sectionTitle}>Upcoming Camp</Text>
          <CampBanner onSharePress={() => {}} compact={true} />
        </View>

        {/* ===== QUICK ACTIONS ===== */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionTile, { backgroundColor: COLORS.primaryPale }]}
              onPress={() => switchTab('records')}
              activeOpacity={0.8}
              accessibilityLabel="My Records"
            >
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionLabel}>My Records</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionTile, { backgroundColor: COLORS.accentPale }]}
              onPress={() => switchTab('profile')}
              activeOpacity={0.8}
              accessibilityLabel="My Profile"
            >
              <Ionicons name="person-outline" size={24} color={COLORS.accent} />
              <Text style={styles.quickActionLabel}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionTile, { backgroundColor: COLORS.infoPale }]}
              onPress={() => switchTab('camp')}
              activeOpacity={0.8}
              accessibilityLabel="Camps"
            >
              <Ionicons name="medical-outline" size={24} color={COLORS.info} />
              <Text style={styles.quickActionLabel}>Camps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionTile, { backgroundColor: COLORS.successPale }]}
              onPress={() => switchTab('more')}
              activeOpacity={0.8}
              accessibilityLabel="More"
            >
              <Ionicons name="ellipsis-horizontal-outline" size={24} color={COLORS.success} />
              <Text style={styles.quickActionLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },
  switchPatientBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
  },
  greetingSection: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  greeting: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: SPACING.sm },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: COLORS.primaryPale,
  },
  avatarImage: { width: '100%', height: '100%' },
  profileInfo: { flex: 1 },
  patientName: {
    fontSize: 18, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body, marginBottom: 2,
  },
  patientMeta: {
    fontSize: 13, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body,
  },
  conditionsContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warningPale,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  conditionsText: {
    fontSize: 12, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.warning,
    fontFamily: FONT_FAMILY.body, flex: 1,
  },
  healthOverviewSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: {
    fontSize: 14, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textDark,
    marginBottom: 12, fontFamily: FONT_FAMILY.body,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metricTile: {
    flex: 1, minWidth: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  metricIconBox: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  metricValue: {
    fontSize: 18, fontWeight: FONT_WEIGHTS.black, color: COLORS.textDark,
    fontFamily: FONT_FAMILY.heading, lineHeight: 22,
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 10, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
  },
  metricLabel: {
    fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary,
    textAlign: 'center', fontFamily: FONT_FAMILY.body,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  lastScreeningSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  screeningCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  screeningLoading: { alignItems: 'center', padding: SPACING.sm, gap: 8 },
  screeningDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  screeningDate: {
    fontSize: 14, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.body,
  },
  screeningFinding: {
    fontSize: 13, fontWeight: FONT_WEIGHTS.regular, color: COLORS.textSecondary,
    lineHeight: 18, fontFamily: FONT_FAMILY.body, marginBottom: 4,
  },
  viewReportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 10, paddingVertical: 4,
  },
  viewReportText: {
    fontSize: 12, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary,
    fontFamily: FONT_FAMILY.body,
  },
  campSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  quickActionsSection: { paddingHorizontal: SPACING.md },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickActionTile: {
    flex: 1, minWidth: '46%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  quickActionLabel: {
    fontSize: 12, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body,
  },
});