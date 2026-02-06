import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useProfileStore } from '@/store/profile.store';
import { useSessionsStore } from '@/store/sessions.store';
import { useProgressionStore } from '@/store/progression.store';
import { GOAL_METADATA } from '@/types/constants';
import { formatDistance, formatDuration } from '@/engine/pace-calculator';

// ============================================
// TYPES
// ============================================

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

// ============================================
// COMPONENT
// ============================================

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { profile } = useProfileStore();
  const { sessions, loadSessions, getWeeklyStats } = useSessionsStore();
  const { progression, loadProgression } = useProgressionStore();

  useEffect(() => {
    loadSessions();
    loadProgression();
  }, []);

  const weeklyStats = getWeeklyStats();
  const goalMeta = profile ? GOAL_METADATA[profile.goalType] : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Ready to run?</Text>
          {goalMeta && (
            <View style={styles.goalBadge}>
              <Text style={styles.goalIcon}>{goalMeta.icon}</Text>
              <Text style={styles.goalText}>{goalMeta.label}</Text>
            </View>
          )}
        </View>

        {/* Start Run Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('PreRun')}
        >
          <Text style={styles.startButtonIcon}>▶</Text>
          <Text style={styles.startButtonText}>Start Run</Text>
        </TouchableOpacity>

        {/* Weekly Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDistance(weeklyStats.distance)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.runs}</Text>
              <Text style={styles.statLabel}>Runs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDuration(weeklyStats.time)}
              </Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
        </View>

        {/* Progression */}
        {progression && (
          <View style={styles.progressionCard}>
            <Text style={styles.progressionTitle}>Your Progress</Text>
            <View style={styles.progressionRow}>
              <View style={styles.progressionItem}>
                <Text style={styles.progressionValue}>
                  {progression.currentDifficulty}/10
                </Text>
                <Text style={styles.progressionLabel}>Difficulty</Text>
              </View>
              <View style={styles.progressionItem}>
                <Text style={styles.progressionValue}>
                  🔥 {progression.streakDays}
                </Text>
                <Text style={styles.progressionLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Runs */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Runs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No runs yet. Start your first run!
              </Text>
            </View>
          ) : (
            sessions.slice(0, 3).map((session) => (
              <View key={session.id} style={styles.runCard}>
                <View style={styles.runCardLeft}>
                  <Text style={styles.runDate}>{session.date}</Text>
                  <Text style={styles.runIntent}>{session.intentType}</Text>
                </View>
                <View style={styles.runCardRight}>
                  <Text style={styles.runDistance}>
                    {formatDistance(session.distance)}
                  </Text>
                  <Text style={styles.runDuration}>
                    {formatDuration(session.duration)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  goalIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  goalText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  startButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3a3a5e',
  },
  progressionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressionTitle: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 16,
  },
  progressionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressionItem: {
    alignItems: 'center',
  },
  progressionValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressionLabel: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    color: '#4a90d9',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  runCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  runCardLeft: {},
  runDate: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  runIntent: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 4,
  },
  runCardRight: {
    alignItems: 'flex-end',
  },
  runDistance: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  runDuration: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#2a2a4e',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  navLabelActive: {
    color: '#4a90d9',
  },
});
