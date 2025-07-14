import { Product, Client, Venta } from "../types";
import { IUserData } from "../domain/usuario";
import { storage } from "./almacenamiento";

class DataService {
  // Usuarios
  getUsers(): IUserData[] {
    const users = storage.getItem<IUserData[]>("users") || [];
    console.log("📊 Usuarios recuperados:", users.length);
    return users;
  }

  saveUser(user: IUserData): void {
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
  getSales(): Venta[] {
    const sales = storage.getItem<Venta[]>("sales") || [];
    console.log("💰 Ventas recuperadas:", sales.length);
    return sales;
  }

  saveSale(sale: Venta): void {
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
      const adminUser: IUserData = {
        id: "user-admin-001",
        username: "admin",
        email: "admin@gmail.com",
        password: "admin123", // En producción, esto debería estar hasheado
        role: "admin",
        createdAt: new Date(),
        isActive: true,
      };
      this.saveUser(adminUser);
      console.log("👤 Usuario admin por defecto creado");
    }

    // Crear el usuario empleado
    users = this.getUsers(); // Volver a obtener usuarios para incluir el admin recién creado
    if (!users.find((u) => u.username === "empleado")) {
      const receptionistUser: IUserData = {
        id: "user-recep-001",
        username: "empleado",
        email: "empleado@gmail.com",
        password: "empleado123", // En producción, esto DEBE estar hasheado
        role: "empleado",
        createdAt: new Date(),
        isActive: true,
      };
      this.saveUser(receptionistUser);
      console.log("🧑‍💼 empleado por defecto creado");
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
          id: "prod-005",
          name: "Smart TV LG 55 pulgadas 4K",
          description: "Televisor inteligente LG con resolución 4K y webOS.",
          price: 2499.0,
          stock: 8,
          category: "Electrónica",
          sku: "TV-LG-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-006",
          name: "Smartphone Samsung Galaxy A54",
          description:
            "Celular Samsung con cámara de 50MP y batería de larga duración.",
          price: 1299.0,
          stock: 30,
          category: "Telefonía",
          sku: "SMART-SAMS-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-007",
          name: "Mouse Gamer Logitech G203",
          description:
            "Mouse para juegos con iluminación RGB y sensor preciso.",
          price: 120.0,
          stock: 70,
          category: "Gaming",
          sku: "MOUSE-LOGI-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-008",
          name: "Teclado Mecánico HyperX Alloy FPS Pro",
          description:
            "Teclado mecánico compacto ideal para FPS con switches Cherry MX.",
          price: 350.0,
          stock: 20,
          category: "Gaming",
          sku: "TECL-HYPX-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-009",
          name: "Disco Duro Externo Seagate 1TB",
          description:
            "Almacenamiento portátil de 1TB, compatible con USB 3.0.",
          price: 220.0,
          stock: 40,
          category: "Almacenamiento",
          sku: "HDD-SEAG-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-010",
          name: "Webcam Logitech C920",
          description:
            "Cámara web Full HD 1080p para videollamadas y streaming.",
          price: 180.0,
          stock: 25,
          category: "Periféricos",
          sku: "WEBC-LOGI-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-011",
          name: "Parlante Bluetooth JBL Flip 5",
          description:
            "Parlante portátil con sonido potente y resistencia al agua.",
          price: 280.0,
          stock: 35,
          category: "Audio",
          sku: "PARL-JBL-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-012",
          name: "Tableta Gráfica Wacom Intuos S",
          description:
            "Tableta para dibujo digital, ideal para artistas y diseñadores.",
          price: 450.0,
          stock: 12,
          category: "Diseño",
          sku: "TABLET-WACOM-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-013",
          name: "Router Wi-Fi TP-Link Archer C6",
          description: "Router de doble banda AC1200 para una conexión rápida.",
          price: 160.0,
          stock: 18,
          category: "Redes",
          sku: "ROUTER-TPLK-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-017",
          name: "Memoria RAM Corsair Vengeance LPX 16GB",
          description: "Módulo de RAM DDR4 de 16GB (2x8GB) a 3200MHz.",
          price: 380.0,
          stock: 15,
          category: "Componentes PC",
          sku: "RAM-CORS-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-019",
          name: "Proyector Portátil Epson EpiqVision Mini EF12",
          description:
            "Proyector compacto con Android TV integrado y resolución Full HD.",
          price: 3200.0,
          stock: 4,
          category: "Proyectores",
          sku: "PROY-EPS-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-020",
          name: "Cámara Réflex Digital Canon EOS Rebel T7i",
          description:
            "Cámara DSLR con sensor de 24.2MP y conectividad Wi-Fi/NFC.",
          price: 1750.0,
          stock: 6,
          category: "Fotografía",
          sku: "CAM-CANN-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-024",
          name: "Robot Aspiradora Roomba i3+",
          description:
            "Aspiradora robótica con vaciado automático y navegación inteligente.",
          price: 2100.0,
          stock: 9,
          category: "Hogar Inteligente",
          sku: "ROBOT-ROOM-001",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: "prod-012",
          name: "Equipo de Sonido Sony MHC-V13",
          description:
            "Sistema de audio de alta potencia con luces LED y conexión Bluetooth.",
          price: 1100.0,
          stock: 9,
          category: "Audio",
          sku: "AUDIO-SONY-001",
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
          email: "ventas@email.com.pe",
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
  } 
} 

export const dataService = new DataService();
