import { Boleta } from "../domain/Boleta";
import { Cliente } from "../domain/Cliente";
import { Producto } from "../domain/Producto";
import { Venta } from "../domain/Venta";

class BoletaService {

  public async generarBoletaPDF(venta: Venta, cliente: Cliente, productosDisponibles: Producto[]): Promise<void> {
    try {
      const boleta = new Boleta(venta, cliente, productosDisponibles);
      boleta.generarPDF();
    } catch (error) {
      console.error('Error en BoletaService al generar PDF:', error);
      throw error; // Propagar el error para que sea manejado por el componente que llama
    }
  }
}

// Exportar una instancia del servicio para uso global
export const boletaService = new BoletaService();