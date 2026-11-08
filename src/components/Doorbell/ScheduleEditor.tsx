import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DAYS, DAY_SHORT, HOURS, PRESETS, activePreset, applyPreset, cellLabel, currentCell, isCellOn, neverActive, paintRect, setCell,
  timezoneChoices, type DoorbellSchedule,
} from '../../doorbell/doorbellSchedule';

interface Props {
  schedule: DoorbellSchedule;
  onChange: (next: DoorbellSchedule) => void;
  /** Enregistrement en cours. */
  disabled?: boolean;
  /** Administrateur de l'armoire ; sinon la grille est en lecture seule. */
  canEdit?: boolean;
}

interface Cell { day: number; hour: number }
interface Drag { anchor: Cell; on: boolean; base: DoorbellSchedule }

const cellAt = (x: number, y: number): Cell | null => {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-sched-day]');
  if (!el) return null;
  return { day: Number(el.dataset.schedDay), hour: Number(el.dataset.schedHour) };
};

/**
 * Éditeur de la grille 7 x 24 (lundi en premier) : clic et glisser (souris ou doigt), clavier (flèches, Espace ou Entrée,
 * début et fin de ligne), présélections, fuseau, case actuelle repérée.
 */
export const ScheduleEditor: React.FC<Props> = ({ schedule, onChange, disabled = false, canEdit = true }) => {
  const editable = canEdit && !disabled;
  const [now, setNow] = useState(() => Date.now());
  const [focus, setFocus] = useState<Cell>({ day: 0, hour: 0 });
  const drag = useRef<Drag | null>(null);
  const cells = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const stop = () => { drag.current = null; };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const cur = useMemo(() => currentCell(now, schedule.timezone), [now, schedule.timezone]);
  const zones = useMemo(() => timezoneChoices(schedule.timezone), [schedule.timezone]);
  const preset = activePreset(schedule);
  const curOn = cur ? (schedule.mode === 'custom' ? isCellOn(schedule, cur.day, cur.hour) : true) : null;

  const moveFocus = (c: Cell) => {
    setFocus(c);
    cells.current.get(`${c.day}-${c.hour}`)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, c: Cell) => {
    const clamp = (n: number, max: number) => Math.max(0, Math.min(max - 1, n));
    let next: Cell | null = null;
    switch (e.key) {
      case 'ArrowLeft': next = { day: c.day, hour: clamp(c.hour - 1, HOURS) }; break;
      case 'ArrowRight': next = { day: c.day, hour: clamp(c.hour + 1, HOURS) }; break;
      case 'ArrowUp': next = { day: clamp(c.day - 1, DAYS.length), hour: c.hour }; break;
      case 'ArrowDown': next = { day: clamp(c.day + 1, DAYS.length), hour: c.hour }; break;
      case 'Home': next = { day: c.day, hour: 0 }; break;
      case 'End': next = { day: c.day, hour: HOURS - 1 }; break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (editable) onChange(setCell(schedule, c.day, c.hour, !isCellOn(schedule, c.day, c.hour)));
        return;
      default: return;
    }
    e.preventDefault();
    moveFocus(next);
  };

  const onPointerDown = (e: React.PointerEvent, c: Cell) => {
    if (!editable || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const on = !isCellOn(schedule, c.day, c.hour);
    drag.current = { anchor: c, on, base: schedule };
    setFocus(c);
    onChange(setCell(schedule, c.day, c.hour, on));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const c = cellAt(e.clientX, e.clientY);
    if (c) onChange(paintRect(d.base, d.anchor, c, d.on));
  };

  return (
    <div className="space-y-3" data-testid="doorbell-schedule">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Présélections">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!editable}
            aria-pressed={preset === p.id}
            onClick={() => onChange(applyPreset(schedule, p.id))}
            data-testid={`sched-preset-${p.id}`}
            className={`px-3 py-1.5 text-sm rounded border disabled:opacity-50 ${preset === p.id ? 'border-essensys-primary bg-essensys-primary/10 font-medium' : 'border-gray-300'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="sched-timezone">Fuseau horaire</label>
        <select
          id="sched-timezone"
          value={schedule.timezone}
          disabled={!editable}
          onChange={(e) => onChange({ ...schedule, timezone: e.target.value })}
          data-testid="sched-timezone"
          className="px-2 py-1.5 text-sm border border-gray-300 rounded bg-white max-w-full"
        >
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      <p className="text-sm" data-testid="sched-now" aria-live="polite">
        {cur === null
          ? 'Fuseau inconnu de ce navigateur : case actuelle non repérée.'
          : `Maintenant : ${DAYS[cur.day]} ${cur.clock} (${schedule.timezone}), ${curOn ? 'dans la plage' : 'hors plage'}.`}
      </p>

      <div
        role="grid"
        aria-label="Plages horaires de la sonnette"
        aria-readonly={!editable}
        data-testid="sched-grid"
        onPointerMove={onPointerMove}
        style={{ touchAction: 'none' }}
        className="select-none"
      >
        <div role="row" className="grid items-end text-[10px] text-gray-500" style={{ gridTemplateColumns: `2.25rem repeat(${HOURS}, minmax(0, 1fr))` }}>
          <span aria-hidden="true" />
          {Array.from({ length: HOURS }, (_, h) => (
            <span key={h} role="columnheader" aria-label={`${h} h`} className="text-center overflow-visible whitespace-nowrap">{h % 3 === 0 ? h : ''}</span>
          ))}
        </div>
        {DAYS.map((_, day) => (
          <div
            key={day}
            role="row"
            className="grid items-center gap-px mt-px"
            style={{ gridTemplateColumns: `2.25rem repeat(${HOURS}, minmax(0, 1fr))` }}
          >
            <span role="rowheader" className="text-xs text-gray-700" aria-label={DAYS[day]}>{DAY_SHORT[day]}</span>
            {Array.from({ length: HOURS }, (_, hour) => {
              const on = isCellOn(schedule, day, hour);
              const isNow = cur !== null && cur.day === day && cur.hour === hour;
              const isFocus = focus.day === day && focus.hour === hour;
              return (
                <div
                  key={hour}
                  ref={(el) => {
                    if (el) cells.current.set(`${day}-${hour}`, el);
                    else cells.current.delete(`${day}-${hour}`);
                  }}
                  role="gridcell"
                  tabIndex={isFocus ? 0 : -1}
                  aria-selected={on}
                  aria-label={cellLabel(schedule, day, hour)}
                  aria-current={isNow ? 'time' : undefined}
                  data-sched-day={day}
                  data-sched-hour={hour}
                  data-on={on ? '1' : '0'}
                  data-now={isNow ? '1' : '0'}
                  data-testid={`sched-cell-${day}-${hour}`}
                  onPointerDown={(e) => onPointerDown(e, { day, hour })}
                  onKeyDown={(e) => onKeyDown(e, { day, hour })}
                  onFocus={() => setFocus({ day, hour })}
                  className={`h-6 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-essensys-primary ${on ? 'bg-essensys-primary' : 'bg-gray-200'} ${isNow ? 'ring-2 ring-offset-1 ring-amber-500' : ''} ${editable ? 'cursor-pointer' : 'opacity-70'}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600" data-testid="sched-summary">
        {schedule.mode === 'always' && 'Toujours active : modifier une case passe en plages personnalisées.'}
        {schedule.mode === 'custom' && !neverActive(schedule) && 'Plages personnalisées : les cases colorées sont actives.'}
        {neverActive(schedule) && 'Jamais active : la sonnette ne fera ni clignoter les lumières ni notifier.'}
        {' '}Clic ou glisser pour changer des cases ; au clavier, flèches puis Espace.
      </p>
    </div>
  );
};

export default ScheduleEditor;
