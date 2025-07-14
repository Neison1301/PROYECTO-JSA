import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CellHookData } from 'jspdf-autotable'; 
import { Product, Client, Sale } from '../types';
import { formatearMoneda, formatearFecha } from './index';

// Extiende el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Clase que proporciona utilidades para exportar datos.
export class UtilidadesExportacion {
  // Exporta datos a un archivo Excel.
  static exportarAExcel(datos: any[], nombreArchivo: string, nombreHoja: string = 'Datos'): void {
    try {
      // Crea un nuevo libro y hoja de trabajo.
      const libro = XLSX.utils.book_new();
      const hoja = XLSX.utils.json_to_sheet(datos);

      // Añade la hoja al libro.
      XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);

      // Genera y descarga el archivo Excel.
      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);

      console.log(`✅ Archivo Excel exportado: ${nombreArchivo}.xlsx`);
    } catch (error) {
      console.error('❌ Error al exportar a Excel:', error);
      throw new Error('Error al exportar a Excel');
    }
  }

  // Exporta datos a un archivo PDF.
  static exportarAPDF(datos: any[], nombreArchivo: string, titulo: string, columnas: string[]): void {
    try {
      const doc = new jsPDF();

      // Añade el título al documento.
      doc.setFontSize(20);
      doc.text(titulo, 20, 20);

      // Añade la fecha de generación.
      doc.setFontSize(12);
      doc.text(`Fecha de generación: ${formatearFecha(new Date())}`, 20, 35);

      // Prepara los datos para la tabla.
      const datosTabla = datos.map(item =>
        columnas.map(col => {
          const valor = item[col];
          // Formatea valores de moneda.
          if (typeof valor === 'number' && (col.includes('price') || col.includes('total'))) {
            return formatearMoneda(valor);
          }
          // Formatea fechas.
          if (valor instanceof Date) {
            return formatearFecha(valor);
          }
          return valor?.toString() || ''; // Convierte a string o cadena vacía.
        })
      );

      // Añade la tabla al documento.
      doc.autoTable({
        head: [columnas.map(col => col.charAt(0).toUpperCase() + col.slice(1))], // Encabezados de columna.
        body: datosTabla,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
      });

      // Guarda el archivo PDF.
      doc.save(`${nombreArchivo}.pdf`);

      console.log(`✅ Archivo PDF exportado: ${nombreArchivo}.pdf`);
    } catch (error) {
      console.error('❌ Error al exportar a PDF:', error);
      throw new Error('Error al exportar a PDF');
    }
  }

  // Exporta el reporte de productos.
  static exportarReporteProductos(productos: Product[], formato: 'excel' | 'pdf'): void {
    // Mapea los productos a un formato para el reporte.
    const datos = productos.map(producto => ({
      sku: producto.sku,
      nombre: producto.name,
      categoria: producto.category,
      precio: producto.price,
      stock: producto.stock,
      estado: producto.isActive ? 'Activo' : 'Inactivo',
      fechaCreacion: formatearFecha(producto.createdAt),
    }));

    // Define el nombre del archivo.
    const nombreArchivo = `reporte-productos-${new Date().toISOString().split('T')[0]}`;

    // Exporta según el formato solicitado.
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

  // Exporta el reporte de clientes.
  static exportarReporteClientes(clientes: Client[], formato: 'excel' | 'pdf'): void {
    // Mapea los clientes a un formato para el reporte.
    const datos = clientes.map(cliente => ({
      nombre: cliente.name,
      email: cliente.email,
      telefono: cliente.phone,
      ciudad: cliente.city,
      rfc: cliente.taxId,
      estado: cliente.isActive ? 'Activo' : 'Inactivo',
      fechaRegistro: formatearFecha(cliente.createdAt),
    }));

    // Define el nombre del archivo.
    const nombreArchivo = `reporte-clientes-${new Date().toISOString().split('T')[0]}`;

    // Exporta según el formato solicitado.
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

  // Exporta el reporte de ventas.
  static exportarReporteVentas(ventas: Sale[], formato: 'excel' | 'pdf'): void {
    // Mapea las ventas a un formato para el reporte.
    const datos = ventas.map(venta => ({
      id: venta.id,
      cliente: venta.clientName,
      productos: venta.products.length,
      subtotal: venta.subtotal,
      impuestos: venta.tax,
      total: venta.total,
      estado: venta.status === 'completed' ? 'Completada' :
        venta.status === 'pending' ? 'Pendiente' : 'Cancelada',
      fecha: formatearFecha(venta.createdAt),
    }));

    // Define el nombre del archivo.
    const nombreArchivo = `reporte-ventas-${new Date().toISOString().split('T')[0]}`;

    // Exporta según el formato solicitado.
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

  // Exporta un reporte completo con todos los datos.
  static exportarReporteCompleto(
    productos: Product[],
    clientes: Client[],
    ventas: Sale[],
    formato: 'excel' | 'pdf'
  ): void {
    // Define el nombre del archivo.
    const nombreArchivo = `reporte-completo-${new Date().toISOString().split('T')[0]}`;

    // Exporta a Excel con múltiples hojas.
    if (formato === 'excel') {
      // Crea un libro de trabajo con múltiples hojas.
      const libro = XLSX.utils.book_new();

      // Hoja de productos.
      const datosProductos = productos.map(p => ({
        SKU: p.sku,
        Nombre: p.name,
        Categoría: p.category,
        Precio: p.price,
        Stock: p.stock,
        Estado: p.isActive ? 'Activo' : 'Inactivo',
        'Fecha Creación': formatearFecha(p.createdAt),
      }));
      const hojaProductos = XLSX.utils.json_to_sheet(datosProductos);
      XLSX.utils.book_append_sheet(libro, hojaProductos, 'Productos');

      // Hoja de clientes.
      const datosClientes = clientes.map(c => ({
        Nombre: c.name,
        Email: c.email,
        Teléfono: c.phone,
        Ciudad: c.city,
        RFC: c.taxId,
        Estado: c.isActive ? 'Activo' : 'Inactivo',
        'Fecha Registro': formatearFecha(c.createdAt),
      }));
      const hojaClientes = XLSX.utils.json_to_sheet(datosClientes);
      XLSX.utils.book_append_sheet(libro, hojaClientes, 'Clientes');

      // Hoja de ventas.
      const datosVentas = ventas.map(s => ({
        ID: s.id,
        Cliente: s.clientName,
        'Productos': s.products.length,
        Subtotal: s.subtotal,
        Impuestos: s.tax,
        Total: s.total,
        Estado: s.status === 'completed' ? 'Completada' :
          s.status === 'pending' ? 'Pendiente' : 'Cancelada',
        Fecha: formatearFecha(s.createdAt),
      }));
      const hojaVentas = XLSX.utils.json_to_sheet(datosVentas);
      XLSX.utils.book_append_sheet(libro, hojaVentas, 'Ventas');

      // Guarda el libro de trabajo.
      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
    } else {
      // Crea un reporte PDF completo.
      const doc = new jsPDF();

      // Página de título.
      doc.setFontSize(24);
      doc.text('Reporte Completo del Sistema', 20, 30);
      doc.setFontSize(14);
      doc.text(`Fecha de generación: ${formatearFecha(new Date())}`, 20, 45);

      // Resumen ejecutivo.
      doc.setFontSize(16);
      doc.text('Resumen Ejecutivo', 20, 65);
      doc.setFontSize(12);
      doc.text(`Total de Productos: ${productos.length}`, 20, 80);
      doc.text(`Total de Clientes: ${clientes.length}`, 20, 90);
      doc.text(`Total de Ventas: ${ventas.length}`, 20, 100);
      doc.text(`Ingresos Totales: ${formatearMoneda(ventas.reduce((sum, s) => sum + s.total, 0))}`, 20, 110);

      // Añade una nueva página para los datos detallados.
      doc.addPage();

      // Tabla resumen de productos por categoría.
      doc.setFontSize(16);
      doc.text('Productos por Categoría', 20, 20);

      // Calcula datos por categoría.
      const categorias = [...new Set(productos.map(p => p.category))];
      const datosCategoria = categorias.map(cat => {
        const productosCat = productos.filter(p => p.category === cat);
        return [
          cat,
          productosCat.length.toString(),
          productosCat.reduce((sum, p) => sum + p.stock, 0).toString(),
          formatearMoneda(productosCat.reduce((sum, p) => sum + (p.price * p.stock), 0))
        ];
      });

      doc.autoTable({
        head: [['Categoría', 'Productos', 'Stock Total', 'Valor Inventario']],
        body: datosCategoria,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [102, 126, 234] },
      });

      doc.save(`${nombreArchivo}.pdf`); // Guarda el PDF.
    }

    console.log(`✅ Reporte completo exportado: ${nombreArchivo}`);
  }




  // NUEVO MÉTODO: Generar Boleta de Venta en PDF
  static generarBoletaVentaPDF(sale: Sale, products: Product[], client: Client): void {
    try {
      const doc = new jsPDF();

      const primaryColor: [number, number, number] = [40, 40, 40];
      const accentColor: [number, number, number] = [102, 126, 234]; 
      const headerBg: [number, number, number] = [240, 240, 240]; 

        const whiteColor: number = 255;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('BOLETA DE VENTA', 105, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('TechNova S.A.C.', 14, 30);
      doc.text('RUC: 20548948992', 14, 35);
      doc.text('Dirección: CAL. NAVARRA URB. HIGUERETA NRO. 178 , SANTIAGO DE SURCO, LIMA', 14, 40);
      doc.text('Teléfono: (01) 123-4567 | Email: TechNova@gmail.com', 14, 45);

      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.3);
      doc.line(14, 50, 196, 50);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Boleta N°: ${sale.id.slice(0, 8).toUpperCase()}`, 14, 60);
      doc.text(`Fecha: ${formatearFecha(sale.createdAt)}`, 14, 66);
      doc.text(`Estado: ${sale.status === 'completed' ? 'Completada' : 'Pendiente'}`, 14, 72);

      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${client.name}`, 14, 80);
      doc.text(`Email: ${client.email}`, 14, 86);
      doc.text(`Teléfono: ${client.phone || 'N/A'}`, 14, 92);
      
      doc.line(14, 98, 196, 98);
///estooooooooooooooooooooooooooo
      const tableColumn = ["Descripción", "Cantidad", "P. Unit.", "Total"];
      const tableRows: any[] = [];

      sale.products.forEach(item => {
          const productInfo = products.find(p => p.id === item.productId);
          const description = productInfo ? productInfo.name : item.productName;
          tableRows.push([
              description,
              item.quantity.toString(),
              formatearMoneda(item.price),
              formatearMoneda(item.total)
          ]);
      });

      (doc as any).autoTable({
          startY: 105,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: {
              fillColor: accentColor,
              textColor: whiteColor,
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'center'
          },
          styles: {
              fontSize: 9,
              cellPadding: 3,
              textColor: primaryColor,
          },
          columnStyles: {
              0: { cellWidth: 80, halign: 'left' },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 30, halign: 'right' },
              3: { cellWidth: 30, halign: 'right' }
          },
          foot: [
              ['', '', 'Subtotal:', formatearMoneda(sale.subtotal)],
              ['', '', 'IVA (18%):', formatearMoneda(sale.tax)],
              ['', '', 'TOTAL A PAGAR:', formatearMoneda(sale.total)]
          ],
          footStyles: {
              fontStyle: 'bold',
              fillColor: headerBg,
              halign: 'right',
              fontSize: 10,
              textColor: primaryColor
          },
          didParseCell: function (data: CellHookData) {
            if (data.section === 'foot' && data.row.index === 2) {
                data.cell.styles.fillColor = accentColor;
                data.cell.styles.textColor = whiteColor;
            }
          }
      });

      if (sale.notes) {
          const finalY = (doc as any).autoTable.previous.finalY;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Notas:', 14, finalY + 10);
          doc.setFont('helvetica', 'normal');
          const splitNotes = doc.splitTextToSize(sale.notes, 180);
          doc.text(splitNotes, 14, finalY + 15);
      }
      
      const finalY = (doc as any).autoTable.previous.finalY;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('¡Gracias por su compra!', 105, finalY + 40, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Esperamos verte de nuevo pronto.', 105, finalY + 46, { align: 'center' });

      doc.save(`boleta_venta_${sale.id.slice(0, 8)}.pdf`);

    } catch (error) {
      throw new Error('Error al generar la boleta de venta');
    }
  }
}


