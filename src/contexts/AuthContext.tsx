import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { clearAuthToken, setAuthToken } from '../lib/apiClient';

export interface ShopInfo {
  _id: string;
  shopName: string;
  address?: string;
  category?: { name: string } | string;
}

interface AuthUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: 'user' | 'shopOwner' | 'admin';
  shopId?: string | null;
  shopIds?: string[];
  activeShopId?: string | null;
  shops?: ShopInfo[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isShopOwner: boolean;
  isLoading: boolean;
  isGuest: boolean;
  setGuestMode: (val: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/check-auth');
      if (res.data.isAuthenticated && res.data.user) {
        setUser(res.data.user);
        setIsGuest(false); // Reset guest mode if user is authenticated
        return res.data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    checkAuth();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/logout');
    } catch {
      // Continue even if server call fails
    }
    await clearAuthToken();
    setUser(null);
    setIsGuest(false); // Reset guest mode on logout
  }, []);

  const setGuestMode = useCallback((val: boolean) => {
    setIsGuest(val);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isShopOwner: user?.role === 'shopOwner',
        isLoading,
        isGuest,
        setGuestMode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
