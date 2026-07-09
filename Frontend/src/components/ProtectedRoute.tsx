import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isLoggedIn, role, isAdmin, isEmployee } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their default dashboards if role is not authorized for this specific route
    if (isAdmin()) {
      return <Navigate to="/admin" replace />;
    }
    if (isEmployee()) {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
