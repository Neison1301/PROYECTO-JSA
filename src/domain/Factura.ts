export class Factura {
  constructor(
    public id: string,
    public ventaId: string,
    public numero: string, // Ej: "F001-00000123"
    public serie: string, // Ej: "F001"
    public correlativo: number, // Ej: 123
    public fecha: Date,
    public fechaVencimiento?: Date, // Para facturas a crédito
   // public subtotal: number,
   // public impuestos: number,
   // public total: number,
   // public estado: "emitida" | "anulada" | "pendiente",
    public tipoDocumento: "boleta" | "factura" = "factura",
    public rucEmisor: string = "20548948992", // RUC de tu empresa
    public razonSocialEmisor: string = "TechNova S.A.C.",
    public direccionEmisor: string = "CAL. NAVARRA URB. HIGUERETA NRO. 178, SANTIAGO DE SURCO, LIMA",
    public observaciones?: string,
    public moneda: string = "PEN", // Soles peruanos
    public tipoOperacion: string = "01", // Venta interna
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  // Método para generar el número completo de la factura
  get numeroCompleto(): string {
    return `${this.serie}-${this.correlativo.toString().padStart(8, '0')}`;
  }

  // Método para validar si la factura está vencida (solo para facturas a crédito)
  get estaVencida(): boolean {
    if (!this.fechaVencimiento) return false;
    return new Date() > this.fechaVencimiento;
  }

  // Método para anular la factura
  anular(motivo: string): void {
  //  this.estado = "anulada";
    this.observaciones = motivo;
    this.updatedAt = new Date();
  }
}