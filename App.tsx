import React from 'react';
// Polyfill crypto.getRandomValues for uuid in Expo (uses expo-random)
import * as Random from 'expo-random';

if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      const bytes = Random.getRandomBytes(arr.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes[i];
      return arr;
    },
  };
}
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
