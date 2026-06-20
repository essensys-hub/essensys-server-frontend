import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { HeatingZoneConfig, ScheduleConsigne } from '../../heating/constants';
import { DAY_LABELS, HOURS, MAX_FIRMWARE_PARAMS_PER_ACTION, SCHEDULE_MODES, SCHEDULE_MODE_MAP } from '../../heating/constants';
import { formatInjectionLimitHint } from '../../heating/injectLimits';
import type { InjectionSaveProgress } from '../../heating/injectionProgress';
import { formatProgressLabel } from '../../heating/injectionProgress';
import type { ScheduleGrid } from '../../heating/scheduleCodec';
import { copyDayToAll, diffScheduleInjections, gridsEqual } from '../../heating/scheduleCodec';

interface HeatingScheduleGridProps {
  zone: HeatingZoneConfig;
  grid: ScheduleGrid;
  baseline: ScheduleGrid;
  onChange: (grid: ScheduleGrid) => void;
  onSave: () => void;
  onCancel: () => void;
  onSync?: () => void;
  saving: boolean;
  syncing?: boolean;
  loading: boolean;
  saveProgress?: InjectionSaveProgress | null;
}

export const HeatingScheduleGrid: React.FC<HeatingScheduleGridProps> = ({
  zone,
  grid,
  baseline,
  onChange,
  onSave,
  onCancel,
  onSync,
  saving,
  syncing = false,
  loading,
  saveProgress,
}) => {
  const [paintMode, setPaintMode] = useState<ScheduleConsigne>(1);
  const [applySourceDay, setApplySourceDay] = useState(0);
  const painting = useRef(false);

  const dirty = !gridsEqual(grid, baseline);

  const pendingInjections = useMemo(
    () => diffScheduleInjections(grid, baseline, zone.scheduleStartIndex, zone.scheduleByteCount),
    [grid, baseline, zone.scheduleStartIndex, zone.scheduleByteCount],
  );
  const pendingHint = formatInjectionLimitHint(pendingInjections.length);

  const paintCell = useCallback(
    (day: number, hour: number) => {
      const next = grid.map((row, d) =>
        d === day ? row.map((v, h) => (h === hour ? paintMode : v)) : row,
      );
      onChange(next);
    },
    [grid, onChange, paintMode],
  );

  const handlePointerDown = (day: number, hour: number) => {
    painting.current = true;
    paintCell(day, hour);
  };

  const handlePointerEnter = (day: number, hour: number) => {
    if (painting.current) paintCell(day, hour);
  };

  const stopPainting = () => {
    painting.current = false;
  };

  const handleApplyToAll = () => {
    onChange(copyDayToAll(grid, applySourceDay));
  };

  return (
    <div
      className="bg-slate-900 rounded-xl p-4 sm:p-6 text-white shadow-lg"
      onPointerUp={stopPainting}
      onPointerLeave={stopPainting}
    >
      <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wide text-center mb-1">
        {zone.scheduleTitle}
      </h3>
      <p className="text-[10px] sm:text-xs text-slate-400 text-center mb-4">
        Limite armoire : {MAX_FIRMWARE_PARAMS_PER_ACTION} octets par envoi — au-delà, envoi automatique en plusieurs fois.
      </p>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          Chargement du planning…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Heures */}
            <div className="grid grid-cols-[2.5rem_repeat(24,1fr)] gap-px mb-1 text-[10px] text-slate-400">
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-center">
                  {h % 2 === 0 ? h : ''}
                </div>
              ))}
            </div>

            {/* Grille */}
            {DAY_LABELS.map((dayLabel, day) => (
              <div key={dayLabel} className="grid grid-cols-[2.5rem_repeat(24,1fr)] gap-px mb-px">
                <div className="flex items-center text-xs font-medium text-slate-300 pr-1">
                  {dayLabel}
                </div>
                {HOURS.map((hour) => {
                  const mode = grid[day][hour];
                  const def = SCHEDULE_MODE_MAP[mode] ?? SCHEDULE_MODE_MAP[1];
                  return (
                    <button
                      key={`${day}-${hour}`}
                      type="button"
                      className={`h-7 sm:h-8 rounded-sm border border-slate-700/50 transition-colors ${def.cellClass}`}
                      title={`${dayLabel} ${hour}h — ${def.label}`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handlePointerDown(day, hour);
                      }}
                      onPointerEnter={() => handlePointerEnter(day, hour)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Légende + mode peinture */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {SCHEDULE_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setPaintMode(m.value)}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition ring-2 ${
              paintMode === m.value ? 'ring-white ring-offset-2 ring-offset-slate-900' : 'ring-transparent'
            }`}
          >
            <span className={`w-8 h-8 rounded ${m.legendClass} border border-white/20`} />
            <span className="text-[10px] sm:text-xs text-slate-200">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <label htmlFor="apply-day" className="whitespace-nowrap">Appliquer</label>
          <select
            id="apply-day"
            value={applySourceDay}
            onChange={(e) => setApplySourceDay(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
          >
            {DAY_LABELS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplyToAll}
            className="text-xs text-cyan-300 hover:text-cyan-200 underline"
          >
            à toute la semaine
          </button>
        </div>

        <div className="flex flex-col items-end gap-1">
          {dirty && pendingHint && (
            <span className="text-xs text-amber-300 text-right max-w-[14rem] sm:max-w-none">
              {pendingHint}
            </span>
          )}
          {saving && saveProgress && saveProgress.status === 'running' && saveProgress.totalChunks > 1 && (
            <span className="text-[10px] text-amber-300 text-right max-w-[14rem] sm:max-w-none">
              {formatProgressLabel(saveProgress)}
            </span>
          )}
          <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-slate-400 hidden md:inline">
              Non enregistré
            </span>
          )}
          <button
            type="button"
            onClick={onSync}
            disabled={syncing || saving || loading || !onSync}
            className="px-3 py-1.5 text-sm rounded-lg border border-cyan-600 text-cyan-300 hover:bg-cyan-950 disabled:opacity-40"
          >
            {syncing ? 'Sync…' : 'Sync armoire'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || syncing || !dirty}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-500 text-slate-300 disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || syncing || !dirty || loading}
            className="px-4 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-medium min-w-[7.5rem]"
          >
            {saving && saveProgress && saveProgress.status === 'running' && saveProgress.totalChunks > 1
              ? `${saveProgress.currentChunk}/${saveProgress.totalChunks}…`
              : saving
                ? 'Envoi…'
                : 'Enregistrer'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatingScheduleGrid;
