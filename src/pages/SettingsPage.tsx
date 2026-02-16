import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, CheckCircleIcon, ShieldCheckIcon, ExclamationTriangleIcon, ServerStackIcon, ArrowTopRightOnSquareIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../context/ThemeContext';

const STORAGE_KEY = 'essensys_backend_config';

interface BackendConfig {
  dns: string;
  port: string;
}

const defaultConfig: BackendConfig = {
  dns: '',
  port: '443',
};

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<BackendConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to parse stored config', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const { theme, setTheme } = useTheme();

  const ThemeOption = ({ value, label, color }: { value: Theme; label: string; color: string }) => (
    <button
      onClick={() => setTheme(value)}
      className={`
        relative p-3 rounded-lg border-2 text-left transition-all
        ${theme === value
          ? 'border-essensys-primary ring-1 ring-essensys-primary'
          : 'border-transparent hover:border-gray-200'
        }
        bg-opacity-10
      `}
    >
      <div className={`h-8 w-full rounded mb-2 ${color} border`}></div>
      <span className={`text-sm font-medium ${theme === value ? 'text-essensys-primary' : 'text-gray-600'}`}>
        {label}
      </span>
      {theme === value && (
        <CheckCircleIcon className="absolute top-2 right-2 w-4 h-4 text-essensys-primary" />
      )}
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Configuration du système Essensys"
        icon={Cog6ToothIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      {/* Success Message */}
      {saved && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-sm text-green-700">Configuration enregistrée</p>
        </div>
      )}

      <div className="space-y-6">
        <ControlCard
          title="Configuration du serveur backend"
          description="Paramètres de connexion au serveur Essensys"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="dns" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse DNS / IP du serveur
              </label>
              <input
                id="dns"
                type="text"
                value={config.dns}
                onChange={(e) => setConfig({ ...config, dns: e.target.value })}
                placeholder="exemple.duckdns.org"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-essensys-primary focus:border-essensys-primary"
              />
              <p className="mt-1 text-xs text-gray-500">
                Laissez vide pour utiliser le serveur actuel (proxy nginx)
              </p>
            </div>

            <div>
              <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                id="port"
                type="text"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: e.target.value })}
                placeholder="443"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-essensys-primary focus:border-essensys-primary"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <ActionButton
                label="Enregistrer"
                variant="primary"
                onClick={handleSave}
              />
              <ActionButton
                label="Réinitialiser"
                variant="secondary"
                onClick={handleReset}
              />
            </div>
          </div>
        </ControlCard>

        {/* Theme Selection */}
        <ControlCard
          title="Apparence"
          description="Personnalisez l'affichage de l'application"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ThemeOption
              value="light"
              label="Clair"
              color="bg-white border-gray-200"
            />
            <ThemeOption
              value="dark"
              label="Sombre"
              color="bg-slate-900 border-slate-700"
            />
            <ThemeOption
              value="starwars"
              label="Star Wars"
              color="bg-black border-red-900"
            />
            <ThemeOption
              value="startrek"
              label="Star Trek"
              color="bg-black border-blue-500"
            />
          </div>
        </ControlCard>

        {/* Auth Status */}
        <ControlCard
          title="Authentification"
          description="Sécurité d'accès au système"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Authentification active</p>
                <p className="text-xs text-green-700 mt-1">
                  L'accès au système est protégé par authentification HTTP Basic au niveau du reverse-proxy Traefik.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Type d'authentification</span>
                <span className="font-medium text-gray-900">HTTP Basic (Traefik)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Méthode de hash</span>
                <span className="font-medium text-gray-900">bcrypt</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Protection WAN</span>
                <span className="font-medium text-green-600">Obligatoire</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Gestion des utilisateurs</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Utilisez la commande <code className="bg-amber-100 px-1 rounded">sudo essensys-auth</code> sur le Raspberry Pi pour gérer les utilisateurs et les modes d'authentification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ControlCard>

        {/* Control Plane */}
        <ControlCard
          title="Control Plane"
          description="Gestion des services Docker, logs, mises à jour et backups"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <ServerStackIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Interface d'administration</p>
                <p className="text-xs text-blue-700 mt-1">
                  Gérez les conteneurs Docker, consultez les logs en temps réel, 
                  vérifiez les mises à jour et gérez les backups du système.
                </p>
              </div>
            </div>
            <a
              href={`${window.location.protocol}//${window.location.hostname}:9100`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-essensys-primary text-white text-sm font-medium rounded-lg hover:bg-essensys-primary-dark transition-colors"
            >
              <ServerStackIcon className="w-4 h-4" />
              Ouvrir le Control Plane
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
          </div>
        </ControlCard>

        {/* Prometheus Monitoring */}
        <ControlCard
          title="Prometheus Monitoring"
          description="Métriques système, alertes et supervision des conteneurs"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-800">Stack de monitoring</p>
                <p className="text-xs text-purple-700 mt-1">
                  Prometheus collecte les métriques système (CPU, RAM, disque), Docker (état des conteneurs)
                  et applicatives (latence API, requêtes). Alertmanager gère les notifications d'alertes.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Prometheus</span>
                <span className="font-medium text-gray-900">Port 9092</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Alertmanager</span>
                <span className="font-medium text-gray-900">Port 9093</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Node Exporter</span>
                <span className="font-medium text-gray-900">Port 9101</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">cAdvisor</span>
                <span className="font-medium text-gray-900">Port 9095</span>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`${window.location.protocol}//${window.location.hostname}:9092`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ChartBarIcon className="w-4 h-4" />
                Prometheus
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
              <a
                href={`${window.location.protocol}//${window.location.hostname}:9093`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Alertmanager
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </ControlCard>

        {/* System Info */}
        <ControlCard title="Informations système">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Version application</span>
              <span className="text-sm font-medium text-gray-900">1.3.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Mode de connexion</span>
              <span className="text-sm font-medium text-gray-900">
                {window.location.protocol === 'https:' ? 'HTTPS sécurisé' : 'HTTP (Local)'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Hôte actuel</span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                {window.location.host}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Reverse Proxy</span>
              <span className="text-sm font-medium text-gray-900">Nginx + Traefik</span>
            </div>
          </div>
        </ControlCard>

        {/* Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">À propos de la sécurité</h4>
          <p className="text-sm text-blue-700">
            L'authentification est gérée au niveau du reverse-proxy Traefik.
            En accès WAN, un identifiant et mot de passe sont toujours requis.
            En LAN, l'accès est ouvert sans authentification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
