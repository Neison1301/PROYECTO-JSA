import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CellHookData } from 'jspdf-autotable'; 
import { Venta } from '../domain/Venta';
import { Cliente } from '../domain/Cliente';
import { Producto } from '../domain/Producto';
import { formatearMoneda, formatearFecha } from './index'; // Asegúrate de que la ruta sea correcta

// Extiende el tipo jsPDF para incluir autoTable.
// Esto es necesario para que TypeScript reconozca el método .autoTable() en la instancia de jsPDF.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Clase que proporciona utilidades para exportar datos a diferentes formatos (Excel, PDF).
export class UtilidadesExportacion {

  /**
   * Exporta un array de objetos a un archivo Excel (.xlsx).
   * @param datos Array de objetos a exportar.
   * @param nombreArchivo Nombre base del archivo Excel (sin extensión).
   * @param nombreHoja Nombre de la hoja dentro del libro de Excel.
   */
  static exportarAExcel(datos: any[], nombreArchivo: string, nombreHoja: string = 'Datos'): void {
    try {
      const libro = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo.
      const hoja = XLSX.utils.json_to_sheet(datos); // Convierte el array de objetos a una hoja de trabajo.

      XLSX.utils.book_append_sheet(libro, hoja, nombreHoja); // Añade la hoja al libro.
      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`); // Genera y descarga el archivo Excel.

      console.log(`✅ Archivo Excel exportado: ${nombreArchivo}.xlsx`);
    } catch (error) {
      console.error('❌ Error al exportar a Excel:', error);
      alert('Hubo un error al exportar a Excel. Consulte la consola para más detalles.');
      throw new Error('Error al exportar a Excel');
    }
  }

  /**
   * Exporta un array de objetos a un archivo PDF con formato de tabla.
   * @param datos Array de objetos a exportar.
   * @param nombreArchivo Nombre base del archivo PDF (sin extensión).
   * @param titulo Título del documento PDF.
   * @param columnas Array de strings con los nombres de las propiedades a usar como columnas.
   */
  static exportarAPDF(datos: any[], nombreArchivo: string, titulo: string, columnas: string[]): void {
    try {
      const doc = new jsPDF(); // Crea una nueva instancia de jsPDF.

      // Añade el título al documento.
      doc.setFontSize(20);
      doc.text(titulo, 20, 20);

      // Añade la fecha de generación.
      doc.setFontSize(12);
      doc.text(`Fecha de generación: ${formatearFecha(new Date())}`, 20, 35);

      // Prepara los datos para la tabla, mapeando las columnas y formateando si es necesario.
      const datosTabla = datos.map(item =>
        columnas.map(col => {
          const valor = item[col];
          // Formatea valores de moneda.
          if (typeof valor === 'number' && (col.includes('price') || col.includes('total') || col.includes('subtotal') || col.includes('impuestos'))) {
            return formatearMoneda(valor);
          }
          // Formatea fechas si son instancias de Date.
          if (valor instanceof Date) {
            return formatearFecha(valor);
          }
          // Intenta convertir a string o usa cadena vacía si es null/undefined.
          return valor?.toString() || ''; 
        })
      );

      // Añade la tabla al documento usando jspdf-autotable.
      (doc as any).autoTable({
        head: [columnas.map(col => col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1'))], // Encabezados de columna con formato legible.
        body: datosTabla,
        startY: 45, // Posición inicial Y para la tabla.
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [50, 50, 50], // Color de texto general.
        },
        headStyles: {
          fillColor: [102, 126, 234], // Color de fondo del encabezado.
          textColor: 255, // Texto blanco para el encabezado.
          fontStyle: 'bold',
          halign: 'center', // Alineación del texto en el encabezado.
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250], // Color para filas alternas.
        },
        margin: { top: 10, right: 10, bottom: 10, left: 10 }, // Márgenes del documento para la tabla.
        // `tableWidth: 'auto'` es generalmente lo mejor para que se ajuste.
        // También se puede especificar un ancho fijo: `tableWidth: 190` (para A4 con 10mm márgenes)
        // O `tableWidth: 'wrap'` si las columnas tienen anchos fijos y la tabla es más pequeña.
        tableWidth: 'auto', 
      });

      doc.save(`${nombreArchivo}.pdf`); // Guarda el archivo PDF.
      console.log(`✅ Archivo PDF exportado: ${nombreArchivo}.pdf`);
    } catch (error) {
      console.error('❌ Error al exportar a PDF:', error);
      alert('Hubo un error al exportar a PDF. Consulte la consola para más detalles.');
      throw new Error('Error al exportar a PDF');
    }
  }

  /**
   * Exporta un reporte de productos en el formato especificado.
   * @param productos Array de objetos Product.
   * @param formato 'excel' o 'pdf'.
   */
  static exportarReporteProductos(productos: Producto[], formato: 'excel' | 'pdf'): void {
    const datos = productos.map(producto => ({
      sku: producto.sku || 'N/A', // Aseguramos que SKU siempre tenga un valor
      nombre: producto.name,
      categoria: producto.category || 'Sin Categoría',
      precio: producto.price,
      stock: producto.stock,
      estado: producto.isActive ? 'Activo' : 'Inactivo',
      fechaCreacion: producto.createdAt ? formatearFecha(producto.createdAt) : 'N/A',
    }));

    const nombreArchivo = `reporte-productos-${new Date().toISOString().split('T')[0]}`;

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

  /**
   * Exporta un reporte de clientes en el formato especificado.
   * @param clientes Array de objetos Client.
   * @param formato 'excel' o 'pdf'.
   */
  static exportarReporteClientes(clientes: Cliente[], formato: 'excel' | 'pdf'): void {
    const datos = clientes.map(cliente => ({
      nombre: cliente.name,
      email: cliente.email,
      telefono: cliente.phone || 'N/A',
      ciudad: (cliente as any).city || 'N/A', // Asumiendo 'city' podría no estar en types.ts Client
      rfc: (cliente as any).taxId || 'N/A',   // Asumiendo 'taxId' podría no estar en types.ts Client
      estado: (cliente as any).isActive ? 'Activo' : 'Inactivo', // Asumiendo 'isActive' podría no estar en types.ts Client
      fechaRegistro: cliente.createdAt ? formatearFecha(cliente.createdAt) : 'N/A',
    }));

    const nombreArchivo = `reporte-clientes-${new Date().toISOString().split('T')[0]}`;

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

  /**
   * Exporta un reporte de ventas en el formato especificado.
   * @param ventas Array de objetos Venta.
   * @param formato 'excel' o 'pdf'.
   */
  static exportarReporteVentas(ventas: Venta[], formato: 'excel' | 'pdf'): void {
    const datos = ventas.map(venta => ({
      id: venta.id || 'N/A',
      cliente: venta.clientName,
      productos: venta.products.length,
      subtotal: venta.subtotal,
      impuestos: venta.tax,
      total: venta.total,
      estado: venta.status, // Ya tiene el valor correcto 'Completada', 'Pendiente', 'Cancelada'
      fecha: formatearFecha(venta.createdAt),
    }));

    const nombreArchivo = `reporte-ventas-${new Date().toISOString().split('T')[0]}`;

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

  /**
   * Exporta un reporte completo del sistema (productos, clientes, ventas) en el formato especificado.
   * @param productos Array de objetos Product.
   * @param clientes Array de objetos Client.
   * @param ventas Array de objetos Venta.
   * @param formato 'excel' o 'pdf'.
   */
  static exportarReporteCompleto(
    productos: Producto[],
    clientes: Cliente[],
    ventas: Venta[],
    formato: 'excel' | 'pdf'
  ): void {
    const nombreArchivo = `reporte-completo-${new Date().toISOString().split('T')[0]}`;

    if (formato === 'excel') {
      const libro = XLSX.utils.book_new();

      // Hoja de productos.
      const datosProductos = productos.map(p => ({
        SKU: p.sku || 'N/A',
        Nombre: p.name,
        Categoría: p.category || 'Sin Categoría',
        Precio: p.price,
        Stock: p.stock,
        Estado: (p as any).isActive ? 'Activo' : 'Inactivo', // Asegurar acceso a 'isActive'
        'Fecha Creación': p.createdAt ? formatearFecha(p.createdAt) : 'N/A',
      }));
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosProductos), 'Productos');

      // Hoja de clientes.
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

      // Hoja de ventas.
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

      // Sección de título y resumen.
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

  /**
   * Genera una boleta de venta detallada en formato PDF.
   * @param sale Objeto Venta completo.
   * @param products Array de todos los productos (necesario para obtener nombres).
   * @param client Objeto Client del cliente de la venta.
   */
  static generarBoletaVentaPDF(sale: Venta, products: Producto[], client: Cliente): void {
    try {
      const doc = new jsPDF();

      const primaryColor: [number, number, number] = [40, 40, 40]; // Color principal (texto, líneas)
      const accentColor: [number, number, number] = [102, 126, 234]; // Color de acento (títulos, encabezados de tabla)
      const headerBg: [number, number, number] = [240, 240, 240]; // Fondo claro para secciones.
      const whiteColor: number = 255;

      // --- Encabezado de la Boleta ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('BOLETA DE VENTA', 105, 20, { align: 'center' });

      // Información de la empresa
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('TechNova S.A.C.', 14, 30);
      doc.text('RUC: 20548948992', 14, 35);
      doc.text('Dirección: CAL. NAVARRA URB. HIGUERETA NRO. 178 , SANTIAGO DE SURCO, LIMA', 14, 40);
      doc.text('Teléfono: (01) 123-4567 | Email: TechNova@gmail.com', 14, 45);

      // Línea separadora
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.3);
      doc.line(14, 50, 196, 50);

      // --- Detalles de la Venta y Cliente ---
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Boleta N°: ${sale.id?.slice(0, 8).toUpperCase() || 'N/A'}`, 14, 60);
      doc.text(`Fecha: ${formatearFecha(sale.createdAt)}`, 14, 66);
      doc.text(`Estado: ${sale.status === 'Completada' ? 'Completada' : 'Pendiente'}`, 14, 72);

      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${client.name}`, 14, 80);
      doc.text(`Email: ${client.email}`, 14, 86);
      doc.text(`Teléfono: ${client.phone || 'N/A'}`, 14, 92);
      
      doc.line(14, 98, 196, 98); // Línea después de datos del cliente

      // --- Tabla de Productos de la Venta ---
      const tableColumn = ["Descripción", "Cantidad", "P. Unit.", "Total"];
      const tableRows: any[] = [];

      sale.products.forEach(item => {
          const productInfo = products.find(p => p.id === item.productId);
          const description = productInfo ? productInfo.name : item.productName; // Usar el nombre del producto de la lista general si está disponible
          tableRows.push([
              description,
              item.quantity.toString(),
              formatearMoneda(item.price),
              formatearMoneda(item.total)
          ]);
      });

      // Configuración de la tabla con jspdf-autotable
      (doc as any).autoTable({
          startY: 105, // Comienza la tabla debajo de la información del cliente
          head: [tableColumn],
          body: tableRows,
          theme: 'striped', // Estilo de tabla a rayas
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
              // Ajuste de anchos de columna para que sumen un valor que se ajuste a la página (aprox. 190mm de ancho útil)
              // Total de 180mm. 
              0: { cellWidth: 90, halign: 'left', overflow: 'linebreak' }, // Descripción: más ancho, permite salto de línea
              1: { cellWidth: 20, halign: 'center' },                      // Cantidad: Ancho fijo, centrado
              2: { cellWidth: 35, halign: 'right' },                       // P. Unit.: Ancho fijo, alineado a la derecha
              3: { cellWidth: 35, halign: 'right' }                        // Total: Ancho fijo, alineado a la derecha
          },
          foot: [
              ['', '', 'Subtotal:', formatearMoneda(sale.subtotal)],
              ['', '', 'IVA (18%):', formatearMoneda(sale.tax)],
              ['', '', 'TOTAL A PAGAR:', formatearMoneda(sale.total)]
          ],
          footStyles: {
              fontStyle: 'bold',
              fillColor: headerBg, // Fondo gris claro para el pie de tabla
              halign: 'right',
              fontSize: 10,
              textColor: primaryColor
          },
          // Hook para aplicar estilos condicionales (ej. el total final)
          didParseCell: function (data: CellHookData) {
              if (data.section === 'foot' && data.row.index === 2) { // Última fila del pie (TOTAL A PAGAR)
                  (data.cell.styles as any).fillColor = accentColor;
                  (data.cell.styles as any).textColor = whiteColor;
              }
          },
          margin: { left: 14, right: 14 }, // Márgenes para la tabla
          tableWidth: 'auto', // Permite que la tabla se ajuste al ancho disponible
      });

      // --- Notas Adicionales ---
      let finalY = (doc as any).autoTable.previous.finalY; // Obtener la posición Y final de la tabla
      
      if (sale.notes) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Notas:', 14, finalY + 10);
          doc.setFont('helvetica', 'normal');
          // `splitTextToSize` para manejar notas largas
          const splitNotes = doc.splitTextToSize(sale.notes, 180); // 180mm de ancho para las notas
          doc.text(splitNotes, 14, finalY + 15);
          finalY += splitNotes.length * 5 + 10; // Ajustar finalY para el espacio de las notas
      }
      
      // --- Pie de Página de la Boleta ---
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('¡Gracias por su compra!', 105, finalY + 40, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Esperamos verte de nuevo pronto.', 105, finalY + 46, { align: 'center' });

      // Guarda el PDF con el ID de la venta (cortado y con fallback)
      doc.save(`boleta_venta_${sale.id?.slice(0, 8) || 'sin-id'}.pdf`);

      console.log(`✅ Boleta de venta generada: boleta_venta_${sale.id?.slice(0, 8) || 'sin-id'}.pdf`);
    } catch (error) {
      console.error('❌ Error al generar la boleta de venta:', error);
      alert('Hubo un error al generar la boleta de venta. Consulte la consola para más detalles.');
      throw new Error('Error al generar la boleta de venta');
    }
  }
}