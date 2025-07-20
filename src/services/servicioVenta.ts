// src/services/saleService.ts
import { Venta } from '../domain/Venta';
import { dataService } from './dataService';

class ServicioVenta {
  getSales(): Promise<Venta[]> {
    return dataService.getGenericData<Venta>("sales");
  }

  guardarVenta(sale: Venta): Promise<Venta | null> {
    return dataService.saveGenericData<Venta>("sales", sale);
  }

  borrarventa(id: string): Promise<boolean> {
    return dataService.deleteGenericData("sales", id);
  }
  clearAll(): Promise<boolean> {
    return dataService.clearGenericData("sales");
  }
}

export const saleService = new ServicioVenta();