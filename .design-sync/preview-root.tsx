import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/context/ThemeContext';
import { DashboardProvider } from '../src/context/DashboardContext';

// Preview wrapper for design-sync cards. Components in this app read three
// contexts: react-router-dom (Link / NavLink / useNavigate), ThemeContext
// (useTheme + the [data-theme] custom-property theme), and DashboardContext
// (useDashboard state for the control widgets). Wrapping every preview in all
// three is the only render that is true to how the app mounts them.
export const PreviewRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <ThemeProvider>
      <DashboardProvider>{children}</DashboardProvider>
    </ThemeProvider>
  </MemoryRouter>
);

export default PreviewRoot;
