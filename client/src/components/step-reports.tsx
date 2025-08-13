import { useState } from "react";
import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ExternalLink, FileText, Calendar, Calculator, Printer } from "lucide-react";
import { DENOMINATIONS, calculateBreakdownTotal } from "@/lib/denominations";
import { useToast } from "@/hooks/use-toast";

export default function StepReports() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState("by-boxes");

  const handlePrevious = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: 4 });
  };

  const handleReset = () => {
    if (confirm("¿Deseas iniciar un nuevo arqueo? Se perderán todos los datos actuales.")) {
      dispatch({ type: "RESET" });
    }
  };

  const calculateTotals = () => {
    const validCashBoxes = state.cashBoxes.filter(box => box.date && box.workerName);
    const totalVales = validCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
    const totalBreakdown = validCashBoxes.reduce((sum, box) => 
      sum + calculateBreakdownTotal(box.breakdown || {}), 0
    );
    const difference = totalBreakdown - totalVales;

    return { validCashBoxes, totalVales, totalBreakdown, difference };
  };

  const calculateTotalBreakdown = () => {
    const validCashBoxes = state.cashBoxes.filter(box => box.date && box.workerName);
    
    const totalBreakdown: Record<string, number> = {};
    DENOMINATIONS.forEach(denom => {
      totalBreakdown[denom.value] = 0;
    });

    validCashBoxes.forEach(box => {
      if (box.breakdown) {
        Object.entries(box.breakdown).forEach(([denom, count]) => {
          totalBreakdown[denom] = (totalBreakdown[denom] || 0) + (Number(count) || 0);
        });
      }
    });

    return totalBreakdown;
  };

  const handleOpenReport = (reportType: 'boxes' | 'date') => {
    const { validCashBoxes, totalVales, totalBreakdown, difference } = calculateTotals();
    
    if (validCashBoxes.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay botes válidos para generar el informe.",
        variant: "destructive"
      });
      return;
    }

    if (!state.auditorName.trim()) {
      toast({
        title: "Falta auditor",
        description: "Debe seleccionar un auditor antes de generar el informe.",
        variant: "destructive"
      });
      return;
    }

    if (reportType === 'boxes') {
      const reportContent = generateReportByBoxes(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
      openReportWindow(reportContent, "Informe por Botes de Caja");
    } else if (reportType === 'date') {
      const reportContent = generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
      openReportWindow(reportContent, "Informe por Fecha");
    }
  };

  // Helper function to open report window
  const openReportWindow = (htmlContent: string, title: string) => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana del informe. Verifica que no esté bloqueada por el navegador.",
        variant: "destructive"
      });
      return;
    }

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    reportWindow.focus();
  };

  const generateReportByBoxes = (cashBoxes: any[], totalVales: number, totalBreakdown: number, difference: number, auditorName: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Arqueo de Caja - Estación de Servicio El Alto</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.5; 
            color: #2c3e50;
            background: #f8f9fa;
            padding: 20px;
          }
          .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
          }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header .company { font-size: 16px; opacity: 0.9; }
          .content { padding: 30px; }
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
          }
          .info-card { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 6px; 
            border-left: 4px solid #3498db;
          }
          .info-card .label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; }
          .info-card .value { font-size: 16px; font-weight: 600; color: #2c3e50; }
          .summary { 
            background: #ecf0f1; 
            padding: 20px; 
            border-radius: 6px; 
            margin-bottom: 30px;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            text-align: center;
          }
          .summary-item { background: white; padding: 15px; border-radius: 6px; }
          .summary-item .amount { font-size: 20px; font-weight: bold; }
          .summary-item.positive .amount { color: #27ae60; }
          .summary-item.negative .amount { color: #e74c3c; }
          .summary-item.neutral .amount { color: #3498db; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
          }
          th { 
            background: #34495e; 
            color: white; 
            padding: 15px 10px; 
            font-weight: 600; 
            font-size: 14px;
          }
          td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #ecf0f1;
            vertical-align: top;
          }
          tbody tr:hover { background: #f8f9fa; }
          .status.ok { color: #27ae60; font-weight: 600; }
          .status.warning { color: #f39c12; font-weight: 600; }
          .print-btn { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #3498db; 
            color: white; 
            border: none; 
            padding: 12px 20px; 
            border-radius: 25px; 
            cursor: pointer; 
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            z-index: 1000;
          }
          .print-btn:hover { background: #2980b9; }
          @media print { 
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
        <div class="container">
          <div class="header">
            <h1>ARQUEO DE CAJA POR BOTES</h1>
            <div class="company">
              <div>Informe de Reconciliación</div>
            </div>
          </div>
          
          <div class="content">
            <div class="info-grid">
              <div class="info-card">
                <div class="label">Fecha del Informe</div>
                <div class="value">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-card">
                <div class="label">Responsable</div>
                <div class="value">${auditorName}</div>
              </div>
              <div class="info-card">
                <div class="label">Total de Botes</div>
                <div class="value">${cashBoxes.length}</div>
              </div>
            </div>

            <div class="summary">
              <h3 style="margin-bottom: 15px; color: #2c3e50;">Resumen General</h3>
              <div class="summary-grid">
                <div class="summary-item neutral">
                  <div class="label">Total Vales</div>
                  <div class="amount">€${totalVales.toFixed(2)}</div>
                </div>
                <div class="summary-item neutral">
                  <div class="label">Total Contado</div>
                  <div class="amount">€${totalBreakdown.toFixed(2)}</div>
                </div>
                <div class="summary-item ${difference === 0 ? 'positive' : difference > 0 ? 'positive' : 'negative'}">
                  <div class="label">Diferencia</div>
                  <div class="amount">${difference > 0 ? '+' : ''}€${difference.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">Bote</th>
                  <th>Fecha</th>
                  <th>Trabajador</th>
                  <th style="width: 80px;">Turno</th>
                  <th style="width: 90px;">Vale</th>
                  <th style="width: 90px;">Contado</th>
                  <th style="width: 90px;">Diferencia</th>
                  <th style="width: 80px;">Estado</th>
                  <th>Detalle Arqueo</th>
                </tr>
              </thead>
              <tbody>
                ${cashBoxes
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((box, index) => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                  const isOk = Math.abs(boxDifference) < 0.01;
                  
                  // Generate breakdown details for values > 0
                  const breakdownDetails = DENOMINATIONS
                    .filter(denom => (box.breakdown && box.breakdown[denom.value] > 0))
                    .map(denom => `${denom.label}: ${box.breakdown[denom.value]}`)
                    .join(', ');
                  
                  return `
                    <tr>
                      <td style="text-align: center; font-weight: 600;">#${index + 1}</td>
                      <td>${new Date(box.date).toLocaleDateString('es-ES')}</td>
                      <td style="font-weight: 500;">${box.workerName}</td>
                      <td style="text-align: center;">
                        <span style="padding: 2px 8px; background: ${box.shift === 1 ? '#e3f2fd' : '#fff3e0'}; border-radius: 12px; font-size: 12px;">
                          ${box.shift === 1 ? 'Mañana' : 'Tarde'}
                        </span>
                      </td>
                      <td style="text-align: right; font-weight: 500;">€${(Number(box.valeAmount) || 0).toFixed(2)}</td>
                      <td style="text-align: right; font-weight: 500;">€${boxTotal.toFixed(2)}</td>
                      <td style="text-align: right; color: ${isOk ? '#27ae60' : boxDifference > 0 ? '#2980b9' : '#e74c3c'}; font-weight: 600;">
                        ${boxDifference > 0 ? '+' : ''}€${boxDifference.toFixed(2)}
                      </td>
                      <td style="text-align: center;">
                        <span class="status ${isOk ? 'ok' : 'warning'}">${isOk ? '✓' : '⚠'}</span>
                      </td>
                      <td style="font-size: 11px; color: #7f8c8d;">${breakdownDetails || 'Sin detalle'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateReportByDate = (cashBoxes: any[], totalVales: number, totalBreakdown: number, difference: number, auditorName: string) => {
    // Group cash boxes by date and worker
    const groupedByDate: Record<string, any[]> = {};
    cashBoxes.forEach(box => {
      if (!groupedByDate[box.date]) {
        groupedByDate[box.date] = [];
      }
      groupedByDate[box.date].push(box);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Arqueo de Caja por Fecha - Estación de Servicio El Alto</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;
            line-height: 1.6; 
            color: #1a202c;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            font-weight: 400;
            letter-spacing: -0.01em;
          }
          .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 35px; 
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white" opacity="0.1"><polygon points="0,100 1000,0 1000,100"/></svg>');
            background-size: cover;
          }
          .header h1 { 
            font-size: 28px; 
            margin-bottom: 12px; 
            font-weight: 700;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header .company { 
            font-size: 18px; 
            opacity: 0.95;
            font-weight: 500;
            letter-spacing: 0.02em;
          }
          .content { padding: 30px; }
          .summary { 
            background: #ecf0f1; 
            padding: 20px; 
            border-radius: 6px; 
            margin-bottom: 30px;
            text-align: center;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin-top: 15px;
          }
          .summary-item { background: white; padding: 12px; border-radius: 6px; }
          .summary-item .amount { font-size: 18px; font-weight: bold; }
          .summary-item.positive .amount { color: #27ae60; }
          .summary-item.negative .amount { color: #e74c3c; }
          .summary-item.neutral .amount { color: #3498db; }
          .date-section { 
            margin-bottom: 30px; 
            border: 1px solid #ecf0f1; 
            border-radius: 6px; 
            overflow: hidden;
          }
          .date-header { 
            background: #34495e; 
            color: white; 
            padding: 15px; 
            font-size: 18px; 
            font-weight: 600;
          }
          .date-content { padding: 20px; }
          .shift-section { 
            background: #f8f9fa; 
            padding: 15px; 
            margin-bottom: 15px; 
            border-radius: 4px;
          }
          .shift-title { 
            font-weight: 700; 
            color: #1a202c; 
            margin-bottom: 16px; 
            font-size: 18px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 12px 18px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            font-family: 'Inter', sans-serif;
            letter-spacing: -0.01em;
          }
          .worker-line { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 10px 15px; 
            margin: 6px 0;
            background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
            border-radius: 6px;
            border-left: 3px solid #27ae60;
          }
          .worker-line:last-child { border-bottom: none; }
          .worker-name { font-weight: 500; }
          .worker-amount { 
            font-weight: 600; 
            color: #27ae60; 
            font-family: monospace; 
            background: linear-gradient(45deg, #d4edda, #c3e6cb); 
            padding: 4px 10px; 
            border-radius: 15px; 
            font-size: 13px;
            border: 1px solid #b8dacc;
          }
          .worker-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .breakdown-detail {
            font-size: 10px;
            color: #6c757d;
            font-style: italic;
            background: rgba(108, 117, 125, 0.1);
            padding: 2px 6px;
            border-radius: 8px;
            max-width: fit-content;
          }
          .worker-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
          }
          .worker-card:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            transform: translateY(-2px);
          }
          .worker-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
          }
          .worker-name {
            font-size: 20px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
            font-family: 'Inter', sans-serif;
            letter-spacing: -0.02em;
          }
          .worker-meta {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .vale-amount, .arqueo-amount {
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
          }
          .arqueo-amount {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          }
          .difference-amount {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
          }
          .difference-amount.balanced {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
          }
          .difference-amount.positive {
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
          }
          .difference-amount.negative {
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            color: white;
          }
          .breakdown-section {
            margin-top: 16px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 10px;
            padding: 16px;
          }
          .breakdown-title {
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 12px;
            font-family: 'Inter', sans-serif;
          }
          .breakdown-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .breakdown-group {
            background: white;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #e2e8f0;
          }
          .breakdown-label {
            font-size: 12px;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .breakdown-items {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .breakdown-item {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 8px;
            align-items: center;
            padding: 4px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .breakdown-item:last-child {
            border-bottom: none;
          }
          .denom-label {
            font-size: 13px;
            font-weight: 500;
            color: #2d3748;
          }
          .denom-count {
            font-size: 12px;
            color: #718096;
            font-family: 'SF Mono', monospace;
          }
          .denom-total {
            font-size: 13px;
            font-weight: 600;
            color: #2d3748;
            font-family: 'SF Mono', monospace;
          }
          .amounts { color: #7f8c8d; font-size: 14px; }
          .date-totals { 
            background: #e8f4f8; 
            padding: 15px; 
            border-radius: 4px; 
            margin-top: 15px;
          }
          .totals-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            text-align: center;
          }
          .total-item .label { font-size: 12px; color: #7f8c8d; }
          .total-item .value { font-size: 16px; font-weight: 600; }
          .print-btn { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #27ae60; 
            color: white; 
            border: none; 
            padding: 12px 20px; 
            border-radius: 25px; 
            cursor: pointer; 
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 1000;
          }
          .print-btn:hover { background: #229954; }
          @media print { 
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
        <div class="container">
          <div class="header">
            <h1>ARQUEO DE CAJA POR FECHA</h1>
            <div class="company">
              <div>Informe Consolidado por Fechas</div>
            </div>
          </div>
          
          <div class="content">
            <div class="summary">
              <h3 style="margin-bottom: 10px; color: #2c3e50;">Resumen Total del Período</h3>
              <div style="font-size: 14px; color: #7f8c8d;">Responsable: ${auditorName} | Generado: ${new Date().toLocaleDateString('es-ES')}</div>
              <div class="summary-grid">
                <div class="summary-item neutral">
                  <div class="label">Total Vales</div>
                  <div class="amount">€${totalVales.toFixed(2)}</div>
                </div>
                <div class="summary-item neutral">
                  <div class="label">Total Contado</div>
                  <div class="amount">€${totalBreakdown.toFixed(2)}</div>
                </div>
                <div class="summary-item ${difference === 0 ? 'positive' : difference > 0 ? 'positive' : 'negative'}">
                  <div class="label">Diferencia</div>
                  <div class="amount">${difference > 0 ? '+' : ''}€${difference.toFixed(2)}</div>
                </div>
              </div>
            </div>

            ${sortedDates.map(date => {
              const dateCashBoxes = groupedByDate[date];
              const shift1Boxes = dateCashBoxes.filter(box => box.shift === 1);
              const shift2Boxes = dateCashBoxes.filter(box => box.shift === 2);
              
              const dateTotalVales = dateCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
              const dateTotalArqueo = dateCashBoxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0);
              const dateDifference = dateTotalArqueo - dateTotalVales;
              
              return `
                <div class="date-section">
                  <div class="date-header">
                    ${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div class="date-content">
                    ${shift1Boxes.length > 0 ? `
                      <div class="shift-section">
                        <div class="shift-title">🌅 Turno Mañana (${shift1Boxes.length} botes)</div>
                        ${shift1Boxes.map((box, boxIndex) => {
                          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                          const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                          const bills = DENOMINATIONS.filter(d => d.type === "bill" && (box.breakdown?.[d.value] || 0) > 0);
                          const coins = DENOMINATIONS.filter(d => d.type === "coin" && (box.breakdown?.[d.value] || 0) > 0);
                          
                          return `
                            <div class="worker-card">
                              <div class="worker-header">
                                <div class="worker-info">
                                  <div class="worker-name">${box.workerName}</div>
                                  <div class="worker-meta">
                                    <span class="vale-amount">Vale: €${(Number(box.valeAmount) || 0).toFixed(2)}</span>
                                    <span class="arqueo-amount">Arqueo: €${boxTotal.toFixed(2)}</span>
                                    <span class="difference-amount ${Math.abs(boxDifference) < 0.01 ? 'balanced' : boxDifference > 0 ? 'positive' : 'negative'}">
                                      Dif: ${boxDifference >= 0 ? '+' : ''}€${boxDifference.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              ${(bills.length > 0 || coins.length > 0) ? `
                                <div class="breakdown-section">
                                  <div class="breakdown-title">💰 Desglose del Arqueo</div>
                                  <div class="breakdown-grid">
                                    ${bills.length > 0 ? `
                                      <div class="breakdown-group">
                                        <div class="breakdown-label">💵 Billetes</div>
                                        <div class="breakdown-items">
                                          ${bills.map(bill => `
                                            <div class="breakdown-item">
                                              <span class="denom-label">${bill.label}</span>
                                              <span class="denom-count">${box.breakdown[bill.value]} ud.</span>
                                              <span class="denom-total">€${(parseFloat(bill.value) * box.breakdown[bill.value]).toFixed(2)}</span>
                                            </div>
                                          `).join('')}
                                        </div>
                                      </div>
                                    ` : ''}
                                    ${coins.length > 0 ? `
                                      <div class="breakdown-group">
                                        <div class="breakdown-label">🪙 Monedas</div>
                                        <div class="breakdown-items">
                                          ${coins.map(coin => `
                                            <div class="breakdown-item">
                                              <span class="denom-label">${coin.label}</span>
                                              <span class="denom-count">${box.breakdown[coin.value]} ud.</span>
                                              <span class="denom-total">€${(parseFloat(coin.value) * box.breakdown[coin.value]).toFixed(2)}</span>
                                            </div>
                                          `).join('')}
                                        </div>
                                      </div>
                                    ` : ''}
                                  </div>
                                </div>
                              ` : ''}
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                    
                    ${shift2Boxes.length > 0 ? `
                      <div class="shift-section">
                        <div class="shift-title">🌙 Turno Tarde (${shift2Boxes.length} botes)</div>
                        ${shift2Boxes.map((box, boxIndex) => {
                          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                          const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                          const bills = DENOMINATIONS.filter(d => d.type === "bill" && (box.breakdown?.[d.value] || 0) > 0);
                          const coins = DENOMINATIONS.filter(d => d.type === "coin" && (box.breakdown?.[d.value] || 0) > 0);
                          
                          return `
                            <div class="worker-card">
                              <div class="worker-header">
                                <div class="worker-info">
                                  <div class="worker-name">${box.workerName}</div>
                                  <div class="worker-meta">
                                    <span class="vale-amount">Vale: €${(Number(box.valeAmount) || 0).toFixed(2)}</span>
                                    <span class="arqueo-amount">Arqueo: €${boxTotal.toFixed(2)}</span>
                                    <span class="difference-amount ${Math.abs(boxDifference) < 0.01 ? 'balanced' : boxDifference > 0 ? 'positive' : 'negative'}">
                                      Dif: ${boxDifference >= 0 ? '+' : ''}€${boxDifference.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              ${(bills.length > 0 || coins.length > 0) ? `
                                <div class="breakdown-section">
                                  <div class="breakdown-title">💰 Desglose del Arqueo</div>
                                  <div class="breakdown-grid">
                                    ${bills.length > 0 ? `
                                      <div class="breakdown-group">
                                        <div class="breakdown-label">💵 Billetes</div>
                                        <div class="breakdown-items">
                                          ${bills.map(bill => `
                                            <div class="breakdown-item">
                                              <span class="denom-label">${bill.label}</span>
                                              <span class="denom-count">${box.breakdown[bill.value]} ud.</span>
                                              <span class="denom-total">€${(parseFloat(bill.value) * box.breakdown[bill.value]).toFixed(2)}</span>
                                            </div>
                                          `).join('')}
                                        </div>
                                      </div>
                                    ` : ''}
                                    ${coins.length > 0 ? `
                                      <div class="breakdown-group">
                                        <div class="breakdown-label">🪙 Monedas</div>
                                        <div class="breakdown-items">
                                          ${coins.map(coin => `
                                            <div class="breakdown-item">
                                              <span class="denom-label">${coin.label}</span>
                                              <span class="denom-count">${box.breakdown[coin.value]} ud.</span>
                                              <span class="denom-total">€${(parseFloat(coin.value) * box.breakdown[coin.value]).toFixed(2)}</span>
                                            </div>
                                          `).join('')}
                                        </div>
                                      </div>
                                    ` : ''}
                                  </div>
                                </div>
                              ` : ''}
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                    
                    <div class="date-totals">
                      <div class="total-simple">
                        <div class="total-row">
                          <span class="total-label">Total del Día</span>
                          <span class="total-amount">€${dateTotalArqueo.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const { validCashBoxes, totalVales, totalBreakdown, difference } = calculateTotals();
  const globalBreakdown = calculateTotalBreakdown();

  const bills = DENOMINATIONS.filter(d => d.type === "bill");
  const coins = DENOMINATIONS.filter(d => d.type === "coin");

  const renderByBoxesReport = () => (
    <div className="space-y-6">
      {/* Modern Summary Cards with Vivid Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white">
          <div className="h-1 bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300"></div>
          <CardContent className="pt-6 relative">
            <div className="absolute top-4 right-4 opacity-20">
              <FileText className="h-12 w-12" />
            </div>
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-medium mb-2">💰 Total Vales</p>
              <p className="text-3xl font-bold mb-1">€{totalVales.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 text-white">
          <div className="h-1 bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300"></div>
          <CardContent className="pt-6 relative">
            <div className="absolute top-4 right-4 opacity-20">
              <Calculator className="h-12 w-12" />
            </div>
            <div className="relative z-10">
              <p className="text-emerald-100 text-sm font-medium mb-2">🔢 Total Contado</p>
              <p className="text-3xl font-bold mb-1">€{totalBreakdown.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden shadow-lg border-0 text-white ${
          difference === 0 
            ? 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600' 
            : difference > 0 
            ? 'bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600' 
            : 'bg-gradient-to-br from-red-400 via-pink-500 to-rose-600'
        }`}>
          <div className={`h-1 bg-gradient-to-r ${
            difference === 0 
              ? 'from-teal-300 via-cyan-200 to-blue-300' 
              : difference > 0 
              ? 'from-purple-300 via-violet-200 to-indigo-300' 
              : 'from-red-300 via-pink-200 to-rose-300'
          }`}></div>
          <CardContent className="pt-6 relative">
            <div className="absolute top-4 right-4 opacity-20 text-4xl">
              {difference === 0 ? '✨' : difference > 0 ? '📈' : '📉'}
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-2">
                {difference === 0 ? '✅ Perfecto' : difference > 0 ? '📊 Diferencia' : '⚠️ Diferencia'}
              </p>
              <p className="text-3xl font-bold mb-1">
                {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Boxes Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead className="w-20">Bote</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Trabajador</TableHead>
                  <TableHead className="w-24">Turno</TableHead>
                  <TableHead className="text-right w-32">Vale</TableHead>
                  <TableHead className="text-right w-32">Contado</TableHead>
                  <TableHead className="text-right w-32">Diferencia</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {validCashBoxes
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((box, index) => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                  const isOk = Math.abs(boxDifference) < 0.01;

                  // Get breakdown details for display
                  const breakdownDetails = DENOMINATIONS
                    .filter(denom => (box.breakdown && box.breakdown[denom.value] > 0))
                    .map(denom => `${denom.label}(${box.breakdown[denom.value]})`)
                    .join(', ');

                  return (
                    <>
                      <tr key={index} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                        <TableCell className="font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">#{index + 1}</TableCell>
                        <TableCell className="font-medium">{new Date(box.date).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell className="font-semibold text-gray-800">{box.workerName}</TableCell>
                        <TableCell>
                          <Badge variant={box.shift === 1 ? "default" : "secondary"} className={box.shift === 1 ? "bg-orange-100 text-orange-800" : "bg-indigo-100 text-indigo-800"}>
                            {box.shift === 1 ? '🌅 Mañana' : '🌙 Tarde'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono bg-blue-50 text-blue-700 font-semibold">€{(Number(box.valeAmount) || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono bg-green-50 text-green-700 font-semibold">€{boxTotal.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${
                          isOk ? 'text-emerald-600 bg-emerald-50' : boxDifference > 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'
                        }`}>
                          {boxDifference > 0 ? '+' : ''}€{boxDifference.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOk ? "default" : "destructive"} className={isOk ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                            {isOk ? '✓ OK' : '⚠ Diff'}
                          </Badge>
                        </TableCell>
                      </tr>
                      {breakdownDetails && (
                        <tr key={`${index}-breakdown`} className="bg-gray-50">
                          <TableCell colSpan={8} className="text-xs text-gray-600 italic px-8">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">💰</span>
                              <span className="font-medium">Arqueo:</span>
                              <span>{breakdownDetails}</span>
                            </div>
                          </TableCell>
                        </tr>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderByDateReport = () => {
    const groupedByDate: Record<string, typeof validCashBoxes> = {};
    validCashBoxes.forEach(box => {
      if (!groupedByDate[box.date]) {
        groupedByDate[box.date] = [];
      }
      groupedByDate[box.date].push(box);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    return (
      <div className="space-y-6">
        {/* Modern Gradient Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white">
            <div className="h-1 bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300"></div>
            <CardContent className="pt-6 relative">
              <div className="absolute top-4 right-4 opacity-20">
                <FileText className="h-12 w-12" />
              </div>
              <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium mb-2">💰 Total Vales</p>
                <p className="text-3xl font-bold mb-1">€{totalVales.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 text-white">
            <div className="h-1 bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300"></div>
            <CardContent className="pt-6 relative">
              <div className="absolute top-4 right-4 opacity-20">
                <Calculator className="h-12 w-12" />
              </div>
              <div className="relative z-10">
                <p className="text-emerald-100 text-sm font-medium mb-2">🔢 Total Contado</p>
                <p className="text-3xl font-bold mb-1">€{totalBreakdown.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`overflow-hidden shadow-lg border-0 text-white ${
            difference === 0 
              ? 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600' 
              : difference > 0 
              ? 'bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600' 
              : 'bg-gradient-to-br from-red-400 via-pink-500 to-rose-600'
          }`}>
            <div className={`h-1 bg-gradient-to-r ${
              difference === 0 
                ? 'from-teal-300 via-cyan-200 to-blue-300' 
                : difference > 0 
                ? 'from-purple-300 via-violet-200 to-indigo-300' 
                : 'from-red-300 via-pink-200 to-rose-300'
            }`}></div>
            <CardContent className="pt-6 relative">
              <div className="absolute top-4 right-4 opacity-20 text-4xl">
                {difference === 0 ? '✨' : difference > 0 ? '📈' : '📉'}
              </div>
              <div className="relative z-10">
                <p className="text-white/80 text-sm font-medium mb-2">
                  {difference === 0 ? '✅ Perfecto' : difference > 0 ? '📊 Diferencia' : '⚠️ Diferencia'}
                </p>
                <p className="text-3xl font-bold mb-1">
                  {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Detailed Report Button */}
        <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <span className="text-2xl">📅</span>
            Informe Detallado por Fecha
          </h3>
          <p className="text-gray-600 mb-6">
            Genera un informe completo con desglose detallado de billetes y monedas organizado por fechas y turnos
          </p>
          <Button 
            onClick={() => {
              const reportWindow = window.open('', '_blank');
              if (reportWindow) {
                reportWindow.document.write(generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName));
                reportWindow.document.close();
              }
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FileText className="mr-2 h-5 w-5" />
            🚀 Generar Informe por Fecha
          </Button>
        </div>

        {/* Date-based breakdown */}
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dateCashBoxes = groupedByDate[date];
            const shift1Boxes = dateCashBoxes.filter(box => box.shift === 1);
            const shift2Boxes = dateCashBoxes.filter(box => box.shift === 2);
            
            const dateTotalVales = dateCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
            const dateTotalArqueo = dateCashBoxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0);
            const dateDifference = dateTotalArqueo - dateTotalVales;

            return (
              <Card key={date}>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {new Date(date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {shift1Boxes.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <span>🌅</span>
                          Turno Mañana ({shift1Boxes.length} botes)
                        </h4>
                        <div className="space-y-2">
                          {shift1Boxes.map((box, index) => {
                            const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                            const valeAmount = Number(box.valeAmount) || 0;
                            const boxDiff = boxTotal - valeAmount;
                            
                            return (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="font-medium">{box.workerName}</span>
                                <span className={`font-mono ${boxDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  €{valeAmount.toFixed(2)} → €{boxTotal.toFixed(2)} 
                                  ({boxDiff > 0 ? '+' : ''}€{boxDiff.toFixed(2)})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {shift2Boxes.length > 0 && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                          <span>🌙</span>
                          Turno Tarde ({shift2Boxes.length} botes)
                        </h4>
                        <div className="space-y-2">
                          {shift2Boxes.map((box, index) => {
                            const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                            const valeAmount = Number(box.valeAmount) || 0;
                            const boxDiff = boxTotal - valeAmount;
                            
                            return (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="font-medium">{box.workerName}</span>
                                <span className={`font-mono ${boxDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  €{valeAmount.toFixed(2)} → €{boxTotal.toFixed(2)} 
                                  ({boxDiff > 0 ? '+' : ''}€{boxDiff.toFixed(2)})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Vales</p>
                        <p className="font-bold text-blue-600">€{dateTotalVales.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Arqueo</p>
                        <p className="font-bold text-green-600">€{dateTotalArqueo.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Diferencia</p>
                        <p className={`font-bold ${dateDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {dateDifference > 0 ? '+' : ''}€{dateDifference.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Informes y Reportes</h2>
          <p className="text-gray-600">Genera informes detallados del arqueo de caja</p>
        </div>
      </div>

      {validCashBoxes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para mostrar</h3>
              <p className="text-gray-600">Completa al menos un bote de caja para ver los informes.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Report Type Tabs */}
          <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-boxes">Informe por Botes</TabsTrigger>
              <TabsTrigger value="by-date">Informe por Fecha</TabsTrigger>
            </TabsList>

            <TabsContent value="by-boxes" className="space-y-4">
              {renderByBoxesReport()}
            </TabsContent>

            <TabsContent value="by-date" className="space-y-4">
              {renderByDateReport()}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={() => handleOpenReport('boxes')}
                className="flex items-center gap-2"
                disabled={validCashBoxes.length === 0 || !state.auditorName.trim()}
              >
                <Printer className="h-4 w-4" />
                Imprimir por Botes
              </Button>
              <Button
                onClick={() => handleOpenReport('date')}
                className="flex items-center gap-2"
                disabled={validCashBoxes.length === 0 || !state.auditorName.trim()}
              >
                <Printer className="h-4 w-4" />
                Imprimir por Fecha
              </Button>
              <Button
                variant="destructive"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Nuevo Arqueo
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}