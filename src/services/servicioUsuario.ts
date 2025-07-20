// src/services/userService.ts
import { User } from "../domain/Usuario";
import { dataService } from "./dataService"; // Importa el dataService genérico

class ServicioUsuario {
  getUsers(): Promise<User[]> {
    return dataService.getGenericData<User>("users");
  }

  guardarUsuario(user: User): Promise<User | null> {
    return dataService.saveGenericData<User>("users", user);
  }

  eliminarUsuario(id: string): Promise<boolean> {
    return dataService.deleteGenericData("users", id);
  }
  clearAll(): Promise<boolean> {
    return dataService.clearGenericData("users");
  }
}

export const userService = new ServicioUsuario();
