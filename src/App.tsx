import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts';
import {
  DashboardPage,
  UniFiProtectPage,
  SecurityPage,
  HeatingPage,
  LightingPage,
  ShuttersPage,
  WaterHeaterPage,
  SprinklerPage,
  NotificationsPage,
  SettingsPage,
  ScenariosPage,
  RegressionTestPage,
  LoginPage,
  LoginPreviewPage,
  AccountSettingsPage,
  LanUsersAdminPage,
} from './pages';
import { LanAuthGate } from './components/LanAuthGate';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanIamProvider } from './context/LanIamContext';
import { TestModeProvider } from './context/TestModeContext';

function App() {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const demoRoot = import.meta.env.VITE_DEMO_ROOT === 'true';
  const routerBasename =
    demoMode && !demoRoot
      ? import.meta.env.BASE_URL.replace(/\/dashboard\/?$/, '')
      : undefined;

  const app = (
    <DashboardProvider>
      <ThemeProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/preview" element={<LoginPreviewPage />} />
            <Route element={<LanAuthGate />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/unifi-protect" element={<UniFiProtectPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/heating" element={<HeatingPage />} />
                <Route path="/lighting" element={<LightingPage />} />
                <Route path="/scenarios" element={<ScenariosPage />} />
                <Route path="/shutters" element={<ShuttersPage />} />
                <Route path="/water-heater" element={<WaterHeaterPage />} />
                <Route path="/sprinkler" element={<SprinklerPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/account" element={<AccountSettingsPage />} />
                <Route path="/settings/users" element={<LanUsersAdminPage />} />
                <Route path="/admin/regression" element={<RegressionTestPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </DashboardProvider>
  );

  return (
    <LanIamProvider>
      <TestModeProvider>{app}</TestModeProvider>
    </LanIamProvider>
  );
}

export default App;
