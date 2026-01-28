import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center">
          <img 
            src="/images/logosml.png" 
            alt="mon Essensys" 
            className="h-6"
          />
        </div>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>
    </header>
  );
};
