#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const device = process.argv[2];
const passthrough = process.argv.slice(3);
const targets = ['support', 'local', 'remote'];
const validDevices = ['desktop', 'iphone', 'android', 'ipad', 'ecran-domo', 'ecran-domo-compact', 'ecran-domo-portrait'];

if (!device || !validDevices.includes(device)) {
  console.error('Usage: npm run test:device -- <desktop|iphone|android|ipad|ecran-domo|ecran-domo-compact|ecran-domo-portrait> [playwright args]');
  process.exit(2);
}

const args = ['playwright', 'test', ...targets.map((target) => `--project=${target}-${device}`), ...passthrough];
const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
