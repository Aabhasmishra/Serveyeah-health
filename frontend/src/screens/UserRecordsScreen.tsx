import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';
import { formatBackendDate, computeAgeFromDob } from '../services/api';

export const UserRecordsScreen: React.FC = () => {
  const {
    apiScreenings,
    apiPatient,
    apiPatientLoading,
    apiScreeningsLoading,
    apiError,
    previewScreeningFromApi,
    navigateTo,
  } = useScreening();

  const screeningsByDate = [...apiScreenings].sort((a, b) => {
    // Primary: screening_date descending (string comparison works for YYYY-MM-DD)
    if (a.screening_date !== b.screening_date) {
      return b.screening_date.localeCompare(a.screening_date);
    }
    // Tie-breaker: created_at descending
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const latestShort = screeningsByDate[0]
    ? formatBackendDate(screeningsByDate[0].screening_date, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  if (!apiPatient && apiPatientLoading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="My Records"
          subtitle="Medical Records"
          showBack={true}
          onBack={() => navigateTo('patientHome')}
        />
        <View style={styles.stateBlock}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading your records…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Records"
        subtitle={apiPatient?.full_name ?? 'Medical Records'}
        showBack={true}
        onBack={() => navigateTo('patientHome')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {apiPatient && (
          <View style={styles.patientBanner}>
            <View style={styles.avatarBox}>
              {apiPatient.photo_url ? (
                <Image source={{ uri: apiPatient.photo_url }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={30} color={COLORS.primaryLight} />
              )}
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{apiPatient.full_name}</Text>
              <Text style={styles.patientMeta}>
                {[computeAgeFromDob(apiPatient.date_of_birth) && `${computeAgeFromDob(apiPatient.date_of_birth)} yrs`, apiPatient.gender]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
              {(apiPatient.chronic_conditions || apiPatient.allergies) ? (
                <View style={styles.conditionsBadge}>
                  <Ionicons name="warning-outline" size={12} color={COLORS.warning} />
                  <Text style={styles.conditionsText} numberOfLines={1}>
                    {apiPatient.chronic_conditions || apiPatient.allergies}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {apiError && !apiScreeningsLoading && screeningsByDate.length === 0 ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{screeningsByDate.length}</Text>
            <Text style={styles.summaryLabel}>Screenings</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{screeningsByDate.length === 1 ? '1 screening record' : `${screeningsByDate.length} screening records`}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{latestShort}</Text>
            <Text style={styles.summarySublabel}>Last Screening</Text>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Screening Timeline</Text>

          {apiScreeningsLoading && screeningsByDate.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.emptyDesc}>Loading your screening records…</Text>
            </View>
          ) : screeningsByDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptyDesc}>
                You don't have any screening records yet. Records will appear here after your next health camp visit.
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {screeningsByDate.map((screening, index) => {
                const isLast = index === screeningsByDate.length - 1;
                const campName = screening.camp?.camp_name ?? screening.village;
                return (
                  <View key={screening.id} style={styles.timelineItem}>
                    <View style={styles.timelineLine}>
                      {!isLast && <View style={styles.timelineConnector} />}
                      <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]}>
                        <Ionicons name="medical-outline" size={12} color={COLORS.card} />
                      </View>
                    </View>

                    <View style={styles.recordContent}>
                      <View style={styles.recordHeader}>
                        <Text style={styles.recordDate}>
                          {formatBackendDate(screening.screening_date)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: COLORS.successPale }]}>
                          <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                          <Text style={styles.statusText}>Completed</Text>
                        </View>
                      </View>

                      <View style={styles.recordDetails}>
                        {screening.ecg ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="pulse" size={14} color={COLORS.textMuted} />
                            <Text style={styles.detailLabel}>ECG:</Text>
                            <Text style={styles.detailValue}>{screening.ecg}</Text>
                          </View>
                        ) : null}
                        {screening.echo_heart ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="heart" size={14} color={COLORS.textMuted} />
                            <Text style={styles.detailLabel}>Echo:</Text>
                            <Text style={styles.detailValue}>{screening.echo_heart}</Text>
                          </View>
                        ) : null}
                        {screening.blood_pressure ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="water-outline" size={14} color={COLORS.textMuted} />
                            <Text style={styles.detailLabel}>BP:</Text>
                            <Text style={styles.detailValue}>{screening.blood_pressure}</Text>
                          </View>
                        ) : null}
                        {screening.bmi != null ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="speedometer-outline" size={14} color={COLORS.textMuted} />
                            <Text style={styles.detailLabel}>BMI:</Text>
                            <Text style={styles.detailValue}>{screening.bmi}</Text>
                          </View>
                        ) : null}
                        {campName ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                            <Text style={styles.detailLabel}>Camp:</Text>
                            <Text style={styles.detailValue}>{campName}</Text>
                          </View>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.viewResultBtn}
                        onPress={() => previewScreeningFromApi(screening)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewResultText}>View Result</Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },
  stateBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: 12,
  },
  stateText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body, textAlign: 'center',
  },
  patientBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryPale,
  },
  avatarBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: COLORS.primaryPale,
  },
  avatar: { width: '100%', height: '100%' },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body,
  },
  patientMeta: {
    fontSize: 12, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body, marginTop: 2,
  },
  conditionsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.warningPale,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 2,
    marginTop: 6, alignSelf: 'flex-start',
  },
  conditionsText: {
    fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.warning,
    fontFamily: FONT_FAMILY.body, flexShrink: 1,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  errorText: {
    fontSize: 12, color: COLORS.danger,
    fontFamily: FONT_FAMILY.body, flex: 1,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryValue: {
    fontSize: 22, fontWeight: FONT_WEIGHTS.black, color: COLORS.primary,
    fontFamily: FONT_FAMILY.heading,
  },
  summaryLabel: {
    fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
  summaryText: {
    fontSize: 13, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.success,
    fontFamily: FONT_FAMILY.body,
  },
  summarySublabel: {
    fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary,
    textAlign: 'right', fontFamily: FONT_FAMILY.body,
  },
  timelineSection: { paddingHorizontal: SPACING.md },
  sectionTitle: {
    fontSize: 14, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textDark,
    marginBottom: 12, fontFamily: FONT_FAMILY.body,
  },
  timeline: { gap: 12 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLine: { alignItems: 'center', width: 24 },
  timelineConnector: {
    position: 'absolute', top: 22, bottom: -12,
    width: 2, backgroundColor: COLORS.divider, left: 9,
  },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  recordContent: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  recordHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 14, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body, flex: 1,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.success,
    fontFamily: FONT_FAMILY.body,
  },
  recordDetails: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: {
    fontSize: 12, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary,
    minWidth: 42, fontFamily: FONT_FAMILY.body,
  },
  detailValue: {
    fontSize: 12, color: COLORS.text, flex: 1,
    fontFamily: FONT_FAMILY.body,
  },
  viewResultBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  viewResultText: {
    fontSize: 12, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary,
    fontFamily: FONT_FAMILY.body,
  },
  emptyState: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textDark,
    marginTop: 12, fontFamily: FONT_FAMILY.body,
  },
  emptyDesc: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 18, marginTop: 4, fontFamily: FONT_FAMILY.body,
  },
  footer: { alignItems: 'center', marginTop: SPACING.xl, paddingHorizontal: SPACING.md },
  footerText: {
    fontSize: 11, color: COLORS.textMuted, fontFamily: FONT_FAMILY.body,
  },
});