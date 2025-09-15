// Racing Model Configurations for Different Difficulty Levels
// Each model is a subset of the full practice problems but maintains educational value

export type RacingTrack = 'sprint' | 'circuit' | 'endurance';

export interface RacingModel {
  track: RacingTrack;
  name: string;
  description: string;
  cellCount: number;
  estimatedTime: string;
  sections: ModelSection[];
}

export interface ModelSection {
  title: string;
  startRow: number;
  endRow: number;
}

export interface CellConfig {
  id: string;
  label: string;
  value?: string;
  formula?: string;
  answer?: string;
  locked: boolean;
  section: string;
  hint?: string;
}

// Generate random but realistic base numbers
const generateBaseNumbers = () => {
  const scenarios = [
    { name: 'TechCorp', revenue: 100, margin: 0.25, multiple: 10 },
    { name: 'RetailMax', revenue: 120, margin: 0.15, multiple: 8 },
    { name: 'ManuCo', revenue: 200, margin: 0.18, multiple: 9 },
    { name: 'ServicePro', revenue: 80, margin: 0.30, multiple: 12 },
    { name: 'DataSoft', revenue: 150, margin: 0.22, multiple: 11 }
  ];
  
  return scenarios[Math.floor(Math.random() * scenarios.length)];
};

// SPRINT MODEL - 10 cells (1-2 minutes)
// Core LBO concepts only
export const getSprintModel = (): CellConfig[] => {
  const base = generateBaseNumbers();
  
  return [
    // Headers
    { id: 'A1', label: 'SPRINT LBO MODEL', locked: true, section: 'header' },
    { id: 'B1', label: base.name, locked: true, section: 'header' },
    
    // Revenue Section
    { id: 'A3', label: 'Revenue (LTM)', locked: true, section: 'revenue' },
    { id: 'B3', label: String(base.revenue), locked: true, section: 'revenue' },
    { id: 'C3', label: 'Year 1', locked: true, section: 'revenue' },
    { id: 'D3', label: 'Year 2', locked: true, section: 'revenue' },
    { id: 'C4', label: '', formula: '=B3*1.1', answer: String(base.revenue * 1.1), locked: false, section: 'revenue', hint: '10% growth' },
    { id: 'D4', label: '', formula: '=C4*1.1', answer: String(base.revenue * 1.21), locked: false, section: 'revenue', hint: '10% growth' },
    
    // EBITDA Section
    { id: 'A5', label: 'EBITDA Margin', locked: true, section: 'ebitda' },
    { id: 'B5', label: `${base.margin * 100}%`, locked: true, section: 'ebitda' },
    { id: 'A6', label: 'EBITDA', locked: true, section: 'ebitda' },
    { id: 'B6', label: '', formula: `=B3*${base.margin}`, answer: String(base.revenue * base.margin), locked: false, section: 'ebitda' },
    { id: 'C6', label: '', formula: `=C4*${base.margin}`, answer: String(base.revenue * 1.1 * base.margin), locked: false, section: 'ebitda' },
    { id: 'D6', label: '', formula: `=D4*${base.margin}`, answer: String(base.revenue * 1.21 * base.margin), locked: false, section: 'ebitda' },
    
    // Valuation Section
    { id: 'A8', label: 'Entry Multiple', locked: true, section: 'valuation' },
    { id: 'B8', label: `${base.multiple}x`, locked: true, section: 'valuation' },
    { id: 'A9', label: 'Enterprise Value', locked: true, section: 'valuation' },
    { id: 'B9', label: '', formula: `=B6*${base.multiple}`, answer: String(base.revenue * base.margin * base.multiple), locked: false, section: 'valuation' },
    
    // Exit & Returns
    { id: 'A11', label: 'Exit Multiple', locked: true, section: 'returns' },
    { id: 'D11', label: `${base.multiple + 2}x`, locked: true, section: 'returns' },
    { id: 'A12', label: 'Exit Value', locked: true, section: 'returns' },
    { id: 'D12', label: '', formula: `=D6*${base.multiple + 2}`, answer: String(base.revenue * 1.21 * base.margin * (base.multiple + 2)), locked: false, section: 'returns' },
    
    { id: 'A14', label: 'MOIC', locked: true, section: 'returns' },
    { id: 'D14', label: '', formula: '=D12/B9', answer: String((base.revenue * 1.21 * base.margin * (base.multiple + 2)) / (base.revenue * base.margin * base.multiple)), locked: false, section: 'returns' }
  ];
};

