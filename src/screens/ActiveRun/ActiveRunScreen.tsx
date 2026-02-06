import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useActiveRunStore, selectCurrentSegment } from '@/store/active-run.store';
import { useProfileStore } from '@/store/profile.store';
import { useSessionsStore } from '@/store/sessions.store';
import { useProgressionStore } from '@/store/progression.store';
import { SessionIntent, SessionState } from '@/types';
import { SESSION_STATE_LABELS } from '@/types/constants';
import {
  formatPace,
  formatDistance,
  formatDuration,
  calculateSplits,
  calculateAveragePace,
} from '@/engine/pace-calculator';

// ============================================
// TYPES
// ============================================

type ActiveRunScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ActiveRun'>;
};

// ============================================
// COMPONENT
// ============================================

export function ActiveRunScreen({ navigation }: ActiveRunScreenProps) {
  const {
    activeRun,
    isRunning,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
  } = useActiveRunStore();

  const { profile } = useProfileStore();
  const { createSession } = useSessionsStore();
  const { updateAfterRun } = useProgressionStore();

  // Start run on mount
  useEffect(() => {
    if (!activeRun) {
      // Get intent and plan from navigation params or use defaults
      const intent = SessionIntent.TRAINING; // TODO: Get from PreRun
      const plan = null; // TODO: Get from PreRun
      startRun(intent, plan);
    }

    // Cleanup on unmount
    return () => {
      // Stop run if still active (user navigated away)
    };
  }, []);

  const handlePauseResume = () => {
    if (isRunning) {
      pauseRun();
    } else {
      resumeRun();
    }
  };

  const handleStop = () => {
    const finishedRun = stopRun();

    if (finishedRun && profile) {
      // Calculate final metrics
      const splits = calculateSplits(finishedRun.gpsPoints);
      const avgPace = calculateAveragePace(
        finishedRun.totalDistanceMeters,
        finishedRun.totalElapsedSeconds
      );

      // Save session
      const session = createSession({
        duration: finishedRun.totalElapsedSeconds,
        distance: finishedRun.totalDistanceMeters,
        avgPace,
        intentType: finishedRun.sessionIntent,
        goalType: profile.goalType,
        intervalPlanId: finishedRun.intervalPlan?.id ?? null,
        splits,
      });

      // Update progression (with dummy difficulty adjustment for now)
      const affectsProgression =
        finishedRun.sessionIntent === SessionIntent.TRAINING ||
        finishedRun.sessionIntent === SessionIntent.EASY;
      updateAfterRun(
        affectsProgression,
        finishedRun.totalDistanceMeters / 1000,
        0 // Difficulty adjustment will come from AI feedback
      );

      // Navigate to post-run
      navigation.replace('PostRun', { sessionId: session.id });
    } else {
      navigation.replace('Home');
    }
  };

  if (!activeRun) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Starting run...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSegment = useActiveRunStore(selectCurrentSegment);
  const stateLabel = SESSION_STATE_LABELS[activeRun.currentState];

  return (
    <SafeAreaView style={styles.container}>
      {/* State Banner */}
      <View
        style={[
          styles.stateBanner,
          activeRun.currentState === SessionState.RUN_INTERVAL &&
            styles.stateBannerRun,
          activeRun.currentState === SessionState.WALK_INTERVAL &&
            styles.stateBannerWalk,
        ]}
      >
        <Text style={styles.stateText}>{stateLabel}</Text>
        {currentSegment && (
          <Text style={styles.segmentInstruction}>
            {currentSegment.instruction}
          </Text>
        )}
      </View>

      {/* Main Metrics */}
      <View style={styles.metricsContainer}>
        {/* Duration */}
        <View style={styles.metricPrimary}>
          <Text style={styles.metricPrimaryValue}>
            {formatDuration(activeRun.totalElapsedSeconds)}
          </Text>
          <Text style={styles.metricPrimaryLabel}>Duration</Text>
        </View>

        {/* Distance & Pace Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricSecondary}>
            <Text style={styles.metricSecondaryValue}>
              {formatDistance(activeRun.totalDistanceMeters)}
            </Text>
            <Text style={styles.metricSecondaryLabel}>Distance</Text>
          </View>

          <View style={styles.metricSecondary}>
            <Text style={styles.metricSecondaryValue}>
              {activeRun.currentPace > 0
                ? formatPace(activeRun.currentPace)
                : '--:--'}
            </Text>
            <Text style={styles.metricSecondaryLabel}>Pace</Text>
          </View>
        </View>

        {/* Target Pace (if in training) */}
        {currentSegment && (
          <View style={styles.targetPace}>
            <Text style={styles.targetPaceLabel}>Target:</Text>
            <Text style={styles.targetPaceValue}>
              {formatPace(currentSegment.targetPaceMin)} -{' '}
              {formatPace(currentSegment.targetPaceMax)}
            </Text>
          </View>
        )}

        {/* Segment Progress */}
        {activeRun.intervalPlan && (
          <View style={styles.segmentProgress}>
            <Text style={styles.segmentProgressText}>
              Interval {activeRun.currentSegmentIndex + 1} of{' '}
              {activeRun.intervalPlan.segments.length}
            </Text>
            <View style={styles.segmentProgressBar}>
              <View
                style={[
                  styles.segmentProgressFill,
                  {
                    width: `${
                      ((activeRun.currentSegmentIndex + 1) /
                        activeRun.intervalPlan.segments.length) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Pause Indicator */}
      {activeRun.isPaused && (
        <View style={styles.pausedOverlay}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={handlePauseResume}
        >
          <Text style={styles.pauseButtonText}>
            {isRunning ? '⏸️' : '▶️'}
          </Text>
          <Text style={styles.pauseButtonLabel}>
            {isRunning ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
        >
          <Text style={styles.stopButtonText}>⏹️</Text>
          <Text style={styles.stopButtonLabel}>Stop</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  stateBanner: {
    backgroundColor: '#2a2a4e',
    padding: 20,
    alignItems: 'center',
  },
  stateBannerRun: {
    backgroundColor: '#2a4a3e',
  },
  stateBannerWalk: {
    backgroundColor: '#4a3a2e',
  },
  stateText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  segmentInstruction: {
    color: '#c0c0c0',
    fontSize: 16,
    marginTop: 8,
  },
  metricsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  metricPrimary: {
    alignItems: 'center',
    marginBottom: 32,
  },
  metricPrimaryValue: {
    color: '#ffffff',
    fontSize: 72,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  metricPrimaryLabel: {
    color: '#a0a0a0',
    fontSize: 16,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  metricSecondary: {
    alignItems: 'center',
  },
  metricSecondaryValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  metricSecondaryLabel: {
    color: '#a0a0a0',
    fontSize: 14,
    marginTop: 4,
  },
  targetPace: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  targetPaceLabel: {
    color: '#a0a0a0',
    fontSize: 14,
    marginRight: 8,
  },
  targetPaceValue: {
    color: '#4a90d9',
    fontSize: 16,
    fontWeight: '500',
  },
  segmentProgress: {
    alignItems: 'center',
  },
  segmentProgressText: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 8,
  },
  segmentProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
  },
  segmentProgressFill: {
    height: '100%',
    backgroundColor: '#4a90d9',
    borderRadius: 2,
  },
  pausedOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pausedText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    padding: 24,
    paddingBottom: 48,
  },
  pauseButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 32,
  },
  pauseButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
  },
  stopButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a2a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 32,
  },
  stopButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
  },
});
