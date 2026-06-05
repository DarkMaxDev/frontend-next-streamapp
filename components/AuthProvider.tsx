"use client";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../app/types';
import { apiFetch,ApiFetchError } from '../app/utils/api';

interface ApiError {
  response?: { status?: number; data?: { msg?: string } };
  message?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (newUser: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Función para cerrar sesión: limpia todo y redirige
  const performLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  // Actualiza el estado y el localStorage al mismo tiempo
  const updateUser = (newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

 const refreshUser = useCallback(async (): Promise<void> => {
  try {
    const data = await apiFetch<User>('/auth/me');
    if (data) updateUser(data);
  } catch (error: unknown) {
    if (error instanceof ApiFetchError && error.response.status === 401) {
      console.log("Sesión inválida, cerrando...");
      performLogout();
    }
  }
}, [performLogout]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser) setUser(JSON.parse(savedUser));

      if (token) {
        await refreshUser();
      }
      
      if (isMounted) setLoading(false);
    };

    initAuth();
    return () => { isMounted = false; };
  }, [refreshUser]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    updateUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout: performLogout, 
      refreshUser, 
      updateUser, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}
