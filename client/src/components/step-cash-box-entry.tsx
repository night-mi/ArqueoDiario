import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useReconciliation } from "@/context/reconciliation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CashBreakdownForm from "@/components/cash-breakdown-form";
import { NameManager } from "@/components/name-manager";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type CashBoxFormData } from "@shared/schema";
import { calculateBreakdownTotal } from "@/lib/denominations";
import InfoTooltip from "@/components/info-tooltip";

const cashBoxSchema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  workerName: z.string().min(1, "El nombre del trabajador es requerido"),
  shift: z.number().min(1).max(2),
  valeAmount: z.number().min(0, "La cantidad del vale debe ser mayor a 0"),
  breakdown: z.record(z.number().min(0)),
});

type CashBoxSchemaType = z.infer<typeof cashBoxSchema>;

// Removed predefined workers - now using NameManager

export default function StepCashBoxEntry() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();
  const [workerName, setWorkerName] = useState("");

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const currentCashBox = state.cashBoxes[state.currentCashBoxIndex] || {
    date: getCurrentDate(),
    workerName: "",
    shift: 1,
    valeAmount: 0,
    breakdown: {
      "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0,
      "5": 0, "2": 0, "1": 0, "0.50": 0, "0.20": 0, "0.10": 0,
      "0.05": 0, "0.02": 0, "0.01": 0
    }
  };

  const form = useForm<CashBoxSchemaType>({
    resolver: zodResolver(cashBoxSchema),
    defaultValues: currentCashBox,
    mode: "onChange"
  });

  // Update worker name state when cash box changes
  useEffect(() => {
    setWorkerName(currentCashBox.workerName);
  }, [state.currentCashBoxIndex, currentCashBox.workerName]);

  // Update form worker name when worker is selected
  useEffect(() => {
    if (workerName) {
      form.setValue('workerName', workerName);
    }
  }, [workerName, form]);

  // Reset form when cash box index changes
  useEffect(() => {
    const resetValues = state.cashBoxes[state.currentCashBoxIndex] || {
      date: getCurrentDate(),
      workerName: "",
      shift: 1,
      valeAmount: 0,
      breakdown: {
        "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0,
        "5": 0, "2": 0, "1": 0, "0.50": 0, "0.20": 0, "0.10": 0,
        "0.05": 0, "0.02": 0, "0.01": 0
      }
    };
    
    form.reset(resetValues);
  }, [state.currentCashBoxIndex, form]);

  const handlePrevious = () => {
    if (state.currentCashBoxIndex > 0) {
      dispatch({ type: "SET_CURRENT_CASH_BOX_INDEX", payload: state.currentCashBoxIndex - 1 });
    } else {
      dispatch({ type: "SET_CURRENT_STEP", payload: 1 });
    }
  };

  const handleSaveAndContinue = (data: CashBoxSchemaType) => {
    // Ensure breakdown has valid numbers
    const cleanBreakdown = Object.fromEntries(
      Object.entries(data.breakdown || {}).map(([key, value]) => [key, Number(value) || 0])
    );

    const formattedData: CashBoxFormData = {
      ...data,
      breakdown: cleanBreakdown as any,
    };

    dispatch({ 
      type: "UPDATE_CASH_BOX", 
      payload: { 
        index: state.currentCashBoxIndex, 
        data: formattedData 
      } 
    });

    toast({
      title: "Bote guardado",
      description: `Datos del bote ${state.currentCashBoxIndex + 1} guardados correctamente.`,
    });
  };

  const handleNextCashBox = (data: CashBoxSchemaType) => {
    // Validate worker name
    if (!workerName.trim()) {
      toast({
        title: "Error",
        description: "Por favor, selecciona o escribe el nombre del trabajador.",
        variant: "destructive",
      });
      return;
    }

    // First save the current cash box data
    const cleanBreakdown = Object.fromEntries(
      Object.entries(data.breakdown || {}).map(([key, value]) => [key, Number(value) || 0])
    );

    const formattedData: CashBoxFormData = {
      ...data,
      workerName: workerName.trim(),
      breakdown: cleanBreakdown as any,
    };

    dispatch({ 
      type: "UPDATE_CASH_BOX", 
      payload: { 
        index: state.currentCashBoxIndex, 
        data: formattedData 
      } 
    });

    // Then navigate to next cash box or validation step
    if (state.currentCashBoxIndex < state.totalCashBoxes - 1) {
      dispatch({ type: "SET_CURRENT_CASH_BOX_INDEX", payload: state.currentCashBoxIndex + 1 });
      toast({
        title: "Bote guardado",
        description: `Pasando al bote ${state.currentCashBoxIndex + 2}`,
      });
    } else {
      // All cash boxes completed, go to validation
      dispatch({ type: "SET_CURRENT_STEP", payload: 3 });
      toast({
        title: "Botes completados",
        description: "Todos los botes han sido procesados. Procediendo a validación.",
      });
    }
  };

  const processedCount = state.cashBoxes.filter(box => box.date && box.workerName).length;
  const progressPercentage = Math.round(((state.currentCashBoxIndex + 1) / state.totalCashBoxes) * 75) + 25;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Registro de Bote{" "}
                <span className="bg-primary text-white px-2 py-1 rounded text-sm ml-2">
                  {state.currentCashBoxIndex + 1}
                </span>{" "}
                de {state.totalCashBoxes}
              </h3>
              <p className="text-gray-600">Ingresa los datos completos para este bote.</p>
            </div>

            <form onSubmit={form.handleSubmit(handleNextCashBox)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Información Básica
                  </h4>
                  
                  <div>
                    <Label htmlFor="date" className="flex items-center">
                      Fecha
                      <InfoTooltip 
                        content="Selecciona la fecha en que se realizó este bote de caja. Puede ser de cualquier día."
                        className="ml-2"
                      />
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      {...form.register("date")}
                    />
                    {form.formState.errors.date && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Trabajador Seleccionado</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      {workerName ? (
                        <p className="font-medium">{workerName}</p>
                      ) : (
                        <p className="text-gray-500 italic">Selecciona un trabajador en la barra lateral</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center">
                      Turno
                      <InfoTooltip 
                        content="Selecciona el turno en que trabajó esta persona: Turno 1 para mañana, Turno 2 para tarde."
                        className="ml-2"
                      />
                    </Label>
                    <RadioGroup
                      value={form.watch("shift")?.toString()}
                      onValueChange={(value) => form.setValue("shift", parseInt(value))}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="shift1" />
                        <Label htmlFor="shift1">Turno 1 (Mañana)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="shift2" />
                        <Label htmlFor="shift2">Turno 2 (Tarde)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="valeAmount" className="flex items-center">
                      Cantidad del Vale
                      <InfoTooltip 
                        content="Introduce el importe exacto que aparece en el vale o ticket de caja de este trabajador."
                        className="ml-2"
                      />
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">€</span>
                      <Input
                        id="valeAmount"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        placeholder="0.00"
                        {...form.register("valeAmount", { valueAsNumber: true })}
                      />
                    </div>
                    {form.formState.errors.valeAmount && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.valeAmount.message}</p>
                    )}
                  </div>
                </div>

                {/* Cash Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Arqueo Detallado
                  </h4>
                  
                  <CashBreakdownForm 
                    breakdown={form.watch("breakdown") || {}}
                    onBreakdownChange={(newBreakdown) => {
                      form.setValue("breakdown", newBreakdown);
                      form.trigger("breakdown");
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex space-x-3">
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={form.handleSubmit(handleSaveAndContinue)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar y Continuar
                  </Button>
                  <Button type="submit">
                    {state.currentCashBoxIndex < state.totalCashBoxes - 1 ? "Siguiente Bote" : "Ir a Validación"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="space-y-6">
          {/* Worker Name Manager */}
          <NameManager
            type="worker"
            title="Trabajadores"
            onNameSelect={setWorkerName}
            selectedName={workerName}
          />

          {/* Progress */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Progreso</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bote Actual:</span>
                  <span className="font-medium">{state.currentCashBoxIndex + 1} de {state.totalCashBoxes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completados:</span>
                  <span className="font-medium">{processedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progreso Total:</span>
                  <span className="font-medium text-primary">{progressPercentage}%</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Navegación</h4>
              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="justify-start"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {state.currentCashBoxIndex > 0 ? `Bote ${state.currentCashBoxIndex}` : 'Configuración'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleSaveAndContinue)}
                  className="justify-start"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Progreso
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
