import jsPDF from 'jspdf';
import { CellHookData } from 'jspdf-autotable';
import { formatearFecha, formatearMoneda } from '../utils';
import { Cliente } from './Cliente';
import { Producto } from './Producto';
import { Venta } from './Venta';


export class Boleta {
  private venta: Venta;
  private cliente: Cliente;
  private productosDisponibles: Producto[];

  constructor(venta: Venta, cliente: Cliente, productosDisponibles: Producto[]) {
    this.venta = venta;
    this.cliente = cliente;
    this.productosDisponibles = productosDisponibles;
  }

  public generarPDF(): void {
    try {
      const doc = new jsPDF();

      const primaryColor: [number, number, number] = [40, 40, 40];
      const accentColor: [number, number, number] = [102, 126, 234];
      const headerBg: [number, number, number] = [240, 240, 240];
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
      doc.text(`Boleta N°: ${this.venta.id?.slice(0, 8).toUpperCase() || 'N/A'}`, 14, 60);
      doc.text(`Fecha: ${formatearFecha(this.venta.createdAt)}`, 14, 66);
      doc.text(`Estado: ${this.venta.status === 'Completada' ? 'Completada' : 'Pendiente'}`, 14, 72);

      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${this.cliente.name}`, 14, 80);
      doc.text(`Email: ${this.cliente.email}`, 14, 86);
      doc.text(`Teléfono: ${this.cliente.phone || 'N/A'}`, 14, 92);

      doc.line(14, 98, 196, 98); // Línea después de datos del cliente



      // --- Tabla de Productos de la Venta ---
      const tableColumn = ["Descripción", "Cantidad", "P. Unit.", "Total"];
      const tableRows: any[] = [];

      this.venta.products.forEach(item => {
        const productInfo = this.productosDisponibles.find(p => p.id === item.productId);
        const description = productInfo ? productInfo.name : item.productName;
        tableRows.push([
          description,
          item.quantity.toString(),
          formatearMoneda(item.price),
          formatearMoneda(item.total)
        ]);
      });

      // Configuración de la tabla con jspdf-autotable
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
          0: { cellWidth: 90, halign: 'left', overflow: 'linebreak' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        },
        foot: [
          ['', '', 'Subtotal:', formatearMoneda(this.venta.subtotal)],
          ['', '', 'IVA (18%):', formatearMoneda(this.venta.tax)],
          ['', '', 'TOTAL A PAGAR:', formatearMoneda(this.venta.total)]
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
            (data.cell.styles as any).fillColor = accentColor;
            (data.cell.styles as any).textColor = whiteColor;
          }
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
      });

      // --- Notas Adicionales ---
      let finalY = (doc as any).autoTable.previous.finalY;

      if (this.venta.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notas:', 14, finalY + 10);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(this.venta.notes, 180);
        doc.text(splitNotes, 14, finalY + 15);
        finalY += splitNotes.length * 5 + 10;
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

      // Guarda el PDF
      doc.save(`boleta_venta_${this.venta.id?.slice(0, 8) || 'sin-id'}.pdf`);

      console.log(`✅ Boleta de venta generada: boleta_venta_${this.venta.id?.slice(0, 8) || 'sin-id'}.pdf`);
    } catch (error) {
      console.error('❌ Error al generar la boleta de venta:', error);
      alert('Hubo un error al generar la boleta de venta. Consulte la consola para más detalles.');
      throw new Error('Error al generar la boleta de venta');
    }
  }
}
