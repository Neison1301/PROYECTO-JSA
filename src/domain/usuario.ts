// src/domain/usuario.ts

export interface IUserData {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "recepcionista";
  createdAt: Date;
  isActive: boolean;
  updatedAt?: Date;
}

export class User {
  public readonly id: string;
  private _username: string;
  private _email: string;
  private _role: "admin" | "recepcionista";
  public readonly createdAt: Date;
  private _isActive: boolean;
  private _updatedAt?: Date;

  constructor(data: IUserData) {
    if (!data.id || !data.username || !data.email || !data.role || !data.createdAt) {
      throw new Error("Datos de usuario inválidos: faltan campos esenciales.");
    }

    this.id = data.id;
    this._username = data.username.trim();
    this._email = data.email.trim();
    this._role = data.role;
    this.createdAt = new Date(data.createdAt);
    this._isActive = data.isActive;
    this._updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
  }

  public get username(): string {
    return this._username;
  }
  public get email(): string {
    return this._email;
  }
  public get role(): "admin" | "recepcionista" {
    return this._role;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  public isAdmin(): boolean {
    return this._role === "admin";
  }

  public isRecepcionista(): boolean {
    return this._role === "recepcionista";
  }

  public hasPermission(requiredRole: "admin" | "recepcionista"): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return this._role === requiredRole;
  }
}