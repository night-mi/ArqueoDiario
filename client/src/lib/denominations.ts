export const DENOMINATIONS = [
  { value: "500", label: "€500", type: "bill" },
  { value: "200", label: "€200", type: "bill" },
  { value: "100", label: "€100", type: "bill" },
  { value: "50", label: "€50", type: "bill" },
  { value: "20", label: "€20", type: "bill" },
  { value: "10", label: "€10", type: "bill" },
  { value: "5", label: "€5", type: "bill" },
  { value: "2", label: "€2", type: "coin" },
  { value: "1", label: "€1", type: "coin" },
  { value: "0.50", label: "€0.50", type: "coin" },
  { value: "0.20", label: "€0.20", type: "coin" },
  { value: "0.10", label: "€0.10", type: "coin" },
  { value: "0.05", label: "€0.05", type: "coin" },
  { value: "0.02", label: "€0.02", type: "coin" },
  { value: "0.01", label: "€0.01", type: "coin" },
] as const;

export function calculateBreakdownTotal(breakdown: Record<string, number>): number {
  return Object.entries(breakdown).reduce((total, [denomination, count]) => {
    return total + (parseFloat(denomination) * count);
  }, 0);
}
