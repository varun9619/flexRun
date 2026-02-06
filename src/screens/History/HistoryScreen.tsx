import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useSessionsStore } from '@/store/sessions.store';
import { RunSession } from '@/types';
import { formatPace, formatDistance, formatDuration } from '@/engine/pace-calculator';

// ============================================
// TYPES
// ============================================

type HistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

// ============================================
// COMPONENT
// ============================================

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { sessions, loadSessions, getMonthlyStats } = useSessionsStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const monthlyStats = getMonthlyStats();

  const renderSession = ({ item }: { item: RunSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => navigation.navigate('PostRun', { sessionId: item.id })}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{item.date}</Text>
        <View
          style={[
            styles.intentBadge,
            !item.affectsProgression && styles.intentBadgeInactive,
          ]}
        >
          <Text style={styles.intentText}>{item.intentType}</Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.sessionStat}>
          <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.sessionStat}>
          <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.sessionStat}>
          <Text style={styles.statValue}>{formatPace(item.avgPace)}</Text>
          <Text style={styles.statLabel}>Pace</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Monthly Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Last 30 Days</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>
              {formatDistance(monthlyStats.distance)}
            </Text>
            <Text style={styles.summaryLabel}>Total Distance</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{monthlyStats.runs}</Text>
            <Text style={styles.summaryLabel}>Runs</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>
              {monthlyStats.avgPace > 0 ? formatPace(monthlyStats.avgPace) : '--'}
            </Text>
            <Text style={styles.summaryLabel}>Avg Pace</Text>
          </View>
        </View>
      </View>

      {/* Session List */}
      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏃</Text>
          <Text style={styles.emptyTitle}>No runs yet</Text>
          <Text style={styles.emptyText}>
            Complete your first run to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  summaryCard: {
    backgroundColor: '#2a2a4e',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  sessionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  intentBadge: {
    backgroundColor: '#3a4a6e',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  intentBadgeInactive: {
    backgroundColor: '#3a3a4e',
  },
  intentText: {
    color: '#c0c0c0',
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionStat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
  },
});
