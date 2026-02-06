import { GpsPoint, Split } from '@/types';

// ============================================
// CONSTANTS
// ============================================

const EARTH_RADIUS_METERS = 6371000;
const SMOOTHING_WINDOW_SIZE = 5; // Points for rolling average
const MIN_ACCURACY_METERS = 20;  // Ignore points with worse accuracy
const MIN_SPEED_MPS = 0.3;       // Below this = standing still

// ============================================
// DISTANCE CALCULATIONS
// ============================================

/**
 * Calculate distance between two GPS points using Haversine formula
 */
export function calculateDistance(
  point1: GpsPoint,
  point2: GpsPoint
): number {
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate total distance from array of GPS points
 */
export function calculateTotalDistance(points: GpsPoint[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Skip low-accuracy points
    if (curr.accuracy > MIN_ACCURACY_METERS) continue;

    total += calculateDistance(prev, curr);
  }

  return total;
}

// ============================================
// PACE CALCULATIONS
// ============================================

/**
 * Calculate pace in min/km from speed in m/s
 */
export function speedToPace(speedMps: number): number {
  if (speedMps <= 0) return 0;
  // Convert m/s to min/km
  // 1 km = 1000m, 1 min = 60s
  // pace (min/km) = (1000 / speed) / 60 = 1000 / (speed * 60)
  return 1000 / (speedMps * 60);
}

/**
 * Calculate instantaneous pace from last two points
 */
export function calculateInstantPace(
  point1: GpsPoint,
  point2: GpsPoint
): number {
  const distance = calculateDistance(point1, point2);
  const timeSeconds = (point2.timestamp - point1.timestamp) / 1000;

  if (timeSeconds <= 0 || distance <= 0) return 0;

  const speedMps = distance / timeSeconds;
  return speedToPace(speedMps);
}

/**
 * Calculate smoothed pace using rolling average
 */
export function calculateSmoothedPace(
  points: GpsPoint[],
  windowSize: number = SMOOTHING_WINDOW_SIZE
): number {
  if (points.length < 2) return 0;

  // Get last N points for smoothing
  const recentPoints = points.slice(-Math.min(windowSize + 1, points.length));
  if (recentPoints.length < 2) return 0;

  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 1; i < recentPoints.length; i++) {
    const prev = recentPoints[i - 1];
    const curr = recentPoints[i];

    // Skip low-accuracy points
    if (curr.accuracy > MIN_ACCURACY_METERS) continue;

    const distance = calculateDistance(prev, curr);
    const time = (curr.timestamp - prev.timestamp) / 1000;

    // Skip if stationary
    if (time > 0 && distance / time >= MIN_SPEED_MPS) {
      totalDistance += distance;
      totalTime += time;
    }
  }

  if (totalTime <= 0 || totalDistance <= 0) return 0;

  const avgSpeedMps = totalDistance / totalTime;
  return speedToPace(avgSpeedMps);
}

/**
 * Calculate average pace for entire run
 */
export function calculateAveragePace(
  totalDistanceMeters: number,
  totalTimeSeconds: number
): number {
  if (totalTimeSeconds <= 0 || totalDistanceMeters <= 0) return 0;

  const avgSpeedMps = totalDistanceMeters / totalTimeSeconds;
  return speedToPace(avgSpeedMps);
}

// ============================================
// SPLITS
// ============================================

/**
 * Calculate splits (per-km) from GPS points
 */
export function calculateSplits(points: GpsPoint[]): Split[] {
  if (points.length < 2) return [];

  const splits: Split[] = [];
  let currentKmStart = 0;
  let currentKmStartTime = points[0].timestamp;
  let accumulatedDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (curr.accuracy > MIN_ACCURACY_METERS) continue;

    accumulatedDistance += calculateDistance(prev, curr);

    // Check if we've completed a kilometer
    const currentKm = Math.floor(accumulatedDistance / 1000);
    const targetKm = splits.length + 1;

    if (currentKm >= targetKm) {
      const durationSeconds = (curr.timestamp - currentKmStartTime) / 1000;
      const paceMinPerKm = durationSeconds / 60;

      splits.push({
        kmIndex: targetKm,
        durationSeconds,
        paceMinPerKm,
      });

      currentKmStart = i;
      currentKmStartTime = curr.timestamp;
    }
  }

  return splits;
}

// ============================================
// FORMATTING
// ============================================

/**
 * Format pace as "M:SS"
 */
export function formatPace(paceMinPerKm: number): string {
  if (paceMinPerKm <= 0 || !isFinite(paceMinPerKm)) return '--:--';

  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format pace with unit
 */
export function formatPaceWithUnit(
  paceMinPerKm: number,
  unit: 'km' | 'mi' = 'km'
): string {
  let pace = paceMinPerKm;
  if (unit === 'mi') {
    pace = paceMinPerKm * 1.60934; // Convert to min/mi
  }
  return `${formatPace(pace)} /${unit}`;
}

/**
 * Format distance
 */
export function formatDistance(
  meters: number,
  unit: 'km' | 'mi' = 'km'
): string {
  let value = meters / 1000; // to km
  if (unit === 'mi') {
    value = value / 1.60934;
  }
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * Format duration as "H:MM:SS" or "MM:SS"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// FILTERING
// ============================================

/**
 * Filter out low-quality GPS points
 */
export function filterGpsPoints(
  points: GpsPoint[],
  maxAccuracy: number = MIN_ACCURACY_METERS
): GpsPoint[] {
  return points.filter((p) => p.accuracy <= maxAccuracy);
}

/**
 * Detect if runner is stationary
 */
export function isStationary(points: GpsPoint[], windowSize: number = 3): boolean {
  if (points.length < windowSize) return false;

  const recent = points.slice(-windowSize);
  let totalDistance = 0;

  for (let i = 1; i < recent.length; i++) {
    totalDistance += calculateDistance(recent[i - 1], recent[i]);
  }

  const totalTime =
    (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
  if (totalTime <= 0) return true;

  const avgSpeed = totalDistance / totalTime;
  return avgSpeed < MIN_SPEED_MPS;
}

// ============================================
// UTILITIES
// ============================================

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate calories burned (rough approximation)
 * Based on MET values for running
 */
export function estimateCalories(
  distanceMeters: number,
  durationSeconds: number,
  weightKg: number = 70
): number {
  // Rough MET calculation based on speed
  const speedKmh = (distanceMeters / 1000) / (durationSeconds / 3600);
  
  let met: number;
  if (speedKmh < 6) met = 6;        // jogging
  else if (speedKmh < 8) met = 8;   // running 8km/h
  else if (speedKmh < 10) met = 10; // running 10km/h
  else if (speedKmh < 12) met = 11.5;
  else met = 13;                     // running 12+ km/h

  // Calories = MET × weight(kg) × time(hours)
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}
