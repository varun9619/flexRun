import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useProfileStore } from '@/store/profile.store';
import { useProgressionStore } from '@/store/progression.store';
import { GOAL_METADATA, EXPERIENCE_METADATA } from '@/types/constants';
import { formatPace } from '@/engine/pace-calculator';
import { clearAllData } from '@/services/storage.service';
import { setAPIKey as setAIServiceKey } from '@/services/ai.service';

// ============================================
// TYPES
// ============================================

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

// ============================================
// COMPONENT
// ============================================

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { profile, apiKey, updateProfile, resetProfile, setAPIKey } = useProfileStore();
  const { progression } = useProgressionStore();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveAPIKey = () => {
    if (apiKeyInput.trim()) {
      setAPIKey(apiKeyInput.trim());
      setAIServiceKey(apiKeyInput.trim());
      Alert.alert('Success', 'API key saved successfully');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your runs, settings, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            resetProfile();
            // The app will navigate to onboarding due to isOnboardingComplete being false
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </SafeAreaView>
    );
  }

  const goalMeta = GOAL_METADATA[profile.goalType];
  const expMeta = EXPERIENCE_METADATA[profile.experienceLevel];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenAI API Key</Text>
          <Text style={styles.sectionDescription}>
            Required for AI-powered session generation and feedback
          </Text>
          
          <TextInput
            style={styles.apiKeyInput}
            placeholder="Enter your OpenAI API key"
            placeholderTextColor="#666"
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.apiKeyActions}>
            <TouchableOpacity
              style={styles.showKeyButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Text style={styles.showKeyText}>
                {showApiKey ? '🙈 Hide' : '👁 Show'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveKeyButton}
              onPress={handleSaveAPIKey}
            >
              <Text style={styles.saveKeyText}>Save Key</Text>
            </TouchableOpacity>
          </View>
          
          {apiKey && (
            <Text style={styles.keyStatus}>✅ API key is configured</Text>
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Goal</Text>
            <Text style={styles.settingValue}>
              {goalMeta.icon} {goalMeta.label}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Experience</Text>
            <Text style={styles.settingValue}>{expMeta.label}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Base Pace</Text>
            <Text style={styles.settingValue}>
              {formatPace(profile.basePace)} /km
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Weekly Days</Text>
            <Text style={styles.settingValue}>{profile.weeklyDays} days</Text>
          </View>
        </View>

        {/* Training Section */}
        {progression && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Current Difficulty</Text>
              <Text style={styles.settingValue}>
                {progression.currentDifficulty} / 10
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Easy Pace</Text>
              <Text style={styles.settingValue}>
                {formatPace(progression.estimatedEasyPace)} /km
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tempo Pace</Text>
              <Text style={styles.settingValue}>
                {formatPace(progression.estimatedTempoPace)} /km
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Streak</Text>
              <Text style={styles.settingValue}>
                🔥 {progression.streakDays} days
              </Text>
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateProfile({ coachingEnabled: !profile.coachingEnabled })
            }
          >
            <Text style={styles.settingLabel}>Voice Coaching</Text>
            <Text style={styles.settingValue}>
              {profile.coachingEnabled ? '✅ On' : '❌ Off'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateProfile({
                distanceUnit:
                  profile.distanceUnit === 'KM' ? 'MI' : 'KM',
              })
            }
          >
            <Text style={styles.settingLabel}>Distance Unit</Text>
            <Text style={styles.settingValue}>{profile.distanceUnit}</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetData}
          >
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>FlexRun</Text>
          <Text style={styles.appVersion}>Version 1.0.0 (MVP)</Text>
        </View>
      </ScrollView>
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
    padding: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    padding: 16,
    paddingBottom: 8,
  },
  sectionDescription: {
    color: '#888',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 18,
  },
  apiKeyInput: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  apiKeyActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  showKeyButton: {
    flex: 1,
    backgroundColor: '#3a3a5e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  showKeyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveKeyButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveKeyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  keyStatus: {
    color: '#4ade80',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
  settingValue: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  dangerTitle: {
    color: '#ff6b6b',
  },
  dangerButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
  },
  dangerButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  appVersion: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 4,
  },
});
