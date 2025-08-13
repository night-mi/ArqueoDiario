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
  
  // Group cash boxes by date and worker
  const groupedData: Record<string, Record<string, CashBoxFormData[]>> = {};
  
  data.cashBoxes.forEach(box => {
    const date = box.date;
    const worker = box.workerName;
    
    if (!groupedData[date]) {
      groupedData[date] = {};
    }
    if (!groupedData[date][worker]) {
      groupedData[date][worker] = [];
    }
    groupedData[date][worker].push(box);
  });
  
  // Calculate total breakdown by denomination for all boxes
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
  
  // Header
  doc.setFontSize(18);
  doc.text('INFORME DE ARQUEO POR FECHA', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Fecha: ${data.date}`, 20, 35);
  doc.text(`Responsable: ${data.auditorName}`, 20, 45);
  doc.text(`Botes Procesados: ${data.cashBoxes.length}`, 20, 55);
  
  let currentY = 75;
  
  // Section 1: Grouping by dates and workers
  doc.setFontSize(14);
  doc.text('DESGLOSE POR TRABAJADORES', 20, currentY);
  currentY += 20;
  
  let grandTotalVales = 0;
  let grandTotalArqueo = 0;
  
  Object.entries(groupedData).forEach(([date, workers]) => {
    // Date header
    doc.setFontSize(13);
    doc.text(`Fecha: ${date}`, 25, currentY);
    currentY += 15;
    
    let dateTotalVales = 0;
    let dateTotalArqueo = 0;
    
    Object.entries(workers).forEach(([workerName, boxes]) => {
      // Worker header
      doc.setFontSize(11);
      doc.text(`Trabajador: ${workerName}`, 35, currentY);
      currentY += 10;
      
      // Worker's boxes details
      let workerTotalVales = 0;
      let workerTotalArqueo = 0;
      
      boxes.forEach((box, index) => {
        const boxTotal = calculateBreakdownTotal(box.breakdown || {});
        const valeAmount = Number(box.valeAmount) || 0;
        
        workerTotalVales += valeAmount;
        workerTotalArqueo += boxTotal;
        
        doc.setFontSize(9);
        doc.text(`  Bote ${index + 1}: Vale €${valeAmount.toFixed(2)} - Arqueo €${boxTotal.toFixed(2)} - Turno ${box.shift === 1 ? 'Mañana' : 'Tarde'}`, 45, currentY);
        currentY += 8;
      });
      
      // Worker subtotal
      doc.setFontSize(10);
      doc.text(`  TOTAL ${workerName}: Vales €${workerTotalVales.toFixed(2)} - Arqueo €${workerTotalArqueo.toFixed(2)}`, 40, currentY);
      currentY += 15;
      
      dateTotalVales += workerTotalVales;
      dateTotalArqueo += workerTotalArqueo;
    });
    
    // Date total
    doc.setFontSize(12);
    doc.text(`GRAN TOTAL ${date}: Vales €${dateTotalVales.toFixed(2)} - Arqueo €${dateTotalArqueo.toFixed(2)}`, 25, currentY);
    currentY += 20;
    
    grandTotalVales += dateTotalVales;
    grandTotalArqueo += dateTotalArqueo;
  });
  
  // Overall totals
  doc.setFontSize(13);
  doc.text(`TOTAL GENERAL: Vales €${grandTotalVales.toFixed(2)} - Arqueo €${grandTotalArqueo.toFixed(2)} - Diferencia €${(grandTotalArqueo - grandTotalVales).toFixed(2)}`, 20, currentY);
  currentY += 30;
  
  // Section 2: Complete denomination breakdown
  doc.setFontSize(14);
  doc.text('ARQUEO TOTAL POR DENOMINACIONES', 20, currentY);
  currentY += 20;
  
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