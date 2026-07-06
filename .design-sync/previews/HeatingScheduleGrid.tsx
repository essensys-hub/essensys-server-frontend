import { HeatingScheduleGrid } from 'essensys-web-react';

const zone = {
  id: 'salon',
  name: 'Salon',
  scheduleTitle: 'Planning salon',
  modeIndex: 37,
  scheduleStartIndex: 40,
  scheduleByteCount: 84,
  immediateModes: [
    { value: '1', label: 'Automatique (planning)' },
    { value: '17', label: 'Forçage confort' },
    { value: '16', label: 'OFF' },
  ],
};

// 7 days × 24 hours of consignes (0–5). Eco at night, confort during the day.
const grid = Array.from({ length: 7 }, () =>
  Array.from({ length: 24 }, (_, h) => (h >= 7 && h <= 22 ? 3 : 2)),
);
const baseline = grid.map((row) => [...row]);

export const Default = () => (
  <HeatingScheduleGrid
    zone={zone}
    grid={grid}
    baseline={baseline}
    onChange={() => {}}
    onSave={() => {}}
    onCancel={() => {}}
    onSync={() => {}}
    saving={false}
    syncing={false}
    loading={false}
    saveProgress={null}
  />
);
