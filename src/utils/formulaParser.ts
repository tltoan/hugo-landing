// LBO Formula Parser and Validator
// Handles Excel-like formula parsing and validation for LBO models

export interface CellValue {
  raw: string
  formula: string | null
  value: number | string | null
  error: string | null
}

export interface FormulaValidation {
  isCorrect: boolean
  expectedFormula?: string
  hint?: string
  explanation?: string
  points?: number
}

// Parse cell references (e.g., B2, $I$6)
export function parseCellReference(ref: string): { col: string; row: number; absoluteCol: boolean; absoluteRow: boolean } | null {
  const match = ref.match(/^(\$)?([A-Z]+)(\$)?(\d+)$/)
  if (!match) return null
  
  return {
    col: match[2],
    row: parseInt(match[4]),
    absoluteCol: !!match[1],
    absoluteRow: !!match[3]
  }
}

// Convert column letter to index (A=0, B=1, etc.)
export function columnToIndex(col: string): number {
  let index = 0
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64)
  }
  return index - 1
}

// Convert index to column letter
export function indexToColumn(index: number): string {
  let col = ''
  while (index >= 0) {
    col = String.fromCharCode((index % 26) + 65) + col
    index = Math.floor(index / 26) - 1
  }
  return col
}

// Evaluate simple Excel formulas
export function evaluateFormula(
  formula: string,
  getCellValue: (cellRef: string) => number | string | null
): number | string | null {
  if (!formula.startsWith('=')) {
    return formula
  }

  const expr = formula.substring(1).trim()
  
  try {
    // Replace cell references with values
    const processedExpr = expr.replace(/(\$)?([A-Z]+)(\$)?(\d+)/g, (match) => {
      const value = getCellValue(match)
      return value !== null ? String(value) : '0'
    })

    // Handle Excel functions
    const funcProcessed = processedExpr
      .replace(/MAX\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => parseFloat(v.trim()))
        return String(Math.max(...values))
      })
      .replace(/MIN\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => parseFloat(v.trim()))
        return String(Math.min(...values))
      })
      .replace(/SUM\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => parseFloat(v.trim()))
        return String(values.reduce((a: number, b: number) => a + b, 0))
      })
      .replace(/AVERAGE\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => parseFloat(v.trim()))
        return String(values.reduce((a: number, b: number) => a + b, 0) / values.length)
      })

    // Safely evaluate the expression
    // In production, use a proper expression parser like math.js
    const result = Function('"use strict"; return (' + funcProcessed + ')')()
    return isNaN(result) ? null : result
  } catch (error) {
    console.error('Formula evaluation error:', error)
    return null
  }
}

