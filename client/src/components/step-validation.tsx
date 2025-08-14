import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { calculateBreakdownTotal, DENOMINATIONS } from "@/lib/denominations";

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
    const validCashBoxes = state.cashBoxes.filter(box => box.date && box.workerName);
    const totalVales = validCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
    const totalBreakdown = validCashBoxes.reduce((sum, box) => 
      sum + calculateBreakdownTotal(box.breakdown || {}), 0
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

            {/* Summary Cards with Modern Gradient Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Vales</p>
                  <p className="text-2xl font-bold">€{totalVales.toFixed(2)}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <p className="text-emerald-100 text-sm font-medium mb-1">Total Arqueo</p>
                  <p className="text-2xl font-bold">€{totalBreakdown.toFixed(2)}</p>
                </div>
              </div>

              <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${
                hasDiscrepancies 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                  : "bg-gradient-to-br from-green-400 to-emerald-500"
              }`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      hasDiscrepancies ? "text-amber-100" : "text-green-100"
                    }`}>
                      Diferencia
                    </p>
                    <p className="text-2xl font-bold">
                      {difference >= 0 ? "+" : ""}€{difference.toFixed(2)}
                    </p>
                  </div>
                  {hasDiscrepancies ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
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

            {/* Cash Boxes Summary with Breakdown Details */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></span>
                Resumen Detallado de Botes
              </h4>
              <div className="space-y-6">
                {state.cashBoxes.filter(box => box.date && box.workerName).map((cashBox, index) => {
                  const breakdownTotal = calculateBreakdownTotal(cashBox.breakdown || {});
                  const boxDifference = breakdownTotal - (Number(cashBox.valeAmount) || 0);
                  
                  // Get breakdown details with values > 0
                  const bills = DENOMINATIONS.filter(d => d.type === "bill" && (cashBox.breakdown?.[d.value] || 0) > 0);
                  const coins = DENOMINATIONS.filter(d => d.type === "coin" && (cashBox.breakdown?.[d.value] || 0) > 0);
                  
                  return (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-l-4 border-purple-400 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Bote {index + 1}
                          </div>
                          <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{cashBox.date}</div>
                          <div className="text-sm font-semibold text-gray-800">{cashBox.workerName}</div>
                          <div className={`text-sm px-3 py-1 rounded-full ${
                            cashBox.shift === 1 
                              ? "bg-orange-50 text-orange-600" 
                              : "bg-indigo-50 text-indigo-600"
                          }`}>
                            {cashBox.shift === 1 ? "🌅 Mañana" : "🌙 Tarde"}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Vale: €{(Number(cashBox.valeAmount) || 0).toFixed(2)}</span>
                            {" | "}
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Arqueo: €{breakdownTotal.toFixed(2)}</span>
                          </p>
                          <p className={`text-sm font-bold px-2 py-1 rounded ${
                            Math.abs(boxDifference) > 0.01 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            Diferencia: {boxDifference >= 0 ? "+" : ""}€{boxDifference.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Details */}
                      {(bills.length > 0 || coins.length > 0) && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            💰 Desglose del Arqueo
                          </h5>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="font-mono text-sm text-gray-800 leading-relaxed">
                              {DENOMINATIONS
                                .filter(denom => (cashBox.breakdown?.[denom.value] || 0) > 0)
                                .map(denom => {
                                  const count = cashBox.breakdown?.[denom.value] || 0;
                                  const total = count * parseFloat(denom.value);
                                  return `${count}x${denom.value}=${total.toFixed(2)}€`;
                                })
                                .join('; ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={handlePrevious} className="bg-white hover:bg-gray-50 border-gray-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Editar
              </Button>
              <Button onClick={handleContinue} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg">
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