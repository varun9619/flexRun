import React, { useState } from 'react';
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
import { useProgressionStore } from '@/store/progression.store';
import { GoalType, ExperienceLevel } from '@/types';
import { GOAL_METADATA, EXPERIENCE_METADATA } from '@/types/constants';

// ============================================
// TYPES
// ============================================

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

type OnboardingStep = 'welcome' | 'goal' | 'experience' | 'pace' | 'days';

// ============================================
// COMPONENT
// ============================================

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(GoalType.FITNESS);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel>(
    ExperienceLevel.BEGINNER
  );
  const [basePace, setBasePace] = useState(7.0);
  const [weeklyDays, setWeeklyDays] = useState(3);

  const { createProfile, completeOnboarding } = useProfileStore();
  const { initializeProgression } = useProgressionStore();

  const handleComplete = () => {
    // Create profile
    createProfile({
      goalType: selectedGoal,
      experienceLevel: selectedExperience,
      basePace,
      weeklyDays,
      baseDistance: EXPERIENCE_METADATA[selectedExperience].typicalDistanceRange.min,
    });

    // Initialize progression
    initializeProgression(basePace);

    // Mark onboarding complete
    completeOnboarding();
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>🏃</Text>
      <Text style={styles.title}>Welcome to FlexRun</Text>
      <Text style={styles.subtitle}>
        Your AI-powered adaptive running coach
      </Text>
      <Text style={styles.description}>
        FlexRun creates personalized training sessions that adapt to your
        progress and daily energy levels.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('goal')}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGoalSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>This helps us tailor your training</Text>

      <ScrollView style={styles.optionsList}>
        {Object.values(GOAL_METADATA).map((goal) => (
          <TouchableOpacity
            key={goal.type}
            style={[
              styles.optionCard,
              selectedGoal === goal.type && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedGoal(goal.type)}
          >
            <Text style={styles.optionEmoji}>{goal.icon}</Text>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{goal.label}</Text>
              <Text style={styles.optionDescription}>{goal.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('experience')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExperienceSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your experience level?</Text>
      <Text style={styles.subtitle}>Be honest — it helps us help you</Text>

      <View style={styles.optionsList}>
        {Object.values(EXPERIENCE_METADATA).map((exp) => (
          <TouchableOpacity
            key={exp.level}
            style={[
              styles.optionCard,
              selectedExperience === exp.level && styles.optionCardSelected,
            ]}
            onPress={() => {
              setSelectedExperience(exp.level);
              // Set default pace based on experience
              const avgPace =
                (exp.typicalPaceRange.min + exp.typicalPaceRange.max) / 2;
              setBasePace(avgPace);
            }}
          >
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{exp.label}</Text>
              <Text style={styles.optionDescription}>{exp.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('pace')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaceSelection = () => {
    const formatPace = (pace: number) => {
      const mins = Math.floor(pace);
      const secs = Math.round((pace - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Your comfortable pace?</Text>
        <Text style={styles.subtitle}>
          The pace you can hold for 20-30 minutes
        </Text>

        <View style={styles.paceContainer}>
          <Text style={styles.paceValue}>{formatPace(basePace)}</Text>
          <Text style={styles.paceUnit}>min/km</Text>
        </View>

        <View style={styles.paceButtons}>
          <TouchableOpacity
            style={styles.paceButton}
            onPress={() => setBasePace(Math.max(4, basePace - 0.5))}
          >
            <Text style={styles.paceButtonText}>Faster</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.paceButton}
            onPress={() => setBasePace(Math.min(10, basePace + 0.5))}
          >
            <Text style={styles.paceButtonText}>Slower</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('days')}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDaysSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>How many days per week?</Text>
      <Text style={styles.subtitle}>We'll build your plan around this</Text>

      <View style={styles.daysContainer}>
        {[2, 3, 4, 5, 6].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.dayButton,
              weeklyDays === days && styles.dayButtonSelected,
            ]}
            onPress={() => setWeeklyDays(days)}
          >
            <Text
              style={[
                styles.dayButtonText,
                weeklyDays === days && styles.dayButtonTextSelected,
              ]}
            >
              {days}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleComplete}
      >
        <Text style={styles.primaryButtonText}>Start Training</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 'welcome' && renderWelcome()}
      {step === 'goal' && renderGoalSelection()}
      {step === 'experience' && renderExperienceSelection()}
      {step === 'pace' && renderPaceSelection()}
      {step === 'days' && renderDaysSelection()}

      {step !== 'welcome' && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            const steps: OnboardingStep[] = [
              'welcome',
              'goal',
              'experience',
              'pace',
              'days',
            ];
            const currentIndex = steps.indexOf(step);
            if (currentIndex > 0) {
              setStep(steps[currentIndex - 1]);
            }
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
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
  stepContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#c0c0c0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  optionsList: {
    flex: 1,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#2a3a5e',
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  primaryButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  backButtonText: {
    color: '#4a90d9',
    fontSize: 16,
  },
  paceContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  paceValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  paceUnit: {
    fontSize: 18,
    color: '#a0a0a0',
    marginTop: 8,
  },
  paceButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  paceButton: {
    backgroundColor: '#2a2a4e',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  paceButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 32,
  },
  dayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#4a90d9',
  },
  dayButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
});
