import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Product } from '../../types';
import { generarId, formatearMoneda, formatearFecha, validarRequerido, validarNumero } from '../../utils';
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, FileText, FileSpreadsheet  } from 'lucide-react';
import { UtilidadesExportacion } from '../../utils/exportUtils';

const VentanaProductos: React.FC = () => {
  const [productos, setProductos] = useState<Product[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Product[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Product | null>(null);
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
  useEffect(() => {
    cargarProductos();
  }, []);
  useEffect(() => {
    filtrarProductos();
  }, [productos, terminoBusqueda]);

  const cargarProductos = () => {
    const productosCargados = dataService.getProducts();
    setProductos(productosCargados);
  };

  const filtrarProductos = () => {
    if (!terminoBusqueda) {
      setProductosFiltrados(productos);
      return;
    }
    const filtrados = productos.filter(producto =>
      producto.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      producto.sku.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      producto.category.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setProductosFiltrados(filtrados);
  };

  const resetearFormulario = () => {
    setDatosFormulario({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria: '',
      sku: ''
    });
    setErrores({}),
    setProductoEditando(null); 
  };

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
        if (!validarFormulario()) return;

    const datosProducto: Product = {
      id: productoEditando?.id || generarId(), // Usar ID existente o generar uno nuevo
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

    // Guardar el producto 
    dataService.saveProduct(datosProducto);
    cargarProductos();
    setMostrarFormulario(false); 
    resetearFormulario(); 
  };

  // Manejar la edición de un producto
  const manejarEdicion = (producto: Product) => {
    setProductoEditando(producto); 
    // Llenar el formulario con los datos del producto seleccionado
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

  const manejarEliminacion = (producto: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${producto.name}"?`)) {
      dataService.deleteProduct(producto.id); 
      cargarProductos(); 
    }
  };
  const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
        if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };


  // === Nuevas funciones para exportar productos ===
  const handleExportarExcel = () => {
    try {
      // Exportar los productos filtrados a Excel
      UtilidadesExportacion.exportarReporteProductos(productosFiltrados, 'excel');
    } catch (error) {
      console.error('Error al exportar productos a Excel:', error);
      alert('Hubo un error al exportar el reporte a Excel.');
    }
  };

  const handleExportarPDF = () => {
    try {
      // Exportar los productos filtrados a PDF
      UtilidadesExportacion.exportarReporteProductos(productosFiltrados, 'pdf');
    } catch (error) {
      console.error('Error al exportar productos a PDF:', error);
      alert('Hubo un error al exportar el reporte a PDF.');
    }
  };

  // Renderizado condicional: si mostrarFormulario es true, mostrar el formulario
  if (mostrarFormulario) {
    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>
            <Package className="me-2" />
            {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
          </h4>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setMostrarFormulario(false); // Ocultar formulario
              resetearFormulario(); // Resetear formulario
            }}
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
                  id="nombre"
                  name="nombre"
                  placeholder="Nombre del producto"
                  value={datosFormulario.nombre}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="nombre">Nombre del producto</label>
                {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.sku ? 'is-invalid' : ''}`}
                  id="sku"
                  name="sku"
                  placeholder="SKU"
                  value={datosFormulario.sku}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="sku">SKU</label>
                {errores.sku && <div className="invalid-feedback">{errores.sku}</div>}
              </div>
            </div>
          </div>

          <div className="form-floating mb-3">
            <textarea
              className={`form-control ${errores.descripcion ? 'is-invalid' : ''}`}
              id="descripcion"
              name="descripcion"
              placeholder="Descripción"
              style={{ height: '100px' }}
              value={datosFormulario.descripcion}
              onChange={manejarCambioInput}
            />
            <label htmlFor="descripcion">Descripción</label>
            {errores.descripcion && <div className="invalid-feedback">{errores.descripcion}</div>}
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="form-floating mb-3">
                <input
                  type="number"
                  step="0.01" 
                  className={`form-control ${errores.precio ? 'is-invalid' : ''}`}
                  id="precio"
                  name="precio"
                  placeholder="Precio"
                  value={datosFormulario.precio}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="precio">Precio</label>
                {errores.precio && <div className="invalid-feedback">{errores.precio}</div>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-floating mb-3">
                <input
                  type="number"
                  className={`form-control ${errores.stock ? 'is-invalid' : ''}`}
                  id="stock"
                  name="stock"
                  placeholder="Stock"
                  value={datosFormulario.stock}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="stock">Stock</label>
                {errores.stock && <div className="invalid-feedback">{errores.stock}</div>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.categoria ? 'is-invalid' : ''}`}
                  id="categoria"
                  name="categoria"
                  placeholder="Categoría"
                  value={datosFormulario.categoria}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="categoria">Categoría</label>
                {errores.categoria && <div className="invalid-feedback">{errores.categoria}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-gradient">
              {productoEditando ? 'Actualizar' : 'Guardar'} Producto
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMostrarFormulario(false);
                resetearFormulario(); // Resetear formulario
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <Package className="me-2" />
          Gestión de Productos
        </h4> <div className="d-flex gap-2">
          {/* Botones de Exportación */}
          <button
            className="btn btn-outline-success"
            onClick={handleExportarExcel}
            disabled={productosFiltrados.length === 0} // Deshabilitar si no hay productos para exportar
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
            onClick={() => setMostrarFormulario(true)} // Mostrar formulario al hacer clic
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
              onChange={(e) => setTerminoBusqueda(e.target.value)} // Actualizar término de búsqueda
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
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <div className="text-muted">
                    <Package size={48} className="mb-2 opacity-50" />
                    <p>No se encontraron productos</p>
                  </div>
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => (
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
                      {/* Resaltar stock bajo con texto de advertencia */}
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