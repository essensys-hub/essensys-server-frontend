import { useLocation, useNavigate } from 'react-router-dom';

/** Redirect after login — returns to the page the user tried to open (e.g. /settings/audit). */
export function usePostLoginNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    const from = (location.state as { from?: string } | null)?.from;
    const target = from && from !== '/login' && from.startsWith('/') ? from : '/dashboard';
    navigate(target, { replace: true });
  };
}
