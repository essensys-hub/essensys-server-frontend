## Building with the Essensys design system

These are the real components from the Essensys home-automation portal (`essensys-web-react`,
a React 19 + Tailwind v4 app). Compose them; do not re-implement them.

### Required providers — wrap the app once

Every screen must be mounted inside three contexts, or components throw / render blank:

```tsx
import { ThemeProvider, DashboardProvider } from '<bundle>';
import { MemoryRouter } from 'react-router-dom';

<MemoryRouter>            {/* CardSummary, PageHeader, SidebarMenu, BottomTabs use Link/NavLink */}
  <ThemeProvider>        {/* drives the [data-theme] custom-property theme; useTheme() needs it */}
    <DashboardProvider>  {/* shared state for the control widgets (useDashboard) */}
      {/* your screen */}
    </DashboardProvider>
  </ThemeProvider>
</MemoryRouter>
```

`PreviewRoot` in the bundle is exactly this wrapper and may be used directly.

### Styling idiom — Tailwind v4 utilities + `--essensys-*` brand tokens

Style your own layout with **Tailwind utility classes**. Brand color comes from a small set of
project utilities backed by CSS custom properties (so they re-theme automatically):

| Utility | Token |
|---|---|
| `bg-essensys-primary`, `bg-essensys-primary-dark`, `text-essensys-primary`, `border-essensys-primary`, `ring-essensys-primary` | `--essensys-primary` (blue brand) |
| `bg-essensys-danger`, `bg-essensys-danger-dark` | `--essensys-danger` |
| `bg-essensys-success` | `--essensys-success` |

Surface/text tokens (use as `var(--…)` or via matching utilities): `--essensys-bg-app`,
`--essensys-bg-card`, `--essensys-bg-card-header`, `--essensys-border`, `--essensys-text-main`,
`--essensys-text-muted`, `--essensys-secondary`, `--essensys-warning`.

**Theme** is switched by setting `data-theme` on `<html>`: `light` (default), `dark`, `starwars`,
`startrek`. The same components recolor automatically — never hard-code hex brand colors.

### Where the truth lives

Read these in the bound copy before styling: `styles.css` (its `@import` closure pulls in
`_ds_bundle.css`, which holds the compiled Tailwind utilities and every `--essensys-*` definition),
and each component's `<Name>.prompt.md` + `<Name>.d.ts` for its real props.

### Conventions & gotchas

- **Icons** are `@heroicons/react` 24-outline components passed as the `icon`/`Icon` prop
  (a component type, not an element): `icon={FireIcon}`.
- **Responsive nav**: `SidebarMenu` is desktop-only (`hidden lg:flex`); `MobileHeader`,
  `BottomTabs`, `MobileDrawer` are mobile-only (`lg:hidden`). Use the matching one per breakpoint;
  `Layout` already wires them into the app shell.
- The brand logo is loaded from the host path `/images/logosml.png` (Header, sidebars) — serve that
  asset from your app root, or it shows as alt text.
- Open-loop UX: control widgets reflect the *last sent* command, not confirmed device state — keep
  the app's "État non garanti (boucle ouverte)" framing rather than implying guaranteed status.

### A typical composition

```tsx
import { ControlCard, ActionButton } from '<bundle>';

<ControlCard title="Chauffage salon" description="Thermostat connecté · zone jour">
  <div className="flex items-center justify-between">
    <p className="text-2xl font-semibold text-[color:var(--essensys-text-main)]">21°C</p>
    <ActionButton label="Régler" variant="primary" onClick={save} />
  </div>
</ControlCard>
```
