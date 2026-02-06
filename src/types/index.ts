// ============================================
// ENUMS
// ============================================

export enum GoalType {
  IMPROVE_PACE = 'IMPROVE_PACE',
  RACE_5K = 'RACE_5K',
  RACE_10K = 'RACE_10K',
  RACE_HALF_MARATHON = 'RACE_HALF_MARATHON',
  FITNESS = 'FITNESS',
  BUILD_HABIT = 'BUILD_HABIT',
}

export enum SessionIntent {
  TRAINING = 'TRAINING',
  EASY = 'EASY',
  WALK = 'WALK',
  RECOVERY = 'RECOVERY',
}

export enum TodayIntent {
  CONTINUE_TRAINING = 'CONTINUE_TRAINING',
  WALK_CASUAL = 'WALK_CASUAL',
  REST_DAY = 'REST_DAY',
  CHANGE_PLAN = 'CHANGE_PLAN',
  EASY_RUN = 'EASY_RUN',
}

export enum SessionMode {
  TRAINING = 'TRAINING',
  CASUAL = 'CASUAL',
}

export enum SessionState {
  IDLE = 'IDLE',
  WARMUP = 'WARMUP',
  RUN_INTERVAL = 'RUN_INTERVAL',
  WALK_INTERVAL = 'WALK_INTERVAL',
  COOLDOWN = 'COOLDOWN',
  COMPLETE = 'COMPLETE',
}

export enum PromptType {
  INTERVAL_CHANGE = 1,
  PACE_CORRECTION = 2,
  SAFETY = 3,
  MOTIVATION = 4,
}

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum DistanceUnit {
  KM = 'KM',
  MI = 'MI',
}

// ============================================
// RUNNER PROFILE
// ============================================

export interface RunnerProfile {
  id: string;
  goalType: GoalType;
  basePace: number;           // min/km (e.g., 6.5 = 6:30/km)
  baseDistance: number;       // km
  weeklyDays: number;         // 1-7
  experienceLevel: ExperienceLevel;
  distanceUnit: DistanceUnit;
  coachingEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RunnerProgram {
  activeGoal: GoalType | null;
  trainingDayIndex: number;
  lastSessionDate: string | null;
  isActive: boolean;
}

// ============================================
// INTERVAL PLAN (AI-generated)
// ============================================

export interface IntervalSegment {
  id: string;
  order: number;
  state: SessionState;
  durationSeconds: number;
  targetPaceMin: number;      // min/km
  targetPaceMax: number;      // min/km
  instruction: string;        // "Easy jog", "Push hard", etc.
}

export interface IntervalPlan {
  id: string;
  createdAt: number;
  segments: IntervalSegment[];
  totalDurationSeconds: number;
  totalDistanceKm: number;
  rationale: string;
  difficulty: number;         // 1-10
  focusArea: string;
}

// ============================================
// RUN SESSION (Completed)
// ============================================

export interface RunSession {
  id: string;
  date: string;               // ISO date
  duration: number;           // seconds
  distance: number;           // meters
  avgPace: number;            // min/km
  intentType: SessionIntent;
  goalType: GoalType;
  affectsProgression: boolean;
  intervalPlanId: string | null;
  splits: Split[];
  createdAt: number;
}

export interface Split {
  kmIndex: number;            // 1, 2, 3...
  durationSeconds: number;
  paceMinPerKm: number;
}

// ============================================
// ACTIVE RUN (Live State)
// ============================================

export interface GpsPoint {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;       // m/s
}

export interface ActiveRun {
  sessionIntent: SessionIntent;
  intervalPlan: IntervalPlan | null;
  
  // State machine
  currentState: SessionState;
  currentSegmentIndex: number;
  segmentStartTime: number;
  segmentElapsedSeconds: number;
  
  // Timing
  startedAt: number;
  totalElapsedSeconds: number;
  isPaused: boolean;
  pausedAt: number | null;
  totalPausedSeconds: number;
  
  // GPS & Metrics
  gpsPoints: GpsPoint[];
  totalDistanceMeters: number;
  currentPace: number;        // smoothed, min/km
  
  // Prompt throttling
  lastPromptType: PromptType | null;
  lastPromptTime: number;
  promptsDelivered: string[];
}

// ============================================
// AI FEEDBACK
// ============================================

export interface AIFeedback {
  id: string;
  runSessionId: string;
  summary: string;
  positiveHighlight: string;
  improvementTip: string;
  paceAssessment: 'too_slow' | 'on_target' | 'too_fast';
  effortAssessment: 'easy' | 'moderate' | 'hard' | 'overreached';
  difficultyAdjustment: -1 | 0 | 1;
  nextSessionHint: string;
  generatedAt: number;
}

// ============================================
// PROGRESSION STATE
// ============================================

export interface ProgressionState {
  currentDifficulty: number;  // 1-10
  estimatedEasyPace: number;
  estimatedTempoPace: number;
  weeklyDistanceKm: number;
  weeklyRunCount: number;
  streakDays: number;
  lastTrainingDate: string | null;
  updatedAt: number;
}

// ============================================
// AUDIO PROMPT
// ============================================

export interface AudioPrompt {
  id: string;
  type: PromptType;
  message: string;
  priority: number;           // lower = higher priority
  cooldownSeconds: number;
}

// ============================================
// APP STATE
// ============================================

export type AppScreen = 
  | 'ONBOARDING'
  | 'AI_ENTRY'
  | 'HOME'
  | 'PRE_RUN'
  | 'ACTIVE_RUN'
  | 'POST_RUN'
  | 'HISTORY'
  | 'SETTINGS';

// ============================================
// CONVERSATION UI
// ============================================

export interface ConversationMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
}

export interface QuickReply {
  id: string;
  label: string;
  value: TodayIntent | string;
  icon?: string;
}
