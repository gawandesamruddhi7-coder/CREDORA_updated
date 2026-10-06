export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  city: string | null;
  employmentType: string | null;
  dependents: number | null;
  createdAt: string;
}

export interface Income {
  monthlyIncome: number;
  otherMonthlyIncome: number;
  annualIncome: number;
}

export interface Expenses {
  rent: number;
  utilities: number;
  food: number;
  transportation: number;
  insurance: number;
  otherExpenses: number;
}

export interface LoanInput {
  loanType: string;
  loanName: string;
  principalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  originalTenureMonths: number;
  remainingTenureMonths: number;
  monthlyEmi: number;
  startDate: string;
  status?: "ACTIVE" | "CLOSED";
  missedPayments?: number | null;
}

export interface Loan extends LoanInput {
  id: string;
  status: "ACTIVE" | "CLOSED";
  missedPayments: number;
  createdAt: string;
  updatedAt: string;
}

export interface Score {
  id: string;
  userId: string;
  score: number;
  paymentHistoryScore: number;
  creditUtilisationScore: number;
  debtBurdenScore: number;
  creditHistoryScore: number;
  recentActivityScore: number;
  calculatedAt: string;
}

export interface ScenarioInput {
  name: string;
  loanType: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  processingFee: number;
}

export interface Scenario extends ScenarioInput {
  id: string;
  userId: string;
  calculatedEmi: number;
  projectedScore: number;
  projectedDti: number;
  projectedDisposableIncome: number;
  createdAt: string;
}

export interface Insight {
  tone: "positive" | "warning" | "important";
  title: string;
  detail: string;
}

export interface DashboardData {
  profile: Profile;
  income: Income | null;
  expenses: Expenses | null;
  loans: Loan[];
  score: Score | null;
  previousScore: Score | null;
  scenarios: Scenario[];
  hasFinancialProfile: boolean;
  metrics: {
    monthlyIncome: number;
    baseMonthlyIncome: number;
    otherMonthlyIncome: number;
    annualIncome: number;
    monthlyExpenses: number;
    monthlyEmi: number;
    outstandingDebt: number;
    activeLoanCount: number;
    debtToIncome: number;
    emiToIncome: number;
    disposableIncome: number;
    repaymentProgress: number;
    averageInterestRate: number;
  };
  insights: Insight[];
}

export interface CalculatorResult {
  loanType: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  processingFee: number;
  calculatedEmi: number;
  current: {
    score: number | null;
    monthlyEmi: number;
    dti: number;
    disposableIncome: number;
    outstandingDebt: number;
  };
  projected: {
    score: number;
    scoreFactors: Record<string, number>;
    monthlyEmi: number;
    dti: number;
    disposableIncome: number;
    outstandingDebt: number;
    totalInterest: number;
  };
}

export interface TaxEstimate {
  annualIncome: number;
  estimatedTax: number;
  annualEmi: number;
  annualExpenses: number;
  estimatedDisposableIncome: number;
  taxRate: number;
  estimateBasis: string;
}

export interface ReportData extends DashboardData {}
