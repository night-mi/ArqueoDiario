import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DENOMINATIONS, calculateBreakdownTotal } from "@/lib/denominations";


interface CashBreakdownFormProps {
  breakdown: Record<string, number>;
  onBreakdownChange: (breakdown: Record<string, number>) => void;
}

export default function CashBreakdownForm({ breakdown, onBreakdownChange }: CashBreakdownFormProps) {
  const bills = DENOMINATIONS.filter(d => d.type === "bill");
  const coins = DENOMINATIONS.filter(d => d.type === "coin");

  const handleDenominationChange = (denomination: string, value: string) => {
    const newBreakdown = {
      ...breakdown,
      [denomination]: Number(value) || 0
    };
    onBreakdownChange(newBreakdown);
  };

  const renderDenominationGrid = (denominations: any[]) => (
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
            value={breakdown[denomination.value] || 0}
            onChange={(e) => handleDenominationChange(denomination.value, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  const currentTotal = calculateBreakdownTotal(breakdown);

  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">
          Billetes
        </h5>
        {renderDenominationGrid(bills)}
      </div>
      
      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">
          Monedas
        </h5>
        {renderDenominationGrid(coins)}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">
            Total Calculado:
          </span>
          <span className="text-lg font-bold text-green-600">€{currentTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}