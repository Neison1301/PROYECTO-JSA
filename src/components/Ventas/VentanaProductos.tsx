import React, { useState, useEffect } from 'react';
// Importaciones de módulos y utilidades
import { Producto } from '../../domain/Producto';
import { generarId, formatearMoneda, formatearFecha, validarRequerido, validarNumero } from '../../utils';
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, FileText, FileSpreadsheet } from 'lucide-react';
import { UtilidadesExportacion } from '../../utils/exportUtils';
import { productService } from '../../services/servicioProducto';
import ProductoForm from '../Formularios/FormularioProductos';

const VentanaProductos: React.FC = () => {
  // Estados del componente
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    sku: ''
  });
  const [errores, setErrores] = useState<{[key: string]: string}>({});

  // Efecto para cargar productos al iniciar
  useEffect(() => {
    cargarProductos();
  }, []);

  // Efecto para filtrar productos cuando cambian los productos o el término de búsqueda
  useEffect(() => {
    filtrarProductos();
  }, [productos, terminoBusqueda]);

  // Carga los productos de forma asíncrona
  const cargarProductos = async () => {
    try {
      const productosCargados = await productService.getProducts();
      setProductos(productosCargados || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProductos([]);
    }
  };

  // Filtra los productos según el término de búsqueda
  const filtrarProductos = () => {
    const productosBase = Array.isArray(productos) ? productos : [];
    if (!terminoBusqueda) {
      setProductosFiltrados(productosBase);
      return;
    }
    const filtrados = productosBase.filter(producto =>
      producto.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      producto.sku.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      producto.category.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setProductosFiltrados(filtrados);
  };

  // Resetea el formulario a sus valores iniciales
  const resetearFormulario = () => {
    setDatosFormulario({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria: '',
      sku: ''
    });
    setErrores({});
    setProductoEditando(null);
  };

  // Valida los campos del formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: {[key: string]: string} = {};
    if (!validarRequerido(datosFormulario.nombre)) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }
    if (!validarRequerido(datosFormulario.descripcion)) {
      nuevosErrores.descripcion = 'La descripción es requerida';
    }
    if (!validarNumero (datosFormulario.precio) || Number(datosFormulario.precio) <= 0) {
      nuevosErrores.precio = 'El precio debe ser un número mayor a 0';
    }
    if (!validarNumero (datosFormulario.stock) || Number(datosFormulario.stock) < 0) {
      nuevosErrores.stock = 'El stock debe ser un número mayor o igual a 0';
    }
    if (!validarRequerido(datosFormulario.categoria)) {
      nuevosErrores.categoria = 'La categoría es requerida';
    }
    if (!validarRequerido(datosFormulario.sku)) {
      nuevosErrores.sku = 'El SKU es requerido';
    }
    const skuExistente = productos.find(p =>
      p.sku === datosFormulario.sku && (!productoEditando || p.id !== productoEditando.id)
    );
    if (skuExistente) {
      nuevosErrores.sku = 'Este SKU ya existe';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Maneja el envío del formulario para guardar o actualizar un producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const datosProducto: Producto = {
      id: productoEditando?.id || generarId(),
      name: datosFormulario.nombre,
      description: datosFormulario.descripcion,
      price: Number(datosFormulario.precio),
      stock: Number(datosFormulario.stock),
      category: datosFormulario.categoria,
      sku: datosFormulario.sku,
      createdAt: productoEditando?.createdAt || new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    try {
      await productService.guardarProducto(datosProducto);
      cargarProductos();
      setMostrarFormulario(false);
      resetearFormulario();
      console.log('Producto guardado correctamente.');
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  };

  // Prepara el formulario para editar un producto existente
  const manejarEdicion = (producto: Producto) => {
    setProductoEditando(producto);
    setDatosFormulario({
      nombre: producto.name,
      descripcion: producto.description,
      precio: producto.price.toString(),
      stock: producto.stock.toString(),
      categoria: producto.category,
      sku: producto.sku
    });
    setMostrarFormulario(true);
  };

  // Maneja la eliminación de un producto
  const manejarEliminacion = async (producto: Producto) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el producto "${producto.name}"?`);
    if (confirmDelete) {
      try {
        await productService.eliminarProducto(producto.id);
        cargarProductos();
        console.log('Producto eliminado correctamente.');
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    }
  };

  // Actualiza el estado del formulario al cambiar los inputs
  const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Exporta los productos filtrados a Excel
  const handleExportarExcel = () => {
    try {
      UtilidadesExportacion.exportarReporteProductos(productosFiltrados, 'excel');
      console.log('Reporte de productos exportado a Excel correctamente.');
    } catch (error) {
      console.error('Error al exportar productos a Excel:', error);
    }
  };

  // Exporta los productos filtrados a PDF
  const handleExportarPDF = () => {
    try {
      UtilidadesExportacion.exportarReporteProductos(productosFiltrados, 'pdf');
      console.log('Reporte de productos exportado a PDF correctamente.');
    } catch (error) {
      console.error('Error al exportar productos a PDF:', error);
    }
  };

  // Cancela la operación del formulario y lo cierra
  const handleCancelForm = () => {
    setMostrarFormulario(false);
    resetearFormulario();
  };

  // Renderiza el formulario de producto si mostrarFormulario es true
  if (mostrarFormulario) {
    return (
      <ProductoForm
        datosFormulario={datosFormulario}
        errores={errores}
        productoEditando={productoEditando}
        manejarCambioInput={manejarCambioInput}
        handleSubmit={handleSubmit}
        onCancel={handleCancelForm}
      />
    );
  }

  // Renderiza la tabla de gestión de productos
  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <Package className="me-2" />
          Gestión de Productos
        </h4> <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success"
            onClick={handleExportarExcel}
            disabled={productosFiltrados.length === 0}
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={18} className="me-2" />
            Excel
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={handleExportarPDF}
            disabled={productosFiltrados.length === 0}
            title="Exportar a PDF"
          >
            <FileText size={18} className="me-2" />
            PDF
          </button>
          <button
            className="btn btn-gradient"
            onClick={() => setMostrarFormulario(true)}
          >
            <Plus size={18} className="me-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar productos..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-end">
            <span className="text-muted">
              {productosFiltrados.length} de {productos.length} productos
            </span>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-modern">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados && productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <div className="text-muted">
                    <Package size={48} className="mb-2 opacity-50" />
                    <p>No se encontraron productos</p>
                  </div>
                </td>
              </tr>
            ) : (
              (productosFiltrados || []).map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <code>{producto.sku}</code>
                  </td>
                  <td>
                    <div>
                      <strong>{producto.name}</strong>
                      <br />
                      <small className="text-muted">{producto.description}</small>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-info">{producto.category}</span>
                  </td>
                  <td>{formatearMoneda(producto.price)}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className={producto.stock < 10 ? 'text-warning fw-bold' : ''}>
                        {producto.stock}
                      </span>
                      {producto.stock < 10 && (
                        <AlertTriangle size={16} className="text-warning ms-1" />
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${producto.isActive ? 'status-active' : 'status-inactive'}`}>
                      {producto.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <small>{formatearFecha(producto.createdAt)}</small>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => manejarEdicion(producto)}
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => manejarEliminacion(producto)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentanaProductos;
