#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const targets = ['support', 'local', 'remote'];
const devices = ['desktop', 'iphone', 'android', 'ipad', 'ecran-domo'];
const passthrough = process.argv.slice(2);
const args = ['playwright', 'test', ...targets.flatMap((target) => devices.map((device) => `--project=${target}-${device}`)), ...passthrough];

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
