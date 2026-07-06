import { ScenarioButtonGrid } from 'essensys-web-react';

const slots = [
  { slot_number: 1, label: 'Soirée', base_index: 100, end_index: 110, editable: true, last_launched: 1718900000 },
  { slot_number: 2, label: 'Nuit', base_index: 111, end_index: 121, editable: true },
  { slot_number: 3, label: 'Absent', base_index: 122, end_index: 132, editable: true },
  { slot_number: 4, label: 'Vacances', base_index: 133, end_index: 143, editable: true },
  { slot_number: 5, label: 'Réveil', base_index: 144, end_index: 154, editable: true },
  { slot_number: 6, label: 'Cinéma', base_index: 155, end_index: 165, editable: false },
];

export const Default = () => (
  <ScenarioButtonGrid
    slots={slots}
    launchingSlot={2}
    onLaunch={() => {}}
    onEdit={() => {}}
  />
);
