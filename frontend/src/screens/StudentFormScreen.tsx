import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useScreening } from '../context/ScreeningContext';
import { StudentScreeningEntry, StudentFormErrors } from '../types/student';
import { AppHeader } from '../components/AppHeader';
import { FormSection } from '../components/FormSection';
import { FormInput } from '../components/FormInput';
import { PhotoPicker } from '../components/PhotoPicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SPACING } from '../constants/theme';

const ECG_OPTIONS = [
  'Normal',
  'Within Normal Limits',
  'Sinus Tachycardia',
  'Incomplete RBBB',
  'Abnormal / Refer',
];

const ECHO_OPTIONS = [
  'Normal',
  'Structurally Normal Heart',
  'Mild MR / TR',
  'VSD - Follow-up Required',
  'Referral to Cardiologist',
];

export const StudentFormScreen: React.FC = () => {
  const {
    currentEntry,
    saveEntry,
    navigateTo,
    userRole,
    createScreeningFromForm,
    apiError,
    apiScreeningsLoading,
  } = useScreening();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StudentScreeningEntry>(() => {
    return (
      currentEntry || {
        id: 'entry-' + Date.now(),
        createdAt: new Date().toISOString(),
        name: '',
        village: '',
        age: '',
        weight: '',
        height: '',
        classRoom: '',
        rollNo: '',
        careOf: '',
        photoUri: undefined,
        photoBase64: undefined,
        ecg: 'Normal',
        echoHeart: 'Normal',
        advice: 'Annual pediatric health check-up advised.',
      }
    );
  });

  const [errors, setErrors] = useState<StudentFormErrors>({});

  const updateField = (field: keyof StudentScreeningEntry, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof StudentFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: StudentFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Student Name is required';
    }
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(formData.age.trim())) || Number(formData.age.trim()) <= 0) {
      newErrors.age = 'Please enter a valid age';
    }
    if (!formData.classRoom.trim()) {
      newErrors.classRoom = 'Class is required (e.g. 5th B)';
    }
    if (!formData.rollNo.trim()) {
      newErrors.rollNo = 'Roll No. is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        'Required Fields Incomplete',
        'Please fill in the required student fields (Name, Age, Class, Roll No.) before generating the form.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleGenerateForm = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    
    try {
      if (userRole === 'worker') {
        // Use API to create screening for workers
        const result = await createScreeningFromForm(formData);
        if (result) {
          // createScreeningFromForm already handles navigation to preview
        }
      } else {
        // Patient role uses local save
        saveEntry(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Student Entry"
        subtitle="Health Screening Form"
        showBack
        onBack={() => navigateTo('dashboard')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator / Form Header */}
        <View style={styles.formIntro}>
          <Text style={styles.formTitle}>Health Screening Form</Text>
          <Text style={styles.formSubtitle}>
            Enter screening details, attach patient photograph, and record clinical findings.
          </Text>
        </View>

        {/* Section 1: Student Information */}
        <FormSection
          title="Student Information"
          subtitle="Demographic details"
          icon="person-outline"
          badge="Step 1"
        >
          <FormInput
            label="Student Name"
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="e.g. Aarav Sachin Patil"
            required
            error={errors.name}
            autoCapitalize="words"
          />

          <View style={styles.inputRow}>
            <FormInput
              label="Age"
              value={formData.age}
              onChangeText={(v) => updateField('age', v)}
              placeholder="e.g. 11"
              required
              error={errors.age}
              keyboardType="numeric"
              style={styles.halfInput}
            />
            <FormInput
              label="Village"
              value={formData.village}
              onChangeText={(v) => updateField('village', v)}
              placeholder="e.g. Nanose"
              autoCapitalize="words"
              style={styles.halfInput}
            />
          </View>

          <View style={styles.inputRow}>
            <FormInput
              label="Class"
              value={formData.classRoom}
              onChangeText={(v) => updateField('classRoom', v)}
              placeholder="e.g. 6th A"
              required
              error={errors.classRoom}
              style={styles.halfInput}
            />
            <FormInput
              label="Roll No."
              value={formData.rollNo}
              onChangeText={(v) => updateField('rollNo', v)}
              placeholder="e.g. 15"
              required
              error={errors.rollNo}
              style={styles.halfInput}
            />
          </View>

          <View style={styles.inputRow}>
            <FormInput
              label="Weight"
              value={formData.weight}
              onChangeText={(v) => updateField('weight', v)}
              placeholder="e.g. 35 kg"
              style={styles.halfInput}
            />
            <FormInput
              label="Height"
              value={formData.height}
              onChangeText={(v) => updateField('height', v)}
              placeholder="e.g. 138 cm"
              style={styles.halfInput}
            />
          </View>

          <FormInput
            label="C/o. (Care of / Guardian)"
            value={formData.careOf}
            onChangeText={(v) => updateField('careOf', v)}
            placeholder="e.g. Sachin Patil (Father)"
            helperText="Parent or guardian name"
            autoCapitalize="words"
          />
        </FormSection>

        {/* Section 2: Student Photograph */}
        <FormSection
          title="Patient Photograph"
          subtitle="Camera capture or device gallery"
          icon="camera-outline"
          badge="Step 2"
        >
          <PhotoPicker
            photoUri={formData.photoUri}
            onPhotoSelected={(uri, base64) => {
              setFormData((prev) => ({
                ...prev,
                photoUri: uri,
                photoBase64: base64,
              }));
            }}
            onPhotoRemoved={() => {
              setFormData((prev) => ({
                ...prev,
                photoUri: undefined,
                photoBase64: undefined,
              }));
            }}
          />
        </FormSection>

        {/* Section 3: Health Evaluation */}
        <FormSection
          title="Health Evaluation"
          subtitle="Clinical findings & advice"
          icon="heart-outline"
          badge="Step 3"
        >
          {/* ECG Field with Quick Selectors */}
          <Text style={styles.fieldSectionLabel}>ECG</Text>
          <View style={styles.chipRow}>
            {ECG_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  formData.ecg === opt && styles.chipActive,
                ]}
                onPress={() => updateField('ecg', opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.ecg === opt && styles.chipTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormInput
            label="ECG Findings / Notes"
            value={formData.ecg}
            onChangeText={(v) => updateField('ecg', v)}
            placeholder="Enter or select ECG findings"
          />

          {/* 2D Echo Heart Field with Quick Selectors */}
          <Text style={styles.fieldSectionLabel}>2D Echo Heart</Text>
          <View style={styles.chipRow}>
            {ECHO_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  formData.echoHeart === opt && styles.chipActive,
                ]}
                onPress={() => updateField('echoHeart', opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.echoHeart === opt && styles.chipTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormInput
            label="2D Echo Findings / Notes"
            value={formData.echoHeart}
            onChangeText={(v) => updateField('echoHeart', v)}
            placeholder="Enter or select 2D Echo findings"
          />

          {/* Advice Field */}
          <FormInput
            label="Advice / Recommendations"
            value={formData.advice}
            onChangeText={(v) => updateField('advice', v)}
            placeholder="Doctor's clinical advice, diet, medication, follow-up..."
            multiline
            numberOfLines={3}
            helperText="Printed directly onto the final medical form"
          />
        </FormSection>

        {/* Generate Health Form CTA */}
        <View style={styles.bottomCtaContainer}>
          <PrimaryButton
            title={isSubmitting ? 'Generating...' : 'Generate Health Form'}
            onPress={handleGenerateForm}
            icon="document-text-outline"
            style={styles.generateButton}
            disabled={isSubmitting}
          />
          {apiError && (
            <Text style={styles.apiErrorText}>{apiError}</Text>
          )}
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => navigateTo('dashboard')}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelLinkText}>Discard & Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  formIntro: {
    marginBottom: SPACING.md,
  },
  formTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    letterSpacing: -0.4,
    fontFamily: FONT_FAMILY.body,
  },
  formSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 4,
    fontFamily: FONT_FAMILY.body,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  fieldSectionLabel: {
    fontSize: 13.5,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: FONT_FAMILY.body,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryPale,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body,
  },
  chipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHTS.bold,
  },
  bottomCtaContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  generateButton: {
    height: 54,
  },
  cancelLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  cancelLinkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  apiErrorText: {
    marginTop: 8,
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
});
