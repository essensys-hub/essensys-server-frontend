import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useArmoireSnapshot } from '../../hooks/useArmoireSnapshot';
import type { ArmoireHeatingZone } from '../../types/armoire';

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-3 mt-3 first:mt-0 first:border-0 first:pt-0">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-800"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        {open ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </button>
      {open && <div className="mt-2 space-y-1 text-sm text-gray-600">{children}</div>}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value?: string | number | null; muted?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <p className={muted ? 'text-gray-400' : undefined}>
      <span className="text-gray-500">{label} :</span> {value}
    </p>
  );
}

export const ArmoireStatusPanel: React.FC = () => {
  const { snapshot, loading, error, partial } = useArmoireSnapshot();

  const badgeClass = !snapshot
    ? 'bg-gray-100 text-gray-600'
    : snapshot.connected
      ? partial
        ? 'bg-amber-100 text-amber-800'
        : 'bg-green-100 text-green-800'
      : 'bg-gray-200 text-gray-700';

  const badgeLabel = loading
    ? 'Chargement…'
    : !snapshot
      ? 'Indisponible'
      : snapshot.connected
        ? partial
          ? 'Connectée (données partielles)'
          : 'Connectée'
        : 'Hors ligne';

  const muted = !snapshot?.connected;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SignalIcon className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">État armoire</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Valeurs remontées par l&apos;armoire (table d&apos;échange) — pas une confirmation capteur par équipement.
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {snapshot && (
        <div className={muted ? 'opacity-60' : undefined}>
          <Section title="Identité">
            <Row label="Firmware" value={snapshot.identity.firmware_embedded} muted={muted} />
            <Row label="MAC" value={snapshot.identity.mac} muted={muted} />
            <Row label="Horloge" value={snapshot.identity.rtc} muted={muted} />
            <Row label="Ethernet" value={snapshot.identity.ethernet} muted={muted} />
            <Row label="Client" value={snapshot.client_id} muted={muted} />
          </Section>

          <Section title="Santé">
            <Row label="Secouru" value={snapshot.system.secouru ? 'Oui' : 'Non'} muted={muted} />
            <Row label="Alarme" value={snapshot.alarm.mode} muted={muted} />
            <Row label="Étape alarme" value={snapshot.alarm.step} muted={muted} />
            <Row label="Défauts comm." value={snapshot.system.comm_faults} muted={muted} />
            {snapshot.alarm.triggered && (
              <p className="text-amber-700 font-medium">Alarme déclenchée</p>
            )}
            {snapshot.alarm.water_leak && (
              <p className="text-amber-700 font-medium">Fuite détectée</p>
            )}
          </Section>

          <Section title="Confort">
            {snapshot.comfort.heating &&
              Object.entries(snapshot.comfort.heating).map(([zone, h]) => {
                const zoneHeat = h as ArmoireHeatingZone;
                return (
                <Row
                  key={zone}
                  label={zone.replace(/_/g, ' ')}
                  value={`${zoneHeat.consigne} (${zoneHeat.mode})`}
                  muted={muted}
                />
                );
              })}
            <Row label="Cumulus" value={snapshot.comfort.cumulus} muted={muted} />
            <Row label="Arrosage" value={snapshot.comfort.sprinkler} muted={muted} />
            <Row label="Dernier scénario" value={snapshot.comfort.scenario} muted={muted} />
          </Section>

          {(snapshot.energy.tariff || snapshot.energy.apparent_power_va) && (
            <Section title="Énergie">
              <Row label="Tarif" value={snapshot.energy.tariff} muted={muted} />
              <Row label="Période" value={snapshot.energy.period} muted={muted} />
              <Row label="Puissance apparente" value={snapshot.energy.apparent_power_va ? `${snapshot.energy.apparent_power_va} VA` : undefined} muted={muted} />
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

export default ArmoireStatusPanel;
