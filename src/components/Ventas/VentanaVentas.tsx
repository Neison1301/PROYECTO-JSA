// src/components/VentanaVentas.tsx

import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Venta ,ItemVenta } from '../../domain/Venta';
import { Cliente } from '../../domain/Cliente';
import { Producto } from '../../domain/Producto';
import { generarId, formatearMoneda, formatearFecha } from '../../utils'; // generarId ya no se usa para nuevas ventas
import { ShoppingCart, Plus, Edit, Trash2, Search, User, Package, Calendar, DollarSign, FileText, FileSpreadsheet } from 'lucide-react';
import { UtilidadesExportacion } from '../../utils/exportUtils'; // Asumo que exportUtils ya existe

const SalesWindow: React.FC = () => {
  const [sales, setSales] = useState<Venta[]>([]);
  const [filteredSales, setFilteredSales] = useState<Venta[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    products: [] as ItemVenta[],
    notes: ''
  });
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: '1'
  });

  useEffect(() => {
    // Llama a la función asíncrona dentro de useEffect
    loadData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm]); // Dependencia 'sales' para que el filtro se actualice cuando se cargan nuevas ventas

  const loadData = async () => {
    try {
      const loadedSales = await dataService.getSales();
      const loadedProducts = await dataService.getProducts();
      const loadedClients = await dataService.getClients();

      // Ordenar ventas por fecha de creación (más recientes primero)
      const sortedSales = (loadedSales || []).sort((a, b) => {
        // Asegúrate de que createdAt sea un objeto Date
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA; // Orden descendente (más reciente primero)
      });
      
      setSales(sortedSales);
      setProducts(loadedProducts || []);
      setClients(loadedClients || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setSales([]);
      setProducts([]);
      setClients([]);
      alert('Hubo un error al cargar los datos. Inténtelo de nuevo.');
    }
  };

  const filterSales = () => {
    if (!searchTerm) {
      setFilteredSales(sales);
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filtered = sales.filter(sale =>
      // El cliente SIEMPRE debe tener un nombre
      sale.clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
      // sale.id siempre existirá para elementos ya cargados, usamos '!'
      (sale.id && sale.id.toLowerCase().includes(lowerCaseSearchTerm)) || // Comprueba si sale.id existe antes de usarlo
      sale.status.toLowerCase().includes(lowerCaseSearchTerm) ||
      // También podríamos buscar en los nombres de productos de la venta
      sale.products.some(item => item.productName.toLowerCase().includes(lowerCaseSearchTerm))
    );
    
    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    setFilteredSales(sortedFiltered);
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      products: [],
      notes: ''
    });
    setNewItem({
      productId: '',
      quantity: '1'
    });
  };

  const addProductToSale = () => {
    if (!newItem.productId || !newItem.quantity) {
      alert('Por favor, selecciona un producto y especifica una cantidad.');
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) {
      alert('Producto no encontrado.');
      return;
    }

    const quantity = Number(newItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('La cantidad debe ser un número positivo.');
      return;
    }
    if (quantity > product.stock) {
      alert(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${quantity}`);
      return;
    }

    const existingItem = formData.products.find(item => item.productId === newItem.productId);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        alert(`La cantidad total para ${product.name} excede el stock disponible. (Max: ${product.stock})`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        products: prev.products.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: newQuantity, total: newQuantity * product.price }
            : item
        )
      }));
    } else {
      const saleItem: ItemVenta = {
        productId: product.id!, // El ID del producto siempre debe existir aquí
        productName: product.name,
        quantity,
        price: product.price,
        total: quantity * product.price
      };

      setFormData(prev => ({
        ...prev,
        products: [...prev.products, saleItem]
      }));
    }

    setNewItem({ productId: '', quantity: '1' });
  };

  const removeProductFromSale = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(item => item.productId !== productId)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.products.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% de IGV/IVA, ajusta si es necesario
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // MANEJAR LA EXPORTACIÓN DE VENTAS
  const handleExportSales = (formato: 'excel' | 'pdf') => {
    if (filteredSales.length === 0) {
      alert('No hay ventas para exportar en la tabla actual. Aplica filtros si lo deseas.');
      return;
    }
    try {
      UtilidadesExportacion.exportarReporteVentas(filteredSales, formato);
      console.log(`Reporte de ventas exportado en formato ${formato}.`);
    } catch (error) {
      console.error('Error al exportar reporte de ventas:', error);
      alert('Hubo un error al exportar el reporte de ventas.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || formData.products.length === 0) {
        alert('Debe seleccionar un cliente y agregar al menos un producto.');
        return;
    }

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
        alert('Cliente no encontrado.');
        return;
    }

    // Verificar stock antes de guardar la venta
    for (const item of formData.products) {
        const productInStock = products.find(p => p.id === item.productId);
        if (!productInStock || productInStock.stock < item.quantity) {
            alert(`Stock insuficiente para el producto: ${item.productName}. Disponible: ${productInStock?.stock || 0}, Solicitado: ${item.quantity}`);
            return;
        }
    }

    const { subtotal, tax, total } = calculateTotals();

    // Declara saleData directamente como Venta. El 'id' es opcional en la interfaz
    // y será asignado por el backend (json-server) en el POST.
    const saleData: Venta = { 
      clientId: formData.clientId,
      clientName: client.name,
      products: formData.products,
      subtotal,
      tax,
      total,
      status: 'Completada', // Estado por defecto para nuevas ventas
      createdAt: new Date(), // Se establecerá o sobrescribirá por dataService
      updatedAt: new Date(), // Se establecerá o sobrescribirá por dataService
      notes: formData.notes
    };

    try {
        // Actualizar el stock de los productos. Esto se ejecutará como PUT.
        for (const item of formData.products) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const updatedProduct = {
                    ...product,
                    stock: product.stock - item.quantity,
                    updatedAt: new Date()
                };
                await dataService.saveProduct(updatedProduct); 
            }
        }

        // ¡CLAVE! Guardar la venta. 'saveSale' hará un POST y devolverá la venta con el ID asignado.
        const savedSale = await dataService.saveSale(saleData); 

        if (savedSale) { // Si la venta se guardó exitosamente y se recibió un ID del servidor
            // Generar la boleta de venta PDF usando el objeto 'savedSale' que ahora TIENE EL ID
            await UtilidadesExportacion.generarBoletaVentaPDF(savedSale, products, client);
            
            alert('Venta completada y boleta generada exitosamente!');
            loadData(); // Recargar todos los datos para que la nueva venta aparezca en la tabla
            setShowForm(false);
            resetForm();
        } else {
            // Manejo si saveSale devuelve null (indicando un error en el servicio)
            alert('Error: No se pudo guardar la venta. Inténtelo de nuevo.');
        }
    } catch (error) {
        console.error('Error al completar la venta o generar boleta:', error);
        alert('Hubo un error al procesar la venta. Verifique los datos, stock o la configuración del servidor.');
    }
  };

  const handleDelete = async (sale: Venta) => {
    // Confirmación al usuario antes de eliminar
    if (window.confirm(`¿Estás seguro de eliminar la venta #${sale.id}? Esta acción no revertirá el stock de productos.`)) {
      try {
        // Como 'sale' viene de la lista cargada, sale.id siempre estará definido.
        // Usamos el operador '!' para afirmar a TypeScript que no es undefined.
        await dataService.deleteSale(sale.id!); 
        loadData(); // Recargar datos para reflejar el cambio
        alert('Venta eliminada correctamente.');
      } catch (error) {
        console.error("Error al eliminar la venta:", error);
        alert('Hubo un error al eliminar la venta.');
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completada': return 'bg-success';
      case 'Pendiente': return 'bg-warning';
      case 'Cancelada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completada': return 'Completada';
      case 'Pendiente': return 'Pendiente';
      case 'Cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    // Asegurarse de que 'date' sea un objeto Date válido
    const saleDate = typeof date === 'string' ? new Date(date) : date;

    // Verificar si saleDate es una fecha válida después de la conversión
    if (isNaN(saleDate.getTime())) {
      return 'Fecha inválida';
    }

    const diffInMinutes = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return formatearFecha(saleDate); // Asegúrate de pasar un objeto Date
  };

  if (showForm) {
    const { subtotal, tax, total } = calculateTotals();

    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>
            <ShoppingCart className="me-2" />
            Nueva Venta
          </h4>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
                <label htmlFor="clientId">Cliente</label>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Productos</h6>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={newItem.productId}
                    onChange={(e) => setNewItem(prev => ({ ...prev, productId: e.target.value }))}
                  >
                    <option value="">Seleccionar producto</option>
                    {products.filter(p => p.stock > 0).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatearMoneda(product.price)} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Cantidad"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="col-md-3">
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={addProductToSale}
                    disabled={!newItem.productId || !newItem.quantity || Number(newItem.quantity) <= 0 || Number(newItem.quantity) > (products.find(p => p.id === newItem.productId)?.stock || 0)}
                  >
                    <Plus size={18} className="me-1" />
                    Agregar
                  </button>
                </div>
              </div>

              {formData.products.length > 0 && (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Total</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products.map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatearMoneda(item.price)}</td>
                          <td>{formatearMoneda(item.total)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeProductFromSale(item.productId)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {formData.products.length > 0 && (
            <div className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <textarea
                        className="form-control"
                        id="notes"
                        placeholder="Notas adicionales"
                        style={{ height: '100px' }}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                      <label htmlFor="notes">Notas adicionales</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal:</span>
                          <span>{formatearMoneda(subtotal)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>IVA (18%):</span>
                          <span>{formatearMoneda(tax)}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <strong>Total:</strong>
                          <strong className="text-primary">{formatearMoneda(total)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex gap-2">
            <button 
              type="submit" 
              className="btn btn-gradient"
              disabled={!formData.clientId || formData.products.length === 0}
            >
              Completar Venta
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
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
          <ShoppingCart className="me-2" />
          Gestión de Ventas
        </h4>
        <div className="d-flex align-items-center">
          <button
              className="btn btn-outline-success me-2"
              onClick={() => handleExportSales('excel')}
              title="Exportar ventas a Excel"
          >
              <FileSpreadsheet size={18} className="me-1" />
              Excel
          </button>
          <button
              className="btn btn-outline-danger me-3"
              onClick={() => handleExportSales('pdf')}
              title="Exportar ventas a PDF"
          >
              <FileText size={18} className="me-1" />
              PDF
          </button>
          <button
              className="btn btn-gradient"
              onClick={() => setShowForm(true)}
          >
              <Plus size={18} className="me-2" />
              Nueva Venta
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
              placeholder="Buscar ventas por cliente, ID o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-end">
            <span className="text-muted">
              {filteredSales.length} de {sales.length} ventas
            </span>
            <br />
            <small className="text-info">
              📅 Ordenadas por fecha (más recientes)
            </small>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-modern">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <div className="text-muted">
                    <ShoppingCart size={48} className="mb-2 opacity-50" />
                    <p>No se encontraron ventas</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSales.map((sale, index) => (
                // Asegúrate de que sale.id esté presente antes de usarlo como key
                <tr key={sale.id || `temp-${index}`} className={index < 3 ? 'table-success' : ''}>
                  <td>
                    <div className="d-flex align-items-center">
                      <code>{sale.id || 'N/A'}</code> {/* Mostrar 'N/A' si por alguna razón no hay ID */}
                      {index < 3 && (
                        <span className="badge bg-success ms-2 small">NUEVA</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <User size={16} className="me-2 text-muted" />
                      <span>{sale.clientName}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <Package size={14} className="me-1 text-muted" />
                        <span className="badge bg-info">{(sale.products || []).length} productos</span>
                      </div>
                      <small className="text-muted">
                        {(sale.products || []).slice(0, 2).map(p => p.productName).join(', ')}
                        {(sale.products || []).length > 2 && '...'}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{formatearMoneda(sale.total)}</strong>
                      <br />
                      <small className="text-muted">
                        IVA: {formatearMoneda(sale.tax)}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(sale.status)}`}>
                      {getStatusText(sale.status)}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Calendar size={14} className="me-1 text-muted" />
                      <div>
                        <small>{formatearFecha(sale.createdAt)}</small>
                        <br />
                        <small className="text-primary fw-bold">
                          {getTimeAgo(sale.createdAt)}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-info"
                        title="Ver detalles"
                        onClick={() => {
                          alert(`Detalles de venta:\n\nID Venta: ${sale.id || 'N/A'}\nCliente: ${sale.clientName}\nTotal: ${formatearMoneda(sale.total)}\nFecha: ${formatearFecha(sale.createdAt)}\n\nProductos:\n${(sale.products || []).map(p => `- ${p.productName} x${p.quantity} = ${formatearMoneda(p.total)}`).join('\n')}\n\nNotas: ${sale.notes || 'N/A'}`);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(sale)}
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

export default SalesWindow;