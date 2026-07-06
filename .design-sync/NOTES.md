# design-sync NOTES — essensys-web-react

## Source shape
- This is a Vite **app** (`essensys-web-react`), not a published component library.
  There is no library `dist` entry and no shipped `.d.ts`, so the converter runs in
  **synth-entry mode** (`[NO_DIST]` is expected, not an error): it bundles `export *`
  from every `src` file and we pin the component set explicitly via `componentSrcMap`.
- All 24 components are pinned in `componentSrcMap` (orchestrator-owned).

## Styling
- Tailwind v4 (`@import "tailwindcss"` in `src/index.css`) + `--essensys-*` CSS custom
  properties with `[data-theme]` theming (light / dark / starwars / startrek).
- esbuild does NOT run Tailwind, so component utility classes are only present in the
  **compiled** CSS. `buildCmd` runs `npm run build` then copies the hashed
  `dist/assets/index-*.css` to the stable `.design-sync/compiled.css`, which `cssEntry`
  points at. The dist filename is content-hashed and changes every build — never point
  `cssEntry` at the hashed file directly.

## Providers
- Components read 3 contexts: react-router-dom (`Link`/`NavLink`/`useNavigate`),
  `ThemeContext` (`useTheme`), `DashboardContext` (`useDashboard`). `.design-sync/preview-root.tsx`
  exports `PreviewRoot` wrapping MemoryRouter → ThemeProvider → DashboardProvider; it is
  merged into the bundle via `extraEntries` and used as `cfg.provider.component`.

## Fonts ([FONT_MISSING])
- `src/index.css` references "Arial Narrow", "Antonio", "Impact", "Lucida Grande",
  "Lucida Sans Unicode" in font-family stacks, each with a `sans-serif` (or
  Helvetica/Arial) fallback in the SAME declaration and NO `@font-face`. The app
  deliberately leaves these to the host OS and falls back to system sans. Suppressed
  via `cfg.runtimeFontPrefixes` — this is the designed behaviour, not a substitution.
  Lines 153 (decorative condensed stack), 296 & 691 (Lucida UI stack) in src/index.css.

## Fixed / breakpoint-gated components (IMPORTANT for re-sync)
- `.ds-single` mount has `transform:translateZ(0)`, which makes descendant
  `position:fixed` resolve against the mount, not the viewport. Components that are
  `fixed` need help: **SidebarMenu** (`lg:fixed lg:inset-y-0`, flex-1 nav) collapses
  unless its preview wraps it in a sized transformed frame (240×720) — see its
  preview. BottomTabs/MobileDrawer/MobileHeader survive because their content sizes
  themselves.
- Breakpoint gating drives viewport choice (set via `cfg.overrides.<n>.viewport`):
  SidebarMenu is `hidden lg:flex` (desktop-only → needs ≥1024 width, uses 1080);
  BottomTabs / MobileDrawer / MobileHeader are `lg:hidden` (mobile-only → <1024).
- The brand logo `/images/logosml.png` (Header, SidebarMenu, MobileDrawer, MobileHeader)
  is an absolute host-served path — it shows as alt text in previews. It is a
  host-app asset, documented in conventions.md. (Source: public/images/logosml.png.)

## Known render warns (all triaged benign — verified good via review sheets)
- `[RENDER_BLANK] BottomTabs / MobileDrawer / MobileHeader` in validate: these are
  `lg:hidden` (mobile-only) and validate's render check runs at 1200px where they are
  `display:none`. They render correctly at their declared mobile single viewports
  (confirmed in `_screenshots/review/`). Graded good.
- `[RENDER_THIN] ScenarioEditorDrawer` (0px height) in validate: fixed overlay; validate
  doesn't honor the single-card viewport for its 1200px render check. Renders correctly
  at its declared 680×760 viewport (confirmed). Graded good.

## Re-sync risks
- `cssEntry` depends on `buildCmd` having run (regenerates `.design-sync/compiled.css`).
  Always run `buildCmd` before the converter. `.design-sync/compiled.css` is gitignored, so
  on a fresh clone the FIRST build must run `buildCmd` (npm run build) or `cssEntry` is missing.
- PKG_DIR can't be found via node_modules (the app isn't self-installed). Always pass
  `--entry ./.design-sync/lib-entry.tsx` so the build resolves the repo root.
- `lib-entry.tsx` (the hand-written barrel) and `componentSrcMap` (24 entries) BOTH enumerate the
  component set — adding/removing a component means editing both, in sync.
- `.ds-sync/package.json` has no deps pinned; `npm i <one-pkg>` there PRUNES the others.
  Reinstall all together: `npm i esbuild ts-morph @types/react playwright`.
- Playwright/chromium: installed in `~/.cache/ms-playwright` (chromium-headless-shell v1228,
  playwright 1.61). A failed download can bloat the cache and fill the disk — `rm -rf` it and retry.
- Conventions header (`conventions.md`) names `--essensys-*` tokens and `*-essensys-*` utilities;
  re-validate them against the fresh build if `src/index.css` changes the theme.
- Three benign render warns are EXPECTED every run (see Known render warns) — not new issues.
- Provider chain (PreviewRoot) wraps MemoryRouter→ThemeProvider→DashboardProvider; if a new
  component reads another context, extend `.design-sync/preview-root.tsx`.
