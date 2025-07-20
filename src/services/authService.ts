import { Autenticación } from "../domain/Usuario"; 
import { userService } from "./servicioUsuario";
// Eliminamos la importación de storage, ya que no se usará
// import { storage } from "./almacenamiento"; 
import { User } from "../domain/Usuario"; 

class AuthService { 
  // Variable interna para mantener el usuario logueado en memoria (no persistente)
  private _currentUser: User | null = null;

  getCurrentUser(): User | null { 
    // Ahora devuelve el usuario almacenado en memoria
    return this._currentUser; 
  } 

  async login(username: string, password: string): Promise<Autenticación> { 
    try { 
      const users = await userService.getUsers();
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
          
        // Almacenar el usuario en la variable interna (no persistente)
        this._currentUser = domainUser; 
          
        return { isAuthenticated: true, user: domainUser }; 
      } 

      return { isAuthenticated: false, user: null }; 
    } catch (error) { 
      console.error("Error durante el inicio de sesión:", error); 
      return { isAuthenticated: false, user: null }; 
    } 
  } 

  logout(): void { 
    // Limpiamos la referencia interna al usuario
    this._currentUser = null; 
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
      const users = await userService.getUsers();
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

      const savedUser = await userService.guardarUsuario(updatedUser);

      if (savedUser) { 
        // Si el usuario actualizado es el usuario actualmente "logueado" en memoria,
        // actualizamos también la referencia interna.
        if (this._currentUser && this._currentUser.id === userId) { 
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
          this._currentUser = newUserInstance; 
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
      const users = await userService.getUsers();
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

      const savedUser = await userService.guardarUsuario(updatedUser);

      if (savedUser) { 
        // Si el usuario actualizado es el usuario actualmente "logueado" en memoria,
        // actualizamos también la referencia interna.
        if (this._currentUser && this._currentUser.id === userId) { 
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
          this._currentUser = newUserInstance; 
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