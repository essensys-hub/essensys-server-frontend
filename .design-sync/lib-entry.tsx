// design-sync bundle entry. essensys-web-react is a Vite app, not a published
// library, so there is no dist entry that exports its components. This barrel
// re-exports the 24 synced components (their real source, compiled by esbuild)
// plus the PreviewRoot provider wrapper, and is pointed at via cfg.entry.
// The component set here must stay in sync with cfg.componentSrcMap.

// UI primitives
export { ActionButton } from '../src/components/UI/ActionButton';
export { CardSummary } from '../src/components/UI/CardSummary';
export { ControlCard } from '../src/components/UI/ControlCard';
export { PageHeader } from '../src/components/UI/PageHeader';

// Dashboard controls
export { AlarmControl } from '../src/components/Dashboard/AlarmControl';
export { BackendConfig } from '../src/components/Dashboard/BackendConfig';
export { HeatingControl } from '../src/components/Dashboard/HeatingControl';
export { LightingControl } from '../src/components/Dashboard/LightingControl';
export { NotificationControl } from '../src/components/Dashboard/NotificationControl';
export { ShutterControl } from '../src/components/Dashboard/ShutterControl';
export { SprinklerControl } from '../src/components/Dashboard/SprinklerControl';
export { WaterHeaterControl } from '../src/components/Dashboard/WaterHeaterControl';

// Heating
export { HeatingScheduleGrid } from '../src/components/Heating/HeatingScheduleGrid';
export { InjectionSaveConsole } from '../src/components/Heating/InjectionSaveConsole';

// Layout
export { Header } from '../src/components/Layout/Header';
export { Layout } from '../src/components/Layout/Layout';

// Navigation
export { BottomTabs } from '../src/components/Navigation/BottomTabs';
export { MobileDrawer } from '../src/components/Navigation/MobileDrawer';
export { MobileHeader } from '../src/components/Navigation/MobileHeader';
export { SidebarMenu } from '../src/components/Navigation/SidebarMenu';

// Scenarios
export { ScenarioButtonGrid } from '../src/components/Scenarios/ScenarioButtonGrid';
export { ScenarioEditorDrawer } from '../src/components/Scenarios/ScenarioEditorDrawer';

// Settings
export { SyncSettingsPanel } from '../src/components/Settings/SyncSettingsPanel';

// UniFi
export { CameraCard } from '../src/components/UniFi/CameraCard';

// Preview/provider wrapper (used by cfg.provider)
export { PreviewRoot } from './preview-root';