// LBO-specific formula patterns for Paper LBO
export const LBO_FORMULA_PATTERNS: Record<string, FormulaValidation> = {
  // ========== YEAR 1 ==========
  // Year 1 Revenue (B3): Prior year revenue * (1 + growth rate)
  'B3': {
    isCorrect: false,
    expectedFormula: '=B2*(1+0.15)',
    hint: 'Multiply prior year revenue by (1 + growth rate of 15%)',
    explanation: 'Revenue grows by 15% annually in Year 1',
    points: 100
  },
  // Year 1 EBITDA (C3): Revenue * EBITDA margin
  'C3': {
    isCorrect: false,
    expectedFormula: '=B3*0.25',
    hint: 'Multiply revenue by EBITDA margin (25%)',
    explanation: 'EBITDA is 25% of revenue',
    points: 100
  },
  // Interest expense (D3): Debt balance * interest rate
  'D3': {
    isCorrect: false,
    expectedFormula: '=I2*0.06',
    hint: 'Multiply beginning debt balance by interest rate (6%)',
    explanation: 'Interest is 6% of outstanding debt',
    points: 100
  },
  // Pre-tax income (E3): EBITDA - Interest
  'E3': {
    isCorrect: false,
    expectedFormula: '=C3-D3',
    hint: 'Subtract interest from EBITDA',
    explanation: 'Pre-tax income equals EBITDA minus interest expense',
    points: 80
  },
  // Taxes (F3): Pre-tax income * tax rate
  'F3': {
    isCorrect: false,
    expectedFormula: '=E3*0.25',
    hint: 'Multiply pre-tax income by tax rate (25%)',
    explanation: 'Taxes are 25% of pre-tax income',
    points: 80
  },
  // Net income (G3): Pre-tax income - Taxes
  'G3': {
    isCorrect: false,
    expectedFormula: '=E3-F3',
    hint: 'Subtract taxes from pre-tax income',
    explanation: 'Net income equals pre-tax income minus taxes',
    points: 80
  },
  // Free cash flow (H3): EBITDA - Interest - Taxes - CapEx
  'H3': {
    isCorrect: false,
    expectedFormula: '=C3-D3-F3-(B3*0.03)',
    hint: 'EBITDA less interest, taxes, and capex (3% of revenue)',
    explanation: 'Free cash flow available for debt paydown',
    points: 150
  },
  // Ending debt (I3): Beginning debt - FCF
  'I3': {
    isCorrect: false,
    expectedFormula: '=MAX(0,I2-H3)',
    hint: 'Debt = MAX(0, Prior Debt - FCF). Formula: =MAX(0,I2-H3)',
    explanation: 'Debt is paid down with free cash flow',
    points: 150
  },

  // ========== YEAR 2 ==========
  'B4': {
    isCorrect: false,
    expectedFormula: '=B3*(1+0.12)',
    hint: 'Prior year revenue * (1 + 12% growth)',
    explanation: 'Revenue grows by 12% in Year 2',
    points: 100
  },
  'C4': {
    isCorrect: false,
    expectedFormula: '=B4*0.26',
    hint: 'Revenue * 26% EBITDA margin',
    explanation: 'EBITDA margin improves to 26%',
    points: 100
  },
  'D4': {
    isCorrect: false,
    expectedFormula: '=I3*0.06',
    hint: 'Prior year ending debt * 6% interest rate',
    explanation: 'Interest on remaining debt',
    points: 100
  },
  'E4': {
    isCorrect: false,
    expectedFormula: '=C4-D4',
    hint: 'EBITDA minus interest',
    explanation: 'Pre-tax income calculation',
    points: 80
  },
  'F4': {
    isCorrect: false,
    expectedFormula: '=E4*0.25',
    hint: 'Pre-tax income * 25% tax rate',
    explanation: 'Tax calculation',
    points: 80
  },
  'G4': {
    isCorrect: false,
    expectedFormula: '=E4-F4',
    hint: 'Pre-tax income minus taxes',
    explanation: 'Net income calculation',
    points: 80
  },
  'H4': {
    isCorrect: false,
    expectedFormula: '=C4-D4-F4-(B4*0.03)',
    hint: 'EBITDA - Interest - Taxes - CapEx (3% of revenue)',
    explanation: 'Free cash flow for Year 2',
    points: 150
  },
  'I4': {
    isCorrect: false,
    expectedFormula: '=MAX(0,I3-H4)',
    hint: 'Prior debt minus FCF (minimum zero)',
    explanation: 'Debt paydown in Year 2',
    points: 150
  },

  // ========== YEAR 3 ==========
  'B5': {
    isCorrect: false,
    expectedFormula: '=B4*(1+0.10)',
    hint: 'Prior year revenue * (1 + 10% growth)',
    explanation: 'Revenue grows by 10% in Year 3',
    points: 100
  },
  'C5': {
    isCorrect: false,
    expectedFormula: '=B5*0.27',
    hint: 'Revenue * 27% EBITDA margin',
    explanation: 'EBITDA margin improves to 27%',
    points: 100
  },
  'D5': {
    isCorrect: false,
    expectedFormula: '=I4*0.06',
    hint: 'Prior year ending debt * 6% interest rate',
    explanation: 'Interest on remaining debt',
    points: 100
  },
  'E5': {
    isCorrect: false,
    expectedFormula: '=C5-D5',
    hint: 'EBITDA minus interest',
    explanation: 'Pre-tax income calculation',
    points: 80
  },
  'F5': {
    isCorrect: false,
    expectedFormula: '=E5*0.25',
    hint: 'Pre-tax income * 25% tax rate',
    explanation: 'Tax calculation',
    points: 80
  },
  'G5': {
    isCorrect: false,
    expectedFormula: '=E5-F5',
    hint: 'Pre-tax income minus taxes',
    explanation: 'Net income calculation',
    points: 80
  },
  'H5': {
    isCorrect: false,
    expectedFormula: '=C5-D5-F5-(B5*0.03)',
    hint: 'EBITDA - Interest - Taxes - CapEx (3% of revenue)',
    explanation: 'Free cash flow for Year 3',
    points: 150
  },
  'I5': {
    isCorrect: false,
    expectedFormula: '=MAX(0,I4-H5)',
    hint: 'Prior debt minus FCF (minimum zero)',
    explanation: 'Debt paydown in Year 3',
    points: 150
  },

  // ========== YEAR 4 ==========
  'B6': {
    isCorrect: false,
    expectedFormula: '=B5*(1+0.08)',
    hint: 'Prior year revenue * (1 + 8% growth)',
    explanation: 'Revenue grows by 8% in Year 4',
    points: 100
  },
  'C6': {
    isCorrect: false,
    expectedFormula: '=B6*0.28',
    hint: 'Revenue * 28% EBITDA margin',
    explanation: 'EBITDA margin improves to 28%',
    points: 100
  },
  'D6': {
    isCorrect: false,
    expectedFormula: '=I5*0.06',
    hint: 'Prior year ending debt * 6% interest rate',
    explanation: 'Interest on remaining debt',
    points: 100
  },
  'E6': {
    isCorrect: false,
    expectedFormula: '=C6-D6',
    hint: 'EBITDA minus interest',
    explanation: 'Pre-tax income calculation',
    points: 80
  },
  'F6': {
    isCorrect: false,
    expectedFormula: '=E6*0.25',
    hint: 'Pre-tax income * 25% tax rate',
    explanation: 'Tax calculation',
    points: 80
  },
  'G6': {
    isCorrect: false,
    expectedFormula: '=E6-F6',
    hint: 'Pre-tax income minus taxes',
    explanation: 'Net income calculation',
    points: 80
  },
  'H6': {
    isCorrect: false,
    expectedFormula: '=C6-D6-F6-(B6*0.03)',
    hint: 'EBITDA - Interest - Taxes - CapEx (3% of revenue)',
    explanation: 'Free cash flow for Year 4',
    points: 150
  },
  'I6': {
    isCorrect: false,
    expectedFormula: '=MAX(0,I5-H6)',
    hint: 'Prior debt minus FCF (minimum zero)',
    explanation: 'Debt paydown in Year 4',
    points: 150
  },

  // ========== YEAR 5 ==========
  'B7': {
    isCorrect: false,
    expectedFormula: '=B6*(1+0.08)',
    hint: 'Prior year revenue * (1 + 8% growth)',
    explanation: 'Revenue grows by 8% in Year 5',
    points: 100
  },
  'C7': {
    isCorrect: false,
    expectedFormula: '=B7*0.30',
    hint: 'Revenue * 30% EBITDA margin',
    explanation: 'EBITDA margin reaches target of 30%',
    points: 100
  },
  'D7': {
    isCorrect: false,
    expectedFormula: '=I6*0.06',
    hint: 'Prior year ending debt * 6% interest rate',
    explanation: 'Interest on remaining debt',
    points: 100
  },
  'E7': {
    isCorrect: false,
    expectedFormula: '=C7-D7',
    hint: 'EBITDA minus interest',
    explanation: 'Pre-tax income calculation',
    points: 80
  },
  'F7': {
    isCorrect: false,
    expectedFormula: '=E7*0.25',
    hint: 'Pre-tax income * 25% tax rate',
    explanation: 'Tax calculation',
    points: 80
  },
  'G7': {
    isCorrect: false,
    expectedFormula: '=E7-F7',
    hint: 'Pre-tax income minus taxes',
    explanation: 'Net income calculation',
    points: 80
  },
  'H7': {
    isCorrect: false,
    expectedFormula: '=C7-D7-F7-(B7*0.03)',
    hint: 'EBITDA - Interest - Taxes - CapEx (3% of revenue)',
    explanation: 'Free cash flow for Year 5',
    points: 150
  },
  'I7': {
    isCorrect: false,
    expectedFormula: '=MAX(0,I6-H7)',
    hint: 'Prior debt minus FCF (minimum zero)',
    explanation: 'Final debt balance',
    points: 150
  },

  // ========== EXIT CALCULATIONS (Row 9) ==========
  'B9': {
    isCorrect: false,
    expectedFormula: '=C7*12',
    hint: 'EV = Year 5 EBITDA × 12x. Formula: =C7*12',
    explanation: 'Enterprise Value at exit = EBITDA × 12x multiple',
    points: 200
  },
  'C9': {
    isCorrect: false,
    expectedFormula: '=B9-I7',
    hint: 'Equity = EV - Debt. Formula: =B9-I7',
    explanation: 'Equity Value = EV - Net Debt',
    points: 200
  },
  'D9': {
    isCorrect: false,
    expectedFormula: '=C9/20000000',
    hint: 'MOIC = Exit Equity / $20M. Formula: =C9/20000000',
    explanation: 'Multiple on Invested Capital (MOIC)',
    points: 200
  },
  'E9': {
    isCorrect: false,
    expectedFormula: '=(C9/20000000)^(1/5)-1',
    hint: 'IRR = MOIC^(1/5) - 1. Formula: =(C9/20000000)^(1/5)-1',
    explanation: 'IRR calculation over 5 year period',
    points: 250
  }
}

