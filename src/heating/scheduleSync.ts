import type { InjectionLogEntry } from './injectionProgress';
import { createInjectionLogEntry } from './injectionProgress';

export interface HeatingSyncStatus {
  active: boolean;
  startIndex: number;
  byteCount: number;
  received: number;
  total: number;
  chunksTotal: number;
  chunksCompleted: number;
}

export type ScheduleSyncEvent =
  | { type: 'start'; zoneName: string; startIndex: number; endIndex: number; chunksTotal: number }
  | { type: 'waiting'; received: number; total: number; chunksCompleted: number; chunksTotal: number }
  | { type: 'loaded'; received: number; total: number; missing: number; sample?: string }
  | { type: 'done'; received: number; total: number; complete: boolean }
  | { type: 'error'; message: string };

export const logsFromSyncEvent = (event: ScheduleSyncEvent): InjectionLogEntry[] => {
  switch (event.type) {
    case 'start':
      return [
        createInjectionLogEntry(
          'info',
          `Sync ${event.zoneName} — lecture armoire indices ${event.startIndex}–${event.endIndex} (${event.chunksTotal} cycle${event.chunksTotal > 1 ? 's' : ''} firmware, ~${event.chunksTotal * 20} s)`,
        ),
      ];
    case 'waiting':
      return [
        createInjectionLogEntry(
          'info',
          `Attente armoire… ${event.received}/${event.total} octets en cache · cycle ${event.chunksCompleted}/${event.chunksTotal}`,
        ),
      ];
    case 'loaded':
      if (event.missing === 0) {
        return [
          createInjectionLogEntry(
            'success',
            `✓ ${event.received}/${event.total} octets lus — ${event.sample ?? ''}`.trim(),
          ),
        ];
      }
      return [
        createInjectionLogEntry(
          'warn',
          `${event.received}/${event.total} octets en cache — ${event.missing} manquant${event.missing > 1 ? 's' : ''} (valeurs par défaut OFF)`,
        ),
      ];
    case 'done':
      return event.complete
        ? [createInjectionLogEntry('success', `Synchronisation terminée — ${event.received}/${event.total} octets`)]
        : [
            createInjectionLogEntry(
              'warn',
              `Sync partielle — ${event.received}/${event.total} octets seulement. Relancer Sync ou attendre le cycle armoire.`,
            ),
          ];
    case 'error':
      return [createInjectionLogEntry('error', `✗ Sync — ${event.message}`)];
    default:
      return [];
  }
};

export const syncProgressFromStatus = (
  status: HeatingSyncStatus,
): { currentChunk: number; totalChunks: number; totalParams: number; status: 'running' | 'success' | 'error' } => ({
  currentChunk: status.chunksCompleted,
  totalChunks: Math.max(status.chunksTotal, 1),
  totalParams: status.total,
  status: status.received >= status.total && status.total > 0
    ? 'success'
    : status.active
      ? 'running'
      : status.received > 0
        ? 'success'
        : 'running',
});

export const formatSyncProgressLabel = (received: number, total: number, active: boolean): string => {
  const pct = total > 0 ? Math.round((received / total) * 100) : 0;
  if (active) {
    return `Lecture armoire… ${received}/${total} octets (${pct} %)`;
  }
  if (received >= total && total > 0) {
    return `Planning synchronisé — ${total} octets`;
  }
  return `Cache partiel — ${received}/${total} octets (${pct} %)`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollHeatingSync = async (
  fetchStatus: () => Promise<HeatingSyncStatus>,
  onProgress: (event: ScheduleSyncEvent) => void,
  maxWaitMs = 90000,
  intervalMs = 3000,
): Promise<HeatingSyncStatus> => {
  const deadline = Date.now() + maxWaitMs;
  let lastReceived = -1;
  let lastLogAt = 0;

  while (Date.now() < deadline) {
    const status = await fetchStatus();
    const shouldLog =
      status.received !== lastReceived || Date.now() - lastLogAt > intervalMs * 2;
    if (shouldLog) {
      onProgress({
        type: 'waiting',
        received: status.received,
        total: status.total,
        chunksCompleted: status.chunksCompleted,
        chunksTotal: status.chunksTotal,
      });
      lastReceived = status.received;
      lastLogAt = Date.now();
    }
    if (status.received >= status.total && status.total > 0 && !status.active) {
      return status;
    }
    if (!status.active && status.received >= status.total) {
      return status;
    }
    await sleep(intervalMs);
  }
  return fetchStatus();
};
