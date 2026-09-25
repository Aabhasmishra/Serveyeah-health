import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudentScreeningEntry } from '../types/student';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface RecentEntryCardProps {
  entry: StudentScreeningEntry;
  onPress: () => void;
  onPrintPress: () => void;
}

export const RecentEntryCard: React.FC<RecentEntryCardProps> = ({
  entry,
  onPress,
  onPrintPress,
}) => {
  const formattedDate = entry.createdAt
    ? new Date(entry.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.photoBox}>
          {entry.photoUri ? (
            <Image
              source={{ uri: entry.photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={26} color={COLORS.primaryLight} />
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.studentName} numberOfLines={1}>
            {entry.name || 'Unnamed Student'}
          </Text>
          <Text style={styles.studentMeta} numberOfLines={1}>
            Class {entry.classRoom || '-'} • Roll {entry.rollNo || '-'}
            {entry.age ? ` • ${entry.age} yrs` : ''}
          </Text>
          {entry.village ? (
            <Text style={styles.villageText} numberOfLines={1}>
              <Ionicons name="location-outline" size={12} color={COLORS.textMuted} /> {entry.village}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.printActionBtn}
          onPress={onPrintPress}
          activeOpacity={0.7}
          accessibilityLabel="Print health form"
        >
          <Ionicons name="print-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, styles.ecgBadge]}>
            <Ionicons name="pulse" size={11} color={COLORS.primary} />
            <Text style={styles.badgeText} numberOfLines={1}>
              ECG: {entry.ecg || 'Recorded'}
            </Text>
          </View>
          <View style={[styles.statusBadge, styles.echoBadge]}>
            <Ionicons name="heart" size={11} color={COLORS.secondary} />
            <Text style={[styles.badgeText, { color: COLORS.secondary }]} numberOfLines={1}>
              Echo: {entry.echoHeart ? 'Evaluated' : 'Pending'}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoBox: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    flex: 1,
  },
  studentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 2,
  },
  studentMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILY.body,
  },
  villageText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY.body,
  },
  printActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
    maxWidth: 130,
  },
  ecgBadge: {
    backgroundColor: COLORS.primaryPale,
  },
  echoBadge: {
    backgroundColor: COLORS.secondaryLight,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.body,
  },
  dateText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
  },
});
