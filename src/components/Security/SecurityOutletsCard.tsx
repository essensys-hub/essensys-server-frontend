import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionButton, ControlCard } from '../UI';
import {
  expectedStateAfter,
  securityOutletsBatch,
  securityOutletsLabel,
  securityOutletsState,
  type SecurityOutletsAction,
  type SecurityOutletsState,
} from '../../security/securityOutlets';

interface SecurityOutletsCardProps {
  /** Armoire joignable : sinon les commandes sont désactivées. */
  online: boolean;
  /** Mode test : la commande est validée sans être exécutée. */
  dryRun: boolean;
  /** Lit l'indice 440 (undefined si absent). */
  readState: () => Promise<string | undefined>;
  sendBatch: (items: Array<{ k: number; v: string }>) => Promise<unknown>;
}

/** Relectures de l'état après une commande (l'armoire exécute en ~5 s). */
const RECHECK_DELAYS_MS = [5000, 10000, 20000];

const stateStyles: Record<SecurityOutletsState, string> = {
  cut: 'bg-red-100 text-red-800',
  piloted: 'bg-green-100 text-green-800',
  unknown: 'bg-gray-200 text-gray-700',
};

export const SecurityOutletsCard: React.FC<SecurityOutletsCardProps> = ({ online, dryRun, readState, sendBatch }) => {
  const [state, setState] = useState<SecurityOutletsState>('unknown');
  const [waiting, setWaiting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState<SecurityOutletsAction | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);
  const timers = useRef<number[]>([]);

  const refresh = useCallback(async (): Promise<SecurityOutletsState> => {
    const next = securityOutletsState(await readState().catch(() => undefined));
    setState(next);
    return next;
  }, [readState]);

  useEffect(() => {
    refresh();
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, [refresh]);

  const waitFor = (expected: SecurityOutletsState) => {
    setWaiting(true);
    RECHECK_DELAYS_MS.forEach((delay, i) => {
      const t = window.setTimeout(async () => {
        const got = await refresh();
        if (got === expected || i === RECHECK_DELAYS_MS.length - 1) {
          setWaiting(false);
          timers.current.forEach((id) => window.clearTimeout(id));
          timers.current = [];
        }
      }, delay);
      timers.current.push(t);
    });
  };

  const send = async (action: SecurityOutletsAction) => {
    if (sending) return;
    setConfirming(false);
    setSending(action);
    setMessage(null);
    const what = action === 'cut' ? 'Coupure des prises de sécurité' : 'Rétablissement des prises de sécurité';
    try {
      await sendBatch(securityOutletsBatch(action));
      if (dryRun) {
        setMessage({ kind: 'info', text: `${what} : commande validée (test, non exécutée)` });
      } else {
        setMessage({ kind: 'success', text: `${what} : commande envoyée — l'armoire exécute sous ~5 s` });
        waitFor(expectedStateAfter(action));
      }
    } catch (e) {
      console.error(e);
      setMessage({ kind: 'error', text: `${what} : échec de l'envoi de la commande` });
    } finally {
      setSending(null);
    }
  };

  const disabled = !online || sending !== null;

  return (
    <ControlCard
      title="Prises de sécurité"
      description="Coupez les prises de sécurité à distance (fer à repasser, plaques…), puis rétablissez-les"
    >
      <div className="space-y-4" data-testid="security-outlets">
        <p
          data-testid="security-outlets-state"
          className={`inline-block text-sm px-3 py-1 rounded-full ${waiting ? 'bg-amber-100 text-amber-800' : stateStyles[state]}`}
        >
          {waiting ? "En attente de l'armoire" : securityOutletsLabel[state]}
        </p>

        {!online && (
          <p className="text-sm text-gray-600">Armoire hors ligne : les commandes sont indisponibles.</p>
        )}

        {message && (
          <div
            role="status"
            className={`p-3 rounded-lg border text-sm ${
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

        {confirming ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
            <p className="text-sm text-red-800">
              Couper les prises de sécurité ? Les appareils branchés dessus ne seront plus alimentés.
            </p>
            <div className="flex flex-wrap gap-3">
              <ActionButton label="Confirmer la coupure" variant="danger" onClick={() => send('cut')} disabled={disabled} />
              <ActionButton label="Annuler" variant="secondary" onClick={() => setConfirming(false)} disableDelay={0} />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 pt-2">
            <ActionButton
              label="Couper"
              variant="danger"
              onClick={() => setConfirming(true)}
              loading={sending === 'cut'}
              disabled={disabled}
              disableDelay={0}
              size="lg"
            />
            <ActionButton
              label="Rétablir"
              variant="success"
              onClick={() => send('restore')}
              loading={sending === 'restore'}
              disabled={disabled}
              size="lg"
            />
          </div>
        )}
      </div>
    </ControlCard>
  );
};

export default SecurityOutletsCard;
