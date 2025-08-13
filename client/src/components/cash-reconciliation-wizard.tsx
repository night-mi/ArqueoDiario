import { useState } from "react";
import { useReconciliation } from "@/context/reconciliation-context";
import ProgressIndicator from "./progress-indicator";
import StepConfiguration from "./step-configuration";
import StepCashBoxEntry from "./step-cash-box-entry";
import StepValidation from "./step-validation";
import StepReport from "./step-report";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

  const getCurrentUser = () => "María González";
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
        return <StepReport />;
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
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-calculator text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Sistema de Arqueos</h1>
                <p className="text-sm text-gray-500">Control diario de cajas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{getCurrentUser()}</p>
                <p className="text-xs text-gray-500">{getCurrentDate()}</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-gray-600 text-sm"></i>
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
