import { PromptType, SessionState } from '@/types';
import { PROMPT_COOLDOWNS } from '@/types/constants';
import {
  speakPaceCorrection,
  speakDistanceMilestone,
  speakMotivation,
  speakIntervalChange,
} from '@/services/speech.service';

// ============================================
// TYPES
// ============================================

interface PromptEngineConfig {
  enabled: boolean;
  paceToleranceMinPerKm: number;  // How far off pace before correction
  distanceMilestoneMeters: number; // Announce every X meters (1000 = 1km)
  motivationIntervalSeconds: number;
}

interface PromptEngineState {
  lastPromptTimes: Map<PromptType, number>;
  lastDistanceMilestone: number;
  lastMotivationTime: number;
  sessionStartTime: number;
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_CONFIG: PromptEngineConfig = {
  enabled: true,
  paceToleranceMinPerKm: 0.5,    // 30 seconds per km
  distanceMilestoneMeters: 1000,  // Every 1km
  motivationIntervalSeconds: 300, // Every 5 minutes
};

// ============================================
// MOTIVATION MESSAGES
// ============================================

const MOTIVATION_MESSAGES = {
  general: [
    'You\'re doing great, keep it up!',
    'Strong running! Stay focused.',
    'Looking good! Maintain your rhythm.',
    'Great effort! Keep pushing.',
    'You\'ve got this! Stay strong.',
  ],
  halfway: [
    'Halfway there! Great job.',
    'Past the halfway mark, finish strong!',
  ],
  almostDone: [
    'Almost there! Give it everything.',
    'Final push! You\'re so close.',
    'Nearly done! Strong finish!',
  ],
};

// ============================================
// PROMPT ENGINE CLASS
// ============================================

export class PromptEngine {
  private config: PromptEngineConfig;
  private state: PromptEngineState;

  constructor(config?: Partial<PromptEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      lastPromptTimes: new Map(),
      lastDistanceMilestone: 0,
      lastMotivationTime: 0,
      sessionStartTime: 0,
    };
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  reset(): void {
    this.state = {
      lastPromptTimes: new Map(),
      lastDistanceMilestone: 0,
      lastMotivationTime: 0,
      sessionStartTime: Date.now(),
    };
  }

  // ============================================
  // RULE-BASED TRIGGERS
  // ============================================

  /**
   * Call every tick to evaluate prompt rules
   */
  evaluate(context: {
    currentState: SessionState;
    currentPace: number;
    targetPaceMin: number;
    targetPaceMax: number;
    totalDistanceMeters: number;
    totalElapsedSeconds: number;
    totalPlannedSeconds: number;
  }): void {
    if (!this.config.enabled) return;
    if (context.currentState === SessionState.IDLE) return;
    if (context.currentState === SessionState.COMPLETE) return;

    const now = Date.now();

    // 1. Pace correction (only during active run states)
    if (
      context.currentState === SessionState.RUN_INTERVAL ||
      context.currentState === SessionState.WARMUP ||
      context.currentState === SessionState.COOLDOWN
    ) {
      this.checkPaceCorrection(
        context.currentPace,
        context.targetPaceMin,
        context.targetPaceMax,
        now
      );
    }

    // 2. Distance milestones
    this.checkDistanceMilestone(context.totalDistanceMeters, now);

    // 3. Motivation prompts
    this.checkMotivation(
      context.totalElapsedSeconds,
      context.totalPlannedSeconds,
      now
    );
  }

  // ============================================
  // PACE CORRECTION
  // ============================================

  private checkPaceCorrection(
    currentPace: number,
    targetMin: number,
    targetMax: number,
    now: number
  ): void {
    if (!this.canPrompt(PromptType.PACE_CORRECTION, now)) return;

    const tolerance = this.config.paceToleranceMinPerKm;
    const targetMid = (targetMin + targetMax) / 2;

    // Too fast (pace is lower when faster)
    if (currentPace < targetMin - tolerance) {
      speakPaceCorrection(true, currentPace, targetMid);
      this.markPrompted(PromptType.PACE_CORRECTION, now);
      return;
    }

    // Too slow (pace is higher when slower)
    if (currentPace > targetMax + tolerance) {
      speakPaceCorrection(false, currentPace, targetMid);
      this.markPrompted(PromptType.PACE_CORRECTION, now);
    }
  }

  // ============================================
  // DISTANCE MILESTONES
  // ============================================

  private checkDistanceMilestone(distanceMeters: number, now: number): void {
    const milestoneInterval = this.config.distanceMilestoneMeters;
    const currentMilestone = Math.floor(distanceMeters / milestoneInterval);

    if (currentMilestone > this.state.lastDistanceMilestone) {
      this.state.lastDistanceMilestone = currentMilestone;
      speakDistanceMilestone(currentMilestone);
    }
  }

  // ============================================
  // MOTIVATION
  // ============================================

  private checkMotivation(
    elapsedSeconds: number,
    plannedSeconds: number,
    now: number
  ): void {
    if (!this.canPrompt(PromptType.MOTIVATION, now)) return;

    const timeSinceLastMotivation =
      (now - this.state.lastMotivationTime) / 1000;
    if (timeSinceLastMotivation < this.config.motivationIntervalSeconds) {
      return;
    }

    const progress = plannedSeconds > 0 ? elapsedSeconds / plannedSeconds : 0;
    let message: string;

    if (progress >= 0.9) {
      message = this.pickRandom(MOTIVATION_MESSAGES.almostDone);
    } else if (progress >= 0.45 && progress <= 0.55) {
      message = this.pickRandom(MOTIVATION_MESSAGES.halfway);
    } else {
      message = this.pickRandom(MOTIVATION_MESSAGES.general);
    }

    speakMotivation(message);
    this.state.lastMotivationTime = now;
    this.markPrompted(PromptType.MOTIVATION, now);
  }

  // ============================================
  // COOLDOWN MANAGEMENT
  // ============================================

  private canPrompt(type: PromptType, now: number): boolean {
    const lastTime = this.state.lastPromptTimes.get(type);
    if (!lastTime) return true;

    const cooldownMs = PROMPT_COOLDOWNS[type] * 1000;
    return now - lastTime >= cooldownMs;
  }

  private markPrompted(type: PromptType, now: number): void {
    this.state.lastPromptTimes.set(type, now);
  }

  // ============================================
  // UTILITIES
  // ============================================

  private pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ============================================
// FACTORY
// ============================================

export function createPromptEngine(
  config?: Partial<PromptEngineConfig>
): PromptEngine {
  return new PromptEngine(config);
}
