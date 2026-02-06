import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useProfileStore } from '@/store/profile.store';
import { useSessionsStore } from '@/store/sessions.store';
import { useProgressionStore } from '@/store/progression.store';
import { AIFeedback } from '@/types';
import { generateFeedback, calculateDifficultyAdjustment } from '@/services/ai.service';
import { formatPace, formatDistance, formatDuration } from '@/engine/pace-calculator';

// ============================================
// TYPES
// ============================================

type PostRunScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PostRun'>;
  route: RouteProp<RootStackParamList, 'PostRun'>;
};

// ============================================
// COMPONENT
// ============================================

export function PostRunScreen({ navigation, route }: PostRunScreenProps) {
  const { sessionId } = route.params;
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { profile } = useProfileStore();
  const { getSession, getPlan, saveFeedback, getFeedback } = useSessionsStore();
  const { updateAfterRun } = useProgressionStore();

  const session = getSession(sessionId);
  const plan = session?.intervalPlanId ? getPlan(session.intervalPlanId) : null;

  useEffect(() => {
    loadOrGenerateFeedback();
  }, []);

  const loadOrGenerateFeedback = async () => {
    // Check if feedback already exists
    const existingFeedback = getFeedback(sessionId);
    if (existingFeedback) {
      setFeedback(existingFeedback);
      setIsLoading(false);
      return;
    }

    // Generate new feedback
    if (session && profile && session.affectsProgression) {
      try {
        const generated = await generateFeedback(profile, session, plan);
        setFeedback(generated);
        saveFeedback(generated);

        // Update progression with difficulty adjustment
        const recentFeedbacks: AIFeedback[] = []; // TODO: Get recent feedbacks
        const adjustment = calculateDifficultyAdjustment(
          generated,
          recentFeedbacks
        );
        updateAfterRun(
          true,
          session.distance / 1000,
          adjustment
        );
      } catch (error) {
        console.error('Failed to generate feedback:', error);
      }
    }
    setIsLoading(false);
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Completion Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Run Complete!</Text>
        </View>

        {/* Main Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDistance(session.distance)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDuration(session.duration)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatPace(session.avgPace)}
              </Text>
              <Text style={styles.statLabel}>Avg Pace</Text>
            </View>
          </View>
        </View>

        {/* Splits */}
        {session.splits.length > 0 && (
          <View style={styles.splitsCard}>
            <Text style={styles.splitsTitle}>Splits</Text>
            {session.splits.map((split) => (
              <View key={split.kmIndex} style={styles.splitRow}>
                <Text style={styles.splitKm}>KM {split.kmIndex}</Text>
                <Text style={styles.splitPace}>{formatPace(split.paceMinPerKm)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Feedback */}
        {session.affectsProgression && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Coach's Feedback</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#4a90d9" />
                <Text style={styles.loadingText}>Analyzing your run...</Text>
              </View>
            ) : feedback ? (
              <>
                <Text style={styles.feedbackSummary}>{feedback.summary}</Text>
                
                <View style={styles.feedbackHighlight}>
                  <Text style={styles.highlightIcon}>✅</Text>
                  <Text style={styles.highlightText}>
                    {feedback.positiveHighlight}
                  </Text>
                </View>

                <View style={styles.feedbackHighlight}>
                  <Text style={styles.highlightIcon}>💡</Text>
                  <Text style={styles.highlightText}>
                    {feedback.improvementTip}
                  </Text>
                </View>

                <View style={styles.nextSession}>
                  <Text style={styles.nextSessionLabel}>Next session:</Text>
                  <Text style={styles.nextSessionText}>
                    {feedback.nextSessionHint}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.feedbackError}>
                Could not generate feedback
              </Text>
            )}
          </View>
        )}

        {/* Intent Badge */}
        <View style={styles.intentBadge}>
          <Text style={styles.intentText}>
            {session.intentType} •{' '}
            {session.affectsProgression
              ? 'Counts toward progress'
              : 'Not counted in progress'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 16,
  },
  homeButton: {
    backgroundColor: '#4a90d9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 24,
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
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  splitsCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  splitsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a5e',
  },
  splitKm: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  splitPace: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  feedbackTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 8,
  },
  feedbackSummary: {
    color: '#c0c0c0',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  feedbackHighlight: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  highlightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  highlightText: {
    flex: 1,
    color: '#c0c0c0',
    fontSize: 14,
    lineHeight: 20,
  },
  nextSession: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
  },
  nextSessionLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 4,
  },
  nextSessionText: {
    color: '#4a90d9',
    fontSize: 14,
  },
  feedbackError: {
    color: '#a0a0a0',
    textAlign: 'center',
  },
  intentBadge: {
    alignItems: 'center',
  },
  intentText: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  doneButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
