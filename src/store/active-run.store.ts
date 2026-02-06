import { create } from 'zustand';
import {
  ActiveRun,
  SessionIntent,
  SessionState,
  IntervalPlan,
  GpsPoint,
  PromptType,
} from '@/types';
import {
  SessionStateMachine,
  createStateMachine,
  StateTransition,
} from '@/engine/state-machine';
import { PromptEngine, createPromptEngine } from '@/engine/prompt-engine';
import {
  calculateTotalDistance,
  calculateSmoothedPace,
  calculateSplits,
  calculateAveragePace,
} from '@/engine/pace-calculator';
import {
  startLocationTracking,
  stopLocationTracking,
} from '@/services/location.service';
import {
  speakSessionStart,
  speakSessionEnd,
  setSpeechEnabled,
} from '@/services/speech.service';
import { INTENT_METADATA } from '@/types/constants';

// ============================================
// STATE INTERFACE
// ============================================

interface ActiveRunState {
  // Run state
  activeRun: ActiveRun | null;
  isRunning: boolean;
  
  // Engines
  stateMachine: SessionStateMachine | null;
  promptEngine: PromptEngine | null;
  
  // Timers
  tickInterval: ReturnType<typeof setInterval> | null;

  // Actions
  startRun: (intent: SessionIntent, plan: IntervalPlan | null) => Promise<boolean>;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: () => ActiveRun | null;
  
