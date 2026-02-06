import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  RunSession,
  IntervalPlan,
  AIFeedback,
  SessionIntent,
  GoalType,
  Split,
} from '@/types';
import { INTENT_METADATA } from '@/types/constants';
import * as StorageService from '@/services/storage.service';

// ============================================
// STATE INTERFACE
// ============================================

interface SessionsState {
  sessions: RunSession[];
  plans: IntervalPlan[];
  feedbacks: AIFeedback[];
  isLoading: boolean;

  // Actions
  loadSessions: () => void;
  
  // Session CRUD
  createSession: (data: {
    duration: number;
    distance: number;
    avgPace: number;
    intentType: SessionIntent;
    goalType: GoalType;
    intervalPlanId: string | null;
    splits: Split[];
  }) => RunSession;
  
  getSession: (id: string) => RunSession | null;
  getRecentTrainingSessions: (limit?: number) => RunSession[];
  
  // Plan CRUD
  savePlan: (plan: IntervalPlan) => void;
  getPlan: (id: string) => IntervalPlan | null;
  
  // Feedback CRUD
  saveFeedback: (feedback: AIFeedback) => void;
  getFeedback: (runSessionId: string) => AIFeedback | null;
  
  // Stats
  getWeeklyStats: () => { distance: number; runs: number; time: number };
  getMonthlyStats: () => { distance: number; runs: number; avgPace: number };
}

// ============================================
// STORE
// ============================================

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  plans: [],
  feedbacks: [],
  isLoading: true,

  loadSessions: () => {
    const sessions = StorageService.getSessions();
    const plans = StorageService.getPlans();
    const feedbacks = StorageService.getFeedbackList();

    set({
      sessions,
      plans,
      feedbacks,
      isLoading: false,
    });
  },

  createSession: (data) => {
    const intentMeta = INTENT_METADATA[data.intentType];
    const now = Date.now();

    const session: RunSession = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      duration: data.duration,
      distance: data.distance,
      avgPace: data.avgPace,
      intentType: data.intentType,
      goalType: data.goalType,
      affectsProgression: intentMeta.affectsProgression,
      intervalPlanId: data.intervalPlanId,
      splits: data.splits,
      createdAt: now,
    };

    StorageService.saveSession(session);
    set((state) => ({
      sessions: [session, ...state.sessions],
    }));

    return session;
  },

  getSession: (id) => {
    return get().sessions.find((s) => s.id === id) || null;
  },

  getRecentTrainingSessions: (limit = 10) => {
    return get()
      .sessions.filter((s) => s.affectsProgression)
      .slice(0, limit);
  },

  savePlan: (plan) => {
    StorageService.savePlan(plan);
    set((state) => {
      const existing = state.plans.findIndex((p) => p.id === plan.id);
      if (existing >= 0) {
        const updated = [...state.plans];
        updated[existing] = plan;
        return { plans: updated };
      }
      return { plans: [plan, ...state.plans] };
    });
  },

  getPlan: (id) => {
    return get().plans.find((p) => p.id === id) || null;
  },

  saveFeedback: (feedback) => {
    StorageService.saveFeedback(feedback);
    set((state) => {
      const existing = state.feedbacks.findIndex((f) => f.id === feedback.id);
      if (existing >= 0) {
        const updated = [...state.feedbacks];
        updated[existing] = feedback;
        return { feedbacks: updated };
      }
      return { feedbacks: [feedback, ...state.feedbacks] };
    });
  },

  getFeedback: (runSessionId) => {
    return get().feedbacks.find((f) => f.runSessionId === runSessionId) || null;
  },

  getWeeklyStats: () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const weekSessions = get().sessions.filter((s) => s.date >= weekAgoStr);

    return {
      distance: weekSessions.reduce((sum, s) => sum + s.distance, 0),
      runs: weekSessions.length,
      time: weekSessions.reduce((sum, s) => sum + s.duration, 0),
    };
  },

  getMonthlyStats: () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    const monthSessions = get().sessions.filter((s) => s.date >= monthAgoStr);

    const totalDistance = monthSessions.reduce((sum, s) => sum + s.distance, 0);
    const totalTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      distance: totalDistance,
      runs: monthSessions.length,
      avgPace: totalTime > 0 && totalDistance > 0
        ? (totalTime / 60) / (totalDistance / 1000)
        : 0,
    };
  },
}));
