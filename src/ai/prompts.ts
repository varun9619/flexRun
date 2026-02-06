import {
  RunnerProfile,
  RunSession,
  IntervalPlan,
  GoalType,
} from '@/types';
import { GOAL_METADATA } from '@/types/constants';

// ============================================
// SYSTEM PROMPT
// ============================================

export const SYSTEM_PROMPT = `You are an expert running coach AI assistant for the FlexRun app. Your role is to:

1. Generate personalized running sessions based on user goals and fitness level
2. Provide constructive post-run feedback
3. Adjust training difficulty based on performance

IMPORTANT RULES:
- Be encouraging but honest
- Focus on gradual progression (no more than 10% weekly volume increase)
- Prioritize injury prevention
- Consider the user's stated goal when designing sessions
- Keep feedback concise and actionable

When generating sessions, you must respond with valid JSON matching the expected schema.
When generating feedback, you must respond with valid JSON matching the expected schema.

Goal-specific guidance:
- IMPROVE_PACE: Focus on interval training and tempo runs
- RACE_5K: Mix of speed work and threshold training
- RACE_10K: Tempo runs and longer intervals
- RACE_HALF_MARATHON: Long runs and aerobic base building
- FITNESS: Varied sessions, moderate intensity
- BUILD_HABIT: Short, achievable sessions, consistency over intensity`;

// ============================================
// SESSION GENERATION PROMPT
// ============================================

export function generateSessionPrompt(
  profile: RunnerProfile,
  recentRuns: RunSession[],
  currentDifficulty: number
): string {
  const goalMeta = GOAL_METADATA[profile.goalType];
  
  const recentSummary = recentRuns.slice(0, 5).map((run) => ({
    date: run.date,
    distance_km: (run.distance / 1000).toFixed(1),
    duration_min: Math.round(run.duration / 60),
    avg_pace: run.avgPace.toFixed(1),
    intent: run.intentType,
  }));

  return `Generate a running session for this runner:

PROFILE:
- Goal: ${goalMeta.label} (${profile.goalType})
- Experience: ${profile.experienceLevel}
- Base comfortable pace: ${profile.basePace} min/km
- Base distance: ${profile.baseDistance} km
- Weekly training days: ${profile.weeklyDays}

CURRENT TRAINING STATE:
- Difficulty level: ${currentDifficulty}/10
- Recent runs: ${JSON.stringify(recentSummary, null, 2)}

REQUIREMENTS:
- Design a session appropriate for their goal and current difficulty
- Include warmup and cooldown segments
- Total duration should be between 20-60 minutes depending on difficulty
- Pace targets should be realistic based on their base pace

Respond with JSON in this exact format:
{
  "segments": [
    {
      "type": "warmup" | "run" | "recovery" | "cooldown",
      "duration_seconds": number,
      "pace_min": number,
      "pace_max": number,
      "instruction": "string describing the segment"
    }
  ],
  "total_distance_km": number,
  "rationale": "Brief explanation of why this session",
  "difficulty": number (1-10),
  "focus_area": "What this session targets"
}`;
}

// ============================================
// FEEDBACK GENERATION PROMPT
// ============================================

