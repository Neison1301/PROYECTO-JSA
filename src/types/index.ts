export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user'| 'recepcionista';
  createdAt: Date;
  isActive: boolean;
  updatedAt?: Date; 
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  products: SaleItem[];
  total: number;
  tax: number;
  subtotal: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Window {
  id: string;
  title: string;
  component: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number; height: number };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}