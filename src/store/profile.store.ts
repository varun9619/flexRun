import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  RunnerProfile,
  RunnerProgram,
  GoalType,
  ExperienceLevel,
  DistanceUnit,
} from '@/types';
import { DEFAULT_PROFILE } from '@/types/constants';
import * as StorageService from '@/services/storage.service';
import { setAPIKey as setAIServiceKey } from '@/services/ai.service';

// ============================================
// STATE INTERFACE
// ============================================

interface ProfileState {
  profile: RunnerProfile | null;
  program: RunnerProgram | null;
  apiKey: string | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;

  // Actions
  loadProfile: () => void;
  createProfile: (data: Partial<RunnerProfile>) => RunnerProfile;
  updateProfile: (updates: Partial<RunnerProfile>) => void;
  resetProfile: () => void;
  completeOnboarding: () => void;
  setAPIKey: (key: string) => void;
  updateProgram: (updates: Partial<RunnerProgram>) => void;
}

// ============================================
// STORE
// ============================================

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  program: null,
  apiKey: null,
  isLoading: true,
  isOnboardingComplete: false,

  loadProfile: () => {
    const profile = StorageService.getProfile();
    const program = StorageService.getProgram();
    const apiKey = StorageService.getAPIKey();
    const isOnboardingComplete = StorageService.isOnboardingComplete();

    // Initialize AI service with stored API key
    if (apiKey) {
      setAIServiceKey(apiKey);
    }

    set({
      profile,
      program: program || {
        activeGoal: profile?.goalType || null,
        trainingDayIndex: 0,
        lastSessionDate: null,
        isActive: false,
      },
      apiKey,
      isOnboardingComplete,
      isLoading: false,
    });
  },

  createProfile: (data) => {
    const now = Date.now();
    const profile: RunnerProfile = {
      id: uuidv4(),
      goalType: data.goalType ?? DEFAULT_PROFILE.goalType,
      basePace: data.basePace ?? DEFAULT_PROFILE.basePace,
      baseDistance: data.baseDistance ?? DEFAULT_PROFILE.baseDistance,
      weeklyDays: data.weeklyDays ?? DEFAULT_PROFILE.weeklyDays,
      experienceLevel: data.experienceLevel ?? DEFAULT_PROFILE.experienceLevel,
      distanceUnit: data.distanceUnit ?? DistanceUnit.KM,
      coachingEnabled: data.coachingEnabled ?? DEFAULT_PROFILE.coachingEnabled,
      createdAt: now,
      updatedAt: now,
    };

    StorageService.saveProfile(profile);
    set({ profile });

    return profile;
  },

  updateProfile: (updates) => {
    const { profile } = get();
    if (!profile) return;

    const updatedProfile: RunnerProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };

    StorageService.saveProfile(updatedProfile);
    set({ profile: updatedProfile });
  },

  resetProfile: () => {
    StorageService.clearProfile();
    StorageService.setOnboardingComplete(false);
    set({
      profile: null,
      isOnboardingComplete: false,
    });
  },

  completeOnboarding: () => {
    StorageService.setOnboardingComplete(true);
    set({ isOnboardingComplete: true });
  },

  setAPIKey: (key: string) => {
    StorageService.saveAPIKey(key);
    set({ apiKey: key });
  },

  updateProgram: (updates: Partial<RunnerProgram>) => {
    const { program } = get();
    if (!program) return;

    const updatedProgram = {
      ...program,
      ...updates,
    };

    StorageService.saveProgram(updatedProgram);
    set({ program: updatedProgram });
  },
}));
