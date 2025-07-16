
export class Venta {
  constructor(
    public clientId: string,
    public clientName: string,
    public products: ItemVenta[],
    public total: number,
    public tax: number,
    public subtotal: number,
    public status: 'Pendiente' | 'Completada' | 'Cancelada',
    public createdAt: Date,
    public updatedAt: Date,
    public id?: string,
    public notes?: string
  ) {}
}

export class ItemVenta {
  constructor(
    public productId: string,
    public productName: string,
    public quantity: number,
    public price: number,
    public total: number
  ) {}
}
