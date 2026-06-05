"use client";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../app/types';
import { apiFetch, ApiFetchError } from '../app/utils/api';

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

  const performLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = (newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<User>('/auth/me');
      if (data) {
        updateUser(data);
      }
    } catch (error: unknown) {
      if (error instanceof ApiFetchError && error.response.status === 401) {
        console.log("Sesión inválida o expirada, cerrando...");
        performLogout();
      }
    }
  }, [performLogout]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        // ESTRATEGIA OPTIMISTA: Si tenemos datos locales, liberamos la interfaz de inmediato
        if (isMounted) setLoading(false);
      }

      if (token) {
        // Ejecutamos la validación en segundo plano sin usar 'await' para no congelar el renderizado
        refreshUser().finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        // Si no hay token, no hay nada que validar, dejamos de cargar inmediatamente
        if (isMounted) setLoading(false);
      }
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