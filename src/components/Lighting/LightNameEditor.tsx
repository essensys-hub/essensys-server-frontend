import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { setLightName } from '../../services/legacyApi';
import { MAX_NAME_LENGTH, parseLightName } from '../../lights/lightNames';
import { refreshLightNames, setSharedLightNames, useLightNames } from '../../lights/useLightNames';

interface LightNameEditorProps {
  id: string;
}

/** Panneau repliable de la fiche d'une lumière (administrateur) : champ Nom, Enregistrer, Nom d'origine. */
export const LightNameEditor: React.FC<LightNameEditorProps> = ({ id }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2" data-testid={`light-name-panel-${id}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-sm text-essensys-primary hover:underline"
      >
        Nom
        {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
      </button>
      {open && <LightNameEditorBody id={id} />}
    </div>
  );
};

const LightNameEditorBody: React.FC<LightNameEditorProps> = ({ id }) => {
  const { names, nameOf } = useLightNames();
  const entry = names.find((n) => n.id === id);
  const original = entry?.default ?? nameOf(id);
  const [value, setValue] = useState(nameOf(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const write = async (name: string | null) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { light, status } = await setLightName(id, name);
      if (status === 'dry_run') {
        setMessage('Mode test : nom validé, non enregistré');
      } else {
        // Mise à jour immédiate sans rechargement, puis relecture complète du serveur.
        setSharedLightNames(
          names.some((n) => n.id === id) ? names.map((n) => (n.id === id ? { ...n, ...light } : n)) : [...names, light],
        );
        setValue(light.name ?? light.default);
        setMessage(light.name === null ? `Nom d'origine rétabli : ${light.default}` : `Nom enregistré : ${light.name}`);
        void refreshLightNames();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Renommage impossible');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const parsed = parseLightName(value);
    if (!parsed.ok) {
      setMessage(null);
      setError(parsed.error);
      return;
    }
    void write(parsed.name);
  };

  const inputId = `light-name-input-${id}`;
  return (
    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg space-y-2">
      <label htmlFor={inputId} className="block text-sm text-gray-700">Nom</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={inputId}
          type="text"
          value={value}
          maxLength={MAX_NAME_LENGTH * 2}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          className="border border-gray-300 rounded px-2 py-1 text-sm min-w-0 flex-1"
        />
        <button type="button" onClick={save} disabled={busy} className="px-3 py-1 text-sm rounded bg-essensys-primary text-white disabled:opacity-50">
          Enregistrer
        </button>
        <button type="button" onClick={() => void write(null)} disabled={busy} className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50">
          Nom d&apos;origine
        </button>
      </div>
      <p className="text-xs text-gray-500">Nom d&apos;origine : {original}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    </div>
  );
};

export default LightNameEditor;
