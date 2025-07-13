import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWindows } from '../../contexts/WindowContext';
import { dataService } from '../../services/dataService';
import { Package, Users, ShoppingCart, TrendingUp, Calendar, Clock, UserPlus} from 'lucide-react';
import { formatearMoneda } from '../../utils';

const PanelPrincipal: React.FC = () => {
  // Obtener el usuario del contexto de autenticación
  const { user } = useAuth();
  // Obtener la función para abrir ventanas del contexto de ventanas
  const { openWindow } = useWindows();
  // Estado para las estadísticas del panel
  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    totalClientes: 0,
    totalVentas: 0,
    ingresosTotales: 0,
    productosBajoStock: 0,
    ventasRecientes: 0
  });

  // Efecto para cargar las estadísticas al montar el componente
  useEffect(() => {
    const cargarEstadisticas = () => {
      // Obtener datos de productos, clientes y ventas
      const productos = dataService.getProducts();
      const clientes = dataService.getClients();
      const ventas = dataService.getSales();

      // Obtener la fecha actual y el inicio del mes actual
      const hoy = new Date();
      const esteMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      // Calcular ventas recientes (este mes)
      const ventasEsteMes = ventas.filter(venta => new Date(venta.createdAt) >= esteMes);
      // Calcular ingresos totales
      const ingresosAcumulados = ventas.reduce((suma, venta) => suma + venta.total, 0);
      // Contar productos con stock bajo (menos de 10 unidades)
      const productosConPocoStock = productos.filter(producto => producto.stock < 10).length;

      // Actualizar el estado de las estadísticas
      setEstadisticas({
        totalProductos: productos.length,
        totalClientes: clientes.length,
        totalVentas: ventas.length,
        ingresosTotales: ingresosAcumulados,
        productosBajoStock: productosConPocoStock,
        ventasRecientes: ventasEsteMes.length
      });
    };

    // Cargar las estadísticas al inicio
    cargarEstadisticas();
  }, []);

  // Función para obtener la hora y fecha actuales formateadas
  const obtenerHoraActual = () => {
    //hor peru
    return new Date().toLocaleString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para manejar las acciones rápidas
  const manejarAccionRapida = (accion: string) => {
    // Abrir la ventana correspondiente según la acción
    switch (accion) {
      case 'productos':
        openWindow('Productos', 'products');
        break;
      case 'clientes':
        openWindow('Clientes', 'clients');
        break;
      case 'ventas':
        openWindow('Ventas', 'sales');
        break;
      case 'reportes':
        openWindow('Reportes', 'reports');
        break;{/* Agregar Recepcionista */}
      case 'agregarRecepcionista': 
        openWindow('Nuevo Recepcionista', 'addUserForm'); 
        break;
      default:
        break;
    }
  };

  return (
    <div className="fade-in">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h4 mb-1">¡Bienvenido, {user?.username}!</h2>
              <p className="text-muted mb-0">
                <Clock size={16} className="me-1" />
                {obtenerHoraActual()}
              </p>
            </div>
            <div className="text-end">
              <span className="badge bg-success fs-6">Sistema Activo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card products">
          <div className="card-icon">
            <Package />
          </div>
          <h5 className="card-title">Productos</h5>
          <h3 className="text-primary mb-2">{estadisticas.totalProductos}</h3>
          <small className="text-muted">
            {estadisticas.productosBajoStock > 0 && (
              <span className="text-warning">
                {estadisticas.productosBajoStock} con stock bajo
              </span>
            )}
          </small>
        </div>

        <div className="dashboard-card clients">
          <div className="card-icon">
            <Users />
          </div>
          <h5 className="card-title">Clientes</h5>
          <h3 className="text-success mb-2">{estadisticas.totalClientes}</h3>
          <small className="text-muted">Clientes registrados</small>
        </div>

        <div className="dashboard-card sales">
          <div className="card-icon">
            <ShoppingCart />
          </div>
          <h5 className="card-title">Ventas</h5>
          <h3 className="text-warning mb-2">{estadisticas.totalVentas}</h3>
          <small className="text-muted">
            {estadisticas.ventasRecientes} este mes
          </small>
        </div>

        <div className="dashboard-card users">
          <div className="card-icon">
            <TrendingUp />
          </div>
          <h5 className="card-title">Ingresos</h5>
          <h3 className="text-danger mb-2">{formatearMoneda(estadisticas.ingresosTotales)}</h3>
          <small className="text-muted">Total acumulado</small>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h6 className="card-title mb-0">
                <Calendar className="me-2" size={18} />
                Resumen de Actividad
              </h6>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Productos activos</span>
                  <span className="badge bg-primary rounded-pill">{estadisticas.totalProductos}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Clientes activos</span>
                  <span className="badge bg-success rounded-pill">{estadisticas.totalClientes}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Ventas completadas</span>
                  <span className="badge bg-info rounded-pill">{estadisticas.totalVentas}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Ingresos totales</span>
                  <span className="badge bg-warning rounded-pill">{formatearMoneda(estadisticas.ingresosTotales)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h6 className="card-title mb-0">
                <TrendingUp className="me-2" size={18} />
                Acciones Rápidas
              </h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => manejarAccionRapida('productos')}
                >
                  <Package className="me-2" size={18} />
                  Agregar Producto
                </button>
                <button 
                  className="btn btn-outline-success"
                  onClick={() => manejarAccionRapida('clientes')}
                >
                  <Users className="me-2" size={18} />
                  Registrar Cliente
                </button>
                <button 
                  className="btn btn-outline-warning"
                  onClick={() => manejarAccionRapida('ventas')}
                >
                  <ShoppingCart className="me-2" size={18} />
                  Nueva Venta
                </button>
                <button 
                  className="btn btn-outline-info"
                  onClick={() => manejarAccionRapida('reportes')}
                >
                  <TrendingUp className="me-2" size={18} />
                  Ver Reportes
                </button>
{/**/}
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => manejarAccionRapida('agregarRecepcionista')}
                >
                  <ShoppingCart className="me-2" size={18} />
                  Agregar Recepcionista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelPrincipal;