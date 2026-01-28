import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts';
import {
  DashboardPage,
  SecurityPage,
  HeatingPage,
  LightingPage,
  ShuttersPage,
  WaterHeaterPage,
  SprinklerPage,
  NotificationsPage,
  SettingsPage,
} from './pages';
import { DashboardProvider } from './context/DashboardContext';

function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/heating" element={<HeatingPage />} />
            <Route path="/lighting" element={<LightingPage />} />
            <Route path="/shutters" element={<ShuttersPage />} />
            <Route path="/water-heater" element={<WaterHeaterPage />} />
            <Route path="/sprinkler" element={<SprinklerPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

export default App;
