import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { colors } from '@voxora/design-system';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { BootstrapScreen } from './src/screens/BootstrapScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { FoundationHomeScreen } from './src/screens/FoundationHomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RiveNativeValidationScreen } from './src/screens/RiveNativeValidationScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useConnectivity } from './src/hooks/useConnectivity';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background.base,
    card: colors.background.elevated,
    text: colors.text.primary,
    border: colors.border.subtle,
    primary: colors.brand.purple,
  },
};

function RootNavigator() {
  const { status, onboardingStatus, refreshProfile } = useAuth();
  const connectivity = useConnectivity();
  const [showSettings, setShowSettings] = useState(false);
  const [showRiveValidation, setShowRiveValidation] = useState(false);

  if (status === 'loading') {
    return <BootstrapScreen connectivity={connectivity} />;
  }

  if (__DEV__ && showRiveValidation) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RiveNativeValidation">
          {() => <RiveNativeValidationScreen onBack={() => setShowRiveValidation(false)} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  const needsOnboarding = status === 'signedIn' && onboardingStatus !== 'HANDOFF_READY';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'signedOut' ? (
        <Stack.Screen name="SignIn">
          {() => <SignInScreen onOpenRiveValidation={() => setShowRiveValidation(true)} />}
        </Stack.Screen>
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding">
          {() => (
            <OnboardingScreen
              onHandoffReady={() => {
                void refreshProfile();
              }}
            />
          )}
        </Stack.Screen>
      ) : showSettings ? (
        <Stack.Screen name="Settings">
          {() => <SettingsScreen onBack={() => setShowSettings(false)} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="FoundationHome">
          {() => (
            <FoundationHomeScreen
              connectivity={connectivity}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const linking = useMemo(
    () => ({
      prefixes: [Linking.createURL('/'), 'voxora://', 'https://voxora.co.za'],
      config: {
        screens: {
          SignIn: 'sign-in',
          Onboarding: 'onboarding',
          FoundationHome: 'home',
          Settings: 'settings',
        },
      },
    }),
    [],
  );

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navTheme} linking={linking}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
