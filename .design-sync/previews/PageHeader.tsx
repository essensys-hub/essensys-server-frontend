import { PageHeader, ActionButton } from 'essensys-web-react';
import { FireIcon } from '@heroicons/react/24/outline';

export const Default = () => (
  <div className="max-w-3xl">
    <PageHeader
      title="Tableau de bord"
      description="Pilotez l'ensemble de vos équipements domotiques Essensys"
    />
  </div>
);

export const WithIconAndActions = () => (
  <div className="max-w-3xl">
    <PageHeader
      title="Chauffage"
      description="Planning hebdomadaire et consignes par zone"
      icon={FireIcon}
      actions={<ActionButton label="Enregistrer" variant="primary" onClick={() => {}} />}
    />
  </div>
);

export const WithBackLink = () => (
  <div className="max-w-3xl">
    <PageHeader
      title="Paramètres de synchronisation"
      description="Fréquence et options de remontée d'état"
      backLink="/settings"
      backLabel="Retour aux réglages"
    />
  </div>
);
