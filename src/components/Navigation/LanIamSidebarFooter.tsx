import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useLanIamMode } from '../../context/LanIamContext';
import { useLanAuth } from '../../hooks/useLanAuth';

export function LanIamSidebarFooter({ onLogout }: { onLogout?: () => void }) {
  const { enabled } = useLanIamMode();
  const { user, logout } = useLanAuth();

  if (!enabled || !user) {
    return (
      <p className="text-xs text-gray-500">Mon Essensys v1.2.0</p>
    );
  }

  const handleLogout = () => {
    void logout().then(() => {
      onLogout?.();
      window.location.href = '/login';
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 truncate" title={user.email}>
        {user.email}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
        Déconnexion
      </button>
      <p className="text-xs text-gray-400">Mon Essensys v1.2.0</p>
    </div>
  );
}
