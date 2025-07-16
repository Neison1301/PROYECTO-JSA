import * as XLSX from 'xlsx'; // Mantenemos la importación de XLSX
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Venta } from '../domain/Venta';
import { Cliente } from '../domain/Cliente';
import { Producto } from '../domain/Producto';
import { formatearMoneda, formatearFecha } from './index'; // Asegúrate de que la ruta sea correcta
import { Boleta } from '../domain/Boleta';

// Extiende el tipo jsPDF para incluir autoTable.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class UtilidadesExportacion {

  // Método estático para exportar datos a un archivo Excel.
  static exportarAExcel(datos: any[], nombreArchivo: string, nombreHoja: string = 'Datos'): void {
    try {
      const libro = XLSX.utils.book_new();
      const hoja = XLSX.utils.json_to_sheet(datos);

      XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);

      console.log(`✅ Archivo Excel exportado: ${nombreArchivo}.xlsx`);
    } catch (error) {
      console.error('❌ Error al exportar a Excel:', error);
      alert('Hubo un error al exportar a Excel. Consulte la consola para más detalles.');
      throw new Error('Error al exportar a Excel');
    }
  }

  // Método estático para exportar datos a un archivo PDF.
  static exportarAPDF(datos: any[], nombreArchivo: string, titulo: string, columnas: string[]): void {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text(titulo, 20, 20);

      doc.setFontSize(12);
      doc.text(`Fecha de generación: ${formatearFecha(new Date())}`, 20, 35);

      // Prepara los datos para la tabla PDF, formateando monedas y fechas.
      const datosTabla = datos.map(item =>
        columnas.map(col => {
          const valor = item[col];
          if (typeof valor === 'number' && (col.includes('price') || col.includes('total') || col.includes('subtotal') || col.includes('impuestos'))) {
            return formatearMoneda(valor);
          }
          if (valor instanceof Date) {
            return formatearFecha(valor);
          }
          return valor?.toString() || '';
        })
      );

      // Genera la tabla en el documento PDF.
      (doc as any).autoTable({
        head: [columnas.map(col => col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1'))],
        body: datosTabla,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [50, 50, 50],
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        tableWidth: 'auto',
      });

      doc.save(`${nombreArchivo}.pdf`);
      console.log(`✅ Archivo PDF exportado: ${nombreArchivo}.pdf`);
    } catch (error) {
      console.error('❌ Error al exportar a PDF:', error);
      alert('Hubo un error al exportar a PDF. Consulte la consola para más detalles.');
      throw new Error('Error al exportar a PDF');
    }
  }

  // Método estático para exportar un reporte de productos.
  static exportarReporteProductos(productos: Producto[], formato: 'excel' | 'pdf'): void {
    // Mapea los datos de los productos para la exportación.
    const datos = productos.map(producto => ({
      sku: producto.sku || 'N/A',
      nombre: producto.name,
      categoria: producto.category || 'Sin Categoría',
      precio: producto.price,
      stock: producto.stock,
      estado: producto.isActive ? 'Activo' : 'Inactivo',
      fechaCreacion: producto.createdAt ? formatearFecha(producto.createdAt) : 'N/A',
    }));

    const nombreArchivo = `reporte-productos-${new Date().toISOString().split('T')[0]}`;

    // Llama al método de exportación correspondiente según el formato.
    if (formato === 'excel') {
      this.exportarAExcel(datos, nombreArchivo, 'Productos');
    } else {
      this.exportarAPDF(
        datos,
        nombreArchivo,
        'Reporte de Productos',
        ['sku', 'nombre', 'categoria', 'precio', 'stock', 'estado', 'fechaCreacion']
      );
    }
  }
  // Método estático para exportar un reporte de clientes.
  static exportarReporteClientes(clientes: Cliente[], formato: 'excel' | 'pdf'): void {
    // Mapea los datos de los clientes para la exportación.
    const datos = clientes.map(cliente => ({
      nombre: cliente.name,
      email: cliente.email,
      telefono: cliente.phone || 'N/A',
      ciudad: (cliente as any).city || 'N/A',
      rfc: (cliente as any).taxId || 'N/A',
      estado: (cliente as any).isActive ? 'Activo' : 'Inactivo',
      fechaRegistro: cliente.createdAt ? formatearFecha(cliente.createdAt) : 'N/A',
    }));

    const nombreArchivo = `reporte-clientes-${new Date().toISOString().split('T')[0]}`;

    // Llama al método de exportación correspondiente según el formato.
    if (formato === 'excel') {
      this.exportarAExcel(datos, nombreArchivo, 'Clientes');
    } else {
      this.exportarAPDF(
        datos,
        nombreArchivo,
        'Reporte de Clientes',
        ['nombre', 'email', 'telefono', 'ciudad', 'rfc', 'estado', 'fechaRegistro']
      );
    }
  }

  // Método estático para exportar un reporte de ventas.
  static exportarReporteVentas(ventas: Venta[], formato: 'excel' | 'pdf'): void {
    // Mapea los datos de las ventas para la exportación.
    const datos = ventas.map(venta => ({
      id: venta.id || 'N/A',
      cliente: venta.clientName,
      productos: venta.products.length,
      subtotal: venta.subtotal,
      impuestos: venta.tax,
      total: venta.total,
      estado: venta.status,
      fecha: formatearFecha(venta.createdAt),
    }));

    const nombreArchivo = `reporte-ventas-${new Date().toISOString().split('T')[0]}`;

    // Llama al método de exportación correspondiente según el formato.
    if (formato === 'excel') {
      this.exportarAExcel(datos, nombreArchivo, 'Ventas');
    } else {
      this.exportarAPDF(
        datos,
        nombreArchivo,
        'Reporte de Ventas',
        ['id', 'cliente', 'productos', 'subtotal', 'impuestos', 'total', 'estado', 'fecha']
      );
    }
  }

  // Método estático para exportar un reporte completo del sistema.
  static exportarReporteCompleto(
    productos: Producto[],
    clientes: Cliente[],
    ventas: Venta[],
    formato: 'excel' | 'pdf'
  ): void {
    const nombreArchivo = `reporte-completo-${new Date().toISOString().split('T')[0]}`;

    if (formato === 'excel') {
      const libro = XLSX.utils.book_new();

      // Prepara y añade la hoja de productos.
      const datosProductos = productos.map(p => ({
        SKU: p.sku || 'N/A',
        Nombre: p.name,
        Categoría: p.category || 'Sin Categoría',
        Precio: p.price,
        Stock: p.stock,
        Estado: (p as any).isActive ? 'Activo' : 'Inactivo',
        'Fecha Creación': p.createdAt ? formatearFecha(p.createdAt) : 'N/A',
      }));
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosProductos), 'Productos');

      // Prepara y añade la hoja de clientes.
      const datosClientes = clientes.map(c => ({
        Nombre: c.name,
        Email: c.email,
        Teléfono: c.phone || 'N/A',
        Ciudad: (c as any).city || 'N/A',
        RFC: (c as any).taxId || 'N/A',
        Estado: (c as any).isActive ? 'Activo' : 'Inactivo',
        'Fecha Registro': c.createdAt ? formatearFecha(c.createdAt) : 'N/A',
      }));
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosClientes), 'Clientes');

      // Prepara y añade la hoja de ventas.
      const datosVentas = ventas.map(s => ({
        ID: s.id || 'N/A',
        Cliente: s.clientName,
        'Cantidad Productos': s.products.length,
        Subtotal: s.subtotal,
        Impuestos: s.tax,
        Total: s.total,
        Estado: s.status,
        Fecha: formatearFecha(s.createdAt),
      }));
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosVentas), 'Ventas');

      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
    } else {
      const doc = new jsPDF();

      // Añade título y resumen ejecutivo al PDF.
      doc.setFontSize(24);
      doc.text('Reporte Completo del Sistema', 20, 30);
      doc.setFontSize(14);
      doc.text(`Fecha de generación: ${formatearFecha(new Date())}`, 20, 45);

      doc.setFontSize(16);
      doc.text('Resumen Ejecutivo', 20, 65);
      doc.setFontSize(12);
      doc.text(`Total de Productos: ${productos.length}`, 20, 80);
      doc.text(`Total de Clientes: ${clientes.length}`, 20, 90);
      doc.text(`Total de Ventas: ${ventas.length}`, 20, 100);
      doc.text(`Ingresos Totales: ${formatearMoneda(ventas.reduce((sum, s) => sum + s.total, 0))}`, 20, 110);

      doc.addPage(); // Nueva página para el detalle de productos por categoría.

      doc.setFontSize(16);
      doc.text('Productos por Categoría', 20, 20);

      // Agrupa y prepara los datos de productos por categoría para la tabla.
      const categorias = [...new Set(productos.map(p => p.category || 'Sin Categoría'))];
      const datosCategoria = categorias.map(cat => {
        const productosCat = productos.filter(p => (p.category || 'Sin Categoría') === cat);
        return [
          cat,
          productosCat.length.toString(),
          productosCat.reduce((sum, p) => sum + p.stock, 0).toString(),
          formatearMoneda(productosCat.reduce((sum, p) => sum + (p.price * p.stock), 0))
        ];
      });

      // Genera la tabla de productos por categoría en el PDF.
      (doc as any).autoTable({
        head: [['Categoría', 'Productos', 'Stock Total', 'Valor Inventario']],
        body: datosCategoria,
        startY: 30,
        styles: { fontSize: 10, textColor: [50, 50, 50] },
        headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        tableWidth: 'auto',
      });

      doc.save(`${nombreArchivo}.pdf`);
    }

    console.log(`✅ Reporte completo exportado: ${nombreArchivo}`);
  }

  // Método estático para generar una boleta de venta en PDF.
  static generarBoletaVentaPDF(sale: Venta, products: Producto[], client: Cliente): void {
    // Instancia y utiliza la clase Boleta para generar el PDF.
    const boleta = new Boleta(sale, client, products);
    boleta.generarPDF();
  }
}