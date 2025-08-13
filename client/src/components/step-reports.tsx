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

  // Save reconciliation mutation
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
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar el arqueo');
      }

      return response.json();
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

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana del informe. Verifica que no esté bloqueada por el navegador.",
        variant: "destructive"
      });
      return;
    }

    let htmlContent = '';
    
    if (reportType === 'boxes') {
      htmlContent = generateReportByBoxes(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
    } else {
      htmlContent = generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
    }

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    reportWindow.focus();
  };

  const handlePrint = (reportType: 'boxes' | 'date') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.",
        variant: "destructive"
      });
      return;
    }

    const { validCashBoxes, totalVales, totalBreakdown, difference } = calculateTotals();
    
    if (validCashBoxes.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay botes válidos para imprimir el informe.",
        variant: "destructive"
      });
      printWindow.close();
      return;
    }

    let htmlContent = '';
    
    if (reportType === 'boxes') {
      htmlContent = generateReportByBoxes(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
    } else {
      htmlContent = generateReportByDate(validCashBoxes, totalVales, totalBreakdown, difference, state.auditorName);
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateReportByBoxes = (cashBoxes: any[], totalVales: number, totalBreakdown: number, difference: number, auditorName: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe de Arqueo por Botes</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 30px; }
          h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
          .header-info { margin-bottom: 20px; }
          .summary { background-color: #f5f5f5; padding: 15px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .total-row { background-color: #e8f4f8; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          .print-button { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background-color: #2563eb; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .print-button:hover { background-color: #1d4ed8; }
          @media print { 
            body { margin: 0; } 
            .print-button { display: none; }
          }
        </style>
        <script>
          function printReport() {
            window.print();
          }
        </script>
      </head>
      <body>
        <button class="print-button" onclick="printReport()">🖨️ Imprimir</button>
        <h1>INFORME DE ARQUEO POR BOTES</h1>
        
        <div class="header-info">
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          <p><strong>Responsable:</strong> ${auditorName}</p>
          <p><strong>Total de Botes:</strong> ${cashBoxes.length}</p>
        </div>

        <div class="summary">
          <h2>RESUMEN GENERAL</h2>
          <p><strong>Total Vales:</strong> €${totalVales.toFixed(2)}</p>
          <p><strong>Total Arqueo:</strong> €${totalBreakdown.toFixed(2)}</p>
          <p><strong>Diferencia:</strong> €${difference.toFixed(2)}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Bote</th>
              <th>Fecha</th>
              <th>Trabajador</th>
              <th>Turno</th>
              <th>Vale</th>
              <th>Arqueo</th>
              <th>Desglose del Arqueo</th>
              <th>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${cashBoxes.map((box, index) => {
              const boxTotal = calculateBreakdownTotal(box.breakdown || {});
              const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
              
              // Get breakdown with only non-zero values for print
              const nonZeroBreakdown = Object.entries(box.breakdown || {})
                .filter(([_, count]) => (Number(count) || 0) > 0)
                .map(([denomination, count]) => {
                  const denom = DENOMINATIONS.find(d => d.value === denomination);
                  const value = (Number(count) || 0) * parseFloat(denomination);
                  return `${denom?.label || denomination}: ${count} = €${value.toFixed(2)}`;
                }).join('<br>');
              
              return `
                <tr>
                  <td>Bote ${index + 1}</td>
                  <td>${box.date}</td>
                  <td>${box.workerName}</td>
                  <td>${box.shift === 1 ? 'Mañana' : 'Tarde'}</td>
                  <td>€${(Number(box.valeAmount) || 0).toFixed(2)}</td>
                  <td>€${boxTotal.toFixed(2)}</td>
                  <td style="font-size: 11px;">${nonZeroBreakdown || 'Sin desglose'}</td>
                  <td>€${boxDifference.toFixed(2)}</td>
                  <td>${Math.abs(boxDifference) > 0.01 ? 'Con diferencias' : 'Correcto'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
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

    let dateContent = '';
    
    sortedDates.forEach(date => {
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

      dateContent += `
        <div class="date-section">
          <h3>FECHA: ${date}</h3>
      `;
      
      // Shift 1
      if (shift1Boxes.length > 0) {
        dateContent += `<h4>TURNO 1 (Mañana) (${shift1Boxes.length} botes):</h4><ul>`;
        shift1Boxes.forEach((box) => {
          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
          const valeAmount = Number(box.valeAmount) || 0;
          dateContent += `<li><strong>${box.workerName}</strong>: Vale €${valeAmount.toFixed(2)} + Arqueo €${boxTotal.toFixed(2)}</li>`;
        });
        const shift1TotalVales = shift1Boxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
        const shift1TotalArqueo = shift1Boxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0);
        dateContent += `</ul><p><strong>TOTAL TURNO 1: Vales €${shift1TotalVales.toFixed(2)} | Arqueo €${shift1TotalArqueo.toFixed(2)}</strong></p>`;
      }
      
      // Shift 2
      if (shift2Boxes.length > 0) {
        dateContent += `<h4>TURNO 2 (Tarde) (${shift2Boxes.length} botes):</h4><ul>`;
        shift2Boxes.forEach((box) => {
          const boxTotal = calculateBreakdownTotal(box.breakdown || {});
          const valeAmount = Number(box.valeAmount) || 0;
          dateContent += `<li><strong>${box.workerName}</strong>: Vale €${valeAmount.toFixed(2)} + Arqueo €${boxTotal.toFixed(2)}</li>`;
        });
        const shift2TotalVales = shift2Boxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
        const shift2TotalArqueo = shift2Boxes.reduce((sum, box) => sum + calculateBreakdownTotal(box.breakdown || {}), 0);
        dateContent += `</ul><p><strong>TOTAL TURNO 2: Vales €${shift2TotalVales.toFixed(2)} | Arqueo €${shift2TotalArqueo.toFixed(2)}</strong></p>`;
      }
      
      dateContent += `<p class="date-total"><strong>TOTAL ${date}: Vales €${dateTotalVales.toFixed(2)} | Arqueo €${dateTotalArqueo.toFixed(2)} | Diferencia €${dateDifference.toFixed(2)}</strong></p>`;
      
      // Add breakdown for this date
      if (nonZeroDateBreakdown.length > 0) {
        dateContent += `<div class="breakdown-section"><h5>Arqueo Combinado - ${date}</h5><ul>`;
        nonZeroDateBreakdown.forEach(item => {
          dateContent += `<li>${item.label}: ${item.count} unidades = €${item.value.toFixed(2)}</li>`;
        });
        dateContent += `</ul><p><strong>Total Arqueo Combinado: €${nonZeroDateBreakdown.reduce((sum, item) => sum + item.value, 0).toFixed(2)}</strong></p></div>`;
      }
      
      dateContent += `</div>`;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe de Arqueo por Fecha</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 30px; }
          h2, h3 { border-bottom: 2px solid #333; padding-bottom: 5px; }
          h4 { color: #555; margin: 15px 0 5px 20px; }
          .header-info { margin-bottom: 20px; }
          .date-section { margin: 20px 0; padding: 15px; border: 2px solid #2563eb; }
          .date-total { background-color: #e8f4f8; padding: 10px; font-weight: bold; }
          .breakdown-section { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc; }
          h5 { color: #059669; margin-bottom: 10px; }
          ul { margin: 5px 0 10px 40px; }
          li { margin: 5px 0; }
          .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          .print-button { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background-color: #2563eb; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .print-button:hover { background-color: #1d4ed8; }
          @media print { 
            body { margin: 0; } 
            .print-button { display: none; }
          }
        </style>
        <script>
          function printReport() {
            window.print();
          }
        </script>
      </head>
      <body>
        <button class="print-button" onclick="printReport()">🖨️ Imprimir</button>
        <h1>INFORME DE ARQUEO POR FECHA</h1>
        
        <div class="header-info">
          <p><strong>Responsable:</strong> ${auditorName}</p>
          <p><strong>Botes Procesados:</strong> ${cashBoxes.length}</p>
          <p><strong>Fechas incluidas:</strong> ${sortedDates.join(', ')}</p>
          <p><strong>Total General:</strong> Vales €${totalVales.toFixed(2)} | Arqueo €${totalBreakdown.toFixed(2)} | Diferencia €${difference.toFixed(2)}</p>
        </div>

        <h2>DESGLOSE POR FECHAS Y TURNOS</h2>
        ${dateContent}

        <div class="footer">
          <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
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