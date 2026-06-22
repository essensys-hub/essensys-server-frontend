import type { DryRunResponse } from '../testMode';

export type RegressionTestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface RegressionTestResult {
  id: string;
  name: string;
  description: string;
  status: RegressionTestStatus;
  durationMs?: number;
  message?: string;
}

export interface RegressionClient {
  injectDryRun(k: number, v: string): Promise<DryRunResponse>;
  listScenarios(): Promise<Array<{ slot_number: number; label: string }>>;
  readExchange(keys: number[]): Promise<Array<{ k: number; v: string }>>;
}

export interface RegressionSuiteSummary {
  results: RegressionTestResult[];
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}
