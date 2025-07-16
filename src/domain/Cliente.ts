export class Cliente {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phone: string,
    public address: string,
    public city: string,
    public taxId: string,
    public createdAt: Date,
    public updatedAt: Date,
    public isActive: boolean
  ) {}
}