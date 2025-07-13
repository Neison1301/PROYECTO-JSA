class StorageService {
  private prefix = 'bms_'; // Prefijo para las claves en localStorage, evita colisiones

  setItem<T>(key: string, value: T): void {
    try {
      // Serializa el valor a JSON, manejando objetos Date para guardarlos correctamente
      const serializedValue = JSON.stringify(value, (key, val) => {
        // Convierte objetos Date a formato ISO string
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val;
      });
      localStorage.setItem(this.prefix + key, serializedValue); // Guarda el valor en localStorage
      console.log(`✅ Guardado en localStorage: ${this.prefix + key}`, value);
    } catch (error) {
      console.error('❌ Error al guardar en localStorage:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key); // Obtiene el ítem de localStorage
      if (!item) {
        console.log(`⚠️ No se encontraron datos para la clave: ${this.prefix + key}`);
        return null; // Retorna null si no hay ítem
      }
      
      // Parsea el JSON, manejando cadenas de fecha para convertirlas de nuevo a objetos Date
      const parsed = JSON.parse(item, (key, val) => {
        // Detecta y convierte cadenas de fecha ISO a objetos Date
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          return new Date(val);
        }
        return val;
      });
      
      console.log(`✅ Recuperado de localStorage: ${this.prefix + key}`, parsed);
      return parsed; // Retorna el valor parseado
    } catch (error) {
      console.error('❌ Error al leer de localStorage:', error);
      return null; // Retorna null en caso de error
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key); // Elimina un ítem de localStorage
    console.log(`🗑️ Eliminado de localStorage: ${this.prefix + key}`);
  }

  clear(): void {
    const keys = Object.keys(localStorage); // Obtiene todas las claves en localStorage
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) { // Solo limpia las claves con el prefijo de la app
        localStorage.removeItem(key);
        console.log(`🗑️ Limpiado: ${key}`);
      }
    });
  }

  getAllData(): { [key: string]: any } {
    const data: { [key: string]: any } = {}; // Objeto para almacenar todos los datos de la app
    const keys = Object.keys(localStorage); // Obtiene todas las claves
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) { // Filtra por el prefijo de la aplicación
        const cleanKey = key.replace(this.prefix, ''); // Elimina el prefijo para la clave de retorno
        data[cleanKey] = this.getItem(cleanKey); // Recupera y almacena el valor
      }
    });
    
    return data; // Retorna todos los datos relacionados con la aplicación
  }
}

export const storage = new StorageService(); // Exporta una instancia del servicio de almacenamiento
