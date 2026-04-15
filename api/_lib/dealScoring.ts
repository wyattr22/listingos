export type DealScoringInput = {
  purchasePrice: number;
  monthlyRent: number;
  monthlyExpenses: number;
  downPayment: number;
};

export type DealScoringOutput = {
  mortgageEstimate: number;
  cashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  riskScore: number;
  marketScore: number;
  overallScore: number;
  recommendation: "BUY" | "WATCH" | "PASS";
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const monthlyMortgagePayment = (principal: number, annualRatePercent: number, termYears: number) => {
  if (principal <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  const numberOfPayments = termYears * 12;
  if (monthlyRate === 0) return principal / numberOfPayments;
  const factor = Math.pow(1 + monthlyRate, numberOfPayments);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const normalizeCashOnCash = (cashOnCashReturn: number) => clamp((cashOnCashReturn / 20) * 100);

export function scoreDeal(input: DealScoringInput): DealScoringOutput {
  const loanAmount = Math.max(0, input.purchasePrice - input.downPayment);
  const mortgageEstimate = monthlyMortgagePayment(loanAmount, 6.5, 30);
  const cashFlow = input.monthlyRent - input.monthlyExpenses - mortgageEstimate;

  const annualNetIncome = (input.monthlyRent - input.monthlyExpenses) * 12;
  const annualCashFlow = cashFlow * 12;

  const capRate = input.purchasePrice > 0 ? (annualNetIncome / input.purchasePrice) * 100 : 0;
  const cashOnCashReturn = input.downPayment > 0 ? (annualCashFlow / input.downPayment) * 100 : 0;

  const leverageRatio = input.purchasePrice > 0 ? loanAmount / input.purchasePrice : 1;
  const downPaymentRatio = input.purchasePrice > 0 ? input.downPayment / input.purchasePrice : 0;

  const cashFlowRisk = clamp(60 - cashFlow / 25);
  const leverageRisk = clamp(leverageRatio * 100);
  const downPaymentRisk = clamp((0.25 - downPaymentRatio) * 280);
  const riskScore = clamp(cashFlowRisk * 0.5 + leverageRisk * 0.3 + downPaymentRisk * 0.2);

  const capRateScore = clamp((capRate / 10) * 100);
  const cashOnCashScore = normalizeCashOnCash(cashOnCashReturn);
  const marketScore = clamp(capRateScore * 0.6 + cashOnCashScore * 0.4);

  const overallScore = clamp(marketScore * 0.4 + cashOnCashScore * 0.4 + (100 - riskScore) * 0.2);

  let recommendation: DealScoringOutput["recommendation"] = "WATCH";
  if (cashFlow < 0 || overallScore < 50) {
    recommendation = "PASS";
  } else if (overallScore >= 75 && riskScore < 50) {
    recommendation = "BUY";
  }

  return {
    mortgageEstimate,
    cashFlow,
    capRate,
    cashOnCashReturn,
    riskScore,
    marketScore,
    overallScore,
    recommendation,
  };
}
