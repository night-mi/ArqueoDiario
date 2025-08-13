import { useState } from "react";
import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText, Calendar, Calculator } from "lucide-react";
import { DENOMINATIONS, calculateBreakdownTotal } from "@/lib/denominations";
import { useToast } from "@/hooks/use-toast";
import { generateByBoxesPDF, generateByDatePDF, type PDFReportData } from "@/lib/pdf-generator";

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
          totalBreakdown[denom] = (totalBreakdown[denom] || 0) + (count || 0);
        });
      }
    });

    return totalBreakdown;
  };

  const handleExportPDF = (reportType: 'boxes' | 'date') => {
    const reportData: PDFReportData = {
      date: validCashBoxes[0]?.date || new Date().toISOString().split('T')[0],
      auditorName: state.auditorName,
      cashBoxes: validCashBoxes,
      totalVales,
      totalBreakdown,
      difference
    };

    try {
      if (reportType === 'boxes') {
        generateByBoxesPDF(reportData);
        toast({
          title: "PDF generado",
          description: "El informe por botes se ha descargado correctamente.",
        });
      } else {
        generateByDatePDF(reportData);
        toast({
          title: "PDF generado", 
          description: "El informe por fecha se ha descargado correctamente.",
        });
      }
    } catch (error) {
      toast({
        title: "Error al generar PDF",
        description: "Hubo un problema al generar el informe. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
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
                  <TableHead>Diferencia (€)</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validCashBoxes.map((box, index) => {
                  const boxTotal = calculateBreakdownTotal(box.breakdown || {});
                  const boxDifference = boxTotal - (Number(box.valeAmount) || 0);
                  const hasDiscrepancy = Math.abs(boxDifference) > 0.01;
                  
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
                      <TableCell>€{boxTotal.toFixed(2)}</TableCell>
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

  const renderByDateReport = () => (
    <div className="space-y-6">
      {/* Date Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                Informe por Fecha: {validCashBoxes[0]?.date || new Date().toISOString().split('T')[0]}
              </h4>
              <p className="text-sm text-gray-600">
                Responsable: {state.auditorName} | {validCashBoxes.length} botes procesados
              </p>
            </div>
            <Calendar className="text-primary h-8 w-8" />
          </div>

          {/* Totals Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Botes</p>
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
                Diferencia
              </p>
              <p className={`text-xl font-bold ${Math.abs(difference) > 0.01 ? "text-orange-900" : "text-green-900"}`}>
                €{difference.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Desglose Total de Denominaciones
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bills */}
            <div>
              <h5 className="text-md font-medium text-gray-800 mb-3">Billetes</h5>
              <div className="space-y-2">
                {bills.map((bill) => {
                  const count = globalBreakdown[bill.value] || 0;
                  const value = count * parseFloat(bill.value);
                  
                  return (
                    <div key={bill.value} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{bill.label}</span>
                      <div className="text-right">
                        <span className="font-medium">{count} unidades</span>
                        <div className="text-sm text-gray-500">€{value.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center py-2 font-semibold border-t-2 border-gray-200">
                  <span>Total Billetes:</span>
                  <span className="text-primary">
                    €{bills.reduce((sum, bill) => 
                      sum + ((globalBreakdown[bill.value] || 0) * parseFloat(bill.value)), 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Coins */}
            <div>
              <h5 className="text-md font-medium text-gray-800 mb-3">Monedas</h5>
              <div className="space-y-2">
                {coins.map((coin) => {
                  const count = globalBreakdown[coin.value] || 0;
                  const value = count * parseFloat(coin.value);
                  
                  return (
                    <div key={coin.value} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{coin.label}</span>
                      <div className="text-right">
                        <span className="font-medium">{count} unidades</span>
                        <div className="text-sm text-gray-500">€{value.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center py-2 font-semibold border-t-2 border-gray-200">
                  <span>Total Monedas:</span>
                  <span className="text-primary">
                    €{coins.reduce((sum, coin) => 
                      sum + ((globalBreakdown[coin.value] || 0) * parseFloat(coin.value)), 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
          <Button onClick={handleReset}>
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
            <Button onClick={() => handleExportPDF("boxes")} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
          {renderByBoxesReport()}
        </TabsContent>

        <TabsContent value="by-date" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-800">Informe Consolidado por Fecha</h4>
            <Button onClick={() => handleExportPDF("date")} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
          {renderByDateReport()}
        </TabsContent>
      </Tabs>
    </div>
  );
}