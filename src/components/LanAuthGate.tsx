import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useLanAuth } from '../hooks/useLanAuth';

export function LanAuthGate() {
  const { user, loading, enabled } = useLanAuth();
  const location = useLocation();

  if (!enabled) {
    return <Outlet />;
  }

  if (loading) {
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
