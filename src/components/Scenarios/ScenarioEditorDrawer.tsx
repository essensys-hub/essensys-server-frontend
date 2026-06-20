import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ActionButton } from '../UI';
import type { BitmaskField, ScenarioSlotDetail } from '../../services/scenarioApi';

interface ScenarioEditorDrawerProps {
  open: boolean;
  slot: number | null;
  detail: ScenarioSlotDetail | null;
  bitmasks: BitmaskField[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (params: Record<number, string>) => void;
  onLaunch: () => void;
  onRestore: () => void;
}

const tabs = ['Lumières & volets', 'Avancé'] as const;
type TabId = (typeof tabs)[number];

const parseByte = (v: string | undefined): number => {
  const n = parseInt(v ?? '0', 10);
  return Number.isNaN(n) ? 0 : n;
};

export const ScenarioEditorDrawer: React.FC<ScenarioEditorDrawerProps> = ({
  open,
  slot,
  detail,
  bitmasks,
  loading,
  saving,
  onClose,
  onSave,
  onLaunch,
  onRestore,
}) => {
  const [tab, setTab] = useState<TabId>('Lumières & volets');
  const [params, setParams] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!detail) return;
    const map: Record<number, string> = {};
    for (const p of detail.params) {
      map[p.k] = p.v;
    }
    for (let i = detail.base_index; i <= detail.end_index; i++) {
      if (map[i] === undefined) map[i] = '0';
    }
    setParams(map);
  }, [detail]);

  const bitmaskIndices = useMemo(() => new Set(bitmasks.map((f) => f.index)), [bitmasks]);

  const advancedIndices = useMemo(() => {
    if (!detail) return [];
    const out: number[] = [];
    for (let i = detail.base_index; i <= detail.end_index; i++) {
      if (!bitmaskIndices.has(i)) out.push(i);
    }
    return out;
  }, [detail, bitmaskIndices]);

  const toggleBit = (index: number, bitValue: number, checked: boolean) => {
    setParams((prev) => {
      const current = parseByte(prev[index]);
      const next = checked ? current | bitValue : current & ~bitValue;
      return { ...prev, [index]: String(next) };
    });
  };

  if (!open || slot === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <aside className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {detail?.label ?? `Scénario ${slot}`}
            </h2>
            <p className="text-sm text-gray-500">Édition slot {slot}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex border-b border-gray-200 px-4 gap-4">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t
                  ? 'border-essensys-primary text-essensys-primary'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-gray-500">Chargement…</p>}
          {!loading && tab === 'Lumières & volets' && (
            <div className="space-y-6">
              {bitmasks.map((field) => (
                <div key={field.index}>
                  <h3 className="text-sm font-medium text-gray-800 mb-2">
                    Index {field.index} — {field.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {field.bits.map((bit) => {
                      const value = parseByte(params[field.index]);
                      const checked = (value & bit.value) !== 0;
                      return (
                        <label
                          key={`${field.index}-${bit.value}`}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleBit(field.index, bit.value, e.target.checked)}
                          />
                          {bit.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && tab === 'Avancé' && (
            <div className="space-y-3">
              {advancedIndices.map((index) => (
                <label key={index} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-gray-500">{index}</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5"
                    value={params[index] ?? '0'}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [index]: e.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-gray-200 p-4 flex flex-wrap gap-2">
          <ActionButton label="Enregistrer" onClick={() => onSave(params)} loading={saving} />
          <ActionButton label="Lancer" variant="success" onClick={onLaunch} />
          {slot >= 2 && slot <= 6 && (
            <ActionButton label="Défaut firmware" variant="secondary" onClick={onRestore} />
          )}
          <ActionButton label="Fermer" variant="secondary" onClick={onClose} />
        </footer>
      </aside>
    </div>
  );
};
