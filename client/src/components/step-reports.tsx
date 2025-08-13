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
            font-family: 'Arial', 'Helvetica', sans-serif; 
            line-height: 1.3; 
            color: #000;
            background: #fff;
            padding: 10px;
            font-size: 12px;
          }
          .container { 
            max-width: 100%; 
            margin: 0; 
            background: white; 
            border: 1px solid #000;
          }
          .header { 
            background: #fff;
            color: #000; 
            padding: 15px; 
            text-align: center;
            border-bottom: 2px solid #000;
          }
          .header h1 { 
            font-size: 18px; 
            margin: 0 0 5px 0; 
            font-weight: bold;
            text-transform: uppercase;
          }
          .header .company { 
            font-size: 14px; 
            font-weight: normal;
            margin: 0;
          }
          .content { padding: 10px; }
          .info-grid { 
            display: inline-block;
            width: 100%;
            margin-bottom: 10px;
          }
          .info-card { 
            display: inline-block;
            margin-right: 15px; 
          }
          .info-card .label { 
            font-size: 11px; 
            color: #000; 
            font-weight: bold;
            margin-right: 5px;
          }
          .info-card .value { 
            font-size: 11px; 
            font-weight: normal; 
            color: #000; 
          }
          .summary { 
            background: #fff; 
            padding: 10px; 
            border: 1px solid #000; 
            margin-bottom: 10px;
            text-align: left;
          }
          .summary-grid { 
            display: inline-block;
            width: 100%;
            margin-top: 5px;
          }
          .summary-item { 
            display: inline-block; 
            margin-right: 20px; 
          }
          .summary-item .label { 
            font-weight: bold; 
            margin-right: 5px; 
          }
          .summary-item .amount { 
            font-size: 14px; 
            font-weight: bold; 
            color: #000;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            background: white;
            border: 1px solid #000;
          }
          th { 
            background: #000; 
            color: white; 
            padding: 8px 6px; 
            font-weight: bold; 
            font-size: 12px;
            text-transform: uppercase;
            border: 1px solid #000;
          }
          td { 
            padding: 6px 6px; 
            border: 1px solid #000;
            vertical-align: top;
            font-size: 11px;
          }
          .status.ok { color: #000; font-weight: normal; }
          .status.warning { color: #000; font-weight: normal; }
          .print-btn { 
            position: fixed; 
            top: 10px; 
            right: 10px; 
            background: #000; 
            color: white; 
            border: 1px solid #000; 
            padding: 8px 12px; 
            cursor: pointer; 
            font-size: 12px;
            z-index: 1000;
          }
          .print-btn:hover { background: #333; }
          @media print { 
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">IMPRIMIR</button>
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
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.3; 
            color: #000;
            background: #fff;
            padding: 10px;
            font-weight: 400;
            font-size: 12px;
          }
          .container { 
            max-width: 100%; 
            margin: 0; 
            background: white; 
            border: 1px solid #000;
          }
          .header { 
            background: #fff;
            color: #000; 
            padding: 15px; 
            text-align: center;
            border-bottom: 2px solid #000;
          }
          .header h1 { 
            font-size: 18px; 
            margin: 0 0 5px 0; 
            font-weight: bold;
            text-transform: uppercase;
          }
          .header .company { 
            font-size: 14px; 
            font-weight: normal;
            margin: 0;
          }
          .content { padding: 10px; }
          .summary { 
            background: #fff; 
            padding: 10px; 
            border: 1px solid #000; 
            margin-bottom: 10px;
            text-align: left;
          }
          .summary-grid { 
            display: inline-block;
            width: 100%;
            margin-top: 5px;
          }
          .summary-item { 
            display: inline-block; 
            margin-right: 20px; 
          }
          .summary-item .label { 
            font-weight: bold; 
            margin-right: 5px; 
          }
          .summary-item .amount { 
            font-size: 14px; 
            font-weight: bold; 
            color: #000;
          }
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
            font-weight: bold; 
            color: #000; 
            margin: 5px 0; 
            font-size: 14px;
            background: #fff;
            padding: 5px 0;
            border-bottom: 1px solid #000;
            text-transform: uppercase;
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
            background: #fff;
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 5px;
          }
          .worker-header {
            margin-bottom: 5px;
          }
          .worker-name {
            font-size: 13px;
            font-weight: bold;
            color: #000;
            margin: 0;
            display: inline-block;
            width: 120px;
          }
          .worker-meta {
            display: inline-block;
          }
          .vale-amount, .arqueo-amount, .difference-amount {
            font-size: 11px;
            font-weight: normal;
            color: #000;
            margin-right: 10px;
          }
          .breakdown-section {
            margin-top: 3px;
            background: #fff;
            border: 1px solid #000;
            padding: 5px;
            font-size: 10px;
          }
          .breakdown-title {
            font-size: 11px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
          }
          .breakdown-grid {
            display: block;
          }
          .breakdown-group {
            background: white;
            margin-bottom: 5px;
          }
          .breakdown-label {
            font-size: 10px;
            font-weight: bold;
            color: #000;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .breakdown-items {
            line-height: 1.2;
          }
          .breakdown-item {
            display: inline;
            margin-right: 8px;
          }
          .denom-label, .denom-count, .denom-total {
            font-size: 10px;
            color: #000;
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
        <button class="print-btn" onclick="window.print()">IMPRIMIR</button>
        <div class="container">
          <div class="header">
            <h1>ARQUEO DE CAJA POR FECHA</h1>
            <div class="company">
              <div>Informe Consolidado por Fechas</div>
            </div>
          </div>
          
          <div class="content">
            <div class="summary">
              <strong>RESUMEN TOTAL - Responsable: ${auditorName} - ${new Date().toLocaleDateString('es-ES')}</strong>
              <div class="summary-grid">
                <span class="summary-item">
                  <span class="label">TOTAL VALES:</span>
                  <span class="amount">€${totalVales.toFixed(2)}</span>
                </span>
                <span class="summary-item">
                  <span class="label">TOTAL CONTADO:</span>
                  <span class="amount">€${totalBreakdown.toFixed(2)}</span>
                </span>
                <span class="summary-item">
                  <span class="label">DIFERENCIA:</span>
                  <span class="amount">${difference > 0 ? '+' : ''}€${difference.toFixed(2)}</span>
                </span>
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
                        <div class="shift-title">TURNO MAÑANA (${shift1Boxes.length} botes)</div>
                        ${shift1Boxes.map((box, boxIndex) => {
                          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                          const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                          const bills = DENOMINATIONS.filter(d => d.type === "bill" && (box.breakdown?.[d.value] || 0) > 0);
                          const coins = DENOMINATIONS.filter(d => d.type === "coin" && (box.breakdown?.[d.value] || 0) > 0);
                          
                          return `
                            <div class="worker-card">
                              <div class="worker-header">
                                <span class="worker-name">${box.workerName}</span>
                                <span class="worker-meta">
                                  <span class="vale-amount">Vale: €${(Number(box.valeAmount) || 0).toFixed(2)}</span>
                                  <span class="arqueo-amount">Arqueo: €${boxTotal.toFixed(2)}</span>
                                  <span class="difference-amount">Dif: ${boxDifference >= 0 ? '+' : ''}€${boxDifference.toFixed(2)}</span>
                                </span>
                              </div>
                              ${(bills.length > 0 || coins.length > 0) ? `
                                <div class="breakdown-section">
                                  <div class="breakdown-title">DESGLOSE:</div>
                                  ${bills.length > 0 ? `
                                    <div class="breakdown-group">
                                      <div class="breakdown-label">BILLETES:</div>
                                      <div class="breakdown-items">
                                        ${bills.map(bill => `<span class="breakdown-item">${bill.label}(${box.breakdown[bill.value]})</span>`).join(' ')}
                                      </div>
                                    </div>
                                  ` : ''}
                                  ${coins.length > 0 ? `
                                    <div class="breakdown-group">
                                      <div class="breakdown-label">MONEDAS:</div>
                                      <div class="breakdown-items">
                                        ${coins.map(coin => `<span class="breakdown-item">${coin.label}(${box.breakdown[coin.value]})</span>`).join(' ')}
                                      </div>
                                    </div>
                                  ` : ''}
                                </div>
                              ` : ''}
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                    
                    ${shift2Boxes.length > 0 ? `
                      <div class="shift-section">
                        <div class="shift-title">TURNO TARDE (${shift2Boxes.length} botes)</div>
                        ${shift2Boxes.map((box, boxIndex) => {
                          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                          const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                          const bills = DENOMINATIONS.filter(d => d.type === "bill" && (box.breakdown?.[d.value] || 0) > 0);
                          const coins = DENOMINATIONS.filter(d => d.type === "coin" && (box.breakdown?.[d.value] || 0) > 0);
                          
                          return `
                            <div class="worker-card">
                              <div class="worker-header">
                                <span class="worker-name">${box.workerName}</span>
                                <span class="worker-meta">
                                  <span class="vale-amount">Vale: €${(Number(box.valeAmount) || 0).toFixed(2)}</span>
                                  <span class="arqueo-amount">Arqueo: €${boxTotal.toFixed(2)}</span>
                                  <span class="difference-amount">Dif: ${boxDifference >= 0 ? '+' : ''}€${boxDifference.toFixed(2)}</span>
                                </span>
                              </div>
                              ${(bills.length > 0 || coins.length > 0) ? `
                                <div class="breakdown-section">
                                  <div class="breakdown-title">DESGLOSE:</div>
                                  ${bills.length > 0 ? `
                                    <div class="breakdown-group">
                                      <div class="breakdown-label">BILLETES:</div>
                                      <div class="breakdown-items">
                                        ${bills.map(bill => `<span class="breakdown-item">${bill.label}(${box.breakdown[bill.value]})</span>`).join(' ')}
                                      </div>
                                    </div>
                                  ` : ''}
                                  ${coins.length > 0 ? `
                                    <div class="breakdown-group">
                                      <div class="breakdown-label">MONEDAS:</div>
                                      <div class="breakdown-items">
                                        ${coins.map(coin => `<span class="breakdown-item">${coin.label}(${box.breakdown[coin.value]})</span>`).join(' ')}
                                      </div>
                                    </div>
                                  ` : ''}
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
      {/* Minimalist Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Vales</p>
                <p className="text-xl font-bold text-black">€{totalVales.toFixed(2)}</p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Contado</p>
                <p className="text-xl font-bold text-black">€{totalBreakdown.toFixed(2)}</p>
              </div>
              <Calculator className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Diferencia</p>
                <p className="text-xl font-bold text-black">
                  {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                </p>
              </div>
              <span className="text-lg text-gray-400">
                {difference === 0 ? '=' : difference > 0 ? '+' : '-'}
              </span>
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
        {/* Minimalist Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Vales</p>
                  <p className="text-xl font-bold text-black">€{totalVales.toFixed(2)}</p>
                </div>
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Contado</p>
                  <p className="text-xl font-bold text-black">€{totalBreakdown.toFixed(2)}</p>
                </div>
                <Calculator className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Diferencia</p>
                  <p className="text-xl font-bold text-black">
                    {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                  </p>
                </div>
                <span className="text-lg text-gray-400">
                  {difference === 0 ? '=' : difference > 0 ? '+' : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Report Button */}
        <div className="text-center border border-gray-300 p-6 bg-gray-50">
          <h3 className="text-lg font-bold text-black mb-2">
            INFORME DETALLADO POR FECHA
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Genera un informe completo con desglose detallado de billetes y monedas
          </p>
          <Button 
            onClick={() => {
              const reportWindow = window.open('', '_blank');
              if (reportWindow) {
                reportWindow.document.write(generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName));
                reportWindow.document.close();
              }
            }}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 border border-black"
          >
            <FileText className="mr-2 h-4 w-4" />
            GENERAR INFORME
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