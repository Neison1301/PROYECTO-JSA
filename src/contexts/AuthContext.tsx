import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Autenticación } from '../domain/Usuario';
import { authService } from '../services/authService';
import { storage } from '../services/almacenamiento'; 

interface AuthContextType extends Autenticación {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<Autenticación>({
    isAuthenticated: false,
    user: null
  });

  // Este useEffect se ejecuta una vez al montar para inicializar el estado de auth
  useEffect(() => {
    // authService.getAuthState() es síncrono, por lo que no necesita await
    const currentAuthState = authService.getAuthState();
    setAuthState(currentAuthState);
  }, []); // El array vacío asegura que se ejecute solo al montar

  // La función login del contexto debe ser asíncrona para esperar el resultado del servicio
  const login = async (username: string, password: string): Promise<boolean> => {
    // ¡AQUÍ ESTÁ EL CAMBIO CLAVE! Usa 'await' para esperar la resolución de la promesa
    const result = await authService.login(username, password); 
    setAuthState(result); // Ahora 'result' es el objeto AuthState resuelto
    return result.isAuthenticated; // Retorna el booleano
  };

  const logout = () => {
    authService.logout();
    storage.removeItem('currentUser'); 
    storage.removeItem('windows'); 
    setAuthState({ isAuthenticated: false, user: null }); // Limpia el estado del contexto
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};