import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Sale, SaleItem, Product, Client } from '../../types';
import { generarId, formatearMoneda, formatearFecha  } from '../../utils';
import { ShoppingCart, Plus, Edit, Trash2, Search, User, Package, Calendar, DollarSign } from 'lucide-react';

const SalesWindow: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    products: [] as SaleItem[],
    notes: ''
  });
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: '1'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm]);

  const loadData = () => {
    const loadedSales = dataService.getSales();
    // Ordenar ventas por fecha de creación (más recientes primero)
    const sortedSales = loadedSales.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Orden descendente (más reciente primero)
    });
    
    setSales(sortedSales);
    setProducts(dataService.getProducts());
    setClients(dataService.getClients());
  };

  const filterSales = () => {
    if (!searchTerm) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(sale =>
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.includes(searchTerm) ||
      sale.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Mantener el orden por fecha después del filtrado
    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Orden descendente (más reciente primero)
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
    if (!newItem.productId || !newItem.quantity) return;

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;

    const quantity = Number(newItem.quantity);
    if (quantity <= 0 || quantity > product.stock) return;

    const existingItem = formData.products.find(item => item.productId === newItem.productId);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) return;

      setFormData(prev => ({
        ...prev,
        products: prev.products.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: newQuantity, total: newQuantity * product.price }
            : item
        )
      }));
    } else {
      const saleItem: SaleItem = {
        productId: product.id,
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
    const tax = subtotal * 0.18; // 
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || formData.products.length === 0) return;

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;

    const { subtotal, tax, total } = calculateTotals();

    const saleData: Sale = {
      id: generarId(),
      clientId: formData.clientId,
      clientName: client.name,
      products: formData.products,
      subtotal,
      tax,
      total,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: formData.notes
    };

    
    formData.products.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity,
          updatedAt: new Date()
        };
        dataService.saveProduct(updatedProduct);
      }
    });

    dataService.saveSale(saleData);
    loadData(); // Recargar datos para mantener el orden correcto
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (sale: Sale) => {
    if (window.confirm(`¿Estás seguro de eliminar la venta #${sale.id}?`)) {
      dataService.deleteSale(sale.id);
      loadData(); // Recargar datos para mantener el orden correcto
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return formatearFecha (date);
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
                    disabled={!newItem.productId || !newItem.quantity}
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
        <button
          className="btn btn-gradient"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} className="me-2" />
          Nueva Venta
        </button>
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
              placeholder="Buscar ventas..."
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
                <tr key={sale.id} className={index < 3 ? 'table-success' : ''}>
                  <td>
                    <div className="d-flex align-items-center">
                      <code>{sale.id}</code>
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
                        <span className="badge bg-info">{sale.products.length} productos</span>
                      </div>
                      <small className="text-muted">
                        {sale.products.slice(0, 2).map(p => p.productName).join(', ')}
                        {sale.products.length > 2 && '...'}
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
                        <small>{formatearFecha (sale.createdAt)}</small>
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
                          alert(`Detalles de venta:\n\nCliente: ${sale.clientName}\nTotal: ${formatearMoneda(sale.total)}\nFecha: ${formatearFecha (sale.createdAt)}\n\nProductos:\n${sale.products.map(p => `- ${p.productName} x${p.quantity} = ${formatearMoneda(p.total)}`).join('\n')}`);
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