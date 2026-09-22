import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => void;
  switchRole: (role: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('lumirise_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setOrganization(data.organization);
    } catch (err) {
      console.error('Failed to load user:', err);
      api.clearToken();
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const res = await api.signIn({ email, password: pass });
    setUser(res.user);
    setOrganization(res.organization);
  };

  const signUp = async (data: any) => {
    const res = await api.signUp(data);
    setUser(res.user);
    setOrganization(res.organization);
  };

  const signOut = () => {
    api.clearToken();
    setUser(null);
    setOrganization(null);
    window.location.href = '/sign-in';
  };

  const switchRole = async (targetRole: string) => {
    try {
      setIsLoading(true);
      const res = await api.switchRole(targetRole);
      setUser(res.user);
      setOrganization(res.organization);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        signIn,
        signUp,
        signOut,
        switchRole,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
