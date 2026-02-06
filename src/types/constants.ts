import {
  GoalType,
  SessionIntent,
  SessionState,
  ExperienceLevel,
} from './index';

// ============================================
// GOAL METADATA
// ============================================

export interface GoalMetadata {
  type: GoalType;
  label: string;
  description: string;
  icon: string;
  defaultWeeklyDays: number;
  intensityFocus: 'low' | 'moderate' | 'high';
  volumeFocus: 'low' | 'moderate' | 'high';
}

export const GOAL_METADATA: Record<GoalType, GoalMetadata> = {
  [GoalType.IMPROVE_PACE]: {
    type: GoalType.IMPROVE_PACE,
    label: 'Get Faster',
    description: 'Improve your speed at your current distance',
    icon: '⚡',
    defaultWeeklyDays: 4,
    intensityFocus: 'high',
    volumeFocus: 'moderate',
  },
  [GoalType.RACE_5K]: {
    type: GoalType.RACE_5K,
    label: '5K Race',
    description: 'Train for a 5K race',
    icon: '🏁',
    defaultWeeklyDays: 3,
    intensityFocus: 'high',
    volumeFocus: 'low',
  },
  [GoalType.RACE_10K]: {
    type: GoalType.RACE_10K,
    label: '10K Race',
    description: 'Train for a 10K race',
    icon: '🏁',
    defaultWeeklyDays: 4,
    intensityFocus: 'high',
    volumeFocus: 'moderate',
  },
  [GoalType.RACE_HALF_MARATHON]: {
    type: GoalType.RACE_HALF_MARATHON,
    label: 'Half Marathon',
    description: 'Train for a half marathon (21.1km)',
    icon: '🏅',
    defaultWeeklyDays: 4,
    intensityFocus: 'moderate',
    volumeFocus: 'high',
  },
  [GoalType.FITNESS]: {
    type: GoalType.FITNESS,
    label: 'General Fitness',
    description: 'Improve overall cardiovascular health',
    icon: '💪',
    defaultWeeklyDays: 3,
    intensityFocus: 'moderate',
    volumeFocus: 'moderate',
  },
  [GoalType.BUILD_HABIT]: {
    type: GoalType.BUILD_HABIT,
    label: 'Build a Habit',
    description: 'Focus on consistency, not intensity',
    icon: '📅',
    defaultWeeklyDays: 3,
    intensityFocus: 'low',
    volumeFocus: 'low',
  },
};

// ============================================
// INTENT METADATA
// ============================================

export interface IntentMetadata {
  type: SessionIntent;
  label: string;
  description: string;
  icon: string;
  affectsProgression: boolean;
  coachingIntensity: 'off' | 'minimal' | 'full';
}

export const INTENT_METADATA: Record<SessionIntent, IntentMetadata> = {
  [SessionIntent.TRAINING]: {
    type: SessionIntent.TRAINING,
    label: 'Training',
    description: 'Follow the plan, push yourself',
    icon: '🎯',
    affectsProgression: true,
    coachingIntensity: 'full',
  },
  [SessionIntent.EASY]: {
    type: SessionIntent.EASY,
    label: 'Easy Run',
    description: 'Light effort, conversational pace',
    icon: '🌿',
    affectsProgression: true,
    coachingIntensity: 'minimal',
  },
  [SessionIntent.WALK]: {
    type: SessionIntent.WALK,
    label: 'Walk',
    description: 'Just a walk, no running',
    icon: '🚶',
    affectsProgression: false,
    coachingIntensity: 'off',
  },
  [SessionIntent.RECOVERY]: {
    type: SessionIntent.RECOVERY,
    label: 'Recovery',
    description: 'Very easy, active recovery',
    icon: '🧘',
    affectsProgression: false,
    coachingIntensity: 'minimal',
  },
};

// ============================================
// SESSION STATE LABELS
// ============================================

export const SESSION_STATE_LABELS: Record<SessionState, string> = {
  [SessionState.IDLE]: 'Ready',
  [SessionState.WARMUP]: 'Warm Up',
  [SessionState.RUN_INTERVAL]: 'Run',
  [SessionState.WALK_INTERVAL]: 'Walk',
  [SessionState.COOLDOWN]: 'Cool Down',
  [SessionState.COMPLETE]: 'Complete',
};

// ============================================
// EXPERIENCE LEVEL METADATA
// ============================================

export interface ExperienceLevelMetadata {
  level: ExperienceLevel;
  label: string;
  description: string;
  typicalPaceRange: { min: number; max: number }; // min/km
  typicalDistanceRange: { min: number; max: number }; // km
}

export const EXPERIENCE_METADATA: Record<ExperienceLevel, ExperienceLevelMetadata> = {
  [ExperienceLevel.BEGINNER]: {
    level: ExperienceLevel.BEGINNER,
    label: 'Beginner',
    description: 'New to running or returning after a long break',
    typicalPaceRange: { min: 7.0, max: 9.0 },
    typicalDistanceRange: { min: 1, max: 5 },
  },
  [ExperienceLevel.INTERMEDIATE]: {
    level: ExperienceLevel.INTERMEDIATE,
    label: 'Intermediate',
    description: 'Running regularly for 6+ months',
    typicalPaceRange: { min: 5.5, max: 7.0 },
    typicalDistanceRange: { min: 5, max: 15 },
  },
  [ExperienceLevel.ADVANCED]: {
    level: ExperienceLevel.ADVANCED,
    label: 'Advanced',
    description: 'Experienced runner with race history',
    typicalPaceRange: { min: 4.0, max: 5.5 },
    typicalDistanceRange: { min: 10, max: 30 },
  },
};

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_PROFILE = {
  goalType: GoalType.FITNESS,
  basePace: 7.0,
  baseDistance: 3,
  weeklyDays: 3,
  experienceLevel: ExperienceLevel.BEGINNER,
  coachingEnabled: true,
};

export const DEFAULT_DIFFICULTY = 5;

export const PROMPT_COOLDOWNS: Record<number, number> = {
  1: 0,    // INTERVAL_CHANGE - immediate
  2: 30,   // PACE_CORRECTION - 30s
  3: 10,   // SAFETY - 10s
  4: 120,  // MOTIVATION - 2min
};