// Normalize formula for comparison (remove spaces, handle different formats)
export function normalizeFormula(formula: string): string {
  return formula
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\*\(1\+/g, '*(1+')  // Handle different multiplication formats
    .replace(/\)\*([A-Z0-9])/g, ')*$1')  // Ensure multiplication sign
}

// Check if two formulas are equivalent
export function formulasAreEquivalent(formula1: string, formula2: string): boolean {
  const norm1 = normalizeFormula(formula1)
  const norm2 = normalizeFormula(formula2)
  
  // Direct match
  if (norm1 === norm2) return true
  
  // Check for mathematically equivalent formulas
  const equivalentPatterns: Array<[RegExp, RegExp]> = [
    // Year 1 variations
    [/B2\*1\.15/, /B2\*\(1\+0\.15\)/],
    [/B3\*1\.12/, /B3\*\(1\+0\.12\)/],
    [/B4\*1\.10/, /B4\*\(1\+0\.10\)/],
    [/B4\*1\.1/, /B4\*\(1\+0\.10\)/],
    [/B5\*1\.08/, /B5\*\(1\+0\.08\)/],
    [/B6\*1\.08/, /B6\*\(1\+0\.08\)/],
    
    // Percentage variations
    [/\*0\.25/, /\*25%/],
    [/\*0\.26/, /\*26%/],
    [/\*0\.27/, /\*27%/],
    [/\*0\.28/, /\*28%/],
    [/\*0\.30/, /\*30%/],
    [/\*0\.3/, /\*30%/],
    [/\*0\.06/, /\*6%/],
    [/\*0\.03/, /\*3%/],
    
    // Parentheses variations
    [/C(\d)-D(\d)-F(\d)-B(\d)\*0\.03/, /C$1-D$1-F$1-\(B$1\*0\.03\)/],
    
    // MOIC/IRR variations
    [/\^1\/5/, /\^\(1\/5\)/],
    [/\/20000000/, /\/20000000\.0/],
  ]
  
  for (const [pattern1, pattern2] of equivalentPatterns) {
    if ((pattern1.test(norm1) && pattern2.test(norm2)) ||
        (pattern2.test(norm1) && pattern1.test(norm2))) {
      return true
    }
  }
  
  return false
}

