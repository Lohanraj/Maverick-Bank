import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import './styles.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['Customer']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Employee Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['Employee', 'Admin']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Route>

          {/* Admin Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
