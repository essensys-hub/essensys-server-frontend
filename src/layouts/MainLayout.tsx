import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  SidebarMenu, 
  BottomTabs, 
  MobileDrawer, 
  MobileHeader 
} from '../components/Navigation';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="min-h-screen bg-essensys-background">
      {/* Desktop Sidebar */}
      <SidebarMenu />

      {/* Mobile Header */}
      <MobileHeader onMenuClick={openDrawer} />

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />

      {/* Main Content */}
      <main className="lg:pl-60">
        {/* Padding for mobile header and bottom tabs */}
        <div className="pt-14 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children || <Outlet />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Tabs */}
      <BottomTabs onMoreClick={openDrawer} />
    </div>
  );
};

export default MainLayout;
