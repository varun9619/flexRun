import { v4 as uuidv4 } from 'uuid';
import {
  RunnerProfile,
  RunnerProgram,
  RunSession,
  IntervalPlan,
  IntervalSegment,
  AIFeedback,
  SessionState,
  GoalType,
  TodayIntent,
  QuickReply,
} from '@/types';
import { GOAL_METADATA } from '@/types/constants';
import {
  SYSTEM_PROMPT,
  generateSessionPrompt,
  generateFeedbackPrompt,
} from '@/ai/prompts';
import * as StorageService from './storage.service';

// ============================================
// CONFIGURATION
// ============================================

const API_URL = 'https://api.openai.com/v1/chat/completions';

interface AIConfig {
  apiUrl: string;
  apiKey: string | null;
  model: string;
  maxTokens: number;
  temperature: number;
}

let config: AIConfig = {
  apiUrl: API_URL,
  apiKey: null,
  model: 'gpt-4o-mini',
  maxTokens: 1500,
  temperature: 0.7,
};

// Load API key from Expo environment variable at module init
// This runs once when the module is imported
try {
  // @ts-ignore - Expo provides this at runtime
  const envKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (envKey) {
    config.apiKey = envKey;
  }
} catch (e) {
  // ignore
}

export function configureAI(newConfig: Partial<AIConfig>): void {
  config = { ...config, ...newConfig };
}

export function setAPIKey(apiKey: string): void {
  config.apiKey = apiKey;
  StorageService.saveAPIKey(apiKey);
  // persist to AsyncStorage so it survives Expo reloads
  try {
    // fire-and-forget using dynamic require to avoid bundler resolution errors
    try {
      // use eval to prevent static analysis from Metro
      // eslint-disable-next-line no-eval
      const _req: any = eval('require');
      const AsyncStorage = _req('@react-native-async-storage/async-storage');
      const setter = AsyncStorage?.setItem || AsyncStorage?.default?.setItem;
      if (setter) setter('openai_api_key', apiKey);
    } catch (err) {
      // ignore if AsyncStorage isn't installed in this environment
    }
  } catch (e) {
    // ignore
  }
}

export function getAPIKey(): string | null {
  if (!config.apiKey) {
    // Try the storage service first (synchronous when available)
    config.apiKey = StorageService.getAPIKey();
  }
  return config.apiKey;
}

async function ensureAPIKeyLoaded(): Promise<void> {
  if (config.apiKey) return;

  // 1) env at runtime
  try {
    const envKey = process?.env?.OPENAI_API_KEY;
    if (envKey) {
      config.apiKey = envKey;
      return;
    }
  } catch (e) {
    // ignore
  }

  // 2) Storage service (may be synchronous fallback)
  try {
    const stored = StorageService.getAPIKey();
    if (stored) {
      config.apiKey = stored;
      return;
    }
  } catch (e) {
    // ignore
  }

  // 3) AsyncStorage (persistent for Expo)
  try {
    try {
      // use dynamic require to avoid Metro trying to resolve the native module at bundle time
      // eslint-disable-next-line no-eval
      const _req: any = eval('require');
      const AsyncStorage = _req('@react-native-async-storage/async-storage');
      const getter = AsyncStorage?.getItem || AsyncStorage?.default?.getItem;
      if (getter) {
        const asyncKey = await getter('openai_api_key');
        if (asyncKey) config.apiKey = asyncKey;
      }
    } catch (err) {
      // ignore if AsyncStorage isn't available
    }
  } catch (e) {
    // ignore
  }
}

// ============================================
// 1️⃣ GENERATE SESSION
// ============================================

export async function generateSession(
  profile: RunnerProfile,
  recentRuns: RunSession[],
  currentDifficulty: number
): Promise<IntervalPlan> {
  const prompt = generateSessionPrompt(profile, recentRuns, currentDifficulty);

  try {
    const response = await callLLM(prompt);
    const parsed = parseSessionResponse(response);
    return parsed;
  } catch (error) {
    console.error('AI session generation failed, using fallback:', error);
    return generateFallbackSession(profile, currentDifficulty);
  }
}

// ============================================
// 2️⃣ GENERATE FEEDBACK
// ============================================

