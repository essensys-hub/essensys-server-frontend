import React, { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { setObjectLayout } from '../../services/legacyApi';
import {
  CATALOGUES, buildWrite, groupOf, moveInGroup, type LayoutKind,
} from '../../layout/objectLayout';
import { refreshLayout, setSharedLayout, useObjectLayout } from '../../layout/useObjectLayout';

interface ObjectLayoutManagerProps {
  kind: LayoutKind;
  /** Nom affiché (personnalisé sinon d'origine), rendu en texte brut. */
  nameOf: (id: string) => string;
}

const LABELS: Record<LayoutKind, { open: string; title: string }> = {
  lights: { open: "Gérer l'affichage des lumières", title: 'Affichage des lumières' },
  shutters: { open: "Gérer l'affichage des volets", title: 'Affichage des volets et stores' },
};

/** Bouton d'accès (administrateur seulement : le serveur reste la protection, 403) et écran de gestion. */
export const ObjectLayoutManager: React.FC<ObjectLayoutManagerProps> = ({ kind, nameOf }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6" data-testid={`layout-manager-${kind}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
      >
        {LABELS[kind].open}
      </button>
      {open && <ManagerBody kind={kind} nameOf={nameOf} />}
    </div>
  );
};

const ManagerBody: React.FC<ObjectLayoutManagerProps> = ({ kind, nameOf }) => {
  const { layout, effective } = useObjectLayout(kind);
  // Modifications locales jusqu'à « Enregistrer ».
  const [ordered, setOrdered] = useState<string[]>(effective.ordered);
  const [disabled, setDisabled] = useState<string[]>(effective.disabled);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const touch = () => {
    setReset(false);
    setMessage(null);
    setError(null);
  };

  const toggle = (id: string) => {
    touch();
    setDisabled((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  const move = (id: string, dir: 'up' | 'down') => {
    touch();
    setOrdered((o) => moveInGroup(kind, o, id, dir));
  };

  const originalOrder = () => {
    setOrdered(effectiveOrderOfDefault(kind));
    setDisabled([]);
    setReset(true);
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { layout: saved, status } = await setObjectLayout(kind, buildWrite(ordered, disabled, reset));
      if (status === 'dry_run') {
        setMessage('Mode test : disposition validée, non enregistrée');
      } else {
        setSharedLayout(kind, saved);
        setReset(false);
        setMessage('Disposition enregistrée');
        void refreshLayout(kind);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const hasNeighbour = (i: number, dir: 'up' | 'down') => {
    const step = dir === 'up' ? -1 : 1;
    for (let j = i + step; j >= 0 && j < ordered.length; j += step) {
      if (groupOf(kind, ordered[j]) === groupOf(kind, ordered[i])) return true;
    }
    return false;
  };

  return (
    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-3" data-testid={`layout-panel-${kind}`}>
      <h3 className="text-sm font-semibold text-gray-800">{LABELS[kind].title}</h3>
      <p className="text-xs text-gray-500">
        Version {layout.version}. Un objet désactivé est masqué pour tous (listes, groupes, Temporisations, temps de course).
        Les scénarios ne sont pas filtrés.
      </p>
      <ul className="space-y-2">
        {ordered.map((id, i) => {
          const isDisabled = disabled.includes(id);
          return (
            <li
              key={id}
              data-testid={`layout-row-${id}`}
              className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded"
            >
              <span className={`text-sm min-w-0 flex-1 break-words ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {nameOf(id)}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isDisabled}
                  aria-label={`${nameOf(id)} : ${isDisabled ? 'désactivé' : 'activé'}`}
                  data-testid={`layout-toggle-${id}`}
                  onClick={() => toggle(id)}
                  disabled={busy}
                  className={`px-2 py-1 text-xs rounded border ${isDisabled ? 'border-gray-300 text-gray-600' : 'border-green-600 bg-green-50 text-green-800'}`}
                >
                  {isDisabled ? 'Désactivé' : 'Activé'}
                </button>
                <button
                  type="button"
                  aria-label={`Monter ${nameOf(id)}`}
                  data-testid={`layout-up-${id}`}
                  onClick={() => move(id, 'up')}
                  disabled={busy || !hasNeighbour(i, 'up')}
                  className="p-1 rounded border border-gray-300 disabled:opacity-40"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Descendre ${nameOf(id)}`}
                  data-testid={`layout-down-${id}`}
                  onClick={() => move(id, 'down')}
                  disabled={busy || !hasNeighbour(i, 'down')}
                  className="p-1 rounded border border-gray-300 disabled:opacity-40"
                >
                  <ArrowDownIcon className="w-4 h-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void save()} disabled={busy} className="px-3 py-1 text-sm rounded bg-essensys-primary text-white disabled:opacity-50">
          Enregistrer
        </button>
        <button type="button" onClick={originalOrder} disabled={busy} className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50">
          Ordre d&apos;origine
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    </div>
  );
};

const effectiveOrderOfDefault = (kind: LayoutKind): string[] => CATALOGUES[kind].map((c) => c.id);

export default ObjectLayoutManager;
