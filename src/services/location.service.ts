import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GpsPoint } from '@/types';

// ============================================
// CONSTANTS
// ============================================

const LOCATION_TASK_NAME = 'FLEXRUN_BACKGROUND_LOCATION';

const LOCATION_CONFIG: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,        // 1 second
  distanceInterval: 5,       // 5 meters
};

// ============================================
// TYPES
// ============================================

type LocationCallback = (point: GpsPoint) => void;

let locationSubscription: Location.LocationSubscription | null = null;
let locationCallback: LocationCallback | null = null;

// ============================================
// PERMISSIONS
// ============================================

export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  // Request foreground permission first
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  const foreground = foregroundStatus === 'granted';

  if (!foreground) {
    return { foreground: false, background: false };
  }

  // Request background permission
  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();
  const background = backgroundStatus === 'granted';

  return { foreground, background };
}

export async function checkLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();

  return {
    foreground: foreground.status === 'granted',
    background: background.status === 'granted',
  };
}

// ============================================
// FOREGROUND TRACKING
// ============================================

export async function startLocationTracking(
  onLocation: LocationCallback
): Promise<boolean> {
  try {
    const permissions = await checkLocationPermissions();
    if (!permissions.foreground) {
      console.warn('Location permission not granted');
      return false;
    }

    locationCallback = onLocation;

    locationSubscription = await Location.watchPositionAsync(
      LOCATION_CONFIG,
      (location) => {
        const point = locationToGpsPoint(location);
        if (locationCallback) {
          locationCallback(point);
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    return false;
  }
}

export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  locationCallback = null;
}

// ============================================
// BACKGROUND TRACKING (for when app is in background)
// ============================================

export async function startBackgroundLocationTracking(): Promise<boolean> {
  try {
    const permissions = await checkLocationPermissions();
    if (!permissions.background) {
      console.warn('Background location permission not granted');
      return false;
    }

    const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      console.warn('Background location task not defined');
      return false;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      return true; // Already running
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: 'FlexRun',
        notificationBody: 'Tracking your run...',
        notificationColor: '#1a1a2e',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    return true;
  } catch (error) {
    console.error('Failed to start background location:', error);
    return false;
  }
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.error('Failed to stop background location:', error);
  }
}

// ============================================
// UTILITIES
// ============================================

function locationToGpsPoint(location: Location.LocationObject): GpsPoint {
  return {
    timestamp: location.timestamp,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy || 0,
    speed: location.coords.speed,
  };
}

export async function getCurrentLocation(): Promise<GpsPoint | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return locationToGpsPoint(location);
  } catch (error) {
    console.error('Failed to get current location:', error);
    return null;
  }
}

// ============================================
// TASK DEFINITION (must be called at app startup)
// ============================================

export function defineBackgroundLocationTask(
  onLocation: (points: GpsPoint[]) => void
): void {
  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
    if (error) {
      console.error('Background location error:', error);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      const points = locations.map(locationToGpsPoint);
      onLocation(points);
    }
  });
}

export { LOCATION_TASK_NAME };
