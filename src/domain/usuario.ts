export class User {
  constructor(
    public id: string,
    public username: string,
    public email: string,
    public role: "admin" | "empleado",
    public createdAt: string | Date,
    public password: string,
    public isActive: boolean,
    public updatedAt?: string | Date
  ) {}
}

export interface Autenticación {
  isAuthenticated: boolean;
  user: User | null;
}
