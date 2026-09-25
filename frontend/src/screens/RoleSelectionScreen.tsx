import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';

export const RoleSelectionScreen: React.FC = () => {
  const { setUserRole } = useScreening();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandSection}>
          <Image source={CAMP_DETAILS.logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.hospitalName}>{CAMP_DETAILS.hospitalName}</Text>
          <Text style={styles.appName}>{CAMP_DETAILS.appName}</Text>

          <View style={styles.taglineRow}>
            <View style={styles.taglineDot} />
            <Text style={styles.tagline}>{CAMP_DETAILS.tagline}</Text>
          </View>
        </View>

        <Text style={styles.welcomeTitle}>Welcome to {CAMP_DETAILS.appName}</Text>
        <Text style={styles.welcomeSubtitle}>
          {CAMP_DETAILS.subDescription}
        </Text>

        <View style={styles.rolesContainer}>
          <TouchableOpacity
            style={[styles.rolePanel, styles.workerPanel, SHADOWS.lg]}
            onPress={() => setUserRole('worker')}
            activeOpacity={0.85}
            accessibilityLabel="Worker / Staff"
          >
            <View style={styles.rolePanelInner}>
              <View style={styles.roleLabelRow}>
                <View style={[styles.roleIconContainer, { backgroundColor: COLORS.card }]}>
                  <Ionicons name="medical-outline" size={28} color={COLORS.primary} />
                </View>
              </View>
              <Text style={styles.roleTitle}>Worker / Staff</Text>
              <Text style={styles.roleDesc}>
                Record new screenings, view history, and manage camp data.
              </Text>
              <View style={[styles.panelAccent, { backgroundColor: COLORS.primary }]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rolePanel, styles.patientPanel, SHADOWS.lg]}
            onPress={() => setUserRole('patient')}
            activeOpacity={0.85}
            accessibilityLabel="Patient / User"
          >
            <View style={styles.rolePanelInner}>
              <View style={styles.roleLabelRow}>
                <View style={[styles.roleIconContainer, { backgroundColor: COLORS.card }]}>
                  <Ionicons name="person-outline" size={28} color={COLORS.accent} />
                </View>
              </View>
              <Text style={styles.roleTitle}>Patient / User</Text>
              <Text style={styles.roleDesc}>
                View your profile, health records, and upcoming camp information.
              </Text>
              <View style={[styles.panelAccent, { backgroundColor: COLORS.accent }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {CAMP_DETAILS.appName} • {CAMP_DETAILS.campDate}
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 48,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 160,
    height: 64,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primaryDark,
    marginTop: 8,
    fontFamily: FONT_FAMILY.body,
  },
  appName: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.primary,
    marginTop: 4,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.3,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  taglineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  tagline: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    fontFamily: FONT_FAMILY.body,
    paddingHorizontal: SPACING.md,
  },
  rolesContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  rolePanel: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  workerPanel: {
    borderTopWidth: 4,
    borderTopColor: COLORS.primary,
  },
  patientPanel: {
    borderTopWidth: 4,
    borderTopColor: COLORS.accent,
  },
  rolePanelInner: {
    position: 'relative',
  },
  roleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textDark,
    marginBottom: 4,
    fontFamily: FONT_FAMILY.body,
  },
  roleDesc: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: FONT_FAMILY.body,
  },
  panelAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: '100%',
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
  },
});
