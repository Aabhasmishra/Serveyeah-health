import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { CAMP_DETAILS } from '../constants/campDetails';
import { printScreeningForm, exportScreeningPdf } from '../services/printService';

export const HealthFormPreviewScreen: React.FC = () => {
  const { currentEntry, editCurrentEntry, navigateTo } = useScreening();
  const [printing, setPrinting] = useState(false);

  if (!currentEntry) {
    return (
      <View style={styles.container}>
        <AppHeader title="Form Preview" showBack onBack={() => navigateTo('dashboard')} />
        <View style={styles.noEntryContainer}>
          <Text style={styles.noEntryText}>No entry selected for preview.</Text>
          <PrimaryButton
            title="Return to Dashboard"
            onPress={() => navigateTo('dashboard')}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await printScreeningForm(currentEntry);
    } catch (error) {
      console.error('Printing error:', error);
      Alert.alert('Print Error', 'Could not open print dialog on this device.');
    } finally {
      setPrinting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setPrinting(true);
      await exportScreeningPdf(currentEntry);
    } catch (error) {
      console.error('PDF Share error:', error);
      Alert.alert('Export Error', 'Could not export or share PDF.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Form Preview"
        subtitle="Physical Paper Replica"
        showBack
        onBack={() => navigateTo('dashboard')}
      />

      {/* Action Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={editCurrentEntry}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={17} color={COLORS.textSecondary} />
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolbarRight}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSharePdf}
            disabled={printing}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <PrimaryButton
            title={printing ? 'Printing...' : 'Print Form'}
            onPress={handlePrint}
            icon="print-outline"
            loading={printing}
            style={styles.printBtn}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Printable Paper Document Container */}
        <View style={[styles.paperSheet, SHADOWS.lg]}>
          {/* Header Organization */}
          <View style={styles.headerSection}>
            <Text style={styles.orgTitle1}>{CAMP_DETAILS.institution1}</Text>
            <Text style={styles.orgConjunction}>{CAMP_DETAILS.conjunction}</Text>
            <Text style={styles.orgTitle2}>{CAMP_DETAILS.institution2}</Text>
          </View>

          {/* Divider Line */}
          <View style={styles.heavyDivider} />

          {/* Camp Title & Date */}
          <Text style={styles.campTitle}>{CAMP_DETAILS.campTitle}</Text>
          <Text style={styles.campDate}>{CAMP_DETAILS.campDate}</Text>

          {/* Divider Line */}
          <View style={styles.heavyDivider} />

          {/* Association */}
          <View style={styles.centerSection}>
            <Text style={styles.subHeading}>{CAMP_DETAILS.associationLabel}</Text>
            <Text style={styles.associationName}>{CAMP_DETAILS.associations[0]}</Text>
            <Text style={styles.associationName}>{CAMP_DETAILS.associations[1]}</Text>
          </View>

          {/* Venue */}
          <View style={[styles.centerSection, { marginTop: 6 }]}>
            <Text style={styles.subHeading}>{CAMP_DETAILS.venueLabel}</Text>
            <Text style={styles.venueTitle}>{CAMP_DETAILS.venueName}</Text>
            <Text style={styles.venueAddress}>{CAMP_DETAILS.venueAddress}</Text>
          </View>

          {/* Student Information Section with Photo Box */}
          <View style={styles.studentInfoContainer}>
            <View style={styles.fieldsCol}>
              {/* Row 1: Name, Village, Age */}
              <View style={styles.fieldRow}>
                <Text style={styles.paperLabel}>Name:</Text>
                <View style={[styles.underlinedValue, { flex: 2.5 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.name}
                  </Text>
                </View>

                <Text style={[styles.paperLabel, { marginLeft: 10 }]}>Village:</Text>
                <View style={[styles.underlinedValue, { flex: 1.4 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.village}
                  </Text>
                </View>

                <Text style={[styles.paperLabel, { marginLeft: 10 }]}>Age:</Text>
                <View style={[styles.underlinedValue, { flex: 0.9 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.age ? `${currentEntry.age} yrs` : ''}
                  </Text>
                </View>
              </View>

              {/* Row 2: Weight, Height */}
              <View style={styles.fieldRow}>
                <Text style={styles.paperLabel}>Weight:</Text>
                <View style={[styles.underlinedValue, { flex: 1.5 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.weight}
                  </Text>
                </View>

                <Text style={[styles.paperLabel, { marginLeft: 16 }]}>Height:</Text>
                <View style={[styles.underlinedValue, { flex: 1.5 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.height}
                  </Text>
                </View>
              </View>

              {/* Row 3: Class, Roll No. */}
              <View style={styles.fieldRow}>
                <Text style={styles.paperLabel}>Class:</Text>
                <View style={[styles.underlinedValue, { flex: 1.5 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.classRoom}
                  </Text>
                </View>

                <Text style={[styles.paperLabel, { marginLeft: 16 }]}>Roll No.:</Text>
                <View style={[styles.underlinedValue, { flex: 1.5 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.rollNo}
                  </Text>
                </View>
              </View>

              {/* Row 4: C/o. */}
              <View style={styles.fieldRow}>
                <Text style={styles.paperLabel}>C/o.</Text>
                <View style={[styles.underlinedValue, { flex: 1 }]}>
                  <Text style={styles.valueText}>
                    {currentEntry.careOf}
                  </Text>
                </View>
              </View>
            </View>

            {/* Photo Box */}
            <View style={styles.photoBoxContainer}>
              {currentEntry.photoUri ? (
                <Image
                  source={{ uri: currentEntry.photoUri }}
                  style={styles.studentPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person-outline" size={24} color="#94A3B8" />
                  <Text style={styles.photoPlaceholderText}>Affix Photo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Health Evaluation Fields matching Reference */}
          <View style={styles.medicalSection}>
            <View style={styles.medicalBlock}>
              <Text style={styles.medicalHeader}>ECG:</Text>
              <View style={styles.medicalUnderlineArea}>
                <Text style={styles.medicalValueText}>
                  {currentEntry.ecg || 'Not performed / Normal'}
                </Text>
              </View>
            </View>

            <View style={styles.medicalBlock}>
              <Text style={styles.medicalHeader}>2D Echo Heart:</Text>
              <View style={styles.medicalUnderlineArea}>
                <Text style={styles.medicalValueText}>
                  {currentEntry.echoHeart || 'Not performed / Normal'}
                </Text>
              </View>
            </View>

            <View style={styles.medicalBlock}>
              <Text style={styles.medicalHeader}>Advice:</Text>
              <View style={[styles.medicalUnderlineArea, { minHeight: 65 }]}>
                <Text style={styles.medicalValueText}>
                  {currentEntry.advice || 'Routine follow-up advised.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Doctor Signature & Stamp Area */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureCol}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Cardiologist / Medical Officer</Text>
            </View>
            <View style={styles.signatureCol}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            </View>
          </View>

          {/* Paper Form Subtle Watermark / Meta */}
          <View style={styles.paperMetaRow}>
            <Text style={styles.paperMetaText}>
              Form Ref: {currentEntry.id}
            </Text>
            <Text style={styles.paperMetaText}>
              ServeYeah Health • {CAMP_DETAILS.website}
            </Text>
          </View>
        </View>

        {/* Action Help */}
        <View style={styles.printHelpBox}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.printHelpText}>
            Tap "Print Form" above to open your system print dialog or save an A4 PDF without app controls.
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  editButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    minHeight: 42,
    borderRadius: BORDER_RADIUS.sm,
  },
  scrollContent: {
    padding: SPACING.sm,
    paddingBottom: 40,
    alignItems: 'center',
  },
  paperSheet: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 6,
  },
  orgTitle1: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.serif,
  },
  orgConjunction: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#000000',
    marginVertical: 2,
    fontFamily: FONT_FAMILY.serif,
  },
  orgTitle2: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.serif,
  },
  heavyDivider: {
    height: 1.8,
    backgroundColor: '#000000',
    marginVertical: 6,
    width: '100%',
  },
  campTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 0.3,
    marginVertical: 3,
  },
  campDate: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 4,
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 3,
  },
  subHeading: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#000000',
    fontFamily: FONT_FAMILY.serif,
  },
  associationName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 1,
    fontFamily: FONT_FAMILY.serif,
  },
  venueTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.serif,
  },
  venueAddress: {
    fontSize: 11.5,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.serif,
  },
  studentInfoContainer: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldsCol: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  paperLabel: {
    fontSize: 12.5,
    color: '#000000',
    fontFamily: FONT_FAMILY.serif,
  },
  underlinedValue: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingHorizontal: 4,
    paddingBottom: 2,
    marginLeft: 4,
    minHeight: 18,
    justifyContent: 'flex-end',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  photoBoxContainer: {
    width: 86,
    height: 104,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  photoPlaceholderText: {
    fontSize: 9.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  medicalSection: {
    marginTop: 20,
  },
  medicalBlock: {
    marginBottom: 18,
  },
  medicalHeader: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 4,
    fontFamily: FONT_FAMILY.serif,
  },
  medicalUnderlineArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    minHeight: 36,
  },
  medicalValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
    paddingHorizontal: 12,
  },
  signatureCol: {
    alignItems: 'center',
    width: 140,
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#000000',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  paperMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
  },
  paperMetaText: {
    fontSize: 8.5,
    color: '#94A3B8',
  },
  printHelpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginTop: 14,
    maxWidth: 680,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  printHelpText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 16,
    fontFamily: FONT_FAMILY.body,
  },
  noEntryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  noEntryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
});
