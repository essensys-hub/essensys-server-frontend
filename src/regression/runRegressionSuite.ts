import type {
  RegressionClient,
  RegressionSuiteSummary,
  RegressionTestResult,
} from './types';
import { assertDryRunOnly } from './assertDryRun';
import { CHEVET_PETITE_CHAMBRE_3 } from './lightingFixtures';

interface TestDef {
  id: string;
  name: string;
  description: string;
  run: (client: RegressionClient) => Promise<string>;
}

const TESTS: TestDef[] = [
  {
    id: 'lighting-chevet-pc3-on',
    name: 'Chevet PC3 — allumer (dry-run)',
    description: `k=${CHEVET_PETITE_CHAMBRE_3.onIndex} v=${CHEVET_PETITE_CHAMBRE_3.dvalue} — aucune action armoire`,
    async run(client) {
      const data = await client.injectDryRun(
        CHEVET_PETITE_CHAMBRE_3.onIndex,
        CHEVET_PETITE_CHAMBRE_3.dvalue,
      );
      assertDryRunOnly(data);
      const validated = data.validated_params?.find((p) => p.k === CHEVET_PETITE_CHAMBRE_3.onIndex);
      if (!validated) {
        throw new Error('validated_params ne contient pas k=613');
      }
      return `${CHEVET_PETITE_CHAMBRE_3.name} validé — ${data.message ?? 'test_ok'}`;
    },
  },
  {
    id: 'scenarios-list',
    name: 'Liste des scénarios (lecture)',
    description: 'GET scénarios — aucune écriture',
    async run(client) {
      const slots = await client.listScenarios();
      if (slots.length < 8) {
        throw new Error(`Attendu ≥8 slots, reçu ${slots.length}`);
      }
      return `${slots.length} slots chargés`;
    },
  },
  {
    id: 'exchange-read',
    name: 'Lecture exchange éclairage',
    description: `GET exchange k=${CHEVET_PETITE_CHAMBRE_3.onIndex} (lecture seule)`,
    async run(client) {
      const values = await client.readExchange([
        CHEVET_PETITE_CHAMBRE_3.onIndex,
        CHEVET_PETITE_CHAMBRE_3.offIndex,
      ]);
      if (!Array.isArray(values)) {
        throw new Error('Réponse exchange invalide');
      }
      return `${values.length} valeur(s) lue(s)`;
    },
  },
  {
    id: 'inject-invalid',
    name: 'Rejet paramètre invalide',
    description: "Index hors plage → test_failed, pas d'enqueue",
    async run(client) {
      const data = await client.injectDryRun(99999, '1');
      if (data.status === 'test_ok' && data.dry_run) {
        throw new Error('Index invalide accepté à tort');
      }
      if ((data as { guid?: string }).guid) {
        throw new Error('Index invalide a produit un guid live');
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
