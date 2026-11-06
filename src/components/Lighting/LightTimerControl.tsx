import React, { useEffect, useRef, useState } from 'react';
import { ActionButton } from '../UI';
import { setLightTimer } from '../../services/legacyApi';
import {
  RECHECK_DELAYS_MS,
  TIMER_SHORTCUTS,
  formatMinutes,
  lightTimerLabel,
  parseCustomMinutes,
} from '../../lights/lightTimers';

interface LightTimerControlProps {
  id: string;
  /** Valeur courante : null = jamais lue. */
  minutes: number | null;
  /** Armoire joignable (snapshot connected) : sinon les contrôles sont désactivés. */
  online: boolean;
  /** Mode test : la commande est validée sans être exécutée. */
  dryRun: boolean;
  /** Relit la valeur de cette lumière (undefined si la lecture échoue). */
  readMinutes: () => Promise<number | null | undefined>;
}

/**
 * Réglage du délai d'extinction d'une lumière, partagé par la page « Temporisations »
 * et le panneau de la page Éclairage (même rendu, même valeur).
 */
export const LightTimerControl: React.FC<LightTimerControlProps> = ({ id, minutes, online, dryRun, readMinutes }) => {
  const [shown, setShown] = useState<number | null>(minutes);
  const [waiting, setWaiting] = useState(false);
  const [sending, setSending] = useState(false);
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);
  const timers = useRef<number[]>([]);
  const readRef = useRef(readMinutes);
  readRef.current = readMinutes;
  const label = lightTimerLabel(id);

  useEffect(() => {
    setShown(minutes);
  }, [minutes]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const waitFor = (expected: number) => {
    clearTimers();
    setWaiting(true);
    RECHECK_DELAYS_MS.forEach((delay, i) => {
      const t = window.setTimeout(async () => {
        const got = await readRef.current().catch(() => undefined);
        if (got !== undefined) setShown(got);
        if (got === expected || i === RECHECK_DELAYS_MS.length - 1) {
          setWaiting(false);
          clearTimers();
        }
      }, delay);
      timers.current.push(t);
    });
  };

  const send = async (value: number) => {
    if (sending) return;
    setSending(true);
    setMessage(null);
    try {
      const status = await setLightTimer(id, value);
      if (status === 'dry_run' || dryRun) {
        setMessage({ kind: 'info', text: `${label} : ${formatMinutes(value)} validé (test, non exécuté)` });
      } else {
        setMessage({ kind: 'success', text: `${label} : ${formatMinutes(value)} envoyé — l'armoire applique sous ~5 s` });
        waitFor(value);
      }
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : `${label} : réglage impossible` });
    } finally {
      setSending(false);
    }
  };

  const sendCustom = () => {
    const parsed = parseCustomMinutes(custom);
    if (!parsed.ok) {
      setCustomError(parsed.error);
      return;
    }
    setCustomError(null);
    void send(parsed.minutes);
  };

  const disabled = !online || sending;

  return (
    <div className="space-y-3" data-testid={`light-timer-${id}`}>
      <p className="text-sm text-gray-700">
        Extinction après :{' '}
        <strong data-testid={`light-timer-${id}-value`}>{waiting ? "en attente de l'armoire" : formatMinutes(shown)}</strong>
      </p>

      {!online && <p className="text-sm text-gray-600">Armoire hors ligne : le réglage est indisponible.</p>}

      <div className="flex flex-wrap gap-2">
        {TIMER_SHORTCUTS.map((s) => (
          <ActionButton
            key={s.minutes}
            label={s.label}
            variant={shown === s.minutes ? 'primary' : 'secondary'}
            size="sm"
            disabled={disabled}
            disableDelay={0}
            onClick={() => void send(s.minutes)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <label className="text-sm text-gray-600" htmlFor={`light-timer-${id}-custom`}>
          Autre (1 à 255 min)
        </label>
        <input
          id={`light-timer-${id}-custom`}
          type="text"
          inputMode="numeric"
          value={custom}
          disabled={disabled}
          onChange={(e) => {
            setCustom(e.target.value);
            setCustomError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendCustom();
          }}
          className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
        />
        <ActionButton label="Régler" size="sm" disabled={disabled} disableDelay={0} onClick={sendCustom} />
      </div>
      {customError && (
        <p role="alert" className="text-sm text-red-700">
          {customError}
        </p>
      )}

      {message && (
        <div
          role="status"
          className={`p-2 rounded-lg border text-sm ${
            message.kind === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : message.kind === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default LightTimerControl;
