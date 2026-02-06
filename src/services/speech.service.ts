import * as Speech from 'expo-speech';
import { PromptType, AudioPrompt } from '@/types';
import { PROMPT_COOLDOWNS } from '@/types/constants';

// ============================================
// TYPES
// ============================================

interface SpeechConfig {
  language: string;
  pitch: number;
  rate: number;
  volume: number;
}

interface QueuedPrompt extends AudioPrompt {
  queuedAt: number;
}

// ============================================
// STATE
// ============================================

let isEnabled = true;
let isSpeaking = false;
let promptQueue: QueuedPrompt[] = [];
let lastPromptTimes: Map<PromptType, number> = new Map();

const DEFAULT_CONFIG: SpeechConfig = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.95,  // Slightly slower for clarity while running
  volume: 1.0,
};

let currentConfig: SpeechConfig = { ...DEFAULT_CONFIG };

// ============================================
// CONFIGURATION
// ============================================

export function setSpeechEnabled(enabled: boolean): void {
  isEnabled = enabled;
  if (!enabled) {
    stopSpeaking();
    clearQueue();
  }
}

export function setSpeechConfig(config: Partial<SpeechConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function isSpeechEnabled(): boolean {
  return isEnabled;
}

// ============================================
// CORE SPEAKING
// ============================================

export async function speak(text: string): Promise<void> {
  if (!isEnabled) return;

  return new Promise((resolve, reject) => {
    isSpeaking = true;

    Speech.speak(text, {
      language: currentConfig.language,
      pitch: currentConfig.pitch,
      rate: currentConfig.rate,
      volume: currentConfig.volume,
      onDone: () => {
        isSpeaking = false;
        resolve();
        processQueue();
      },
      onError: (error) => {
        isSpeaking = false;
        reject(error);
        processQueue();
      },
      onStopped: () => {
        isSpeaking = false;
        resolve();
      },
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
  isSpeaking = false;
}

// ============================================
// PROMPT QUEUE (Priority-based)
// ============================================

export function queuePrompt(prompt: AudioPrompt): void {
  if (!isEnabled) return;

  // Check cooldown
  if (!canPlayPrompt(prompt.type)) {
    return;
  }

  const queuedPrompt: QueuedPrompt = {
    ...prompt,
    queuedAt: Date.now(),
  };

  // Insert by priority (lower number = higher priority)
  const insertIndex = promptQueue.findIndex(
    (p) => p.priority > queuedPrompt.priority
  );

  if (insertIndex === -1) {
    promptQueue.push(queuedPrompt);
  } else {
    promptQueue.splice(insertIndex, 0, queuedPrompt);
  }

  // Process immediately if not speaking
  if (!isSpeaking) {
    processQueue();
  }
}

function processQueue(): void {
  if (promptQueue.length === 0 || isSpeaking || !isEnabled) {
    return;
  }

  const prompt = promptQueue.shift();
  if (!prompt) return;

  // Update last prompt time
  lastPromptTimes.set(prompt.type, Date.now());

  speak(prompt.message).catch((error) => {
    console.error('Speech error:', error);
  });
}

function canPlayPrompt(type: PromptType): boolean {
  const lastTime = lastPromptTimes.get(type);
  if (!lastTime) return true;

  const cooldown = PROMPT_COOLDOWNS[type] * 1000; // Convert to ms
  return Date.now() - lastTime >= cooldown;
}

export function clearQueue(): void {
  promptQueue = [];
}

// ============================================
// PRE-BUILT PROMPTS
// ============================================

export function speakIntervalChange(instruction: string): void {
  queuePrompt({
    id: `interval_${Date.now()}`,
    type: PromptType.INTERVAL_CHANGE,
    message: instruction,
    priority: 1,
    cooldownSeconds: 0,
  });
}

export function speakPaceCorrection(
  isTooFast: boolean,
  currentPace: number,
  targetPace: number
): void {
  const direction = isTooFast ? 'slow down' : 'pick up the pace';
  const message = `${direction}. Current pace ${formatPace(currentPace)}, target ${formatPace(targetPace)}`;

  queuePrompt({
    id: `pace_${Date.now()}`,
    type: PromptType.PACE_CORRECTION,
    message,
    priority: 2,
    cooldownSeconds: 30,
  });
}

export function speakDistanceMilestone(km: number): void {
  queuePrompt({
    id: `distance_${Date.now()}`,
    type: PromptType.MOTIVATION,
    message: `${km} kilometer${km > 1 ? 's' : ''} complete. Keep going!`,
    priority: 4,
    cooldownSeconds: 0,
  });
}

export function speakMotivation(message: string): void {
  queuePrompt({
    id: `motivation_${Date.now()}`,
    type: PromptType.MOTIVATION,
    message,
    priority: 4,
    cooldownSeconds: 120,
  });
}

export function speakSessionStart(): void {
  queuePrompt({
    id: 'session_start',
    type: PromptType.INTERVAL_CHANGE,
    message: 'Run started. Let\'s go!',
    priority: 1,
    cooldownSeconds: 0,
  });
}

export function speakSessionEnd(
  distance: number,
  duration: number,
  avgPace: number
): void {
  const minutes = Math.floor(duration / 60);
  const distanceKm = (distance / 1000).toFixed(2);

  queuePrompt({
    id: 'session_end',
    type: PromptType.INTERVAL_CHANGE,
    message: `Run complete! ${distanceKm} kilometers in ${minutes} minutes. Average pace ${formatPace(avgPace)}. Great work!`,
    priority: 1,
    cooldownSeconds: 0,
  });
}

// ============================================
// UTILITIES
// ============================================

function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} per kilometer`;
}

export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  return Speech.getAvailableVoicesAsync();
}

export function resetCooldowns(): void {
  lastPromptTimes.clear();
}
