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
    const users = this.getUsers();
    if (users.length === 0) {
      const adminUser: User = {
        id: "admin-001",
        username: "admin",
        email: "admin@example.com",
        password: "admin123", // En producción, esto debería estar hasheado
        role: "admin",
        createdAt: new Date(),
        isActive: true,
      };
      this.saveUser(adminUser);
      console.log("👤 Usuario admin por defecto creado");
    }

    // 2. Crear el usuario Recepcionista
    const receptionistUser: User = {
      id: "receptionist-001",
      username: "recepcionista",
      email: "recepcionista@example.com",
      password: "recepcionista123", // En producción, esto DEBE estar hasheado
      role: "recepcionista",
      createdAt: new Date(),
      isActive: true,
    };
    this.saveUser(receptionistUser);
    console.log("🧑‍💼 Usuario recepcionista por defecto creado");

    // Crear productos de ejemplo si no existen
    const products = this.getProducts();
    if (products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: "prod-001",
          name: "Laptop Dell Inspiron",
          description: "Laptop Dell Inspiron 15 con procesador Intel i5",
          price: 899.99,
          stock: 10,
          category: "Electrónicos",
          sku: "DELL-INS-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-002",
          name: "Mouse Inalámbrico",
          description: "Mouse inalámbrico ergonómico con 3 botones",
          price: 29.99,
          stock: 50,
          category: "Accesorios",
          sku: "MOUSE-WL-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-003",
          name: "Teclado Mecánico",
          description: "Teclado mecánico RGB con switches azules",
          price: 129.99,
          stock: 25,
          category: "Accesorios",
          sku: "KEYB-MECH-001",
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
          name: "Juan Pérez",
          email: "juan.perez@email.com",
          phone: "+1234567890",
          address: "Calle Principal 123",
          city: "Ciudad de México",
          taxId: "RFC123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "client-002",
          name: "María González",
          email: "maria.gonzalez@email.com",
          phone: "+1234567891",
          address: "Avenida Secundaria 456",
          city: "Guadalajara",
          taxId: "RFC987654321",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      ];

      sampleClients.forEach((client) => this.saveClient(client));
      console.log("👥 Clientes de ejemplo creados");
    }

    console.log("✅ Inicialización de datos por defecto completada");
  }

  // Método de depuración
  debugStorage(): void {
    console.log("🔍 Información de depuración del almacenamiento:");
    console.log("Todos los datos almacenados:", storage.getAllData());
  }
}

export const dataService = new DataService();
