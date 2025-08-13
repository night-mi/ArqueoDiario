import { useReconciliation } from "@/context/reconciliation-context";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Configuración" },
  { number: 2, label: "Registro Botes" },
  { number: 3, label: "Validación" },
  { number: 4, label: "Informe" },
];

export default function ProgressIndicator() {
  const { state } = useReconciliation();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Nuevo Arqueo Diario</h2>
        <div className="text-sm text-gray-500">
          Paso <span className="font-medium text-primary">{state.currentStep}</span> de {STEPS.length}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                state.currentStep >= step.number
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-400"
              )}>
                {step.number}
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium",
                state.currentStep >= step.number
                  ? "text-primary"
                  : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 ml-4"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
