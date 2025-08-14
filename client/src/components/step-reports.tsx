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
    // Sort cash boxes by date (ascending order - oldest first)
    const sortedCashBoxes = [...cashBoxes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
                <div class="value">${sortedCashBoxes.length}</div>
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
                ${sortedCashBoxes.map(box => {
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
          
          .date-section { 
            margin-bottom: 40px; 
            border: 2px solid #3498db; 
            border-radius: 8px; 
            overflow: hidden;
          }
          .date-header { 
            background: #3498db; 
            color: white; 
            padding: 15px 20px; 
            font-size: 18px; 
            font-weight: 600;
          }
          .date-content { padding: 20px; }
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
          .breakdown-summary {
            background: #e8f5e8;
            border: 1px solid #27ae60;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
          }
          .breakdown-summary h4 {
            color: #27ae60;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            font-size: 12px;
          }
          .breakdown-item {
            text-align: center;
            background: white;
            padding: 8px;
            border-radius: 4px;
          }
          
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
            <h1>ARQUEO DE CAJA POR FECHA</h1>
            <div class="company">
              <div>Informe Consolidado por Fechas</div>
            </div>
          </div>
          
          <div class="content">
            <div class="summary">
              <h3 style="margin-bottom: 15px; color: #2c3e50;">Resumen Total</h3>
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

            <div class="breakdown-summary">
              <h4>🔢 Desglose Total de Billetes y Monedas</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: white; padding: 15px; border-radius: 4px;">
                <div>
                  <h5 style="margin-bottom: 10px; color: #2c3e50; font-size: 14px; font-weight: 600;">💵 Billetes</h5>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
                    ${DENOMINATIONS
                      .filter(denom => parseFloat(denom.value) >= 5 && globalBreakdown[denom.value] && globalBreakdown[denom.value] > 0)
                      .map(denom => {
                        const count = globalBreakdown[denom.value];
                        const total = count * parseFloat(denom.value);
                        return `
                          <div style="text-align: center; border: 1px solid #e0e0e0; padding: 6px; border-radius: 4px; background: #f8f9fa;">
                            <div style="font-weight: bold; font-size: 12px;">${count}×${denom.value}€</div>
                            <div style="font-size: 11px; color: #666;">${total.toFixed(2)}€</div>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                  <div style="margin-top: 10px; text-align: center; font-weight: 600; color: #2c3e50;">
                    Total Billetes: ${DENOMINATIONS
                      .filter(denom => parseFloat(denom.value) >= 5 && globalBreakdown[denom.value])
                      .reduce((sum, denom) => sum + (globalBreakdown[denom.value] || 0), 0)} unidades
                  </div>
                  <div style="text-align: center; font-size: 14px; font-weight: 700; color: #27ae60;">
                    ${DENOMINATIONS
                      .filter(denom => parseFloat(denom.value) >= 5 && globalBreakdown[denom.value])
                      .reduce((sum, denom) => sum + ((globalBreakdown[denom.value] || 0) * parseFloat(denom.value)), 0)
                      .toFixed(2)}€
                  </div>
                </div>
                <div>
                  <h5 style="margin-bottom: 10px; color: #2c3e50; font-size: 14px; font-weight: 600;">🪙 Monedas</h5>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
                    ${DENOMINATIONS
                      .filter(denom => parseFloat(denom.value) < 5 && globalBreakdown[denom.value] && globalBreakdown[denom.value] > 0)
                      .map(denom => {
                        const count = globalBreakdown[denom.value];
                        const total = count * parseFloat(denom.value);
                        return `
                          <div style="text-align: center; border: 1px solid #e0e0e0; padding: 6px; border-radius: 4px; background: #fff8f0;">
                            <div style="font-weight: bold; font-size: 12px;">${count}×${denom.value}€</div>
                            <div style="font-size: 11px; color: #666;">${total.toFixed(2)}€</div>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                  <div style="margin-top: 10px; text-align: center; font-weight: 600; color: #2c3e50;">
                    Total Monedas: ${DENOMINATIONS
                      .filter(denom => parseFloat(denom.value) < 5 && globalBreakdown[denom.value])
                      .reduce((sum, denom) => sum + (globalBreakdown[denom.value] || 0), 0)} unidades
                  </div>
                  <div style="text-align: center; font-size: 14px; font-weight: 700; color: #f39c12;">
                    ${DENOMINATIONS
                      .filter(denom => parseFloat(denom.value) < 5 && globalBreakdown[denom.value])
                      .reduce((sum, denom) => sum + ((globalBreakdown[denom.value] || 0) * parseFloat(denom.value)), 0)
                      .toFixed(2)}€
                  </div>
                </div>
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
                📅 ${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div class="date-content">
                <div class="summary-grid" style="margin-bottom: 20px;">
                  <div class="summary-item neutral">
                    <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 5px;">Vales del Día</div>
                    <div class="amount">€${dateVales.toFixed(2)}</div>
                  </div>
                  <div class="summary-item neutral">
                    <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 5px;">Contado del Día</div>
                    <div class="amount">€${dateBreakdown.toFixed(2)}</div>
                  </div>
                  <div class="summary-item ${dateDifference === 0 ? 'neutral' : dateDifference > 0 ? 'positive' : 'negative'}">
                    <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 5px;">Diferencia</div>
                    <div class="amount">${dateDifference > 0 ? '+' : ''}€${dateDifference.toFixed(2)}</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Trabajador</th>
                      <th>Turno</th>
                      <th>Vale</th>
                      <th>Contado</th>
                      <th>Diferencia</th>
                      <th>Desglose</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dateCashBoxes.map((box) => {
                      const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                      const boxDiff = boxTotal - (Number(box.valeAmount) || 0);
                      const status = boxDiff === 0 ? 'ok' : 'warning';
                      
                      return `
                        <tr>
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