export function generateFeedbackPrompt(
  profile: RunnerProfile,
  session: RunSession,
  plan: IntervalPlan | null
): string {
  const goalMeta = GOAL_METADATA[profile.goalType];
  
  const sessionSummary = {
    distance_km: (session.distance / 1000).toFixed(2),
    duration_min: Math.round(session.duration / 60),
    avg_pace: session.avgPace.toFixed(2),
    intent: session.intentType,
    splits: session.splits.map((s) => ({
      km: s.kmIndex,
      pace: s.paceMinPerKm.toFixed(2),
    })),
  };

  const planSummary = plan
    ? {
        planned_duration_min: Math.round(plan.totalDurationSeconds / 60),
        planned_distance_km: plan.totalDistanceKm,
        difficulty: plan.difficulty,
        segments: plan.segments.length,
      }
    : null;

  return `Analyze this completed run and provide feedback:

RUNNER PROFILE:
- Goal: ${goalMeta.label}
- Experience: ${profile.experienceLevel}
- Base pace: ${profile.basePace} min/km

COMPLETED RUN:
${JSON.stringify(sessionSummary, null, 2)}

${planSummary ? `PLANNED SESSION:\n${JSON.stringify(planSummary, null, 2)}` : 'No structured plan - freestyle run'}

ANALYSIS REQUIRED:
1. Assess pace execution (too slow / on target / too fast)
2. Evaluate effort level
3. Identify one positive highlight
4. Suggest one improvement
5. Recommend difficulty adjustment (-1, 0, or +1)
6. Hint at what the next session should focus on

Respond with JSON in this exact format:
{
  "summary": "2-3 sentence overall assessment",
  "positive_highlight": "What they did well",
  "improvement_tip": "One actionable suggestion",
  "pace_assessment": "too_slow" | "on_target" | "too_fast",
  "effort_assessment": "easy" | "moderate" | "hard" | "overreached",
  "difficulty_adjustment": -1 | 0 | 1,
  "next_session_hint": "Brief suggestion for next session"
}`;
}

// ============================================
// COACHING MESSAGE TEMPLATES
// ============================================

export const COACHING_MESSAGES = {
  warmup: {
    start: [
      "Let's start with an easy warm-up. Keep it relaxed.",
      "Beginning warm-up phase. Nice and easy.",
      "Warm-up time. Shake out the legs and find your rhythm.",
    ],
    end: [
      "Warm-up complete. Ready for the main set.",
      "Good warm-up. Time to pick it up.",
    ],
  },
  
  intervals: {
    workStart: [
      "Work interval! Push the pace.",
      "Let's go! Time to work.",
      "Pick it up! Hard effort now.",
    ],
    recoveryStart: [
      "Recovery. Slow it down and breathe.",
      "Easy jog. Catch your breath.",
      "Recovery interval. Nice and easy.",
    ],
  },
  
  paceCorrection: {
    tooFast: [
      "You're going too fast. Save energy for later.",
      "Slow down a bit. Pace yourself.",
      "Easy! Keep something in reserve.",
    ],
    tooSlow: [
      "Try to pick up the pace a little.",
      "You can push a bit harder here.",
      "Let's find a stronger rhythm.",
    ],
  },
  
  motivation: {
    general: [
      "You're doing great! Keep it up.",
      "Strong running! Stay focused.",
      "Looking good out there!",
      "Keep pushing! You've got this.",
    ],
    halfway: [
      "Halfway there! You're crushing it.",
      "Past the midpoint. Finish strong!",
    ],
    almostDone: [
      "Almost done! Final push!",
      "So close! Give it everything.",
      "Last effort! You can do this!",
    ],
  },
  
  cooldown: {
    start: [
      "Cool-down time. Let your heart rate come down.",
      "Easy jog to finish. Great work today!",
      "Beginning cool-down. Nice and relaxed.",
    ],
  },
  
  complete: {
    standard: [
      "Run complete! Great effort today.",
      "You did it! Excellent work.",
      "Session finished. Well done!",
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function pickRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getWarmupMessage(): string {
  return pickRandomMessage(COACHING_MESSAGES.warmup.start);
}

export function getIntervalStartMessage(isWork: boolean): string {
  return pickRandomMessage(
    isWork
      ? COACHING_MESSAGES.intervals.workStart
      : COACHING_MESSAGES.intervals.recoveryStart
  );
}

export function getPaceCorrectionMessage(isTooFast: boolean): string {
  return pickRandomMessage(
    isTooFast
      ? COACHING_MESSAGES.paceCorrection.tooFast
      : COACHING_MESSAGES.paceCorrection.tooSlow
  );
}

export function getMotivationMessage(progress: number): string {
  if (progress >= 0.9) {
    return pickRandomMessage(COACHING_MESSAGES.motivation.almostDone);
  }
  if (progress >= 0.45 && progress <= 0.55) {
    return pickRandomMessage(COACHING_MESSAGES.motivation.halfway);
  }
  return pickRandomMessage(COACHING_MESSAGES.motivation.general);
}
