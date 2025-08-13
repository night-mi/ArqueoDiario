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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vales</p>
                <p className="text-2xl font-bold">€{totalVales.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contado</p>
                <p className="text-2xl font-bold">€{totalBreakdown.toFixed(2)}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diferencia</p>
                <p className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                </p>
              </div>
              <div className={`p-2 rounded-full ${difference === 0 ? 'bg-green-100' : difference > 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <span className="text-xl">{difference === 0 ? '✓' : difference > 0 ? '+' : '-'}</span>
              </div>
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
                {validCashBoxes.map((box, index) => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                  const isOk = Math.abs(boxDifference) < 0.01;

                  return (
                    <tr key={index}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{new Date(box.date).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>{box.workerName}</TableCell>
                      <TableCell>
                        <Badge variant={box.shift === 1 ? "default" : "secondary"}>
                          {box.shift === 1 ? 'Mañana' : 'Tarde'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">€{(Number(box.valeAmount) || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">€{boxTotal.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-mono ${
                        isOk ? 'text-green-600' : boxDifference > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {boxDifference > 0 ? '+' : ''}€{boxDifference.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isOk ? "default" : "destructive"}>
                          {isOk ? '✓ OK' : '⚠ Diff'}
                        </Badge>
                      </TableCell>
                    </tr>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vales</p>
                  <p className="text-2xl font-bold">€{totalVales.toFixed(2)}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contado</p>
                  <p className="text-2xl font-bold">€{totalBreakdown.toFixed(2)}</p>
                </div>
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Diferencia</p>
                  <p className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
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