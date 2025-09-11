import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import { evaluateFormula } from '../utils/formulaParser';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LBOContainer = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
  padding: 1rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Logo = styled.h1`
  font-size: 24px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin: 0;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background-color: transparent;
  color: ${theme.colors.primary};
  border: 2px solid ${theme.colors.primary};
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.primary};
    color: ${theme.colors.white};
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.text};
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.primary};
`;

const ModelingInterface = styled.div`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  animation: ${fadeIn} 0.8s ease-out 0.2s backwards;
  min-height: 600px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(65, 83, 120, 0.1);
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.$active ? theme.colors.primary : theme.colors.text};
  border-bottom: 3px solid ${props => props.$active ? theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const FormulaBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: ${theme.colors.background};
  border-radius: 10px;
`;

const CellReference = styled.div`
  font-weight: bold;
  color: ${theme.colors.primary};
  min-width: 60px;
`;

const FormulaInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 2px solid rgba(65, 83, 120, 0.2);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  background-color: ${theme.colors.white};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const SpreadsheetContainer = styled.div`
  overflow: auto;
  max-height: 500px;
  border: 2px solid rgba(65, 83, 120, 0.1);
  border-radius: 10px;
`;

const SpreadsheetTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const HeaderCell = styled.th`
  background-color: ${theme.colors.background};
  padding: 8px;
  border: 1px solid rgba(65, 83, 120, 0.2);
  font-weight: bold;
  color: ${theme.colors.primary};
  min-width: 120px;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const DataCell = styled.td<{ $isSelected?: boolean; $isCorrect?: boolean; $hasError?: boolean; $hasHint?: boolean }>`
  padding: 4px 8px;
  border: 1px solid rgba(65, 83, 120, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background-color: ${props => {
    if (props.$isSelected) return 'rgba(65, 83, 120, 0.1)';
    if (props.$isCorrect) return 'rgba(34, 197, 94, 0.1)';
    if (props.$hasError) return 'rgba(239, 68, 68, 0.1)';
    return 'white';
  }};
  
  ${props => props.$hasHint && `
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    
    &::after {
      content: "?";
      position: absolute;
      top: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: rgba(59, 130, 246, 0.8);
      color: white;
      border-radius: 50%;
      font-size: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      pointer-events: none;
    }
  `}

  &:hover {
    background-color: rgba(65, 83, 120, 0.05);
  }
`;

const CellInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  padding: 2px;

  &:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: -2px;
  }
`;

const CompletionPopup = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(65, 83, 120, 0.3);
  z-index: 1000;
  text-align: center;
  max-width: 400px;
  width: 90%;
`;

const CompletionTitle = styled.h3`
  font-size: 24px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 1rem;
`;

const CompletionText = styled.p`
  color: ${theme.colors.text};
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const CompletionButton = styled.button`
  padding: 12px 24px;
  background-color: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }
`;

const HintTooltip = styled.div`
  position: fixed;
  background: ${theme.colors.primary};
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  max-width: 300px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 20px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid ${theme.colors.primary};
  }
`;

interface Cell {
  value: string;
  formula: string;
  isLocked: boolean;
  isCorrect?: boolean;
  hasHint?: boolean;
}

interface LBOModelerProps {
  problemId: string;
  problemName: string;
}

const LBOModeler: React.FC<LBOModelerProps> = ({ problemId, problemName }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'setup' | 'model' | 'solution'>('setup');
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showHint, setShowHint] = useState<{cellRef: string; text: string; x: number; y: number} | null>(null);
  const [hintUsage, setHintUsage] = useState<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCells();
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const initializeCells = () => {
    const initialCells: Record<string, Cell> = {};
    
    // Initialize grid (7 columns x 25 rows for comprehensive model)
    for (let row = 1; row <= 25; row++) {
      for (let col = 0; col <= 6; col++) {
        const cellId = `${String.fromCharCode(65 + col)}${row}`;
        initialCells[cellId] = {
          value: '',
          formula: '',
          isLocked: false,
          hasHint: false
        };
      }
    }

    // Comprehensive TechCorp LBO Model
    const lockedCells = {
      // Headers
      'A1': { value: 'TechCorp LBO Model', isLocked: true },
      'B1': { value: 'LTM', isLocked: true },
      'C1': { value: 'Year 1', isLocked: true },
      'D1': { value: 'Year 2', isLocked: true },
      'E1': { value: 'Year 3', isLocked: true },
      'F1': { value: 'Year 4', isLocked: true },
      'G1': { value: 'Year 5', isLocked: true },
      
      // Income Statement
      'A2': { value: '', isLocked: true },
      'A3': { value: '━━━ INCOME STATEMENT ━━━', isLocked: true },
      'A4': { value: 'Revenue ($M)', isLocked: true },
      'B4': { value: '50.0', isLocked: true },
      'A5': { value: 'EBITDA ($M)', isLocked: true },
      'B5': { value: '12.5', isLocked: true },
      'A6': { value: 'D&A ($M)', isLocked: true },
      'B6': { value: '2.0', isLocked: true },
      'A7': { value: 'EBIT ($M)', isLocked: true },
      'A8': { value: 'Interest Expense ($M)', isLocked: true },
      'A9': { value: 'EBT ($M)', isLocked: true },
      'A10': { value: 'Taxes ($M)', isLocked: true },
      'A11': { value: 'Net Income ($M)', isLocked: true },
      
      // Cash Flow Statement  
      'A12': { value: '', isLocked: true },
      'A13': { value: '━━━ CASH FLOW ━━━', isLocked: true },
      'A14': { value: 'EBITDA ($M)', isLocked: true },
      'A15': { value: 'Capex ($M)', isLocked: true },
      'A16': { value: 'Working Capital ($M)', isLocked: true },
      'A17': { value: 'Free Cash Flow ($M)', isLocked: true },
      
      // Debt Schedule
      'A18': { value: '', isLocked: true },
      'A19': { value: '━━━ DEBT SCHEDULE ━━━', isLocked: true },
      'A20': { value: 'Beginning Debt ($M)', isLocked: true },
      'B20': { value: '87.5', isLocked: true }, // 7x LTM EBITDA
      'A21': { value: 'FCF to Debt Paydown ($M)', isLocked: true },
      'A22': { value: 'Ending Debt ($M)', isLocked: true },
      
      // Returns Analysis
      'A23': { value: '', isLocked: true },
      'A24': { value: '━━━ RETURNS ━━━', isLocked: true },
      'A25': { value: 'Exit EV ($M)', isLocked: true }
    };

    // Apply locked cells
    Object.entries(lockedCells).forEach(([cellId, data]) => {
      initialCells[cellId] = {
        ...initialCells[cellId],
        ...data
      };
    });

    // Mark cells that can have hints
    const hintableCells = markCellsWithHints();
    hintableCells.forEach(cellId => {
      if (initialCells[cellId] && !initialCells[cellId].isLocked) {
        initialCells[cellId].hasHint = true;
      }
    });

    setCells(initialCells);
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalCells = Object.keys(cells).filter(key => !cells[key].isLocked).length;
    const completedCount = completedCells.size;
    return totalCells > 0 ? Math.round((completedCount / totalCells) * 100) : 0;
  };

  const getCellValue = useCallback((cellRef: string): number | string | null => {
    const cell = cells[cellRef];
    if (!cell || !cell.value) return 0;  // Empty cells return 0, like Excel
    
    if (cell.formula && cell.formula.startsWith('=')) {
      return evaluateFormula(cell.formula, getCellValue);
    }
    
    const num = parseFloat(cell.value);
    return isNaN(num) ? 0 : num;  // Non-numeric values also return 0
  }, [cells]);

  const validateFormula = (cellId: string, formula: string): boolean => {
    const validFormulas: Record<string, string[]> = {
      // Revenue projections (10% growth)
      'C4': ['=B4*1.1', '=B4*(1+0.1)', '=B4*1.10'],
      'D4': ['=C4*1.1', '=C4*(1+0.1)', '=C4*1.10'],
      'E4': ['=D4*1.1', '=D4*(1+0.1)', '=D4*1.10'],
      'F4': ['=E4*1.1', '=E4*(1+0.1)', '=E4*1.10'],
      'G4': ['=F4*1.1', '=F4*(1+0.1)', '=F4*1.10'],
      
      // EBITDA calculations (25% margin)
      'C5': ['=C4*0.25', '=C4*25%', '=C4*0.25'],
      'D5': ['=D4*0.25', '=D4*25%', '=D4*0.25'],
      'E5': ['=E4*0.25', '=E4*25%', '=E4*0.25'],
      'F5': ['=F4*0.25', '=F4*25%', '=F4*0.25'],
      'G5': ['=G4*0.25', '=G4*25%', '=G4*0.25'],

      // EBIT calculations (EBITDA - D&A)
      'B7': ['=B5-B6', '=B5-2', '=B5-2.0'],
      'C7': ['=C5-B6', '=C5-2', '=C5-2.0'],
      'D7': ['=D5-B6', '=D5-2', '=D5-2.0'],
      'E7': ['=E5-B6', '=E5-2', '=E5-2.0'],
      'F7': ['=F5-B6', '=F5-2', '=F5-2.0'],
      'G7': ['=G5-B6', '=G5-2', '=G5-2.0'],

      // Cash Flow - EBITDA reference
      'C14': ['=C5', '=C14'],
      'D14': ['=D5', '=D14'],
      'E14': ['=E5', '=E14'],
      'F14': ['=F5', '=F14'],
      'G14': ['=G5', '=G14'],

      // Cash Flow - Capex (3% of revenue)
      'C15': ['=C4*0.03', '=C4*3%', '=C4*0.03'],
      'D15': ['=D4*0.03', '=D4*3%', '=D4*0.03'],
      'E15': ['=E4*0.03', '=E4*3%', '=E4*0.03'],
      'F15': ['=F4*0.03', '=F4*3%', '=F4*0.03'],
      'G15': ['=G4*0.03', '=G4*3%', '=G4*0.03'],

      // Free Cash Flow (EBITDA - Capex - WC, WC=0)
      'C17': ['=C14-C15', '=C14-C15-C16', '=C5-C15'],
      'D17': ['=D14-D15', '=D14-D15-D16', '=D5-D15'],
      'E17': ['=E14-E15', '=E14-E15-E16', '=E5-E15'],
      'F17': ['=F14-F15', '=F14-F15-F16', '=F5-F15'],
      'G17': ['=G14-G15', '=G14-G15-G16', '=G5-G15'],

      // Debt Schedule - Beginning Debt
      'C20': ['=B20', '=87.5'],
      'D20': ['=C22'],
      'E20': ['=D22'],
      'F20': ['=E22'],
      'G20': ['=F22'],

      // FCF to Debt Paydown
      'C21': ['=C17'],
      'D21': ['=D17'],
      'E21': ['=E17'],
      'F21': ['=F17'],
      'G21': ['=G17'],

      // Ending Debt
      'C22': ['=C20-C21'],
      'D22': ['=D20-D21'],
      'E22': ['=E20-E21'],
      'F22': ['=F20-F21'],
      'G22': ['=G20-G21'],

      // Exit EV (14x Year 5 EBITDA)
      'G25': ['=G5*14', '=14*G5']
    };

    const acceptableFormulas = validFormulas[cellId] || [];
    const normalizedInput = formula.toUpperCase().replace(/\s/g, '');
    
    return acceptableFormulas.some(valid => 
      valid.toUpperCase().replace(/\s/g, '') === normalizedInput
    );
  };

  const getHintText = (cellRef: string, difficulty: string = 'beginner', attemptNumber: number = 0): string | null => {
    const hints: Record<string, Record<string, string[]>> = {
      // Revenue Growth Hints
      'C4': {
        beginner: [
          "This cell needs Year 1 revenue. Use 10% growth from LTM revenue.",
          "Multiply the LTM revenue (B4) by 1.1 for 10% growth",
          "Enter: =B4*1.1"
        ],
        intermediate: [
          "Calculate Year 1 revenue with 10% growth",
          "Formula: Previous year × (1 + growth rate)"
        ],
        advanced: ["Revenue projection needed"]
      },
      'D4': {
        beginner: [
          "Year 2 revenue: Apply 10% growth to Year 1 revenue",
          "Use the Year 1 revenue (C4) and multiply by 1.1",
          "Enter: =C4*1.1"
        ],
        intermediate: ["Apply 10% growth to previous year"],
        advanced: ["Revenue growth formula"]
      },
      'E4': {
        beginner: ["Year 3 revenue: =D4*1.1"],
        intermediate: ["Continue 10% growth pattern"],
        advanced: ["Revenue projection"]
      },
      'F4': {
        beginner: ["Year 4 revenue: =E4*1.1"],
        intermediate: ["Continue growth trend"],
        advanced: ["Revenue calculation"]
      },
      'G4': {
        beginner: ["Year 5 revenue: =F4*1.1"],
        intermediate: ["Final year growth"],
        advanced: ["Revenue formula"]
      },

      // EBITDA Hints
      'C5': {
        beginner: [
          "Calculate EBITDA using 25% margin on revenue",
          "Multiply Year 1 revenue (C4) by 0.25",
          "Enter: =C4*0.25"
        ],
        intermediate: ["Apply 25% EBITDA margin to revenue"],
        advanced: ["EBITDA calculation"]
      },
      'D5': {
        beginner: ["Year 2 EBITDA: =D4*0.25"],
        intermediate: ["25% margin on Year 2 revenue"],
        advanced: ["EBITDA formula"]
      },

      // Cash Flow Hints
      'C15': {
        beginner: [
          "Capex is 3% of revenue each year",
          "Multiply Year 1 revenue (C4) by 0.03",
          "Enter: =C4*0.03"
        ],
        intermediate: ["Calculate capex as 3% of revenue"],
        advanced: ["Capex calculation"]
      },
      'C17': {
        beginner: [
          "Free Cash Flow = EBITDA - Capex (working capital is 0)",
          "Subtract capex (C15) from EBITDA (C14)",
          "Enter: =C14-C15"
        ],
        intermediate: ["FCF = EBITDA - Capex - Working Capital"],
        advanced: ["Free cash flow formula"]
      }
    };

    const cellHints = hints[cellRef];
    if (!cellHints) return null;

    const difficultyHints = cellHints[difficulty];
    if (!difficultyHints) return cellHints['beginner']?.[0] || null;

    return difficultyHints[Math.min(attemptNumber, difficultyHints.length - 1)] || null;
  };

  const markCellsWithHints = () => {
    const hintableCells = [
      'C4', 'D4', 'E4', 'F4', 'G4', // Revenue
      'C5', 'D5', 'E5', 'F5', 'G5', // EBITDA  
      'B7', 'C7', 'D7', 'E7', 'F7', 'G7', // EBIT
      'C14', 'D14', 'E14', 'F14', 'G14', // Cash flow EBITDA
      'C15', 'D15', 'E15', 'F15', 'G15', // Capex
      'C17', 'D17', 'E17', 'F17', 'G17', // FCF
      'C20', 'D20', 'E20', 'F20', 'G20', // Beginning debt
      'C21', 'D21', 'E21', 'F21', 'G21', // Debt paydown
      'C22', 'D22', 'E22', 'F22', 'G22', // Ending debt
      'G25' // Exit EV
    ];

    return hintableCells;
  };

  const handleCellClick = (col: number, row: number) => {
    setSelectedCell({ col, row });
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const cell = cells[cellRef];
    setFormulaBarValue(cell?.formula || '');
  };

  const handleCellChange = (col: number, row: number, value: string) => {
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const newCells = { ...cells };
    
    if (newCells[cellRef] && !newCells[cellRef].isLocked) {
      newCells[cellRef] = {
        ...newCells[cellRef],
        value: value,
        formula: value.startsWith('=') ? value : value
      };
      setCells(newCells);
      
      // Proper validation logic
      const newCompleted = new Set(completedCells);
      
      if (!value || value.trim() === '') {
        // Clear cell - remove from completed
        newCompleted.delete(cellRef);
      } else if (value.startsWith('=')) {
        // Formula validation
        if (validateFormula(cellRef, value)) {
          newCompleted.add(cellRef);
          setScore(prev => prev + 100); // Higher score for correct formulas
        } else {
          newCompleted.delete(cellRef);
        }
      } else {
        // Hard-coded value - check if it's a valid expected result
        const expectedValues: Record<string, number> = {
          // Entry valuation calculations
          'B6': 150.0,  // 12.5 * 12 = Entry EV
          'B7': 87.5,   // 12.5 * 7 = Total Debt  
          'B8': 62.5,   // 150 - 87.5 = Equity Check
        };
        
        const numValue = parseFloat(value);
        const expected = expectedValues[cellRef];
        
        if (expected !== undefined && Math.abs(numValue - expected) < 0.1) {
          newCompleted.add(cellRef);
          setScore(prev => prev + 50); // Lower score for hard-coded values
        } else {
          newCompleted.delete(cellRef);
        }
      }
      
      setCompletedCells(newCompleted);
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate('/problems');
  };

  const handleComplete = () => {
    setShowCompletionPopup(false);
    navigate('/problems');
  };

  const handleCellRightClick = (e: React.MouseEvent, col: number, row: number) => {
    e.preventDefault(); // Prevent browser context menu
    
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const cell = cells[cellRef];
    
    if (cell?.hasHint && !cell.isLocked) {
      const difficulty = 'beginner'; // TODO: Get from problem difficulty
      const attemptCount = hintUsage[cellRef] || 0;
      const hintText = getHintText(cellRef, difficulty, attemptCount);
      
      if (hintText) {
        setShowHint({
          cellRef,
          text: hintText,
          x: e.clientX,
          y: e.clientY - 60
        });
        
        // Track hint usage
        setHintUsage(prev => ({
          ...prev,
          [cellRef]: attemptCount + 1
        }));
        
        // Reduce score for using hints
        setScore(prev => Math.max(0, prev - 25));
        
        // Hide hint after 5 seconds
        setTimeout(() => setShowHint(null), 5000);
      }
    }
  };

  const handleClickOutside = () => {
    setShowHint(null);
  };

  const renderCell = (col: number, row: number) => {
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const cell = cells[cellRef];
    const isSelected = selectedCell?.col === col && selectedCell?.row === row;

    return (
      <DataCell
        key={cellRef}
        $isSelected={isSelected}
        $isCorrect={completedCells.has(cellRef)}
        $hasHint={cell?.hasHint && !cell?.isLocked && !completedCells.has(cellRef)}
        onClick={() => handleCellClick(col, row)}
        onContextMenu={(e) => handleCellRightClick(e, col, row)}
      >
        {cell?.isLocked ? (
          cell.value
        ) : (
          <CellInput
            value={cell?.value || ''}
            onChange={(e) => handleCellChange(col, row, e.target.value)}
            onFocus={() => handleCellClick(col, row)}
          />
        )}
      </DataCell>
    );
  };

  return (
    <LBOContainer onClick={handleClickOutside}>
      <Header>
        <Logo onClick={handleGoHome}>Hugo</Logo>
        <HeaderActions>
          <BackButton onClick={handleGoBack}>← Back to Problems</BackButton>
          <StatsContainer>
            <StatItem>
              <StatLabel>Time</StatLabel>
              <StatValue>{formatTime(timer)}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Score</StatLabel>
              <StatValue>{score}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Progress</StatLabel>
              <StatValue>{getProgress()}%</StatValue>
            </StatItem>
          </StatsContainer>
        </HeaderActions>
      </Header>

      <ModelingInterface>
        <h2 style={{ color: theme.colors.primary, marginBottom: '1rem' }}>
          {problemName}
        </h2>

        <TabContainer>
          <Tab $active={activeTab === 'setup'} onClick={() => setActiveTab('setup')}>
            Setup
          </Tab>
          <Tab $active={activeTab === 'model'} onClick={() => setActiveTab('model')}>
            Model
          </Tab>
          <Tab $active={activeTab === 'solution'} onClick={() => setActiveTab('solution')}>
            Solution
          </Tab>
        </TabContainer>

        {activeTab === 'setup' && (
          <div style={{ padding: '2rem', lineHeight: '1.6' }}>
            <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>TechCorp LBO Analysis</h3>
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Background</h4>
              <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                TechCorp is a fast-growing SaaS company with strong fundamentals. Your private equity firm is considering 
                acquiring the company and wants you to model the potential returns from this LBO investment.
              </p>
              <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                The company has shown consistent growth and maintains healthy EBITDA margins. You'll need to project 
                future performance and calculate the potential returns based on the entry and exit valuations.
              </p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Key Assumptions</h4>
              <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                <li><strong>Revenue growth:</strong> 10% annually</li>
                <li><strong>EBITDA margin:</strong> 25% (consistent)</li>
                <li><strong>D&A:</strong> $2M annually (constant)</li>
                <li><strong>Capex:</strong> 3% of revenue</li>
                <li><strong>Working capital:</strong> 0% change (simplified)</li>
                <li><strong>Tax rate:</strong> 25%</li>
                <li><strong>Interest rate:</strong> 8% on debt</li>
                <li><strong>Entry multiple:</strong> 12x LTM EBITDA</li>
                <li><strong>Exit multiple:</strong> 14x Year 5 EBITDA</li>
                <li><strong>Initial debt:</strong> 7x LTM EBITDA ($87.5M)</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Your Task</h4>
              <p style={{ color: theme.colors.text }}>
                Build a complete LBO model to calculate the MOIC (Multiple on Invested Capital) and IRR (Internal Rate of Return) 
                for this investment. Click the "Model" tab to start building your analysis.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'model' && (
          <>
            <FormulaBar>
              <CellReference>
                {selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : 'A1'}
              </CellReference>
              <FormulaInput
                value={formulaBarValue}
                onChange={(e) => setFormulaBarValue(e.target.value)}
                placeholder="Enter formula or value..."
              />
            </FormulaBar>

            <SpreadsheetContainer>
              <SpreadsheetTable>
                <thead>
                  <tr>
                    <HeaderCell></HeaderCell>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(col => (
                      <HeaderCell key={col}>{col}</HeaderCell>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(25)].map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      <HeaderCell>{rowIndex + 1}</HeaderCell>
                      {[...Array(7)].map((_, colIndex) => renderCell(colIndex, rowIndex))}
                    </tr>
                  ))}
                </tbody>
              </SpreadsheetTable>
            </SpreadsheetContainer>
          </>
        )}

        {activeTab === 'solution' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>Solution</h3>
            <div style={{ color: theme.colors.text, lineHeight: '1.6' }}>
              <h4 style={{ marginBottom: '1rem' }}>Expected Results:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <strong>Income Statement (Year 5):</strong>
                  <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                    <li>Revenue: $80.5M</li>
                    <li>EBITDA: $20.1M</li>
                    <li>EBIT: $18.1M</li>
                    <li>Interest: $2.8M</li>
                    <li>EBT: $15.3M</li>
                    <li>Net Income: $11.5M</li>
                  </ul>
                </div>
                <div>
                  <strong>Returns Analysis:</strong>
                  <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                    <li>Exit EV: $281.8M</li>
                    <li>Final Debt: $35.0M</li>
                    <li>Exit Equity: $246.8M</li>
                    <li>Entry Equity: $62.5M</li>
                    <li><strong>MOIC: 3.95x</strong></li>
                    <li><strong>IRR: 31.5%</strong></li>
                  </ul>
                </div>
              </div>
              
              <h4 style={{ marginBottom: '1rem' }}>Key Formula Categories:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <strong>Income Statement:</strong>
                  <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                    <li>Revenue: =Previous * 1.1</li>
                    <li>EBITDA: =Revenue * 0.25</li>
                    <li>EBIT: =EBITDA - D&A</li>
                    <li>Interest: =Avg Debt * 8%</li>
                    <li>EBT: =EBIT - Interest</li>
                    <li>Taxes: =EBT * 25%</li>
                  </ul>
                </div>
                <div>
                  <strong>Cash Flow & Debt:</strong>
                  <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                    <li>FCF: =EBITDA - Capex - WC</li>
                    <li>Capex: =Revenue * 3%</li>
                    <li>Debt Paydown: =FCF</li>
                    <li>End Debt: =Begin - Paydown</li>
                    <li>Exit Equity: =Exit EV - End Debt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModelingInterface>

      {/* Hint Tooltip */}
      {showHint && (
        <HintTooltip
          style={{
            left: showHint.x,
            top: showHint.y
          }}
        >
          {showHint.text}
        </HintTooltip>
      )}

      <AnimatePresence>
        {showCompletionPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999
              }}
              onClick={() => setShowCompletionPopup(false)}
            />
            <CompletionPopup
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <CompletionTitle>🎉 Congratulations!</CompletionTitle>
              <CompletionText>
                You've completed the {problemName} LBO model with a score of {score} points in {formatTime(timer)}!
              </CompletionText>
              <CompletionButton onClick={handleComplete}>
                Continue
              </CompletionButton>
            </CompletionPopup>
          </>
        )}
      </AnimatePresence>
    </LBOContainer>
  );
};

export default LBOModeler;