// Validate LBO formula for a specific cell
export function validateLBOFormula(
  cellRef: string,
  formula: string,
  scenario: 'paper_lbo' | 'standard_lbo' | 'advanced_lbo' = 'paper_lbo'
): FormulaValidation {
  const pattern = LBO_FORMULA_PATTERNS[cellRef]
  
  if (!pattern) {
    // Cell doesn't require validation
    return { isCorrect: true, points: 0 }
  }
  
  const isCorrect = pattern.expectedFormula ? formulasAreEquivalent(formula, pattern.expectedFormula) : false
  
  return {
    isCorrect,
    expectedFormula: isCorrect ? undefined : pattern.expectedFormula,
    hint: isCorrect ? undefined : pattern.hint,
    explanation: isCorrect ? pattern.explanation : undefined,
    points: isCorrect ? pattern.points : 0
  }
}

// Get all cells that need formulas for a scenario
export function getRequiredCells(scenario: 'paper_lbo' | 'standard_lbo' | 'advanced_lbo'): string[] {
  if (scenario === 'paper_lbo') {
    return Object.keys(LBO_FORMULA_PATTERNS)
  }
  // Add more scenarios later
  return []
}

// Calculate completion percentage
export function calculateProgress(completedCells: Set<string>, scenario: 'paper_lbo' | 'standard_lbo' | 'advanced_lbo'): number {
  const requiredCells = getRequiredCells(scenario)
  if (requiredCells.length === 0) return 0
  
  const completed = requiredCells.filter(cell => completedCells.has(cell)).length
  return Math.round((completed / requiredCells.length) * 100)
}