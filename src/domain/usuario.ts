export interface IUserData {
  id: string;
  username: string;
  email: string;
  role: "admin" | "empleado";
  createdAt: string | Date;
  isActive: boolean;
  updatedAt?: string | Date;
  password: string;
}

export class User {
  public readonly id: string;
  private _username: string;
  private _email: string;
  private _role: "admin" | "empleado";
  public readonly createdAt: Date;
  private _password: string;
  private _isActive: boolean;
  private _updatedAt?: Date;

  constructor(data: IUserData) {
    // Validación básica
    if (!data.id || !data.username || !data.email || !data.role || !data.createdAt || !data.password) {
      throw new Error("Datos de usuario inválidos: faltan campos esenciales.");
    }

    this.id = data.id;
    this._username = data.username.trim();
    this._email = data.email.trim();
    this._role = data.role;
    this.createdAt = new Date(data.createdAt);
    this._isActive = data.isActive;
    this._updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    this._password = data.password;
  }

  // Getters 
  public get username(): string {
    return this._username;
  }

  public get email(): string {
    return this._email;
  }

  public get role(): "admin" | "empleado" {
    return this._role;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  public get password(): string {
    return this._password;
  }

  // Métodos del dominio
  public isAdmin(): boolean {
    return this._role === "admin";
  }

  public isEmpleado(): boolean {
    return this._role === "empleado";
  }

  public hasPermission(requiredRole: "admin" | "empleado"): boolean {
    if (this.isAdmin()) return true;
    return this._role === requiredRole;
  }

  
}
