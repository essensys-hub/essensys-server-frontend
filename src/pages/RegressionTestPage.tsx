import React, { useCallback, useState } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { runRegressionSuite, REGRESSION_TEST_COUNT } from '../regression/runRegressionSuite';
import { serverRegressionClient } from '../regression/serverRegressionApi';
import type { RegressionSuiteSummary, RegressionTestResult } from '../regression/types';

const statusIcon = (status: RegressionTestResult['status']) => {
  if (status === 'passed') {
    return <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />;
  }
  if (status === 'failed') {
    return <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />;
  }
  if (status === 'running') {
    return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />;
  }
  return <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />;
};

export const RegressionTestPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RegressionTestResult[]>([]);
  const [summary, setSummary] = useState<RegressionSuiteSummary | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);

    const liveResults: RegressionTestResult[] = [];

    try {
      const suiteSummary = await runRegressionSuite(serverRegressionClient, (result) => {
        const idx = liveResults.findIndex((r) => r.id === result.id);
        if (idx >= 0) {
          liveResults[idx] = result;
        } else {
          liveResults.push(result);
        }
        setResults([...liveResults]);
      });
      setSummary(suiteSummary);
    } finally {
      setRunning(false);
    }
  }, []);

  const allPassed = summary !== null && summary.failed === 0;

  return (
    <div>
      <PageHeader
        title="Tests de non-régression"
        description="Smoke tests API en dry-run — aucune commande envoyée à l'armoire"
        icon={BeakerIcon}
        backLink="/settings"
        backLabel="Paramètres"
      />

      <div className="space-y-6">
        <ControlCard
          title="Suite smoke (mode test)"
          description={`${REGRESSION_TEST_COUNT} vérifications alignées sur la spec Playwright OpenSpec 2026-06.026`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Validation uniquement — test cible le chevet Petite Chambre 3 (k=613, v=64).
              Aucun scénario « Je sors » ni trigger k=590. Échec immédiat si la réponse contient un <code className="text-xs bg-gray-100 px-1 rounded">guid</code> (mode live).
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <ActionButton
                label={running ? 'Exécution…' : 'Lancer tous les tests'}
                variant="primary"
                onClick={handleRun}
                disabled={running}
              />
              {summary && (
                <span
                  className={`text-sm font-medium ${allPassed ? 'text-green-700' : 'text-red-700'}`}
                >
                  {summary.passed}/{summary.total} réussis — {summary.durationMs} ms
                </span>
              )}
            </div>
          </div>
        </ControlCard>

        {results.length > 0 && (
          <ControlCard title="Résultats" description="Détail par scénario de test">
            <ul className="divide-y divide-gray-100">
              {results.map((test) => (
                <li key={test.id} className="py-3 flex gap-3">
                  {statusIcon(test.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{test.name}</p>
                    <p className="text-xs text-gray-500">{test.description}</p>
                    {test.message && (
                      <p
                        className={`text-xs mt-1 ${
                          test.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {test.message}
                      </p>
                    )}
                  </div>
                  {test.durationMs !== undefined && (
                    <span className="text-xs text-gray-400 tabular-nums">{test.durationMs} ms</span>
                  )}
                </li>
              ))}
            </ul>
          </ControlCard>
        )}

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Pour la suite Playwright complète (navigation UI, CI), exécuter{' '}
          <code className="bg-amber-100 px-1 rounded">cd essensys-server-frontend/e2e && npm run test:demo</code>
        </div>
      </div>
    </div>
  );
};

export default RegressionTestPage;
