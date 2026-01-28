import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShieldCheckIcon,
  FireIcon,
  LightBulbIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  FireIcon as FireIconSolid,
  LightBulbIcon as LightBulbIconSolid,
} from '@heroicons/react/24/solid';

interface BottomTabsProps {
  onMoreClick: () => void;
}

interface TabItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconActive: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

const tabs: TabItem[] = [
  { to: '/dashboard', icon: HomeIcon, iconActive: HomeIconSolid, label: 'Accueil' },
  { to: '/security', icon: ShieldCheckIcon, iconActive: ShieldCheckIconSolid, label: 'Sécurité' },
  { to: '/heating', icon: FireIcon, iconActive: FireIconSolid, label: 'Climat' },
  { to: '/lighting', icon: LightBulbIcon, iconActive: LightBulbIconSolid, label: 'Lumières' },
];

export const BottomTabs: React.FC<BottomTabsProps> = ({ onMoreClick }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors ${
                isActive ? 'text-essensys-primary' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <tab.iconActive className="w-6 h-6" />
                ) : (
                  <tab.icon className="w-6 h-6" />
                )}
                <span className="mt-1 text-xs font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* More button */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center flex-1 h-full px-2 text-gray-500 transition-colors hover:text-essensys-primary"
        >
          <Bars3Icon className="w-6 h-6" />
          <span className="mt-1 text-xs font-medium">Plus</span>
        </button>
      </div>
    </nav>
  );
};
