export type DealMetrics = {
  monthlyCashFlow: number;
  capRate: number;
  roi: number;
  recommendation: "BUY" | "PASS";
};

export function calculateDealMetrics(input: {
  purchasePrice: number;
  monthlyRent: number;
  monthlyExpenses: number;
  downPayment: number;
}): DealMetrics {
  const monthlyCashFlow = input.monthlyRent - input.monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const capRate = input.purchasePrice > 0 ? (annualCashFlow / input.purchasePrice) * 100 : 0;
  const roi = input.downPayment > 0 ? (annualCashFlow / input.downPayment) * 100 : 0;
  const recommendation = monthlyCashFlow > 0 && capRate >= 6 && roi >= 8 ? "BUY" : "PASS";

  return {
    monthlyCashFlow,
    capRate,
    roi,
    recommendation,
  };
}