export async function generateFeedback(
  profile: RunnerProfile,
  session: RunSession,
  plan: IntervalPlan | null
): Promise<AIFeedback> {
  const prompt = generateFeedbackPrompt(profile, session, plan);

  try {
    const response = await callLLM(prompt);
    const parsed = parseFeedbackResponse(response, session.id);
    return parsed;
  } catch (error) {
    console.error('AI feedback generation failed, using fallback:', error);
    return generateFallbackFeedback(session);
  }
}

// ============================================
// 3️⃣ CALCULATE DIFFICULTY ADJUSTMENT
// ============================================

export function calculateDifficultyAdjustment(
  feedback: AIFeedback,
  recentFeedbacks: AIFeedback[]
): number {
  // Use AI feedback's suggestion as base
  let adjustment = feedback.difficultyAdjustment;

  // If consistently too hard/easy over last 3 sessions, amplify adjustment
  if (recentFeedbacks.length >= 3) {
    const lastThree = recentFeedbacks.slice(0, 3);
    const allTooHard = lastThree.every((f) => f.paceAssessment === 'too_fast');
    const allTooEasy = lastThree.every((f) => f.paceAssessment === 'too_slow');

    if (allTooHard) adjustment = Math.min(adjustment, -1) as -1 | 0 | 1;
    if (allTooEasy) adjustment = Math.max(adjustment, 1) as -1 | 0 | 1;
  }

  return adjustment;
}

// ============================================
// LLM API CALL
// ============================================

