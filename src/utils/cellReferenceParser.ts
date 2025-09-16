// Cell reference parser for Excel-like formulas
export interface CellValue {
  value: string;
  formula: string;
}

// Parse cell reference (e.g., "B4" -> {col: 1, row: 3})
export const parseCellRef = (ref: string): { col: number; row: number } | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const col = match[1].split('').reduce((acc, char, idx) => {
    return acc + (char.charCodeAt(0) - 65) * Math.pow(26, match[1].length - idx - 1);
  }, 0);

  const row = parseInt(match[2], 10) - 1;
  return { col, row };
};

// Convert col/row to cell reference (e.g., {col: 1, row: 3} -> "B4")
export const getCellRef = (col: number, row: number): string => {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
};

// Evaluate formula with cell references
export const evaluateFormulaWithRefs = (
  formula: string,
  cells: Record<string, CellValue>,
  currentCellRef?: string
): string => {
  if (!formula.startsWith('=')) return formula;

  let expression = formula.substring(1).toUpperCase();

  // Replace cell references with their values
  // Match patterns like A1, B4, AA12, etc.
  const cellRefPattern = /\b([A-Z]+\d+)\b/g;

  expression = expression.replace(cellRefPattern, (match, cellRef) => {
    // Prevent circular references
    if (currentCellRef && cellRef === currentCellRef) {
      throw new Error(`Circular reference detected: ${cellRef}`);
    }

    const cell = cells[cellRef];
    if (!cell) return '0'; // Default to 0 if cell doesn't exist

    // If the referenced cell has a formula, evaluate it first (recursive)
    if (cell.formula && cell.formula.startsWith('=')) {
      try {
        return evaluateFormulaWithRefs(cell.formula, cells, cellRef);
      } catch (e) {
        console.error(`Error evaluating referenced cell ${cellRef}:`, e);
        return '0';
      }
    }

    // Otherwise return the cell's value
    const value = cell.value || '0';
    // Remove $ and , from numbers
    const cleanValue = value.replace(/[$,]/g, '');
    // If it's a percentage, convert to decimal
    if (cleanValue.endsWith('%')) {
      return (parseFloat(cleanValue) / 100).toString();
    }
    return isNaN(parseFloat(cleanValue)) ? '0' : cleanValue;
  });

  // Now evaluate the expression
  try {
    // Replace Excel-style operators with JavaScript operators
    expression = expression
      .replace(/\^/g, '**') // Power operator
      .replace(/([0-9.]+)%/g, '($1/100)'); // Percentage to decimal

    // Use Function constructor for safer evaluation than eval
    // Only allow basic math operations
    const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = new Function('return ' + safeExpression)();

    // Format the result
    if (typeof result === 'number') {
      return result.toFixed(2).replace(/\.00$/, '');
    }
    return result.toString();
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR';
  }
};

// Get all cell references in a formula
export const extractCellRefs = (formula: string): string[] => {
  if (!formula.startsWith('=')) return [];

  const cellRefPattern = /\b([A-Z]+\d+)\b/g;
  const refs: string[] = [];
  let match;

  while ((match = cellRefPattern.exec(formula)) !== null) {
    refs.push(match[1]);
  }

  return Array.from(new Set(refs)); // Remove duplicates
};

// Fill formula across cells (for Ctrl+R functionality)
export const fillFormulaRight = (
  formula: string,
  fromCol: number,
  fromRow: number,
  toCol: number,
  adjustReferences: boolean = true
): string => {
  if (!formula.startsWith('=')) return formula;

  if (!adjustReferences) return formula;

  const colDiff = toCol - fromCol;

  // Adjust cell references in the formula
  let adjustedFormula = formula.replace(/\b([A-Z]+)(\d+)\b/g, (match, colLetters, rowNum) => {
    // Check if it's an absolute reference (with $)
    const isAbsoluteCol = match.startsWith('$');
    const isAbsoluteRow = match.includes('$' + rowNum);

    if (isAbsoluteCol && isAbsoluteRow) return match;

    let col = 0;
    for (let i = 0; i < colLetters.length; i++) {
      col = col * 26 + (colLetters.charCodeAt(i) - 65 + 1);
    }
    col--; // Convert to 0-based

    if (!isAbsoluteCol) {
      col += colDiff;
      if (col < 0) return match; // Don't adjust if it would go negative
    }

    // Convert back to letter(s)
    let newColLetters = '';
    let tempCol = col;
    while (tempCol >= 0) {
      newColLetters = String.fromCharCode(65 + (tempCol % 26)) + newColLetters;
      tempCol = Math.floor(tempCol / 26) - 1;
      if (tempCol < 0) break;
    }

    return newColLetters + rowNum;
  });

  return adjustedFormula;
};

// Fill formula down (for future Ctrl+D functionality)
export const fillFormulaDown = (
  formula: string,
  fromCol: number,
  fromRow: number,
  toRow: number,
  adjustReferences: boolean = true
): string => {
  if (!formula.startsWith('=')) return formula;

  if (!adjustReferences) return formula;

  const rowDiff = toRow - fromRow;

  // Adjust cell references in the formula
  let adjustedFormula = formula.replace(/\b([A-Z]+)(\d+)\b/g, (match, colLetters, rowNum) => {
    // Check if it's an absolute reference (with $)
    const isAbsoluteRow = match.includes('$' + rowNum);

    if (isAbsoluteRow) return match;

    const row = parseInt(rowNum, 10);
    const newRow = row + rowDiff;

    if (newRow < 1) return match; // Don't adjust if it would go below row 1

    return colLetters + newRow;
  });

  return adjustedFormula;
};