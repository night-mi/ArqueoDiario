import { useMutation } from "@tanstack/react-query";
import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, Download, Save } from "lucide-react";
import { calculateBreakdownTotal } from "@/lib/denominations";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type InsertCashBox, type InsertReconciliationSession } from "@shared/schema";

export default function StepReport() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();

  const saveReconciliationMutation = useMutation({
    mutationFn: async (data: { session: InsertReconciliationSession; cashBoxes: InsertCashBox[] }) => {
      const response = await apiRequest("POST", "/api/reconciliation", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Arqueo guardado",
        description: "El arqueo se ha guardado correctamente en el sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el arqueo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handlePrevious = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: 3 });
  };

  const calculateTotals = () => {
    const validCashBoxes = state.cashBoxes.filter(box => box.date && box.workerName);
    const totalVales = validCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
    const totalBreakdown = validCashBoxes.reduce((sum, box) => 
      sum + calculateBreakdownTotal(box.breakdown || {}), 0
    );
    const difference = totalBreakdown - totalVales;

    return { totalVales, totalBreakdown, difference };
  };

  const handleSaveReconciliation = () => {
    const { totalVales, totalBreakdown, difference } = calculateTotals();
    
    const session: InsertReconciliationSession = {
      date: state.cashBoxes[0]?.date || new Date().toISOString().split('T')[0],
      auditorName: state.auditorName || "Usuario no especificado",
      totalCashBoxes: state.totalCashBoxes,
      totalVales: totalVales.toString(),
      totalBreakdown: totalBreakdown.toString(),
      difference: difference.toString(),
    };

    const cashBoxes: InsertCashBox[] = state.cashBoxes
      .filter(box => box.date && box.workerName)
      .map(box => ({
        date: box.date,
        workerName: box.workerName,
        shift: box.shift,
        valeAmount: (Number(box.valeAmount) || 0).toString(),
        breakdown: JSON.stringify(box.breakdown || {}),
        totalBreakdown: calculateBreakdownTotal(box.breakdown || {}).toString(),
      }));

    saveReconciliationMutation.mutate({ session, cashBoxes });
  };

  const handleExportPDF = () => {
    toast({
      title: "Función no disponible",
      description: "La exportación a PDF será implementada próximamente.",
    });
  };

  const { totalVales, totalBreakdown, difference } = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Informe de Arqueo Completado</h3>
              <p className="text-gray-600">Resumen completo del arqueo diario procesado.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Vales</p>
                    <p className="text-2xl font-bold text-blue-600">€{totalVales.toFixed(2)}</p>
                  </div>
                  <i className="fas fa-receipt text-blue-400 text-xl"></i>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Total Arqueo</p>
                    <p className="text-2xl font-bold text-green-600">€{totalBreakdown.toFixed(2)}</p>
                  </div>
                  <i className="fas fa-coins text-green-400 text-xl"></i>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-900">Diferencia</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {difference >= 0 ? "+" : ""}€{difference.toFixed(2)}
                    </p>
                  </div>
                  <i className="fas fa-balance-scale text-orange-400 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Detailed Report Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead className="text-right">Vale</TableHead>
                    <TableHead className="text-right">Arqueo</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.cashBoxes.filter(box => box.date && box.workerName).map((cashBox, index) => {
                    const breakdownTotal = calculateBreakdownTotal(cashBox.breakdown || {});
                    const boxDifference = breakdownTotal - (Number(cashBox.valeAmount) || 0);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{cashBox.date}</TableCell>
                        <TableCell>{cashBox.workerName}</TableCell>
                        <TableCell>
                          <Badge variant={cashBox.shift === 1 ? "default" : "secondary"}>
                            Turno {cashBox.shift}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{(Number(cashBox.valeAmount) || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{breakdownTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            Math.abs(boxDifference) > 0.01 ? "text-orange-600" : "text-green-600"
                          }`}>
                            {boxDifference >= 0 ? "+" : ""}€{boxDifference.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">TOTALES</TableCell>
                    <TableCell className="text-right font-bold">€{totalVales.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">€{totalBreakdown.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-orange-600">
                      {difference >= 0 ? "+" : ""}€{difference.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button 
                  onClick={handleSaveReconciliation}
                  disabled={saveReconciliationMutation.isPending}
                  className="bg-accent hover:bg-green-600"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveReconciliationMutation.isPending ? "Guardando..." : "Guardar Arqueo"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Estado Actual</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Botes Configurados:</span>
                <span className="font-medium">{state.totalCashBoxes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Botes Procesados:</span>
                <span className="font-medium">{state.totalCashBoxes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progreso:</span>
                <span className="font-medium text-primary">100%</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            {saveReconciliationMutation.isSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">✓ Arqueo guardado correctamente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}