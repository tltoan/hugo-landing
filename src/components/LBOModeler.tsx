import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import { evaluateFormula } from '../utils/formulaParser';
import {
  evaluateFormulaWithRefs,
  fillFormulaRight,
  fillFormulaDown,
  getCellRef
} from '../utils/cellReferenceParser';

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

const ShortcutsModal = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
`;

const ShortcutsContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ShortcutsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const ShortcutsTitle = styled.h2`
  font-family: ${theme.fonts.header};
  color: ${theme.colors.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${theme.colors.text};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const ShortcutSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-family: ${theme.fonts.header};
  color: ${theme.colors.primary};
  font-size: 18px;
  margin-bottom: 0.5rem;
`;

const ShortcutList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ShortcutItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: ${theme.colors.background};
  border-radius: 6px;
`;

const ShortcutKey = styled.code`
  background-color: ${theme.colors.primary};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
`;

const ShortcutDescription = styled.span`
  color: ${theme.colors.text};
  font-size: 14px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Logo = styled.h1`
  font-size: 50px;
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

const ClearButton = styled.button`
  padding: 6px 12px;
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #e74c3c;
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

const DataCell = styled.td<{ $isSelected?: boolean; $isInRange?: boolean; $isCorrect?: boolean; $hasError?: boolean; $hasHint?: boolean; $isDragTarget?: boolean; $isCopied?: boolean; $isReferenced?: boolean }>`
  padding: 4px 8px;
  border: 1px solid rgba(65, 83, 120, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background-color: ${props => {
    if (props.$isDragTarget) return 'rgba(59, 130, 246, 0.1)';
    if (props.$isInRange) return 'rgba(59, 130, 246, 0.08)';
    if (props.$isSelected) return 'rgba(65, 83, 120, 0.1)';
    if (props.$isCorrect) return 'rgba(34, 197, 94, 0.1)';
    if (props.$hasError) return 'rgba(239, 68, 68, 0.1)';
    if (props.$isReferenced) return 'rgba(147, 51, 234, 0.05)';
    return 'white';
  }};

  ${props => props.$isInRange && `
    border: 1px solid rgba(59, 130, 246, 0.5);
    background-color: rgba(59, 130, 246, 0.08) !important;
  `};

  ${props => props.$isDragTarget && `
    border: 2px solid rgba(59, 130, 246, 0.8);
    background-color: rgba(59, 130, 246, 0.15);
    box-shadow: inset 0 0 5px rgba(59, 130, 246, 0.2);
  `};

  ${props => props.$isCopied && `
    border: 2px dashed ${theme.colors.primary};
    animation: pulse 1s infinite;
  `};

  ${props => props.$isReferenced && `
    border: 2px dashed #9333ea;
    box-shadow: 0 0 0 1px rgba(147, 51, 234, 0.2);
    animation: pulse 0.5s ease-in-out;
  `};

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

const FillHandle = styled.div`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: ${theme.colors.primary};
  border: 1px solid white;
  cursor: crosshair;
  z-index: 10;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);

  &:hover {
    background: ${theme.colors.buttonPrimary};
    transform: scale(1.3);
  }

  &:active {
    background: ${theme.colors.buttonSecondary};
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

const HintTooltip = styled.div<{ $isError?: boolean }>`
  position: fixed;
  background: ${props => props.$isError ? '#ef4444' : theme.colors.primary};
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  max-width: 350px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  border: ${props => props.$isError ? '2px solid #dc2626' : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 20px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid ${props => props.$isError ? '#ef4444' : theme.colors.primary};
  }
`;

const AssumptionsOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(20, 20, 30, 0.95);
  color: white;
  padding: 2rem 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 2000;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 400px;
  max-width: 600px;
`;

const AssumptionsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.75rem;
`;

const AssumptionSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AssumptionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const AssumptionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 14px;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const AssumptionName = styled.span`
  color: rgba(255, 255, 255, 0.9);
`;

const AssumptionValue = styled.span`
  color: #4ade80;
  font-weight: 600;
  font-family: 'Courier New', monospace;
`;

const OverlayHint = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
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
  const [activeTab, setActiveTab] = useState<'setup' | 'model' | 'solution' | 'forum'>('setup');
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: { col: number; row: number }; end: { col: number; row: number } } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [formulaBarCursorPos, setFormulaBarCursorPos] = useState(0);
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null);
  const [referencedCells, setReferencedCells] = useState<Set<string>>(new Set());
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showHint, setShowHint] = useState<{cellRef: string; text: string; x: number; y: number; isError?: boolean} | null>(null);
  const [hintUsage, setHintUsage] = useState<Record<string, number>>({});
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ col: number; row: number } | null>(null);
  const [copiedCell, setCopiedCell] = useState<{ col: number; row: number; value: string; formula: string } | null>(null);
  const [history, setHistory] = useState<Array<Record<string, Cell>>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const formulaBarRef = useRef<HTMLInputElement>(null);

  // Save state to localStorage
  const saveStateToLocalStorage = useCallback(() => {
    const stateToSave = {
      cells,
      completedCells: Array.from(completedCells),
      score,
      timer,
      problemId,
      timestamp: Date.now()
    };

    const key = `hugo_lbo_state_${problemId}`;
    try {
      localStorage.setItem(key, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [cells, completedCells, score, timer, problemId]);

  // Load state from localStorage
  const loadStateFromLocalStorage = useCallback(() => {
    const key = `hugo_lbo_state_${problemId}`;
    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // Check if saved state is for the same problem and not too old (24 hours)
        if (parsed.problemId === problemId &&
            Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {

          // Clean up cells data - ensure formulas are only set for actual formulas
          const cleanedCells = { ...parsed.cells };
          Object.keys(cleanedCells).forEach(cellId => {
            const cell = cleanedCells[cellId];
            // If the formula field doesn't start with '=', it's not a real formula
            if (cell.formula && !cell.formula.startsWith('=')) {
              cell.formula = '';
            }
          });

          setCells(cleanedCells);
          setCompletedCells(new Set(parsed.completedCells || []));
          setScore(parsed.score || 0);
          setTimer(parsed.timer || 0);

          return true;
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
    return false;
  }, [problemId]);

  // Clear saved state
  const clearSavedState = useCallback(() => {
    const key = `hugo_lbo_state_${problemId}`;
    try {
      localStorage.removeItem(key);
      initializeCells();
      setCompletedCells(new Set());
      setScore(0);
      setTimer(0);
    } catch (e) {
      console.error('Failed to clear saved state:', e);
    }
  }, [problemId]);

  useEffect(() => {
    // Try to load saved state first
    const hasLoadedState = loadStateFromLocalStorage();
    if (!hasLoadedState) {
      initializeCells();
    }
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  // Auto-save state when cells, score, or completed cells change
  useEffect(() => {
    // Don't save immediately on mount
    if (Object.keys(cells).length > 0) {
      const saveTimer = setTimeout(() => {
        saveStateToLocalStorage();
      }, 1000); // Debounce saves to avoid too frequent writes

      return () => clearTimeout(saveTimer);
    }
  }, [cells, completedCells, score, saveStateToLocalStorage]);

  // Debug: Monitor cells state changes
  useEffect(() => {
    console.log('Cells state updated. Checking for formulas...');
    // Log specific cells that have formulas
    Object.keys(cells).forEach(key => {
      if (cells[key].formula) {
        console.log(`Cell ${key}:`, {
          formula: cells[key].formula,
          value: cells[key].value,
          isFormula: cells[key].formula.startsWith('=')
        });
      }
    });
  }, [cells]);

  // Handle space bar for assumptions overlay and shortcuts modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts modal with ? key
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Close shortcuts modal with Escape
      if (e.key === 'Escape' && showShortcuts) {
        e.preventDefault();
        setShowShortcuts(false);
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        // Prevent default space bar behavior (scrolling)
        e.preventDefault();
        setShowAssumptions(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setShowAssumptions(false);
      }
    };

    // Add global keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShortcuts]);

  const getAssumptions = () => {
    // Return assumptions based on problem ID
    switch (problemId) {
      case '1': // TechCorp
        return {
          revenue: { label: 'Revenue', items: [
            { name: 'LTM Revenue', value: '$50M' },
            { name: 'Growth Rate (Y1-Y5)', value: '15%' }
          ]},
          margins: { label: 'Margins', items: [
            { name: 'EBITDA Margin', value: '25%' },
            { name: 'D&A % of Revenue', value: '4%' },
            { name: 'Tax Rate', value: '21%' }
          ]},
          transaction: { label: 'Transaction', items: [
            { name: 'Entry Multiple', value: '12x EBITDA' },
            { name: 'Debt/EBITDA', value: '7x' },
            { name: 'Exit Multiple', value: '14x EBITDA' }
          ]},
          other: { label: 'Cash Flow', items: [
            { name: 'Capex % of Revenue', value: '3%' },
            { name: 'NWC % of Revenue', value: '2%' }
          ]}
        };

      case '2': // RetailMax (Quarterly)
        return {
          revenue: { label: 'Revenue', items: [
            { name: 'LTM Revenue', value: '$120M' },
            { name: 'Q1 Seasonality', value: '70%' },
            { name: 'Q2-Q3 Growth', value: '5% / 3%' },
            { name: 'Q4 Holiday Boost', value: '140%' }
          ]},
          margins: { label: 'Margins', items: [
            { name: 'EBITDA Margin', value: '15%' },
            { name: 'Tax Rate', value: '25%' }
          ]},
          transaction: { label: 'Transaction', items: [
            { name: 'Entry Multiple', value: '9x EBITDA' },
            { name: 'Debt/EBITDA', value: '6x' },
            { name: 'Exit Multiple', value: '12x EBITDA' }
          ]},
          other: { label: 'Working Capital', items: [
            { name: 'Inventory Turns', value: '4-6x' },
            { name: 'DSO', value: '30 days' },
            { name: 'DPO', value: '45 days' }
          ]}
        };

      case '3': // Manufacturing Giant
        return {
          revenue: { label: 'Cyclical Revenue', items: [
            { name: 'Base Revenue', value: '$800M' },
            { name: 'Y1: Recovery', value: '+5%' },
            { name: 'Y2: Expansion', value: '+8%' },
            { name: 'Y3: Late Cycle', value: '+3%' },
            { name: 'Y4: Downturn', value: '-2%' },
            { name: 'Y5: Recovery', value: '+6%' }
          ]},
          margins: { label: 'Margins', items: [
            { name: 'EBITDA Margin', value: '18%' },
            { name: 'D&A', value: '$20M fixed' }
          ]},
          transaction: { label: 'Debt Structure', items: [
            { name: 'Term Loan A', value: '$200M @ L+250' },
            { name: 'Term Loan B', value: '$200M @ L+450' },
            { name: 'Revolver', value: '$67M undrawn' }
          ]},
          other: { label: 'Working Capital', items: [
            { name: 'Raw Materials', value: '7% of revenue' },
            { name: 'Finished Goods', value: '8% of revenue' },
            { name: 'Total Capex', value: '5% of revenue' }
          ]}
        };

      case '4': // Healthcare Services
        return {
          revenue: { label: 'Revenue Streams', items: [
            { name: 'Government', value: '$160M @ 8% growth' },
            { name: 'Commercial', value: '$120M @ 15% growth' },
            { name: 'Quality Adjust', value: '-5% to -2%' }
          ]},
          margins: { label: 'Margins', items: [
            { name: 'EBITDA Margin', value: '22-25%' },
            { name: 'Compliance Cost', value: '$2.5M/year' }
          ]},
          transaction: { label: 'Roll-up Strategy', items: [
            { name: 'Entry Multiple', value: '11x EBITDA' },
            { name: 'Acquisitions/Year', value: '2 targets' },
            { name: 'Target Multiple', value: '6-8x EBITDA' },
            { name: 'Exit Multiple', value: '14x EBITDA' }
          ]},
          other: { label: 'Integration', items: [
            { name: 'Integration Cost', value: '$5M per deal' },
            { name: 'Synergies', value: '15% of target EBITDA' }
          ]}
        };

      case '5': // Energy Conglomerate
        return {
          revenue: { label: 'Commodity Prices', items: [
            { name: 'Oil Price', value: '$75/bbl' },
            { name: 'Gas Price', value: '$4.50/mmbtu' },
            { name: 'Hedged %', value: '75% @ $72/bbl' },
            { name: 'Crack Spread', value: '$11/bbl' }
          ]},
          margins: { label: 'Division Performance', items: [
            { name: 'Upstream EBITDA', value: '35% margin' },
            { name: 'Midstream EBITDA', value: '60% margin' },
            { name: 'Downstream EBITDA', value: '8% margin' },
            { name: 'Renewables EBITDA', value: '40% margin' }
          ]},
          transaction: { label: 'ESG Transition', items: [
            { name: 'Carbon Price', value: '$50/ton by Y5' },
            { name: 'Green Capex', value: '$200M total' },
            { name: 'Exit Multiple', value: '8-10x EBITDA' }
          ]},
          other: { label: 'Capital Structure', items: [
            { name: 'RBL Facility', value: '$500M' },
            { name: 'Term Loan', value: '$1.5B' },
            { name: 'Target Leverage', value: '3.5x' }
          ]}
        };

      default: // Default to TechCorp
        return {
          revenue: { label: 'Revenue', items: [
            { name: 'Starting Revenue', value: '$50M' },
            { name: 'Growth Rate', value: '15%' }
          ]},
          margins: { label: 'Margins', items: [
            { name: 'EBITDA Margin', value: '25%' }
          ]},
          transaction: { label: 'Transaction', items: [
            { name: 'Entry Multiple', value: '12x' },
            { name: 'Exit Multiple', value: '14x' }
          ]}
        };
    }
  };

  const getTechCorpData = () => {
    const initialCells: Record<string, Cell> = {};
    
    // Initialize empty cells
    for (let row = 0; row < 28; row++) {
      for (let col = 0; col < 7; col++) {
        const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
        initialCells[cellId] = {
          value: '',
          formula: '',
          isLocked: false,
          hasHint: false
        };
      }
    }
    
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
      'A25': { value: 'Exit EV ($M)', isLocked: true },
      'A26': { value: 'Exit Equity ($M)', isLocked: true },
      'A27': { value: 'MOIC (Multiple)', isLocked: true },
      'A28': { value: 'IRR (%)', isLocked: true }
    };

    // Apply locked cells
    Object.entries(lockedCells).forEach(([cellId, data]) => {
      initialCells[cellId] = {
        ...initialCells[cellId],
        ...data,
        // Ensure locked cells don't have formulas unless explicitly set
        formula: (data as any).formula || ''
      };
    });

    // Mark cells that can have hints
    const hintableCells = markCellsWithHints();
    hintableCells.forEach(cellId => {
      if (initialCells[cellId] && !initialCells[cellId].isLocked) {
        initialCells[cellId].hasHint = true;
      }
    });

    return {
      title: 'TechCorp LBO Model',
      columns: 7,
      rows: 28,
      cells: initialCells
    };
  };

  const getRetailMaxData = () => {
    const initialCells: Record<string, Cell> = {};
    
    // Initialize empty cells for quarterly model (more columns)
    for (let row = 0; row < 35; row++) {
      for (let col = 0; col < 22; col++) { // A-V for quarterly periods
        const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
        initialCells[cellId] = {
          value: '',
          formula: '',
          isLocked: false,
          hasHint: false
        };
      }
    }
    
    const lockedCells = {
      // Headers
      'A1': { value: 'RetailMax Buyout Model', isLocked: true },
      'B1': { value: 'LTM', isLocked: true },
      'C1': { value: 'Q1Y1', isLocked: true },
      'D1': { value: 'Q2Y1', isLocked: true },
      'E1': { value: 'Q3Y1', isLocked: true },
      'F1': { value: 'Q4Y1', isLocked: true },
      'G1': { value: 'Q1Y2', isLocked: true },
      'H1': { value: 'Q2Y2', isLocked: true },
      'I1': { value: 'Q3Y2', isLocked: true },
      'J1': { value: 'Q4Y2', isLocked: true },
      'K1': { value: 'Q1Y3', isLocked: true },
      'L1': { value: 'Q2Y3', isLocked: true },
      'M1': { value: 'Q3Y3', isLocked: true },
      'N1': { value: 'Q4Y3', isLocked: true },
      'O1': { value: 'Q1Y4', isLocked: true },
      'P1': { value: 'Q2Y4', isLocked: true },
      'Q1': { value: 'Q3Y4', isLocked: true },
      'R1': { value: 'Q4Y4', isLocked: true },
      'S1': { value: 'Q1Y5', isLocked: true },
      'T1': { value: 'Q2Y5', isLocked: true },
      'U1': { value: 'Q3Y5', isLocked: true },
      'V1': { value: 'Q4Y5', isLocked: true },
      
      // Income Statement
      'A2': { value: '', isLocked: true },
      'A3': { value: '━━━ INCOME STATEMENT ━━━', isLocked: true },
      'A4': { value: 'Revenue ($M)', isLocked: true },
      'B4': { value: '120.0', isLocked: true }, // LTM retail revenue
      'A5': { value: 'EBITDA ($M)', isLocked: true },
      'B5': { value: '18.0', isLocked: true }, // 15% margin (lower than tech)
      'A6': { value: 'D&A ($M)', isLocked: true },
      'B6': { value: '3.0', isLocked: true }, // Higher D&A for retail
      'A7': { value: 'EBIT ($M)', isLocked: true },
      
      // Working Capital Schedule
      'A8': { value: '', isLocked: true },
      'A9': { value: '━━━ WORKING CAPITAL ━━━', isLocked: true },
      'A10': { value: 'Inventory ($M)', isLocked: true },
      'B10': { value: '25.0', isLocked: true }, // 20.8% of LTM revenue
      'A11': { value: 'A/R ($M)', isLocked: true },
      'B11': { value: '8.0', isLocked: true }, // 6.7% of LTM revenue
      'A12': { value: 'A/P ($M)', isLocked: true },
      'B12': { value: '15.0', isLocked: true }, // 12.5% of LTM revenue
      'A13': { value: 'Net Working Capital ($M)', isLocked: true },
      'B13': { value: '18.0', isLocked: true }, // 25 + 8 - 15 = 18
      'A14': { value: 'Working Capital Change ($M)', isLocked: true },
      
      // Cash Flow Statement  
      'A15': { value: '', isLocked: true },
      'A16': { value: '━━━ CASH FLOW ━━━', isLocked: true },
      'A17': { value: 'EBITDA ($M)', isLocked: true },
      'A18': { value: 'Capex ($M)', isLocked: true },
      'A19': { value: 'Working Capital ($M)', isLocked: true },
      'A20': { value: 'Free Cash Flow ($M)', isLocked: true },
      
      // Debt Schedule
      'A21': { value: '', isLocked: true },
      'A22': { value: '━━━ DEBT SCHEDULE ━━━', isLocked: true },
      'A23': { value: 'Beginning Debt ($M)', isLocked: true },
      'B23': { value: '108.0', isLocked: true }, // 6x LTM EBITDA (lower leverage for retail)
      'A24': { value: 'FCF to Debt Paydown ($M)', isLocked: true },
      'A25': { value: 'Ending Debt ($M)', isLocked: true },
      
      // Returns Analysis
      'A26': { value: '', isLocked: true },
      'A27': { value: '━━━ RETURNS ━━━', isLocked: true },
      'A28': { value: 'Exit EV ($M)', isLocked: true },
      'A29': { value: 'Exit Equity ($M)', isLocked: true },
      'A30': { value: 'MOIC (Multiple)', isLocked: true },
      'A31': { value: 'IRR (%)', isLocked: true }
    };

    // Apply locked cells
    Object.entries(lockedCells).forEach(([cellId, data]) => {
      initialCells[cellId] = {
        ...initialCells[cellId],
        ...data,
        // Ensure locked cells don't have formulas unless explicitly set
        formula: (data as any).formula || ''
      };
    });

    // Mark cells that can have hints for RetailMax
    const hintableCells = markRetailMaxHints();
    hintableCells.forEach(cellId => {
      if (initialCells[cellId] && !initialCells[cellId].isLocked) {
        initialCells[cellId].hasHint = true;
      }
    });

    return {
      title: 'RetailMax Buyout Model',
      columns: 22,
      rows: 35,
      cells: initialCells
    };
  };

  const getManufacturingGiantData = () => {
    const initialCells: Record<string, Cell> = {};
    
    // Initialize empty cells (7 columns like TechCorp, but 40 rows for complexity)
    for (let row = 0; row < 40; row++) {
      for (let col = 0; col < 7; col++) {
        const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
        initialCells[cellId] = {
          value: '',
          formula: '',
          isLocked: false,
          hasHint: false
        };
      }
    }
    
    const lockedCells = {
      // Headers
      'A1': { value: 'Manufacturing Giant LBO Model', isLocked: true },
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
      'B4': { value: '400.0', isLocked: true }, // Large manufacturing company
      'A5': { value: 'EBITDA ($M)', isLocked: true },
      'B5': { value: '72.0', isLocked: true }, // 18% margin
      'A6': { value: 'D&A ($M)', isLocked: true },
      'B6': { value: '20.0', isLocked: true }, // Heavy asset base
      'A7': { value: 'EBIT ($M)', isLocked: true },
      'A8': { value: 'Interest Expense ($M)', isLocked: true },
      'A9': { value: 'EBT ($M)', isLocked: true },
      'A10': { value: 'Taxes ($M)', isLocked: true },
      'A11': { value: 'Net Income ($M)', isLocked: true },
      
      // Working Capital (More Complex)
      'A12': { value: '', isLocked: true },
      'A13': { value: '━━━ WORKING CAPITAL ━━━', isLocked: true },
      'A14': { value: 'Raw Materials ($M)', isLocked: true },
      'B14': { value: '28.0', isLocked: true }, // 7% of revenue
      'A15': { value: 'Finished Goods ($M)', isLocked: true },
      'B15': { value: '32.0', isLocked: true }, // 8% of revenue
      'A16': { value: 'Accounts Receivable ($M)', isLocked: true },
      'B16': { value: '40.0', isLocked: true }, // 10% of revenue
      'A17': { value: 'Accounts Payable ($M)', isLocked: true },
      'B17': { value: '24.0', isLocked: true }, // 6% of revenue
      'A18': { value: 'Net Working Capital ($M)', isLocked: true },
      'B18': { value: '76.0', isLocked: true }, // 28+32+40-24=76
      'A19': { value: 'Working Capital Change ($M)', isLocked: true },
      
      // Cash Flow Statement  
      'A20': { value: '', isLocked: true },
      'A21': { value: '━━━ CASH FLOW ━━━', isLocked: true },
      'A22': { value: 'EBITDA ($M)', isLocked: true },
      'A23': { value: 'Maintenance Capex ($M)', isLocked: true },
      'A24': { value: 'Growth Capex ($M)', isLocked: true },
      'A25': { value: 'Total Capex ($M)', isLocked: true },
      'A26': { value: 'Working Capital ($M)', isLocked: true },
      'A27': { value: 'Free Cash Flow ($M)', isLocked: true },
      
      // Multi-Tranche Debt Schedule
      'A28': { value: '', isLocked: true },
      'A29': { value: '━━━ DEBT SCHEDULE ━━━', isLocked: true },
      'A30': { value: 'Term Loan A - Beginning ($M)', isLocked: true },
      'B30': { value: '200.0', isLocked: true }, // Senior debt
      'A31': { value: 'Term Loan B - Beginning ($M)', isLocked: true },
      'B31': { value: '200.0', isLocked: true }, // Subordinated debt
      'A32': { value: 'Revolver - Beginning ($M)', isLocked: true },
      'B32': { value: '67.0', isLocked: true }, // Undrawn initially
      'A33': { value: 'Total Debt - Beginning ($M)', isLocked: true },
      'A34': { value: 'FCF to Debt Paydown ($M)', isLocked: true },
      'A35': { value: 'Total Debt - Ending ($M)', isLocked: true },
      
      // Covenant Testing (Mid-year)
      'A36': { value: '', isLocked: true },
      'A37': { value: '━━━ COVENANT TESTING ━━━', isLocked: true },
      'A38': { value: 'Leverage Ratio (must be <6.0x)', isLocked: true },
      'A39': { value: 'Coverage Ratio (must be >1.25x)', isLocked: true },
      
      // Returns Analysis
      'A40': { value: '━━━ RETURNS ━━━', isLocked: true }
    };

    // Apply locked cells
    Object.entries(lockedCells).forEach(([cellId, data]) => {
      initialCells[cellId] = {
        ...initialCells[cellId],
        ...data,
        // Ensure locked cells don't have formulas unless explicitly set
        formula: (data as any).formula || ''
      };
    });

    // Mark cells that can have hints for Manufacturing Giant
    const hintableCells = markManufacturingGiantHints();
    hintableCells.forEach(cellId => {
      if (initialCells[cellId] && !initialCells[cellId].isLocked) {
        initialCells[cellId].hasHint = true;
      }
    });

    return {
      title: 'Manufacturing Giant LBO Model',
      columns: 7,
      rows: 40,
      cells: initialCells
    };
  };

  const getHealthcareServicesData = () => {
    const initialCells: Record<string, Cell> = {};
    
    // Initialize empty cells (8 columns, 38 rows for healthcare complexity)
    for (let row = 0; row < 38; row++) {
      for (let col = 0; col < 8; col++) {
        const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
        initialCells[cellId] = {
          value: '',
          formula: '',
          isLocked: false,
          hasHint: false
        };
      }
    }
    
    const lockedCells = {
      // Headers
      'A1': { value: 'Healthcare Services LBO Model', isLocked: true },
      'B1': { value: 'LTM', isLocked: true },
      'C1': { value: 'Year 1', isLocked: true },
      'D1': { value: 'Year 2', isLocked: true },
      'E1': { value: 'Year 3', isLocked: true },
      'F1': { value: 'Year 4', isLocked: true },
      'G1': { value: 'Year 5', isLocked: true },
      'H1': { value: 'Exit', isLocked: true },
      
      // P&L Section Headers
      'A3': { value: 'INCOME STATEMENT ($M)', isLocked: true },
      'A4': { value: 'Revenue', isLocked: true, hasHint: true },
      'B4': { value: '320.0', isLocked: true },
      'A5': { value: '  Government Payers (60%)', isLocked: true },
      'B5': { value: '192.0', isLocked: true },
      'A6': { value: '  Commercial Payers (40%)', isLocked: true },
      'B6': { value: '128.0', isLocked: true },
      'A7': { value: 'Quality Bonuses/Penalties', isLocked: true, hasHint: true },
      'A8': { value: 'Adjusted Revenue', isLocked: true, hasHint: true },
      'A9': { value: 'EBITDA', isLocked: true, hasHint: true },
      'A10': { value: 'D&A', isLocked: true },
      'B10': { value: '12.0', isLocked: true },
      'A11': { value: 'EBIT', isLocked: true, hasHint: true },
      'A12': { value: 'Interest Expense', isLocked: true, hasHint: true },
      'A13': { value: 'EBT', isLocked: true, hasHint: true },
      'A14': { value: 'Taxes (25%)', isLocked: true, hasHint: true },
      'A15': { value: 'Net Income', isLocked: true, hasHint: true },
      
      // Cash Flow Section
      'A17': { value: 'CASH FLOW ($M)', isLocked: true },
      'A18': { value: 'EBITDA', isLocked: true },
      'A19': { value: 'Capex', isLocked: true, hasHint: true },
      'A20': { value: 'Working Capital Change', isLocked: true, hasHint: true },
      'A21': { value: 'Regulatory Compliance', isLocked: true, hasHint: true },
      'B21': { value: '2.5', isLocked: true },
      'A22': { value: 'Free Cash Flow', isLocked: true, hasHint: true },
      
      // Debt Section
      'A24': { value: 'DEBT SCHEDULE ($M)', isLocked: true },
      'A25': { value: 'Beginning Debt', isLocked: true },
      'B25': { value: '144.0', isLocked: true },
      'A26': { value: 'Mandatory Paydown', isLocked: true, hasHint: true },
      'A27': { value: 'Acquisition Debt', isLocked: true, hasHint: true },
      'A28': { value: 'Ending Debt', isLocked: true, hasHint: true },
      
      // Acquisition Section
      'A30': { value: 'ACQUISITION TRACKER', isLocked: true },
      'A31': { value: 'Target Acquisitions (count)', isLocked: true, hasHint: true },
      'A32': { value: 'Acquisition Revenue Add', isLocked: true, hasHint: true },
      'A33': { value: 'Integration Costs', isLocked: true, hasHint: true },
      'A34': { value: 'Synergies Realized', isLocked: true, hasHint: true },
      
      // Returns Section
      'A36': { value: 'RETURNS ANALYSIS', isLocked: true },
      'A37': { value: 'Exit Multiple', isLocked: true },
      'G37': { value: '14.0', isLocked: true },
      'A38': { value: 'Exit Enterprise Value', isLocked: true, hasHint: true }
    };
    
    // Apply locked cells
    Object.entries(lockedCells).forEach(([cellId, cellData]) => {
      if (initialCells[cellId]) {
        initialCells[cellId] = {
          ...initialCells[cellId],
          ...cellData,
          // Ensure locked cells don't have formulas unless explicitly set
          formula: (cellData as any).formula || ''
        };
      }
    });
    
    // Add hints to editable cells (the actual formula cells users need to fill)
    const hintableCells = [
      'C5', 'D5', 'E5', 'F5', 'G5', // Government revenue
      'C6', 'D6', 'E6', 'F6', 'G6', // Commercial revenue
      'C7', 'D7', 'E7', 'F7', 'G7', // Quality adjustments
      'C8', 'D8', 'E8', 'F8', 'G8', // Adjusted revenue
      'C9', 'D9', 'E9', 'F9', 'G9', // EBITDA
      'C11', 'D11', 'E11', 'F11', 'G11', // EBIT
      'C12', 'D12', 'E12', 'F12', 'G12', // Interest
      'C13', 'D13', 'E13', 'F13', 'G13', // EBT
      'C14', 'D14', 'E14', 'F14', 'G14', // Taxes
      'C15', 'D15', 'E15', 'F15', 'G15', // Net Income
      'C18', 'D18', 'E18', 'F18', 'G18', // EBITDA (cash flow)
      'C19', 'D19', 'E19', 'F19', 'G19', // Capex
      'C20', 'D20', 'E20', 'F20', 'G20', // Working capital
      'C22', 'D22', 'E22', 'F22', 'G22', // Free cash flow
      'C26', 'D26', 'E26', 'F26', 'G26', // Debt paydown
      'C27', 'D27', 'E27', 'F27', 'G27', // Acquisition debt
      'C28', 'D28', 'E28', 'F28', 'G28', // Ending debt
      'C31', 'D31', 'E31', 'F31', 'G31', // Acquisition count
      'C32', 'D32', 'E32', 'F32', 'G32', // Acquisition revenue
      'C33', 'D33', 'E33', 'F33', 'G33', // Integration costs
      'D34', 'E34', 'F34', 'G34', // Synergies
      'H38' // Exit EV
    ];
    
    hintableCells.forEach(cellId => {
      if (initialCells[cellId]) {
        initialCells[cellId].hasHint = true;
      }
    });
    
    return {
      title: 'Healthcare Services LBO Model',
      columns: 8,
      rows: 38,
      cells: initialCells
    };
  };

  const getEnergyConglomerateData = () => {
    const initialCells: Record<string, Cell> = {};
    
    // Initialize empty cells (10 columns, 50 rows for maximum energy complexity)
    for (let row = 0; row < 50; row++) {
      for (let col = 0; col < 10; col++) {
        const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
        initialCells[cellId] = {
          value: '',
          formula: '',
          isLocked: false,
          hasHint: false
        };
      }
    }
    
    const lockedCells = {
      // Headers
      'A1': { value: 'Energy Conglomerate LBO Model', isLocked: true },
      'B1': { value: 'LTM', isLocked: true },
      'C1': { value: 'Year 1', isLocked: true },
      'D1': { value: 'Year 2', isLocked: true },
      'E1': { value: 'Year 3', isLocked: true },
      'F1': { value: 'Year 4', isLocked: true },
      'G1': { value: 'Year 5', isLocked: true },
      'H1': { value: 'Exit', isLocked: true },
      'I1': { value: 'Oil Price', isLocked: true },
      'J1': { value: 'Gas Price', isLocked: true },
      
      // DIVISIONAL REVENUE SECTION
      'A3': { value: 'DIVISIONAL REVENUE ($M)', isLocked: true },
      'A4': { value: 'Upstream (Oil & Gas)', isLocked: true },
      'B4': { value: '850.0', isLocked: true },
      'I4': { value: '$75/bbl', isLocked: true },
      'J4': { value: '$4.50/mmbtu', isLocked: true },
      'A5': { value: '  Oil Production (MMbbl)', isLocked: true },
      'B5': { value: '8.5', isLocked: true },
      'A6': { value: '  Gas Production (Bcf)', isLocked: true },
      'B6': { value: '45.0', isLocked: true },
      'A7': { value: '  Hedged % (Oil)', isLocked: true },
      'B7': { value: '75%', isLocked: true },
      'A8': { value: '  Hedged Price (Oil)', isLocked: true },
      'B8': { value: '$72/bbl', isLocked: true },
      
      'A10': { value: 'Midstream (Pipelines)', isLocked: true },
      'B10': { value: '420.0', isLocked: true },
      'A11': { value: '  Throughput (MMbbl/d)', isLocked: true },
      'B11': { value: '2.1', isLocked: true },
      'A12': { value: '  Avg Tariff ($/bbl)', isLocked: true },
      'B12': { value: '$5.50', isLocked: true },
      
      'A14': { value: 'Downstream (Refining)', isLocked: true },
      'B14': { value: '680.0', isLocked: true },
      'A15': { value: '  Refining Capacity (kb/d)', isLocked: true },
      'B15': { value: '185', isLocked: true },
      'A16': { value: '  Utilization Rate', isLocked: true },
      'B16': { value: '92%', isLocked: true },
      'A17': { value: '  Crack Spread ($/bbl)', isLocked: true },
      'B17': { value: '$11.00', isLocked: true },
      
      'A19': { value: 'Renewables (Solar/Wind)', isLocked: true },
      'B19': { value: '180.0', isLocked: true },
      'A20': { value: '  Installed Capacity (MW)', isLocked: true },
      'B20': { value: '900', isLocked: true },
      'A21': { value: '  Capacity Factor', isLocked: true },
      'B21': { value: '32%', isLocked: true },
      'A22': { value: '  PPA Price ($/MWh)', isLocked: true },
      'B22': { value: '$65', isLocked: true },
      
      'A24': { value: 'Total Revenue', isLocked: true },
      'B24': { value: '2130.0', isLocked: true },
      
      // INCOME STATEMENT
      'A26': { value: 'CONSOLIDATED P&L ($M)', isLocked: true },
      'A27': { value: 'Revenue', isLocked: true },
      'A28': { value: 'Cost of Sales', isLocked: true },
      'B28': { value: '1490.0', isLocked: true },
      'A29': { value: 'Gross Profit', isLocked: true },
      'A30': { value: 'SG&A', isLocked: true },
      'B30': { value: '128.0', isLocked: true },
      'A31': { value: 'Environmental Compliance', isLocked: true },
      'B31': { value: '35.0', isLocked: true },
      'A32': { value: 'Carbon Pricing', isLocked: true },
      'A33': { value: 'EBITDA', isLocked: true },
      'A34': { value: 'D&A', isLocked: true },
      'B34': { value: '180.0', isLocked: true },
      'A35': { value: 'EBIT', isLocked: true },
      'A36': { value: 'Interest Expense', isLocked: true },
      'A37': { value: 'EBT', isLocked: true },
      'A38': { value: 'Taxes (28%)', isLocked: true },
      'A39': { value: 'Net Income', isLocked: true },
      
      // CASH FLOW STATEMENT
      'A41': { value: 'CASH FLOW ($M)', isLocked: true },
      'A42': { value: 'EBITDA', isLocked: true },
      'A43': { value: 'Maintenance Capex', isLocked: true },
      'A44': { value: 'Growth Capex', isLocked: true },
      'A45': { value: 'Environmental Remediation', isLocked: true },
      'A46': { value: 'Working Capital Change', isLocked: true },
      'A47': { value: 'Free Cash Flow', isLocked: true },
      
      // DEBT & RETURNS
      'A49': { value: 'DEBT & RETURNS ($M)', isLocked: true },
      'A50': { value: 'Exit Enterprise Value', isLocked: true }
    };
    
    // Apply locked cells
    Object.entries(lockedCells).forEach(([cellId, cellData]) => {
      if (initialCells[cellId]) {
        initialCells[cellId] = {
          ...initialCells[cellId],
          ...cellData,
          // Ensure locked cells don't have formulas unless explicitly set
          formula: (cellData as any).formula || ''
        };
      }
    });
    
    // Add hints to editable cells (formula cells for advanced energy modeling)
    const hintableCells = [
      // Upstream Revenue (Oil & Gas)
      'C4', 'D4', 'E4', 'F4', 'G4', // Total upstream revenue
      'C5', 'D5', 'E5', 'F5', 'G5', // Oil production
      'C6', 'D6', 'E6', 'F6', 'G6', // Gas production
      'I5', 'I6', 'I7', 'I8', 'I9', // Oil price scenarios
      'J5', 'J6', 'J7', 'J8', 'J9', // Gas price scenarios
      
      // Midstream Revenue (Pipelines)
      'C10', 'D10', 'E10', 'F10', 'G10', // Pipeline revenue
      'C11', 'D11', 'E11', 'F11', 'G11', // Throughput
      
      // Downstream Revenue (Refining)
      'C14', 'D14', 'E14', 'F14', 'G14', // Refining revenue
      'C15', 'D15', 'E15', 'F15', 'G15', // Capacity utilization
      'C17', 'D17', 'E17', 'F17', 'G17', // Crack spreads
      
      // Renewables Revenue
      'C19', 'D19', 'E19', 'F19', 'G19', // Renewables revenue
      'C20', 'D20', 'E20', 'F20', 'G20', // Capacity expansion
      'C22', 'D22', 'E22', 'F22', 'G22', // PPA escalation
      
      // Consolidated Income Statement
      'C24', 'D24', 'E24', 'F24', 'G24', // Total revenue
      'C28', 'D28', 'E28', 'F28', 'G28', // Cost of sales
      'C29', 'D29', 'E29', 'F29', 'G29', // Gross profit
      'C32', 'D32', 'E32', 'F32', 'G32', // Carbon pricing
      'C33', 'D33', 'E33', 'F33', 'G33', // EBITDA
      'C35', 'D35', 'E35', 'F35', 'G35', // EBIT
      'C36', 'D36', 'E36', 'F36', 'G36', // Interest expense
      'C37', 'D37', 'E37', 'F37', 'G37', // EBT
      'C38', 'D38', 'E38', 'F38', 'G38', // Taxes
      'C39', 'D39', 'E39', 'F39', 'G39', // Net income
      
      // Cash Flow
      'C42', 'D42', 'E42', 'F42', 'G42', // EBITDA (cash flow)
      'C43', 'D43', 'E43', 'F43', 'G43', // Maintenance capex
      'C44', 'D44', 'E44', 'F44', 'G44', // Growth capex
      'C45', 'D45', 'E45', 'F45', 'G45', // Environmental remediation
      'C46', 'D46', 'E46', 'F46', 'G46', // Working capital
      'C47', 'D47', 'E47', 'F47', 'G47', // Free cash flow
      
      // Exit Analysis
      'H50' // Exit enterprise value
    ];
    
    hintableCells.forEach(cellId => {
      if (initialCells[cellId]) {
        initialCells[cellId].hasHint = true;
      }
    });
    
    return {
      title: 'Energy Conglomerate LBO Model',
      columns: 10,
      rows: 50,
      cells: initialCells
    };
  };

  const initializeCells = () => {
    const problemData = problemId === '5' ? getEnergyConglomerateData() :
                       problemId === '4' ? getHealthcareServicesData() :
                       problemId === '3' ? getManufacturingGiantData() :
                       problemId === '2' ? getRetailMaxData() :
                       getTechCorpData();
    setCells(problemData.cells);
    // Initialize history with the initial state
    setHistory([JSON.parse(JSON.stringify(problemData.cells))]);
    setHistoryIndex(0);
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

  const validateRetailMaxFormula = (cellId: string, formula: string): boolean => {
    const validFormulas: Record<string, string[]> = {
      // Quarterly Revenue Growth (seasonal patterns)
      // Q1 revenue (30% decline from Q4 holiday season)
      'C4': ['=B4*0.7*0.25', '=B4*0.175', '=30*0.7'], // 30M * 0.7 / 4 quarters
      // Q2 revenue (recovery, 5% growth QoQ)
      'D4': ['=C4*1.05'],
      // Q3 revenue (continued growth, 3% QoQ)
      'E4': ['=D4*1.03'],
      // Q4 revenue (holiday surge, 40% increase QoQ)
      'F4': ['=E4*1.4'],
      
      // Year 2 quarterly revenue (overall 8% growth YoY)
      'G4': ['=C4*1.08'], // Q1Y2 = Q1Y1 * 1.08
      'H4': ['=D4*1.08'], // Q2Y2 = Q2Y1 * 1.08
      'I4': ['=E4*1.08'], // Q3Y2 = Q3Y1 * 1.08
      'J4': ['=F4*1.08'], // Q4Y2 = Q4Y1 * 1.08
      
      // Year 3 quarterly revenue (8% YoY growth)
      'K4': ['=G4*1.08'], // Q1Y3 = Q1Y2 * 1.08
      'L4': ['=H4*1.08'], // Q2Y3 = Q2Y2 * 1.08
      'M4': ['=I4*1.08'], // Q3Y3 = Q3Y2 * 1.08
      'N4': ['=J4*1.08'], // Q4Y3 = Q4Y2 * 1.08
      
      // Year 4 quarterly revenue (8% YoY growth)
      'O4': ['=K4*1.08'], // Q1Y4 = Q1Y3 * 1.08
      'P4': ['=L4*1.08'], // Q2Y4 = Q2Y3 * 1.08
      'Q4': ['=M4*1.08'], // Q3Y4 = Q3Y3 * 1.08
      'R4': ['=N4*1.08'], // Q4Y4 = Q4Y3 * 1.08
      
      // Year 5 quarterly revenue (8% YoY growth)
      'S4': ['=O4*1.08'], // Q1Y5 = Q1Y4 * 1.08
      'T4': ['=P4*1.08'], // Q2Y5 = Q2Y4 * 1.08
      'U4': ['=Q4*1.08'], // Q3Y5 = Q3Y4 * 1.08
      'V4': ['=R4*1.08'], // Q4Y5 = Q4Y4 * 1.08
      
      // EBITDA calculations (15% margin for retail)
      'C5': ['=C4*0.15'],
      'D5': ['=D4*0.15'],
      'E5': ['=E4*0.15'],
      'F5': ['=F4*0.15'],
      'G5': ['=G4*0.15'],
      'H5': ['=H4*0.15'],
      'I5': ['=I4*0.15'],
      'J5': ['=J4*0.15'],
      'K5': ['=K4*0.15'],
      'L5': ['=L4*0.15'],
      'M5': ['=M4*0.15'],
      'N5': ['=N4*0.15'],
      'O5': ['=O4*0.15'],
      'P5': ['=P4*0.15'],
      'Q5': ['=Q4*0.15'],
      'R5': ['=R4*0.15'],
      'S5': ['=S4*0.15'],
      'T5': ['=T4*0.15'],
      'U5': ['=U4*0.15'],
      'V5': ['=V4*0.15'],
      
      // EBIT calculations (EBITDA - D&A)
      'B7': ['=B5-B6', '=B5-3', '=B5-3.0'],
      'C7': ['=C5-0.75', '=C5-(B6/4)'], // Quarterly D&A = 3/4
      'D7': ['=D5-0.75', '=D5-(B6/4)'],
      'E7': ['=E5-0.75', '=E5-(B6/4)'],
      'F7': ['=F5-0.75', '=F5-(B6/4)'],
      
      // Working Capital Schedule
      // Inventory (% of quarterly revenue, seasonal)
      'C10': ['=C4*0.25'], // 25% in Q1 (low season)
      'D10': ['=D4*0.22'], // 22% in Q2 (building up)
      'E10': ['=E4*0.20'], // 20% in Q3 (lean before holiday)
      'F10': ['=F4*0.18'], // 18% in Q4 (holiday depletion)
      
      // Accounts Receivable (7% of revenue)
      'C11': ['=C4*0.07'],
      'D11': ['=D4*0.07'],
      'E11': ['=E4*0.07'],
      'F11': ['=F4*0.07'],
      
      // Accounts Payable (13% of revenue)
      'C12': ['=C4*0.13'],
      'D12': ['=D4*0.13'],
      'E12': ['=E4*0.13'],
      'F12': ['=F4*0.13'],
      
      // Net Working Capital
      'C13': ['=C10+C11-C12'],
      'D13': ['=D10+D11-D12'],
      'E13': ['=E10+E11-E12'],
      'F13': ['=F10+F11-F12'],
      
      // Working Capital Change
      'C14': ['=C13-B13', '=C13-18'], // B13 should be LTM NWC = 18
      'D14': ['=D13-C13'],
      'E14': ['=E13-D13'],
      'F14': ['=F13-E13'],
      
      // Cash Flow - EBITDA reference
      'C17': ['=C5'],
      'D17': ['=D5'],
      'E17': ['=E5'],
      'F17': ['=F5'],
      
      // Capex (2% of revenue for retail)
      'C18': ['=C4*0.02'],
      'D18': ['=D4*0.02'],
      'E18': ['=E4*0.02'],
      'F18': ['=F4*0.02'],
      
      // Working Capital Change (reference)
      'C19': ['=C14'],
      'D19': ['=D14'],
      'E19': ['=E14'],
      'F19': ['=F14'],
      
      // Free Cash Flow
      'C20': ['=C17-C18-C19'],
      'D20': ['=D17-D18-D19'],
      'E20': ['=E17-E18-E19'],
      'F20': ['=F17-F18-F19'],
      
      // Debt Schedule
      'C23': ['=B23', '=108'],
      'D23': ['=C25'],
      'E23': ['=D25'],
      'F23': ['=E25'],
      
      // FCF to Debt Paydown
      'C24': ['=C20'],
      'D24': ['=D20'],
      'E24': ['=E20'],
      'F24': ['=F20'],
      
      // Ending Debt
      'C25': ['=C23-C24'],
      'D25': ['=D23-D24'],
      'E25': ['=E23-E24'],
      'F25': ['=F23-F24'],
      
      // Exit Valuation (12x Year 5 EBITDA - lower multiple for retail)
      'V28': ['=V5*12', '=12*V5'], // Year 5 Q4 EBITDA annualized
      'V29': ['=V28-V25'], // Exit Equity
      'V30': ['=V29/72'], // MOIC (initial equity investment)
      'V31': ['=(V30^0.2)-1'] // IRR
    };

    return validFormulas[cellId]?.includes(formula) || false;
  };

  const validateManufacturingGiantFormula = (cellId: string, formula: string): boolean => {
    const validFormulas: Record<string, string[]> = {
      // Cyclical Revenue Growth (Economic Cycle)
      'C4': ['=B4*1.05'], // Year 1: 5% (recovery)
      'D4': ['=C4*1.08'], // Year 2: 8% (expansion)
      'E4': ['=D4*1.03'], // Year 3: 3% (late cycle)
      'F4': ['=E4*0.98'], // Year 4: -2% (downturn)
      'G4': ['=F4*1.06'], // Year 5: 6% (recovery)
      
      // EBITDA calculations (18% margin for manufacturing)
      'C5': ['=C4*0.18'],
      'D5': ['=D4*0.18'],
      'E5': ['=E4*0.18'],
      'F5': ['=F4*0.18'],
      'G5': ['=G4*0.18'],
      
      // EBIT calculations (EBITDA - D&A)
      'B7': ['=B5-B6', '=B5-20', '=B5-20.0'],
      'C7': ['=C5-B6', '=C5-20', '=C5-20.0'],
      'D7': ['=D5-B6', '=D5-20', '=D5-20.0'],
      'E7': ['=E5-B6', '=E5-20', '=E5-20.0'],
      'F7': ['=F5-B6', '=F5-20', '=F5-20.0'],
      'G7': ['=G5-B6', '=G5-20', '=G5-20.0'],
      
      // Complex Working Capital - Raw Materials (7% of revenue)
      'C14': ['=C4*0.07'],
      'D14': ['=D4*0.07'],
      'E14': ['=E4*0.07'],
      'F14': ['=F4*0.07'],
      'G14': ['=G4*0.07'],
      
      // Finished Goods (8% of revenue)
      'C15': ['=C4*0.08'],
      'D15': ['=D4*0.08'],
      'E15': ['=E4*0.08'],
      'F15': ['=F4*0.08'],
      'G15': ['=G4*0.08'],
      
      // Accounts Receivable (10% of revenue)
      'C16': ['=C4*0.10'],
      'D16': ['=D4*0.10'],
      'E16': ['=E4*0.10'],
      'F16': ['=F4*0.10'],
      'G16': ['=G4*0.10'],
      
      // Accounts Payable (6% of revenue)
      'C17': ['=C4*0.06'],
      'D17': ['=D4*0.06'],
      'E17': ['=E4*0.06'],
      'F17': ['=F4*0.06'],
      'G17': ['=G4*0.06'],
      
      // Net Working Capital
      'C18': ['=C14+C15+C16-C17'],
      'D18': ['=D14+D15+D16-D17'],
      'E18': ['=E14+E15+E16-E17'],
      'F18': ['=F14+F15+F16-F17'],
      'G18': ['=G14+G15+G16-G17'],
      
      // Working Capital Change
      'C19': ['=C18-B18'],
      'D19': ['=D18-C18'],
      'E19': ['=E18-D18'],
      'F19': ['=F18-E18'],
      'G19': ['=G18-F18'],
      
      // Cash Flow - EBITDA reference
      'C22': ['=C5'],
      'D22': ['=D5'],
      'E22': ['=E5'],
      'F22': ['=F5'],
      'G22': ['=G5'],
      
      // Maintenance Capex (3% of revenue)
      'C23': ['=C4*0.03'],
      'D23': ['=D4*0.03'],
      'E23': ['=E4*0.03'],
      'F23': ['=F4*0.03'],
      'G23': ['=G4*0.03'],
      
      // Growth Capex (2% of revenue)
      'C24': ['=C4*0.02'],
      'D24': ['=D4*0.02'],
      'E24': ['=E4*0.02'],
      'F24': ['=F4*0.02'],
      'G24': ['=G4*0.02'],
      
      // Total Capex
      'C25': ['=C23+C24'],
      'D25': ['=D23+D24'],
      'E25': ['=E23+E24'],
      'F25': ['=F23+F24'],
      'G25': ['=G23+G24'],
      
      // Working Capital Change (reference)
      'C26': ['=C19'],
      'D26': ['=D19'],
      'E26': ['=E19'],
      'F26': ['=F19'],
      'G26': ['=G19'],
      
      // Free Cash Flow
      'C27': ['=C22-C25-C26'],
      'D27': ['=D22-D25-D26'],
      'E27': ['=E22-E25-E26'],
      'F27': ['=F22-F25-F26'],
      'G27': ['=G22-G25-G26'],
      
      // Multi-Tranche Debt Schedule
      // Term Loan A Beginning
      'C30': ['=B30', '=200'],
      'D30': ['=C30'], // No amortization for simplicity
      'E30': ['=D30'],
      'F30': ['=E30'],
      'G30': ['=F30'],
      
      // Term Loan B Beginning
      'C31': ['=B31', '=200'],
      'D31': ['=C31'], // Bullet payment
      'E31': ['=D31'],
      'F31': ['=E31'],
      'G31': ['=F31'],
      
      // Revolver (undrawn initially, used for working capital)
      'C32': ['=B32', '=67'],
      'D32': ['=C32'],
      'E32': ['=D32'],
      'F32': ['=E32'],
      'G32': ['=F32'],
      
      // Total Debt Beginning
      'C33': ['=C30+C31+C32'],
      'D33': ['=D30+D31+D32'],
      'E33': ['=E30+E31+E32'],
      'F33': ['=F30+F31+F32'],
      'G33': ['=G30+G31+G32'],
      
      // FCF to Debt Paydown (simplified)
      'C34': ['=C27'],
      'D34': ['=D27'],
      'E34': ['=E27'],
      'F34': ['=F27'],
      'G34': ['=G27'],
      
      // Total Debt Ending (simplified - reduce TLA first)
      'C35': ['=C33-C34'],
      'D35': ['=D33-D34'],
      'E35': ['=E33-E34'],
      'F35': ['=F33-F34'],
      'G35': ['=G33-G34'],
      
      // Covenant Testing - Leverage Ratio (Total Debt / EBITDA)
      'C38': ['=C33/C5'],
      'D38': ['=D33/D5'],
      'E38': ['=E33/E5'],
      'F38': ['=F33/F5'],
      'G38': ['=G33/G5'],
      
      // Coverage Ratio ((EBITDA - Capex) / Interest Expense)
      'C39': ['=(C5-C25)/30'], // Assume $30M interest expense
      'D39': ['=(D5-D25)/30'],
      'E39': ['=(E5-E25)/30'],
      'F39': ['=(F5-F25)/30'],
      'G39': ['=(G5-G25)/30']
    };

    return validFormulas[cellId]?.includes(formula) || false;
  };

  const validateHealthcareServicesFormula = (cellId: string, formula: string): boolean => {
    const validFormulas: Record<string, string[]> = {
      // Government vs Commercial Revenue Growth (regulatory impact)
      'C5': ['=B5*1.025'], // Government payers: 2.5% (Medicare updates)
      'D5': ['=C5*1.03'], // Government: 3% growth
      'E5': ['=D5*1.025'], // Government: back to 2.5%
      'F5': ['=E5*1.035'], // Government: 3.5% recovery
      'G5': ['=F5*1.03'], // Government: steady 3%
      
      'C6': ['=B6*1.06'], // Commercial payers: 6% growth
      'D6': ['=C6*1.055'], // Commercial: 5.5%
      'E6': ['=D6*1.07'], // Commercial: 7% (price increases)
      'F6': ['=E6*1.065'], // Commercial: 6.5%
      'G6': ['=F6*1.06'], // Commercial: 6%
      
      // Quality Bonuses/Penalties (±2% of revenue)
      'C7': ['=C8*0.02', '=C8*-0.02', '=(C5+C6)*0.02', '=(C5+C6)*-0.02'],
      'D7': ['=D8*0.015', '=D8*-0.015', '=(D5+D6)*0.015'],
      'E7': ['=E8*0.025', '=(E5+E6)*0.025'],
      'F7': ['=F8*0.02', '=(F5+F6)*0.02'],
      'G7': ['=G8*0.025', '=(G5+G6)*0.025'],
      
      // Adjusted Revenue (base + acquisitions + quality adjustments)
      'C8': ['=C5+C6+C7+C32'], // Base + acquisition revenue + quality
      'D8': ['=D5+D6+D7+D32'],
      'E8': ['=E5+E6+E7+E32'],
      'F8': ['=F5+F6+F7+F32'],
      'G8': ['=G5+G6+G7+G32'],
      
      // EBITDA (22% margin, adjusted for labor inflation)
      'C9': ['=C8*0.22'], // 22% base margin
      'D9': ['=D8*0.215'], // 21.5% (labor inflation pressure)
      'E9': ['=E8*0.225'], // 22.5% (efficiency gains)
      'F9': ['=F8*0.23'], // 23% (scale benefits)
      'G9': ['=G8*0.235'], // 23.5% (full synergies)
      
      // EBIT calculations
      'C11': ['=C9-C10', '=C18-C10'], // EBITDA - D&A
      'D11': ['=D9-D10', '=D18-D10'],
      'E11': ['=E9-E10', '=E18-E10'],
      'F11': ['=F9-F10', '=F18-F10'],
      'G11': ['=G9-G10', '=G18-G10'],
      
      // Interest (8% on average debt)
      'C12': ['=(B25+C28)/2*0.08', '=C28*0.08'],
      'D12': ['=(C28+D28)/2*0.08', '=D28*0.08'],
      'E12': ['=(D28+E28)/2*0.08', '=E28*0.08'],
      'F12': ['=(E28+F28)/2*0.08', '=F28*0.08'],
      'G12': ['=(F28+G28)/2*0.08', '=G28*0.08'],
      
      // EBT
      'C13': ['=C11-C12'],
      'D13': ['=D11-D12'],
      'E13': ['=E11-E12'],
      'F13': ['=F11-F12'],
      'G13': ['=G11-G12'],
      
      // Taxes
      'C14': ['=C13*0.25'],
      'D14': ['=D13*0.25'],
      'E14': ['=E13*0.25'],
      'F14': ['=F13*0.25'],
      'G14': ['=G13*0.25'],
      
      // Net Income
      'C15': ['=C13-C14'],
      'D15': ['=D13-D14'],
      'E15': ['=E13-E14'],
      'F15': ['=F13-F14'],
      'G15': ['=G13-G14'],
      
      // Cash Flow: EBITDA link
      'C18': ['=C9'],
      'D18': ['=D9'],
      'E18': ['=E9'],
      'F18': ['=F9'],
      'G18': ['=G9'],
      
      // Capex (3% of revenue for healthcare infrastructure)
      'C19': ['=C8*0.03'],
      'D19': ['=D8*0.03'],
      'E19': ['=E8*0.03'],
      'F19': ['=F8*0.03'],
      'G19': ['=G8*0.03'],
      
      // Working Capital (A/R aging: 15% of revenue)
      'C20': ['=C8*0.15-B20', '=(C8-B8)*0.15'],
      'D20': ['=D8*0.15-C20', '=(D8-C8)*0.15'],
      'E20': ['=E8*0.15-D20', '=(E8-D8)*0.15'],
      'F20': ['=F8*0.15-E20', '=(F8-E8)*0.15'],
      'G20': ['=G8*0.15-F20', '=(G8-F8)*0.15'],
      
      // Free Cash Flow
      'C22': ['=C18-C19-C20-C21-C33'], // EBITDA - Capex - WC - Compliance - Integration
      'D22': ['=D18-D19-D20-D21-D33'],
      'E22': ['=E18-E19-E20-E21-E33'],
      'F22': ['=F18-F19-F20-F21-F33'],
      'G22': ['=G18-G19-G20-G21-G33'],
      
      // Debt Schedule: Mandatory Paydown
      'C26': ['=C22*0.5', '=C22'], // 50% of FCF or all FCF
      'D26': ['=D22*0.5', '=D22'],
      'E26': ['=E22*0.5', '=E22'],
      'F26': ['=F22*0.5', '=F22'],
      'G26': ['=G22*0.5', '=G22'],
      
      // Acquisition Debt (for acquisitions)
      'C27': ['=C31*5', '=C32*3'], // 5x EBITDA multiple or 3x revenue
      'D27': ['=D31*5', '=D32*3'],
      'E27': ['=E31*5', '=E32*3'],
      'F27': ['=F31*5', '=F32*3'],
      'G27': ['=G31*5', '=G32*3'],
      
      // Ending Debt
      'C28': ['=B25-C26+C27', '=C25-C26+C27'],
      'D28': ['=C28-D26+D27'],
      'E28': ['=D28-E26+E27'],
      'F28': ['=E28-F26+F27'],
      'G28': ['=F28-G26+G27'],
      
      // Acquisition Tracker: Target count
      'C31': ['=1', '=2'], // 1-2 acquisitions per year
      'D31': ['=1', '=2'],
      'E31': ['=1', '=0'], // Fewer acquisitions in later years
      'F31': ['=0', '=1'],
      'G31': ['=0', '=1'],
      
      // Acquisition Revenue Add
      'C32': ['=C31*15', '=C31*20'], // $15-20M per acquisition
      'D32': ['=D31*18', '=D31*25'],
      'E32': ['=E31*20', '=E31*0'],
      'F32': ['=F31*0', '=F31*15'],
      'G32': ['=G31*0', '=G31*18'],
      
      // Integration Costs (10% of acquisition revenue for 2 years)
      'C33': ['=C32*0.1', '=(C32+B32)*0.1'],
      'D33': ['=D32*0.1', '=(D32+C32)*0.1'],
      'E33': ['=E32*0.05', '=E32*0'], // Lower in year 3
      'F33': ['=F32*0.1', '=F32*0'],
      'G33': ['=G32*0.1', '=G32*0'],
      
      // Synergies (administrative savings: 5% of acquired revenue after year 1)
      'D34': ['=C32*0.05'], // Synergies from Year 1 acquisitions
      'E34': ['=D34+(D32*0.05)'], // Cumulative synergies
      'F34': ['=E34+(E32*0.05)'],
      'G34': ['=F34+(F32*0.05)'],
      
      // Exit Enterprise Value
      'H38': ['=G9*G37', '=G18*G37'] // Exit EBITDA * Exit Multiple
    };
    
    const cellFormulas = validFormulas[cellId];
    if (!cellFormulas) return true; // No validation rule = always valid
    
    return cellFormulas.some(validFormula => 
      formula.toLowerCase().replace(/\s/g, '') === validFormula.toLowerCase().replace(/\s/g, '')
    );
  };

  const validateEnergyConglomerateFormula = (cellId: string, formula: string): boolean => {
    const validFormulas: Record<string, string[]> = {
      // UPSTREAM REVENUE - Complex hedging formulas
      'C4': [
        '=(C5*IF(I5>72,72,I5)*0.75+C5*I5*0.25)+(C6*J5)',
        '=(C5*MIN(I5,72)*0.75+C5*I5*0.25)+(C6*J5)',
        '=C5*(I5*0.25+72*0.75)+C6*J5'
      ],
      'C5': ['=B5*0.92', '=B5*0.91', '=B5*0.93'], // Oil production decline
      'C6': ['=B6*0.94', '=B6*0.93', '=B6*0.95'], // Gas production decline
      'D5': ['=C5*0.92', '=C5*0.91', '=C5*0.93'],
      'D6': ['=C6*0.94', '=C6*0.93', '=C6*0.95'],
      
      // MIDSTREAM REVENUE - Pipeline tariffs
      'C10': ['=C11*B12*365/1000', '=C11*B12*365.25/1000'],
      'C11': ['=B11*1.03', '=B11*1.02', '=B11*1.04'],
      'D10': ['=D11*B12*365/1000', '=D11*B12*365.25/1000'],
      'D11': ['=C11*1.03', '=C11*1.02', '=C11*1.04'],
      
      // DOWNSTREAM REVENUE - Refining margins
      'C14': ['=C15*C16*C17*365/1000', '=C15*B16*C17*365/1000'],
      'C15': ['=B15*B16*0.94', '=B15*B16*0.93', '=B15*B16*0.95'],
      'D14': ['=D15*B16*D17*365/1000', '=D15*D16*D17*365/1000'],
      'D15': ['=C15*0.94', '=C15*0.93', '=C15*0.95'],
      
      // RENEWABLES REVENUE - Capacity and PPA
      'C19': ['=C20*C21*8760*C22/1000', '=C20*B21*8760*C22/1000'],
      'C20': ['=B20*1.15', '=B20*1.12', '=B20*1.18'],
      'C22': ['=B22*1.025', '=B22*1.02', '=B22*1.03'],
      'D19': ['=D20*B21*8760*D22/1000', '=D20*D21*8760*D22/1000'],
      'D20': ['=C20*1.15', '=C20*1.12', '=C20*1.18'],
      'D22': ['=C22*1.025', '=C22*1.02', '=C22*1.03'],
      
      // CONSOLIDATED REVENUE
      'C24': ['=C4+C10+C14+C19', '=SUM(C4:C19)', '=SUM(C4,C10,C14,C19)'],
      'D24': ['=D4+D10+D14+D19', '=SUM(D4:D19)', '=SUM(D4,D10,D14,D19)'],
      
      // INCOME STATEMENT
      'C28': ['=C24*0.72', '=C24*0.71', '=C24*0.73'], // Cost of sales
      'C29': ['=C24-C28', '=C24*0.28', '=C24*0.29'], // Gross profit
      'C32': ['=C5*0.5*35', '=C5*0.4*35', '=C5*0.6*35'], // Carbon pricing
      'C33': ['=C29-B30-B31-C32', '=C29-128-35-C32'], // EBITDA
      'C35': ['=C33-B34', '=C33-180'], // EBIT
      'C36': ['=200*0.08', '=160', '=16', '=(200*0.08)'], // Interest expense
      'C37': ['=C35-C36'], // EBT
      'C38': ['=C37*0.28', '=C37*0.25', '=C37*0.30'], // Taxes
      'C39': ['=C37-C38'], // Net income
      
      // CASH FLOW
      'C42': ['=C33'], // EBITDA for cash flow
      'C43': ['=C24*0.05', '=C24*0.04', '=C24*0.06'], // Maintenance capex
      'C44': ['=C24*0.10', '=C24*0.08', '=C24*0.12'], // Growth capex
      'C45': ['=18', '=15', '=20'], // Environmental remediation
      'C46': ['=(C24-B24)*0.05', '=(C24-B24)*0.04'], // Working capital change
      'C47': ['=C42-C43-C44-C45-C46'], // Free cash flow
      
      // EXIT VALUATION
      'H50': ['=G33*10', '=G33*9', '=G33*11', '=G33*12'] // Exit EV
    };
    
    const cellFormulas = validFormulas[cellId];
    if (!cellFormulas) return false;
    
    return cellFormulas.some(validFormula => 
      formula.toLowerCase().replace(/\s/g, '') === validFormula.toLowerCase().replace(/\s/g, '')
    );
  };

  const validateFormula = (cellId: string, formula: string): boolean => {
    // Use different validation based on problem type
    if (problemId === '5') {
      return validateEnergyConglomerateFormula(cellId, formula);
    } else if (problemId === '4') {
      return validateHealthcareServicesFormula(cellId, formula);
    } else if (problemId === '3') {
      return validateManufacturingGiantFormula(cellId, formula);
    } else if (problemId === '2') {
      return validateRetailMaxFormula(cellId, formula);
    }
    
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
      'G25': ['=G5*14', '=14*G5'],

      // Exit Equity (Exit EV - Final Debt)
      'G26': ['=G25-G22'],

      // MOIC (Exit Equity / Initial Equity Investment)
      'G27': ['=G26/62.5', '=G26/B8'],

      // IRR (approximation using simple formula)
      'G28': ['=(G26/62.5)^(1/5)-1', '=((G26/62.5)^0.2)-1', '=(G27^0.2)-1']
    };

    const acceptableFormulas = validFormulas[cellId] || [];
    const normalizedInput = formula.toUpperCase().replace(/\s/g, '');
    
    return acceptableFormulas.some(valid => 
      valid.toUpperCase().replace(/\s/g, '') === normalizedInput
    );
  };

  // Generate smart error hints based on what the user entered incorrectly
  const getErrorHint = (cellRef: string, incorrectFormula: string): string => {
    const errorHints: Record<string, (input: string) => string> = {
      'C4': (input) => {
        if (input.includes('=B4*0.1')) return "You're calculating 10% of revenue, not 110%. Try =B4*1.1 for 10% growth.";
        if (input.includes('=B4+0.1')) return "Growth is multiplicative, not additive. Use =B4*1.1 for 10% growth.";
        if (!input.includes('B4')) return "Year 1 revenue should reference LTM revenue (B4). Try =B4*1.1";
        if (input.includes('=10') || input.match(/=\d+/)) return "Use a formula, not a hard number. Reference B4 and multiply by 1.1";
        return "Year 1 revenue needs 10% growth from LTM revenue. Try =B4*1.1";
      },
      'C5': (input) => {
        if (input.includes('=C4*0.25')) return "Correct formula! Make sure it's exactly =C4*0.25";
        if (!input.includes('C4')) return "EBITDA should reference Year 1 revenue (C4). Try =C4*0.25";
        if (input.includes('*0.20') || input.includes('*20%')) return "EBITDA margin is 25%, not 20%. Try =C4*0.25";
        if (input.includes('*0.30') || input.includes('*30%')) return "EBITDA margin is 25%, not 30%. Try =C4*0.25";
        return "EBITDA is 25% of revenue. Try =C4*0.25";
      },
      'C7': (input) => {
        if (!input.includes('C5')) return "EBIT should reference EBITDA (C5). Try =C5-B6";
        if (!input.includes('-')) return "EBIT = EBITDA minus D&A. Try =C5-B6";
        if (input.includes('-2')) return "Reference the D&A cell (B6) instead of hard-coding. Try =C5-B6";
        return "EBIT = EBITDA - D&A. Try =C5-B6";
      },
      'C15': (input) => {
        if (!input.includes('C4')) return "Capex should reference Year 1 revenue (C4). Try =C4*0.03";
        if (input.includes('*0.30') || input.includes('*30%')) return "Capex is 3%, not 30%. Try =C4*0.03";
        if (input.includes('*0.05') || input.includes('*5%')) return "Capex is 3%, not 5%. Try =C4*0.03";
        return "Capex is 3% of revenue. Try =C4*0.03";
      },
      'C17': (input) => {
        if (!input.includes('C14')) return "FCF should start with EBITDA (C14). Try =C14-C15";
        if (!input.includes('-')) return "FCF = EBITDA minus Capex. Try =C14-C15";
        if (!input.includes('C15')) return "Don't forget to subtract Capex (C15). Try =C14-C15";
        return "Free Cash Flow = EBITDA - Capex. Try =C14-C15";
      },
      'C20': (input) => {
        if (!input.includes('B20')) return "Beginning debt should reference initial debt (B20). Try =B20";
        return "Year 1 beginning debt equals initial debt. Try =B20";
      },
      'C21': (input) => {
        if (!input.includes('C17')) return "All FCF goes to debt paydown. Reference FCF (C17). Try =C17";
        return "All free cash flow pays down debt. Try =C17";
      },
      'C22': (input) => {
        if (!input.includes('C20')) return "Ending debt should reference beginning debt (C20). Try =C20-C21";
        if (!input.includes('C21')) return "Don't forget to subtract paydown (C21). Try =C20-C21";
        if (!input.includes('-')) return "Ending debt = Beginning debt minus paydown. Try =C20-C21";
        return "Ending debt = Beginning debt - Paydown. Try =C20-C21";
      },
      'G25': (input) => {
        if (!input.includes('G5')) return "Exit valuation should use Year 5 EBITDA (G5). Try =G5*14";
        if (!input.includes('14')) return "Exit multiple is 14x. Try =G5*14";
        if (input.includes('*12')) return "Exit multiple is 14x, not 12x. Try =G5*14";
        return "Exit valuation = Year 5 EBITDA × 14x multiple. Try =G5*14";
      },
      'G26': (input) => {
        if (!input.includes('G25')) return "Exit equity should reference exit EV (G25). Try =G25-G22";
        if (!input.includes('G22')) return "Don't forget to subtract final debt (G22). Try =G25-G22";
        if (!input.includes('-')) return "Exit equity = Exit EV minus final debt. Try =G25-G22";
        return "Exit equity = Exit EV - Final debt. Try =G25-G22";
      },
      'G27': (input) => {
        if (!input.includes('G26')) return "MOIC should reference exit equity (G26). Try =G26/62.5";
        if (!input.includes('/')) return "MOIC = Exit equity divided by initial equity. Try =G26/62.5";
        if (!input.includes('62.5') && !input.includes('B8')) return "Initial equity is $62.5M. Try =G26/62.5";
        return "MOIC = Exit equity ÷ Initial equity investment. Try =G26/62.5";
      },
      'G28': (input) => {
        if (!input.includes('G27') && !input.includes('G26')) return "IRR should use MOIC (G27) or exit equity (G26). Try =(G27^0.2)-1";
        if (!input.includes('^') && !input.includes('**')) return "IRR uses exponentiation. Try =(G27^0.2)-1";
        if (!input.includes('0.2') && !input.includes('1/5')) return "5-year investment, so use power of 0.2. Try =(G27^0.2)-1";
        return "IRR = (MOIC^(1/5)) - 1. Try =(G27^0.2)-1";
      }
    };

    // Get pattern for similar cells (D4, E4, etc.)
    const baseCell = cellRef.replace(/[D-G]/, 'C');
    const errorHintFn = errorHints[baseCell] || errorHints[cellRef];
    
    if (errorHintFn) {
      return errorHintFn(incorrectFormula);
    }
    
    return `Incorrect formula for ${cellRef}. Right-click for a hint!`;
  };

  const getRetailMaxHintText = (cellRef: string, difficulty: string = 'beginner', attemptNumber: number = 0): string | null => {
    const hints: Record<string, Record<string, string[]>> = {
      // Quarterly Revenue Hints
      'C4': {
        beginner: [
          "Q1 revenue: Post-holiday decline, 30% drop from Q4 level. LTM was $120M, so quarterly average is $30M. Q1 is 70% of that.",
          "Quarterly LTM revenue = $30M. Q1 is typically 70% of average: $30M * 0.7",
          "Enter: =30*0.7"
        ],
        intermediate: ["Calculate Q1 seasonal decline from holiday levels"],
        advanced: ["Q1 retail seasonality"]
      },
      'D4': {
        beginner: [
          "Q2 revenue: Recovery quarter with 5% growth from Q1",
          "Apply 5% quarter-over-quarter growth to Q1 revenue (C4)",
          "Enter: =C4*1.05"
        ],
        intermediate: ["5% QoQ growth in Q2"],
        advanced: ["Q2 recovery growth"]
      },
      'E4': {
        beginner: [
          "Q3 revenue: Continued growth, 3% QoQ increase from Q2",
          "Apply 3% growth to Q2 revenue (D4)",
          "Enter: =D4*1.03"
        ],
        intermediate: ["3% QoQ growth in Q3"],
        advanced: ["Q3 steady growth"]
      },
      'F4': {
        beginner: [
          "Q4 revenue: Holiday surge! 40% increase from Q3",
          "Holiday season drives major revenue spike: Q3 * 1.4",
          "Enter: =E4*1.4"
        ],
        intermediate: ["40% QoQ holiday surge in Q4"],
        advanced: ["Q4 holiday seasonality"]
      },
      
      // Year 2 Quarterly Revenue
      'G4': {
        beginner: ["Q1Y2 revenue: 8% annual growth from Q1Y1", "Enter: =C4*1.08"],
        intermediate: ["8% YoY growth from Q1Y1"],
        advanced: ["Year-over-year growth"]
      },
      
      // EBITDA Hints (15% margin)
      'C5': {
        beginner: [
          "Q1 EBITDA: 15% margin on Q1 revenue (retail has lower margins than tech)",
          "Multiply Q1 revenue (C4) by 0.15",
          "Enter: =C4*0.15"
        ],
        intermediate: ["Apply 15% retail EBITDA margin"],
        advanced: ["EBITDA calculation"]
      },
      'D5': {
        beginner: ["Q2 EBITDA: =D4*0.15"],
        intermediate: ["15% margin on Q2 revenue"],
        advanced: ["EBITDA formula"]
      },
      
      // Working Capital - Inventory
      'C10': {
        beginner: [
          "Q1 Inventory: Low season, 25% of quarterly revenue",
          "Post-holiday, inventory is lean: C4 * 0.25",
          "Enter: =C4*0.25"
        ],
        intermediate: ["25% inventory ratio in Q1"],
        advanced: ["Seasonal inventory management"]
      },
      'D10': {
        beginner: [
          "Q2 Inventory: Building for holiday season, 22% of revenue",
          "Start building inventory: D4 * 0.22",
          "Enter: =D4*0.22"
        ],
        intermediate: ["22% inventory ratio in Q2"],
        advanced: ["Q2 inventory build"]
      },
      'E10': {
        beginner: [
          "Q3 Inventory: Pre-holiday lean inventory, 20% of revenue",
          "Keep inventory lean before holiday rush: E4 * 0.20",
          "Enter: =E4*0.20"
        ],
        intermediate: ["20% inventory ratio in Q3"],
        advanced: ["Pre-holiday inventory strategy"]
      },
      'F10': {
        beginner: [
          "Q4 Inventory: Holiday depletion, 18% of revenue",
          "Holiday sales deplete inventory: F4 * 0.18",
          "Enter: =F4*0.18"
        ],
        intermediate: ["18% inventory ratio in Q4"],
        advanced: ["Holiday inventory depletion"]
      },
      
      // Accounts Receivable (consistent 7%)
      'C11': {
        beginner: ["Q1 A/R: 7% of quarterly revenue", "Enter: =C4*0.07"],
        intermediate: ["7% A/R ratio"],
        advanced: ["Receivables calculation"]
      },
      'D11': {
        beginner: ["Q2 A/R: =D4*0.07"],
        intermediate: ["7% A/R ratio"],
        advanced: ["Receivables calculation"]
      },
      
      // Accounts Payable (consistent 13%)
      'C12': {
        beginner: ["Q1 A/P: 13% of quarterly revenue", "Enter: =C4*0.13"],
        intermediate: ["13% A/P ratio"],
        advanced: ["Payables calculation"]
      },
      'D12': {
        beginner: ["Q2 A/P: =D4*0.13"],
        intermediate: ["13% A/P ratio"],
        advanced: ["Payables calculation"]
      },
      
      // Net Working Capital
      'C13': {
        beginner: [
          "Net WC = Inventory + A/R - A/P",
          "Add inventory and receivables, subtract payables",
          "Enter: =C10+C11-C12"
        ],
        intermediate: ["Net Working Capital formula"],
        advanced: ["NWC calculation"]
      },
      
      // Working Capital Change
      'C14': {
        beginner: [
          "WC Change = Current Quarter NWC - Previous Quarter NWC",
          "Q1 change from LTM: C13 - B13 (LTM NWC = $18M)",
          "Enter: =C13-B13"
        ],
        intermediate: ["Working capital change calculation"],
        advanced: ["WC change formula"]
      },
      
      // Capex (2% for retail)
      'C18': {
        beginner: [
          "Retail Capex: 2% of revenue (lower than tech, mainly store fixtures)",
          "Q1 Capex: C4 * 0.02",
          "Enter: =C4*0.02"
        ],
        intermediate: ["2% retail capex rate"],
        advanced: ["Retail capex calculation"]
      },
      
      // Free Cash Flow
      'C20': {
        beginner: [
          "FCF = EBITDA - Capex - Working Capital Change",
          "Subtract capex and WC change from EBITDA",
          "Enter: =C17-C18-C19"
        ],
        intermediate: ["Free cash flow formula"],
        advanced: ["FCF calculation"]
      },
      
      // Exit Valuation
      'V28': {
        beginner: [
          "Exit EV: 12x Year 5 Q4 EBITDA (lower multiple for retail)",
          "Retail trades at discount to tech: V5 * 12",
          "Enter: =V5*12"
        ],
        intermediate: ["12x exit multiple for retail"],
        advanced: ["Retail exit valuation"]
      },
      
      // MOIC
      'V30': {
        beginner: [
          "MOIC = Exit Equity / Initial Equity Investment",
          "Initial equity = $180M - $108M = $72M",
          "Enter: =V29/72"
        ],
        intermediate: ["MOIC calculation"],
        advanced: ["Multiple on invested capital"]
      }
    };

    if (!hints[cellRef]) return null;
    
    const difficultyHints = hints[cellRef][difficulty] || hints[cellRef]['beginner'];
    if (!difficultyHints) return null;
    
    return difficultyHints[Math.min(attemptNumber, difficultyHints.length - 1)] || null;
  };

  const getManufacturingGiantHintText = (cellRef: string, difficulty: string = 'beginner', attemptNumber: number = 0): string | null => {
    const hints: Record<string, Record<string, string[]>> = {
      // Cyclical Revenue Hints (Economic Cycle)
      'C4': {
        beginner: [
          "Year 1 revenue: Manufacturing is recovering from economic downturn. Apply 5% growth to LTM revenue.",
          "Economic recovery phase: multiply LTM revenue ($400M) by 1.05",
          "Enter: =B4*1.05"
        ],
        intermediate: ["Apply economic recovery growth rate to base revenue"],
        advanced: ["Consider economic cycle positioning"]
      },
      'D4': {
        beginner: [
          "Year 2 revenue: Economy expanding, 8% growth from previous year",
          "Expansion phase drives higher growth: C4 * 1.08", 
          "Enter: =C4*1.08"
        ],
        intermediate: ["Apply expansion phase growth rate"],
        advanced: ["Economic expansion cycle"]
      },
      'E4': {
        beginner: [
          "Year 3 revenue: Late economic cycle, growth slowing to 3%",
          "Late cycle with moderating growth: D4 * 1.03",
          "Enter: =D4*1.03"
        ],
        intermediate: ["Late cycle growth moderation"],
        advanced: ["Economic cycle maturity"]
      },
      'F4': {
        beginner: [
          "Year 4 revenue: Economic downturn, -2% decline",
          "Manufacturing hit by economic downturn: E4 * 0.98",
          "Enter: =E4*0.98"
        ],
        intermediate: ["Economic downturn impact"],
        advanced: ["Cyclical industry sensitivity"]
      },
      'G4': {
        beginner: [
          "Year 5 revenue: Recovery begins, 6% growth",
          "New economic recovery cycle: F4 * 1.06",
          "Enter: =F4*1.06"
        ],
        intermediate: ["Recovery phase growth"],
        advanced: ["Cycle completion and renewal"]
      },
      
      // EBITDA Hints (18% margin)
      'C5': {
        beginner: [
          "Manufacturing EBITDA: 18% margin (between retail 15% and tech 25%)",
          "Apply 18% margin to Year 1 revenue",
          "Enter: =C4*0.18"
        ],
        intermediate: ["Industrial manufacturing margin profile"],
        advanced: ["Manufacturing profitability"]
      },
      
      // Complex Working Capital
      'C14': {
        beginner: [
          "Raw Materials: Manufacturing needs inventory of raw materials (7% of revenue)",
          "Calculate raw materials as percentage of revenue",
          "Enter: =C4*0.07"
        ],
        intermediate: ["Raw materials as percentage of revenue"],
        advanced: ["Manufacturing inventory management"]
      },
      'C15': {
        beginner: [
          "Finished Goods: Completed products ready for sale (8% of revenue)",
          "Manufacturing holds finished goods inventory",
          "Enter: =C4*0.08"
        ],
        intermediate: ["Finished goods inventory calculation"],
        advanced: ["Production inventory cycles"]
      },
      'C18': {
        beginner: [
          "Net Working Capital = Raw Materials + Finished Goods + A/R - A/P",
          "Add all current assets, subtract current liabilities",
          "Enter: =C14+C15+C16-C17"
        ],
        intermediate: ["Complex working capital calculation"],
        advanced: ["Multi-component working capital"]
      },
      
      // Capex Complexity
      'C23': {
        beginner: [
          "Maintenance Capex: 3% of revenue to maintain manufacturing equipment",
          "Heavy asset manufacturing requires significant maintenance",
          "Enter: =C4*0.03"
        ],
        intermediate: ["Maintenance capex for manufacturing assets"],
        advanced: ["Asset-intensive operations"]
      },
      'C24': {
        beginner: [
          "Growth Capex: 2% of revenue for expansion and new equipment",
          "Additional investment for growth initiatives",
          "Enter: =C4*0.02"
        ],
        intermediate: ["Growth capital expenditure"],
        advanced: ["Expansion investment"]
      },
      
      // Multi-Tranche Debt
      'C30': {
        beginner: [
          "Term Loan A: Senior debt tranche starting at $200M",
          "Reference the initial TLA balance",
          "Enter: =B30 or =200"
        ],
        intermediate: ["Senior debt tranche management"],
        advanced: ["Multi-tranche debt structure"]
      },
      'C33': {
        beginner: [
          "Total Debt: Sum of all three debt tranches",
          "Add Term Loan A + Term Loan B + Revolver",
          "Enter: =C30+C31+C32"
        ],
        intermediate: ["Aggregate debt calculation"],
        advanced: ["Total debt management"]
      },
      
      // Covenant Testing
      'C38': {
        beginner: [
          "Leverage Ratio: Total Debt ÷ EBITDA (must stay below 6.0x)",
          "Critical covenant that must be monitored",
          "Enter: =C33/C5"
        ],
        intermediate: ["Debt covenant monitoring"],
        advanced: ["Leverage covenant compliance"]
      },
      'C39': {
        beginner: [
          "Coverage Ratio: (EBITDA - Capex) ÷ Interest Expense (must exceed 1.25x)",
          "Measures ability to service debt after capex",
          "Enter: =(C5-C25)/30"
        ],
        intermediate: ["Interest coverage calculation"],
        advanced: ["Debt service capability"]
      }
    };

    if (!hints[cellRef]) return null;
    
    const difficultyHints = hints[cellRef][difficulty] || hints[cellRef]['beginner'];
    if (!difficultyHints) return null;
    
    return difficultyHints[Math.min(attemptNumber, difficultyHints.length - 1)] || null;
  };

  const getEnergyConglomerateHintText = (cellRef: string, difficulty: string = 'beginner', attemptNumber: number = 0): string | null => {
    const hints: Record<string, Record<string, string[]>> = {
      // UPSTREAM (OIL & GAS) REVENUE HINTS
      'C4': {
        beginner: [
          "Upstream revenue = (Oil Production × Oil Price) + (Gas Production × Gas Price)",
          "Account for 75% oil hedging at $72/bbl vs spot price in I5",
          "Enter: =(C5*IF(I5>72,72,I5)*0.75+C5*I5*0.25)+(C6*J5)"
        ],
        intermediate: ["Complex upstream revenue with hedging and commodity exposure"],
        advanced: ["Multi-commodity revenue modeling with hedging strategies"]
      },
      'C5': {
        beginner: [
          "Oil production typically declines 8-12% annually without new drilling",
          "Model base decline + new drilling additions",
          "Enter: =B5*0.92"
        ],
        intermediate: ["Factor in drilling capex and reserve replacement"],
        advanced: ["Reserve-based production forecasting"]
      },
      'C6': {
        beginner: [
          "Gas production often associated with oil production",
          "Model gas field decline rates separately",
          "Enter: =B6*0.94"
        ],
        intermediate: ["Associated gas vs dry gas production modeling"],
        advanced: ["Gas field decline curve analysis"]
      },
      'I5': {
        beginner: [
          "Oil price scenario for Year 1 - start with current forward curve",
          "Base year price considering supply/demand fundamentals",
          "Enter: 78"
        ],
        intermediate: ["Commodity price scenario analysis based on fundamentals"],
        advanced: ["Monte Carlo price modeling with volatility bands"]
      },
      'I6': {
        beginner: [
          "Year 2 oil price: escalate from Year 1 with inflation",
          "Apply 2.5% annual price escalation",
          "Enter: =I5*1.025"
        ],
        intermediate: ["Multi-year price trajectory with inflation adjustment"],
        advanced: ["Commodity cycle modeling with mean reversion"]
      },
      'J5': {
        beginner: [
          "Natural gas price for Year 1 - typically $3-6/mmbtu",
          "More volatile than oil, weather dependent",
          "Enter: 4.8"
        ],
        intermediate: ["Gas price seasonality and volatility"],
        advanced: ["Gas-oil price correlation modeling"]
      },
      'I7': {
        beginner: [
          "Year 3 oil price: continue price escalation",
          "Apply 2.5% annual escalation from Year 2",
          "Enter: =I6*1.025"
        ],
        intermediate: ["Multi-year price trajectory with compounding"],
        advanced: ["Commodity cycle modeling with supply/demand dynamics"]
      },
      'I8': {
        beginner: [
          "Year 4 oil price: sustained price growth",
          "Continue 2.5% annual escalation pattern",
          "Enter: =I7*1.025"
        ],
        intermediate: ["Long-term price trajectory modeling"],
        advanced: ["Integrated commodity cycle and inflation modeling"]
      },
      'I9': {
        beginner: [
          "Year 5 oil price: final year price scenario",
          "Complete price escalation series",
          "Enter: =I8*1.025"
        ],
        intermediate: ["Terminal year price modeling"],
        advanced: ["Long-term commodity price forecasting"]
      },
      'J6': {
        beginner: [
          "Year 2 gas price: escalate with different growth than oil",
          "Gas prices typically grow 4% annually due to demand",
          "Enter: =J5*1.04"
        ],
        intermediate: ["Gas price seasonality with demand growth"],
        advanced: ["Gas-oil price correlation with differential growth rates"]
      },
      'J7': {
        beginner: [
          "Year 3 gas price: continue gas demand growth",
          "Apply 4% annual gas price escalation",
          "Enter: =J6*1.04"
        ],
        intermediate: ["Multi-year gas demand trajectory"],
        advanced: ["Gas infrastructure and demand correlation modeling"]
      },
      'J8': {
        beginner: [
          "Year 4 gas price: sustained gas demand growth",
          "Continue 4% annual escalation pattern",
          "Enter: =J7*1.04"
        ],
        intermediate: ["Long-term gas market dynamics"],
        advanced: ["Integrated gas supply-demand modeling"]
      },
      'J9': {
        beginner: [
          "Year 5 gas price: final year gas scenario",
          "Complete gas price escalation series",
          "Enter: =J8*1.04"
        ],
        intermediate: ["Terminal gas price modeling"],
        advanced: ["Long-term gas market forecasting with LNG dynamics"]
      },
      
      // UPSTREAM REVENUE PROJECTIONS (Years 2-5)
      'D4': {
        beginner: [
          "Year 2 upstream revenue: Production decline + commodity price changes",
          "Use Year 2 production levels and oil/gas prices",
          "Enter: =(D5*IF(I6>72,72,I6)*0.75+D5*I6*0.25)+(D6*J6)"
        ],
        intermediate: ["Multi-year upstream revenue with hedging"],
        advanced: ["Production decline and commodity price correlation"]
      },
      'E4': {
        beginner: [
          "Year 3 upstream revenue: Continued production decline",
          "Model base decline plus new drilling program impacts",
          "Enter: =(E5*IF(I7>72,72,I7)*0.75+E5*I7*0.25)+(E6*J7)"
        ],
        intermediate: ["Reserve replacement and hedging strategy"],
        advanced: ["Field development and commodity hedging optimization"]
      },
      'F4': {
        beginner: [
          "Year 4 upstream revenue: Late-cycle production management",
          "Balance production decline with capital allocation",
          "Enter: =(F5*IF(I8>72,72,I8)*0.75+F5*I8*0.25)+(F6*J8)"
        ],
        intermediate: ["Production optimization strategies"],
        advanced: ["Portfolio high-grading and hedging"]
      },
      'G4': {
        beginner: [
          "Year 5 upstream revenue: Strategic portfolio positioning",
          "Optimize production mix and commodity exposure",
          "Enter: =(G5*IF(I9>72,72,I9)*0.75+G5*I9*0.25)+(G6*J9)"
        ],
        intermediate: ["Long-term production strategy"],
        advanced: ["Portfolio optimization and risk management"]
      },
      'D5': {
        beginner: [
          "Year 2 oil production: Continue base decline without new drilling",
          "Apply 8% annual decline rate to previous year production",
          "Enter: =C5*0.92"
        ],
        intermediate: ["Production decline modeling"],
        advanced: ["Reserve replacement ratio analysis"]
      },
      'E5': {
        beginner: [
          "Year 3 oil production: Sustained production decline pattern",
          "Continue 8% annual decline from Year 2 levels",
          "Enter: =D5*0.92"
        ],
        intermediate: ["Sustained production decline"],
        advanced: ["Field-level decline curve modeling"]
      },
      'F5': {
        beginner: [
          "Year 4 oil production: Late-cycle production management",
          "Maintain 8% decline rate through operational efficiency",
          "Enter: =E5*0.92"
        ],
        intermediate: ["Late-cycle production management"],
        advanced: ["Enhanced recovery and optimization"]
      },
      'G5': {
        beginner: [
          "Year 5 oil production: Final year production optimization",
          "Terminal year with continued 8% decline",
          "Enter: =F5*0.92"
        ],
        intermediate: ["Long-term production strategy"],
        advanced: ["Portfolio optimization modeling"]
      },
      'D6': {
        beginner: [
          "Year 2 gas production: Apply gas field decline rate",
          "Gas declines slower than oil at 6% annually",
          "Enter: =C6*0.94"
        ],
        intermediate: ["Gas field decline modeling"],
        advanced: ["Associated vs dry gas production"]
      },
      'E6': {
        beginner: [
          "Year 3 gas production: Continue gas field decline",
          "Maintain 6% annual decline rate for gas fields",
          "Enter: =D6*0.94"
        ],
        intermediate: ["Multi-year gas decline"],
        advanced: ["Gas reserve optimization"]
      },
      'F6': {
        beginner: [
          "Year 4 gas production: Late-cycle gas field management",
          "Continue consistent 6% decline pattern",
          "Enter: =E6*0.94"
        ],
        intermediate: ["Gas production management"],
        advanced: ["Gas-oil ratio optimization"]
      },
      'G6': {
        beginner: [
          "Year 5 gas production: Terminal year gas optimization",
          "Final year with 6% decline rate",
          "Enter: =F6*0.94"
        ],
        intermediate: ["Long-term gas strategy"],
        advanced: ["Integrated gas development"]
      },
      
      // MIDSTREAM (PIPELINE) REVENUE HINTS
      'C10': {
        beginner: [
          "Pipeline revenue = Throughput × Tariff × Days per year",
          "Stable, contracted cash flows with inflation escalators",
          "Enter: =C11*B12*365/1000"
        ],
        intermediate: ["Contract escalation and utilization modeling"],
        advanced: ["Regulatory return and rate base modeling"]
      },
      'C11': {
        beginner: [
          "Throughput grows with upstream production and downstream demand",
          "Capacity utilization typically 85-95%",
          "Enter: =B11*1.03"
        ],
        intermediate: ["Capacity constraints and expansion modeling"],
        advanced: ["Network optimization modeling"]
      },
      
      // DOWNSTREAM (REFINING) REVENUE HINTS
      'C14': {
        beginner: [
          "Refining revenue = Capacity × Utilization × Crack Spread × Days",
          "Crack spread = Refined product price - Crude oil cost",
          "Enter: =C15*C16*C17*365/1000"
        ],
        intermediate: ["Product slate optimization and crack spread modeling"],
        advanced: ["Linear programming optimization for product mix"]
      },
      'C15': {
        beginner: [
          "Refining capacity utilization varies with maintenance cycles",
          "Typically 85-95%, lower during turnarounds",
          "Enter: =B15*B16*0.94"
        ],
        intermediate: ["Turnaround scheduling and utilization optimization"],
        advanced: ["Maintenance capex and utilization correlation"]
      },
      'C17': {
        beginner: [
          "Base crack spread: Start with current market conditions",
          "3-2-1 crack spread averages $8-15/bbl, use mid-point",
          "Enter: 12.5"
        ],
        intermediate: ["Crack spread seasonal patterns and volatility modeling"],
        advanced: ["Crack spread hedging strategies and refining optimization"]
      },
      
      // RENEWABLES REVENUE HINTS
      'C19': {
        beginner: [
          "Renewables revenue = Capacity × Capacity Factor × Hours × PPA Price",
          "Add production tax credits (PTC) for wind",
          "Enter: =C20*C21*8760*C22/1000"
        ],
        intermediate: ["PTC vs ITC optimization and tax equity structures"],
        advanced: ["Merchant vs contracted renewables optimization"]
      },
      'C20': {
        beginner: [
          "Renewable capacity expansion driven by ESG and economics",
          "Model new project additions and retirements",
          "Enter: =B20*1.15"
        ],
        intermediate: ["Development pipeline and capital allocation"],
        advanced: ["Portfolio optimization across technologies"]
      },
      'C22': {
        beginner: [
          "PPA prices typically have 2-3% annual escalation",
          "Long-term contracts provide stable cash flows",
          "Enter: =B22*1.025"
        ],
        intermediate: ["PPA contract optimization and pricing"],
        advanced: ["Merchant price exposure and hedging"]
      },
      
      // CONSOLIDATED INCOME STATEMENT HINTS
      'C24': {
        beginner: [
          "Total revenue = Sum of all divisional revenues",
          "Check for inter-company eliminations",
          "Enter: =C4+C10+C14+C19"
        ],
        intermediate: ["Divisional revenue consolidation and eliminations"],
        advanced: ["Transfer pricing optimization"]
      },
      'C28': {
        beginner: [
          "Cost of sales typically 70-75% of revenue for energy companies",
          "Variable with commodity prices and utilization",
          "Enter: =C24*0.72"
        ],
        intermediate: ["Cost structure analysis by division"],
        advanced: ["Operating leverage and cost optimization"]
      },
      'C29': {
        beginner: [
          "Gross profit = Revenue - Cost of sales",
          "Key metric for energy company profitability",
          "Enter: =C24-C28"
        ],
        intermediate: ["Gross margin expansion strategies"],
        advanced: ["Margin optimization across business units"]
      },
      'C32': {
        beginner: [
          "Carbon pricing $25-50/tonne CO2, varies by jurisdiction",
          "Apply to upstream emissions (~0.5 tonne CO2/bbl oil)",
          "Enter: =C5*0.5*35"
        ],
        intermediate: ["Carbon tax vs cap-and-trade modeling"],
        advanced: ["Carbon credit monetization strategies"]
      },
      'C33': {
        beginner: [
          "EBITDA = Gross Profit - SG&A - Environmental - Carbon costs",
          "Key metric for energy company valuation",
          "Enter: =C29-B30-B31-C32"
        ],
        intermediate: ["EBITDA margin improvement initiatives"],
        advanced: ["Divisional EBITDA allocation and optimization"]
      },
      'C35': {
        beginner: [
          "EBIT = EBITDA - Depreciation & Amortization",
          "High D&A reflects capital-intensive nature",
          "Enter: =C33-B34"
        ],
        intermediate: ["D&A optimization and asset life management"],
        advanced: ["Impairment testing and asset optimization"]
      },
      'C36': {
        beginner: [
          "Interest expense on debt used to fund capital projects",
          "Model different debt tranches and rates",
          "Enter: =200*0.08"
        ],
        intermediate: ["Debt structure optimization and refinancing"],
        advanced: ["Project finance and corporate debt optimization"]
      },
      
      // CASH FLOW HINTS
      'C42': {
        beginner: [
          "Use EBITDA from income statement for cash flow",
          "Starting point for free cash flow calculation",
          "Enter: =C33"
        ],
        intermediate: ["Working capital timing differences"],
        advanced: ["Cash vs accrual accounting differences"]
      },
      'C43': {
        beginner: [
          "Maintenance capex typically 4-6% of revenue",
          "Required to maintain production and operations",
          "Enter: =C24*0.05"
        ],
        intermediate: ["Maintenance vs growth capex allocation"],
        advanced: ["Optimal maintenance strategies and timing"]
      },
      'C44': {
        beginner: [
          "Growth capex for new drilling, facilities, renewables",
          "Typically 8-12% of revenue for growth companies",
          "Enter: =C24*0.10"
        ],
        intermediate: ["Growth capex optimization and returns"],
        advanced: ["Capital allocation across business units"]
      },
      'C45': {
        beginner: [
          "Environmental remediation = Base cost + Production-based costs",
          "Formula: Base ($10M) + (Oil production × $1M/MMbbl)",
          "Enter: =10+C5*1"
        ],
        intermediate: ["Scale remediation with production levels and regulatory requirements"],
        advanced: ["Dynamic environmental liability modeling with ESG compliance"]
      },
      'C46': {
        beginner: [
          "Working capital changes with commodity prices and volumes",
          "Energy companies typically have negative working capital",
          "Enter: =(C24-B24)*0.05"
        ],
        intermediate: ["Commodity price impact on working capital"],
        advanced: ["Working capital optimization strategies"]
      },
      'C47': {
        beginner: [
          "Free Cash Flow = EBITDA - Capex - Working Capital - Remediation",
          "Key metric for debt service and returns",
          "Enter: =C42-C43-C44-C45-C46"
        ],
        intermediate: ["FCF optimization and capital efficiency"],
        advanced: ["Free cash flow yield optimization"]
      },
      
      // MISSING MIDSTREAM HINTS (Years 2-5)
      'D10': {
        beginner: [
          "Year 2 pipeline revenue: Throughput × Tariff × Days",
          "Growing throughput with stable contracted tariffs",
          "Enter: =D11*B12*365/1000"
        ],
        intermediate: ["Pipeline revenue with capacity growth"],
        advanced: ["Regulatory rate base expansion"]
      },
      'E10': {
        beginner: [
          "Year 3 pipeline revenue: Continued throughput growth",
          "Stable midstream cash flows with volume expansion",
          "Enter: =E11*B12*365/1000"
        ],
        intermediate: ["Midstream revenue scaling"],
        advanced: ["Network effects and utilization"]
      },
      'F10': {
        beginner: [
          "Year 4 pipeline revenue: Optimized capacity utilization",
          "Late-cycle pipeline revenue with efficiency gains",
          "Enter: =F11*B12*365/1000"
        ],
        intermediate: ["Pipeline capacity optimization"],
        advanced: ["Infrastructure asset optimization"]
      },
      'G10': {
        beginner: [
          "Year 5 pipeline revenue: Terminal year optimization",
          "Final year pipeline revenue with mature throughput",
          "Enter: =G11*B12*365/1000"
        ],
        intermediate: ["Long-term pipeline strategy"],
        advanced: ["Energy transition impact on pipelines"]
      },
      'D11': {
        beginner: [
          "Year 2 throughput: Pipeline volume growth with upstream production",
          "Apply 3% annual throughput growth from demand expansion",
          "Enter: =C11*1.03"
        ],
        intermediate: ["Throughput growth with demand"],
        advanced: ["Capacity constraint modeling"]
      },
      'E11': {
        beginner: [
          "Year 3 throughput: Continued pipeline utilization growth",
          "Maintain 3% annual growth from network effects",
          "Enter: =D11*1.03"
        ],
        intermediate: ["Sustained throughput growth"],
        advanced: ["Network optimization"]
      },
      'F11': {
        beginner: [
          "Year 4 throughput: Late-cycle capacity optimization",
          "Continue 3% growth with enhanced operational efficiency",
          "Enter: =E11*1.03"
        ],
        intermediate: ["Throughput capacity management"],
        advanced: ["Pipeline network efficiency"]
      },
      'G11': {
        beginner: [
          "Year 5 throughput: Terminal year pipeline utilization",
          "Final year with mature 3% throughput growth",
          "Enter: =F11*1.03"
        ],
        intermediate: ["Long-term throughput strategy"],
        advanced: ["Energy transition pipeline planning"]
      },
      
      // MISSING DOWNSTREAM HINTS (Years 2-5)
      'D14': {
        beginner: [
          "Year 2 refining revenue: Capacity × Utilization × Crack Spread × Days",
          "Complex refining economics with improving crack spreads",
          "Enter: =D15*B16*D17*365/1000"
        ],
        intermediate: ["Refining margin optimization"],
        advanced: ["Product slate optimization"]
      },
      'E14': {
        beginner: [
          "Year 3 refining revenue: Mid-cycle refining performance",
          "Economic cycle impact on crack spreads and utilization",
          "Enter: =E15*B16*E17*365/1000"
        ],
        intermediate: ["Crack spread management"],
        advanced: ["Integrated refining strategy"]
      },
      'F14': {
        beginner: [
          "Year 4 refining revenue: Recovery phase operations",
          "Improving crack spreads with optimized capacity utilization",
          "Enter: =F15*B16*F17*365/1000"
        ],
        intermediate: ["Refining capacity utilization"],
        advanced: ["Turnaround cycle optimization"]
      },
      'G14': {
        beginner: [
          "Year 5 refining revenue: Peak cycle performance",
          "Terminal year with strong crack spreads and utilization",
          "Enter: =G15*B16*G17*365/1000"
        ],
        intermediate: ["Long-term refining strategy"],
        advanced: ["Energy transition refining adaptation"]
      },
      'D15': {
        beginner: [
          "Year 2 capacity utilization: Refinery operational efficiency",
          "Apply slight decline (6%) from maintenance cycles",
          "Enter: =C15*0.94"
        ],
        intermediate: ["Refinery utilization optimization"],
        advanced: ["Maintenance scheduling efficiency"]
      },
      'E15': {
        beginner: [
          "Year 3 capacity utilization: Continued operational decline",
          "Maintain 6% annual utilization decline pattern",
          "Enter: =D15*0.94"
        ],
        intermediate: ["Sustained refinery operations"],
        advanced: ["Operational excellence programs"]
      },
      'F15': {
        beginner: [
          "Year 4 capacity utilization: Late-cycle efficiency management",
          "Continue 6% decline with operational improvements",
          "Enter: =E15*0.94"
        ],
        intermediate: ["Refinery optimization"],
        advanced: ["Advanced process control"]
      },
      'G15': {
        beginner: [
          "Year 5 capacity utilization: Terminal year optimization",
          "Final year with 6% utilization decline",
          "Enter: =F15*0.94"
        ],
        intermediate: ["Long-term refinery strategy"],
        advanced: ["Future-ready refining operations"]
      },
      'D17': {
        beginner: [
          "Year 2 crack spread: Apply modest increase from base year",
          "Crack spreads typically trend up 4% annually with demand",
          "Enter: =C17*1.04"
        ],
        intermediate: ["Crack spread cycle modeling with product demand"],
        advanced: ["Refined product margin optimization with market dynamics"]
      },
      'E17': {
        beginner: [
          "Year 3 crack spread: Economy cycle impact - slight decline",
          "Model economic cycle effects: -8% from prior year",
          "Enter: =D17*0.92"
        ],
        intermediate: ["Multi-year crack spread trends with economic cycles"],
        advanced: ["Product portfolio optimization through commodity cycles"]
      },
      'F17': {
        beginner: [
          "Year 4 crack spread: Recovery from cycle trough",
          "Economic recovery drives 4% improvement",
          "Enter: =E17*1.04"
        ],
        intermediate: ["Crack spread volatility management through cycles"],
        advanced: ["Integrated margin optimization with economic recovery"]
      },
      'G17': {
        beginner: [
          "Year 5 crack spread: Continued recovery",
          "Final year sees 7% improvement to above-average levels",
          "Enter: =F17*1.07"
        ],
        intermediate: ["Long-term refining margins with demand recovery"],
        advanced: ["Energy transition refining margins and product slate evolution"]
      },
      
      // MISSING RENEWABLES HINTS (Years 2-5)
      'D19': {
        beginner: [
          "Year 2 renewables revenue: Capacity × Capacity Factor × Hours × PPA Price",
          "Growing renewable portfolio with contracted power sales",
          "Enter: =D20*B21*8760*D22/1000"
        ],
        intermediate: ["Renewable capacity scaling"],
        advanced: ["Clean energy portfolio optimization"]
      },
      'E19': {
        beginner: [
          "Year 3 renewables revenue: Expanding clean energy generation",
          "Mid-cycle renewable portfolio with PPA escalation",
          "Enter: =E20*B21*8760*E22/1000"
        ],
        intermediate: ["Renewable energy growth"],
        advanced: ["Grid integration optimization"]
      },
      'F19': {
        beginner: [
          "Year 4 renewables revenue: Mature renewable operations",
          "Late-cycle clean energy with optimized capacity factors",
          "Enter: =F20*B21*8760*F22/1000"
        ],
        intermediate: ["Clean energy expansion"],
        advanced: ["Energy storage integration"]
      },
      'G19': {
        beginner: [
          "Year 5 renewables revenue: Peak renewable portfolio performance",
          "Terminal year with full renewable capacity deployment",
          "Enter: =G20*B21*8760*G22/1000"
        ],
        intermediate: ["Renewable portfolio maturation"],
        advanced: ["Energy transition leadership"]
      },
      'D20': {
        beginner: [
          "Year 2 renewable capacity: Aggressive capacity expansion",
          "Apply 15% annual growth from new project development",
          "Enter: =C20*1.15"
        ],
        intermediate: ["Capacity expansion strategy"],
        advanced: ["Technology improvement benefits"]
      },
      'E20': {
        beginner: [
          "Year 3 renewable capacity: Continued portfolio expansion",
          "Maintain 15% annual capacity growth trajectory",
          "Enter: =D20*1.15"
        ],
        intermediate: ["Sustained capacity growth"],
        advanced: ["Renewable technology scaling"]
      },
      'F20': {
        beginner: [
          "Year 4 renewable capacity: Late-cycle capacity deployment",
          "Continue 15% growth with operational efficiency gains",
          "Enter: =E20*1.15"
        ],
        intermediate: ["Clean energy capacity optimization"],
        advanced: ["Grid-scale renewable deployment"]
      },
      'G20': {
        beginner: [
          "Year 5 renewable capacity: Peak capacity achievement",
          "Terminal year with 15% capacity growth completion",
          "Enter: =F20*1.15"
        ],
        intermediate: ["Long-term renewable strategy"],
        advanced: ["Next-generation renewable technologies"]
      },
      'D22': {
        beginner: [
          "Year 2 PPA price: Power purchase agreement escalation",
          "Apply 2.5% annual PPA price escalation clause",
          "Enter: =C22*1.025"
        ],
        intermediate: ["PPA escalation modeling"],
        advanced: ["Long-term power purchase agreements"]
      },
      'E22': {
        beginner: [
          "Year 3 PPA price: Continued contract escalation",
          "Maintain 2.5% annual PPA price growth",
          "Enter: =D22*1.025"
        ],
        intermediate: ["Multi-year PPA pricing"],
        advanced: ["Renewable energy pricing trends"]
      },
      'F22': {
        beginner: [
          "Year 4 PPA price: Late-cycle pricing optimization",
          "Continue 2.5% escalation with market competitiveness",
          "Enter: =E22*1.025"
        ],
        intermediate: ["PPA price optimization"],
        advanced: ["Clean energy market dynamics"]
      },
      'G22': {
        beginner: [
          "Year 5 PPA price: Terminal year pricing achievement",
          "Final year with 2.5% PPA escalation completion",
          "Enter: =F22*1.025"
        ],
        intermediate: ["Long-term clean energy pricing"],
        advanced: ["Energy transition pricing models"]
      },
      
      // MISSING CONSOLIDATED P&L HINTS (Years 2-5)
      'D24': {
        beginner: [
          "Year 2 total revenue: Sum all divisional revenues",
          "Aggregate Upstream + Midstream + Downstream + Renewables",
          "Enter: =D4+D10+D14+D19"
        ],
        intermediate: ["Consolidated revenue summation"],
        advanced: ["Multi-division revenue aggregation"]
      },
      'E24': {
        beginner: [
          "Year 3 total revenue: Consolidated energy portfolio",
          "Mid-cycle revenue aggregation across all divisions",
          "Enter: =E4+E10+E14+E19"
        ],
        intermediate: ["Total energy conglomerate revenue"],
        advanced: ["Integrated energy portfolio revenue"]
      },
      'F24': {
        beginner: [
          "Year 4 total revenue: Late-cycle portfolio performance",
          "Diversified energy revenue with improving margins",
          "Enter: =F4+F10+F14+F19"
        ],
        intermediate: ["Diversified energy revenue"],
        advanced: ["Energy transition revenue mix"]
      },
      'G24': {
        beginner: [
          "Year 5 total revenue: Peak integrated energy performance",
          "Terminal year with optimized divisional contributions",
          "Enter: =G4+G10+G14+G19"
        ],
        intermediate: ["Mature energy portfolio revenue"],
        advanced: ["Sustainable energy revenue model"]
      },
      'D28': {
        beginner: [
          "Year 2 cost of sales: Variable costs scale with revenue",
          "Apply 72% cost ratio typical for energy companies",
          "Enter: =D24*0.72"
        ],
        intermediate: ["Variable cost modeling"],
        advanced: ["Integrated cost optimization"]
      },
      'E28': {
        beginner: [
          "Year 3 cost of sales: Continued cost structure efficiency",
          "Maintain 72% cost ratio with operational improvements",
          "Enter: =E24*0.72"
        ],
        intermediate: ["Cost efficiency programs"],
        advanced: ["Operational leverage realization"]
      },
      'F28': {
        beginner: [
          "Year 4 cost of sales: Late-cycle cost optimization",
          "Sustained 72% cost ratio with scale benefits",
          "Enter: =F24*0.72"
        ],
        intermediate: ["Scale efficiency benefits"],
        advanced: ["Technology-driven cost reduction"]
      },
      'G28': {
        beginner: [
          "Year 5 cost of sales: Peak cost efficiency achievement",
          "Terminal year with optimized 72% cost structure",
          "Enter: =G24*0.72"
        ],
        intermediate: ["Optimized cost structure"],
        advanced: ["Sustainable cost competitiveness"]
      },
      'D29': {
        beginner: [
          "Year 2 gross profit: Revenue minus cost of sales",
          "Key profitability metric for energy operations",
          "Enter: =D24-D28"
        ],
        intermediate: ["Gross margin expansion"],
        advanced: ["Integrated margin optimization"]
      },
      'E29': {
        beginner: [
          "Year 3 gross profit: Mid-cycle margin performance",
          "Sustained gross profitability with scale benefits",
          "Enter: =E24-E28"
        ],
        intermediate: ["Sustainable gross margins"],
        advanced: ["Value chain optimization"]
      },
      'F29': {
        beginner: [
          "Year 4 gross profit: Late-cycle margin optimization",
          "Enhanced gross margins through operational efficiency",
          "Enter: =F24-F28"
        ],
        intermediate: ["Margin enhancement strategies"],
        advanced: ["Competitive positioning benefits"]
      },
      'G29': {
        beginner: [
          "Year 5 gross profit: Peak margin achievement",
          "Terminal year with optimized gross profitability",
          "Enter: =G24-G28"
        ],
        intermediate: ["Mature margin profile"],
        advanced: ["Long-term profitability optimization"]
      },
      'D32': {
        beginner: [
          "Year 2 carbon pricing: Oil production × CO2 intensity × Carbon price",
          "Calculate carbon cost: Production (D5) × 0.5 tonnes CO2/bbl × $35/tonne",
          "Enter: =D5*0.5*35"
        ],
        intermediate: ["Carbon cost escalation"],
        advanced: ["ESG impact on profitability"]
      },
      'E32': {
        beginner: [
          "Year 3 carbon pricing: Continued carbon cost burden",
          "Mid-cycle carbon pricing with same rate structure",
          "Enter: =E5*0.5*35"
        ],
        intermediate: ["Carbon regulation compliance"],
        advanced: ["Climate risk monetization"]
      },
      'F32': {
        beginner: [
          "Year 4 carbon pricing: Late-cycle environmental costs",
          "Carbon burden declines with production decline",
          "Enter: =F5*0.5*35"
        ],
        intermediate: ["Carbon pricing trends"],
        advanced: ["Decarbonization investment benefits"]
      },
      'G32': {
        beginner: [
          "Year 5 carbon pricing: Terminal year carbon obligations",
          "Final year carbon cost with lowest production levels",
          "Enter: =G5*0.5*35"
        ],
        intermediate: ["Long-term carbon costs"],
        advanced: ["Net-zero transition economics"]
      },
      'D33': {
        beginner: [
          "Year 2 EBITDA: Gross Profit - SG&A - Environmental - Carbon costs",
          "Key profitability metric after all operating expenses",
          "Enter: =D29-B30-B31-D32"
        ],
        intermediate: ["EBITDA optimization"],
        advanced: ["Integrated profitability enhancement"]
      },
      'E33': {
        beginner: [
          "Year 3 EBITDA: Mid-cycle operational profitability",
          "Sustained EBITDA generation with cost discipline",
          "Enter: =E29-B30-B31-E32"
        ],
        intermediate: ["Sustainable EBITDA growth"],
        advanced: ["Value creation optimization"]
      },
      'F33': {
        beginner: [
          "Year 4 EBITDA: Late-cycle margin optimization",
          "Enhanced EBITDA through operational leverage",
          "Enter: =F29-B30-B31-F32"
        ],
        intermediate: ["EBITDA margin enhancement"],
        advanced: ["Operational excellence realization"]
      },
      'G33': {
        beginner: [
          "Year 5 EBITDA: Peak operational performance",
          "Terminal year with optimized EBITDA generation",
          "Enter: =G29-B30-B31-G32"
        ],
        intermediate: ["Mature EBITDA profile"],
        advanced: ["Long-term value optimization"]
      },
      'D35': {
        beginner: [
          "Year 2 EBIT: EBITDA minus Depreciation & Amortization",
          "Operating profit after accounting for asset depreciation",
          "Enter: =D33-B34"
        ],
        intermediate: ["EBIT progression"],
        advanced: ["Operating leverage benefits"]
      },
      'E35': {
        beginner: [
          "Year 3 EBIT: Mid-cycle operating earnings",
          "Sustained operating profit with D&A impact",
          "Enter: =E33-B34"
        ],
        intermediate: ["EBIT optimization"],
        advanced: ["Integrated operational efficiency"]
      },
      'F35': {
        beginner: [
          "Year 4 EBIT: Late-cycle operating optimization",
          "Enhanced operating earnings through efficiency gains",
          "Enter: =F33-B34"
        ],
        intermediate: ["EBIT margin expansion"],
        advanced: ["Sustainable operating performance"]
      },
      'G35': {
        beginner: [
          "Year 5 EBIT: Peak operating performance",
          "Terminal year with maximized operating earnings",
          "Enter: =G33-B34"
        ],
        intermediate: ["Mature EBIT profile"],
        advanced: ["Long-term operating excellence"]
      },
      
      // MISSING INTEREST/TAX HINTS (Years 2-5)  
      'D36': {
        beginner: [
          "Year 2 interest expense: Calculate on initial debt balance",
          "Apply 8% interest rate to $200M debt",
          "Enter: =200*0.08"
        ],
        intermediate: ["Debt service modeling with fixed rate structure"],
        advanced: ["Interest rate risk management and hedging strategies"]
      },
      'E36': {
        beginner: [
          "Year 3 interest expense: Fixed debt service continues",
          "Same calculation as prior years on base debt",
          "Enter: =200*0.08"
        ],
        intermediate: ["Fixed debt service throughout holding period"],
        advanced: ["Interest coverage optimization with cash flow growth"]
      },
      'F36': {
        beginner: [
          "Year 4 interest expense: Maintain debt service",
          "Continue fixed rate on initial debt balance",
          "Enter: =200*0.08"
        ],
        intermediate: ["Debt servicing capability with improving cash flows"],
        advanced: ["Optimal capital structure for energy companies"]
      },
      'G36': {
        beginner: [
          "Year 5 interest expense: Final year debt service",
          "Complete debt service calculation series",
          "Enter: =200*0.08"
        ],
        intermediate: ["Long-term debt service sustainability"],
        advanced: ["Interest rate hedging strategies and refinancing planning"]
      },
      'D37': {
        beginner: [
          "Year 2 EBT: EBIT minus Interest Expense",
          "Pre-tax earnings after all operating and financing costs",
          "Enter: =D35-D36"
        ],
        intermediate: ["Earnings before tax calculation"],
        advanced: ["Pre-tax profitability optimization"]
      },
      'E37': {
        beginner: [
          "Year 3 EBT: Mid-cycle pre-tax earnings",
          "Sustained pre-tax profitability with debt service",
          "Enter: =E35-E36"
        ],
        intermediate: ["EBT progression modeling"],
        advanced: ["Tax-efficient structuring"]
      },
      'F37': {
        beginner: [
          "Year 4 EBT: Late-cycle pre-tax optimization",
          "Enhanced pre-tax earnings with improving operations",
          "Enter: =F35-F36"
        ],
        intermediate: ["EBT margin enhancement"],
        advanced: ["Optimal tax planning"]
      },
      'G37': {
        beginner: [
          "Year 5 EBT: Peak pre-tax performance",
          "Terminal year with maximized pre-tax earnings",
          "Enter: =G35-G36"
        ],
        intermediate: ["Mature EBT profile"],
        advanced: ["Long-term tax optimization"]
      },
      'D38': {
        beginner: [
          "Year 2 taxes: Apply corporate tax rate to EBT",
          "Calculate tax liability: EBT × 28% corporate rate",
          "Enter: =D37*0.28"
        ],
        intermediate: ["Corporate tax rate application"],
        advanced: ["Tax optimization strategies"]
      },
      'E38': {
        beginner: [
          "Year 3 taxes: Mid-cycle tax obligation",
          "Continued 28% corporate tax rate application",
          "Enter: =E37*0.28"
        ],
        intermediate: ["Effective tax rate management"],
        advanced: ["Tax planning benefits"]
      },
      'F38': {
        beginner: [
          "Year 4 taxes: Late-cycle tax management",
          "Maintained tax efficiency with growing EBT",
          "Enter: =F37*0.28"
        ],
        intermediate: ["Tax efficiency optimization"],
        advanced: ["Sustainable tax strategies"]
      },
      'G38': {
        beginner: [
          "Year 5 taxes: Terminal year tax optimization",
          "Peak year tax liability with maximized EBT",
          "Enter: =G37*0.28"
        ],
        intermediate: ["Long-term tax planning"],
        advanced: ["Tax-efficient operations"]
      },
      'D39': {
        beginner: [
          "Year 2 net income: EBT minus Tax Expense",
          "Bottom-line profitability after all costs and taxes",
          "Enter: =D37-D38"
        ],
        intermediate: ["Bottom-line profitability"],
        advanced: ["Net income optimization"]
      },
      'E39': {
        beginner: [
          "Year 3 net income: Mid-cycle bottom-line performance",
          "Sustained net profitability with tax efficiency",
          "Enter: =E37-E38"
        ],
        intermediate: ["Net profit margin enhancement"],
        advanced: ["Sustainable net income growth"]
      },
      'F39': {
        beginner: [
          "Year 4 net income: Late-cycle profit optimization",
          "Enhanced net earnings through operational leverage",
          "Enter: =F37-F38"
        ],
        intermediate: ["Net income progression"],
        advanced: ["Long-term profitability"]
      },
      'G39': {
        beginner: [
          "Year 5 net income: Peak bottom-line achievement",
          "Terminal year with maximized net profitability",
          "Enter: =G37-G38"
        ],
        intermediate: ["Mature net income profile"],
        advanced: ["Sustainable net profit optimization"]
      },
      
      // MISSING CASH FLOW HINTS (Years 2-5)
      'D42': {
        beginner: [
          "Year 2 EBITDA for cash flow: Reference P&L EBITDA",
          "Starting point for free cash flow calculation",
          "Enter: =D33"
        ],
        intermediate: ["Cash flow EBITDA reference"],
        advanced: ["Operating cash generation"]
      },
      'E42': {
        beginner: [
          "Year 3 EBITDA for cash flow: Mid-cycle cash generation",
          "Sustained operating cash flow from EBITDA",
          "Enter: =E33"
        ],
        intermediate: ["Cash generation sustainability"],
        advanced: ["Operating cash optimization"]
      },
      'F42': {
        beginner: [
          "Year 4 EBITDA for cash flow: Late-cycle cash optimization",
          "Enhanced cash generation from improved EBITDA",
          "Enter: =F33"
        ],
        intermediate: ["Cash flow reliability"],
        advanced: ["Predictable cash generation"]
      },
      'G42': {
        beginner: [
          "Year 5 EBITDA for cash flow: Peak cash generation",
          "Terminal year with maximized operating cash flow",
          "Enter: =G33"
        ],
        intermediate: ["Mature cash flow profile"],
        advanced: ["Sustainable cash generation model"]
      },
      'D43': {
        beginner: [
          "Year 2 maintenance capex: Revenue-based maintenance spending",
          "Apply 5% of revenue for essential asset maintenance",
          "Enter: =D24*0.05"
        ],
        intermediate: ["Maintenance capex scaling"],
        advanced: ["Asset maintenance optimization"]
      },
      'E43': {
        beginner: [
          "Year 3 maintenance capex: Mid-cycle asset maintenance",
          "Continued 5% revenue allocation for maintenance",
          "Enter: =E24*0.05"
        ],
        intermediate: ["Ongoing maintenance requirements"],
        advanced: ["Preventive maintenance strategies"]
      },
      'F43': {
        beginner: [
          "Year 4 maintenance capex: Late-cycle asset stewardship",
          "Maintained 5% ratio with enhanced efficiency",
          "Enter: =F24*0.05"
        ],
        intermediate: ["Maintenance capex efficiency"],
        advanced: ["Asset lifecycle management"]
      },
      'G43': {
        beginner: [
          "Year 5 maintenance capex: Terminal year asset maintenance",
          "Final year with optimized 5% maintenance allocation",
          "Enter: =G24*0.05"
        ],
        intermediate: ["Long-term maintenance planning"],
        advanced: ["Sustainable asset management"]
      },
      'D44': {
        beginner: [
          "Year 2 growth capex: Revenue-based growth investment",
          "Apply 10% of revenue for expansion and new projects",
          "Enter: =D24*0.10"
        ],
        intermediate: ["Growth investment scaling"],
        advanced: ["Strategic growth capital allocation"]
      },
      'E44': {
        beginner: [
          "Year 3 growth capex: Mid-cycle expansion investment",
          "Continued 10% revenue allocation for growth initiatives",
          "Enter: =E24*0.10"
        ],
        intermediate: ["Sustained growth investment"],
        advanced: ["Portfolio expansion optimization"]
      },
      'F44': {
        beginner: [
          "Year 4 growth capex: Late-cycle strategic investment",
          "Optimized 10% growth spending with enhanced returns",
          "Enter: =F24*0.10"
        ],
        intermediate: ["Growth capex efficiency"],
        advanced: ["Return-focused growth investments"]
      },
      'G44': {
        beginner: [
          "Year 5 growth capex: Terminal year growth completion",
          "Final year with 10% growth investment optimization",
          "Enter: =G24*0.10"
        ],
        intermediate: ["Long-term growth strategy"],
        advanced: ["Future-ready investment programs"]
      },
      'D45': {
        beginner: [
          "Year 2 environmental remediation: Base + production scaling",
          "Apply same formula as Year 1: =10+D5*1",
          "Enter: =10+D5*1"
        ],
        intermediate: ["Environmental liability scales with production decline"],
        advanced: ["Regulatory compliance cost modeling with production correlation"]
      },
      'E45': {
        beginner: [
          "Year 3 environmental remediation: =10+E5*1",
          "Production-based environmental costs with base obligation",
          "Enter: =10+E5*1"
        ],
        intermediate: ["Multi-year environmental compliance planning"],
        advanced: ["ESG-driven remediation cost optimization"]
      },
      'F45': {
        beginner: [
          "Year 4 environmental remediation: =10+F5*1", 
          "Continue production-scaled environmental costs",
          "Enter: =10+F5*1"
        ],
        intermediate: ["Late-cycle environmental stewardship costs"],
        advanced: ["Net-zero transition environmental investments"]
      },
      'G45': {
        beginner: [
          "Year 5 environmental remediation: =10+G5*1",
          "Final year production-based environmental costs", 
          "Enter: =10+G5*1"
        ],
        intermediate: ["Long-term environmental liability management"],
        advanced: ["Sustainable operations and carbon neutrality investments"]
      },
      'D46': {
        beginner: [
          "Year 2 working capital change: Revenue growth impact on working capital",
          "Calculate change: (New Revenue - Prior Revenue) × 5% WC ratio",
          "Enter: =(D24-C24)*0.05"
        ],
        intermediate: ["Working capital scaling with revenue"],
        advanced: ["Cash conversion optimization"]
      },
      'E46': {
        beginner: [
          "Year 3 working capital change: Mid-cycle WC optimization",
          "Continued revenue growth impact on working capital needs",
          "Enter: =(E24-D24)*0.05"
        ],
        intermediate: ["Working capital efficiency"],
        advanced: ["Optimal working capital management"]
      },
      'F46': {
        beginner: [
          "Year 4 working capital change: Late-cycle WC efficiency",
          "Enhanced working capital management with revenue growth",
          "Enter: =(F24-E24)*0.05"
        ],
        intermediate: ["Working capital optimization"],
        advanced: ["Cash flow timing benefits"]
      },
      'G46': {
        beginner: [
          "Year 5 working capital change: Terminal year WC optimization",
          "Final year working capital impact from revenue growth",
          "Enter: =(G24-F24)*0.05"
        ],
        intermediate: ["Mature working capital profile"],
        advanced: ["Sustainable cash conversion"]
      },
      'D47': {
        beginner: [
          "Year 2 Free Cash Flow = EBITDA - Capex - Working Capital - Remediation",
          "FCF growth from improved operations and production scaling",
          "Enter: =D42-D43-D44-D45-D46"
        ],
        intermediate: ["FCF growth trajectory"],
        advanced: ["Cash flow optimization"]
      },
      'E47': {
        beginner: [
          "Year 3 Free Cash Flow = EBITDA - Capex - Working Capital - Remediation",
          "Mid-cycle FCF generation with portfolio optimization",
          "Enter: =E42-E43-E44-E45-E46"
        ],
        intermediate: ["Sustainable FCF generation"],
        advanced: ["Capital efficiency benefits"]
      },
      'F47': {
        beginner: [
          "Year 4 Free Cash Flow = EBITDA - Capex - Working Capital - Remediation",
          "Late-cycle FCF with optimized capital allocation",
          "Enter: =F42-F43-F44-F45-F46"
        ],
        intermediate: ["FCF margin expansion"],
        advanced: ["Cash generation optimization"]
      },
      'G47': {
        beginner: [
          "Year 5 Free Cash Flow = EBITDA - Capex - Working Capital - Remediation",
          "Terminal year FCF with mature operational efficiency",
          "Enter: =G42-G43-G44-G45-G46"
        ],
        intermediate: ["Mature FCF profile"],
        advanced: ["Sustainable cash flow model"]
      },
      
      // EXIT ANALYSIS HINTS
      'H50': {
        beginner: [
          "Exit EV = Year 5 EBITDA × Exit Multiple (8-12x for energy)",
          "Consider ESG impact on valuation multiples",
          "Enter: =G33*10"
        ],
        intermediate: ["ESG-adjusted valuation multiples"],
        advanced: ["Sum-of-the-parts valuation by division"]
      }
    };
    
    const cellHints = hints[cellRef];
    if (!cellHints) return null;
    
    const difficultyHints = cellHints[difficulty] || cellHints['beginner'];
    if (!difficultyHints || difficultyHints.length === 0) return null;
    
    return difficultyHints[Math.min(attemptNumber, difficultyHints.length - 1)] || null;
  };

  const getHintText = (cellRef: string, difficulty: string = 'beginner', attemptNumber: number = 0): string | null => {
    // Use different hints based on problem type
    if (problemId === '5') {
      return getEnergyConglomerateHintText(cellRef, difficulty, attemptNumber);
    } else if (problemId === '4') {
      return getHealthcareServicesHintText(cellRef, difficulty, attemptNumber);
    } else if (problemId === '3') {
      return getManufacturingGiantHintText(cellRef, difficulty, attemptNumber);
    } else if (problemId === '2') {
      return getRetailMaxHintText(cellRef, difficulty, attemptNumber);
    }
    
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
      'E5': {
        beginner: ["Year 3 EBITDA: =E4*0.25"],
        intermediate: ["25% margin on Year 3 revenue"],
        advanced: ["EBITDA formula"]
      },
      'F5': {
        beginner: ["Year 4 EBITDA: =F4*0.25"],
        intermediate: ["25% margin on Year 4 revenue"],
        advanced: ["EBITDA formula"]
      },
      'G5': {
        beginner: ["Year 5 EBITDA: =G4*0.25"],
        intermediate: ["25% margin on Year 5 revenue"],
        advanced: ["EBITDA formula"]
      },

      // EBIT Hints (EBITDA - D&A)
      'B7': {
        beginner: ["LTM EBIT = EBITDA - D&A: =B5-B6"],
        intermediate: ["Subtract D&A from EBITDA"],
        advanced: ["EBIT calculation"]
      },
      'C7': {
        beginner: ["Year 1 EBIT: =C5-B6"],
        intermediate: ["EBITDA minus depreciation"],
        advanced: ["EBIT formula"]
      },
      'D7': {
        beginner: ["Year 2 EBIT: =D5-B6"],
        intermediate: ["EBITDA minus depreciation"],
        advanced: ["EBIT formula"]
      },
      'E7': {
        beginner: ["Year 3 EBIT: =E5-B6"],
        intermediate: ["EBITDA minus depreciation"],
        advanced: ["EBIT formula"]
      },
      'F7': {
        beginner: ["Year 4 EBIT: =F5-B6"],
        intermediate: ["EBITDA minus depreciation"],
        advanced: ["EBIT formula"]
      },
      'G7': {
        beginner: ["Year 5 EBIT: =G5-B6"],
        intermediate: ["EBITDA minus depreciation"],
        advanced: ["EBIT formula"]
      },

      // Cash Flow EBITDA Reference Hints
      'C14': {
        beginner: ["Reference EBITDA for cash flow: =C5"],
        intermediate: ["Link to EBITDA calculation"],
        advanced: ["EBITDA reference"]
      },
      'D14': {
        beginner: ["Year 2 EBITDA reference: =D5"],
        intermediate: ["Link to EBITDA calculation"],
        advanced: ["EBITDA reference"]
      },
      'E14': {
        beginner: ["Year 3 EBITDA reference: =E5"],
        intermediate: ["Link to EBITDA calculation"],
        advanced: ["EBITDA reference"]
      },
      'F14': {
        beginner: ["Year 4 EBITDA reference: =F5"],
        intermediate: ["Link to EBITDA calculation"],
        advanced: ["EBITDA reference"]
      },
      'G14': {
        beginner: ["Year 5 EBITDA reference: =G5"],
        intermediate: ["Link to EBITDA calculation"],
        advanced: ["EBITDA reference"]
      },

      // Capex Hints
      'C15': {
        beginner: [
          "Capex is 3% of revenue each year",
          "Multiply Year 1 revenue (C4) by 0.03",
          "Enter: =C4*0.03"
        ],
        intermediate: ["Calculate capex as 3% of revenue"],
        advanced: ["Capex calculation"]
      },
      'D15': {
        beginner: ["Year 2 Capex: =D4*0.03"],
        intermediate: ["3% of Year 2 revenue"],
        advanced: ["Capex formula"]
      },
      'E15': {
        beginner: ["Year 3 Capex: =E4*0.03"],
        intermediate: ["3% of Year 3 revenue"],
        advanced: ["Capex formula"]
      },
      'F15': {
        beginner: ["Year 4 Capex: =F4*0.03"],
        intermediate: ["3% of Year 4 revenue"],
        advanced: ["Capex formula"]
      },
      'G15': {
        beginner: ["Year 5 Capex: =G4*0.03"],
        intermediate: ["3% of Year 5 revenue"],
        advanced: ["Capex formula"]
      },

      // Free Cash Flow Hints
      'C17': {
        beginner: [
          "Free Cash Flow = EBITDA - Capex (working capital is 0)",
          "Subtract capex (C15) from EBITDA (C14)",
          "Enter: =C14-C15"
        ],
        intermediate: ["FCF = EBITDA - Capex - Working Capital"],
        advanced: ["Free cash flow formula"]
      },
      'D17': {
        beginner: ["Year 2 FCF: =D14-D15"],
        intermediate: ["EBITDA minus Capex"],
        advanced: ["FCF formula"]
      },
      'E17': {
        beginner: ["Year 3 FCF: =E14-E15"],
        intermediate: ["EBITDA minus Capex"],
        advanced: ["FCF formula"]
      },
      'F17': {
        beginner: ["Year 4 FCF: =F14-F15"],
        intermediate: ["EBITDA minus Capex"],
        advanced: ["FCF formula"]
      },
      'G17': {
        beginner: ["Year 5 FCF: =G14-G15"],
        intermediate: ["EBITDA minus Capex"],
        advanced: ["FCF formula"]
      },

      // Debt Schedule Hints
      'C20': {
        beginner: ["Beginning debt Year 1: =B20"],
        intermediate: ["Reference initial debt"],
        advanced: ["Debt carryforward"]
      },
      'D20': {
        beginner: ["Beginning debt Year 2 = Previous ending debt: =C22"],
        intermediate: ["Link to previous year ending debt"],
        advanced: ["Debt schedule"]
      },
      'E20': {
        beginner: ["Beginning debt Year 3: =D22"],
        intermediate: ["Previous year ending debt"],
        advanced: ["Debt schedule"]
      },
      'F20': {
        beginner: ["Beginning debt Year 4: =E22"],
        intermediate: ["Previous year ending debt"],
        advanced: ["Debt schedule"]
      },
      'G20': {
        beginner: ["Beginning debt Year 5: =F22"],
        intermediate: ["Previous year ending debt"],
        advanced: ["Debt schedule"]
      },

      // Debt Paydown Hints
      'C21': {
        beginner: ["All FCF goes to debt paydown: =C17"],
        intermediate: ["Use free cash flow for debt reduction"],
        advanced: ["Debt paydown"]
      },
      'D21': {
        beginner: ["Year 2 debt paydown: =D17"],
        intermediate: ["FCF to debt reduction"],
        advanced: ["Debt paydown"]
      },
      'E21': {
        beginner: ["Year 3 debt paydown: =E17"],
        intermediate: ["FCF to debt reduction"],
        advanced: ["Debt paydown"]
      },
      'F21': {
        beginner: ["Year 4 debt paydown: =F17"],
        intermediate: ["FCF to debt reduction"],
        advanced: ["Debt paydown"]
      },
      'G21': {
        beginner: ["Year 5 debt paydown: =G17"],
        intermediate: ["FCF to debt reduction"],
        advanced: ["Debt paydown"]
      },

      // Ending Debt Hints
      'C22': {
        beginner: ["Ending debt = Beginning - Paydown: =C20-C21"],
        intermediate: ["Subtract paydown from beginning debt"],
        advanced: ["Ending debt calculation"]
      },
      'D22': {
        beginner: ["Year 2 ending debt: =D20-D21"],
        intermediate: ["Beginning minus paydown"],
        advanced: ["Ending debt"]
      },
      'E22': {
        beginner: ["Year 3 ending debt: =E20-E21"],
        intermediate: ["Beginning minus paydown"],
        advanced: ["Ending debt"]
      },
      'F22': {
        beginner: ["Year 4 ending debt: =F20-F21"],
        intermediate: ["Beginning minus paydown"],
        advanced: ["Ending debt"]
      },
      'G22': {
        beginner: ["Year 5 ending debt: =G20-G21"],
        intermediate: ["Beginning minus paydown"],
        advanced: ["Ending debt"]
      },

      // Exit Valuation Hint
      'G25': {
        beginner: [
          "Exit EV = Year 5 EBITDA × Exit Multiple",
          "Multiply Year 5 EBITDA (G5) by 14",
          "Enter: =G5*14"
        ],
        intermediate: ["Apply 14x exit multiple to Year 5 EBITDA"],
        advanced: ["Exit valuation"]
      },

      // Exit Equity Hints
      'G26': {
        beginner: [
          "Exit Equity = Exit EV - Final Debt",
          "Subtract final debt (G22) from exit EV (G25)",
          "Enter: =G25-G22"
        ],
        intermediate: ["Exit equity value after debt paydown"],
        advanced: ["Exit equity calculation"]
      },

      // MOIC Hints
      'G27': {
        beginner: [
          "MOIC = Exit Equity ÷ Initial Equity Investment",
          "Divide exit equity (G26) by initial equity ($62.5M)",
          "Enter: =G26/62.5"
        ],
        intermediate: ["Multiple on Invested Capital calculation"],
        advanced: ["MOIC formula"]
      },

      // IRR Hints
      'G28': {
        beginner: [
          "IRR = (Exit Multiple)^(1/Years) - 1",
          "Use MOIC (G27) raised to power of 1/5 minus 1",
          "Enter: =(G27^0.2)-1"
        ],
        intermediate: ["Internal Rate of Return approximation"],
        advanced: ["IRR calculation"]
      }
    };

    const cellHints = hints[cellRef];
    if (!cellHints) return null;

    const difficultyHints = cellHints[difficulty];
    if (!difficultyHints) return cellHints['beginner']?.[0] || null;

    return difficultyHints[Math.min(attemptNumber, difficultyHints.length - 1)] || null;
  };

  const getHealthcareServicesHintText = (cellRef: string, difficulty: string = 'beginner', attemptNumber: number = 0): string | null => {
    const hints: Record<string, Record<string, string[]>> = {
      // Government Revenue Hints
      'C5': {
        beginner: [
          "Government payers grow 2.5% annually due to Medicare updates",
          "Multiply LTM government revenue ($192M) by 1.025",
          "Enter: =B5*1.025"
        ],
        intermediate: ["Apply CMS reimbursement rate to government payers"],
        advanced: ["Government payer growth modeling"]
      },
      'D5': {
        beginner: ["Year 2 government: =C5*1.03"],
        intermediate: ["3% government payer growth"],
        advanced: ["Government revenue progression"]
      },
      
      // Commercial Revenue Hints
      'C6': {
        beginner: [
          "Commercial payers grow 6% due to contract negotiations",
          "Multiply LTM commercial revenue ($128M) by 1.06",
          "Enter: =B6*1.06"
        ],
        intermediate: ["Apply commercial rate increases"],
        advanced: ["Commercial payer modeling"]
      },
      'D6': {
        beginner: ["Year 2 commercial: =C6*1.055"],
        intermediate: ["5.5% commercial growth"],
        advanced: ["Commercial revenue progression"]
      },
      
      // Quality Adjustments Hints
      'C7': {
        beginner: [
          "Quality bonuses are 2% of total revenue",
          "Multiply adjusted revenue by 0.02",
          "Enter: =C8*0.02"
        ],
        intermediate: ["CMS quality performance bonus"],
        advanced: ["Quality-based payment adjustments"]
      },
      
      // Adjusted Revenue Hints
      'C8': {
        beginner: [
          "Adjusted Revenue = Government + Commercial + Quality + Acquisitions",
          "Sum: C5 + C6 + C7 + C32",
          "Enter: =C5+C6+C7+C32"
        ],
        intermediate: ["Total healthcare revenue sources"],
        advanced: ["Comprehensive revenue calculation"]
      },
      
      // EBITDA Hints
      'C9': {
        beginner: [
          "EBITDA margin is 22% of adjusted revenue",
          "Multiply adjusted revenue (C8) by 0.22",
          "Enter: =C8*0.22"
        ],
        intermediate: ["Healthcare services EBITDA margin"],
        advanced: ["Operating leverage calculation"]
      },
      
      // Working Capital Hints
      'C20': {
        beginner: [
          "Healthcare A/R is 15% of revenue (45-60 day cycles)",
          "Calculate change: (C8*0.15) - (B8*0.15)",
          "Enter: =(C8-B8)*0.15"
        ],
        intermediate: ["Healthcare receivables cycle"],
        advanced: ["Working capital management"]
      },
      
      // Acquisition Count Hints
      'C31': {
        beginner: [
          "Target 1-2 acquisitions per year",
          "Enter either 1 or 2",
          "Enter: =1"
        ],
        intermediate: ["Roll-up acquisition strategy"],
        advanced: ["Acquisition modeling"]
      },
      
      // Acquisition Revenue Hints
      'C32': {
        beginner: [
          "Each acquisition adds $15-20M revenue",
          "Multiply acquisition count by revenue per target",
          "Enter: =C31*18"
        ],
        intermediate: ["Acquisition revenue contribution"],
        advanced: ["Inorganic growth modeling"]
      },
      
      // Integration Costs Hints
      'C33': {
        beginner: [
          "Integration costs are 10% of acquisition revenue",
          "Multiply acquisition revenue by 0.1",
          "Enter: =C32*0.1"
        ],
        intermediate: ["M&A integration expenses"],
        advanced: ["Transaction cost modeling"]
      },
      
      // Synergies Hints
      'D34': {
        beginner: [
          "Synergies are 5% of prior year acquisitions",
          "Apply to Year 1 acquisitions starting Year 2",
          "Enter: =C32*0.05"
        ],
        intermediate: ["Administrative cost synergies"],
        advanced: ["Post-merger integration benefits"]
      },
      
      // Free Cash Flow Hints
      'C22': {
        beginner: [
          "FCF = EBITDA - Capex - WC Change - Compliance - Integration",
          "Subtract all cash outflows from EBITDA",
          "Enter: =C18-C19-C20-C21-C33"
        ],
        intermediate: ["Healthcare cash flow calculation"],
        advanced: ["Comprehensive FCF modeling"]
      },
      
      // Debt Paydown Hints
      'C26': {
        beginner: [
          "Use 50% of FCF for debt paydown",
          "Multiply FCF by 0.5",
          "Enter: =C22*0.5"
        ],
        intermediate: ["Debt amortization strategy"],
        advanced: ["Capital allocation modeling"]
      },
      
      // Exit Enterprise Value Hints
      'H38': {
        beginner: [
          "Exit EV = Year 5 EBITDA × 14x Exit Multiple",
          "Multiply G9 by G37",
          "Enter: =G9*G37"
        ],
        intermediate: ["Healthcare services exit valuation"],
        advanced: ["Terminal value calculation"]
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
      'G25', // Exit EV
      'G26', // Exit Equity  
      'G27', // MOIC
      'G28'  // IRR
    ];

    return hintableCells;
  };

  const markRetailMaxHints = () => {
    const hintableCells = [
      // Quarterly Revenue (Q1Y1 through Q4Y5)
      'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4', 'O4', 'P4', 'Q4', 'R4', 'S4', 'T4', 'U4', 'V4',
      // Quarterly EBITDA
      'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5', 'O5', 'P5', 'Q5', 'R5', 'S5', 'T5', 'U5', 'V5',
      // EBIT
      'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7',
      // Working Capital Components
      'C10', 'D10', 'E10', 'F10', // Inventory
      'C11', 'D11', 'E11', 'F11', // A/R
      'C12', 'D12', 'E12', 'F12', // A/P
      'C13', 'D13', 'E13', 'F13', // Net WC
      'C14', 'D14', 'E14', 'F14', // WC Change
      // Cash flow EBITDA
      'C17', 'D17', 'E17', 'F17', 'G17', 'H17', 'I17', 'J17',
      // Capex
      'C18', 'D18', 'E18', 'F18', 'G18', 'H18', 'I18', 'J18',
      // Working Capital
      'C19', 'D19', 'E19', 'F19', 'G19', 'H19', 'I19', 'J19',
      // FCF
      'C20', 'D20', 'E20', 'F20', 'G20', 'H20', 'I20', 'J20',
      // Debt schedule
      'C23', 'D23', 'E23', 'F23', // Beginning debt
      'C24', 'D24', 'E24', 'F24', // Debt paydown
      'C25', 'D25', 'E25', 'F25', // Ending debt
      // Returns
      'V28', // Exit EV
      'V29', // Exit Equity  
      'V30', // MOIC
      'V31'  // IRR
    ];

    return hintableCells;
  };

  const markManufacturingGiantHints = () => {
    const hintableCells = [
      // Cyclical Revenue (Annual)
      'C4', 'D4', 'E4', 'F4', 'G4', // Revenue
      // EBITDA
      'C5', 'D5', 'E5', 'F5', 'G5',
      // EBIT
      'B7', 'C7', 'D7', 'E7', 'F7', 'G7',
      // Complex Working Capital
      'C14', 'D14', 'E14', 'F14', 'G14', // Raw Materials
      'C15', 'D15', 'E15', 'F15', 'G15', // Finished Goods
      'C16', 'D16', 'E16', 'F16', 'G16', // A/R
      'C17', 'D17', 'E17', 'F17', 'G17', // A/P
      'C18', 'D18', 'E18', 'F18', 'G18', // Net WC
      'C19', 'D19', 'E19', 'F19', 'G19', // WC Change
      // Cash Flow
      'C22', 'D22', 'E22', 'F22', 'G22', // EBITDA
      'C23', 'D23', 'E23', 'F23', 'G23', // Maintenance Capex
      'C24', 'D24', 'E24', 'F24', 'G24', // Growth Capex
      'C25', 'D25', 'E25', 'F25', 'G25', // Total Capex
      'C26', 'D26', 'E26', 'F26', 'G26', // WC Change
      'C27', 'D27', 'E27', 'F27', 'G27', // FCF
      // Multi-Tranche Debt
      'C30', 'D30', 'E30', 'F30', 'G30', // TLA Beginning
      'C31', 'D31', 'E31', 'F31', 'G31', // TLB Beginning
      'C32', 'D32', 'E32', 'F32', 'G32', // Revolver
      'C33', 'D33', 'E33', 'F33', 'G33', // Total Debt
      'C34', 'D34', 'E34', 'F34', 'G34', // FCF to Debt
      'C35', 'D35', 'E35', 'F35', 'G35', // Ending Debt
      // Covenant Testing
      'C38', 'D38', 'E38', 'F38', 'G38', // Leverage Ratio
      'C39', 'D39', 'E39', 'F39', 'G39'  // Coverage Ratio
    ];

    return hintableCells;
  };

  const handleFillHandleMouseDown = (e: React.MouseEvent, col: number, row: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ col, row });
    setDragEnd({ col, row });
  };

  const handleCellMouseEnter = (col: number, row: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ col, row });
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      // Save state before drag operation for undo
      // Note: saveToHistory will be defined later, commenting out for now
      // saveToHistory(cells);

      // Apply fill operation
      const sourceCellRef = getCellRef(dragStart.col, dragStart.row);
      const sourceCell = cells[sourceCellRef];

      if (sourceCell && sourceCell.formula) {
        const newCells = { ...cells };

        // Determine fill direction
        const isHorizontal = dragEnd.row === dragStart.row;
        const isVertical = dragEnd.col === dragStart.col;

        if (isHorizontal) {
          // Fill right or left
          const startCol = Math.min(dragStart.col, dragEnd.col);
          const endCol = Math.max(dragStart.col, dragEnd.col);

          for (let c = startCol; c <= endCol; c++) {
            if (c !== dragStart.col) {
              const targetCellRef = getCellRef(c, dragStart.row);
              if (!newCells[targetCellRef]?.isLocked) {
                const adjustedFormula = fillFormulaRight(
                  sourceCell.formula,
                  dragStart.col,
                  dragStart.row,
                  c
                );

                newCells[targetCellRef] = {
                  ...newCells[targetCellRef],
                  formula: adjustedFormula,
                  value: adjustedFormula.startsWith('=')
                    ? evaluateFormulaWithRefs(adjustedFormula, newCells)
                    : adjustedFormula
                };

                // Validate the filled cell
                if (adjustedFormula.startsWith('=')) {
                  const isValid = validateFormula(targetCellRef, adjustedFormula);
                  if (isValid) {
                    setCompletedCells(prev => new Set(prev).add(targetCellRef));
                    setScore(prev => prev + 50); // Lower score than manual entry
                  }
                }
              }
            }
          }
        } else if (isVertical) {
          // Fill down or up
          const startRow = Math.min(dragStart.row, dragEnd.row);
          const endRow = Math.max(dragStart.row, dragEnd.row);

          for (let r = startRow; r <= endRow; r++) {
            if (r !== dragStart.row) {
              const targetCellRef = getCellRef(dragStart.col, r);
              if (!newCells[targetCellRef]?.isLocked) {
                const adjustedFormula = fillFormulaDown(
                  sourceCell.formula,
                  dragStart.col,
                  dragStart.row,
                  r
                );

                newCells[targetCellRef] = {
                  ...newCells[targetCellRef],
                  formula: adjustedFormula,
                  value: adjustedFormula.startsWith('=')
                    ? evaluateFormulaWithRefs(adjustedFormula, newCells)
                    : adjustedFormula
                };

                // Validate the filled cell
                if (adjustedFormula.startsWith('=')) {
                  const isValid = validateFormula(targetCellRef, adjustedFormula);
                  if (isValid) {
                    setCompletedCells(prev => new Set(prev).add(targetCellRef));
                    setScore(prev => prev + 50); // Lower score than manual entry
                  }
                }
              }
            }
          }
        }

        setCells(newCells);
        setScore(prev => prev + 75); // Bonus for using drag fill
      }
    }

    // Reset drag state
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, cells, validateFormula, setCompletedCells, setScore]);

  // Add global mouse up listener when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  const handleCellClick = (col: number, row: number, isFromCellInput?: boolean) => {
    const clickedCellRef = `${String.fromCharCode(65 + col)}${row + 1}`;

    // Check if we're editing a formula (either in formula bar or in a cell)
    const currentlyEditingFormula = isEditingFormula ||
      (editingCell && cells[`${String.fromCharCode(65 + editingCell.col)}${editingCell.row + 1}`]?.formula?.startsWith('='));

    // Helper function to check if we should replace the last cell reference
    const shouldReplaceLastRef = (beforeCursor: string): { replace: boolean, start: number, end: number } => {
      // Check if cursor is right after a cell reference (e.g., "=B2|" or "=B2+C3|")
      const cellRefPattern = /([A-Za-z]+\d+)$/;
      const match = beforeCursor.match(cellRefPattern);

      if (match) {
        // Check if there's an operator before this cell reference
        const beforeRef = beforeCursor.slice(0, -match[1].length);
        const lastCharBeforeRef = beforeRef[beforeRef.length - 1];

        // If the last character before the ref is '=' or an operator, we can replace
        if (lastCharBeforeRef && ['=', '(', '+', '-', '*', '/', ',', ' ', '^', '%'].includes(lastCharBeforeRef)) {
          return {
            replace: true,
            start: beforeRef.length,
            end: beforeCursor.length
          };
        }
      }

      return { replace: false, start: 0, end: 0 };
    };

    // If we're editing a formula anywhere, insert or replace the cell reference
    if (currentlyEditingFormula && !isFromCellInput) {
      // Don't insert reference if clicking the same cell that's being edited
      if (editingCell && editingCell.col === col && editingCell.row === row) {
        return;
      }

      // Determine which value to update (formula bar or cell input)
      if (formulaBarRef.current && document.activeElement === formulaBarRef.current) {
        // Editing in formula bar
        const beforeCursor = formulaBarValue.slice(0, formulaBarCursorPos);
        const afterCursor = formulaBarValue.slice(formulaBarCursorPos);

        // Check if we should replace the last cell reference
        const replaceInfo = shouldReplaceLastRef(beforeCursor);

        let newFormula: string;
        let newCursorPos: number;

        if (replaceInfo.replace) {
          // Replace the last cell reference
          const beforeRef = formulaBarValue.slice(0, replaceInfo.start);
          const afterRef = formulaBarValue.slice(replaceInfo.end);
          newFormula = beforeRef + clickedCellRef + afterRef;
          newCursorPos = beforeRef.length + clickedCellRef.length;
        } else {
          // Check if we can insert a new reference
          const lastChar = beforeCursor[beforeCursor.length - 1];
          const shouldInsertRef = lastChar && ['=', '(', '+', '-', '*', '/', ',', ' ', '^', '%'].includes(lastChar);

          if (!shouldInsertRef && lastChar !== undefined) {
            // Can't insert or replace - ignore the click
            return;
          }

          // Insert new reference
          newFormula = beforeCursor + clickedCellRef + afterCursor;
          newCursorPos = beforeCursor.length + clickedCellRef.length;
        }

        setFormulaBarValue(newFormula);
        setFormulaBarCursorPos(newCursorPos);

        // Keep focus on formula bar
        setTimeout(() => {
          if (formulaBarRef.current) {
            formulaBarRef.current.focus();
            formulaBarRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      } else if (editingCell) {
        // Editing directly in a cell
        const editingCellRef = `${String.fromCharCode(65 + editingCell.col)}${editingCell.row + 1}`;
        const currentFormula = cells[editingCellRef]?.formula || '=';

        // Get the input element
        const cellInput = document.querySelector(`[data-cell="${editingCellRef}"] input`) as HTMLInputElement;
        if (cellInput) {
          const cursorPos = cellInput.selectionStart || currentFormula.length;
          const beforeCursor = currentFormula.slice(0, cursorPos);
          const afterCursor = currentFormula.slice(cursorPos);

          // Check if we should replace the last cell reference
          const replaceInfo = shouldReplaceLastRef(beforeCursor);

          let newFormula: string;
          let newCursorPos: number;

          if (replaceInfo.replace) {
            // Replace the last cell reference
            const beforeRef = currentFormula.slice(0, replaceInfo.start);
            const afterRef = currentFormula.slice(replaceInfo.end) + afterCursor;
            newFormula = beforeRef + clickedCellRef + afterRef;
            newCursorPos = beforeRef.length + clickedCellRef.length;
          } else {
            // Check if we can insert a new reference
            const lastChar = beforeCursor[beforeCursor.length - 1];
            const shouldInsertRef = lastChar && ['=', '(', '+', '-', '*', '/', ',', ' ', '^', '%'].includes(lastChar);

            if (!shouldInsertRef && lastChar !== undefined) {
              // Can't insert or replace - ignore the click
              return;
            }

            // Insert new reference
            newFormula = beforeCursor + clickedCellRef + afterCursor;
            newCursorPos = beforeCursor.length + clickedCellRef.length;
          }

          // Update the cell
          handleCellChange(editingCell.col, editingCell.row, newFormula);

          // Keep focus on the editing cell and update cursor position
          setTimeout(() => {
            cellInput.focus();
            cellInput.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }
      }
    } else if (!isFromCellInput) {
      // Normal cell selection (not editing a formula)
      setSelectedCell({ col, row });
      const cell = cells[clickedCellRef];

      console.log('Cell clicked:', {
        clickedCellRef,
        cell,
        cellsObject: cells,
        specificCell: cells[clickedCellRef],
        formula: cell?.formula,
        value: cell?.value,
        hasFormula: cell?.formula?.startsWith('='),
        formulaType: typeof cell?.formula,
        formulaLength: cell?.formula?.length
      });

      // Always show formula in formula bar if it exists, otherwise show value
      // Check if cell has a formula that starts with '='
      if (cell?.formula && typeof cell.formula === 'string' && cell.formula.startsWith('=')) {
        console.log('Setting formula bar to formula:', cell.formula);
        setFormulaBarValue(cell.formula);
      } else {
        console.log('Setting formula bar to value:', cell?.value || '', 'because formula is:', cell?.formula);
        setFormulaBarValue(cell?.value || '');
      }
      setIsEditingFormula(false);
      setEditingCell(null);
    }
  };

  const focusCellInput = (col: number, row: number) => {
    // Use setTimeout to ensure the DOM has updated
    setTimeout(() => {
      const newCellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
      const cellInput = document.querySelector(`[data-cell="${newCellRef}"] input`) as HTMLInputElement;
      if (cellInput) {
        cellInput.focus();
        cellInput.select();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, col: number, row: number) => {
    const maxCols = problemId === '5' ? 10 : problemId === '2' ? 22 : 7; // J for Energy, V for RetailMax, G for others
    const maxRows = problemId === '5' ? 50 : problemId === '4' ? 38 : problemId === '3' ? 40 : problemId === '2' ? 35 : 25; // 50 for Energy, 38 for Healthcare, 40 for Manufacturing, 35 for RetailMax, 25 for TechCorp

    // Handle Delete key for clearing cells
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();

      // If there's a selected range, delete all cells in the range
      if (selectedRange) {
        const newCells = { ...cells };
        const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
        const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);
        const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
        const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);

        let hasChanges = false;
        for (let c = startCol; c <= endCol; c++) {
          for (let r = startRow; r <= endRow; r++) {
            const cellRef = getCellRef(c, r);
            if (!newCells[cellRef]?.isLocked) {
              newCells[cellRef] = {
                ...newCells[cellRef],
                value: '',
                formula: ''
              };
              hasChanges = true;

              // Remove from completed cells if it was there
              setCompletedCells(prev => {
                const newSet = new Set(prev);
                newSet.delete(cellRef);
                return newSet;
              });
            }
          }
        }

        if (hasChanges) {
          setCells(newCells);
          setSelectedRange(null);
        }
      } else {
        // Delete single cell
        const cellRef = getCellRef(col, row);
        const cell = cells[cellRef];
        if (cell && !cell.isLocked) {
          const newCells = { ...cells };
          newCells[cellRef] = {
            ...cell,
            value: '',
            formula: ''
          };
          setCells(newCells);

          // Remove from completed cells
          setCompletedCells(prev => {
            const newSet = new Set(prev);
            newSet.delete(cellRef);
            return newSet;
          });
        }
      }
      return;
    }

    // Handle Ctrl+Z for undo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Handle Ctrl+Y for redo
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Handle Ctrl+C for copy
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      const cellRef = getCellRef(col, row);
      const cell = cells[cellRef];
      if (cell) {
        setCopiedCell({
          col,
          row,
          value: cell.value || '',
          formula: cell.formula || ''
        });
      }
      return;
    }

    // Handle Ctrl+V for paste
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      if (copiedCell) {
        const targetCellRef = getCellRef(col, row);
        if (!cells[targetCellRef]?.isLocked) {
          if (copiedCell.formula && copiedCell.formula.startsWith('=')) {
            // Adjust formula references based on relative position
            const colDiff = col - copiedCell.col;
            const rowDiff = row - copiedCell.row;

            let adjustedFormula = copiedCell.formula;
            if (colDiff !== 0) {
              adjustedFormula = fillFormulaRight(adjustedFormula, copiedCell.col, copiedCell.row, col);
            }
            if (rowDiff !== 0) {
              adjustedFormula = fillFormulaDown(adjustedFormula, col, copiedCell.row, row);
            }

            handleCellChange(col, row, adjustedFormula);
            handleCellSubmit(col, row, adjustedFormula);
          } else {
            // Just copy the value
            handleCellChange(col, row, copiedCell.value);
            handleCellSubmit(col, row, copiedCell.value);
          }
        }
      }
      return;
    }

    // Handle Ctrl+R for fill right
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();

      if (selectedRange) {
        // Fill across the selected range
        const sourceCellRef = getCellRef(selectedRange.start.col, selectedRange.start.row);
        const sourceCell = cells[sourceCellRef];

        if (sourceCell && sourceCell.formula) {
          const newCells = { ...cells };

          for (let c = selectedRange.start.col + 1; c <= selectedRange.end.col; c++) {
            const targetCellRef = getCellRef(c, selectedRange.start.row);
            if (!newCells[targetCellRef]?.isLocked) {
              const adjustedFormula = fillFormulaRight(
                sourceCell.formula,
                selectedRange.start.col,
                selectedRange.start.row,
                c
              );

              newCells[targetCellRef] = {
                ...newCells[targetCellRef],
                formula: adjustedFormula,
                value: adjustedFormula.startsWith('=')
                  ? evaluateFormulaWithRefs(adjustedFormula, newCells)
                  : adjustedFormula
              };
            }
          }

          setCells(newCells);
          setScore(prev => prev + 50); // Bonus for using fill
        }
      } else if (selectedCell) {
        // If no range selected, fill from current cell to the right
        const sourceCellRef = getCellRef(col, row);
        const sourceCell = cells[sourceCellRef];

        if (sourceCell && sourceCell.formula && col < maxCols - 1) {
          const newCells = { ...cells };
          const targetCellRef = getCellRef(col + 1, row);

          if (!newCells[targetCellRef]?.isLocked) {
            const adjustedFormula = fillFormulaRight(sourceCell.formula, col, row, col + 1);

            newCells[targetCellRef] = {
              ...newCells[targetCellRef],
              formula: adjustedFormula,
              value: adjustedFormula.startsWith('=')
                ? evaluateFormulaWithRefs(adjustedFormula, newCells)
                : adjustedFormula
            };

            setCells(newCells);
            setScore(prev => prev + 25);
          }
        }
      }
      return;
    }

    // Handle Ctrl+D for fill down (bonus feature)
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();

      if (selectedRange) {
        const sourceCellRef = getCellRef(selectedRange.start.col, selectedRange.start.row);
        const sourceCell = cells[sourceCellRef];

        if (sourceCell && sourceCell.formula) {
          const newCells = { ...cells };

          for (let r = selectedRange.start.row + 1; r <= selectedRange.end.row; r++) {
            const targetCellRef = getCellRef(selectedRange.start.col, r);
            if (!newCells[targetCellRef]?.isLocked) {
              const adjustedFormula = fillFormulaDown(
                sourceCell.formula,
                selectedRange.start.col,
                selectedRange.start.row,
                r
              );

              newCells[targetCellRef] = {
                ...newCells[targetCellRef],
                formula: adjustedFormula,
                value: adjustedFormula.startsWith('=')
                  ? evaluateFormulaWithRefs(adjustedFormula, newCells)
                  : adjustedFormula
              };
            }
          }

          setCells(newCells);
          setScore(prev => prev + 50);
        }
      }
      return;
    }

    // Handle Shift+Arrow for range selection
    if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();

      // If we have an existing range, expand from its end position
      // Otherwise start from the current cell
      const currentEndCol = selectedRange ? selectedRange.end.col : col;
      const currentEndRow = selectedRange ? selectedRange.end.row : row;

      let newCol = currentEndCol;
      let newRow = currentEndRow;

      switch (e.key) {
        case 'ArrowUp':
          if (currentEndRow > 0) newRow = currentEndRow - 1;
          break;
        case 'ArrowDown':
          if (currentEndRow < maxRows - 1) newRow = currentEndRow + 1;
          break;
        case 'ArrowLeft':
          if (currentEndCol > 0) newCol = currentEndCol - 1;
          break;
        case 'ArrowRight':
          if (currentEndCol < maxCols - 1) newCol = currentEndCol + 1;
          break;
      }

      // Update or create the selection range
      if (!selectedRange) {
        setSelectedRange({
          start: { col, row },
          end: { col: newCol, row: newRow }
        });
      } else {
        setSelectedRange({
          ...selectedRange,
          end: { col: newCol, row: newRow }
        });
      }

      // Move the selected cell to the new end position
      setSelectedCell({ col: newCol, row: newRow });

      return;
    }

    // Clear range selection on normal navigation
    if (!e.shiftKey) {
      setSelectedRange(null);
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        // Move down one cell, or commit edit if editing
        if (row < maxRows - 1) {
          const newRow = row + 1;
          setSelectedCell({ col, row: newRow });
          const newCellRef = `${String.fromCharCode(65 + col)}${newRow + 1}`;
          const newCell = cells[newCellRef];
          if (newCell?.formula && newCell.formula.startsWith('=')) {
            setFormulaBarValue(newCell.formula);
          } else {
            setFormulaBarValue(newCell?.value || '');
          }
          focusCellInput(col, newRow);
        }
        break;
        
      case 'Tab':
        e.preventDefault();

        if (e.shiftKey) {
          // Shift+Tab: Move left or extend selection left
          if (col > 0) {
            const newCol = col - 1;

            if (e.ctrlKey || e.metaKey) {
              // Ctrl+Shift+Tab: Extend selection left
              if (!selectedRange) {
                setSelectedRange({
                  start: { col, row },
                  end: { col: newCol, row }
                });
              } else {
                setSelectedRange({
                  ...selectedRange,
                  end: { col: newCol, row }
                });
              }
            } else {
              // Just Shift+Tab: Move left
              setSelectedCell({ col: newCol, row });
              const newCellRef = `${String.fromCharCode(65 + newCol)}${row + 1}`;
              const newCell = cells[newCellRef];
              if (newCell?.formula && newCell.formula.startsWith('=')) {
            setFormulaBarValue(newCell.formula);
          } else {
            setFormulaBarValue(newCell?.value || '');
          }
              focusCellInput(newCol, row);
              setSelectedRange(null); // Clear any selection
            }
          } else if (row > 0) {
            // Wrap to previous row
            const newRow = row - 1;
            setSelectedCell({ col: maxCols - 1, row: newRow });
            const newCellRef = `${String.fromCharCode(65 + maxCols - 1)}${newRow + 1}`;
            const newCell = cells[newCellRef];
            if (newCell?.formula && newCell.formula.startsWith('=')) {
            setFormulaBarValue(newCell.formula);
          } else {
            setFormulaBarValue(newCell?.value || '');
          }
            focusCellInput(maxCols - 1, newRow);
            setSelectedRange(null);
          }
        } else {
          // Tab: Move right or extend selection right
          if (col < maxCols - 1) {
            const newCol = col + 1;

            if (e.ctrlKey || e.metaKey) {
              // Ctrl+Tab: Extend selection right
              if (!selectedRange) {
                setSelectedRange({
                  start: { col, row },
                  end: { col: newCol, row }
                });
              } else {
                setSelectedRange({
                  ...selectedRange,
                  end: { col: newCol, row }
                });
              }
            } else {
              // Just Tab: Move right
              setSelectedCell({ col: newCol, row });
              const newCellRef = `${String.fromCharCode(65 + newCol)}${row + 1}`;
              const newCell = cells[newCellRef];
              if (newCell?.formula && newCell.formula.startsWith('=')) {
            setFormulaBarValue(newCell.formula);
          } else {
            setFormulaBarValue(newCell?.value || '');
          }
              focusCellInput(newCol, row);
              setSelectedRange(null); // Clear any selection
            }
          } else if (row < maxRows - 1) {
            // Wrap to next row
            const newRow = row + 1;
            setSelectedCell({ col: 0, row: newRow });
            const newCellRef = `A${newRow + 1}`;
            const newCell = cells[newCellRef];
            if (newCell?.formula && newCell.formula.startsWith('=')) {
            setFormulaBarValue(newCell.formula);
          } else {
            setFormulaBarValue(newCell?.value || '');
          }
            focusCellInput(0, newRow);
            setSelectedRange(null);
          }
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) {
          // Check if we're currently editing a formula
          const currentCellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
          const currentCell = cells[currentCellRef];

          if (editingCell && editingCell.col === col && editingCell.row === row &&
              currentCell?.formula?.startsWith('=')) {
            // We're editing a formula, append reference to the cell above
            const newRow = row - 1;
            const targetCellRef = `${String.fromCharCode(65 + col)}${newRow + 1}`;

            // Get the current formula and check last character
            const currentFormula = currentCell.formula || '=';
            const lastChar = currentFormula[currentFormula.length - 1];

            // If last char is a cell reference letter/number, add operator first
            let newFormula = currentFormula;
            if (lastChar && lastChar.match(/[A-Z0-9]/i)) {
              newFormula += '+';  // Default to addition
            }
            newFormula += targetCellRef;

            // Update the current cell with the reference
            handleCellChange(col, row, newFormula);

            // Highlight the referenced cell
            setReferencedCells(prev => {
              const newSet = new Set(prev);
              newSet.add(targetCellRef);
              return newSet;
            });
          } else {
            // Normal navigation
            const newRow = row - 1;
            setSelectedCell({ col, row: newRow });
            const newCellRef = `${String.fromCharCode(65 + col)}${newRow + 1}`;
            const newCell = cells[newCellRef];
            if (newCell?.formula && newCell.formula.startsWith('=')) {
              setFormulaBarValue(newCell.formula);
            } else {
              setFormulaBarValue(newCell?.value || '');
            }
            focusCellInput(col, newRow);
          }
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (row < maxRows - 1) {
          // Check if we're currently editing a formula
          const currentCellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
          const currentCell = cells[currentCellRef];

          if (editingCell && editingCell.col === col && editingCell.row === row &&
              currentCell?.formula?.startsWith('=')) {
            // We're editing a formula, append reference to the cell below
            const newRow = row + 1;
            const targetCellRef = `${String.fromCharCode(65 + col)}${newRow + 1}`;

            // Get the current formula and check last character
            const currentFormula = currentCell.formula || '=';
            const lastChar = currentFormula[currentFormula.length - 1];

            // If last char is a cell reference letter/number, add operator first
            let newFormula = currentFormula;
            if (lastChar && lastChar.match(/[A-Z0-9]/i)) {
              newFormula += '+';  // Default to addition
            }
            newFormula += targetCellRef;

            // Update the current cell with the reference
            handleCellChange(col, row, newFormula);

            // Highlight the referenced cell
            setReferencedCells(prev => {
              const newSet = new Set(prev);
              newSet.add(targetCellRef);
              return newSet;
            });
          } else {
            // Normal navigation
            const newRow = row + 1;
            setSelectedCell({ col, row: newRow });
            const newCellRef = `${String.fromCharCode(65 + col)}${newRow + 1}`;
            const newCell = cells[newCellRef];
            if (newCell?.formula && newCell.formula.startsWith('=')) {
              setFormulaBarValue(newCell.formula);
            } else {
              setFormulaBarValue(newCell?.value || '');
            }
            focusCellInput(col, newRow);
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          // Check if we're currently editing a formula
          const currentCellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
          const currentCell = cells[currentCellRef];

          if (editingCell && editingCell.col === col && editingCell.row === row &&
              currentCell?.formula?.startsWith('=')) {
            // We're editing a formula, append reference to the cell to the left
            const newCol = col - 1;
            const targetCellRef = `${String.fromCharCode(65 + newCol)}${row + 1}`;

            // Get the current formula and check last character
            const currentFormula = currentCell.formula || '=';
            const lastChar = currentFormula[currentFormula.length - 1];

            // If last char is a cell reference letter/number, add operator first
            let newFormula = currentFormula;
            if (lastChar && lastChar.match(/[A-Z0-9]/i)) {
              newFormula += '+';  // Default to addition
            }
            newFormula += targetCellRef;

            // Update the current cell with the reference
            handleCellChange(col, row, newFormula);

            // Highlight the referenced cell
            setReferencedCells(prev => {
              const newSet = new Set(prev);
              newSet.add(targetCellRef);
              return newSet;
            });
          } else {
            // Normal navigation
            const newCol = col - 1;
            setSelectedCell({ col: newCol, row });
            const newCellRef = `${String.fromCharCode(65 + newCol)}${row + 1}`;
            const newCell = cells[newCellRef];
            if (newCell?.formula && newCell.formula.startsWith('=')) {
              setFormulaBarValue(newCell.formula);
            } else {
              setFormulaBarValue(newCell?.value || '');
            }
            focusCellInput(newCol, row);
          }
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (col < maxCols - 1) {
          // Check if we're currently editing a formula
          const currentCellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
          const currentCell = cells[currentCellRef];

          if (editingCell && editingCell.col === col && editingCell.row === row &&
              currentCell?.formula?.startsWith('=')) {
            // We're editing a formula, append reference to the cell to the right
            const newCol = col + 1;
            const targetCellRef = `${String.fromCharCode(65 + newCol)}${row + 1}`;

            // Get the current formula and check last character
            const currentFormula = currentCell.formula || '=';
            const lastChar = currentFormula[currentFormula.length - 1];

            // If last char is a cell reference letter/number, add operator first
            let newFormula = currentFormula;
            if (lastChar && lastChar.match(/[A-Z0-9]/i)) {
              newFormula += '+';  // Default to addition
            }
            newFormula += targetCellRef;

            // Update the current cell with the reference
            handleCellChange(col, row, newFormula);

            // Highlight the referenced cell
            setReferencedCells(prev => {
              const newSet = new Set(prev);
              newSet.add(targetCellRef);
              return newSet;
            });
          } else {
            // Normal navigation
            const newCol = col + 1;
            setSelectedCell({ col: newCol, row });
            const newCellRef = `${String.fromCharCode(65 + newCol)}${row + 1}`;
            const newCell = cells[newCellRef];
            if (newCell?.formula && newCell.formula.startsWith('=')) {
              setFormulaBarValue(newCell.formula);
            } else {
              setFormulaBarValue(newCell?.value || '');
            }
            focusCellInput(newCol, row);
          }
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        // Cancel editing, restore original value
        const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
        const cell = cells[cellRef];
        if (cell?.formula && cell.formula.startsWith('=')) {
          setFormulaBarValue(cell.formula);
        } else {
          setFormulaBarValue(cell?.value || '');
        }
        break;
        
      case 'F2':
        e.preventDefault();
        // Focus on formula bar for editing
        const formulaInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (formulaInput) {
          formulaInput.focus();
          formulaInput.select();
        }
        break;
    }
  };

  const handleCellChange = (col: number, row: number, value: string) => {
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const newCells = { ...cells };

    if (newCells[cellRef] && !newCells[cellRef].isLocked) {
      // Store the formula but don't evaluate yet
      newCells[cellRef] = {
        ...newCells[cellRef],
        formula: value,
        value: value.startsWith('=') ? '' : value // Clear display value for formulas until evaluated
      };
      setCells(newCells);

      // Update formula bar
      setFormulaBarValue(value);

      // Extract referenced cells from formula for highlighting
      if (value.startsWith('=')) {
        const refs = new Set<string>();
        const cellRefPattern = /\b([A-Za-z]+)(\d+)\b/g;
        let match;
        while ((match = cellRefPattern.exec(value)) !== null) {
          refs.add(`${match[1].toUpperCase()}${match[2]}`);
        }
        setReferencedCells(refs);
      } else {
        setReferencedCells(new Set());
      }
    }
  };

  // Save current state to history before making changes
  const saveToHistory = (currentCells: Record<string, Cell>) => {
    // Remove any states after current index if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);

    // Add current state
    newHistory.push(JSON.parse(JSON.stringify(currentCells)));

    // Keep only last 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setCells(JSON.parse(JSON.stringify(previousState)));
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCells(JSON.parse(JSON.stringify(nextState)));
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const handleCellSubmit = (col: number, row: number, value: string) => {
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;

    // Clear referenced cells highlighting when submitting
    setReferencedCells(new Set());

    // Save current state to history before making changes
    saveToHistory(cells);

    const newCells = { ...cells };

    if (!value || value.trim() === '') {
      // Clear cell
      if (newCells[cellRef] && !newCells[cellRef].isLocked) {
        newCells[cellRef] = {
          ...newCells[cellRef],
          value: '',
          formula: ''
        };
        setCells(newCells);
        setCompletedCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(cellRef);
          return newSet;
        });
      }
    } else if (value.startsWith('=')) {
      // Evaluate formula with cell references
      try {
        const evaluatedValue = evaluateFormulaWithRefs(value, newCells, cellRef);

        console.log('Storing formula:', {
          cellRef,
          formula: value,
          evaluatedValue,
          valueType: typeof value,
          valueStartsWith: value?.startsWith?.('=')
        });

        if (newCells[cellRef] && !newCells[cellRef].isLocked) {
          // Make sure we're storing the formula correctly
          const updatedCell = {
            ...newCells[cellRef],
            formula: value, // This should be the formula string like "=B4*1.1"
            value: evaluatedValue
          };

          // Only update state once using functional update
          setCells(prevCells => {
            const newState = {
              ...prevCells,
              [cellRef]: updatedCell
            };
            console.log('Setting new state for', cellRef, ':', newState[cellRef]);
            return newState;
          });

          console.log('Cell after update:', updatedCell, 'Formula stored:', updatedCell.formula);

          // Check if formula matches expected answer (if in practice mode)
          const isValid = validateFormula(cellRef, value);

          if (isValid) {
            setCompletedCells(prev => new Set(prev).add(cellRef));
            setScore(prev => prev + 100);
            setShowHint(null);
          } else {
            // Formula evaluates but might not match expected answer
            console.log('Formula evaluates but may not match expected:', cellRef, value);
            const errorHintText = getErrorHint(cellRef, value);
            console.log('Error hint:', errorHintText);

            // Get the position of the cell for proper hint positioning
            const cellElement = document.querySelector(`[data-cell="${cellRef}"]`) as HTMLElement;
            let hintX = 400; // fallback
            let hintY = 300; // fallback

            if (cellElement) {
              const rect = cellElement.getBoundingClientRect();
              hintX = rect.left + 10; // Slight offset from left edge
              hintY = rect.bottom + 10; // Below the cell
            }

            setShowHint({
              cellRef,
              text: errorHintText,
              x: hintX,
              y: hintY,
              isError: true
            });
            // Auto-hide error hint after 8 seconds (longer than regular hints)
            setTimeout(() => setShowHint(null), 8000);
          }
        }
      } catch (error) {
        // Error evaluating formula
        console.error('Error evaluating formula:', error);
        const errorMsg = error instanceof Error ? error.message : 'Invalid formula';

        setShowHint({
          cellRef,
          text: `Formula error: ${errorMsg}`,
          x: 400,
          y: 300,
          isError: true
        });
        setTimeout(() => setShowHint(null), 5000);
      }
    } else {
      // Regular value (not a formula)
      if (newCells[cellRef] && !newCells[cellRef].isLocked) {
        newCells[cellRef] = {
          ...newCells[cellRef],
          formula: '', // Clear formula for non-formula values
          value: value
        };
        setCells(newCells);

        // Check if it matches expected hard-coded values (for certain cells)
        const expectedValues: Record<string, number> = problemId === '2' ? {
          // RetailMax expected values
          'C4': 21.0,   // Q1 revenue: 30*0.7 = 21
          'D4': 22.05,  // Q2 revenue: 21*1.05 = 22.05
        } : {
          // TechCorp expected values
          'B6': 150.0,  // 12.5 * 12 = Entry EV
          'B7': 87.5,   // 12.5 * 7 = Total Debt
        };

        const numValue = parseFloat(value);
        const expected = expectedValues[cellRef];

        if (expected !== undefined && Math.abs(numValue - expected) < 0.1) {
          setCompletedCells(prev => new Set(prev).add(cellRef));
          setScore(prev => prev + 50); // Lower score for hard-coded values
        }
      }
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
    
    if (cell?.hasHint && !cell.isLocked && !completedCells.has(cellRef)) {
      const difficulty = 'beginner'; // TODO: Get from problem difficulty
      const attemptCount = hintUsage[cellRef] || 0;
      const hintText = getHintText(cellRef, difficulty, attemptCount);
      
      if (hintText) {
        setShowHint({
          cellRef,
          text: hintText,
          x: e.clientX - 10, // Slight offset from cursor
          y: e.clientY + 20  // Always below the cell
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

    // Check if cell is in the selected range (Shift+Arrow selection)
    const isInSelectedRange = !!(selectedRange && (
      col >= Math.min(selectedRange.start.col, selectedRange.end.col) &&
      col <= Math.max(selectedRange.start.col, selectedRange.end.col) &&
      row >= Math.min(selectedRange.start.row, selectedRange.end.row) &&
      row <= Math.max(selectedRange.start.row, selectedRange.end.row)
    ));

    // Check if cell is in drag target range
    const isDragTarget = !!(isDragging && dragStart && dragEnd && (
      (col >= Math.min(dragStart.col, dragEnd.col) && col <= Math.max(dragStart.col, dragEnd.col) &&
       row >= Math.min(dragStart.row, dragEnd.row) && row <= Math.max(dragStart.row, dragEnd.row)) &&
      !(col === dragStart.col && row === dragStart.row) // Exclude the source cell
    ));

    return (
      <DataCell
        key={cellRef}
        data-cell={cellRef}
        $isSelected={isSelected}
        $isInRange={isInSelectedRange}
        $isCorrect={completedCells.has(cellRef)}
        $hasHint={cell?.hasHint && !cell?.isLocked && !completedCells.has(cellRef)}
        $isDragTarget={isDragTarget}
        $isCopied={copiedCell?.col === col && copiedCell?.row === row}
        $isReferenced={referencedCells.has(cellRef)}
        onClick={() => handleCellClick(col, row)}
        onContextMenu={(e) => handleCellRightClick(e, col, row)}
        onMouseEnter={() => handleCellMouseEnter(col, row)}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, col, row)}
        style={{ position: 'relative' }}
      >
        {cell?.isLocked ? (
          cell.value
        ) : (
          <>
            <CellInput
              value={selectedCell?.col === col && selectedCell?.row === row && cell?.formula?.startsWith('=')
                ? cell.formula
                : (cell?.value || '')}
              onChange={(e) => {
                handleCellChange(col, row, e.target.value);
                // Track if we're editing a formula
                if (e.target.value.startsWith('=')) {
                  setIsEditingFormula(true);
                  setEditingCell({ col, row });
                  setFormulaBarCursorPos(e.target.selectionStart || 0);
                } else {
                  setIsEditingFormula(false);
                  setEditingCell(null);
                }
              }}
              onFocus={() => {
                handleCellClick(col, row, true);
                setEditingCell({ col, row });
                // Check if this cell has a formula
                if (cell?.formula?.startsWith('=')) {
                  setIsEditingFormula(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  handleCellSubmit(col, row, e.currentTarget.value);
                  setIsEditingFormula(false);
                  setEditingCell(null);
                }
                handleKeyDown(e, col, row);
              }}
              onBlur={(e) => {
                // Delay blur to allow click event to fire first
                setTimeout(() => {
                  // Only submit if we're not clicking on another cell for formula reference
                  if (!isEditingFormula || e.relatedTarget?.tagName !== 'TD') {
                    handleCellSubmit(col, row, e.target.value);
                    setIsEditingFormula(false);
                    setEditingCell(null);
                    setReferencedCells(new Set());
                  }
                }, 100);
              }}
            />
            {/* Show fill handle on selected cell */}
            {isSelected && !cell?.isLocked && (
              <FillHandle
                onMouseDown={(e) => handleFillHandleMouseDown(e, col, row)}
              />
            )}
          </>
        )}
      </DataCell>
    );
  };

  return (
    <LBOContainer onClick={handleClickOutside}>
      <Header>
        <Logo onClick={handleGoHome}>Hugo</Logo>
        <HeaderActions>
          <BackButton onClick={() => setShowShortcuts(true)}>? Shortcuts</BackButton>
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
            <StatItem>
              <ClearButton
                onClick={clearSavedState}
                title="Clear all progress and start over"
              >
                Clear Progress
              </ClearButton>
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
          <Tab $active={activeTab === 'forum'} onClick={() => setActiveTab('forum')}>
            Forum
          </Tab>
        </TabContainer>

        {activeTab === 'setup' && (
          <div style={{ padding: '2rem', lineHeight: '1.6' }}>
            {problemId === '5' ? (
              <>
                <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>Energy Conglomerate LBO Analysis</h3>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Background</h4>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    EnergyCore Industries is a diversified energy conglomerate with operations across the entire energy value chain. 
                    Your private equity firm is considering acquiring this complex business and wants you to model the multi-divisional 
                    operations, commodity hedging strategies, and environmental transition challenges.
                  </p>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    The company operates four distinct business units: Upstream Oil & Gas (exploration & production), 
                    Midstream (pipelines & storage), Downstream (refining), and Renewables (solar & wind). Each division 
                    has unique economics, risk profiles, and capital requirements that must be modeled separately.
                  </p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Divisional Overview</h4>
                  <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                    <li><strong>Upstream ($850M revenue):</strong> 8.5 MMbbl oil + 45 Bcf gas production, 75% hedged at $72/bbl</li>
                    <li><strong>Midstream ($420M revenue):</strong> 2.1 MMbbl/d pipeline capacity, regulated tariff structure</li>
                    <li><strong>Downstream ($680M revenue):</strong> 185 kb/d refining capacity, crack spread dependent</li>
                    <li><strong>Renewables ($180M revenue):</strong> 900 MW installed capacity, long-term PPA contracts</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Advanced Modeling Requirements</h4>
                  <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                    <li><strong>Commodity Hedging:</strong> Oil price collars, gas price swaps, crack spread hedging</li>
                    <li><strong>Environmental Costs:</strong> Carbon pricing at $35/tonne CO2, environmental remediation</li>
                    <li><strong>Production Decline:</strong> 8-12% annual decline without capital investment</li>
                    <li><strong>Capex Allocation:</strong> Maintenance 4-6%, Growth 8-12% of revenue</li>
                    <li><strong>ESG Transition:</strong> Renewables expansion 15% annually, coal retirement</li>
                    <li><strong>Complex Financing:</strong> Reserve-based lending, project finance, commodity-linked debt</li>
                    <li><strong>Cyclical Volatility:</strong> Oil $70-85/bbl, Gas $3-6/mmbtu scenarios</li>
                    <li><strong>Regulatory Risk:</strong> Carbon regulations, renewable incentives, pipeline approvals</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Key Financial Metrics</h4>
                  <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                    <li><strong>Entry Valuation:</strong> 8-12x EBITDA (ESG discount vs traditional energy)</li>
                    <li><strong>Exit Multiple:</strong> 10-14x EBITDA (depends on energy transition progress)</li>
                    <li><strong>Leverage:</strong> 3.5-4.0x EBITDA (commodity volatility constraint)</li>
                    <li><strong>IRR Target:</strong> 20-25% (high returns for energy risk)</li>
                    <li><strong>Hold Period:</strong> 4-6 years (energy cycle optimization)</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Your Challenge</h4>
                  <p style={{ color: theme.colors.text }}>
                    Build a comprehensive multi-divisional LBO model incorporating commodity hedging, environmental costs, 
                    and capital allocation optimization. This advanced-level model requires mastery of energy industry 
                    economics, commodity risk management, and ESG impact modeling. Navigate the energy transition while 
                    maximizing returns in this complex, capital-intensive business.
                  </p>
                  <p style={{ color: theme.colors.text, marginTop: '1rem' }}>
                    Click the "Model" tab to begin your advanced energy conglomerate analysis.
                  </p>
                </div>
              </>
            ) : problemId === '4' ? (
              <>
                <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>Healthcare Services LBO Analysis</h3>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Background</h4>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    HealthCare Partners is a leading healthcare services provider operating multiple clinics and outpatient facilities. 
                    Your private equity firm is considering acquiring the company and wants you to model the complex regulatory environment, 
                    acquisition strategy, and diverse payer mix typical of healthcare services businesses.
                  </p>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    The company generates revenue from both government payers (Medicare/Medicaid) and commercial insurance, 
                    with quality-based bonuses and penalties. Your model must account for acquisition growth, regulatory compliance costs, 
                    and longer accounts receivable cycles.
                  </p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Key Assumptions</h4>
                  <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                    <li><strong>Payer Mix:</strong> 60% Government (2.5-3.5% growth), 40% Commercial (5.5-7% growth)</li>
                    <li><strong>Quality Adjustments:</strong> ±2% of revenue based on CMS performance metrics</li>
                    <li><strong>EBITDA margin:</strong> 22-23.5% (improving with scale and synergies)</li>
                    <li><strong>D&A:</strong> $12M annually (healthcare infrastructure)</li>
                    <li><strong>Capex:</strong> 3% of revenue (EMR systems, facility upgrades)</li>
                    <li><strong>Working capital:</strong> 15% of revenue (45-60 day A/R cycle)</li>
                    <li><strong>Acquisitions:</strong> 1-2 targets annually at $15-25M revenue each</li>
                    <li><strong>Integration costs:</strong> 10% of acquisition revenue for 2 years</li>
                    <li><strong>Synergies:</strong> 5% administrative savings after year 1</li>
                    <li><strong>Regulatory compliance:</strong> $2.5M annually</li>
                    <li><strong>Entry multiple:</strong> 12x LTM EBITDA</li>
                    <li><strong>Exit multiple:</strong> 14x Year 5 EBITDA</li>
                    <li><strong>Initial debt:</strong> 4.5x LTM EBITDA ($144M @ 8%)</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Your Task</h4>
                  <p style={{ color: theme.colors.text }}>
                    Build a comprehensive healthcare LBO model with regulatory complexity, acquisition tracking, and payer mix analysis. 
                    This intermediate-level model requires understanding of healthcare economics, roll-up strategies, and regulatory impacts.
                    Click the "Model" tab to start building your analysis.
                  </p>
                </div>
              </>
            ) : problemId === '3' ? (
              <>
                <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>Manufacturing Giant LBO Analysis</h3>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Background</h4>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    Manufacturing Giant is a large industrial manufacturer with operations across multiple business segments. 
                    Your private equity firm is considering acquiring the company and wants you to model the investment returns 
                    while managing complex debt structures and economic cyclicality.
                  </p>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    The company operates in cyclical markets with heavy asset requirements and complex working capital needs. 
                    You'll need to model multiple debt tranches, covenant compliance, and economic sensitivity.
                  </p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Key Assumptions</h4>
                  <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                    <li><strong>Economic cycle:</strong> 5% → 8% → 3% → -2% → 6% growth</li>
                    <li><strong>EBITDA margin:</strong> 18% (industrial manufacturing)</li>
                    <li><strong>D&A:</strong> $20M annually (heavy asset base)</li>
                    <li><strong>Maintenance capex:</strong> 3% of revenue</li>
                    <li><strong>Growth capex:</strong> 2% of revenue</li>
                    <li><strong>Working capital:</strong> Raw materials (7%) + Finished goods (8%) + A/R (10%) - A/P (6%)</li>
                    <li><strong>Debt structure:</strong> TLA ($200M @ 6%), TLB ($200M @ 8%), Revolver ($67M @ 5%)</li>
                    <li><strong>Covenants:</strong> Leverage &lt;6.0x, Coverage &gt;1.25x</li>
                    <li><strong>Entry multiple:</strong> 11x LTM EBITDA</li>
                    <li><strong>Exit multiple:</strong> 13x Year 5 EBITDA</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Your Task</h4>
                  <p style={{ color: theme.colors.text }}>
                    Build a comprehensive LBO model with multi-tranche debt structures, covenant testing, and cyclical revenue patterns. 
                    This intermediate-level model requires understanding of manufacturing economics, debt complexity, and economic cycles.
                    Click the "Model" tab to start building your analysis.
                  </p>
                </div>
              </>
            ) : problemId === '2' ? (
              <>
                <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>RetailMax Buyout Analysis</h3>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Background</h4>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    RetailMax is a mid-market retail chain with strong seasonal patterns and established market presence. 
                    Your private equity firm is considering acquiring the company and wants you to model the quarterly cash flows 
                    and seasonal working capital requirements typical of retail businesses.
                  </p>
                  <p style={{ color: theme.colors.text, marginBottom: '1rem' }}>
                    The company experiences significant seasonality with Q4 holiday sales driving 40% of annual revenue. 
                    Working capital management is critical due to inventory cycles and seasonal fluctuations.
                  </p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Key Assumptions</h4>
                  <ul style={{ color: theme.colors.text, marginLeft: '1.5rem' }}>
                    <li><strong>Revenue growth:</strong> 8% annually (lower than tech)</li>
                    <li><strong>EBITDA margin:</strong> 15% (typical for retail)</li>
                    <li><strong>D&A:</strong> $3M annually (higher for retail infrastructure)</li>
                    <li><strong>Capex:</strong> 2% of revenue (store maintenance & fixtures)</li>
                    <li><strong>Working capital:</strong> Seasonal patterns with inventory cycles</li>
                    <li><strong>Seasonality:</strong> Q4 = 40% higher than Q3, Q1 = 30% decline from Q4</li>
                    <li><strong>Entry multiple:</strong> 10x LTM EBITDA (lower than tech)</li>
                    <li><strong>Exit multiple:</strong> 12x Year 5 EBITDA (retail discount)</li>
                    <li><strong>Initial debt:</strong> 6x LTM EBITDA ($108M)</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: theme.colors.text, marginBottom: '1rem' }}>Your Task</h4>
                  <p style={{ color: theme.colors.text }}>
                    Build a quarterly LBO model that captures retail seasonality and working capital complexity. 
                    You'll need to model inventory cycles, seasonal revenue patterns, and calculate returns from this retail investment.
                    Click the "Model" tab to start building your quarterly analysis.
                  </p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {activeTab === 'model' && (
          <>
            <FormulaBar>
              <CellReference>
                {selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : 'A1'}
              </CellReference>
              <FormulaInput
                ref={formulaBarRef}
                value={formulaBarValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormulaBarValue(value);
                  setIsEditingFormula(value.startsWith('='));
                  setFormulaBarCursorPos(e.target.selectionStart || 0);

                  // Extract referenced cells for highlighting
                  if (value.startsWith('=')) {
                    const refs = new Set<string>();
                    const cellRefPattern = /\b([A-Za-z]+)(\d+)\b/g;
                    let match;
                    while ((match = cellRefPattern.exec(value)) !== null) {
                      refs.add(`${match[1].toUpperCase()}${match[2]}`);
                    }
                    setReferencedCells(refs);
                  } else {
                    setReferencedCells(new Set());
                  }
                }}
                onSelect={(e) => {
                  setFormulaBarCursorPos((e.target as HTMLInputElement).selectionStart || 0);
                }}
                onFocus={() => {
                  setIsEditingFormula(formulaBarValue.startsWith('='));
                }}
                onBlur={() => {
                  setIsEditingFormula(false);
                  setReferencedCells(new Set());
                }}
                placeholder="Enter formula or value..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedCell) {
                    e.preventDefault();
                    handleCellChange(selectedCell.col, selectedCell.row, formulaBarValue);
                    handleCellSubmit(selectedCell.col, selectedCell.row, formulaBarValue);
                    setIsEditingFormula(false);
                    // Move down one cell after Enter in formula bar
                    if (selectedCell.row < 24) {
                      const newRow = selectedCell.row + 1;
                      setSelectedCell({ col: selectedCell.col, row: newRow });
                      const newCellRef = `${String.fromCharCode(65 + selectedCell.col)}${newRow + 1}`;
                      const newCell = cells[newCellRef];
                      if (newCell?.formula && newCell.formula.startsWith('=')) {
            setFormulaBarValue(newCell.formula);
          } else {
            setFormulaBarValue(newCell?.value || '');
          }
                      focusCellInput(selectedCell.col, newRow);
                    }
                  }
                }}
              />
            </FormulaBar>

            <SpreadsheetContainer>
              <SpreadsheetTable>
                <thead>
                  <tr>
                    <HeaderCell></HeaderCell>
                    {(() => {
                      const cols = problemId === '5' ? 
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] :
                        problemId === '4' ? 
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] :
                        problemId === '2' ? 
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'] :
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                      return cols.map(col => (
                        <HeaderCell key={col}>{col}</HeaderCell>
                      ));
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const numRows = problemId === '5' ? 50 : problemId === '4' ? 38 : problemId === '3' ? 40 : problemId === '2' ? 35 : 28;
                    const numCols = problemId === '5' ? 10 : problemId === '4' ? 8 : problemId === '2' ? 22 : 7;
                    return [...Array(numRows)].map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <HeaderCell>{rowIndex + 1}</HeaderCell>
                        {[...Array(numCols)].map((_, colIndex) => renderCell(colIndex, rowIndex))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </SpreadsheetTable>
            </SpreadsheetContainer>
          </>
        )}

        {activeTab === 'solution' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>Solution</h3>
            <div style={{ color: theme.colors.text, lineHeight: '1.6' }}>
              {problemId === '5' ? (
                <>
                  <h4 style={{ marginBottom: '1rem' }}>Energy Conglomerate - Expected Results:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <strong>Divisional Revenue (Year 5):</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Upstream: $615.8M (oil decline + gas growth)</li>
                        <li>Midstream: $528.3M (throughput expansion)</li>
                        <li>Downstream: $742.1M (crack spread recovery)</li>
                        <li>Renewables: $385.2M (capacity expansion)</li>
                        <li><strong>Total Revenue: $2,271.4M</strong></li>
                      </ul>
                      
                      <strong style={{ marginTop: '1rem', display: 'block' }}>Income Statement (Year 5):</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Gross Profit: $635.9M (28% margin)</li>
                        <li>Carbon Costs: $47.8M ($35/tonne)</li>
                        <li>EBITDA: $425.1M (18.7% margin)</li>
                        <li>EBIT: $245.1M (D&A: $180M)</li>
                        <li>Net Income: $134.5M (after tax)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <strong>Cash Flow & Returns (Year 5):</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Free Cash Flow: $241.8M</li>
                        <li>Maintenance Capex: $113.6M (5%)</li>
                        <li>Growth Capex: $227.1M (10%)</li>
                        <li>Environmental Remediation: $18M</li>
                        <li>Working Capital: -$11.4M</li>
                      </ul>
                      
                      <strong style={{ marginTop: '1rem', display: 'block' }}>Valuation & Returns:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Exit Enterprise Value: $4,251M (10x EBITDA)</li>
                        <li>Total Equity Value: $3,851M</li>
                        <li>Equity IRR: 22.8%</li>
                        <li>Equity Multiple: 3.2x</li>
                        <li>MOIC: 3.2x over 5 years</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Key Success Factors:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div>
                        <strong>Operational Excellence:</strong>
                        <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                          <li>Optimize production decline through targeted drilling</li>
                          <li>Maximize refining crack spreads and utilization</li>
                          <li>Expand renewables capacity 15% annually</li>
                          <li>Implement carbon capture technologies</li>
                        </ul>
                      </div>
                      
                      <div>
                        <strong>Financial Management:</strong>
                        <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                          <li>Active hedging reduces commodity volatility by 60%</li>
                          <li>ESG improvements increase exit multiple to 10-11x</li>
                          <li>Maintain leverage below 3.5x through cycles</li>
                          <li>Optimize capital allocation across divisions</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Advanced Modeling Insights:</h4>
                    <ul style={{ marginLeft: '1rem' }}>
                      <li><strong>Commodity Hedging:</strong> 75% oil hedging at $72/bbl provides downside protection while maintaining 25% upside exposure</li>
                      <li><strong>Carbon Management:</strong> $35/tonne carbon pricing creates $47.8M annual cost, offset by efficiency gains</li>
                      <li><strong>Portfolio Balance:</strong> Renewables growth (15% CAGR) offsets upstream decline (8% annually)</li>
                      <li><strong>ESG Premium:</strong> Energy transition strategy commands 25% valuation premium vs pure fossil fuel players</li>
                      <li><strong>Cyclical Optimization:</strong> 5-year hold period captures full commodity cycle recovery</li>
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(65, 83, 120, 0.05)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', color: theme.colors.primary }}>Investment Thesis Summary:</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      The Energy Conglomerate LBO delivers attractive risk-adjusted returns through diversification across 
                      the energy value chain, active commodity risk management, and strategic positioning for the energy transition. 
                      The 22.8% IRR reflects the premium required for energy sector complexity and volatility.
                    </p>
                    <p>
                      Success depends on operational excellence across four distinct business units, proactive ESG positioning, 
                      and sophisticated financial risk management. This advanced model demonstrates mastery of multi-divisional 
                      LBO analysis with commodity hedging and environmental considerations.
                    </p>
                  </div>
                </>
              ) : problemId === '4' ? (
                <>
                  <h4 style={{ marginBottom: '1rem' }}>Healthcare Services - Expected Results:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <strong>Income Statement (Year 5):</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Government Revenue: $285.2M</li>
                        <li>Commercial Revenue: $201.8M</li>
                        <li>Quality Bonuses: $12.2M</li>
                        <li>Acquisition Revenue: $65.0M</li>
                        <li>Total Adjusted Revenue: $564.2M</li>
                        <li>EBITDA: $132.6M (23.5%)</li>
                        <li>EBIT: $120.6M</li>
                        <li>Interest: $8.5M</li>
                        <li>EBT: $112.1M</li>
                        <li>Net Income: $84.1M</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Returns Analysis:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Exit EBITDA: $132.6M</li>
                        <li>Exit EV: $1,856.4M</li>
                        <li>Final Debt: $95.3M</li>
                        <li>Exit Equity: $1,761.1M</li>
                        <li>Entry Equity: $240.0M</li>
                        <li><strong>MOIC: 7.34x</strong></li>
                        <li><strong>IRR: 49.2%</strong></li>
                      </ul>
                    </div>
                  </div>
                  
                  <h4 style={{ marginBottom: '1rem' }}>Key Formula Categories:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <strong>Healthcare Revenue:</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                        <li>Gov Revenue: =Previous * (1.025-1.035)</li>
                        <li>Commercial Rev: =Previous * (1.055-1.07)</li>
                        <li>Quality Adj: =Total_Rev * (±0.015-0.025)</li>
                        <li>Adj Revenue: =Gov + Commercial + Quality + Acquisitions</li>
                        <li>EBITDA: =Adj_Rev * (22%-23.5%)</li>
                        <li>Working Cap: =Revenue * 15%</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Acquisition Strategy:</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                        <li>Target Count: =1 or 2 per year</li>
                        <li>Acq Revenue: =Count * $15-25M</li>
                        <li>Acq Debt: =Acq_Revenue * 3x multiple</li>
                        <li>Integration: =Acq_Revenue * 10% for 2yrs</li>
                        <li>Synergies: =Prior_Acq_Rev * 5% after Y1</li>
                        <li>Regulatory: =$2.5M annually</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : problemId === '3' ? (
                <>
                  <h4 style={{ marginBottom: '1rem' }}>Manufacturing Giant - Expected Results:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <strong>Income Statement (Year 5):</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Revenue: $636.3M</li>
                        <li>EBITDA: $114.5M</li>
                        <li>EBIT: $108.5M</li>
                        <li>Interest: $25.2M</li>
                        <li>EBT: $83.3M</li>
                        <li>Net Income: $62.5M</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Returns Analysis:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Exit EV: $1,488.5M</li>
                        <li>Final Debt: $315.8M</li>
                        <li>Exit Equity: $1,172.7M</li>
                        <li>Entry Equity: $242.5M</li>
                        <li><strong>MOIC: 4.84x</strong></li>
                        <li><strong>IRR: 37.1%</strong></li>
                      </ul>
                    </div>
                  </div>
                  
                  <h4 style={{ marginBottom: '1rem' }}>Key Formula Categories:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <strong>Cyclical Revenue:</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                        <li>Year 1: =Base * 1.05 (Recovery)</li>
                        <li>Year 2: =Year1 * 1.08 (Expansion)</li>
                        <li>Year 3: =Year2 * 1.03 (Late Cycle)</li>
                        <li>Year 4: =Year3 * 0.98 (Downturn)</li>
                        <li>Year 5: =Year4 * 1.06 (Recovery)</li>
                        <li>EBITDA: =Revenue * 0.18</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Multi-Tranche Debt:</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                        <li>TLA Interest: =TLA_Balance * 6%</li>
                        <li>TLB Interest: =TLB_Balance * 8%</li>
                        <li>Revolver Int: =Rev_Balance * 5%</li>
                        <li>Total Interest: =TLA + TLB + Rev</li>
                        <li>Covenant Test: =Leverage &lt; 6.0x</li>
                        <li>Working Cap: =Rev*19% - Rev*6%</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : problemId === '2' ? (
                <>
                  <h4 style={{ marginBottom: '1rem' }}>RetailMax - Expected Results:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <strong>Income Statement (Year 5):</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Revenue: $224.3M</li>
                        <li>EBITDA: $33.6M</li>
                        <li>EBIT: $30.6M</li>
                        <li>Interest: $6.2M</li>
                        <li>EBT: $24.4M</li>
                        <li>Net Income: $18.3M</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Returns Analysis:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                        <li>Exit EV: $403.2M</li>
                        <li>Final Debt: $52.1M</li>
                        <li>Exit Equity: $351.1M</li>
                        <li>Entry Equity: $72.0M</li>
                        <li><strong>MOIC: 4.88x</strong></li>
                        <li><strong>IRR: 37.5%</strong></li>
                      </ul>
                    </div>
                  </div>
                  
                  <h4 style={{ marginBottom: '1rem' }}>Key Formula Categories:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <strong>Seasonal Quarterly:</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                        <li>Q1: =Q4_prev * 0.7 (Post-holiday)</li>
                        <li>Q2: =Q1 * 1.1 (Spring recovery)</li>
                        <li>Q3: =Q2 * 1.05 (Summer steady)</li>
                        <li>Q4: =Q3 * 1.4 (Holiday peak)</li>
                        <li>EBITDA: =Revenue * 0.15</li>
                        <li>D&A: =$3M annually</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Working Capital:</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '14px' }}>
                        <li>Inventory: =Next_Q_Rev * 0.35</li>
                        <li>A/R: =Current_Q_Rev * 0.08</li>
                        <li>A/P: =Current_Q_COGS * 0.12</li>
                        <li>Net WC: =Inventory + A/R - A/P</li>
                        <li>Capex: =Revenue * 2%</li>
                        <li>FCF: =EBITDA - Capex - WC</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h4 style={{ marginBottom: '1rem' }}>TechCorp - Expected Results:</h4>
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
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'forum' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{ color: theme.colors.primary, marginBottom: '1.5rem' }}>Discussion Forum</h3>
            <div style={{ color: theme.colors.text, lineHeight: '1.6' }}>
              
              {/* New Comment Form */}
              <div style={{ 
                background: 'rgba(65, 83, 120, 0.05)', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '2rem' 
              }}>
                <h4 style={{ marginBottom: '1rem', color: theme.colors.primary }}>Share your thoughts</h4>
                <textarea
                  placeholder="Ask a question, share insights, or discuss this problem..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '1rem',
                    border: `1px solid ${theme.colors.primary}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: '1rem'
                  }}
                />
                <button
                  style={{
                    backgroundColor: theme.colors.buttonPrimary,
                    color: theme.colors.white,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Post Comment
                </button>
              </div>

              {/* Sample Comments */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1.5rem', color: theme.colors.primary }}>Recent Discussions</h4>
                
                {/* Comment 1 */}
                <div style={{ 
                  border: '1px solid rgba(65, 83, 120, 0.1)', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  marginBottom: '1rem',
                  background: theme.colors.white
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ color: theme.colors.primary }}>SarahM_Finance</strong>
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '0.5rem' }}>2 hours ago</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▲</button>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.primary }}>12</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▼</button>
                    </div>
                  </div>
                  <p style={{ marginBottom: '1rem', color: theme.colors.text }}>
                    {problemId === '5' ? 
                      "The Energy Conglomerate commodity hedging formulas are quite complex. Anyone else finding the oil price collar calculations challenging? Would love to see a simpler approach." :
                      problemId === '4' ?
                      "Great problem! The healthcare acquisition modeling really helps understand roll-up strategies. The payer mix calculations were tricky at first." :
                      problemId === '3' ?
                      "The multi-tranche debt structure in this problem is excellent practice for real-world manufacturing LBOs. Covenant testing was particularly useful." :
                      problemId === '2' ?
                      "Love the quarterly seasonality modeling! Really captures the retail dynamics well. The working capital calculations were a good challenge." :
                      "This is a solid intro to LBO modeling. The step-by-step approach really helps build understanding of the core mechanics."
                    }
                  </p>
                  <button style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: theme.colors.primary, 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}>
                    Reply
                  </button>
                </div>

                {/* Comment 2 */}
                <div style={{ 
                  border: '1px solid rgba(65, 83, 120, 0.1)', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  marginBottom: '1rem',
                  background: theme.colors.white
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ color: theme.colors.primary }}>PrivateEquityPro</strong>
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '0.5rem' }}>5 hours ago</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▲</button>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.primary }}>8</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▼</button>
                    </div>
                  </div>
                  <p style={{ marginBottom: '1rem', color: theme.colors.text }}>
                    {problemId === '5' ? 
                      "Pro tip: For the environmental remediation costs, remember they scale with production levels. The formula should be =10+[Production]*1, not just a flat 18." :
                      problemId === '4' ?
                      "The regulatory compliance costs are a nice touch - very realistic for healthcare deals. Don't forget to model the working capital impact of longer A/R cycles." :
                      problemId === '3' ?
                      "For anyone struggling with the economic cycle modeling, remember that manufacturing companies are highly cyclical. The revenue volatility is intentional!" :
                      problemId === '2' ?
                      "Key insight: The Q4 holiday spike should be 40% higher than Q3, then Q1 drops 30% from Q4. This creates the classic retail seasonality pattern." :
                      "Focus on the debt paydown mechanics - this is fundamental to understanding how LBOs generate returns through deleveraging."
                    }
                  </p>
                  <div style={{ marginLeft: '2rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(65, 83, 120, 0.2)' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: theme.colors.primary, fontSize: '14px' }}>MikeFromGS</strong>
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '0.5rem' }}>3 hours ago</span>
                    </div>
                    <p style={{ color: theme.colors.text, fontSize: '14px', marginBottom: '0.5rem' }}>
                      Thanks for the clarification! That makes much more sense than hard-coding values.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>▲</button>
                      <span style={{ fontSize: '12px', color: theme.colors.primary }}>3</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>▼</button>
                    </div>
                  </div>
                  <button style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: theme.colors.primary, 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}>
                    Reply
                  </button>
                </div>

                {/* Comment 3 */}
                <div style={{ 
                  border: '1px solid rgba(65, 83, 120, 0.1)', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  marginBottom: '1rem',
                  background: theme.colors.white
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ color: theme.colors.primary }}>AnalystAlex</strong>
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '0.5rem' }}>1 day ago</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▲</button>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.primary }}>15</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▼</button>
                    </div>
                  </div>
                  <p style={{ marginBottom: '1rem', color: theme.colors.text }}>
                    {problemId === '5' ? 
                      "This is the most comprehensive energy LBO model I've seen. The multi-divisional approach with upstream, midstream, downstream, and renewables really captures the complexity of modern energy companies." :
                      problemId === '4' ?
                      "Excellent representation of healthcare M&A dynamics. The quality adjustments and payer mix modeling are spot-on for this sector." :
                      problemId === '3' ?
                      "The debt covenant modeling is particularly well done. Great practice for understanding leverage constraints in cyclical businesses." :
                      problemId === '2' ?
                      "Perfect introduction to quarterly modeling and seasonality. The retail working capital dynamics are very realistic." :
                      "Great starting point for LBO fundamentals. The model progression from revenue to returns is very clear."
                    }
                  </p>
                  <button style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: theme.colors.primary, 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}>
                    Reply
                  </button>
                </div>
              </div>

              {/* Forum Guidelines */}
              <div style={{ 
                background: 'rgba(65, 83, 120, 0.05)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid rgba(65, 83, 120, 0.1)'
              }}>
                <h4 style={{ marginBottom: '1rem', color: theme.colors.primary }}>Forum Guidelines</h4>
                <ul style={{ marginLeft: '1.5rem', color: theme.colors.text }}>
                  <li style={{ marginBottom: '0.5rem' }}>Share insights, ask questions, and help others learn</li>
                  <li style={{ marginBottom: '0.5rem' }}>Focus on constructive feedback about problem design and difficulty</li>
                  <li style={{ marginBottom: '0.5rem' }}>Explain your modeling approaches and alternative solutions</li>
                  <li style={{ marginBottom: '0.5rem' }}>Be respectful and supportive of all skill levels</li>
                  <li>Upvote helpful contributions and quality discussions</li>
                </ul>
              </div>

            </div>
          </div>
        )}
      </ModelingInterface>

      {/* Hint Tooltip */}
      {showHint && (
        <HintTooltip
          $isError={showHint.isError}
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

      {/* Assumptions Overlay - Shows when holding space bar */}
      <AssumptionsOverlay $visible={showAssumptions}>
        <AssumptionsTitle>📊 KEY ASSUMPTIONS</AssumptionsTitle>

        {(() => {
          const assumptions = getAssumptions();
          return (
            <>
              <AssumptionSection>
                <AssumptionLabel>{assumptions.revenue.label}</AssumptionLabel>
                {assumptions.revenue.items.map((item, idx) => (
                  <AssumptionRow key={idx}>
                    <AssumptionName>{item.name}</AssumptionName>
                    <AssumptionValue>{item.value}</AssumptionValue>
                  </AssumptionRow>
                ))}
              </AssumptionSection>

              <AssumptionSection>
                <AssumptionLabel>{assumptions.margins.label}</AssumptionLabel>
                {assumptions.margins.items.map((item, idx) => (
                  <AssumptionRow key={idx}>
                    <AssumptionName>{item.name}</AssumptionName>
                    <AssumptionValue>{item.value}</AssumptionValue>
                  </AssumptionRow>
                ))}
              </AssumptionSection>

              <AssumptionSection>
                <AssumptionLabel>{assumptions.transaction.label}</AssumptionLabel>
                {assumptions.transaction.items.map((item, idx) => (
                  <AssumptionRow key={idx}>
                    <AssumptionName>{item.name}</AssumptionName>
                    <AssumptionValue>{item.value}</AssumptionValue>
                  </AssumptionRow>
                ))}
              </AssumptionSection>

              {assumptions.other && (
                <AssumptionSection>
                  <AssumptionLabel>{assumptions.other.label}</AssumptionLabel>
                  {assumptions.other.items.map((item, idx) => (
                    <AssumptionRow key={idx}>
                      <AssumptionName>{item.name}</AssumptionName>
                      <AssumptionValue>{item.value}</AssumptionValue>
                    </AssumptionRow>
                  ))}
                </AssumptionSection>
              )}

              <OverlayHint>Release SPACE to hide</OverlayHint>
            </>
          );
        })()}
      </AssumptionsOverlay>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal $isOpen={showShortcuts} onClick={() => setShowShortcuts(false)}>
        <ShortcutsContent onClick={(e) => e.stopPropagation()}>
          <ShortcutsHeader>
            <ShortcutsTitle>Keyboard Shortcuts</ShortcutsTitle>
            <CloseButton onClick={() => setShowShortcuts(false)}>×</CloseButton>
          </ShortcutsHeader>

          <ShortcutSection>
            <SectionTitle>📋 Copy/Paste/Fill</SectionTitle>
            <ShortcutList>
              <ShortcutItem>
                <ShortcutDescription>Copy cell</ShortcutDescription>
                <ShortcutKey>Ctrl + C</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Paste (with formula adjustment)</ShortcutDescription>
                <ShortcutKey>Ctrl + V</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Fill Right (adjusts formulas)</ShortcutDescription>
                <ShortcutKey>Ctrl + R</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Fill Down (adjusts formulas)</ShortcutDescription>
                <ShortcutKey>Ctrl + D</ShortcutKey>
              </ShortcutItem>
            </ShortcutList>
          </ShortcutSection>

          <ShortcutSection>
            <SectionTitle>↔️ Navigation</SectionTitle>
            <ShortcutList>
              <ShortcutItem>
                <ShortcutDescription>Move between cells</ShortcutDescription>
                <ShortcutKey>Arrow Keys</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Select range</ShortcutDescription>
                <ShortcutKey>Shift + Arrow</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Next cell</ShortcutDescription>
                <ShortcutKey>Tab</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Previous cell</ShortcutDescription>
                <ShortcutKey>Shift + Tab</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Extend selection right</ShortcutDescription>
                <ShortcutKey>Ctrl + Tab</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Delete cell(s)</ShortcutDescription>
                <ShortcutKey>Delete / Backspace</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Submit & move down</ShortcutDescription>
                <ShortcutKey>Enter</ShortcutKey>
              </ShortcutItem>
            </ShortcutList>
          </ShortcutSection>

          <ShortcutSection>
            <SectionTitle>↩️ Undo/Redo</SectionTitle>
            <ShortcutList>
              <ShortcutItem>
                <ShortcutDescription>Undo last action</ShortcutDescription>
                <ShortcutKey>Ctrl + Z</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Redo action</ShortcutDescription>
                <ShortcutKey>Ctrl + Y</ShortcutKey>
              </ShortcutItem>
            </ShortcutList>
          </ShortcutSection>

          <ShortcutSection>
            <SectionTitle>👁️ View</SectionTitle>
            <ShortcutList>
              <ShortcutItem>
                <ShortcutDescription>Show assumptions (hold)</ShortcutDescription>
                <ShortcutKey>Space Bar</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Show this help</ShortcutDescription>
                <ShortcutKey>?</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Close dialogs</ShortcutDescription>
                <ShortcutKey>Escape</ShortcutKey>
              </ShortcutItem>
            </ShortcutList>
          </ShortcutSection>

          <ShortcutSection>
            <SectionTitle>🖱️ Mouse Actions</SectionTitle>
            <ShortcutList>
              <ShortcutItem>
                <ShortcutDescription>Click cell while typing formula to insert reference</ShortcutDescription>
                <ShortcutKey>Click</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Drag fill handle to fill cells</ShortcutDescription>
                <ShortcutKey>Drag</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Get hint (3 uses)</ShortcutDescription>
                <ShortcutKey>Right Click</ShortcutKey>
              </ShortcutItem>
            </ShortcutList>
          </ShortcutSection>

          <ShortcutSection>
            <SectionTitle>📝 Formula Tips</SectionTitle>
            <ShortcutList>
              <ShortcutItem>
                <ShortcutDescription>Start formula with =</ShortcutDescription>
                <ShortcutKey>=B4*1.25</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Cell references (case insensitive)</ShortcutDescription>
                <ShortcutKey>b4 or B4</ShortcutKey>
              </ShortcutItem>
              <ShortcutItem>
                <ShortcutDescription>Basic operations</ShortcutDescription>
                <ShortcutKey>+ - * / ^</ShortcutKey>
              </ShortcutItem>
            </ShortcutList>
          </ShortcutSection>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: theme.colors.background, borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: theme.colors.text, textAlign: 'center' }}>
              💡 <strong>Tip:</strong> Use Shift+Arrow to select a range, then Ctrl+R or Ctrl+D to fill formulas across multiple cells!
            </p>
          </div>
        </ShortcutsContent>
      </ShortcutsModal>
    </LBOContainer>
  );
};

export default LBOModeler;