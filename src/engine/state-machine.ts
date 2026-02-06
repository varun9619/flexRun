import {
  SessionState,
  IntervalPlan,
  IntervalSegment,
  SessionIntent,
} from '@/types';
import { INTENT_METADATA } from '@/types/constants';
import { speakIntervalChange } from '@/services/speech.service';

// ============================================
// TYPES
// ============================================

export interface StateMachineState {
  currentState: SessionState;
  currentSegmentIndex: number;
  segmentStartTime: number;
  segmentElapsedSeconds: number;
}

export interface StateTransition {
  from: SessionState;
  to: SessionState;
  segment: IntervalSegment | null;
}

type TransitionCallback = (transition: StateTransition) => void;

// ============================================
// STATE MACHINE CLASS
// ============================================

export class SessionStateMachine {
  private state: SessionState = SessionState.IDLE;
  private plan: IntervalPlan | null = null;
  private intent: SessionIntent = SessionIntent.TRAINING;
  private currentSegmentIndex: number = 0;
  private segmentStartTime: number = 0;
  private onTransition: TransitionCallback | null = null;

  constructor(
    plan: IntervalPlan | null,
    intent: SessionIntent,
    onTransition?: TransitionCallback
  ) {
    this.plan = plan;
    this.intent = intent;
    this.onTransition = onTransition || null;
  }

  // ============================================
  // GETTERS
  // ============================================

  getState(): SessionState {
    return this.state;
  }

  getCurrentSegment(): IntervalSegment | null {
    if (!this.plan || this.currentSegmentIndex >= this.plan.segments.length) {
      return null;
    }
    return this.plan.segments[this.currentSegmentIndex];
  }

  getSegmentIndex(): number {
    return this.currentSegmentIndex;
  }

  getSegmentElapsedSeconds(currentTime: number): number {
    if (this.segmentStartTime === 0) return 0;
    return Math.floor((currentTime - this.segmentStartTime) / 1000);
  }

  getSegmentRemainingSeconds(currentTime: number): number {
    const segment = this.getCurrentSegment();
    if (!segment) return 0;
    const elapsed = this.getSegmentElapsedSeconds(currentTime);
    return Math.max(0, segment.durationSeconds - elapsed);
  }

  getTotalSegments(): number {
    return this.plan?.segments.length || 0;
  }

  getFullState(): StateMachineState {
    return {
      currentState: this.state,
      currentSegmentIndex: this.currentSegmentIndex,
      segmentStartTime: this.segmentStartTime,
      segmentElapsedSeconds: this.getSegmentElapsedSeconds(Date.now()),
    };
  }

  // ============================================
  // ACTIONS
  // ============================================

  start(): void {
    if (this.state !== SessionState.IDLE) return;

    const intentMeta = INTENT_METADATA[this.intent];

    // For WALK intent, go straight to a simple state
    if (this.intent === SessionIntent.WALK) {
      this.transitionTo(SessionState.WALK_INTERVAL, null);
      return;
    }

    // For plans, start with first segment
    if (this.plan && this.plan.segments.length > 0) {
      const firstSegment = this.plan.segments[0];
      this.currentSegmentIndex = 0;
      this.transitionTo(firstSegment.state, firstSegment);
    } else {
      // No plan, go to basic run
      this.transitionTo(SessionState.RUN_INTERVAL, null);
    }
  }

  /**
   * Call this every second during active run to check segment transitions
   */
  tick(currentTime: number): void {
    if (this.state === SessionState.IDLE || this.state === SessionState.COMPLETE) {
      return;
    }

    // If no plan, no automatic transitions
    if (!this.plan) return;

    const segment = this.getCurrentSegment();
    if (!segment) return;

    const elapsed = this.getSegmentElapsedSeconds(currentTime);

    // Check if segment is complete
    if (elapsed >= segment.durationSeconds) {
      this.advanceToNextSegment();
    }
  }

  private advanceToNextSegment(): void {
    if (!this.plan) return;

    const nextIndex = this.currentSegmentIndex + 1;

    if (nextIndex >= this.plan.segments.length) {
      // All segments complete
      this.transitionTo(SessionState.COMPLETE, null);
      return;
    }

    this.currentSegmentIndex = nextIndex;
    const nextSegment = this.plan.segments[nextIndex];
    this.transitionTo(nextSegment.state, nextSegment);
  }

  stop(): void {
    this.transitionTo(SessionState.COMPLETE, null);
  }

  reset(): void {
    this.state = SessionState.IDLE;
    this.currentSegmentIndex = 0;
    this.segmentStartTime = 0;
  }

  // ============================================
  // TRANSITIONS
  // ============================================

  private transitionTo(
    newState: SessionState,
    segment: IntervalSegment | null
  ): void {
    const previousState = this.state;
    this.state = newState;
    this.segmentStartTime = Date.now();

    const transition: StateTransition = {
      from: previousState,
      to: newState,
      segment,
    };

    // Speak transition if coaching enabled
    if (segment?.instruction) {
      speakIntervalChange(segment.instruction);
    } else if (newState === SessionState.COMPLETE) {
      // Don't speak here - let the run completion handler do it
    }

    // Notify callback
    if (this.onTransition) {
      this.onTransition(transition);
    }
  }
}

// ============================================
// FACTORY
// ============================================

export function createStateMachine(
  plan: IntervalPlan | null,
  intent: SessionIntent,
  onTransition?: TransitionCallback
): SessionStateMachine {
  return new SessionStateMachine(plan, intent, onTransition);
}

// ============================================
// UTILITIES
// ============================================

export function getTargetPaceForState(
  state: SessionState,
  segment: IntervalSegment | null,
  basePace: number
): { min: number; max: number } {
  if (segment) {
    return {
      min: segment.targetPaceMin,
      max: segment.targetPaceMax,
    };
  }

  // Fallback based on state type
  switch (state) {
    case SessionState.WARMUP:
    case SessionState.COOLDOWN:
      return { min: basePace + 1, max: basePace + 2 };
    case SessionState.RUN_INTERVAL:
      return { min: basePace - 0.5, max: basePace + 0.5 };
    case SessionState.WALK_INTERVAL:
      return { min: basePace + 2, max: basePace + 4 };
    default:
      return { min: basePace, max: basePace + 1 };
  }
}
