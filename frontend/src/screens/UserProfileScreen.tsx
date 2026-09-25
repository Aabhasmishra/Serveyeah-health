import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';
import { usersApi, computeAgeFromDob, toDateInput } from '../services/api';
import { User } from '../types/api';

export const UserProfileScreen: React.FC = () => {
  const { apiPatient, apiPatientLoading, apiError, navigateTo, loadPatientProfile } = useScreening();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync local form state whenever apiPatient changes
  useEffect(() => {
    if (apiPatient) {
      setName(apiPatient.full_name ?? '');
      setDateOfBirth(toDateInput(apiPatient.date_of_birth));
      setGender(apiPatient.gender ?? '');
      setPhone(apiPatient.phone ?? '');
      setEmail(apiPatient.email ?? '');
      setAddress(apiPatient.address ?? '');
      setBloodGroup(apiPatient.blood_group ?? '');
      setAllergies(apiPatient.allergies ?? '');
      setChronicConditions(apiPatient.chronic_conditions ?? '');
      setMedications(apiPatient.medications ?? '');
    }
  }, [apiPatient]);

  const handleSave = async () => {
    if (saving || !apiPatient) return;
    setSaving(true);
    try {
      const updates: Partial<User> = {
        full_name: name.trim(),
        date_of_birth: dateOfBirth.trim() ? dateOfBirth.trim() : null,
        gender: gender.trim() ? gender.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
        email: email.trim() ? email.trim() : null,
        address: address.trim() ? address.trim() : null,
        blood_group: bloodGroup.trim() ? bloodGroup.trim() : null,
        allergies: allergies.trim() ? allergies.trim() : null,
        chronic_conditions: chronicConditions.trim() ? chronicConditions.trim() : null,
        medications: medications.trim() ? medications.trim() : null,
      };

      const response = await usersApi.update(apiPatient.id, updates);
      if (response.success && response.data) {
        await loadPatientProfile(apiPatient.id);
        Alert.alert('Profile Updated', 'Your profile has been saved successfully.');
      } else {
        Alert.alert('Update Failed', response.error?.message || 'Could not update profile. Please try again.');
      }
    } catch (err) {
      Alert.alert('Update Failed', err instanceof Error ? err.message : 'Unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (apiPatient) {
      setName(apiPatient.full_name ?? '');
      setDateOfBirth(toDateInput(apiPatient.date_of_birth));
      setGender(apiPatient.gender ?? '');
      setPhone(apiPatient.phone ?? '');
      setEmail(apiPatient.email ?? '');
      setAddress(apiPatient.address ?? '');
      setBloodGroup(apiPatient.blood_group ?? '');
      setAllergies(apiPatient.allergies ?? '');
      setChronicConditions(apiPatient.chronic_conditions ?? '');
      setMedications(apiPatient.medications ?? '');
    }
    navigateTo('patientHome');
  };

  const InfoRow = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline,
    editable = true,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    multiline?: boolean;
    editable?: boolean;
  }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <TextInput
        style={[styles.infoRowInput, multiline && styles.infoRowTextArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  if (!apiPatient && apiPatientLoading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="My Profile"
          subtitle="Medical Information"
          showBack={true}
          onBack={() => navigateTo('patientHome')}
        />
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
        <AppHeader
          title="My Profile"
          subtitle="Medical Information"
          showBack={true}
          onBack={() => navigateTo('patientHome')}
        />
        <View style={styles.stateBlock}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.stateText}>{apiError ?? 'Unable to load your profile.'}</Text>
        </View>
      </View>
    );
  }

  const age = computeAgeFromDob(apiPatient.date_of_birth);

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Profile"
        subtitle="Medical Information"
        showBack={true}
        onBack={() => navigateTo('patientHome')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerSection, SHADOWS.xs]}>
          <View style={styles.avatarPlaceholder}>
            {apiPatient.photo_url ? (
              <Image source={{ uri: apiPatient.photo_url }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={42} color={COLORS.primaryLight} />
            )}
            <TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={16} color={COLORS.card} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileHeader}>
            <Text style={styles.profileName}>{apiPatient.full_name || 'Unknown Patient'}</Text>
            <Text style={styles.profileMeta}>
              {age ? `${age} years` : ''}
              {age && apiPatient.gender ? ' • ' : ''}
              {apiPatient.gender ?? ''}
            </Text>
          </View>

          <View style={styles.patientIdRow}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.patientIdText}>Patient ID: {apiPatient.id}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Personal Information</Text>
          <View style={styles.formCard}>
            <InfoRow
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
            />
            <InfoRow
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
            />
            <InfoRow
              label="Gender"
              value={gender}
              onChangeText={setGender}
              placeholder="Gender"
            />
            <InfoRow
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              multiline
            />
          </View>

          <Text style={styles.formSectionTitle}>Contact Information</Text>
          <View style={styles.formCard}>
            <InfoRow
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            <InfoRow
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.formSectionTitle}>Health Information</Text>
          <View style={[styles.formCard, styles.formCardLast]}>
            <InfoRow
              label="Blood Group"
              value={bloodGroup}
              onChangeText={setBloodGroup}
              placeholder="e.g. O+"
            />
            <InfoRow
              label="Allergies"
              value={allergies}
              onChangeText={setAllergies}
              placeholder="List known allergies"
              multiline
            />
            <InfoRow
              label="Chronic Conditions"
              value={chronicConditions}
              onChangeText={setChronicConditions}
              placeholder="List chronic conditions"
              multiline
            />
            <InfoRow
              label="Medications"
              value={medications}
              onChangeText={setMedications}
              placeholder="List current medications"
              multiline
            />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton
            title="Cancel"
            onPress={handleCancel}
            variant="ghost"
            style={styles.cancelBtn}
          />
          <PrimaryButton
            title={saving ? 'Saving…' : 'Save Profile'}
            onPress={handleSave}
            icon="save-outline"
          />
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
  scrollContent: { paddingBottom: 32 },
  stateBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: 12,
  },
  stateText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body, textAlign: 'center',
  },
  headerSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    position: 'relative',
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 2, borderColor: COLORS.primaryPale,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 48 },
  changePhotoBtn: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  profileHeader: { alignItems: 'center' },
  profileName: {
    fontSize: 18, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textDark,
    fontFamily: FONT_FAMILY.body, marginBottom: 2,
  },
  profileMeta: {
    fontSize: 13, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body,
  },
  patientIdRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  patientIdText: {
    fontSize: 12, color: COLORS.textSecondary, fontFamily: FONT_FAMILY.body,
  },
  formSection: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  formSectionTitle: {
    fontSize: 12, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    fontFamily: FONT_FAMILY.body, marginLeft: 4,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  formCardLast: { paddingBottom: 8 },
  infoRow: { marginBottom: 16 },
  infoRowLabel: {
    fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
    fontFamily: FONT_FAMILY.body,
  },
  infoRowInput: {
    fontSize: 15, color: COLORS.textDark,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: FONT_FAMILY.body,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoRowTextArea: { minHeight: 72, textAlignVertical: 'top' },
  actionsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cancelBtn: { flex: 1 },
  footer: { alignItems: 'center' },
  footerText: {
    fontSize: 11, color: COLORS.textMuted, fontFamily: FONT_FAMILY.body,
  },
});