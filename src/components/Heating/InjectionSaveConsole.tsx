import React, { useEffect, useRef } from 'react';
import type { InjectionLogEntry, InjectionSaveProgress } from '../../heating/injectionProgress';
import { formatProgressLabel } from '../../heating/injectionProgress';
import { MAX_FIRMWARE_PARAMS_PER_ACTION } from '../../heating/constants';

interface InjectionSaveConsoleProps {
  progress: InjectionSaveProgress | null;
  logs: InjectionLogEntry[];
  visible: boolean;
  onToggle?: () => void;
  title?: string;
  progressLabel?: string;
  subtitle?: string;
}

const levelClass: Record<InjectionLogEntry['level'], string> = {
  info: 'text-slate-300',
  success: 'text-emerald-400',
  error: 'text-red-400',
  warn: 'text-amber-300',
};

export const InjectionSaveConsole: React.FC<InjectionSaveConsoleProps> = ({
  progress,
  logs,
  visible,
  onToggle,
  title = 'Console chauffage',
  progressLabel,
  subtitle,
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && logs.length > 0) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, visible]);

  if (!visible && logs.length === 0) return null;

  const active = progress && progress.status !== 'idle';
  const pct =
    progress && progress.totalChunks > 0
      ? Math.min(100, Math.round((progress.currentChunk / progress.totalChunks) * 100))
      : 0;

  const barColor =
    progress?.status === 'error'
      ? 'bg-red-500'
      : progress?.status === 'success'
        ? 'bg-emerald-500'
        : 'bg-cyan-500';

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/80 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </span>
        <span className="text-[10px] text-slate-500">
          {visible ? 'Masquer' : 'Afficher'}{subtitle ? ` · ${subtitle}` : ''}
        </span>
      </button>

      {visible && (
        <>
          {active && progress && (
            <div className="px-4 pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs text-slate-200">
                  {progressLabel ?? formatProgressLabel(progress)}
                </p>
                {progress.totalChunks > 1 && (
                  <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                    {progress.currentChunk}/{progress.totalChunks}
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-out ${barColor}`}
                  style={{ width: `${progress.status === 'success' ? 100 : pct}%` }}
                />
              </div>
              {progress.status === 'running' && progress.totalChunks > 1 && (
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Découpage automatique — chaque tranche ≤ {MAX_FIRMWARE_PARAMS_PER_ACTION} octets
                </p>
              )}
            </div>
          )}

          <div
            className="max-h-40 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed space-y-1"
            role="log"
            aria-live="polite"
          >
            {logs.length === 0 ? (
              <p className="text-slate-500">Aucune activité récente.</p>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} className="flex gap-2">
                  <span className="text-slate-600 shrink-0 tabular-nums">{entry.time}</span>
                  <span className={levelClass[entry.level]}>{entry.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </>
      )}
    </div>
  );
};

export default InjectionSaveConsole;
