import { useCallback, useEffect, useRef, useState } from 'react';

const PIN_STORAGE_KEY = 'saversstop-app-pin';
const ACTIVITY_STORAGE_KEY = 'saversstop-app-last-activity';
const LOCK_SIGNAL_STORAGE_KEY = 'saversstop-app-lock-signal';
const PIN_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const PBKDF2_ITERATIONS = 150_000;

type StoredPin = {
  salt: string;
  verifier: string;
};

function readStoredPin(): StoredPin | null {
  const storedValue = window.localStorage.getItem(PIN_STORAGE_KEY);
  if (!storedValue) return null;

  try {
    const record = JSON.parse(storedValue) as Partial<StoredPin>;
    if (
      typeof record.salt !== 'string' ||
      typeof record.verifier !== 'string'
    ) {
      return null;
    }
    return { salt: record.salt, verifier: record.verifier };
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function copyToArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

async function deriveVerifier(pin: string, salt: Uint8Array) {
  const key = await window.crypto.subtle.importKey(
    'raw',
    copyToArrayBuffer(new TextEncoder().encode(pin)),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const verifier = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: copyToArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  );

  return toBase64(new Uint8Array(verifier));
}

async function createStoredPin(pin: string): Promise<StoredPin> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return {
    salt: toBase64(salt),
    verifier: await deriveVerifier(pin, salt),
  };
}

function matchesVerifier(candidate: string, stored: string) {
  const candidateBytes = fromBase64(candidate);
  const storedBytes = fromBase64(stored);
  if (candidateBytes.length !== storedBytes.length) return false;

  let difference = 0;
  for (let index = 0; index < candidateBytes.length; index += 1) {
    difference |= candidateBytes[index] ^ storedBytes[index];
  }
  return difference === 0;
}

export function useAppPin() {
  const initialRecord = readStoredPin();
  const [hasPin, setHasPin] = useState(Boolean(initialRecord));
  const [isLocked, setIsLocked] = useState(Boolean(initialRecord));
  const hasPinRef = useRef(Boolean(initialRecord));
  const isLockedRef = useRef(Boolean(initialRecord));
  const pinRecordRef = useRef(initialRecord);
  const lastActivityRef = useRef(0);
  const lastActivityWriteRef = useRef(0);

  const updateLockState = useCallback((locked: boolean) => {
    isLockedRef.current = locked;
    setIsLocked(locked);
  }, []);

  const lockNow = useCallback(() => {
    if (!hasPinRef.current) return;
    updateLockState(true);
    window.localStorage.setItem(LOCK_SIGNAL_STORAGE_KEY, String(Date.now()));
  }, [updateLockState]);

  const recordActivity = useCallback(() => {
    if (!hasPinRef.current || isLockedRef.current) return;

    const now = Date.now();
    lastActivityRef.current = now;
    if (now - lastActivityWriteRef.current >= 5_000) {
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
      lastActivityWriteRef.current = now;
    }
  }, []);

  const createPin = useCallback(async (pin: string) => {
    if (!/^\d{6}$/.test(pin) || hasPinRef.current) return false;

    const record = await createStoredPin(pin);
    window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(record));
    pinRecordRef.current = record;
    hasPinRef.current = true;
    setHasPin(true);
    isLockedRef.current = false;
    setIsLocked(false);
    lastActivityRef.current = Date.now();
    window.localStorage.setItem(
      ACTIVITY_STORAGE_KEY,
      String(lastActivityRef.current),
    );
    return true;
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const record = pinRecordRef.current ?? readStoredPin();
    if (!record || !/^\d{6}$/.test(pin)) return false;

    const candidate = await deriveVerifier(pin, fromBase64(record.salt));
    return matchesVerifier(candidate, record.verifier);
  }, []);

  const unlock = useCallback(
    async (pin: string) => {
      if (!(await verifyPin(pin))) return false;

      updateLockState(false);
      lastActivityRef.current = Date.now();
      window.localStorage.setItem(
        ACTIVITY_STORAGE_KEY,
        String(lastActivityRef.current),
      );
      return true;
    },
    [updateLockState, verifyPin],
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string) => {
      if (!/^\d{6}$/.test(newPin) || !(await verifyPin(currentPin))) {
        return false;
      }

      const record = await createStoredPin(newPin);
      window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(record));
      pinRecordRef.current = record;
      lockNow();
      return true;
    },
    [lockNow, verifyPin],
  );

  useEffect(() => {
    const checkIdleTimeout = () => {
      if (!hasPinRef.current || isLockedRef.current) return;

      const sharedActivity = Number(
        window.localStorage.getItem(ACTIVITY_STORAGE_KEY),
      );
      const lastActivity = Math.max(
        lastActivityRef.current,
        Number.isFinite(sharedActivity) ? sharedActivity : 0,
      );

      if (Date.now() - lastActivity >= PIN_IDLE_TIMEOUT_MS) {
        lockNow();
      }
    };

    const handleActivity = () => {
      recordActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      checkIdleTimeout();
      recordActivity();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCK_SIGNAL_STORAGE_KEY && event.newValue) {
        updateLockState(true);
      }

      if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
        const sharedActivity = Number(event.newValue);
        if (Number.isFinite(sharedActivity)) {
          lastActivityRef.current = Math.max(
            lastActivityRef.current,
            sharedActivity,
          );
        }
      }

      if (event.key === PIN_STORAGE_KEY && event.newValue) {
        pinRecordRef.current = readStoredPin();
        hasPinRef.current = Boolean(pinRecordRef.current);
        setHasPin(hasPinRef.current);
        updateLockState(true);
      }
    };

    const intervalId = window.setInterval(checkIdleTimeout, 5_000);
    const activityEvents = [
      'pointerdown',
      'pointermove',
      'keydown',
      'touchstart',
    ];
    activityEvents.forEach((eventName) =>
      document.addEventListener(eventName, handleActivity, { passive: true }),
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) =>
        document.removeEventListener(eventName, handleActivity),
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [lockNow, recordActivity, updateLockState]);

  return { hasPin, isLocked, lockNow, createPin, unlock, changePin };
}