// CIRCUIT MODEL - 25 cells (3-5 minutes)
// Includes debt and more detailed projections
export const getCircuitModel = (): CellConfig[] => {
  const base = generateBaseNumbers();
  const debtMultiple = 5;
  const interestRate = 0.06;
  
  const sprintCells = getSprintModel();
  
  // Add more cells for Circuit
  const additionalCells: CellConfig[] = [
    // Extended Revenue Projections
    { id: 'E3', label: 'Year 3', locked: true, section: 'revenue' },
    { id: 'F3', label: 'Year 4', locked: true, section: 'revenue' },
    { id: 'G3', label: 'Year 5', locked: true, section: 'revenue' },
    { id: 'E4', label: '', formula: '=D4*1.1', answer: String(base.revenue * 1.331), locked: false, section: 'revenue' },
    { id: 'F4', label: '', formula: '=E4*1.1', answer: String(base.revenue * 1.464), locked: false, section: 'revenue' },
    { id: 'G4', label: '', formula: '=F4*1.1', answer: String(base.revenue * 1.611), locked: false, section: 'revenue' },
    
    // Extended EBITDA
    { id: 'E6', label: '', formula: `=E4*${base.margin}`, answer: String(base.revenue * 1.331 * base.margin), locked: false, section: 'ebitda' },
    { id: 'F6', label: '', formula: `=F4*${base.margin}`, answer: String(base.revenue * 1.464 * base.margin), locked: false, section: 'ebitda' },
    { id: 'G6', label: '', formula: `=G4*${base.margin}`, answer: String(base.revenue * 1.611 * base.margin), locked: false, section: 'ebitda' },
    
    // Debt Schedule
    { id: 'A16', label: '━━━ DEBT SCHEDULE ━━━', locked: true, section: 'debt' },
    { id: 'A17', label: 'Initial Debt', locked: true, section: 'debt' },
    { id: 'B17', label: '', formula: `=B6*${debtMultiple}`, answer: String(base.revenue * base.margin * debtMultiple), locked: false, section: 'debt' },
    
    { id: 'A18', label: 'Interest Rate', locked: true, section: 'debt' },
    { id: 'B18', label: `${interestRate * 100}%`, locked: true, section: 'debt' },
    
    { id: 'A19', label: 'Interest Expense', locked: true, section: 'debt' },
    { id: 'C19', label: '', formula: `=B17*${interestRate}`, answer: String(base.revenue * base.margin * debtMultiple * interestRate), locked: false, section: 'debt' },
    { id: 'D19', label: '', formula: `=B17*${interestRate}`, answer: String(base.revenue * base.margin * debtMultiple * interestRate), locked: false, section: 'debt' },
    { id: 'E19', label: '', formula: `=B17*${interestRate}`, answer: String(base.revenue * base.margin * debtMultiple * interestRate), locked: false, section: 'debt' },
    
    // Free Cash Flow
    { id: 'A21', label: '━━━ CASH FLOW ━━━', locked: true, section: 'cashflow' },
    { id: 'A22', label: 'Free Cash Flow', locked: true, section: 'cashflow' },
    { id: 'C22', label: '', formula: '=C6-C19', answer: String(base.revenue * 1.1 * base.margin - base.revenue * base.margin * debtMultiple * interestRate), locked: false, section: 'cashflow' },
    { id: 'D22', label: '', formula: '=D6-D19', answer: String(base.revenue * 1.21 * base.margin - base.revenue * base.margin * debtMultiple * interestRate), locked: false, section: 'cashflow' },
    { id: 'E22', label: '', formula: '=E6-E19', answer: String(base.revenue * 1.331 * base.margin - base.revenue * base.margin * debtMultiple * interestRate), locked: false, section: 'cashflow' },
    
    // Equity Value
    { id: 'A24', label: 'Equity Investment', locked: true, section: 'returns' },
    { id: 'B24', label: '', formula: '=B9-B17', answer: String(base.revenue * base.margin * base.multiple - base.revenue * base.margin * debtMultiple), locked: false, section: 'returns' },
    
    { id: 'A25', label: 'Exit Equity Value', locked: true, section: 'returns' },
    { id: 'G25', label: '', formula: `=G6*${base.multiple + 2}-B17`, answer: String(base.revenue * 1.611 * base.margin * (base.multiple + 2) - base.revenue * base.margin * debtMultiple), locked: false, section: 'returns' },
    
    { id: 'A26', label: 'Equity MOIC', locked: true, section: 'returns' },
    { id: 'G26', label: '', formula: '=G25/B24', answer: String((base.revenue * 1.611 * base.margin * (base.multiple + 2) - base.revenue * base.margin * debtMultiple) / (base.revenue * base.margin * base.multiple - base.revenue * base.margin * debtMultiple)), locked: false, section: 'returns' }
  ];
  
  // Filter out duplicate cells and combine
  const existingIds = new Set(sprintCells.map(c => c.id));
  const uniqueAdditional = additionalCells.filter(c => !existingIds.has(c.id));
  
  return [...sprintCells, ...uniqueAdditional];
};

