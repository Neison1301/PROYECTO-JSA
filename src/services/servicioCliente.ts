// src/services/clientService.ts
import { Cliente } from '../domain/Cliente';
import { dataService } from './dataService';

class ServicioCliente {
  getClients(): Promise<Cliente[]> {
    return dataService.getGenericData<Cliente>("clients");
  }

  guardarCliente(client: Cliente): Promise<Cliente | null> {
    return dataService.saveGenericData<Cliente>("clients", client);
  }

  eliminarcliente(id: string): Promise<boolean> {
    return dataService.deleteGenericData("clients", id);
  }
  clearAll(): Promise<boolean> {
    return dataService.clearGenericData("clients");
  }
}

export const clientService = new ServicioCliente();