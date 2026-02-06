// Try to use native MMKV when available. In Expo Go (or when the native module
// isn't linked) this will throw — fall back to a lightweight in-memory
// implementation that provides the minimal API the app uses. This allows the
// app to run without rebuilding a native binary.
let storage: any;

try {
  // Use require so TypeScript doesn't error when the native module is absent
  // during static analysis in managed Expo.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
} catch (e) {
  // Fallback implementation: simple in-memory store with the same methods
  // used across the codebase: getString, getBoolean, set, delete, clearAll.
  console.warn('react-native-mmkv native module not found — using in-memory fallback storage.');

  const store = new Map<string, string>();

  storage = {
    getString(key: string) {
      return store.has(key) ? store.get(key) as string : undefined;
    },
    getBoolean(key: string) {
      const v = store.get(key);
      if (v === undefined) return undefined;
      // stored booleans are saved as 'true'|'false'
      return v === 'true';
    },
    set(key: string, value: any) {
      // MMKV accepts strings and booleans; persist everything as strings
      store.set(key, String(value));
    },
    delete(key: string) {
      store.delete(key);
    },
    clearAll() {
      store.clear();
    },
  };
}
import {
  RunnerProfile,
  RunSession,
  IntervalPlan,
  AIFeedback,
  ProgressionState,
} from '@/types';

// `storage` is either a real MMKV instance or the in-memory fallback above.

// ============================================
// KEYS
// ============================================

const KEYS = {
  PROFILE: 'runner_profile',
  PROGRAM: 'runner_program',
  SESSIONS: 'run_sessions',
  PLANS: 'interval_plans',
  FEEDBACK: 'ai_feedback',
  PROGRESSION: 'progression_state',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  API_KEY: 'openai_api_key',
} as const;

// ============================================
// PROFILE
// ============================================

export function getProfile(): RunnerProfile | null {
  const data = storage.getString(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: RunnerProfile): void {
  storage.set(KEYS.PROFILE, JSON.stringify(profile));
}

export function clearProfile(): void {
  storage.delete(KEYS.PROFILE);
}

// ============================================
// SESSIONS
// ============================================

export function getSessions(): RunSession[] {
  const data = storage.getString(KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function getSession(id: string): RunSession | null {
  const sessions = getSessions();
  return sessions.find((s) => s.id === id) || null;
}

export function saveSession(session: RunSession): void {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session); // newest first
  }
  
  storage.set(KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getRecentTrainingSessions(limit: number = 10): RunSession[] {
  const sessions = getSessions();
  return sessions
    .filter((s) => s.affectsProgression)
    .slice(0, limit);
}

export function getSessionsByDateRange(
  startDate: string,
  endDate: string
): RunSession[] {
  const sessions = getSessions();
  return sessions.filter((s) => s.date >= startDate && s.date <= endDate);
}

// ============================================
// INTERVAL PLANS
// ============================================

export function getPlans(): IntervalPlan[] {
  const data = storage.getString(KEYS.PLANS);
  return data ? JSON.parse(data) : [];
}

export function getPlan(id: string): IntervalPlan | null {
  const plans = getPlans();
  return plans.find((p) => p.id === id) || null;
}

export function savePlan(plan: IntervalPlan): void {
  const plans = getPlans();
  const index = plans.findIndex((p) => p.id === plan.id);
  
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.unshift(plan);
  }
  
  storage.set(KEYS.PLANS, JSON.stringify(plans));
}

// ============================================
// AI FEEDBACK
// ============================================

export function getFeedbackList(): AIFeedback[] {
  const data = storage.getString(KEYS.FEEDBACK);
  return data ? JSON.parse(data) : [];
}

export function getFeedback(runSessionId: string): AIFeedback | null {
  const feedbacks = getFeedbackList();
  return feedbacks.find((f) => f.runSessionId === runSessionId) || null;
}

export function saveFeedback(feedback: AIFeedback): void {
  const feedbacks = getFeedbackList();
  const index = feedbacks.findIndex((f) => f.id === feedback.id);
  
  if (index >= 0) {
    feedbacks[index] = feedback;
  } else {
    feedbacks.unshift(feedback);
  }
  
  storage.set(KEYS.FEEDBACK, JSON.stringify(feedbacks));
}

// ============================================
// PROGRESSION
// ============================================

export function getProgression(): ProgressionState | null {
  const data = storage.getString(KEYS.PROGRESSION);
  return data ? JSON.parse(data) : null;
}

export function saveProgression(progression: ProgressionState): void {
  storage.set(KEYS.PROGRESSION, JSON.stringify(progression));
}

// ============================================
// ONBOARDING
// ============================================

export function isOnboardingComplete(): boolean {
  return storage.getBoolean(KEYS.ONBOARDING_COMPLETE) || false;
}

export function setOnboardingComplete(complete: boolean): void {
  storage.set(KEYS.ONBOARDING_COMPLETE, complete);
}

// ============================================
// RUNNER PROGRAM
// ============================================

export function getProgram(): any {
  const data = storage.getString(KEYS.PROGRAM);
  return data ? JSON.parse(data) : null;
}

export function saveProgram(program: any): void {
  storage.set(KEYS.PROGRAM, JSON.stringify(program));
}

// ============================================
// API KEY
// ============================================

export function getAPIKey(): string | null {
  return storage.getString(KEYS.API_KEY) || null;
}

export function saveAPIKey(apiKey: string): void {
  storage.set(KEYS.API_KEY, apiKey);
}

export function clearAPIKey(): void {
  storage.delete(KEYS.API_KEY);
}

// ============================================
// UTILITIES
// ============================================

export function clearAllData(): void {
  storage.clearAll();
}

export function exportAllData(): string {
  return JSON.stringify({
    profile: getProfile(),
    sessions: getSessions(),
    plans: getPlans(),
    feedback: getFeedbackList(),
    progression: getProgression(),
    onboardingComplete: isOnboardingComplete(),
  });
}

export default storage;
