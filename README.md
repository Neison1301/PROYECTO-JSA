# 🖥️ Sistema de Gestión de Inventario Tecnológico

> **Software personalizado para la gestión integral de artículos tecnológicos**

Un sistema completo desarrollado con React y Vite para gestionar inventarios, ventas, empleados y generar reportes detallados con un dashboard intuitivo.

![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JSON Server](https://img.shields.io/badge/JSON_Server-Database-FF6B6B?style=for-the-badge&logo=json&logoColor=white)

## Características

- **Gestión de Inventarios** - Control completo de stock y productos
- **Sistema de Ventas** - Procesamiento y facturación automática  
- **Gestión de Empleados** - Control de personal y permisos
- **Reportes Detallados** - Análisis y estadísticas en tiempo real
- **Dashboard Intuitivo** - Panel de control centralizado

## Tecnologías

- **React 18+** con Vite
- **Tailwind CSS** para estilos modernos
- **JSON Server** como base de datos local
- **React Router** para navegación

## Requisitos Previos

- **Node.js** (versión 16.0 o superior)
- **npm** (versión 8.0 o superior)

```bash
# Verificar versiones instaladas
node --version
npm --version
```

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Neison1301/PROYECTO-JSA.git
cd PROYECTO-JSA
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Iniciar JSON Server (Base de Datos)

```bash
# En una terminal separada
npm run server
# o si tienes json-server instalado globalmente:
json-server --watch db.json --port 3001
```

### 4. Iniciar el Proyecto

```bash
npm run dev
```

El sistema estará disponible en `http://localhost:5173`

## Credenciales de Prueba

```
Usuario Administrador:
- Usuario: admin
- Contraseña: admin123

Usuario Empleado:
- Usuario: empleado
- Contraseña: empleado123
```

## Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run server       # Inicia JSON Server
npm run lint         # Ejecuta ESLint
```

---
