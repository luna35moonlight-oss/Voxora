import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'voxora.accessToken';
const REFRESH_KEY = 'voxora.refreshToken';

/** Secure storage wrapper — Keychain / Keystore backed via expo-secure-store. */
export const secureSessionStore = {
  async saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
