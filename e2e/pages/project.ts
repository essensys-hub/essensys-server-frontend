import type { TestInfo } from '@playwright/test';

export type EssensysTarget = 'support' | 'local' | 'remote' | 'demo';
export type EssensysDevice = 'desktop' | 'iphone' | 'android' | 'ipad' | 'ecran-domo' | 'ecran-domo-compact' | 'ecran-domo-portrait';

const TARGETS: EssensysTarget[] = ['support', 'local', 'remote', 'demo'];

export function getTargetFromProject(projectName: string): EssensysTarget {
  const target = TARGETS.find((candidate) => projectName === candidate || projectName.startsWith(`${candidate}-`));
  if (!target) {
    throw new Error(`Projet Playwright ESSENSYS invalide, cible inconnue: ${projectName}`);
  }
  return target;
}

export function getDeviceFromProject(projectName: string): EssensysDevice {
  const target = getTargetFromProject(projectName);
  const suffix = projectName.replace(`${target}-`, '');
  if (!suffix || suffix === target) return 'desktop';
  if (suffix === 'ecran-domo-compact' || suffix === 'ecran-domo-portrait') return suffix;
  if (suffix === 'desktop' || suffix === 'iphone' || suffix === 'android' || suffix === 'ipad' || suffix === 'ecran-domo') return suffix;
  throw new Error(`Projet Playwright ESSENSYS invalide, device inconnu: ${projectName}`);
}

export function currentTarget(testInfo: TestInfo): EssensysTarget {
  return getTargetFromProject(testInfo.project.name);
}

export function currentDevice(testInfo: TestInfo): EssensysDevice {
  return getDeviceFromProject(testInfo.project.name);
}

export function isCompactViewport(testInfo: TestInfo): boolean {
  return ['iphone', 'android', 'ecran-domo', 'ecran-domo-compact', 'ecran-domo-portrait'].includes(currentDevice(testInfo));
}
