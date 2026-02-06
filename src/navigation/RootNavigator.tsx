import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useProfileStore } from '@/store/profile.store';

// Screens
import { OnboardingScreen } from '@/screens/Onboarding/OnboardingScreen';
import { AIEntryScreen } from '@/screens/AIEntry/AIEntryScreen';
import { HomeScreen } from '@/screens/Home/HomeScreen';
import { PreRunScreen } from '@/screens/PreRun/PreRunScreen';
import { ActiveRunScreen } from '@/screens/ActiveRun/ActiveRunScreen';
import { PostRunScreen } from '@/screens/PostRun/PostRunScreen';
import { HistoryScreen } from '@/screens/History/HistoryScreen';
import { SettingsScreen } from '@/screens/Settings/SettingsScreen';

// ============================================
// TYPES
// ============================================

export type RootStackParamList = {
  Onboarding: undefined;
  AIEntry: undefined;
  Home: undefined;
  PreRun: { intent?: string };
  ActiveRun: { mode?: string; affectsProgression?: boolean };
  PostRun: { sessionId: string };
  History: undefined;
  Settings: undefined;
};

// ============================================
// NAVIGATOR
// ============================================

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isOnboardingComplete, isLoading } = useProfileStore();

  React.useEffect(() => {
    useProfileStore.getState().loadProfile();
  }, []);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <Stack.Navigator
      initialRouteName={isOnboardingComplete ? 'AIEntry' : 'Onboarding'}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#1a1a2e',
        },
      }}
    >
      {!isOnboardingComplete ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="AIEntry"
            component={AIEntryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'FlexRun' }}
          />
          <Stack.Screen
            name="PreRun"
            component={PreRunScreen}
            options={{ title: 'Start Run' }}
          />
          <Stack.Screen
            name="ActiveRun"
            component={ActiveRunScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="PostRun"
            component={PostRunScreen}
            options={{
              title: 'Run Complete',
              headerBackVisible: false,
            }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Run History' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
