export class Venta {
  constructor(
    public clientId: string,
    public clientName: string,
    public products: ItemVenta[],
    public total: number,
    public tax: number,
    public subtotal: number,
    public status: "Pendiente" | "Completada" | "Cancelada",
    public createdAt: Date,
    public updatedAt: Date,
    public id?: string,
    public notes?: string
  ) {}
}

export interface ItemVenta {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}
