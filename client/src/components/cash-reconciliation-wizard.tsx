import { useState, useEffect } from "react";
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
import LoadingScreen, { useLoading } from "@/components/ui/loading-screen";
import TransitionWrapper from "@/components/ui/transition-wrapper";


export default function CashReconciliationWizard() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();
  const { isLoading, loadingType, loadingMessage, showLoading, hideLoading } = useLoading();
  const [prevStep, setPrevStep] = useState(state.currentStep);

  // Handle step transitions with loading animations
  useEffect(() => {
    if (state.currentStep !== prevStep && prevStep !== 0) {
      const stepMessages = {
        1: "Preparando configuración...",
        2: "Iniciando entrada de datos...",
        3: "Validando información...",
        4: "Calculando totales...",
        5: "Generando informes..."
      };
      
      const stepTypes: { [key: number]: "default" | "processing" | "saving" | "generating" } = {
        1: "default",
        2: "processing", 
        3: "saving",
        4: "processing",
        5: "generating"
      };

      showLoading(stepTypes[state.currentStep] || "default", stepMessages[state.currentStep as keyof typeof stepMessages]);
      
      const timer = setTimeout(() => {
        hideLoading();
        setPrevStep(state.currentStep);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setPrevStep(state.currentStep);
    }
  }, [state.currentStep, prevStep, showLoading, hideLoading]);

  const handleReset = () => {
    if (confirm("¿Estás seguro de que quieres cancelar el arqueo? Se perderán todos los datos.")) {
      showLoading("default", "Reiniciando sistema...");
      
      setTimeout(() => {
        dispatch({ type: "RESET" });
        hideLoading();
        toast({
          title: "Arqueo cancelado",
          description: "Todos los datos han sido eliminados.",
        });
      }, 1000);
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
        return (
          <TransitionWrapper key="step-1">
            <StepConfiguration />
          </TransitionWrapper>
        );
      case 2:
        return (
          <TransitionWrapper key="step-2">
            <StepCashBoxEntry />
          </TransitionWrapper>
        );
      case 3:
        return (
          <TransitionWrapper key="step-3">
            <StepValidation />
          </TransitionWrapper>
        );
      case 4:
        return (
          <TransitionWrapper key="step-4">
            <StepTotalsSummary />
          </TransitionWrapper>
        );
      case 5:
        return (
          <TransitionWrapper key="step-5">
            <StepReports />
          </TransitionWrapper>
        );
      default:
        return (
          <TransitionWrapper key="step-default">
            <StepConfiguration />
          </TransitionWrapper>
        );
    }
  };

  return (
    <>
      <LoadingScreen 
        isVisible={isLoading} 
        type={loadingType} 
        message={loadingMessage} 
      />
      
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

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          {/* Test Animation Button */}
          <Button
            variant="secondary"
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl"
            onClick={() => {
              showLoading("processing", "Probando animaciones...");
              setTimeout(() => hideLoading(), 2000);
            }}
            title="Probar Animaciones"
          >
            ⚡
          </Button>
          
          {/* Cancel Button */}
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
    </>
  );
}