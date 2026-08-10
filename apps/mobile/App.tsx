import React, { useMemo } from 'react';
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
  const { status } = useAuth();
  const connectivity = useConnectivity();

  if (status === 'loading') {
    return <BootstrapScreen connectivity={connectivity} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'signedOut' ? (
        <Stack.Screen name="SignIn" component={SignInScreen} />
      ) : (
        <Stack.Screen name="FoundationHome">
          {() => <FoundationHomeScreen connectivity={connectivity} />}
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
          FoundationHome: 'home',
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