async function callLLM(userPrompt: string): Promise<string> {
  // Make sure we loaded an API key from env, storage service or AsyncStorage
  await ensureAPIKeyLoaded();

  if (!config.apiKey) {
    throw new Error('API key not configured');
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// RESPONSE PARSING
// ============================================

function parseSessionResponse(response: string): IntervalPlan {
  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
    response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Could not parse session JSON from response');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const data = JSON.parse(jsonStr);

  // Validate and transform to IntervalPlan
  const segments: IntervalSegment[] = data.segments.map(
    (s: any, index: number) => ({
      id: uuidv4(),
      order: index,
      state: mapToSessionState(s.type),
      durationSeconds: s.duration_seconds,
      targetPaceMin: s.pace_min,
      targetPaceMax: s.pace_max,
      instruction: s.instruction,
    })
  );

  return {
    id: uuidv4(),
    createdAt: Date.now(),
    segments,
    totalDurationSeconds: segments.reduce((sum, s) => sum + s.durationSeconds, 0),
    totalDistanceKm: data.total_distance_km || 0,
    rationale: data.rationale || '',
    difficulty: data.difficulty || 5,
    focusArea: data.focus_area || '',
  };
}

function parseFeedbackResponse(response: string, runSessionId: string): AIFeedback {
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
    response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Could not parse feedback JSON from response');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const data = JSON.parse(jsonStr);

  return {
    id: uuidv4(),
    runSessionId,
    summary: data.summary || '',
    positiveHighlight: data.positive_highlight || '',
    improvementTip: data.improvement_tip || '',
    paceAssessment: data.pace_assessment || 'on_target',
    effortAssessment: data.effort_assessment || 'moderate',
    difficultyAdjustment: data.difficulty_adjustment || 0,
    nextSessionHint: data.next_session_hint || '',
    generatedAt: Date.now(),
  };
}

function mapToSessionState(type: string): SessionState {
  const mapping: Record<string, SessionState> = {
    warmup: SessionState.WARMUP,
    run: SessionState.RUN_INTERVAL,
    walk: SessionState.WALK_INTERVAL,
    recovery: SessionState.WALK_INTERVAL,
    cooldown: SessionState.COOLDOWN,
  };
  return mapping[type.toLowerCase()] || SessionState.RUN_INTERVAL;
}

// ============================================
// FALLBACK GENERATORS (when API fails)
// ============================================

function generateFallbackSession(
  profile: RunnerProfile,
  difficulty: number
): IntervalPlan {
  const goalMeta = GOAL_METADATA[profile.goalType];
  const baseDuration = 20 + difficulty * 3; // 23-50 min based on difficulty

  const segments: IntervalSegment[] = [
    {
      id: uuidv4(),
      order: 0,
      state: SessionState.WARMUP,
      durationSeconds: 300, // 5 min
      targetPaceMin: profile.basePace + 1,
      targetPaceMax: profile.basePace + 1.5,
      instruction: 'Easy warm-up jog',
    },
  ];

  // Add intervals based on goal type
  if (goalMeta.intensityFocus === 'high') {
    // Interval workout
    for (let i = 0; i < 4; i++) {
      segments.push({
        id: uuidv4(),
        order: segments.length,
        state: SessionState.RUN_INTERVAL,
        durationSeconds: 180, // 3 min hard
        targetPaceMin: profile.basePace - 0.5,
        targetPaceMax: profile.basePace,
        instruction: 'Push the pace',
      });
      segments.push({
        id: uuidv4(),
        order: segments.length,
        state: SessionState.WALK_INTERVAL,
        durationSeconds: 90, // 1.5 min recovery
        targetPaceMin: profile.basePace + 2,
        targetPaceMax: profile.basePace + 3,
        instruction: 'Recovery jog',
      });
    }
  } else {
    // Steady run
    segments.push({
      id: uuidv4(),
      order: segments.length,
      state: SessionState.RUN_INTERVAL,
      durationSeconds: baseDuration * 60 - 600, // Main run
      targetPaceMin: profile.basePace,
      targetPaceMax: profile.basePace + 0.5,
      instruction: 'Steady comfortable pace',
    });
  }

  // Cooldown
  segments.push({
    id: uuidv4(),
    order: segments.length,
    state: SessionState.COOLDOWN,
    durationSeconds: 300, // 5 min
    targetPaceMin: profile.basePace + 1,
    targetPaceMax: profile.basePace + 2,
    instruction: 'Easy cool-down',
  });

  return {
    id: uuidv4(),
    createdAt: Date.now(),
    segments,
    totalDurationSeconds: segments.reduce((s, seg) => s + seg.durationSeconds, 0),
    totalDistanceKm: profile.baseDistance,
    rationale: 'Fallback session generated locally',
    difficulty,
    focusArea: goalMeta.label,
  };
}

function generateFallbackFeedback(session: RunSession): AIFeedback {
  const distanceKm = session.distance / 1000;
  const minutes = Math.floor(session.duration / 60);

  return {
    id: uuidv4(),
    runSessionId: session.id,
    summary: `You completed ${distanceKm.toFixed(1)}km in ${minutes} minutes.`,
    positiveHighlight: 'You got out there and ran!',
    improvementTip: 'Keep up the consistency.',
    paceAssessment: 'on_target',
    effortAssessment: 'moderate',
    difficultyAdjustment: 0,
    nextSessionHint: 'Continue with similar effort next time.',
    generatedAt: Date.now(),
  };
}

// ============================================
// AI ENTRY CONVERSATION
// ============================================

export async function generateAIEntryConversation(
  profile: RunnerProfile | null,
  program: RunnerProgram | null,
  sessions: RunSession[]
): Promise<{ message: string; quickReplies: QuickReply[] }> {
  // Determine conversation context
  const hasActiveGoal = program?.isActive && program?.activeGoal;
  const lastSessionDate = program?.lastSessionDate;
  const daysSinceLastRun = lastSessionDate 
    ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let message: string;
  let quickReplies: QuickReply[];

  if (hasActiveGoal) {
    // Case A: Active training program
    const goalName = GOAL_METADATA[program.activeGoal!].label;
    const dayIndex = program.trainingDayIndex + 1;
    
    message = `Ready for Day ${dayIndex} of your ${goalName} program?`;
    
    quickReplies = [
      { id: '1', label: '✅ Continue training', value: TodayIntent.CONTINUE_TRAINING },
      { id: '2', label: '🚶 Walk casually today', value: TodayIntent.WALK_CASUAL },
      { id: '3', label: '💤 Rest day', value: TodayIntent.REST_DAY },
      { id: '4', label: '🗓 Change plan', value: TodayIntent.CHANGE_PLAN },
    ];
  } else {
    // Case B: No active goal
    message = 'What would you like to do today?';
    
    quickReplies = [
      { id: '1', label: '⚡ Increase my pace', value: TodayIntent.CONTINUE_TRAINING, icon: '⚡' },
      { id: '2', label: '🏃 Run for fitness', value: TodayIntent.EASY_RUN, icon: '🏃' },
      { id: '3', label: '🚶 Casual walk', value: TodayIntent.WALK_CASUAL, icon: '🚶' },
    ];
  }

  // Add contextual encouragement if user hasn't run in a while
  if (daysSinceLastRun && daysSinceLastRun > 7) {
    message = `It's been ${daysSinceLastRun} days since your last run. ` + message;
  }

  return { message, quickReplies };
}

