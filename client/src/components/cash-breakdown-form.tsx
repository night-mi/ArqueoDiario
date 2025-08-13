import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DENOMINATIONS } from "@/lib/denominations";
import { UseFormReturn } from "react-hook-form";

interface CashBreakdownFormProps {
  form: UseFormReturn<any>;
}

export default function CashBreakdownForm({ form }: CashBreakdownFormProps) {
  const bills = DENOMINATIONS.filter(d => d.type === "bill");
  const coins = DENOMINATIONS.filter(d => d.type === "coin");

  const renderDenominationGrid = (denominations: typeof DENOMINATIONS) => (
    <div className="grid grid-cols-3 gap-3 text-sm">
      {denominations.map((denomination) => (
        <div key={denomination.value}>
          <Label className="block text-xs font-medium text-gray-600 mb-1">
            {denomination.label}
          </Label>
          <Input
            type="number"
            min="0"
            className="text-center"
            placeholder="0"
            {...form.register(`breakdown.${denomination.value}`, { valueAsNumber: true })}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Billetes</h5>
        {renderDenominationGrid(bills)}
      </div>
      
      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Monedas</h5>
        {renderDenominationGrid(coins)}
      </div>
    </div>
  );
}
