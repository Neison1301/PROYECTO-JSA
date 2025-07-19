// src/services/dataService.ts
import { Venta } from '../domain/Venta';
import { Cliente } from '../domain/Cliente';
import { Producto } from '../domain/Producto';
import { User } from "../domain/Usuario"; 

const API_BASE_URL = "http://localhost:3000";

class DataService {
  private async fetchData<T>(endpoint: string): Promise<T[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Error al obtener ${endpoint}: ${response.statusText}`);
      }
      const data: T[] = await response.json();

      const parseDates = (item: any): T => {
        if (item && typeof item === 'object') {
          if (item.createdAt && typeof item.createdAt === 'string') {
            item.createdAt = new Date(item.createdAt);
          }
          if (item.updatedAt && typeof item.updatedAt === 'string') {
            item.updatedAt = new Date(item.updatedAt);
          }
        }
        return item;
      };

      const parsedData = data.map(parseDates);

      console.log(`📊 ${endpoint} recuperados:`, parsedData.length);
      return parsedData;
    } catch (error) {
      console.error(`❌ Error en fetchData para ${endpoint}:`, error);
      return [];
    }
  }

  private async saveData<T extends { id?: string; createdAt?: string | Date; updatedAt?: string | Date }>( 
    endpoint: string,
    item: T
  ): Promise<T | null> {
    try {
      const method = item.id ? "PUT" : "POST";
      const url = item.id ? `${API_BASE_URL}/${endpoint}/${item.id}` : `${API_BASE_URL}/${endpoint}`;

      const itemToProcess: any = {
          ...item,
      };

      
      if (method === "POST" ) {
          delete itemToProcess.id; // Elimina el ID del objeto que se enviará en el cuerpo
      }



      if (itemToProcess.createdAt instanceof Date) {
        itemToProcess.createdAt = itemToProcess.createdAt.toISOString();
      } else if (method === "POST" && !itemToProcess.createdAt) {
          itemToProcess.createdAt = new Date().toISOString();
      }

      itemToProcess.updatedAt = new Date().toISOString();

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemToProcess),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Respuesta de error del servidor: ${errorBody}`);
        throw new Error(`Error al guardar ${endpoint}: ${response.statusText} - ${errorBody}`);
      }
      
      const savedItem: T = this.parseDatesOnSaveResponse(await response.json()); 
      console.log(
        `${method === "POST" ? "➕ Nuevo" : "✏️"} ${endpoint.slice(0, -1)} guardado/actualizado:`, savedItem
      );
      return savedItem;
    } catch (error) {
      console.error(`❌ Error en saveData para ${endpoint}:`, error);
      return null;
    }
  }

  private parseDatesOnSaveResponse<T>(item: T): T {
    const parsedItem: any = { ...item };
    if (parsedItem.createdAt && typeof parsedItem.createdAt === 'string') {
        parsedItem.createdAt = new Date(parsedItem.createdAt);
    }
    if (parsedItem.updatedAt && typeof parsedItem.updatedAt === 'string') {
        parsedItem.updatedAt = new Date(parsedItem.updatedAt);
    }
    return parsedItem;
  }

  private async deleteData(endpoint: string, id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Error al eliminar ${endpoint}: ${response.statusText}`);
      }
      console.log(`🗑️ ${endpoint.slice(0, -1)} eliminado:`, id);
      return true;
    } catch (error) {
      console.error(`❌ Error en deleteData para ${endpoint}:`, error);
      return false;
    }
  }

  // ✅ Cambiado: IUserData → User
  getUsers(): Promise<User[]> {
    return this.fetchData<User>("users");
  }

  // ✅ Cambiado: IUserData → User
  saveUser(user: User): Promise<User | null> {
    return this.saveData<User>("users", user);
  }

  deleteUser(id: string): Promise<boolean> {
    return this.deleteData("users", id);
  }

  getProducts(): Promise<Producto[]> {
    return this.fetchData<Producto>("products");
  }

  saveProduct(product: Producto): Promise<Producto | null> {
    return this.saveData<Producto>("products", product);
  }

  deleteProduct(id: string): Promise<boolean> {
    return this.deleteData("products", id);
  }

  getClients(): Promise<Cliente[]> {
    return this.fetchData<Cliente>("clients");
  }

  saveClient(client: Cliente): Promise<Cliente | null> {
    return this.saveData<Cliente>("clients", client);
  }

  deleteClient(id: string): Promise<boolean> {
    return this.deleteData("clients", id);
  }

  getSales(): Promise<Venta[]> {
    return this.fetchData<Venta>("sales");
  }

  saveSale(sale: Venta): Promise<Venta | null> {
    return this.saveData<Venta>("sales", sale);
  }

  deleteSale(id: string): Promise<boolean> {
    return this.deleteData("sales", id);
  }
}

export const dataService = new DataService();