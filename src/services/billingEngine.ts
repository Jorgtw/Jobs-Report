export interface BillingInput {
  totalHours: number;
  overtimeHours: number;
  totalExpenses: number;
  isInternal: boolean;
  sellingPrice: number;
  hourlyCost: number;
  overtimeCost: number;
  extraCost: number;
  isSubcontractor: boolean;
}

export interface Financials {
  revenue: number;
  cost: number;
  personnelCost: number;
  subcontractorCost: number;
  totalExpenses: number;
  margin: number;
}

/**
 * Single Source of Truth per il calcolo finanziario di Jobs-Report.
 * Qualsiasi calcolo di margini, costi o ricavi DEVE passare da qui.
 */
export function calculateFinancials(input: BillingInput): Financials {
  const ordinaryHours = Math.max(0, input.totalHours - input.overtimeHours);
  
  // Ricavo
  const revenue = input.isInternal ? 0 : input.totalHours * input.sellingPrice;
  
  // Costo
  const cost = (ordinaryHours * input.hourlyCost) + (input.overtimeHours * input.overtimeCost) + input.extraCost;
  
  // Suddivisione Costi
  const personnelCost = input.isSubcontractor ? 0 : cost;
  const subcontractorCost = input.isSubcontractor ? cost : 0;
  
  // Spese vive
  const totalExpenses = input.totalExpenses;
  
  // Margine Assoluto Unificato
  const margin = revenue - personnelCost - subcontractorCost - totalExpenses;
  
  return {
    revenue,
    cost,
    personnelCost,
    subcontractorCost,
    totalExpenses,
    margin
  };
}
