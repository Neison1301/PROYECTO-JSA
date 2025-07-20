import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Autenticación, User } from '../domain/Usuario';
import { authService } from '../services/authService';

interface AuthContextType extends Autenticación {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<boolean>;
  changeUserPassword: (userId: string, currentPass: string, newPass: string) => Promise<boolean>;
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
  // Estado de autenticación
  const [authState, setAuthState] = useState<Autenticación>({
    isAuthenticated: false,
    user: null
  });

  // Inicializa el estado de autenticación al montar
  useEffect(() => {
    const currentAuthState = authService.getAuthState();
    setAuthState(currentAuthState);
  }, []);

  // Realiza el inicio de sesión
  const login = async (username: string, password: string): Promise<boolean> => {
    const result = await authService.login(username, password);
    setAuthState(result);
    return result.isAuthenticated;
  };

  // Cierra la sesión
  const logout = () => {
    authService.logout();
    setAuthState({ isAuthenticated: false, user: null });
  };

  // Actualiza el perfil del usuario
  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    const success = await authService.updateProfile(userId, updates);
    if (success) {
      setAuthState(authService.getAuthState());
    }
    return success;
  };

  // Cambia la contraseña del usuario
  const changeUserPassword = async (userId: string, currentPass: string, newPass: string): Promise<boolean> => {
    const success = await authService.changePassword(userId, currentPass, newPass);
    if (success) {
      setAuthState(authService.getAuthState());
    }
    return success;
  };

  // Valor del contexto de autenticación
  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUserProfile,
    changeUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
