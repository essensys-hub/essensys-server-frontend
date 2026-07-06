import { HeatingControl } from 'essensys-web-react';

const modes = [
  { value: '1', label: 'Automatique (planning)' },
  { value: '17', label: 'Forçage confort' },
  { value: '18', label: 'Forçage éco' },
  { value: '21', label: 'Forçage hors gel' },
  { value: '16', label: 'OFF' },
];

export const Default = () => (
  <div className="max-w-md">
    <HeatingControl id="zone-salon" title="Chauffage salon" name="salon" options={modes} />
  </div>
);

export const Chambre = () => (
  <div className="max-w-md">
    <HeatingControl id="zone-chambre" title="Chauffage chambre" name="chambre" options={modes} />
  </div>
);
