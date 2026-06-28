import React, { useMemo, useState } from 'react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '../components/UI';

type KitchenShutterAction = {
  id: string;
  label: string;
  description: string;
  actionIndex: 619 | 622;
  value: '1' | '2' | '3';
  kind: 'open' | 'close';
};

type SimulatedPayload = {
  action: { k: number; v: string };
  trigger: { k: number; v: string };
};

const SCENARIO_TRIGGER = { k: 590, v: '1' } as const;

const kitchenActions: KitchenShutterAction[] = [
  {
    id: 'open-kitchen-1',
    label: 'Ouvrir volet cuisine 1',
    description: 'Table d’échange cuisine gauche / masque 1',
    actionIndex: 619,
    value: '1',
    kind: 'open',
  },
  {
    id: 'open-kitchen-2',
    label: 'Ouvrir volet cuisine 2',
    description: 'Table d’échange cuisine droite / masque 2',
    actionIndex: 619,
    value: '2',
    kind: 'open',
  },
  {
    id: 'open-kitchen-both',
    label: 'Ouvrir les deux volets cuisine',
    description: 'Masque combiné 1 OR 2 = 3',
    actionIndex: 619,
    value: '3',
    kind: 'open',
  },
  {
    id: 'close-kitchen-1',
    label: 'Fermer volet cuisine 1',
    description: 'Table d’échange cuisine gauche / masque 1',
    actionIndex: 622,
    value: '1',
    kind: 'close',
  },
  {
    id: 'close-kitchen-2',
    label: 'Fermer volet cuisine 2',
    description: 'Table d’échange cuisine droite / masque 2',
    actionIndex: 622,
    value: '2',
    kind: 'close',
  },
  {
    id: 'close-kitchen-both',
    label: 'Fermer les deux volets cuisine',
    description: 'Masque combiné 1 OR 2 = 3',
    actionIndex: 622,
    value: '3',
    kind: 'close',
  },
];

function payloadFor(action: KitchenShutterAction): SimulatedPayload {
  return {
    action: { k: action.actionIndex, v: action.value },
    trigger: { ...SCENARIO_TRIGGER },
  };
}

function payloadText(payload: SimulatedPayload): string {
  return JSON.stringify(
    [
      payload.action,
      payload.trigger,
    ],
    null,
    2,
  );
}

export const KitchenShutterTestConsolePage: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState<KitchenShutterAction>(kitchenActions[2]);
  const payload = useMemo(() => payloadFor(selectedAction), [selectedAction]);

  return (
    <div data-testid="kitchen-shutter-test-console" className="space-y-6">
      <PageHeader
        title="Console scénario cuisine"
        description="Simulation no-armoire des payloads legacy pour les volets cuisine"
        icon={BeakerIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      <section
        data-testid="no-armoire-banner"
        className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-wide">Mode test no-armoire</p>
        <p className="mt-1 text-sm">
          Cette console calcule les indices de table d’échange mais n’envoie aucune commande à une
          vraie armoire. Les tests Playwright bloquent aussi les endpoints d’injection et de lancement
          scénario.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Actions volets cuisine</h2>
            <p className="text-sm text-slate-500">
              Choisir une action met à jour le payload simulé : ouvrir = k=619, fermer = k=622,
              déclenchement scénario = k=590.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {kitchenActions.map((action) => (
              <button
                key={action.id}
                type="button"
                data-testid={`kitchen-action-${action.id}`}
                onClick={() => setSelectedAction(action)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedAction.id === action.id
                    ? 'border-essensys-primary bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white'
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900">{action.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{action.description}</span>
                <span className="mt-3 inline-flex rounded-full bg-slate-900 px-2 py-1 text-xs font-mono text-white">
                  k={action.actionIndex} · v={action.value}
                </span>
              </button>
            ))}
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dernière simulation</h2>
          <p data-testid="last-simulated-action" className="mt-2 text-sm font-medium text-blue-700">
            {selectedAction.label}
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Payload action</dt>
              <dd data-testid="action-payload" className="mt-1 font-mono text-slate-900">
                {`{ "k": ${payload.action.k}, "v": "${payload.action.v}" }`}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Trigger scénario</dt>
              <dd data-testid="trigger-payload" className="mt-1 font-mono text-slate-900">
                {`{ "k": ${payload.trigger.k}, "v": "${payload.trigger.v}" }`}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Aperçu JSON legacy dry-run</h2>
            <p className="text-sm text-slate-300">Payload calculé localement, non envoyé.</p>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
            no-armoire actif
          </span>
        </div>
        <pre
          data-testid="legacy-payload-preview"
          className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed text-emerald-100"
        >
          {payloadText(payload)}
        </pre>
      </section>
    </div>
  );
};
