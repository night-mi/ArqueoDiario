import { useState } from "react";
import { useReconciliation } from "@/context/reconciliation-context";
import ProgressIndicator from "@/components/progress-indicator";
import StepConfiguration from "@/components/step-configuration";
import StepCashBoxEntry from "@/components/step-cash-box-entry";
import StepValidation from "@/components/step-validation";
import StepTotalsSummary from "@/components/step-totals-summary";
import StepReports from "@/components/step-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function CashReconciliationWizard() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();

  const handleReset = () => {
    if (confirm("¿Estás seguro de que quieres cancelar el arqueo? Se perderán todos los datos.")) {
      dispatch({ type: "RESET" });
      toast({
        title: "Arqueo cancelado",
        description: "Todos los datos han sido eliminados.",
      });
    }
  };

  const getCurrentDate = () => new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });



  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepConfiguration />;
      case 2:
        return <StepCashBoxEntry />;
      case 3:
        return <StepValidation />;
      case 4:
        return <StepTotalsSummary />;
      case 5:
        return <StepReports />;
      default:
        return <StepConfiguration />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Calculator className="text-white text-lg w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Sistema de Arqueos</h1>
                <p className="text-sm text-gray-500">Control amigable de cajas registradoras</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">{getCurrentDate()}</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Calculator className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator />
        {renderCurrentStep()}
      </main>

      {/* Floating Cancel Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="destructive"
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl"
          onClick={handleReset}
          title="Cancelar Arqueo"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}