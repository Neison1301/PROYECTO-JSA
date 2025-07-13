import { User, Product, Client, Sale } from "../types";
import { storage } from "./almacenamiento";

class DataService {
  // Usuarios
  getUsers(): User[] {
    const users = storage.getItem<User[]>("users") || [];
    console.log("📊 Usuarios recuperados:", users.length);
    return users;
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);

    if (existingIndex >= 0) {
      users[existingIndex] = user;
      console.log("✏️ Usuario actualizado:", user.username);
    } else {
      users.push(user);
      console.log("➕ Nuevo usuario añadido:", user.username);
    }

    storage.setItem("users", users);
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    storage.setItem("users", users);
    console.log("🗑️ Usuario eliminado:", id);
  }

  // Productos
  getProducts(): Product[] {
    const products = storage.getItem<Product[]>("products") || [];
    console.log("📦 Productos recuperados:", products.length);
    return products;
  }

  saveProduct(product: Product): void {
    const products = this.getProducts();
    const existingIndex = products.findIndex((p) => p.id === product.id);

    if (existingIndex >= 0) {
      products[existingIndex] = { ...product, updatedAt: new Date() };
      console.log("✏️ Producto actualizado:", product.name);
    } else {
      products.push(product);
      console.log("➕ Nuevo producto añadido:", product.name);
    }

    storage.setItem("products", products);
    console.log(
      "💾 Productos guardados en el almacenamiento. Total:",
      products.length
    );
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    storage.setItem("products", products);
    console.log("🗑️ Producto eliminado:", id);
  }

  // Clientes
  getClients(): Client[] {
    const clients = storage.getItem<Client[]>("clients") || [];
    console.log("👥 Clientes recuperados:", clients.length);
    return clients;
  }

  saveClient(client: Client): void {
    const clients = this.getClients();
    const existingIndex = clients.findIndex((c) => c.id === client.id);

    if (existingIndex >= 0) {
      clients[existingIndex] = { ...client, updatedAt: new Date() };
      console.log("✏️ Cliente actualizado:", client.name);
    } else {
      clients.push(client);
      console.log("➕ Nuevo cliente añadido:", client.name);
    }

    storage.setItem("clients", clients);
    console.log(
      "💾 Clientes guardados en el almacenamiento. Total:",
      clients.length
    );
  }

  deleteClient(id: string): void {
    const clients = this.getClients().filter((c) => c.id !== id);
    storage.setItem("clients", clients);
    console.log("🗑️ Cliente eliminado:", id);
  }

  // Ventas
  getSales(): Sale[] {
    const sales = storage.getItem<Sale[]>("sales") || [];
    console.log("💰 Ventas recuperadas:", sales.length);
    return sales;
  }

  saveSale(sale: Sale): void {
    const sales = this.getSales();
    const existingIndex = sales.findIndex((s) => s.id === sale.id);

    if (existingIndex >= 0) {
      sales[existingIndex] = { ...sale, updatedAt: new Date() };
      console.log("✏️ Venta actualizada:", sale.id);
    } else {
      sales.push(sale);
      console.log("➕ Nueva venta añadida:", sale.id);
    }

    storage.setItem("sales", sales);
    console.log(
      "💾 Ventas guardadas en el almacenamiento. Total:",
      sales.length
    );
  }

  deleteSale(id: string): void {
    const sales = this.getSales().filter((s) => s.id !== id);
    storage.setItem("sales", sales);
    console.log("🗑️ Venta eliminada:", id);
  }

  // Inicializar datos por defecto
  initializeDefaultData(): void {
    console.log("🚀 Inicializando datos por defecto...");

    // Crear usuario admin por defecto si no existen usuarios
    let users = this.getUsers();
    if (users.length === 0 || !users.find((u) => u.username === "admin")) {
      const adminUser: User = {
        id: "user-admin-001",
        username: "admin",
        email: "admin@tiendaperu.com",
        password: "admin123", // En producción, esto debería estar hasheado
        role: "admin",
        createdAt: new Date(),
        isActive: true,
      };
      this.saveUser(adminUser);
      console.log("👤 Usuario admin por defecto creado");
    }

    // Crear el usuario Recepcionista
    users = this.getUsers(); // Volver a obtener usuarios para incluir el admin recién creado
    if (!users.find((u) => u.username === "recepcionista")) {
      const receptionistUser: User = {
        id: "user-recep-001",
        username: "recepcionista",
        email: "recepcionista@tiendaperu.com",
        password: "recepcionista123", // En producción, esto DEBE estar hasheado
        role: "recepcionista",
        createdAt: new Date(),
        isActive: true,
      };
      this.saveUser(receptionistUser);
      console.log("🧑‍💼 Usuario recepcionista por defecto creado");
    }

    // Crear productos de ejemplo si no existen
    const products = this.getProducts();
    if (products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: "prod-001",
          name: "Laptop Lenovo IdeaPad 3",
          description:
            "Laptop Lenovo IdeaPad con procesador Intel i3, ideal para estudiantes.",
          price: 1599.0,
          stock: 10,
          category: "Electrónica",
          sku: "LEN-IDP-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-002",
          name: "Audífonos Bluetooth Xiaomi",
          description:
            "Audífonos inalámbricos Xiaomi Redmi Buds 3 Lite, con estuche de carga.",
          price: 89.9,
          stock: 50,
          category: "Audio",
          sku: "AUD-XIAO-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-003",
          name: "Monitor Samsung 24 pulgadas",
          description:
            "Monitor Samsung Full HD, ideal para trabajo de oficina y entretenimiento.",
          price: 549.0,
          stock: 25,
          category: "Electrónica",
          sku: "MON-SAM-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-004",
          name: "Impresora Epson EcoTank L3250",
          description:
            "Impresora multifuncional Epson EcoTank con sistema de tinta continua.",
          price: 799.0,
          stock: 15,
          category: "Periféricos",
          sku: "IMP-EPS-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      ];

      sampleProducts.forEach((product) => this.saveProduct(product));
      console.log("📦 Productos de ejemplo creados");
    }

    // Crear clientes de ejemplo si no existen
    const clients = this.getClients();
    if (clients.length === 0) {
      const sampleClients: Client[] = [
        {
          id: "client-001",
          name: "Carlos Vargas",
          email: "carlos.vargas@email.com",
          phone: "987654321",
          address: "Av. La Molina 123, La Molina",
          city: "Lima",
          taxId: "10745678901",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "client-002",
          name: "Ana Torres SAC",
          email: "ventas@anatorres.com.pe",
          phone: "991234567",
          address: "Calle San Martín 456, Miraflores",
          city: "Lima",
          taxId: "20123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "client-003",
          name: "Pedro Rojas",
          email: "pedro.rojas@email.com",
          phone: "955123456",
          address: "Jr. Puno 789, Cercado de Arequipa",
          city: "Arequipa",
          taxId: "10987654321",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      ];

      sampleClients.forEach((client) => this.saveClient(client));
      console.log("👥 Clientes de ejemplo creados");
    }
  } // <--- Esta es la llave de cierre correcta para initializeDefaultData()
} // <--- Esta es la llave de cierre de la clase DataService

export const dataService = new DataService();