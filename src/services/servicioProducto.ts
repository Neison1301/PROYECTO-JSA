// src/services/productService.ts
import { Producto } from '../domain/Producto';
import { dataService } from './dataService';

class ServicioProducto {
  getProducts(): Promise<Producto[]> {
    return dataService.getGenericData<Producto>("products");
  }

  guardarProducto(product: Producto): Promise<Producto | null> {
    return dataService.saveGenericData<Producto>("products", product);
  }

  eliminarProducto(id: string): Promise<boolean> {
    return dataService.deleteGenericData("products", id);
  }

  clearAll(): Promise<boolean> {
    return dataService.clearGenericData("products");
  }
}

export const productService = new ServicioProducto();