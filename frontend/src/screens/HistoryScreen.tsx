import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/AppHeader';
import { RecentEntryCard } from '../components/RecentEntryCard';
import { printScreeningForm } from '../services/printService';
import { StudentScreeningEntry } from '../types/student';
import { Screening } from '../types/api';
import { mapScreeningToEntry } from '../services/api';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

// Type guard to check if item is Screening (from API)
const isApiScreening = (item: StudentScreeningEntry | Screening | null | undefined): item is Screening => {
  return item !== null && item !== undefined && 'screening_date' in item;
};

export const HistoryScreen: React.FC = () => {
  const {
    userRole,
    entries,
    apiScreenings,
    apiScreeningsLoading,
    apiError,
    selectEntryForPreview,
    loadWorkerScreenings,
  } = useScreening();
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrint = async (entry: StudentScreeningEntry) => {
    try {
      await printScreeningForm(entry);
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  // Use API data for worker, local entries for patient
  const isWorker = userRole === 'worker';
  const screenings = isWorker ? apiScreenings : entries;

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

  const filteredScreenings = sortedScreenings.filter(
    (screening) => {
      // Use mapped entry properties for search
      const entry = isApiScreening(screening) ? mapScreeningToEntry(screening) : screening;
      return (
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.rollNo.includes(searchQuery) ||
        entry.classRoom.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

  // Show loading for worker
  if (isWorker && apiScreeningsLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Screening History" />
        <View style={styles.stateBlock}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading history…</Text>
        </View>
      </View>
    );
  }

  if (isWorker && apiError && sortedScreenings.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Screening History" />
        <View style={styles.stateBlock}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
          <Text style={styles.stateText}>{apiError}</Text>
          <TouchableOpacity
            onPress={() => loadWorkerScreenings()}
            style={styles.retryBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Screening History"
        subtitle={`${filteredScreenings.length} ${filteredScreenings.length === 1 ? 'record' : 'records'}`}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, class, or roll no."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {filteredScreenings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Records' : 'No Entries Recorded Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms.'
                : 'Screenings will appear here once recorded.'}
            </Text>
          </View>
        ) : (
          filteredScreenings.map((screening) => {
            const entry = isApiScreening(screening) ? mapScreeningToEntry(screening) : screening;
            return (
              <RecentEntryCard
                key={screening.id}
                entry={entry}
                onPress={() => selectEntryForPreview(screening.id)}
                onPrintPress={() => handlePrint(entry)}
              />
            );
          })
        )}

        {filteredScreenings.length > 0 && (
          <View style={styles.footerNote}>
            <Text style={styles.footerText}>
              ServeYeah Health • Health Camp & Screening
            </Text>
          </View>
        )}
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
    padding: SPACING.md,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: FONT_FAMILY.body,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONT_FAMILY.body,
  },
  footerNote: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
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
