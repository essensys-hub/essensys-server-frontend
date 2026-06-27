import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useLanAuth } from '../hooks/useLanAuth';
import { useLanIamMode } from '../context/LanIamContext';

export function LanAuthGate() {
  const { enabled, loading: modeLoading } = useLanIamMode();
  const { user, loading } = useLanAuth();
  const location = useLocation();

  if (!enabled) {
    return <Outlet />;
  }

  if (modeLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
