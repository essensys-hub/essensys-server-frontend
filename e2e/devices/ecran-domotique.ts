import type { Project } from '@playwright/test';

export type EcranDomotiqueProfile = 'landscape' | 'portrait' | 'compact';

export const ecranDomotiqueProfiles: Record<EcranDomotiqueProfile, Project['use']> = {
  landscape: {
    viewport: { width: 1024, height: 600 },
    screen: { width: 1024, height: 600 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
    userAgent:
      'Mozilla/5.0 (X11; Linux armv8l; ESSENSYS-WallPanel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
  },
  portrait: {
    viewport: { width: 600, height: 1024 },
    screen: { width: 600, height: 1024 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
    userAgent:
      'Mozilla/5.0 (X11; Linux armv8l; ESSENSYS-WallPanel Portrait) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
  },
  compact: {
    viewport: { width: 800, height: 480 },
    screen: { width: 800, height: 480 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
    userAgent:
      'Mozilla/5.0 (X11; Linux armv8l; ESSENSYS-WallPanel Compact) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
  },
};

export const ecranDomotiqueLandscape = ecranDomotiqueProfiles.landscape;
export const ecranDomotiquePortrait = ecranDomotiqueProfiles.portrait;
export const ecranDomotiqueCompact = ecranDomotiqueProfiles.compact;
