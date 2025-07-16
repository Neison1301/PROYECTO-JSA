import { Autenticación } from "../domain/Usuario";
import { dataService } from "./dataService";
import { storage } from "./almacenamiento";
import { User } from "../domain/Usuario";

class AuthService {
  getCurrentUser(): User | null {
    const storedUser = storage.getItem<any>("currentUser");
    if (storedUser) {
      // Reconstruir la instancia de User desde el objeto plano
      return new User(
        storedUser.id,
        storedUser.username,
        storedUser.email,
        storedUser.role,
        storedUser.createdAt,
        storedUser.password,
        storedUser.isActive,
        storedUser.updatedAt
      );
    }
    return null;
  }

  async login(username: string, password: string): Promise<Autenticación> {
    try {
      const users = await dataService.getUsers(); 
      const user = users.find(
        (u) =>
          (u.username === username || u.email === username) &&
          u.password === password &&
          u.isActive
      );

      if (user) {
        // Crear instancia de User
        const domainUser = new User(
          user.id,
          user.username,
          user.email,
          user.role,
          user.createdAt,
          user.password,
          user.isActive,
          user.updatedAt
        );
        
        // Almacenar en localStorage (se serializa automáticamente)
        storage.setItem("currentUser", domainUser);
        
        return { isAuthenticated: true, user: domainUser };
      }

      return { isAuthenticated: false, user: null };
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      return { isAuthenticated: false, user: null };
    }
  }

  logout(): void {
    storage.removeItem("currentUser");
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  getAuthState(): Autenticación {
    const user = this.getCurrentUser();
    return {
      isAuthenticated: user !== null,
      user: user,
    };
  }

  async updateProfile(
    userId: string,
    updates: Partial<{
      username: string;
      email: string;
      role: "admin" | "empleado";
      isActive: boolean;
    }>
  ): Promise<boolean> {
    try {
      const users = await dataService.getUsers();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) return false;

      // Validaciones para email y username duplicados
      if (updates.email) {
        const emailExists = users.find(
          (u) => u.email === updates.email && u.id !== userId
        );
        if (emailExists) {
          console.warn("El email ya existe para otro usuario.");
          return false;
        }
      }

      if (updates.username) {
        const usernameExists = users.find(
          (u) => u.username === updates.username && u.id !== userId
        );
        if (usernameExists) {
          console.warn("El nombre de usuario ya existe para otro usuario.");
          return false;
        }
      }

      const userToUpdate = users[userIndex];
      const updatedUser = {
        ...userToUpdate,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const savedUser = await dataService.saveUser(updatedUser);

      if (savedUser) {
        // Actualizar localStorage si es el usuario actual
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const newUserInstance = new User(
            savedUser.id,
            savedUser.username,
            savedUser.email,
            savedUser.role,
            savedUser.createdAt,
            savedUser.password,
            savedUser.isActive,
            savedUser.updatedAt
          );
          storage.setItem("currentUser", newUserInstance);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      return false;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const users = await dataService.getUsers();
      const user = users.find((u) => u.id === userId);

      if (!user) {
        console.warn("Usuario no encontrado para cambiar contraseña.");
        return false;
      }

      if (user.password !== currentPassword) {
        console.warn("Contraseña actual incorrecta.");
        return false;
      }

      const updatedUser = {
        ...user,
        password: newPassword,
        updatedAt: new Date().toISOString(),
      };

      const savedUser = await dataService.saveUser(updatedUser);

      if (savedUser) {
        // Actualizar localStorage si es el usuario actual
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const newUserInstance = new User(
            savedUser.id,
            savedUser.username,
            savedUser.email,
            savedUser.role,
            savedUser.createdAt,
            savedUser.password,
            savedUser.isActive,
            savedUser.updatedAt
          );
          storage.setItem("currentUser", newUserInstance);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      return false;
    }
  }
}

export const authService = new AuthService();