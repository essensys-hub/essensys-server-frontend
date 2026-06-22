import type { BitmaskField, ScenarioSlotDetail, ScenarioSlotSummary } from './services/scenarioApi';

const PARAM_COUNT = 41;
const SCENARIO1_BASE = 592;

const SLOT_LABELS: Record<number, string> = {
  1: 'Réservé serveur',
  2: 'Je sors',
  3: 'Je pars en vacances',
  4: 'Je rentre',
  5: 'Je vais me coucher',
  6: 'Je me lève',
  7: 'Personnalisé 1',
  8: 'Personnalisé 2',
};

function slotBaseIndex(slot: number): number {
  return SCENARIO1_BASE + (slot - 1) * PARAM_COUNT;
}

export function mockScenarioSlots(): ScenarioSlotSummary[] {
  return Array.from({ length: 8 }, (_, i) => {
    const slot = i + 1;
    const base = slotBaseIndex(slot);
    return {
      slot_number: slot,
      label: SLOT_LABELS[slot] ?? `Scénario ${slot}`,
      base_index: base,
      end_index: base + PARAM_COUNT - 1,
      editable: slot >= 2,
      ...(slot === 2 ? { last_launched: 2 } : {}),
    };
  });
}

export function mockScenarioDetail(slot: number): ScenarioSlotDetail {
  const base = slotBaseIndex(slot);
  const summary = mockScenarioSlots().find((s) => s.slot_number === slot)!;
  return {
    ...summary,
    params: Array.from({ length: PARAM_COUNT }, (_, offset) => ({
      k: base + offset,
      v: '0',
    })),
  };
}

export function mockScenarioBitmasks(): BitmaskField[] {
  return [
    {
      index: 605,
      name: 'Eteindre_PDV_LSB',
      bits: [
        { bit: 0, value: 1, label: 'Entrée' },
        { bit: 1, value: 2, label: 'Salon 1' },
        { bit: 2, value: 4, label: 'Salon 2' },
        { bit: 3, value: 8, label: 'Dressing 1' },
        { bit: 4, value: 16, label: 'Dressing 2' },
      ],
    },
    {
      index: 606,
      name: 'Eteindre_PDV_MSB',
      bits: [
        { bit: 5, value: 32, label: 'Var. bureau' },
        { bit: 6, value: 64, label: 'Var. salle à manger' },
        { bit: 7, value: 128, label: 'Var. salon' },
      ],
    },
    {
      index: 607,
      name: 'Eteindre_CHB_LSB',
      bits: [
        { bit: 0, value: 1, label: 'Escalier' },
        { bit: 1, value: 2, label: 'Gr. chambre 1' },
        { bit: 2, value: 4, label: 'Gr. chambre 2' },
        { bit: 3, value: 8, label: 'Pet. chambre 1-1' },
        { bit: 4, value: 16, label: 'Pet. chambre 1-2' },
        { bit: 5, value: 32, label: 'Pet. chambre 2' },
        { bit: 6, value: 64, label: 'Pet. chambre 3' },
      ],
    },
    {
      index: 613,
      name: 'Allumer_CHB_LSB',
      bits: [
        { bit: 0, value: 1, label: 'Escalier' },
        { bit: 1, value: 2, label: 'Gr. chambre 1' },
        { bit: 2, value: 4, label: 'Gr. chambre 2' },
        { bit: 3, value: 8, label: 'Pet. chambre 1-1' },
        { bit: 4, value: 16, label: 'Pet. chambre 1-2' },
        { bit: 5, value: 32, label: 'Pet. chambre 2' },
        { bit: 6, value: 64, label: 'Pet. chambre 3' },
      ],
    },
    {
      index: 617,
      name: 'OuvrirVolets_PDV',
      bits: [
        { bit: 0, value: 1, label: 'Salon 1' },
        { bit: 1, value: 2, label: 'Salon 2' },
        { bit: 2, value: 4, label: 'Salon 3' },
        { bit: 3, value: 8, label: 'SAM 1' },
        { bit: 4, value: 16, label: 'SAM 2' },
        { bit: 5, value: 32, label: 'Bureau' },
      ],
    },
    {
      index: 620,
      name: 'FermerVolets_PDV',
      bits: [
        { bit: 0, value: 1, label: 'Salon 1' },
        { bit: 1, value: 2, label: 'Salon 2' },
        { bit: 2, value: 4, label: 'Salon 3' },
        { bit: 3, value: 8, label: 'SAM 1' },
        { bit: 4, value: 16, label: 'SAM 2' },
        { bit: 5, value: 32, label: 'Bureau' },
      ],
    },
  ];
}

export function handleMockScenarioRequest(
  url: string,
  method: string,
): Response | null {
  if (!url.includes('/api/scenarios')) {
    return null;
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const path = new URL(url, window.location.origin).pathname;

  if (path.endsWith('/meta/bitmasks') && method === 'GET') {
    return json({ fields: mockScenarioBitmasks() });
  }

  if (path === '/api/scenarios' && method === 'GET') {
    return json({ slots: mockScenarioSlots() });
  }

  const slotMatch = path.match(/\/api\/scenarios\/(\d+)(?:\/(.*))?$/);
  if (!slotMatch) {
    return json({ error: 'not found' }, 404);
  }

  const slot = parseInt(slotMatch[1], 10);
  const action = slotMatch[2] ?? '';

  if (action === 'launch' && method === 'POST') {
    const isDryRun = url.includes('test_mode=dry_run');
    if (isDryRun) {
      return json({
        status: 'test_ok',
        dry_run: true,
        message: 'Validation OK — non envoyé à l\'armoire (mock)',
        validated_params: [{ k: 590, v: String(slot) }],
      });
    }
    return json({ guid: `mock-scenario-launch-${slot}`, slot });
  }
  if (action === 'restore' && method === 'POST') {
    return json({ guid: `mock-scenario-restore-${slot}`, slot });
  }
  if (action === '' && method === 'GET') {
    return json(mockScenarioDetail(slot));
  }
  if (action === '' && method === 'PUT') {
    return json({ guids: [`mock-scenario-put-${slot}`], slot });
  }

  return json({ error: 'not found' }, 404);
}
