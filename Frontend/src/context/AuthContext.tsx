import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  fullName?: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  token: string | null;
  role: string | null;
  user: User | null;
  isLoggedIn: boolean;
  getUserName: () => string;
  getUserEmail: () => string;
  getInitials: () => string;
  isCustomer: () => boolean;
  isEmployee: () => boolean;
  isAdmin: () => boolean;
  login: (token: string, role: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkTokenExpiry = (authToken: string | null): boolean => {
  if (!authToken) return false;
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => checkTokenExpiry(localStorage.getItem('token')));

  useEffect(() => {
    setIsLoggedIn(checkTokenExpiry(token));
  }, [token]);

  const login = (newToken: string, newRole: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  const getUserName = (): string => {
    return user?.fullName || user?.email || 'User';
  };

  const getUserEmail = (): string => {
    return user?.email || '';
  };

  const getInitials = (): string => {
    const name = getUserName();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const isCustomer = (): boolean => role === 'Customer';
  const isEmployee = (): boolean => role === 'Employee';
  const isAdmin = (): boolean => role === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        isLoggedIn,
        getUserName,
        getUserEmail,
        getInitials,
        isCustomer,
        isEmployee,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
