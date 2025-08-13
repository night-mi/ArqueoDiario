import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { calculateBreakdownTotal } from "@/lib/denominations";

export default function StepValidation() {
  const { state, dispatch } = useReconciliation();

  const handlePrevious = () => {
    dispatch({ type: "SET_CURRENT_CASH_BOX_INDEX", payload: state.totalCashBoxes - 1 });
    dispatch({ type: "SET_CURRENT_STEP", payload: 2 });
  };

  const handleContinue = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: 4 });
  };

  const calculateTotals = () => {
    const totalVales = state.cashBoxes.reduce((sum, box) => sum + box.valeAmount, 0);
    const totalBreakdown = state.cashBoxes.reduce((sum, box) => 
      sum + calculateBreakdownTotal(box.breakdown), 0
    );
    const difference = totalBreakdown - totalVales;

    return { totalVales, totalBreakdown, difference };
  };

  const { totalVales, totalBreakdown, difference } = calculateTotals();
  const hasDiscrepancies = Math.abs(difference) > 0.01;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Validación de Datos</h3>
              <p className="text-gray-600">Revisa todos los datos antes de generar el informe final.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Vales</p>
                    <p className="text-xl font-bold text-blue-600">€{totalVales.toFixed(2)}</p>
                  </div>
                  <i className="fas fa-receipt text-blue-400 text-xl"></i>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Total Arqueo</p>
                    <p className="text-xl font-bold text-green-600">€{totalBreakdown.toFixed(2)}</p>
                  </div>
                  <i className="fas fa-coins text-green-400 text-xl"></i>
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                hasDiscrepancies 
                  ? "bg-orange-50 border-orange-200" 
                  : "bg-green-50 border-green-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      hasDiscrepancies ? "text-orange-900" : "text-green-900"
                    }`}>
                      Diferencia
                    </p>
                    <p className={`text-xl font-bold ${
                      hasDiscrepancies ? "text-orange-600" : "text-green-600"
                    }`}>
                      {difference >= 0 ? "+" : ""}€{difference.toFixed(2)}
                    </p>
                  </div>
                  {hasDiscrepancies ? (
                    <AlertTriangle className="text-orange-400 h-6 w-6" />
                  ) : (
                    <CheckCircle className="text-green-400 h-6 w-6" />
                  )}
                </div>
              </div>
            </div>

            {/* Status Alert */}
            {hasDiscrepancies ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="text-orange-600 mt-0.5 h-5 w-5" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-900 mb-1">Diferencias Detectadas</h4>
                    <p className="text-sm text-orange-700">
                      Hay una diferencia de €{Math.abs(difference).toFixed(2)} entre los vales y el arqueo. 
                      Revisa los datos antes de continuar.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-600 mt-0.5 h-5 w-5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900 mb-1">Arqueo Balanceado</h4>
                    <p className="text-sm text-green-700">
                      Todos los datos coinciden perfectamente. El arqueo está listo para finalizar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Boxes Summary */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Resumen de Botes</h4>
              <div className="space-y-3">
                {state.cashBoxes.map((cashBox, index) => {
                  const breakdownTotal = calculateBreakdownTotal(cashBox.breakdown);
                  const boxDifference = breakdownTotal - cashBox.valeAmount;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">Bote {index + 1}</Badge>
                          <span className="text-sm text-gray-600">{cashBox.date}</span>
                          <span className="text-sm font-medium">{cashBox.workerName}</span>
                          <Badge variant={cashBox.shift === 1 ? "default" : "secondary"}>
                            Turno {cashBox.shift}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Vale: €{cashBox.valeAmount.toFixed(2)} | Arqueo: €{breakdownTotal.toFixed(2)}
                          </p>
                          <p className={`text-sm font-medium ${
                            Math.abs(boxDifference) > 0.01 ? "text-orange-600" : "text-green-600"
                          }`}>
                            Diferencia: {boxDifference >= 0 ? "+" : ""}€{boxDifference.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Editar
              </Button>
              <Button onClick={handleContinue}>
                Generar Informe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
                <span className="font-medium text-primary">75%</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}