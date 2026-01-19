import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  requireAuth?: boolean;
  allowedRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  requireAuth = true,
  allowedRoles = []
}) => {
  const location = useLocation();
  
  const user = localStorage.getItem('user');

  let isAuthenticated = false;
  let userRole: string | null = null;
  
  // Vérifiaction de l'authentifocation
  if (user) {
    try {
        isAuthenticated = true;
        userRole = JSON.parse(user).role;
      }
    catch {
      // Invalid token or user data, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Cas 1 : Route protégée mais utilisateur non authentifié
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  //Cas 2 : Utilisateur authentifié essayant d'accéder au login
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  //Cas 3 : Route protégée avec restriction de rôle
  if (
    requireAuth &&
    isAuthenticated &&
    allowedRoles.length > 0 &&
    userRole &&
    !allowedRoles.includes(userRole)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Accès autorisé
  return <Outlet />;
};

export default AuthGuard;
