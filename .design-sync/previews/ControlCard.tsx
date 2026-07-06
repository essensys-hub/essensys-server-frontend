import { ControlCard, ActionButton } from 'essensys-web-react';

export const Default = () => (
  <div className="max-w-md">
    <ControlCard title="Chauffage salon" description="Thermostat connecté · zone jour">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Consigne</p>
          <p className="text-2xl font-semibold text-gray-900">21°C</p>
        </div>
        <ActionButton label="Régler" variant="primary" onClick={() => {}} />
      </div>
    </ControlCard>
  </div>
);

export const Highlighted = () => (
  <div className="max-w-md">
    <ControlCard
      title="Alarme"
      description="Système actuellement armé"
      highlighted
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-essensys-danger">
          <span className="h-2 w-2 rounded-full bg-essensys-danger" /> Armée
        </span>
        <ActionButton label="Désarmer" variant="danger" onClick={() => {}} />
      </div>
    </ControlCard>
  </div>
);

export const TextContent = () => (
  <div className="max-w-md">
    <ControlCard title="Configuration backend" description="Adresse du serveur domotique local">
      <p className="text-sm text-gray-600">
        Le portail communique avec la passerelle Raspberry via une boucle ouverte&nbsp;:
        chaque commande est envoyée sans accusé de réception. L'état affiché reflète la
        dernière action connue, pas l'état réel de l'équipement.
      </p>
    </ControlCard>
  </div>
);
