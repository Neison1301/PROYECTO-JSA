import React, { useState, useEffect } from 'react';
import { Venta ,ItemVenta } from '../../domain/Venta';
import { Cliente } from '../../domain/Cliente';
import { Producto } from '../../domain/Producto';
import { formatearMoneda, formatearFecha } from '../../utils';
import { ShoppingCart, Plus, Edit, Trash2, Search, User, Package, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import { UtilidadesExportacion } from '../../utils/exportUtils';
import { productService } from '../../services/servicioProducto';
import { saleService } from '../../services/servicioVenta';
import { clientService } from '../../services/servicioCliente';
import SaleForm from '../Formularios/FormularioVentas';

const SalesWindow: React.FC = () => {
  // Estados del componente
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

  // Efecto para cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Efecto para filtrar ventas al cambiar la lista o el término de búsqueda
  useEffect(() => {
    filterSales();
  }, [sales, searchTerm]);

  // Carga ventas, productos y clientes
  const loadData = async () => {
    try {
      const loadedSales = await saleService.getSales();
      const loadedProducts = await productService.getProducts();
      const loadedClients = await clientService.getClients();

      const sortedSales = (loadedSales || []).sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setSales(sortedSales);
      setProducts(loadedProducts || []);
      setClients(loadedClients || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setSales([]);
      setProducts([]);
      setClients([]);
      console.error('Hubo un error al cargar los datos. Inténtelo de nuevo.');
    }
  };

  // Filtra la lista de ventas
  const filterSales = () => {
    if (!searchTerm) {
      setFilteredSales(sales);
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filtered = sales.filter(sale =>
      sale.clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
      (sale.id && sale.id.toLowerCase().includes(lowerCaseSearchTerm)) ||
      sale.status.toLowerCase().includes(lowerCaseSearchTerm) ||
      sale.products.some(item => item.productName.toLowerCase().includes(lowerCaseSearchTerm))
    );

    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    setFilteredSales(sortedFiltered);
  };

  // Resetea el formulario de venta
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

  // Agrega un producto a la venta
  const addProductToSale = () => {
    if (!newItem.productId || !newItem.quantity) {
      console.warn('Por favor, selecciona un producto y especifica una cantidad.');
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) {
      console.warn('Producto no encontrado.');
      return;
    }

    const quantity = Number(newItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      console.warn('La cantidad debe ser un número positivo.');
      return;
    }
    if (quantity > product.stock) {
      console.warn(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${quantity}`);
      return;
    }

    const existingItem = formData.products.find(item => item.productId === newItem.productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        console.warn(`La cantidad total para ${product.name} excede el stock disponible. (Max: ${product.stock})`);
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
        productId: product.id!,
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

  // Elimina un producto de la venta
  const removeProductFromSale = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(item => item.productId !== productId)
    }));
  };

  // Calcula los totales de la venta
  const calculateTotals = () => {
    const subtotal = formData.products.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // Maneja la exportación de ventas a Excel o PDF
  const handleExportSales = (formato: 'excel' | 'pdf') => {
    if (filteredSales.length === 0) {
      console.warn('No hay ventas para exportar en la tabla actual. Aplica filtros si lo deseas.');
      return;
    }
    try {
      UtilidadesExportacion.exportarReporteVentas(filteredSales, formato);
      console.log(`Reporte de ventas exportado en formato ${formato}.`);
    } catch (error) {
      console.error('Error al exportar reporte de ventas:', error);
      console.error('Hubo un error al exportar el reporte de ventas.');
    }
  };

  // Maneja el envío del formulario de venta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || formData.products.length === 0) {
        console.warn('Debe seleccionar un cliente y agregar al menos un producto.');
        return;
    }

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
        console.warn('Cliente no encontrado.');
        return;
    }

    // Verifica el stock antes de guardar la venta
    for (const item of formData.products) {
        const productInStock = products.find(p => p.id === item.productId);
        if (!productInStock || productInStock.stock < item.quantity) {
            console.warn(`Stock insuficiente para el producto: ${item.productName}. Disponible: ${productInStock?.stock || 0}, Solicitado: ${item.quantity}`);
            return;
        }
    }

    const { subtotal, tax, total } = calculateTotals();

    const saleData: Venta = {
      clientId: formData.clientId,
      clientName: client.name,
      products: formData.products,
      subtotal,
      tax,
      total,
      status: 'Completada',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: formData.notes
    };

    try {
        // Actualiza el stock de los productos
        for (const item of formData.products) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const updatedProduct = {
                    ...product,
                    stock: product.stock - item.quantity,
                    updatedAt: new Date()
                };
                await productService.guardarProducto(updatedProduct);
            }
        }

        // Guarda la venta
        const savedSale = await saleService.guardarVenta(saleData);

        if (savedSale) {
            // Genera la boleta de venta PDF
            await UtilidadesExportacion.generarBoletaVentaPDF(savedSale, products, client);

            console.log('Venta completada y boleta generada exitosamente!');
            loadData();
            setShowForm(false);
            resetForm();
        } else {
            console.error('Error: No se pudo guardar la venta. Inténtelo de nuevo.');
        }
    } catch (error) {
        console.error('Error al completar la venta o generar boleta:', error);
        console.error('Hubo un error al procesar la venta. Verifique los datos, stock o la configuración del servidor.');
    }
  };

  // Maneja la eliminación de una venta
  const handleDelete = async (sale: Venta) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la venta #${sale.id}? Esta acción no revertirá el stock de productos.`);
    if (confirmDelete) {
      try {
        await saleService.borrarventa(sale.id!);
        loadData();
        console.log('Venta eliminada correctamente.');
      } catch (error) {
        console.error("Error al eliminar la venta:", error);
        console.error('Hubo un error al eliminar la venta.');
      }
    }
  };

  // Devuelve la clase CSS del badge según el estado de la venta
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completada': return 'bg-success';
      case 'Pendiente': return 'bg-warning';
      case 'Cancelada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Devuelve el texto legible del estado de la venta
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completada': return 'Completada';
      case 'Pendiente': return 'Pendiente';
      case 'Cancelada': return 'Cancelada';
      default: return status;
    }
  };

  // Calcula el tiempo transcurrido desde la fecha de la venta
  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const saleDate = typeof date === 'string' ? new Date(date) : date;

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

    return formatearFecha(saleDate);
  };

  // Maneja la cancelación del formulario
  const handleCancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  // Renderiza el formulario o la tabla de ventas
  if (showForm) {
    return (
      <SaleForm
        formData={formData}
        newItem={newItem}
        clients={clients}
        products={products}
        setFormData={setFormData}
        setNewItem={setNewItem}
        addProductToSale={addProductToSale}
        removeProductFromSale={removeProductFromSale}
        calculateTotals={calculateTotals}
        handleSubmit={handleSubmit}
        onCancel={handleCancelForm}
      />
    );
  }

  // Renderiza la tabla de ventas
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
                <tr key={sale.id || `temp-${index}`} className={index < 3 ? 'table-success' : ''}>
                  <td>
                    <div className="d-flex align-items-center">
                      <code>{sale.id || 'N/A'}</code>
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
                          console.log(`Detalles de venta:\n\nID Venta: ${sale.id || 'N/A'}\nCliente: ${sale.clientName}\nTotal: ${formatearMoneda(sale.total)}\nFecha: ${formatearFecha(sale.createdAt)}\n\nProductos:\n${(sale.products || []).map(p => `- ${p.productName} x${p.quantity} = ${formatearMoneda(p.total)}`).join('\n')}\n\nNotas: ${sale.notes || 'N/A'}`);
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
