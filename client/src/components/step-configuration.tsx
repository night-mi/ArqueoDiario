import { useState } from "react";
import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Lightbulb, ArrowRight, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NameManager } from "@/components/name-manager";


export default function StepConfiguration() {
  const { state, dispatch } = useReconciliation();
  const [totalCashBoxes, setTotalCashBoxes] = useState(state.totalCashBoxes || "");

  const { toast } = useToast();

  const handleContinue = () => {
    const count = parseInt(totalCashBoxes.toString());
    
    if (!count || count < 1 || count > 20) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un número válido de botes (1-20).",
        variant: "destructive",
      });
      return;
    }



    dispatch({ type: "SET_TOTAL_CASH_BOXES", payload: count });

    dispatch({ type: "SET_CURRENT_STEP", payload: 2 });
    dispatch({ type: "SET_CURRENT_CASH_BOX_INDEX", payload: 0 });
    
    toast({
      title: "Configuración guardada",
      description: `Se procesarán ${count} botes de caja.`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración del Arqueo</h3>
              <p className="text-gray-600">Establece la cantidad total de botes a procesar para este arqueo.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calculator className="mr-2 h-4 w-4 text-primary" />
                  Cantidad Total de Botes

                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    className="text-lg pr-16"
                    placeholder="Ej: 4"
                    value={totalCashBoxes}
                    onChange={(e) => setTotalCashBoxes(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 text-sm">botes</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="text-blue-600 mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Proceso Amigable</h4>
                    <p className="text-sm text-blue-700">
                      Te guiaremos paso a paso para completar cada bote: fecha, trabajador, turno y arqueo detallado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button 
                onClick={handleContinue}
                className="px-6 py-3 font-medium"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}