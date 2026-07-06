import { ScenarioEditorDrawer } from 'essensys-web-react';

const detail = {
  slot_number: 1,
  label: 'Soirée',
  base_index: 100,
  end_index: 110,
  editable: true,
  last_launched: 1718900000,
  params: [
    { k: 100, v: '1' },
    { k: 101, v: '17' },
    { k: 102, v: '0' },
    { k: 103, v: '255' },
  ],
};

const bitmasks = [
  {
    index: 100,
    name: 'Éclairages',
    description: 'État des zones lumineuses',
    bits: [
      { bit: 0, value: 1, label: 'Salon' },
      { bit: 1, value: 0, label: 'Cuisine' },
      { bit: 2, value: 1, label: 'Couloir' },
    ],
  },
];

// Overlay drawer — rendered open with a loaded scenario.
export const Open = () => (
  <ScenarioEditorDrawer
    open
    slot={1}
    detail={detail}
    bitmasks={bitmasks}
    loading={false}
    saving={false}
    onClose={() => {}}
    onSave={() => {}}
    onLaunch={() => {}}
    onRestore={() => {}}
  />
);