  // Internal
  addGpsPoint: (point: GpsPoint) => void;
  tick: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const createInitialActiveRun = (
  intent: SessionIntent,
  plan: IntervalPlan | null
): ActiveRun => ({
  sessionIntent: intent,
  intervalPlan: plan,
  currentState: SessionState.IDLE,
  currentSegmentIndex: 0,
  segmentStartTime: 0,
  segmentElapsedSeconds: 0,
  startedAt: Date.now(),
  totalElapsedSeconds: 0,
  isPaused: false,
  pausedAt: null,
  totalPausedSeconds: 0,
  gpsPoints: [],
  totalDistanceMeters: 0,
  currentPace: 0,
  lastPromptType: null,
  lastPromptTime: 0,
  promptsDelivered: [],
});

// ============================================
// STORE
// ============================================

export const useActiveRunStore = create<ActiveRunState>((set, get) => ({
  activeRun: null,
  isRunning: false,
  stateMachine: null,
  promptEngine: null,
  tickInterval: null,

  startRun: async (intent, plan) => {
    const { tickInterval } = get();
    
    // Clean up any existing run
    if (tickInterval) {
      clearInterval(tickInterval);
    }

    // Create active run state
    const activeRun = createInitialActiveRun(intent, plan);

    // Create state machine
    const stateMachine = createStateMachine(
      plan,
      intent,
      (transition: StateTransition) => {
        // Update active run state on transitions
        set((state) => {
          if (!state.activeRun) return state;
          return {
            activeRun: {
              ...state.activeRun,
              currentState: transition.to,
              currentSegmentIndex: state.stateMachine?.getSegmentIndex() ?? 0,
              segmentStartTime: Date.now(),
              segmentElapsedSeconds: 0,
            },
          };
        });
      }
    );

    // Create prompt engine
    const intentMeta = INTENT_METADATA[intent];
    const promptEngine = createPromptEngine({
      enabled: intentMeta.coachingIntensity !== 'off',
    });

    // Configure speech based on intent
    setSpeechEnabled(intentMeta.coachingIntensity !== 'off');

    // Start location tracking
    const locationStarted = await startLocationTracking((point) => {
      get().addGpsPoint(point);
    });

    if (!locationStarted) {
      console.error('Failed to start location tracking');
      return false;
    }

    // Start state machine
    stateMachine.start();

    // Start tick interval (every second)
    const interval = setInterval(() => {
      get().tick();
    }, 1000);

    // Announce start
    speakSessionStart();

    set({
      activeRun: {
        ...activeRun,
        currentState: stateMachine.getState(),
      },
      isRunning: true,
      stateMachine,
      promptEngine,
      tickInterval: interval,
    });

    return true;
  },

  pauseRun: () => {
    set((state) => {
      if (!state.activeRun || state.activeRun.isPaused) return state;

      return {
        activeRun: {
          ...state.activeRun,
          isPaused: true,
          pausedAt: Date.now(),
        },
        isRunning: false,
      };
    });
  },

  resumeRun: () => {
    set((state) => {
      if (!state.activeRun || !state.activeRun.isPaused) return state;

      const pausedDuration = state.activeRun.pausedAt
        ? Date.now() - state.activeRun.pausedAt
        : 0;

      return {
        activeRun: {
          ...state.activeRun,
          isPaused: false,
          pausedAt: null,
          totalPausedSeconds:
            state.activeRun.totalPausedSeconds + pausedDuration / 1000,
        },
        isRunning: true,
      };
    });
  },

  stopRun: () => {
    const { activeRun, tickInterval, stateMachine } = get();

    // Stop timer
    if (tickInterval) {
      clearInterval(tickInterval);
    }

    // Stop location tracking
    stopLocationTracking();

    // Stop state machine
    if (stateMachine) {
      stateMachine.stop();
    }

    // Calculate final metrics
    if (activeRun) {
      const avgPace = calculateAveragePace(
        activeRun.totalDistanceMeters,
        activeRun.totalElapsedSeconds
      );

      // Announce completion
      speakSessionEnd(
        activeRun.totalDistanceMeters,
        activeRun.totalElapsedSeconds,
        avgPace
      );
    }

    const finalRun = activeRun;

    set({
      activeRun: null,
      isRunning: false,
      stateMachine: null,
      promptEngine: null,
      tickInterval: null,
    });

    return finalRun;
  },

  addGpsPoint: (point) => {
    set((state) => {
      if (!state.activeRun || state.activeRun.isPaused) return state;

      const newPoints = [...state.activeRun.gpsPoints, point];
      const totalDistance = calculateTotalDistance(newPoints);
      const currentPace = calculateSmoothedPace(newPoints);

      return {
        activeRun: {
          ...state.activeRun,
          gpsPoints: newPoints,
          totalDistanceMeters: totalDistance,
          currentPace,
        },
      };
    });
  },

  tick: () => {
    const { activeRun, stateMachine, promptEngine, isRunning } = get();

    if (!activeRun || !isRunning || activeRun.isPaused) return;

    const now = Date.now();

    // Update elapsed time
    const totalElapsedSeconds = Math.floor(
      (now - activeRun.startedAt - activeRun.totalPausedSeconds * 1000) / 1000
    );

    // Tick state machine for segment transitions
    if (stateMachine) {
      stateMachine.tick(now);
    }

    // Get current segment info
    const currentSegment = stateMachine?.getCurrentSegment();
    const segmentElapsed = stateMachine?.getSegmentElapsedSeconds(now) ?? 0;

    // Evaluate prompt rules
    if (promptEngine && currentSegment) {
      promptEngine.evaluate({
        currentState: activeRun.currentState,
        currentPace: activeRun.currentPace,
        targetPaceMin: currentSegment.targetPaceMin,
        targetPaceMax: currentSegment.targetPaceMax,
        totalDistanceMeters: activeRun.totalDistanceMeters,
        totalElapsedSeconds,
        totalPlannedSeconds: activeRun.intervalPlan?.totalDurationSeconds ?? 0,
      });
    }

    // Check if state machine completed
    if (stateMachine?.getState() === SessionState.COMPLETE) {
      get().stopRun();
      return;
    }

    set((state) => {
      if (!state.activeRun) return state;
      return {
        activeRun: {
          ...state.activeRun,
          totalElapsedSeconds,
          segmentElapsedSeconds: segmentElapsed,
          currentState: stateMachine?.getState() ?? state.activeRun.currentState,
          currentSegmentIndex: stateMachine?.getSegmentIndex() ?? 0,
        },
      };
    });
  },
}));

// ============================================
// SELECTORS
// ============================================

export const selectCurrentSegment = (state: ActiveRunState) => {
  return state.stateMachine?.getCurrentSegment() ?? null;
};

export const selectSegmentRemaining = (state: ActiveRunState) => {
  if (!state.stateMachine) return 0;
  return state.stateMachine.getSegmentRemainingSeconds(Date.now());
};

export const selectSplits = (state: ActiveRunState) => {
  if (!state.activeRun) return [];
  return calculateSplits(state.activeRun.gpsPoints);
};
