import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_STATUS, pollInterval, ringKey, shouldShowWindow, type DoorbellStatus } from './doorbell';
import { DoorbellHttpError, getDoorbellStatus } from './doorbellApi';

const DISMISSED_KEY = 'essensys_doorbell_dismissed';

const readDismissed = (): string | null => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
};

/** Événement envoyé par l'écran de réglage après un essai pour relire l'état sans attendre. */
export const DOORBELL_REFRESH_EVENT = 'essensys:doorbell-refresh';

/**
 * Interroge GET /api/doorbell/status (2 s fenêtre ouverte, 5 s sinon). Coupure passagère : dernier état conservé
 * (la sonnerie expire à `ringing_until`). 404 (ancienne gateway) : fonction absente, plus d'interrogation.
 */
export function useDoorbellStatus() {
  const [status, setStatus] = useState<DoorbellStatus>(DEFAULT_STATUS);
  const [dismissed, setDismissed] = useState<string | null>(readDismissed);
  const [now, setNow] = useState(() => Date.now());
  const absent = useRef(false);

  const visible = shouldShowWindow(status, dismissed, now);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      if (absent.current) return;
      try {
        const next = await getDoorbellStatus();
        if (!stopped) setStatus(next);
      } catch (e) {
        if (!stopped && e instanceof DoorbellHttpError && e.status === 404) {
          absent.current = true;
          setStatus(DEFAULT_STATUS);
        }
      }
      if (!stopped) setNow(Date.now());
    };
    void poll();
    const timer = setInterval(() => void poll(), pollInterval(visible));
    const onWake = () => void poll();
    window.addEventListener('focus', onWake);
    window.addEventListener(DOORBELL_REFRESH_EVENT, onWake);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('focus', onWake);
      window.removeEventListener(DOORBELL_REFRESH_EVENT, onWake);
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    const key = ringKey(status);
    setDismissed(key);
    try {
      if (key) sessionStorage.setItem(DISMISSED_KEY, key);
    } catch { /* sessionStorage indisponible */ }
  }, [status]);

  return { status, visible, ring: ringKey(status), dismiss };
}