// ENDURANCE MODEL - 50 cells (8-10 minutes)
// Full LBO with working capital, capex, and detailed debt schedule
export const getEnduranceModel = (): CellConfig[] => {
  const base = generateBaseNumbers();
  const circuitCells = getCircuitModel();
  
  // Add even more complexity for Endurance
  const additionalCells: CellConfig[] = [
    // Working Capital
    { id: 'A28', label: '━━━ WORKING CAPITAL ━━━', locked: true, section: 'workingcapital' },
    { id: 'A29', label: 'Revenue Growth %', locked: true, section: 'workingcapital' },
    { id: 'C29', label: '', formula: '=(C4-B3)/B3', answer: '10%', locked: false, section: 'workingcapital' },
    { id: 'D29', label: '', formula: '=(D4-C4)/C4', answer: '10%', locked: false, section: 'workingcapital' },
    
    { id: 'A30', label: 'NWC (% of Revenue)', locked: true, section: 'workingcapital' },
    { id: 'B30', label: '15%', locked: true, section: 'workingcapital' },
    
    { id: 'A31', label: 'Net Working Capital', locked: true, section: 'workingcapital' },
    { id: 'B31', label: '', formula: '=B3*0.15', answer: String(base.revenue * 0.15), locked: false, section: 'workingcapital' },
    { id: 'C31', label: '', formula: '=C4*0.15', answer: String(base.revenue * 1.1 * 0.15), locked: false, section: 'workingcapital' },
    { id: 'D31', label: '', formula: '=D4*0.15', answer: String(base.revenue * 1.21 * 0.15), locked: false, section: 'workingcapital' },
    
    { id: 'A32', label: 'Change in NWC', locked: true, section: 'workingcapital' },
    { id: 'C32', label: '', formula: '=C31-B31', answer: String(base.revenue * 1.1 * 0.15 - base.revenue * 0.15), locked: false, section: 'workingcapital' },
    { id: 'D32', label: '', formula: '=D31-C31', answer: String(base.revenue * 1.21 * 0.15 - base.revenue * 1.1 * 0.15), locked: false, section: 'workingcapital' },
    
    // Capex
    { id: 'A34', label: '━━━ CAPEX ━━━', locked: true, section: 'capex' },
    { id: 'A35', label: 'Capex (% of Revenue)', locked: true, section: 'capex' },
    { id: 'B35', label: '3%', locked: true, section: 'capex' },
    
    { id: 'A36', label: 'Annual Capex', locked: true, section: 'capex' },
    { id: 'C36', label: '', formula: '=C4*0.03', answer: String(base.revenue * 1.1 * 0.03), locked: false, section: 'capex' },
    { id: 'D36', label: '', formula: '=D4*0.03', answer: String(base.revenue * 1.21 * 0.03), locked: false, section: 'capex' },
    
    // Detailed Cash Flow
    { id: 'A38', label: '━━━ DETAILED FCF ━━━', locked: true, section: 'detailedcf' },
    { id: 'A39', label: 'EBITDA', locked: true, section: 'detailedcf' },
    { id: 'A40', label: '(-) Interest', locked: true, section: 'detailedcf' },
    { id: 'A41', label: '(-) Taxes (25%)', locked: true, section: 'detailedcf' },
    { id: 'C41', label: '', formula: '=(C6-C19)*0.25', answer: String((base.revenue * 1.1 * base.margin - base.revenue * base.margin * 5 * 0.06) * 0.25), locked: false, section: 'detailedcf' },
    { id: 'A42', label: '(-) Capex', locked: true, section: 'detailedcf' },
    { id: 'A43', label: '(-) Change in NWC', locked: true, section: 'detailedcf' },
    { id: 'A44', label: 'Unlevered FCF', locked: true, section: 'detailedcf' },
    { id: 'C44', label: '', formula: '=C6-C41-C36-C32', answer: 'calculated', locked: false, section: 'detailedcf' },
    
    // Debt Paydown
    { id: 'A46', label: '━━━ DEBT PAYDOWN ━━━', locked: true, section: 'debtpaydown' },
    { id: 'A47', label: 'Beginning Debt', locked: true, section: 'debtpaydown' },
    { id: 'C47', label: '', formula: '=B17', answer: String(base.revenue * base.margin * 5), locked: false, section: 'debtpaydown' },
    { id: 'A48', label: 'Cash for Paydown', locked: true, section: 'debtpaydown' },
    { id: 'C48', label: '', formula: '=MAX(C44-C19,0)', answer: 'calculated', locked: false, section: 'debtpaydown' },
    { id: 'A49', label: 'Ending Debt', locked: true, section: 'debtpaydown' },
    { id: 'C49', label: '', formula: '=C47-C48', answer: 'calculated', locked: false, section: 'debtpaydown' },
    
    // Advanced Returns
    { id: 'A51', label: '━━━ RETURNS ANALYSIS ━━━', locked: true, section: 'advancedreturns' },
    { id: 'A52', label: 'IRR Calculation', locked: true, section: 'advancedreturns' },
    { id: 'G52', label: '', formula: '=((G25/B24)^(1/5))-1', answer: 'calculated', locked: false, section: 'advancedreturns' }
  ];
  
  // Filter out duplicate cells and combine
  const existingIds = new Set(circuitCells.map(c => c.id));
  const uniqueAdditional = additionalCells.filter(c => !existingIds.has(c.id));
  
  return [...circuitCells, ...uniqueAdditional];
};

