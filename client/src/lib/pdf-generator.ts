import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DENOMINATIONS, calculateBreakdownTotal } from '@/lib/denominations';
import type { CashBoxFormData } from '@shared/schema';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PDFReportData {
  date: string;
  auditorName: string;
  cashBoxes: CashBoxFormData[];
  totalVales: number;
  totalBreakdown: number;
  difference: number;
}

export function generateByBoxesPDF(data: PDFReportData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('INFORME DE ARQUEO POR BOTES', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Fecha: ${data.date}`, 20, 35);
  doc.text(`Responsable: ${data.auditorName}`, 20, 45);
  doc.text(`Total de Botes: ${data.cashBoxes.length}`, 20, 55);
  
  // Summary section
  doc.setFontSize(14);
  doc.text('RESUMEN GENERAL', 20, 75);
  
  doc.setFontSize(11);
  doc.text(`Total Vales: €${data.totalVales.toFixed(2)}`, 20, 90);
  doc.text(`Total Arqueo: €${data.totalBreakdown.toFixed(2)}`, 20, 100);
  doc.text(`Diferencia: €${data.difference.toFixed(2)}`, 20, 110);
  
  // Table data preparation
  const tableData = data.cashBoxes.map((box, index) => {
    const boxTotal = calculateBreakdownTotal(box.breakdown || {});
    const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
    
    return [
      `Bote ${index + 1}`,
      box.date,
      box.workerName,
      box.shift === 1 ? 'Mañana' : 'Tarde',
      `€${(Number(box.valeAmount) || 0).toFixed(2)}`,
      `€${boxTotal.toFixed(2)}`,
      `€${boxDifference.toFixed(2)}`,
      Math.abs(boxDifference) > 0.01 ? 'Con diferencias' : 'Correcto'
    ];
  });
  
  // Create table
  doc.autoTable({
    head: [['Bote', 'Fecha', 'Trabajador', 'Turno', 'Vale', 'Arqueo', 'Diferencia', 'Estado']],
    body: tableData,
    startY: 125,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, finalY);
  
  // Save the PDF
  doc.save(`arqueo_por_botes_${data.date}.pdf`);
}

export function generateByDatePDF(data: PDFReportData): void {
  const doc = new jsPDF();
  
  // Group cash boxes by date, then by shift
  const groupedData: Record<string, Record<number, CashBoxFormData[]>> = {};
  
  data.cashBoxes.forEach(box => {
    const date = box.date;
    const shift = box.shift;
    
    if (!groupedData[date]) {
      groupedData[date] = {};
    }
    if (!groupedData[date][shift]) {
      groupedData[date][shift] = [];
    }
    groupedData[date][shift].push(box);
  });
  
  // Header
  doc.setFontSize(18);
  doc.text('INFORME DE ARQUEO POR FECHA', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Responsable: ${data.auditorName}`, 20, 35);
  doc.text(`Botes Procesados: ${data.cashBoxes.length}`, 20, 45);
  
  let currentY = 65;
  
  // Section 1: Grouping by dates and shifts
  doc.setFontSize(14);
  doc.text('DESGLOSE POR FECHAS Y TURNOS', 20, currentY);
  currentY += 20;
  
  Object.entries(groupedData).forEach(([date, shifts]) => {
    // Date header
    doc.setFontSize(13);
    doc.text(`FECHA: ${date}`, 25, currentY);
    currentY += 15;
    
    let dateTotalVales = 0;
    let dateTotalArqueo = 0;
    
    // Process shifts 1 and 2
    [1, 2].forEach(shiftNumber => {
      if (shifts[shiftNumber]) {
        const shiftName = shiftNumber === 1 ? 'TURNO 1 (Mañana)' : 'TURNO 2 (Tarde)';
        doc.setFontSize(11);
        doc.text(`${shiftName}:`, 35, currentY);
        currentY += 10;
        
        let shiftTotalVales = 0;
        let shiftTotalArqueo = 0;
        
        shifts[shiftNumber].forEach((box, index) => {
          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
          const valeAmount = Number(box.valeAmount) || 0;
          
          shiftTotalVales += valeAmount;
          shiftTotalArqueo += boxTotal;
          
          doc.setFontSize(9);
          doc.text(`  ${box.workerName} - Bote ${index + 1}: Vale €${valeAmount.toFixed(2)} - Arqueo €${boxTotal.toFixed(2)}`, 45, currentY);
          currentY += 8;
        });
        
        // Shift subtotal
        doc.setFontSize(10);
        doc.text(`  TOTAL ${shiftName}: Vales €${shiftTotalVales.toFixed(2)} - Arqueo €${shiftTotalArqueo.toFixed(2)}`, 40, currentY);
        currentY += 12;
        
        dateTotalVales += shiftTotalVales;
        dateTotalArqueo += shiftTotalArqueo;
      }
    });
    
    // Date total
    doc.setFontSize(12);
    doc.text(`TOTAL ${date}: Vales €${dateTotalVales.toFixed(2)} - Arqueo €${dateTotalArqueo.toFixed(2)} - Diferencia €${(dateTotalArqueo - dateTotalVales).toFixed(2)}`, 25, currentY);
    currentY += 25;
  });
  
  // Add page break if needed
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // Section 2: Complete denomination breakdown for processed boxes
  doc.setFontSize(14);
  doc.text('ARQUEO TOTAL DE BOTES PROCESADOS', 20, currentY);
  currentY += 20;
  
  // Calculate total breakdown by denomination only for processed boxes
  const totalBreakdown: Record<string, number> = {};
  DENOMINATIONS.forEach(denom => {
    totalBreakdown[denom.value] = 0;
  });
  
  data.cashBoxes.forEach(box => {
    if (box.breakdown) {
      Object.entries(box.breakdown).forEach(([denom, count]) => {
        totalBreakdown[denom] = (totalBreakdown[denom] || 0) + (count || 0);
      });
    }
  });
  
  // Bills breakdown
  doc.setFontSize(13);
  doc.text('BILLETES:', 25, currentY);
  currentY += 15;
  
  const bills = DENOMINATIONS.filter(d => d.type === 'bill');
  let billsTotal = 0;
  
  bills.forEach(bill => {
    const count = totalBreakdown[bill.value] || 0;
    const value = count * parseFloat(bill.value);
    billsTotal += value;
    
    doc.setFontSize(10);
    doc.text(`  ${bill.label}: ${count} unidades = €${value.toFixed(2)}`, 35, currentY);
    currentY += 10;
  });
  
  doc.setFontSize(11);
  doc.text(`TOTAL BILLETES: €${billsTotal.toFixed(2)}`, 30, currentY + 5);
  currentY += 25;
  
  // Coins breakdown
  doc.setFontSize(13);
  doc.text('MONEDAS:', 25, currentY);
  currentY += 15;
  
  const coins = DENOMINATIONS.filter(d => d.type === 'coin');
  let coinsTotal = 0;
  
  coins.forEach(coin => {
    const count = totalBreakdown[coin.value] || 0;
    const value = count * parseFloat(coin.value);
    coinsTotal += value;
    
    doc.setFontSize(10);
    doc.text(`  ${coin.label}: ${count} unidades = €${value.toFixed(2)}`, 35, currentY);
    currentY += 10;
  });
  
  doc.setFontSize(11);
  doc.text(`TOTAL MONEDAS: €${coinsTotal.toFixed(2)}`, 30, currentY + 5);
  currentY += 25;
  
  // Final summary table
  const summaryData = [
    ['Total Billetes', `€${billsTotal.toFixed(2)}`],
    ['Total Monedas', `€${coinsTotal.toFixed(2)}`],
    ['TOTAL ARQUEO', `€${(billsTotal + coinsTotal).toFixed(2)}`],
    ['Total Vales', `€${data.totalVales.toFixed(2)}`],
    ['DIFERENCIA FINAL', `€${data.difference.toFixed(2)}`]
  ];
  
  doc.autoTable({
    body: summaryData,
    startY: currentY,
    styles: { fontSize: 11, cellPadding: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { fontStyle: 'bold', halign: 'right' }
    },
    theme: 'grid'
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, finalY);
  
  // Save the PDF
  doc.save(`arqueo_por_fecha_${data.date}.pdf`);
}