import { useState } from "react";
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
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type CashBoxFormData } from "@shared/schema";
import { calculateBreakdownTotal } from "@/lib/denominations";

const cashBoxSchema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  workerName: z.string().min(1, "El nombre del trabajador es requerido"),
  shift: z.number().min(1).max(2),
  valeAmount: z.number().min(0, "La cantidad del vale debe ser mayor a 0"),
  breakdown: z.record(z.number().min(0)),
});

type CashBoxSchemaType = z.infer<typeof cashBoxSchema>;

const PREDEFINED_WORKERS = [
  "María González",
  "Juan Pérez", 
  "Ana Martín",
  "Carlos López",
  "Luis Rodríguez",
  "Carmen Silva",
  "Pedro Morales",
  "Elena Vázquez"
];

export default function StepCashBoxEntry() {
  const { state, dispatch } = useReconciliation();
  const { toast } = useToast();
  const [showCustomWorker, setShowCustomWorker] = useState(false);

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

  const breakdownTotal = calculateBreakdownTotal(form.watch("breakdown") || {});

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
      Object.entries(data.breakdown).map(([key, value]) => [key, Number(value) || 0])
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
    handleSaveAndContinue(data);

    if (state.currentCashBoxIndex < state.totalCashBoxes - 1) {
      dispatch({ type: "SET_CURRENT_CASH_BOX_INDEX", payload: state.currentCashBoxIndex + 1 });
    } else {
      // All cash boxes completed, go to validation
      dispatch({ type: "SET_CURRENT_STEP", payload: 3 });
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
                    <Label htmlFor="date">Fecha</Label>
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
                    <Label htmlFor="worker">Trabajador</Label>
                    <div className="space-y-2">
                      {!showCustomWorker ? (
                        <>
                          <Select 
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setShowCustomWorker(true);
                                form.setValue("workerName", "");
                              } else {
                                form.setValue("workerName", value);
                              }
                            }}
                            value={form.watch("workerName")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar trabajador" />
                            </SelectTrigger>
                            <SelectContent>
                              {PREDEFINED_WORKERS.map((worker, index) => (
                                <SelectItem key={index} value={worker}>
                                  {worker}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">
                                + Agregar trabajador personalizado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
                          <Input
                            placeholder="Ingresa el nombre del trabajador"
                            value={form.watch("workerName")}
                            onChange={(e) => form.setValue("workerName", e.target.value)}
                          />
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowCustomWorker(false);
                              form.setValue("workerName", "");
                            }}
                          >
                            Volver a la lista
                          </Button>
                        </>
                      )}
                    </div>
                    {form.formState.errors.workerName && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.workerName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Turno</Label>
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
                    <Label htmlFor="valeAmount">Cantidad del Vale</Label>
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
                  
                  <CashBreakdownForm form={form} />
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm font-medium text-gray-700">Total Arqueo:</span>
                      <span className="text-lg font-semibold text-primary">
                        €{breakdownTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
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
                <span className="font-medium">{processedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progreso:</span>
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
      </div>
    </div>
  );
}
