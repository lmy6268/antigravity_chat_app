/**
 * Persistent & Secure Storage Management
 * 
 * - localStorage: Persistent non-sensitive data (User Profile, Locale, Admin Session)
 * - IndexedDB: Persistent sensitive data (E2EE Private Key)
 *   - Security Note: Keys are stored with `extractable: false` to prevent raw key theft.
 */

import { STORAGE_KEYS } from './constants/storage';
import type { UserDTO } from '@/types/dto';
import type { AdminDTO } from '@/types/admin';
import { importKey } from './crypto';

const PRIVATE_KEY_SESSION_ID = 'identity_private_key_jwk';

// ============================================================================
// Core Storage Helpers (Synchronous)
// ============================================================================

function saveData(key: string, data: any, storage: Storage = localStorage): void {
  try {
    const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
    storage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
  }
}

function loadData<T>(key: string, storage: Storage = localStorage): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = storage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return null;
  }
}

function removeData(key: string, storage: Storage = localStorage): void {
  storage.removeItem(key);
}

// ============================================================================
// Private Key Storage (IndexedDB - Persistent & Non-extractable)
// ============================================================================

const DB_NAME = 'antigravity_secure_storage_v3'; // Version incremented for safety
const STORE_NAME = 'secure_keys';
const PRIVATE_KEY_ID = 'identity_private_key';

/**
 * Initialize IndexedDB for secure key storage
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save Private Key to IndexedDB
 * Note: Key is already hardened (extractable: false) before calling this
 */
export async function savePrivateKey(privateKey: CryptoKey): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(privateKey, PRIVATE_KEY_ID);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load Private Key from IndexedDB
 * With Migration Logic: If not found in IndexedDB, check sessionStorage for legacy key.
 */
export async function loadPrivateKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined') return null;

  try {
    const db = await initDB();
    const storedKey = await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(PRIVATE_KEY_ID);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (storedKey) {
      // console.log('[Storage] Private key loaded from IndexedDB');
      return storedKey;
    }

    // --- MIGRATION LOGIC ---
    const legacyJwk = loadData<JsonWebKey>(PRIVATE_KEY_SESSION_ID, sessionStorage);
    if (legacyJwk) {
      console.log('[Storage] Migrating legacy key from sessionStorage to IndexedDB...');
      try {
        const migratedKey = await importKey(
          legacyJwk,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          ['decrypt', 'unwrapKey'],
          false, // Harden it
        );
        await savePrivateKey(migratedKey);
        return migratedKey;
      } catch (err) {
        console.error('[Storage] Migration failed:', err);
      }
    }

    console.warn('[Storage] No private key found in IndexedDB or sessionStorage');
    return null;
  } catch (error) {
    console.error('Error loading private key from IndexedDB:', error);
    return null;
  }
}

// ============================================================================
// User Profile Storage (localStorage)
// ============================================================================

export async function saveUserProfile(user: UserDTO): Promise<void> {
  saveData(STORAGE_KEYS.USER, user);
}

export async function loadUserProfile(): Promise<UserDTO | null> {
  return loadData<UserDTO>(STORAGE_KEYS.USER);
}

export async function clearUserSession(): Promise<void> {
  removeData(STORAGE_KEYS.USER);
  // Note: We keep the Private Key in IndexedDB for persistence on this device.
  // If we really want to clear it, we should call a separate 'clearSecureKeys' function.
}

// ============================================================================
// Locale Storage (localStorage)
// ============================================================================

export async function saveLocale(locale: string): Promise<void> {
  saveData(STORAGE_KEYS.LOCALE, locale);
}

export async function loadLocale(): Promise<string | null> {
  return loadData<string>(STORAGE_KEYS.LOCALE);
}

// ============================================================================
// Admin Storage (localStorage)
// ============================================================================

export async function saveAdminProfile(admin: AdminDTO): Promise<void> {
  saveData(STORAGE_KEYS.ADMIN, admin);
}

export async function loadAdminProfile(): Promise<AdminDTO | null> {
  return loadData<AdminDTO>(STORAGE_KEYS.ADMIN);
}

export async function clearAdminSession(): Promise<void> {
  removeData(STORAGE_KEYS.ADMIN);
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

export async function deleteOldDatabase(): Promise<void> {
  // Utility to delete the IndexedDB if it exists from the previous migration
  return new Promise((resolve) => {
    const DB_NAME = 'antigravity_secure_storage';
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      console.warn('Error deleting IndexedDB');
      resolve();
    };
    request.onblocked = () => {
      console.warn('IndexedDB deletion blocked');
      resolve();
    };
  });
}
