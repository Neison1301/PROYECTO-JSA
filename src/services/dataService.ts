// src/services/dataService.ts
// Eliminamos las importaciones de los dominios aquí, ya no son necesarias.

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
        if (item && typeof item === "object") {
          if (item.createdAt && typeof item.createdAt === "string") {
            item.createdAt = new Date(item.createdAt);
          }
          if (item.updatedAt && typeof item.updatedAt === "string") {
            item.updatedAt = new Date(item.updatedAt);
          }
        }
        return item;
      };

      const parsedData = data.map(parseDates);

      console.log(`${endpoint} recuperados:`, parsedData.length);
      return parsedData;
    } catch (error) {
      console.error(`Error en fetchData para ${endpoint}:`, error);
      return [];
    }
  }

  private async saveData<
    T extends { id?: string; createdAt?: string | Date; updatedAt?: string | Date }
  >(endpoint: string, item: T): Promise<T | null> {
    try {
      const method = item.id ? "PUT" : "POST";
      const url = item.id
        ? `${API_BASE_URL}/${endpoint}/${item.id}`
        : `${API_BASE_URL}/${endpoint}`;

      const itemToProcess: any = {
        ...item,
      };

      if (method === "POST") {
        delete itemToProcess.id; // Elimina el ID del objeto que se enviará en el cuerpo para POST
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
        throw new Error(
          `Error al guardar ${endpoint}: ${response.statusText} - ${errorBody}`
        );
      }

      const savedItem: T = this.parseDatesOnSaveResponse(await response.json());
      console.log(
        `${method === "POST" ? " Nuevo" : ""} ${endpoint.slice(
          0,
          -1
        )} guardado/actualizado:`,
        savedItem
      );
      return savedItem;
    } catch (error) {
      console.error(`Error en saveData para ${endpoint}:`, error);
      return null;
    }
  }

  private parseDatesOnSaveResponse<T>(item: T): T {
    const parsedItem: any = { ...item };
    if (parsedItem.createdAt && typeof parsedItem.createdAt === "string") {
      parsedItem.createdAt = new Date(parsedItem.createdAt);
    }
    if (parsedItem.updatedAt && typeof parsedItem.updatedAt === "string") {
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
      console.log(`${endpoint.slice(0, -1)} eliminado:`, id);
      return true;
    } catch (error) {
      console.error(`Error en deleteData para ${endpoint}:`, error);
      return false;
    }
  }


private async clearCollection(endpoint: string): Promise<boolean> {
    try {
      // Obtener todos los IDs de los elementos en la colección
      const itemsToDelete: { id: string }[] = await this.fetchData(endpoint); 
      
      // Crear un array de promesas para eliminar cada elemento por su ID
      const deletePromises = itemsToDelete.map(item => 
        this.deleteData(endpoint, item.id) 
      );

      // Esperar a que todas las eliminaciones se completen
      await Promise.all(deletePromises); 

      console.log(`Colección '${endpoint}' limpiada en db.json.`);
      return true;
    } catch (error) {
      console.error(`Error al limpiar la colección '${endpoint}':`, error);
      return false;
    }
  }

  // Métodos que serán usados por los servicios específicos
  public getGenericData<T>(endpoint: string): Promise<T[]> {
    return this.fetchData<T>(endpoint);
  }

  public saveGenericData<
    T extends { id?: string; createdAt?: string | Date; updatedAt?: string | Date }
  >(endpoint: string, item: T): Promise<T | null> {
    return this.saveData<T>(endpoint, item);
  }

  public deleteGenericData(endpoint: string, id: string): Promise<boolean> {
    return this.deleteData(endpoint, id);
  }
   public clearGenericData(endpoint: string): Promise<boolean> {
    return this.clearCollection(endpoint);
  }
  
}

export const dataService = new DataService();