import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShieldCheckIcon,
  FireIcon,
  LightBulbIcon,
  ViewColumnsIcon,
  BeakerIcon,
  CloudIcon,
  BellIcon,
  Cog6ToothIcon,
  VideoCameraIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

const adminNavItems: NavItem[] = [
  { to: '/admin/regression', icon: ClipboardDocumentCheckIcon, label: 'Tests non-régression' },
];

const navItems: NavItem[] = [
  { to: '/dashboard', icon: HomeIcon, label: 'Tableau de bord' },
  { to: '/unifi-protect', icon: VideoCameraIcon, label: 'UniFi Protect' },
  { to: '/security', icon: ShieldCheckIcon, label: 'Sécurité' },
  { to: '/heating', icon: FireIcon, label: 'Chauffage' },
  { to: '/lighting', icon: LightBulbIcon, label: 'Éclairage' },
  { to: '/scenarios', icon: BoltIcon, label: 'Scénarios' },
  { to: '/shutters', icon: ViewColumnsIcon, label: 'Volets & Stores' },
  { to: '/water-heater', icon: BeakerIcon, label: 'Cumulus' },
  { to: '/sprinkler', icon: CloudIcon, label: 'Arrosage' },
  { to: '/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Paramètres' },
];

export const SidebarMenu: React.FC = () => {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <img 
          src="/images/logosml.png" 
          alt="mon Essensys" 
          className="h-8"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-essensys-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Administration
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-essensys-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">Mon Essensys v1.2.0</p>
      </div>
    </aside>
  );
};

export { navItems, adminNavItems };
export type { NavItem };
