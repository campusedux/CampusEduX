import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Key-value storage wrapper used for auth tokens and sensitive data.
 *
 * expo-secure-store is a native-only module: on Expo Web its native handle is
 * undefined, so calling SecureStore.getItemAsync throws
 * "ExpoSecureStore.default.getValueWithKeyAsync is not a function".
 * We therefore pick a backend per platform:
 *
 *   native  -> SecureStore (Keychain / EncryptedSharedPreferences)
 *   web     -> AsyncStorage (localStorage), which is what the browser can offer
 *
 * SecureStore also rejects keys containing characters outside
 * [A-Za-z0-9._-], so keys are sanitised before they reach it.
 */

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const isWeb = Platform.OS === "web";

const toSecureStoreKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_");

/** Native-only: SecureStore may still be unavailable (e.g. no keychain). */
let secureStoreAvailable: Promise<boolean> | null = null;
function isSecureStoreAvailable(): Promise<boolean> {
  if (isWeb) return Promise.resolve(false);
  if (!secureStoreAvailable) {
    secureStoreAvailable = SecureStore.isAvailableAsync().catch(() => false);
  }
  return secureStoreAvailable;
}

const asyncStorageBackend: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

const secureStoreBackend: KeyValueStorage = {
  getItem: (key) => SecureStore.getItemAsync(toSecureStoreKey(key)),
  setItem: (key, value) => SecureStore.setItemAsync(toSecureStoreKey(key), value),
  removeItem: (key) => SecureStore.deleteItemAsync(toSecureStoreKey(key)),
};

async function pickBackend(): Promise<KeyValueStorage> {
  return (await isSecureStoreAvailable()) ? secureStoreBackend : asyncStorageBackend;
}

class PlatformStorage implements KeyValueStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await (await pickBackend()).getItem(key);
    } catch (error) {
      console.error(`storage.getItem failed for key "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await (await pickBackend()).setItem(key, value);
    } catch (error) {
      console.error(`storage.setItem failed for key "${key}":`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await (await pickBackend()).removeItem(key);
    } catch (error) {
      console.error(`storage.removeItem failed for key "${key}":`, error);
    }
  }
}

/**
 * Secure-where-possible storage: SecureStore on native, localStorage on web.
 * Kept under the original `secureStorage` name so existing imports keep working.
 */
export const secureStorage = new PlatformStorage();

/**
 * Storage adapter handed to supabase-js for session persistence.
 *
 * Deliberately AsyncStorage on every platform (the adapter Supabase documents
 * for React Native): a Supabase session blob routinely exceeds SecureStore's
 * 2048-byte value limit, which on iOS silently warns and can drop the value —
 * that would break session persistence. Small sensitive flags still go through
 * `secureStorage` above, which uses the Keychain on native.
 */
export const supabaseAuthStorage: KeyValueStorage = asyncStorageBackend;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: "onboarding_complete",
  PROFILE_SETUP_COMPLETE: "profile_setup_complete",
  /** JSON snapshot of the signed-in user's profile, for instant cold starts. */
  CACHED_PROFILE: "cached_profile_v1",
} as const;

/**
 * Local profile cache (AsyncStorage on every platform).
 *
 * Lets the app paint the correct screen on cold start / web refresh before the
 * network round-trip to Supabase finishes, and keeps academic details (course /
 * branch / year) visible when the device is briefly offline. The Supabase row
 * is always the source of truth — this is only a startup accelerator and is
 * cleared on sign-out.
 */
export async function getCachedProfile<T = unknown>(): Promise<T | null> {
  try {
    const raw = await asyncStorageBackend.getItem(STORAGE_KEYS.CACHED_PROFILE);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.error("getCachedProfile failed:", error);
    return null;
  }
}

export async function setCachedProfile(profile: unknown): Promise<void> {
  try {
    await asyncStorageBackend.setItem(
      STORAGE_KEYS.CACHED_PROFILE,
      JSON.stringify(profile)
    );
  } catch (error) {
    console.error("setCachedProfile failed:", error);
  }
}

export async function clearCachedProfile(): Promise<void> {
  try {
    await asyncStorageBackend.removeItem(STORAGE_KEYS.CACHED_PROFILE);
  } catch (error) {
    console.error("clearCachedProfile failed:", error);
  }
}
