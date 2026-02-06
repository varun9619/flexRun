import { create } from 'zustand';
import { ProgressionState } from '@/types';
import { DEFAULT_DIFFICULTY } from '@/types/constants';
import * as StorageService from '@/services/storage.service';

// ============================================
// STATE INTERFACE
// ============================================

interface ProgressionStateStore {
  progression: ProgressionState | null;
  isLoading: boolean;

  // Actions
  loadProgression: () => void;
  initializeProgression: (basePace: number) => void;
  updateAfterRun: (
    affectsProgression: boolean,
    distanceKm: number,
    difficultyAdjustment: number
  ) => void;
  updatePaceEstimates: (easyPace: number, tempoPace: number) => void;
  resetProgression: () => void;
}

// ============================================
// STORE
// ============================================

export const useProgressionStore = create<ProgressionStateStore>((set, get) => ({
  progression: null,
  isLoading: true,

  loadProgression: () => {
    const progression = StorageService.getProgression();
    set({ progression, isLoading: false });
  },

  initializeProgression: (basePace) => {
    const progression: ProgressionState = {
      currentDifficulty: DEFAULT_DIFFICULTY,
      estimatedEasyPace: basePace + 1,    // Easy is ~1 min/km slower
      estimatedTempoPace: basePace - 0.5, // Tempo is ~30s/km faster
      weeklyDistanceKm: 0,
      weeklyRunCount: 0,
      streakDays: 0,
      lastTrainingDate: null,
      updatedAt: Date.now(),
    };

    StorageService.saveProgression(progression);
    set({ progression });
  },

  updateAfterRun: (affectsProgression, distanceKm, difficultyAdjustment) => {
    const { progression } = get();
    if (!progression) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = progression.lastTrainingDate;

    // Calculate streak
    let newStreak = progression.streakDays;
    if (affectsProgression) {
      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        const todayObj = new Date(today);
        const diffDays = Math.floor(
          (todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Reset streak
        }
        // diffDays === 0 means same day, don't change streak
      } else {
        newStreak = 1;
      }
    }

    // Calculate new difficulty
    const newDifficulty = Math.max(
      1,
      Math.min(10, progression.currentDifficulty + difficultyAdjustment)
    );

    const updated: ProgressionState = {
      ...progression,
      currentDifficulty: affectsProgression ? newDifficulty : progression.currentDifficulty,
      weeklyDistanceKm: progression.weeklyDistanceKm + distanceKm,
      weeklyRunCount: progression.weeklyRunCount + 1,
      streakDays: newStreak,
      lastTrainingDate: affectsProgression ? today : progression.lastTrainingDate,
      updatedAt: Date.now(),
    };

    StorageService.saveProgression(updated);
    set({ progression: updated });
  },

  updatePaceEstimates: (easyPace, tempoPace) => {
    const { progression } = get();
    if (!progression) return;

    const updated: ProgressionState = {
      ...progression,
      estimatedEasyPace: easyPace,
      estimatedTempoPace: tempoPace,
      updatedAt: Date.now(),
    };

    StorageService.saveProgression(updated);
    set({ progression: updated });
  },

  resetProgression: () => {
    StorageService.saveProgression(null as any); // Clear
    set({ progression: null });
  },
}));
