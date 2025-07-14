import {  AuthState } from '../types';
import { dataService } from './dataService';
import { storage } from './almacenamiento';
import { IUserData, User } from '../domain/usuario'; 

class AuthService {
  getCurrentUser(): IUserData | null {
    return storage.getItem<IUserData>('currentUser');
  }

  login(username: string, password: string): AuthState {
        const users = dataService.getUsers();
        const user = users.find(u =>
            (u.username === username || u.email === username) &&
            u.password === password &&
            u.isActive
        );

        if (user) {
             storage.setItem('currentUser', user);
             const domainUser = new User(user);
            return { isAuthenticated: true, user: domainUser };
        }

        // Si no se encuentra el usuario, retorna un estado de no autenticado.
        return { isAuthenticated: false, user: null };
    }


  logout(): void {
    storage.removeItem('currentUser');
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  getAuthState(): AuthState {
    const userRaw = this.getCurrentUser(); // Esto devuelve IUserData (con Date objects si localStorage lo maneja)
        if (userRaw) {
            try {
                // Crea una instancia de la CLASE `User` a partir de `userRaw` (IUserData)
                const domainUser = new User(userRaw);
                return {
                    isAuthenticated: true,
                    user: domainUser // Pasa la instancia de la CLASE User
                };
            } catch (error) {
                console.error("Error al crear la instancia de User desde los datos almacenados:", error);
                this.logout(); // Limpia la sesión
                return { isAuthenticated: false, user: null };
            }
        }
        return { isAuthenticated: false, user: null };
  }

  updateProfile(userId: string, updates: Partial<IUserData>): boolean {
    try {
      const users = dataService.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) return false;

      if (updates.email) {
        const emailExists = users.find(u => u.email === updates.email && u.id !== userId);
        if (emailExists) return false;
      }

      if (updates.username) {
        const usernameExists = users.find(u => u.username === updates.username && u.id !== userId);
        if (usernameExists) return false;
      }

      const updatedUser = { ...users[userIndex], ...updates };
      users[userIndex] = updatedUser;
      
      dataService.saveUser(updatedUser);
      
      storage.setItem('currentUser', updatedUser);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): boolean {
    try {
      const users = dataService.getUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user || user.password !== currentPassword) {
        return false;
      }

      const updatedUser = { ...user, password: newPassword };
      dataService.saveUser(updatedUser);
      
      storage.setItem('currentUser', updatedUser);
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }
}

export const authService = new AuthService();

