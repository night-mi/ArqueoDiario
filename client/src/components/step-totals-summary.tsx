import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DENOMINATIONS, calculateBreakdownTotal } from "@/lib/denominations";

export default function StepTotalsSummary() {
  const { state, dispatch } = useReconciliation();

  const handlePrevious = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: 3 });
  };

  const handleContinue = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: 5 }); // Updated to step 5 (reports)
  };

  const calculateTotalBreakdown = () => {
    const validCashBoxes = state.cashBoxes.filter(box => box.date && box.workerName);
    
    // Initialize totals for each denomination
    const totalBreakdown: Record<string, number> = {};
    DENOMINATIONS.forEach(denom => {
      totalBreakdown[denom.value] = 0;
    });

    // Sum up all denominations across all cash boxes
    validCashBoxes.forEach(box => {
      if (box.breakdown) {
        Object.entries(box.breakdown).forEach(([denom, count]) => {
          totalBreakdown[denom] = (totalBreakdown[denom] || 0) + (count || 0);
        });
      }
    });

    return totalBreakdown;
  };

  const totalBreakdown = calculateTotalBreakdown();
  const validCashBoxes = state.cashBoxes.filter(box => box.date && box.workerName);
  const totalVales = validCashBoxes.reduce((sum, box) => sum + (Number(box.valeAmount) || 0), 0);
  const totalArqueo = calculateBreakdownTotal(totalBreakdown);
  const difference = totalArqueo - totalVales;

  const bills = DENOMINATIONS.filter(d => d.type === "bill");
  const coins = DENOMINATIONS.filter(d => d.type === "coin");

  const totalBillsCount = bills.reduce((sum, bill) => sum + (totalBreakdown[bill.value] || 0), 0);
  const totalBillsValue = bills.reduce((sum, bill) => 
    sum + ((totalBreakdown[bill.value] || 0) * parseFloat(bill.value)), 0
  );

  const totalCoinsCount = coins.reduce((sum, coin) => sum + (totalBreakdown[coin.value] || 0), 0);
  const totalCoinsValue = coins.reduce((sum, coin) => 
    sum + ((totalBreakdown[coin.value] || 0) * parseFloat(coin.value)), 0
  );

  const renderDenominationSummary = (denominations: any[], title: string) => (
    <div className="mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {denominations.map((denomination) => {
          const count = totalBreakdown[denomination.value] || 0;
          const value = count * parseFloat(denomination.value);
          
          return (
            <div key={denomination.value} className="bg-gray-50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {denomination.label}
                </div>
                <div className="text-lg font-bold text-primary mb-1">
                  {count}
                </div>
                <div className="text-sm text-gray-500">
                  €{value.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Resumen Total de Denominaciones
              </h3>
              <p className="text-gray-600">
                Desglose completo de todas las monedas y billetes de todos los botes del arqueo.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-900">Total Billetes</p>
                  <p className="text-xl font-bold text-blue-600">{totalBillsCount}</p>
                  <p className="text-sm text-blue-500">€{totalBillsValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-green-900">Total Monedas</p>
                  <p className="text-xl font-bold text-green-600">{totalCoinsCount}</p>
                  <p className="text-sm text-green-500">€{totalCoinsValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-purple-900">Total Arqueo</p>
                  <p className="text-xl font-bold text-purple-600">€{totalArqueo.toFixed(2)}</p>
                  <p className="text-sm text-purple-500">{validCashBoxes.length} botes</p>
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                Math.abs(difference) > 0.01 
                  ? "bg-orange-50 border-orange-200" 
                  : "bg-green-50 border-green-200"
              }`}>
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    Math.abs(difference) > 0.01 ? "text-orange-900" : "text-green-900"
                  }`}>Diferencia</p>
                  <p className={`text-xl font-bold ${
                    Math.abs(difference) > 0.01 ? "text-orange-600" : "text-green-600"
                  }`}>€{difference.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">vs vales</p>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {renderDenominationSummary(bills, "Desglose de Billetes")}
            {renderDenominationSummary(coins, "Desglose de Monedas")}

            <div className="flex justify-between mt-8">
              <Button 
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Validación
              </Button>
              <Button onClick={handleContinue}>
                Generar Informes
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
            <h4 className="font-semibold text-gray-900 mb-4">Información del Arqueo</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fecha:</span>
                <span className="font-medium">
                  {validCashBoxes[0]?.date || new Date().toISOString().split('T')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Responsable:</span>
                <span className="font-medium">{state.auditorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Botes Procesados:</span>
                <span className="font-medium">{validCashBoxes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Vales:</span>
                <span className="font-medium text-primary">€{totalVales.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}