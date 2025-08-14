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

    if (reportType === 'boxes') {
      const reportContent = generateReportByBoxes(validCashBoxes, totalVales, totalBreakdown, difference);
      openReportWindow(reportContent, "Informe por Botes de Caja");
    } else if (reportType === 'date') {
      const reportContent = generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference);
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

  // Helper function to format breakdown in column format for tables
  const formatBreakdown = (breakdown: Record<string, number>) => {
    return DENOMINATIONS
      .filter(denom => breakdown[denom.value] && breakdown[denom.value] > 0)
      .map(denom => {
        const count = breakdown[denom.value];
        const total = count * parseFloat(denom.value);
        return `${count}x${denom.value}=${total.toFixed(2)}€`;
      })
      .join('<br>');
  };

  const generateReportByBoxes = (cashBoxes: any[], totalVales: number, totalBreakdown: number, difference: number) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Arqueo de Caja - Informe por Botes</title>
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
                <div class="label">Total de Botes</div>
                <div class="value">${cashBoxes.length}</div>
              </div>
            </div>

            <div class="summary">
              <h3 style="margin-bottom: 15px; color: #2c3e50;">Resumen General</h3>
              <div class="summary-grid">
                <div class="summary-item neutral">
                  <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Total Vales</div>
                  <div class="amount">€${totalVales.toFixed(2)}</div>
                </div>
                <div class="summary-item neutral">
                  <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Total Contado</div>
                  <div class="amount">€${totalBreakdown.toFixed(2)}</div>
                </div>
                <div class="summary-item ${difference === 0 ? 'neutral' : difference > 0 ? 'positive' : 'negative'}">
                  <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">Diferencia</div>
                  <div class="amount">${difference > 0 ? '+' : ''}€${difference.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Trabajador</th>
                  <th>Turno</th>
                  <th>Vale</th>
                  <th>Contado</th>
                  <th>Diferencia</th>
                  <th>Desglose</th>
                </tr>
              </thead>
              <tbody>
                ${cashBoxes.map(box => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDiff = boxTotal - (Number(box.valeAmount) || 0);
                  const status = boxDiff === 0 ? 'ok' : 'warning';
                  
                  return `
                    <tr>
                      <td>${new Date(box.date).toLocaleDateString('es-ES')}</td>
                      <td>${box.workerName}</td>
                      <td>Turno ${box.shift}</td>
                      <td>€${(Number(box.valeAmount) || 0).toFixed(2)}</td>
                      <td>€${boxTotal.toFixed(2)}</td>
                      <td class="status ${status}">${boxDiff > 0 ? '+' : ''}€${boxDiff.toFixed(2)}</td>
                      <td style="font-size: 11px;">${formatBreakdown(box.breakdown || {})}</td>
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

  const generateReportByDate = (cashBoxes: any[], totalVales: number, totalBreakdown: number, difference: number) => {
    // Group cash boxes by date
    const groupedByDate = cashBoxes.reduce((acc, box) => {
      const date = box.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(box);
      return acc;
    }, {} as Record<string, any[]>);

    const globalBreakdown = calculateTotalBreakdown();
    const sortedDates = Object.keys(groupedByDate).sort();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Arqueo de Caja - Informe Consolidado por Fechas</title>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 12px;
            line-height: 1.4;
            color: #1a1a1a;
            background: #ffffff;
            margin: 8mm;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 25px;
            border-bottom: 4px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .header p {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .overall-stats {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
            border: 2px solid #e2e8f0;
          }
          
          .stat-card {
            text-align: center;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .stat-label {
            display: block;
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          
          .stat-value {
            display: block;
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }
          
          .stat-card.positive .stat-value { color: #059669; }
          .stat-card.negative .stat-value { color: #dc2626; }
          .stat-card.primary .stat-value { color: #2563eb; }
          
          .date-section { 
            margin-bottom: 40px; 
            page-break-inside: avoid;
          }
          
          .date-header { 
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .date-summary {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.9;
          }
          
          .cash-boxes-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .cash-boxes-table th {
            background: linear-gradient(135deg, #374151, #4b5563);
            color: white;
            padding: 12px 10px;
            text-align: center;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .cash-boxes-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          
          .cash-boxes-table tbody tr {
            background: white;
          }
          
          .cash-boxes-table tbody tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .cash-boxes-table tbody tr:hover {
            background: #f3f4f6;
          }
          
          .worker-cell {
            font-weight: 600;
            color: #1f2937;
            text-align: center;
          }
          
          .shift-cell {
            text-align: center;
            font-weight: 500;
          }
          
          .amount-cell {
            text-align: right;
            font-weight: 600;
            font-family: 'Courier New', monospace;
          }
          
          .difference-positive { color: #059669; }
          .difference-negative { color: #dc2626; }
          .difference-zero { color: #6b7280; }
          
          .breakdown-cell {
            background: #f8fafc;
            padding: 8px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 4px;
            font-size: 10px;
          }
          
          .breakdown-item {
            background: white;
            padding: 3px 5px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #d1d5db;
            font-weight: 500;
          }
          
          .day-totals {
            background: linear-gradient(135deg, #065f46, #047857);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-top: 15px;
            box-shadow: 0 4px 12px rgba(6, 95, 70, 0.3);
          }
          
          .day-totals-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            text-align: center;
          }
          
          .day-total-item h4 {
            font-size: 11px;
            opacity: 0.8;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .day-total-item .value {
            font-size: 16px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
          }
          
          .global-breakdown {
            background: linear-gradient(135deg, #fef3c7, #fbbf24);
            padding: 20px;
            border-radius: 12px;
            margin: 30px 0;
            border: 2px solid #f59e0b;
          }
          
          .global-breakdown h3 {
            text-align: center;
            margin-bottom: 15px;
            font-size: 18px;
            color: #92400e;
            font-weight: 700;
          }
          
          .global-breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
          }
          
          .global-breakdown-item {
            background: white;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          }
          
          .global-breakdown-item .denom {
            font-weight: 700;
            font-size: 14px;
            color: #92400e;
          }
          
          .global-breakdown-item .total {
            font-size: 12px;
            color: #6b7280;
            font-family: 'Courier New', monospace;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(5, 150, 105, 0.4);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
          }
          
          .print-button:hover {
            background: linear-gradient(135deg, #047857, #065f46);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5);
          }
          
          .print-button:active {
            transform: translateY(0);
          }
          
          @media print {
            body { margin: 5mm; font-size: 11px; }
            .date-section { page-break-inside: avoid; margin-bottom: 25px; }
            .global-breakdown { page-break-before: always; }
            .overall-stats { grid-template-columns: repeat(5, 1fr); gap: 10px; }
            .print-button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">
          🖨️ Imprimir Informe
        </button>
        
        <div class="header">
          <h1>📊 Informe Consolidado por Fechas</h1>
          <p>Generado el: ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div class="overall-stats">
          <div class="stat-card primary">
            <span class="stat-label">Total Fechas</span>
            <span class="stat-value">${sortedDates.length}</span>
          </div>
          <div class="stat-card primary">
            <span class="stat-label">Total Botes</span>
            <span class="stat-value">${cashBoxes.length}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Vales</span>
            <span class="stat-value">€${totalVales.toFixed(2)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Arqueos</span>
            <span class="stat-value">€${totalBreakdown.toFixed(2)}</span>
          </div>
          <div class="stat-card ${difference === 0 ? '' : difference > 0 ? 'positive' : 'negative'}">
            <span class="stat-label">Diferencia</span>
            <span class="stat-value">${difference > 0 ? '+' : ''}€${difference.toFixed(2)}</span>
          </div>
        </div>

        ${sortedDates.map(date => {
          const dateCashBoxes = groupedByDate[date];
          const dateVales = dateCashBoxes.reduce((sum, cb) => sum + cb.valeAmount, 0);
          const dateBreakdown = dateCashBoxes.reduce((sum, cb) => sum + calculateBreakdownTotal(cb.breakdown), 0);
          const dateDifference = dateBreakdown - dateVales;

          return `
            <div class="date-section">
              <div class="date-header">
                <div>
                  📅 ${new Date(date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div class="date-summary">
                  ${dateCashBoxes.length} bote${dateCashBoxes.length !== 1 ? 's' : ''} • €${dateVales.toFixed(2)} vales • €${dateBreakdown.toFixed(2)} arqueos
                </div>
              </div>
              
              <table class="cash-boxes-table">
                <thead>
                  <tr>
                    <th style="width: 20%">Trabajador</th>
                    <th style="width: 8%">Turno</th>
                    <th style="width: 12%">Vale</th>
                    <th style="width: 12%">Arqueo</th>
                    <th style="width: 12%">Diferencia</th>
                    <th style="width: 36%">Desglose Detallado</th>
                  </tr>
                </thead>
                <tbody>
                  ${dateCashBoxes.map(cashBox => {
                    const cbTotal = calculateBreakdownTotal(cashBox.breakdown);
                    const cbDifference = cbTotal - cashBox.valeAmount;
                    const diffClass = cbDifference === 0 ? 'difference-zero' : cbDifference > 0 ? 'difference-positive' : 'difference-negative';
                    
                    const nonZeroBreakdown = DENOMINATIONS
                      .filter(denom => cashBox.breakdown[denom.value] && cashBox.breakdown[denom.value] > 0)
                      .map(denom => {
                        const count = cashBox.breakdown[denom.value];
                        const total = (count * parseFloat(denom.value)).toFixed(2);
                        return `${count}×${denom.value}€ = €${total}`;
                      });
                    
                    return `
                      <tr>
                        <td class="worker-cell">${cashBox.workerName}</td>
                        <td class="shift-cell">T${cashBox.shift}</td>
                        <td class="amount-cell">€${cashBox.valeAmount.toFixed(2)}</td>
                        <td class="amount-cell">€${cbTotal.toFixed(2)}</td>
                        <td class="amount-cell ${diffClass}">${cbDifference > 0 ? '+' : ''}€${cbDifference.toFixed(2)}</td>
                        <td class="breakdown-cell">
                          <div class="breakdown-grid">
                            ${nonZeroBreakdown.map(item => `
                              <div class="breakdown-item">${item}</div>
                            `).join('')}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              
              <div class="day-totals">
                <div class="day-totals-grid">
                  <div class="day-total-item">
                    <h4>Botes del Día</h4>
                    <div class="value">${dateCashBoxes.length}</div>
                  </div>
                  <div class="day-total-item">
                    <h4>Total Vales</h4>
                    <div class="value">€${dateVales.toFixed(2)}</div>
                  </div>
                  <div class="day-total-item">
                    <h4>Total Arqueos</h4>
                    <div class="value">€${dateBreakdown.toFixed(2)}</div>
                  </div>
                  <div class="day-total-item">
                    <h4>Diferencia</h4>
                    <div class="value" style="color: ${dateDifference >= 0 ? '#10b981' : '#ef4444'}">${dateDifference > 0 ? '+' : ''}€${dateDifference.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
        
        <div class="global-breakdown">
          <h3>🔢 Desglose Global de Billetes y Monedas</h3>
          <div class="global-breakdown-grid">
            ${DENOMINATIONS
              .filter(denom => globalBreakdown[denom.value] && globalBreakdown[denom.value] > 0)
              .map(denom => {
                const count = globalBreakdown[denom.value];
                const total = (count * parseFloat(denom.value)).toFixed(2);
                return `
                  <div class="global-breakdown-item">
                    <div class="denom">${count} × ${denom.value}€</div>
                    <div class="total">= €${total}</div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const { validCashBoxes, totalVales, totalBreakdown, difference } = calculateTotals();
  const globalBreakdown = calculateTotalBreakdown();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Informes de Arqueo
          </h1>
          <Button onClick={handleReset} variant="destructive">
            Nuevo Arqueo
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Summary Cards */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen General</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Botes</p>
                  <p className="text-2xl font-bold text-blue-900">{validCashBoxes.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Vales</p>
                  <p className="text-2xl font-bold text-green-900">€{totalVales.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Total Contado</p>
                  <p className="text-2xl font-bold text-purple-900">€{totalBreakdown.toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-lg ${
                  difference === 0 
                    ? 'bg-gray-50' 
                    : difference > 0 
                      ? 'bg-emerald-50' 
                      : 'bg-red-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    difference === 0 
                      ? 'text-gray-600' 
                      : difference > 0 
                        ? 'text-emerald-600' 
                        : 'text-red-600'
                  }`}>
                    Diferencia
                  </p>
                  <p className={`text-2xl font-bold ${
                    difference === 0 
                      ? 'text-gray-900' 
                      : difference > 0 
                        ? 'text-emerald-900' 
                        : 'text-red-900'
                  }`}>
                    {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Buttons */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Informe por Botes
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Genera un informe completo listando todos los botes individualmente con su desglose de efectivo.
              </p>
              <Button 
                onClick={() => handleOpenReport('boxes')}
                className="w-full flex items-center gap-2"
                disabled={validCashBoxes.length === 0}
              >
                <Printer className="h-4 w-4" />
                Generar Informe por Botes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Informe por Fecha
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Genera un informe consolidado organizando los botes por fechas con desglose total.
              </p>
              <Button 
                onClick={() => handleOpenReport('date')}
                className="w-full flex items-center gap-2"
                disabled={validCashBoxes.length === 0}
              >
                <Printer className="h-4 w-4" />
                Generar Informe por Fecha
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}