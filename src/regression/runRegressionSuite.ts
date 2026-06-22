import type {
  RegressionClient,
  RegressionSuiteSummary,
  RegressionTestResult,
} from './types';

interface TestDef {
  id: string;
  name: string;
  description: string;
  run: (client: RegressionClient) => Promise<string>;
}

const TESTS: TestDef[] = [
  {
    id: 'inject-dry-run',
    name: 'Inject dry-run (k=590)',
    description: 'Valide une écriture trigger sans enqueue firmware',
    async run(client) {
      const data = await client.injectDryRun(590, '2');
      if (data.status !== 'test_ok' || !data.dry_run) {
        throw new Error(data.message ?? `statut inattendu : ${data.status}`);
      }
      return data.message ?? 'test_ok';
    },
  },
  {
    id: 'scenarios-list',
    name: 'Liste des scénarios',
    description: 'Vérifie le slot « Je sors » (slot 2)',
    async run(client) {
      const slots = await client.listScenarios();
      if (slots.length < 8) {
        throw new Error(`Attendu ≥8 slots, reçu ${slots.length}`);
      }
      const slot2 = slots.find((s) => s.slot_number === 2);
      if (!slot2?.label.includes('Je sors')) {
        throw new Error(`Slot 2 introuvable ou libellé incorrect : ${slot2?.label ?? '—'}`);
      }
      return `${slots.length} slots, « ${slot2.label} » OK`;
    },
  },
  {
    id: 'scenario-launch-dry-run',
    name: 'Lancement scénario dry-run',
    description: 'POST launch slot 2 en mode test',
    async run(client) {
      const data = await client.launchScenarioDryRun(2);
      if (data.status !== 'test_ok' || !data.dry_run) {
        throw new Error(data.message ?? `statut inattendu : ${data.status}`);
      }
      return data.message ?? 'test_ok';
    },
  },
  {
    id: 'exchange-read',
    name: 'Lecture exchange chauffage',
    description: 'GET exchange clés 349–352 (lecture seule)',
    async run(client) {
      const values = await client.readExchange([349, 350, 351, 352]);
      if (!Array.isArray(values)) {
        throw new Error('Réponse exchange invalide');
      }
      return `${values.length} valeur(s) lue(s)`;
    },
  },
  {
    id: 'inject-invalid',
    name: 'Rejet paramètre invalide',
    description: 'Index hors plage doit retourner test_failed',
    async run(client) {
      const data = await client.injectDryRun(99999, '1');
      if (data.status === 'test_ok') {
        throw new Error('Index invalide accepté à tort');
      }
      return data.message ?? 'test_failed attendu';
    },
  },
];

export async function runRegressionSuite(
  client: RegressionClient,
  onProgress?: (result: RegressionTestResult) => void,
): Promise<RegressionSuiteSummary> {
  const suiteStart = performance.now();
  const results: RegressionTestResult[] = [];

  for (const test of TESTS) {
    const pending: RegressionTestResult = {
      id: test.id,
      name: test.name,
      description: test.description,
      status: 'running',
    };
    onProgress?.(pending);

    const start = performance.now();
    try {
      const message = await test.run(client);
      const passed: RegressionTestResult = {
        ...pending,
        status: 'passed',
        durationMs: Math.round(performance.now() - start),
        message,
      };
      results.push(passed);
      onProgress?.(passed);
    } catch (err) {
      const failed: RegressionTestResult = {
        ...pending,
        status: 'failed',
        durationMs: Math.round(performance.now() - start),
        message: err instanceof Error ? err.message : String(err),
      };
      results.push(failed);
      onProgress?.(failed);
    }
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  return {
    results,
    passed,
    failed,
    total: results.length,
    durationMs: Math.round(performance.now() - suiteStart),
  };
}

export const REGRESSION_TEST_COUNT = TESTS.length;
