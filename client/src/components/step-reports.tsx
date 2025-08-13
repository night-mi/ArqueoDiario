import { useState } from "react";
import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ExternalLink, FileText, Calendar, Calculator, Printer, Save, History } from "lucide-react";
import { DENOMINATIONS, calculateBreakdownTotal } from "@/lib/denominations";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
// PDF functionality removed - using window reports instead

export default function StepReports() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState("by-boxes");
  const queryClient = useQueryClient();

  const handlePrevious = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: 4 });
  };

  const handleReset = () => {
    if (confirm("¿Deseas iniciar un nuevo arqueo? Se perderán todos los datos actuales.")) {
      dispatch({ type: "RESET" });
    }
  };

  // Save reconciliation mutation (updated to also save reports)
  const saveReconciliationMutation = useMutation({
    mutationFn: async () => {
      const { validCashBoxes, totalVales, totalBreakdown, difference } = calculateTotals();
      
      if (validCashBoxes.length === 0) {
        throw new Error("No hay botes válidos para guardar");
      }

      if (!state.auditorName.trim()) {
        throw new Error("Debe seleccionar un auditor antes de guardar");
      }

      // Create session data
      const sessionData = {
        sessionDate: new Date().toISOString().split('T')[0], // Today's date
        auditorName: state.auditorName,
        totalCashBoxes: validCashBoxes.length,
        totalVales: totalVales.toString(),
        totalBreakdown: totalBreakdown.toString(),
        difference: difference.toString(),
        status: "completed" as const,
        notes: `Arqueo completado con ${validCashBoxes.length} botes`
      };

      // Create cash boxes data
      const cashBoxesData = validCashBoxes.map(box => ({
        date: box.date,
        workerName: box.workerName,
        shift: box.shift,
        valeAmount: box.valeAmount.toString(),
        breakdown: JSON.stringify(box.breakdown || {}),
        totalBreakdown: calculateBreakdownTotal(box.breakdown || {}).toString()
      }));

      // Save the reconciliation first
      const response = await fetch('/api/history/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionData,
          cashBoxes: cashBoxesData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save reconciliation');
      }

      const result = await response.json();
      const sessionId = result.session.id;

      // Generate and save both reports (we'll use the existing functions for now)
      const byCashBoxReport = generateReportByBoxes(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
      const byDateReport = generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);

      // Save by cash box report
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reportType: 'by_cash_box',
          reportTitle: `Informe por Botes - ${sessionData.sessionDate}`,
          reportContent: byCashBoxReport
        })
      });

      // Save by date report  
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reportType: 'by_date',
          reportTitle: `Informe por Fecha - ${sessionData.sessionDate}`,
          reportContent: byDateReport
        })
      });

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Arqueo guardado",
        description: "El arqueo se ha guardado correctamente en el historial.",
      });
      // Invalidate history queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveReconciliation = () => {
    const { validCashBoxes } = calculateTotals();
    
    if (validCashBoxes.length === 0) {
      toast({
        title: "No hay datos para guardar",
        description: "Completa al menos un bote antes de guardar el arqueo.",
        variant: "destructive"
      });
      return;
    }

    if (!state.auditorName.trim()) {
      toast({
        title: "Falta auditor",
        description: "Debe seleccionar un auditor antes de guardar el arqueo.",
        variant: "destructive"
      });
      return;
    }

    if (confirm("¿Deseas guardar este arqueo en el historial?")) {
      saveReconciliationMutation.mutate();
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
          totalBreakdown[denom] = (totalBreakdown[denom] || 0) + (count || 0);
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
          .info-card label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; }
          .info-card value { font-size: 16px; font-weight: 600; color: #2c3e50; }
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
          .breakdown { font-size: 11px; line-height: 1.4; }
          .breakdown-item { margin: 2px 0; }
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
              <div>Estación de Servicio El Alto</div>
              <div>SAVICMASA SL - CIF: B80548027</div>
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
                </tr>
              </thead>
              <tbody>
                ${cashBoxes.map((box, index) => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                  const isOk = Math.abs(boxDifference) < 0.01;
                  
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
    // Group cash boxes by date
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.4; 
            color: #2c3e50;
            background: #f8f9fa;
            padding: 20px;
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
            background: linear-gradient(135deg, #27ae60 0%, #2c3e50 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
          }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header .company { font-size: 16px; opacity: 0.9; }
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
            font-weight: 600; 
            color: #2c3e50; 
            margin-bottom: 10px; 
            font-size: 16px;
          }
          .worker-line { 
            display: flex; 
            justify-content: space-between; 
            padding: 6px 0; 
            border-bottom: 1px solid #e9ecef;
          }
          .worker-line:last-child { border-bottom: none; }
          .worker-name { font-weight: 500; }
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
              <div>Estación de Servicio El Alto</div>
              <div>SAVICMASA SL - CIF: B80548027</div>
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
                        ${shift1Boxes.map(box => {
                          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                          const valeAmount = Number(box.valeAmount) || 0;
                          const boxDiff = boxTotal - valeAmount;
                          return `
                            <div class="worker-line">
                              <span class="worker-name">${box.workerName}</span>
                              <span class="amounts">Vale: €${valeAmount.toFixed(2)} | Contado: €${boxTotal.toFixed(2)} | <span style="color: ${boxDiff >= 0 ? '#27ae60' : '#e74c3c'}">${boxDiff > 0 ? '+' : ''}€${boxDiff.toFixed(2)}</span></span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                    
                    ${shift2Boxes.length > 0 ? `
                      <div class="shift-section">
                        <div class="shift-title">🌙 Turno Tarde (${shift2Boxes.length} botes)</div>
                        ${shift2Boxes.map(box => {
                          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                          const valeAmount = Number(box.valeAmount) || 0;
                          const boxDiff = boxTotal - valeAmount;
                          return `
                            <div class="worker-line">
                              <span class="worker-name">${box.workerName}</span>
                              <span class="amounts">Vale: €${valeAmount.toFixed(2)} | Contado: €${boxTotal.toFixed(2)} | <span style="color: ${boxDiff >= 0 ? '#27ae60' : '#e74c3c'}">${boxDiff > 0 ? '+' : ''}€${boxDiff.toFixed(2)}</span></span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                    
                    <div class="date-totals">
                      <div class="totals-grid">
                        <div class="total-item">
                          <div class="label">Vales del Día</div>
                          <div class="value">€${dateTotalVales.toFixed(2)}</div>
                        </div>
                        <div class="total-item">
                          <div class="label">Arqueo del Día</div>
                          <div class="value">€${dateTotalArqueo.toFixed(2)}</div>
                        </div>
                        <div class="total-item">
                          <div class="label">Diferencia</div>
                          <div class="value" style="color: ${dateDifference >= 0 ? '#27ae60' : '#e74c3c'}">${dateDifference > 0 ? '+' : ''}€${dateDifference.toFixed(2)}</div>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Total Vales</p>
              <p className="text-2xl font-bold text-blue-600">€{totalVales.toFixed(2)}</p>
            </div>
            <FileText className="text-blue-400 h-8 w-8" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Total Arqueo</p>
              <p className="text-2xl font-bold text-green-600">€{totalBreakdown.toFixed(2)}</p>
            </div>
            <Calculator className="text-green-400 h-8 w-8" />
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${
          Math.abs(difference) > 0.01 
            ? "bg-orange-50 border-orange-200" 
            : "bg-green-50 border-green-200"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                Math.abs(difference) > 0.01 ? "text-orange-900" : "text-green-900"
              }`}>Diferencia</p>
              <p className={`text-2xl font-bold ${
                Math.abs(difference) > 0.01 ? "text-orange-600" : "text-green-600"
              }`}>€{difference.toFixed(2)}</p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              Math.abs(difference) > 0.01 ? "bg-orange-200" : "bg-green-200"
            }`}>
              {Math.abs(difference) > 0.01 ? "⚠" : "✓"}
            </div>
          </div>
        </div>
      </div>

      {/* Cash Boxes Table */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalle por Botes</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bote</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Vale (€)</TableHead>
                  <TableHead>Arqueo (€)</TableHead>
                  <TableHead>Desglose del Arqueo</TableHead>
                  <TableHead>Diferencia (€)</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validCashBoxes.map((box, index) => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                  const hasDiscrepancy = Math.abs(boxDifference) > 0.01;
                  
                  // Get breakdown with only non-zero values
                  const nonZeroBreakdown = Object.entries(box.breakdown || {})
                    .filter(([_, count]) => (count || 0) > 0)
                    .map(([denomination, count]) => {
                      const denom = DENOMINATIONS.find(d => d.value === denomination);
                      const value = (count || 0) * parseFloat(denomination);
                      return {
                        label: denom?.label || denomination,
                        count: count || 0,
                        value: value
                      };
                    })
                    .sort((a, b) => {
                      const valueA = parseFloat(a.label.replace('€', '').replace(' cént.', ''));
                      const valueB = parseFloat(b.label.replace('€', '').replace(' cént.', ''));
                      return valueB - valueA;
                    });
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{box.date}</TableCell>
                      <TableCell>{box.workerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {box.shift === 1 ? "Mañana" : "Tarde"}
                        </Badge>
                      </TableCell>
                      <TableCell>€{(Number(box.valeAmount) || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">€{boxTotal.toFixed(2)}</TableCell>
                      <TableCell className="max-w-xs">
                        {nonZeroBreakdown.length > 0 ? (
                          <div className="text-xs space-y-1">
                            {nonZeroBreakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-gray-600">{item.label}:</span>
                                <span className="font-medium">{item.count} = €{item.value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin desglose</span>
                        )}
                      </TableCell>
                      <TableCell className={hasDiscrepancy ? "text-orange-600" : "text-green-600"}>
                        €{boxDifference.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={hasDiscrepancy ? "destructive" : "default"}>
                          {hasDiscrepancy ? "Con diferencias" : "Correcto"}
                        </Badge>
                      </TableCell>
                    </TableRow>
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
    // Group cash boxes by date
    const groupedByDate: Record<string, any[]> = {};
    validCashBoxes.forEach(box => {
      if (!groupedByDate[box.date]) {
        groupedByDate[box.date] = [];
      }
      groupedByDate[box.date].push(box);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    return (
      <div className="space-y-6">
        {/* Global Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Informe Consolidado por Fechas
                </h4>
                <p className="text-sm text-gray-600">
                  Responsable: {state.auditorName} | {validCashBoxes.length} botes procesados | {sortedDates.length} fechas
                </p>
              </div>
              <Calendar className="text-primary h-8 w-8" />
            </div>

            {/* Global Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Botes</p>
                <p className="text-xl font-bold text-gray-900">{validCashBoxes.length}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Total Vales</p>
                <p className="text-xl font-bold text-blue-900">€{totalVales.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Total Arqueo</p>
                <p className="text-xl font-bold text-green-900">€{totalBreakdown.toFixed(2)}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                Math.abs(difference) > 0.01 ? "bg-orange-50" : "bg-green-50"
              }`}>
                <p className={`text-sm ${Math.abs(difference) > 0.01 ? "text-orange-600" : "text-green-600"}`}>
                  Diferencia Total
                </p>
                <p className={`text-xl font-bold ${Math.abs(difference) > 0.01 ? "text-orange-900" : "text-green-900"}`}>
                  €{difference.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date-by-Date Breakdown */}
        {sortedDates.map(date => {
          const dateCashBoxes = groupedByDate[date];
          
          // Group by shift
          const shift1Boxes = dateCashBoxes.filter(box => box.shift === 1);
          const shift2Boxes = dateCashBoxes.filter(box => box.shift === 2);
          
          // Calculate totals for this date
          const dateTotalVales = dateCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
          const dateTotalArqueo = dateCashBoxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0);
          const dateDifference = dateTotalArqueo - dateTotalVales;
          
          // Calculate breakdown for this date (only non-zero values)
          const dateBreakdown: Record<string, number> = {};
          dateCashBoxes.forEach(box => {
            if (box.breakdown) {
              Object.entries(box.breakdown).forEach(([denom, count]) => {
                const numCount = Number(count) || 0;
                if (numCount > 0) {
                  dateBreakdown[denom] = (dateBreakdown[denom] || 0) + numCount;
                }
              });
            }
          });

          const nonZeroDateBreakdown = Object.entries(dateBreakdown)
            .filter(([_, count]) => count > 0)
            .map(([denomination, count]) => {
              const denom = DENOMINATIONS.find(d => d.value === denomination);
              const value = count * parseFloat(denomination);
              return {
                label: denom?.label || denomination,
                count,
                value,
                denomination: parseFloat(denomination)
              };
            })
            .sort((a, b) => b.denomination - a.denomination);

          return (
            <Card key={date} className="border-2 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
                  FECHA: {date}
                </h3>
                
                {/* Shift 1 */}
                {shift1Boxes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">
                      TURNO 1 (Mañana) ({shift1Boxes.length} botes)
                    </h4>
                    <div className="ml-4 space-y-2">
                      {shift1Boxes.map((box, index) => {
                        const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                        const valeAmount = Number(box.valeAmount) || 0;
                        return (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{box.workerName}</span>: 
                            <span className="ml-2">Vale €{valeAmount.toFixed(2)} + Arqueo €{boxTotal.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="font-semibold text-blue-700 mt-2 pt-2 border-t border-blue-200">
                        TOTAL TURNO 1: Vales €{shift1Boxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0).toFixed(2)} | 
                        Arqueo €{shift1Boxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shift 2 */}
                {shift2Boxes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-orange-800 mb-3">
                      TURNO 2 (Tarde) ({shift2Boxes.length} botes)
                    </h4>
                    <div className="ml-4 space-y-2">
                      {shift2Boxes.map((box, index) => {
                        const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                        const valeAmount = Number(box.valeAmount) || 0;
                        return (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{box.workerName}</span>: 
                            <span className="ml-2">Vale €{valeAmount.toFixed(2)} + Arqueo €{boxTotal.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="font-semibold text-orange-700 mt-2 pt-2 border-t border-orange-200">
                        TOTAL TURNO 2: Vales €{shift2Boxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0).toFixed(2)} | 
                        Arqueo €{shift2Boxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Total */}
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="font-bold text-lg text-gray-900">
                    TOTAL {date}: Vales €{dateTotalVales.toFixed(2)} | Arqueo €{dateTotalArqueo.toFixed(2)} | 
                    Diferencia €{dateDifference.toFixed(2)}
                  </div>
                </div>

                {/* Date Breakdown - Only fields with values */}
                {nonZeroDateBreakdown.length > 0 && (
                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-gray-800 mb-3">Arqueo Combinado - {date}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {nonZeroDateBreakdown.map((item, index) => (
                        <div key={index} className="bg-green-50 p-2 rounded text-sm">
                          <div className="font-medium text-green-800">{item.label}</div>
                          <div className="text-green-600">{item.count} unidades = €{item.value.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 font-semibold text-green-800">
                      Total Arqueo Combinado: €{nonZeroDateBreakdown.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Informes de Arqueo</h3>
          <p className="text-gray-600">Selecciona el tipo de informe que deseas generar</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            type="button"
            variant="outline"
            onClick={handlePrevious}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <Button 
            onClick={handleSaveReconciliation} 
            disabled={saveReconciliationMutation.isPending}
            variant="default"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveReconciliationMutation.isPending ? "Guardando..." : "Guardar Arqueo"}
          </Button>

          <Link href="/history">
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              Ver Historial
            </Button>
          </Link>
          
          <Button onClick={handleReset} variant="outline">
            Nuevo Arqueo
          </Button>
        </div>
      </div>

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-boxes">Informe por Botes</TabsTrigger>
          <TabsTrigger value="by-date">Informe por Fecha</TabsTrigger>
        </TabsList>

        <TabsContent value="by-boxes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-800">Resumen por Botes Individuales</h4>
            <div className="flex gap-2">
              <Button onClick={() => handlePrint("boxes")} size="sm" variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={() => handleOpenReport("boxes")} size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Informe
              </Button>
            </div>
          </div>
          {renderByBoxesReport()}
        </TabsContent>

        <TabsContent value="by-date" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-800">Informe Consolidado por Fecha</h4>
            <div className="flex gap-2">
              <Button onClick={() => handlePrint("date")} size="sm" variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={() => handleOpenReport("date")} size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Informe
              </Button>
            </div>
          </div>
          {renderByDateReport()}
        </TabsContent>
      </Tabs>
    </div>
  );
}