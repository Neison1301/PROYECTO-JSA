import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWindows } from '../contexts/WindowContext';
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  HardHat ,
  UserCheck 

} from 'lucide-react';

// Define las propiedades que recibe el componente Sidebar.
interface PropiedadesBarraLateral {
  // Indica si la barra lateral está colapsada.
  estaColapsada: boolean;
  alAlternar: () => void;
}

// Componente de la barra lateral del sistema.
const BarraLateral: React.FC<PropiedadesBarraLateral> = ({ estaColapsada, alAlternar }) => {
  // Obtiene las funciones de autenticación y los datos del usuario.
  const { logout, user } = useAuth();
  // Obtiene la función para abrir ventanas.
  const { openWindow } = useWindows();

  // Define los elementos del menú de la barra lateral.
   const elementosMenu = [
    { icono: Home, etiqueta: 'Dashboard', componente: 'dashboard', rolesPermitidos: ['admin', 'empleado'] },
    { icono: Package, etiqueta: 'Productos', componente: 'products', rolesPermitidos: ['admin'] },
    { icono: Users, etiqueta: 'Clientes', componente: 'clients', rolesPermitidos: ['admin', 'empleado'] },
    { icono: ShoppingCart, etiqueta: 'Ventas', componente: 'sales', rolesPermitidos: ['admin', 'empleado'] },
    { icono: BarChart3, etiqueta: 'Reportes', componente: 'reports', rolesPermitidos: ['admin'] }, 
    { icono: HardHat, etiqueta: 'Empleados', componente: 'addUserForm', rolesPermitidos: ['admin'] },
    { icono: Settings, etiqueta: 'Configuración', componente: 'settings', rolesPermitidos: ['admin', 'empleado'] }
  ];

  // Maneja el clic en un elemento del menú.
  const manejarClicMenu = (componente: string, etiqueta: string) => {
    openWindow(etiqueta, componente);
  };

  return (
    <div className={`sidebar ${estaColapsada ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="btn btn-lin text-white p-0"
          onClick={alAlternar} 
        >
          <Menu size={24} />
        </button>
        {!estaColapsada && (
          <div className="mt-2">
            <h5 className="mb-0">TNS</h5>
            <small className="opacity-75">- TECH'NOVA STORE</small>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {elementosMenu
        //este es el filtro segun su rol, 
        .filter(item => item.rolesPermitidos.includes(user?.role || ''))
        .map((item) => (
          <div key={item.componente} className="nav-item">
            <button
              className="nav-link w-100 text-start border-0 bg-transparent"
              onClick={() => manejarClicMenu(item.componente, item.etiqueta)} // Abre la ventana correspondiente.
              title={estaColapsada ? item.etiqueta : ''} // Muestra la etiqueta como título si está colapsada.
            >
              <item.icono size={20} />
              {!estaColapsada && <span className="ms-3">{item.etiqueta}</span>}
            </button>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-3">
        {!estaColapsada && user && (
          <div className="mb-3 pb-3 border-bottom border-light border-opacity-25">
            <small className="text-white-50">Conectado como:</small>
            <div className="text-white fw-semibold">{user.username}</div>
            <small className="text-white-50">{user.email}</small>
          </div>
        )}

        <button
          className="nav-link w-100 text-start border-0 bg-transparent text-white-50"
          onClick={logout} // Cierra la sesión del usuario.
          title={estaColapsada ? 'Cerrar Sesión' : ''} // Muestra el título si está colapsada.
        >
          <LogOut size={20} />
          {!estaColapsada && <span className="ms-3">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default BarraLateral;