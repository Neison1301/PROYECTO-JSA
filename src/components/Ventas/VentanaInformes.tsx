import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UtilidadesExportacion } from '../../utils/exportUtils';
import { formatearMoneda, formatearFecha } from '../../utils'; // Importaciones corregidas
import { BarChart3, TrendingUp, Calendar, DollarSign, Package, Users, ShoppingCart, AlertTriangle, Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import 'jspdf-autotable';
import { productService } from '../../services/servicioProducto';
import { clientService } from '../../services/servicioCliente';
import { saleService } from '../../services/servicioVenta';
import { boletaService } from '../../services/servicioBoleta';

// Extender el tipo de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface ReportData {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  totalClients: number;
  lowStockProducts: LowStockProduct[];
  topProducts: ProductSales[];
  recentSales: any[];
  monthlyRevenue: number;
  averageOrderValue: number;
}

const ReportsWindow: React.FC = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalClients: 0,
    lowStockProducts: [],
    topProducts: [],
    recentSales: [],
    monthlyRevenue: 0,
    averageOrderValue: 0
  });
  const [isExporting, setIsExporting] = useState(false);

  // Verificar si el usuario es empleado, auxiliar o administrador
  const isEmployeeOrAuxiliar = user?.role === 'empleado' 
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Si el usuario no tiene permisos para ver ningún reporte, no intentes generarlos
    if (!isEmployeeOrAuxiliar && !isAdmin) {
      return;
    }
    generateReports();
  }, [user?.role]); // Regenerar reportes si el rol del usuario cambia

  const generateReports = async () => {
    try {
      // Obtenemos los datos de forma asíncrona, usando Promise.all para eficiencia
      const [products, clients, sales] = await Promise.all([
        productService.getProducts(),
        clientService.getClients(),
        saleService.getSales()
      ]);

      // Estadísticas básicas
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalProducts = products.length;
      const totalClients = clients.length;

      // Productos con stock bajo (menos de 10 unidades)
      const lowStockProducts: LowStockProduct[] = products
        .filter(product => product.stock < 10)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)
        .map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.stock
        }));

      // Productos más vendidos
      const productSalesMap: { [key: string]: ProductSales } = {};

      sales.forEach(sale => {
        sale.products.forEach(item => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSalesMap[item.productId].quantity += item.quantity;
          productSalesMap[item.productId].revenue += item.total;
        });
      });

      const topProducts: ProductSales[] = Object.values(productSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Ventas recientes (las 10 más recientes)
      const recentSales = sales
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      // Ingresos del mes actual
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = sales
        .filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        })
        .reduce((sum, sale) => sum + sale.total, 0);

      // Valor promedio del pedido
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      setReportData({
        totalSales,
        totalRevenue,
        totalProducts,
        totalClients,
        lowStockProducts,
        topProducts,
        recentSales,
        monthlyRevenue,
        averageOrderValue
      });
    } catch (error) {
      console.error('Error al generar los reportes:', error);
      // Opcional: mostrar un mensaje al usuario
    }
  };

  const handleExport = async (type: 'products' | 'clients' | 'sales' | 'complete', format: 'excel' | 'pdf') => {
    setIsExporting(true);

    try {
      // Obtenemos los datos de forma asíncrona para la exportación
      const [products, clients, sales] = await Promise.all([
         productService.getProducts(),
        clientService.getClients(),
        saleService.getSales()
      ]);

      switch (type) {
        case 'products':
          UtilidadesExportacion.exportarReporteProductos(products, format);
          break;
        case 'clients':
          UtilidadesExportacion.exportarReporteClientes(clients, format);
          break;
        case 'sales':
          UtilidadesExportacion.exportarReporteVentas(sales, format);
          break;
        case 'complete':
          UtilidadesExportacion.exportarReporteCompleto(products, clients, sales, format);
          break;
      }

      const formatName = format === 'excel' ? 'Excel' : 'PDF';
      const typeName = type === 'complete' ? 'completo' :
                       type === 'products' ? 'de productos' :
                       type === 'clients' ? 'de clientes' : 'de ventas';

      alert(`✅ Reporte ${typeName} exportado exitosamente en formato ${formatName}`);

    } catch (error) {
      console.error('Error al exportar el reporte:', error);
      alert('❌ Error al exportar el reporte. Por favor, intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

//  FUNCIoN para generar boleta desde reports
  const handleGenerateReceipt = async (sale: any) => {
    try {
      // Necesitamos cargar los datos de productos y clientes para la boleta
      const products = await productService.getProducts();
      const clients = await clientService.getClients();

        //  Buscar el cliente específico de la venta dentro del array 'allClients'
      const clientForSale = clients.find(c => c.id === sale.clientId);

      if (!clientForSale) {
        alert('No se pudo encontrar la información del cliente para esta venta.');
        return;
      }
      await boletaService.generarBoletaPDF(sale, clientForSale, products);
      alert(`Boleta para venta #${sale.id} generada exitosamente.`);
    } catch (error) {
      console.error('Error al generar la boleta desde reportes:', error);
      alert('Hubo un error al generar la boleta. Verifique que la venta sea válida.');
    }
  };

  // Renderizado condicional basado en el rol del usuario
  if (isEmployeeOrAuxiliar) {
    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>
            <BarChart3 className="me-2" />
            Reportes - Vista Empleado
          </h4>
          <span className="badge bg-info">
            <Users size={16} className="me-1" />
            Acceso Limitado
          </span>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-warning text-white">
                <h6 className="mb-0">
                  <AlertTriangle className="me-2" size={18} />
                  Productos con Stock Bajo
                </h6>
              </div>
              <div className="card-body">
                {reportData.lowStockProducts.length === 0 ? (
                  <p className="text-muted text-center">¡Todos los productos tienen stock suficiente!</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {reportData.lowStockProducts.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">{product.sku}</small>
                        </div>
                        <span className={`badge ${product.stock === 0 ? 'bg-danger' : 'bg-warning'}`}>
                          {product.stock} unidades
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0">
                  <TrendingUp className="me-2" size={18} />
                  Productos Más Vendidos
                </h6>
              </div>
              <div className="card-body">
                {reportData.topProducts.length === 0 ? (
                  <p className="text-muted text-center">No hay datos de ventas disponibles</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {reportData.topProducts.map((product, index) => (
                      <div key={`${product.name}-${index}`} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <span className="badge bg-primary me-2">{index + 1}</span>
                          <strong>{product.name}</strong>
                        </div>
                        <div className="text-end">
                          <div><strong>{product.quantity} vendidos</strong></div>
                          <small className="text-muted">{formatearMoneda(product.revenue)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">
                  <Calendar className="me-2" size={18} />
                  Ventas Recientes
                  <span className="badge bg-light text-dark ms-2">Generar Boletas</span>
                </h6>
              </div>
              <div className="card-body">
                {reportData.recentSales.length === 0 ? (
                  <p className="text-muted text-center">No hay ventas recientes</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {reportData.recentSales.slice(0, 8).map((sale, index) => (
                      <div key={sale.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{sale.clientName}</strong>
                            <br />
                            <small className="text-muted">
                              {sale.products.length} producto(s) - {formatearFecha(sale.createdAt)}
                            </small>
                          </div>
                          <div className="text-end">
                            <div><strong>{formatearMoneda(sale.total)}</strong></div>
                            <button
                              className="btn btn-sm btn-primary mt-1"
                              onClick={() => handleGenerateReceipt(sale)}
                              title="Generar boleta PDF"
                            >
                              <FileDown size={14} className="me-1" />
                              Generar Boleta
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista para ADMINISTRADOR (completa)
  if (isAdmin) {
    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>
            <BarChart3 className="me-2" />
            Reportes y Análisis
          </h4>
          <button className="btn btn-outline-primary" onClick={generateReports}>
            <TrendingUp size={18} className="me-2" />
            Actualizar Reportes
          </button>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="text-primary mb-2">
                  <DollarSign size={32} />
                </div>
                <h5 className="card-title">{formatearMoneda(reportData.totalRevenue)}</h5>
                <p className="card-text text-muted">Ingresos Totales</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="text-success mb-2">
                  <ShoppingCart size={32} />
                </div>
                <h5 className="card-title">{reportData.totalSales}</h5>
                <p className="card-text text-muted">Ventas Totales</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="text-warning mb-2">
                  <Package size={32} />
                </div>
                <h5 className="card-title">{reportData.totalProducts}</h5>
                <p className="card-text text-muted">Productos</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="text-info mb-2">
                  <Users size={32} />
                </div>
                <h5 className="card-title">{reportData.totalClients}</h5>
                <p className="card-text text-muted">Clientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rendimiento Mensual */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0">
                  <Calendar className="me-2" size={18} />
                  Rendimiento del Mes
                </h6>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-6">
                    <h4 className="text-primary">{formatearMoneda(reportData.monthlyRevenue)}</h4>
                    <p className="text-muted mb-0">Ingresos del Mes</p>
                  </div>
                  <div className="col-6">
                    <h4 className="text-success">{formatearMoneda(reportData.averageOrderValue)}</h4>
                    <p className="text-muted mb-0">Ticket Promedio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reportes de Productos y Ventas */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-warning text-white">
                <h6 className="mb-0">
                  <AlertTriangle className="me-2" size={18} />
                  Productos con Stock Bajo
                </h6>
              </div>
              <div className="card-body">
                {reportData.lowStockProducts.length === 0 ? (
                  <p className="text-muted text-center">¡Todos los productos tienen stock suficiente!</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {reportData.lowStockProducts.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">{product.sku}</small>
                        </div>
                        <span className={`badge ${product.stock === 0 ? 'bg-danger' : 'bg-warning'}`}>
                          {product.stock} unidades
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0">
                  <TrendingUp className="me-2" size={18} />
                  Productos Más Vendidos
                </h6>
              </div>
              <div className="card-body">
                {reportData.topProducts.length === 0 ? (
                  <p className="text-muted text-center">No hay datos de ventas disponibles</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {reportData.topProducts.map((product, index) => (
                      <div key={`${product.name}-${index}`} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <span className="badge bg-primary me-2">{index + 1}</span>
                          <strong>{product.name}</strong>
                        </div>
                        <div className="text-end">
                          <div><strong>{product.quantity} vendidos</strong></div>
                          <small className="text-muted">{formatearMoneda(product.revenue)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ventas Recientes con Botón de Boleta */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">
                  <Calendar className="me-2" size={18} />
                  Ventas Recientes
                </h6>
              </div>
              <div className="card-body">
                {reportData.recentSales.length === 0 ? (
                  <p className="text-muted text-center">No hay ventas recientes</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {reportData.recentSales.slice(0, 8).map((sale, index) => (
                      <div key={sale.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{sale.clientName}</strong>
                            <br />
                            <small className="text-muted">
                              {sale.products.length} producto(s)
                            </small>
                          </div>
                          <div className="text-end">
                            <div><strong>{formatearMoneda(sale.total)}</strong></div>
                            <small className="text-muted">{formatearFecha(sale.createdAt)}</small>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary ms-2"
                            onClick={() => handleGenerateReceipt(sale)}
                            title="Generar boleta PDF"
                          >
                            <FileDown size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones de Exportación */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">
              <Download className="me-2" size={18} />
              Exportar Reportes
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <p className="text-muted mb-3">
                  Genera reportes detallados para análisis financiero y de inventario.
                  Los reportes incluyen datos de ventas, productos más vendidos, y análisis de clientes.
                </p>

                <div className="row g-3">
                  {/* Reporte de Productos */}
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body text-center">
                        <Package className="text-primary mb-2" size={32} />
                        <h6>Reporte de Productos</h6>
                        <div className="btn-group w-100" role="group">
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleExport('products', 'excel')}
                            disabled={isExporting}
                          >
                            <FileSpreadsheet size={16} className="me-1" />
                            Excel
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleExport('products', 'pdf')}
                            disabled={isExporting}
                          >
                            <FileText size={16} className="me-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reporte de Clientes */}
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body text-center">
                        <Users className="text-success mb-2" size={32} />
                        <h6>Reporte de Clientes</h6>
                        <div className="btn-group w-100" role="group">
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleExport('clients', 'excel')}
                            disabled={isExporting}
                          >
                            <FileSpreadsheet size={16} className="me-1" />
                            Excel
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleExport('clients', 'pdf')}
                            disabled={isExporting}
                          >
                            <FileText size={16} className="me-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reporte de Ventas */}
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body text-center">
                        <ShoppingCart className="text-warning mb-2" size={32} />
                        <h6>Reporte de Ventas</h6>
                        <div className="btn-group w-100" role="group">
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleExport('sales', 'excel')}
                            disabled={isExporting}
                          >
                            <FileSpreadsheet size={16} className="me-1" />
                            Excel
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleExport('sales', 'pdf')}
                            disabled={isExporting}
                          >
                            <FileText size={16} className="me-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reporte Completo */}
                  <div className="col-md-6">
                    <div className="card border border-primary">
                      <div className="card-body text-center">
                        <BarChart3 className="text-info mb-2" size={32} />
                        <h6>Reporte Completo</h6>
                        <div className="btn-group w-100" role="group">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleExport('complete', 'excel')}
                            disabled={isExporting}
                          >
                            <FileSpreadsheet size={16} className="me-1" />
                            Excel
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleExport('complete', 'pdf')}
                            disabled={isExporting}
                          >
                            <FileText size={16} className="me-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">
                      <TrendingUp className="me-2" size={18} />
                      Estado de Exportación
                    </h6>
                    {isExporting ? (
                      <div className="text-center">
                        <div className="spinner-border text-primary mb-2" role="status">
                          <span className="visually-hidden">Exportando...</span>
                        </div>
                        <p className="text-muted">Generando reporte...</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted small">
                          ✅ Sistema listo para exportar<br />
                          📊 {reportData.totalProducts} productos<br />
                          👥 {reportData.totalClients} clientes<br />
                          💰 {reportData.totalSales} ventas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene rol o no tiene permisos, muestra un mensaje de acceso denegado
  return (
    <div className="fade-in text-center p-5">
      <h4 className="text-danger mb-3">Acceso Denegado</h4>
      <p className="text-muted">No tienes los permisos necesarios para ver esta sección de reportes.</p>
    </div>
  );
};

export default ReportsWindow;