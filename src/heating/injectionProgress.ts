import { injectionChunkCount, MAX_FIRMWARE_PARAMS_PER_ACTION } from './injectLimits';

export type InjectionLogLevel = 'info' | 'success' | 'error' | 'warn';

export interface InjectionLogEntry {
  id: string;
  time: string;
  level: InjectionLogLevel;
  message: string;
}

export interface InjectionSaveProgress {
  currentChunk: number;
  totalChunks: number;
  totalParams: number;
  status: 'idle' | 'running' | 'success' | 'error';
}

export type InjectionProgressEvent =
  | { type: 'start'; totalParams: number; chunkCount: number }
  | { type: 'sending'; chunkIndex: number; chunkCount: number; paramsInChunk: number; indexMin: number; indexMax: number }
  | { type: 'success'; chunkIndex: number; chunkCount: number; paramsInChunk: number; httpStatus: number }
  | { type: 'error'; chunkIndex: number; chunkCount: number; message: string }
  | { type: 'done'; totalParams: number; chunkCount: number };

let logSeq = 0;

export const createInjectionLogEntry = (
  level: InjectionLogLevel,
  message: string,
): InjectionLogEntry => ({
  id: `${Date.now()}-${++logSeq}`,
  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  level,
  message,
});

export const formatProgressLabel = (progress: InjectionSaveProgress): string => {
  if (progress.status === 'idle') return '';
  if (progress.totalChunks <= 1) {
    return progress.status === 'running'
      ? 'Envoi vers l\'armoire…'
      : progress.status === 'success'
        ? 'Enregistrement terminé'
        : 'Échec de l\'enregistrement';
  }
  const pct = Math.round((progress.currentChunk / progress.totalChunks) * 100);
  switch (progress.status) {
    case 'running':
      return `Envoi ${progress.currentChunk}/${progress.totalChunks} (${pct} %) — max ${MAX_FIRMWARE_PARAMS_PER_ACTION} octets/envoi`;
    case 'success':
      return `${progress.totalChunks} envois terminés — ${progress.totalParams} octet${progress.totalParams > 1 ? 's' : ''}`;
    case 'error':
      return `Échec à l'envoi ${progress.currentChunk}/${progress.totalChunks}`;
    default:
      return '';
  }
};

export const progressFromEvent = (
  event: InjectionProgressEvent,
  prev: InjectionSaveProgress | null,
): InjectionSaveProgress => {
  switch (event.type) {
    case 'start':
      return {
        currentChunk: 0,
        totalChunks: event.chunkCount,
        totalParams: event.totalParams,
        status: 'running',
      };
    case 'sending':
      return {
        currentChunk: event.chunkIndex,
        totalChunks: event.chunkCount,
        totalParams: prev?.totalParams ?? event.paramsInChunk,
        status: 'running',
      };
    case 'success':
      return {
        currentChunk: event.chunkIndex,
        totalChunks: event.chunkCount,
        totalParams: prev?.totalParams ?? 0,
        status: event.chunkIndex >= event.chunkCount ? 'success' : 'running',
      };
    case 'error':
      return {
        currentChunk: event.chunkIndex,
        totalChunks: event.chunkCount,
        totalParams: prev?.totalParams ?? 0,
        status: 'error',
      };
    case 'done':
      return {
        currentChunk: event.chunkCount,
        totalChunks: event.chunkCount,
        totalParams: event.totalParams,
        status: 'success',
      };
    default:
      return prev ?? { currentChunk: 0, totalChunks: 1, totalParams: 0, status: 'idle' };
  }
};

export const logsFromProgressEvent = (event: InjectionProgressEvent): InjectionLogEntry[] => {
  switch (event.type) {
    case 'start': {
      const chunks = injectionChunkCount(event.totalParams);
      if (chunks <= 1) {
        return [createInjectionLogEntry('info', `Début — ${event.totalParams} octet${event.totalParams > 1 ? 's' : ''} · 1 envoi`)];
      }
      return [
        createInjectionLogEntry(
          'info',
          `Début — ${event.totalParams} octets découpés en ${chunks} envois (max ${MAX_FIRMWARE_PARAMS_PER_ACTION}/envoi)`,
        ),
      ];
    }
    case 'sending':
      return [
        createInjectionLogEntry(
          'info',
          `Envoi ${event.chunkIndex}/${event.chunkCount} — ${event.paramsInChunk} octet${event.paramsInChunk > 1 ? 's' : ''} (indices ${event.indexMin}–${event.indexMax})…`,
        ),
      ];
    case 'success':
      return [
        createInjectionLogEntry(
          'success',
          `✓ Envoi ${event.chunkIndex}/${event.chunkCount} — accepté (${event.httpStatus})`,
        ),
      ];
    case 'error':
      return [
        createInjectionLogEntry(
          'error',
          `✗ Envoi ${event.chunkIndex}/${event.chunkCount} — ${event.message}`,
        ),
      ];
    case 'done':
      if (event.chunkCount <= 1) {
        return [createInjectionLogEntry('success', 'Sauvegarde terminée — en attente de cycle armoire (~20 s)')];
      }
      return [
        createInjectionLogEntry(
          'success',
          `Sauvegarde terminée — ${event.chunkCount} envois · laisser ~${event.chunkCount * 20} s pour la synchro armoire`,
        ),
      ];
    default:
      return [];
  }
};

export const initialSaveProgress = (): InjectionSaveProgress => ({
  currentChunk: 0,
  totalChunks: 0,
  totalParams: 0,
  status: 'idle',
});
