import React from 'react';
import { BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';

export const NotificationsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Configuration des alertes SMS et emails"
        icon={BellIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      <div className="space-y-6">
        {/* Unavailable Notice */}
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-yellow-800">
                Fonctionnalité non disponible
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                La configuration des notifications SMS et emails n'est pas disponible dans cette version. 
                Cette fonctionnalité nécessite une configuration spécifique du serveur backend.
              </p>
            </div>
          </div>
        </div>

        <ControlCard
          title="Notifications SMS"
          description="Recevez des alertes par SMS"
        >
          <div className="opacity-50 pointer-events-none">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  disabled
                  placeholder="+33 6 XX XX XX XX"
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 text-essensys-primary border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Activer les notifications SMS
                </label>
              </div>
            </div>
          </div>
        </ControlCard>

        <ControlCard
          title="Notifications Email"
          description="Recevez des alertes par email"
        >
          <div className="opacity-50 pointer-events-none">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  disabled
                  placeholder="votre@email.com"
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 text-essensys-primary border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Activer les notifications email
                </label>
              </div>
            </div>
          </div>
        </ControlCard>
      </div>
    </div>
  );
};

export default NotificationsPage;
