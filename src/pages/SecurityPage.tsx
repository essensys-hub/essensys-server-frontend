import React, { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { sendAlarmAction } from '../services/legacyApi';

export const SecurityPage: React.FC = () => {
  const [alarmCode, setAlarmCode] = useState('');
  const [loading, setLoading] = useState<'on' | 'off' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAlarmAction = async (action: 'on' | 'off') => {
    if (alarmCode.length !== 4) {
      setError('Le code alarme doit contenir 4 chiffres');
      return;
    }

    setLoading(action);
    setError(null);
    setSuccess(null);

    try {
      await sendAlarmAction(action, alarmCode);
      setSuccess(`Alarme ${action === 'on' ? 'activée' : 'désactivée'} avec succès`);
      setAlarmCode('');
    } catch (e) {
      setError("Erreur lors de l'envoi de la commande");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sécurité"
        description="Gestion de l'alarme et de la protection du domicile"
        icon={ShieldCheckIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      <div className="space-y-6">
        <ControlCard
          title="Contrôle de l'alarme"
          description="Entrez votre code à 4 chiffres pour activer ou désactiver l'alarme"
        >
          <div className="space-y-4">
            {/* Code Input */}
            <div>
              <label htmlFor="alarm-code" className="block text-sm font-medium text-gray-700 mb-1">
                Code alarme
              </label>
              <input
                id="alarm-code"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={alarmCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setAlarmCode(value);
                  setError(null);
                }}
                placeholder="••••"
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-essensys-primary focus:border-essensys-primary text-center text-2xl tracking-widest"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <ActionButton
                label="Activer l'alarme"
                variant="danger"
                onClick={() => handleAlarmAction('on')}
                loading={loading === 'on'}
                disabled={alarmCode.length !== 4 || loading !== null}
                size="lg"
              />
              <ActionButton
                label="Désactiver l'alarme"
                variant="success"
                onClick={() => handleAlarmAction('off')}
                loading={loading === 'off'}
                disabled={alarmCode.length !== 4 || loading !== null}
                size="lg"
              />
            </div>
          </div>
        </ControlCard>

        {/* Info Card */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">Information</h4>
          <p className="text-sm text-blue-700">
            Le système fonctionne en boucle ouverte : la commande est envoyée mais aucun retour d'état 
            n'est disponible. Vérifiez physiquement que l'alarme a bien changé d'état.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