// Racing configurations
export const RACING_TRACKS: Record<RacingTrack, RacingModel> = {
  sprint: {
    track: 'sprint',
    name: '🏃 Sprint Race',
    description: 'Quick 10-cell LBO basics. Perfect for beginners!',
    cellCount: 10,
    estimatedTime: '1-2 minutes',
    sections: [
      { title: 'Revenue', startRow: 3, endRow: 4 },
      { title: 'EBITDA', startRow: 5, endRow: 6 },
      { title: 'Valuation', startRow: 8, endRow: 9 },
      { title: 'Returns', startRow: 11, endRow: 14 }
    ]
  },
  circuit: {
    track: 'circuit',
    name: '🏎️ Circuit Race',
    description: '25-cell model with debt schedule. Intermediate challenge!',
    cellCount: 25,
    estimatedTime: '3-5 minutes',
    sections: [
      { title: 'Revenue', startRow: 3, endRow: 4 },
      { title: 'EBITDA', startRow: 5, endRow: 6 },
      { title: 'Debt Schedule', startRow: 16, endRow: 19 },
      { title: 'Cash Flow', startRow: 21, endRow: 22 },
      { title: 'Returns', startRow: 24, endRow: 26 }
    ]
  },
  endurance: {
    track: 'endurance',
    name: '🏁 Endurance Race',
    description: '50-cell full LBO with working capital & capex. Expert level!',
    cellCount: 50,
    estimatedTime: '8-10 minutes',
    sections: [
      { title: 'Revenue', startRow: 3, endRow: 4 },
      { title: 'EBITDA', startRow: 5, endRow: 6 },
      { title: 'Debt Schedule', startRow: 16, endRow: 19 },
      { title: 'Working Capital', startRow: 28, endRow: 32 },
      { title: 'Capex', startRow: 34, endRow: 36 },
      { title: 'Detailed FCF', startRow: 38, endRow: 44 },
      { title: 'Debt Paydown', startRow: 46, endRow: 49 },
      { title: 'Returns Analysis', startRow: 51, endRow: 52 }
    ]
  }
};

// Helper to get model by track type
export const getModelForTrack = (track: RacingTrack): CellConfig[] => {
  switch (track) {
    case 'sprint':
      return getSprintModel();
    case 'circuit':
      return getCircuitModel();
    case 'endurance':
      return getEnduranceModel();
    default:
      return getSprintModel();
  }
};

// Helper to validate answer (with tolerance for rounding)
export const validateAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  // Remove spaces, $, %, commas
  const clean = (str: string) => str.replace(/[\s$%,]/g, '').toLowerCase();
  
  const cleanUser = clean(userAnswer);
  const cleanCorrect = clean(correctAnswer);
  
  // Try exact match first
  if (cleanUser === cleanCorrect) return true;
  
  // Try numeric comparison with tolerance
  const userNum = parseFloat(cleanUser);
  const correctNum = parseFloat(cleanCorrect);
  
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    const tolerance = Math.abs(correctNum * 0.01); // 1% tolerance
    return Math.abs(userNum - correctNum) <= tolerance;
  }
  
  return false;
};

// Get random scenario name for variety
export const getRandomScenarioName = (): string => {
  const names = [
    'TechCorp Acquisition',
    'RetailMax Buyout', 
    'ManuCo LBO',
    'ServicePro Deal',
    'DataSoft Transaction',
    'CloudFirst Buyout',
    'LogiCo Acquisition',
    'MediaMax LBO',
    'HealthPro Deal',
    'EnergyTech Buyout'
  ];
  
  return names[Math.floor(Math.random() * names.length)];
};