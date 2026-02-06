import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useProfileStore } from '@/store/profile.store';
import { useSessionsStore } from '@/store/sessions.store';
import { useProgressionStore } from '@/store/progression.store';
import { SessionIntent, IntervalPlan } from '@/types';
import { INTENT_METADATA } from '@/types/constants';
import { generateSession } from '@/services/ai.service';
import { requestLocationPermissions } from '@/services/location.service';

// ============================================
// TYPES
// ============================================

type PreRunScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PreRun'>;
};

// ============================================
// COMPONENT
// ============================================

export function PreRunScreen({ navigation }: PreRunScreenProps) {
  const [selectedIntent, setSelectedIntent] = useState<SessionIntent>(
    SessionIntent.TRAINING
  );
  const [plan, setPlan] = useState<IntervalPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const { profile } = useProfileStore();
  const { getRecentTrainingSessions, savePlan } = useSessionsStore();
  const { progression } = useProgressionStore();

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Generate session when intent is TRAINING
  useEffect(() => {
    if (selectedIntent === SessionIntent.TRAINING && !plan && profile) {
      generateTrainingSession();
    }
  }, [selectedIntent]);

  const checkPermissions = async () => {
    const { foreground, background } = await requestLocationPermissions();
    setPermissionsGranted(foreground);
    
    if (!foreground) {
      // Show permission prompt
    }
  };

  const generateTrainingSession = async () => {
    if (!profile || !progression) return;

    setIsGenerating(true);
    try {
      const recentRuns = getRecentTrainingSessions(10);
      const generatedPlan = await generateSession(
        profile,
        recentRuns,
        progression.currentDifficulty
      );
      setPlan(generatedPlan);
      savePlan(generatedPlan);
    } catch (error) {
      console.error('Failed to generate session:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartRun = () => {
    if (!permissionsGranted) {
      checkPermissions();
      return;
    }

    // Navigate to active run with intent and plan
    navigation.navigate('ActiveRun');
  };

  const intentMeta = INTENT_METADATA[selectedIntent];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Intent Selection */}
        <Text style={styles.sectionTitle}>How do you feel today?</Text>
        <View style={styles.intentGrid}>
          {Object.values(INTENT_METADATA).map((intent) => (
            <TouchableOpacity
              key={intent.type}
              style={[
                styles.intentCard,
                selectedIntent === intent.type && styles.intentCardSelected,
              ]}
              onPress={() => {
                setSelectedIntent(intent.type);
                if (intent.type !== SessionIntent.TRAINING) {
                  setPlan(null);
                }
              }}
            >
              <Text style={styles.intentIcon}>{intent.icon}</Text>
              <Text style={styles.intentLabel}>{intent.label}</Text>
              {!intent.affectsProgression && (
                <Text style={styles.intentNote}>Won't affect training</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Session Preview (for Training) */}
        {selectedIntent === SessionIntent.TRAINING && (
          <View style={styles.sessionPreview}>
            <Text style={styles.sectionTitle}>Today's Session</Text>
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#4a90d9" size="large" />
                <Text style={styles.loadingText}>Generating your session...</Text>
              </View>
            ) : plan ? (
              <View style={styles.planCard}>
                <Text style={styles.planFocus}>{plan.focusArea}</Text>
                <Text style={styles.planRationale}>{plan.rationale}</Text>
                <View style={styles.planStats}>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>
                      {Math.round(plan.totalDurationSeconds / 60)}
                    </Text>
                    <Text style={styles.planStatLabel}>min</Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>
                      {plan.segments.length}
                    </Text>
                    <Text style={styles.planStatLabel}>intervals</Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>{plan.difficulty}</Text>
                    <Text style={styles.planStatLabel}>difficulty</Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={generateTrainingSession}
              >
                <Text style={styles.regenerateText}>Generate Session</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Intent Description */}
        <View style={styles.intentDescription}>
          <Text style={styles.intentDescriptionTitle}>
            {intentMeta.label} Mode
          </Text>
          <Text style={styles.intentDescriptionText}>
            {intentMeta.description}
          </Text>
          <Text style={styles.coachingNote}>
            Coaching:{' '}
            {intentMeta.coachingIntensity === 'off'
              ? 'No audio prompts'
              : intentMeta.coachingIntensity === 'minimal'
              ? 'Basic prompts only'
              : 'Full coaching'}
          </Text>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.footer}>
        {!permissionsGranted && (
          <Text style={styles.permissionWarning}>
            Location permission required to track your run
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.startButton,
            !permissionsGranted && styles.startButtonDisabled,
          ]}
          onPress={handleStartRun}
          disabled={!permissionsGranted}
        >
          <Text style={styles.startButtonText}>
            {permissionsGranted ? 'Start Run' : 'Grant Permission'}
          </Text>
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
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  intentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  intentCard: {
    width: '47%',
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intentCardSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#2a3a5e',
  },
  intentIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  intentLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  intentNote: {
    color: '#a0a0a0',
    fontSize: 10,
    marginTop: 4,
  },
  sessionPreview: {
    marginBottom: 24,
  },
  loadingContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 12,
  },
  planCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
  },
  planFocus: {
    color: '#4a90d9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  planRationale: {
    color: '#c0c0c0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  planStat: {
    alignItems: 'center',
  },
  planStatValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  planStatLabel: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  regenerateButton: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  regenerateText: {
    color: '#4a90d9',
    fontSize: 16,
  },
  intentDescription: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
  },
  intentDescriptionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  intentDescriptionText: {
    color: '#c0c0c0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  coachingNote: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  permissionWarning: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#3a3a5e',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
