import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import Header from './shared/Header';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CellData {
  value: string | number;
  formula?: string;
  isInput?: boolean;
  isCalculated?: boolean;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  locked?: boolean;
  validation?: {
    min?: number;
    max?: number;
  };
}

interface DCFProblemData {
  id: string;
  name: string;
  company: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  initialData: Record<string, CellData>;
  targetMetrics: {
    enterpriseValue?: number;
    equityValue?: number;
    impliedSharePrice?: number;
    irr?: number;
  };
  hints: string[];
}

// ============================================================================
// DCF PROBLEM CONFIGURATIONS
// ============================================================================

const DCF_PROBLEMS: Record<string, DCFProblemData> = {
  'dcf-1': {
    id: 'dcf-1',
    name: 'TechFlow SaaS DCF',
    company: 'TechFlow Inc.',
    description: 'Value a high-growth SaaS company with recurring revenue',
    difficulty: 'beginner',
    initialData: {
      // Revenue Assumptions
      'B4': { value: 'Current Year Revenue ($M)', locked: true },
      'C4': { value: 100, isInput: true, format: 'currency' },
      'B5': { value: 'Revenue Growth Rate', locked: true },
      'C5': { value: 0.25, isInput: true, format: 'percentage' },

      // Operating Assumptions
      'B7': { value: 'EBITDA Margin', locked: true },
      'C7': { value: 0.30, isInput: true, format: 'percentage' },
      'B8': { value: 'Tax Rate', locked: true },
      'C8': { value: 0.21, isInput: true, format: 'percentage' },
      'B9': { value: 'Capex % of Revenue', locked: true },
      'C9': { value: 0.05, isInput: true, format: 'percentage' },
      'B10': { value: 'NWC % of Revenue', locked: true },
      'C10': { value: 0.10, isInput: true, format: 'percentage' },

      // WACC Components
      'B12': { value: 'Risk-free Rate', locked: true },
      'C12': { value: 0.045, isInput: true, format: 'percentage' },
      'B13': { value: 'Equity Risk Premium', locked: true },
      'C13': { value: 0.065, isInput: true, format: 'percentage' },
      'B14': { value: 'Beta', locked: true },
      'C14': { value: 1.3, isInput: true, format: 'number' },
      'B15': { value: 'Cost of Equity', locked: true },
      'C15': { value: '=C12+C14*C13', isCalculated: true, format: 'percentage' },
      'B16': { value: 'WACC', locked: true },
      'C16': { value: '=C15', isCalculated: true, format: 'percentage' },

      // Terminal Value
      'B18': { value: 'Terminal Growth Rate', locked: true },
      'C18': { value: 0.03, isInput: true, format: 'percentage' },

      // Projection Years Headers
      'D2': { value: 'Year 1', locked: true },
      'E2': { value: 'Year 2', locked: true },
      'F2': { value: 'Year 3', locked: true },
      'G2': { value: 'Year 4', locked: true },
      'H2': { value: 'Year 5', locked: true },

      // Revenue Projections
      'B21': { value: 'Revenue', locked: true },
      'D21': { value: '=C4*(1+C5)', isCalculated: true, format: 'currency' },
      'E21': { value: '=D21*(1+C5)', isCalculated: true, format: 'currency' },
      'F21': { value: '=E21*(1+C5)', isCalculated: true, format: 'currency' },
      'G21': { value: '=F21*(1+C5)', isCalculated: true, format: 'currency' },
      'H21': { value: '=G21*(1+C5)', isCalculated: true, format: 'currency' },

      // EBITDA
      'B22': { value: 'EBITDA', locked: true },
      'D22': { value: '=D21*C7', isCalculated: true, format: 'currency' },
      'E22': { value: '=E21*C7', isCalculated: true, format: 'currency' },
      'F22': { value: '=F21*C7', isCalculated: true, format: 'currency' },
      'G22': { value: '=G21*C7', isCalculated: true, format: 'currency' },
      'H22': { value: '=H21*C7', isCalculated: true, format: 'currency' },

      // Tax
      'B23': { value: 'Tax', locked: true },
      'D23': { value: '=D22*C8', isCalculated: true, format: 'currency' },
      'E23': { value: '=E22*C8', isCalculated: true, format: 'currency' },
      'F23': { value: '=F22*C8', isCalculated: true, format: 'currency' },
      'G23': { value: '=G22*C8', isCalculated: true, format: 'currency' },
      'H23': { value: '=H22*C8', isCalculated: true, format: 'currency' },

      // NOPAT
      'B24': { value: 'NOPAT', locked: true },
      'D24': { value: '=D22-D23', isCalculated: true, format: 'currency' },
      'E24': { value: '=E22-E23', isCalculated: true, format: 'currency' },
      'F24': { value: '=F22-F23', isCalculated: true, format: 'currency' },
      'G24': { value: '=G22-G23', isCalculated: true, format: 'currency' },
      'H24': { value: '=H22-H23', isCalculated: true, format: 'currency' },

      // Capex
      'B25': { value: 'Capex', locked: true },
      'D25': { value: '=-D21*C9', isCalculated: true, format: 'currency' },
      'E25': { value: '=-E21*C9', isCalculated: true, format: 'currency' },
      'F25': { value: '=-F21*C9', isCalculated: true, format: 'currency' },
      'G25': { value: '=-G21*C9', isCalculated: true, format: 'currency' },
      'H25': { value: '=-H21*C9', isCalculated: true, format: 'currency' },

      // Change in NWC
      'B26': { value: 'Change in NWC', locked: true },
      'D26': { value: '=-(D21-C4)*C10', isCalculated: true, format: 'currency' },
      'E26': { value: '=-(E21-D21)*C10', isCalculated: true, format: 'currency' },
      'F26': { value: '=-(F21-E21)*C10', isCalculated: true, format: 'currency' },
      'G26': { value: '=-(G21-F21)*C10', isCalculated: true, format: 'currency' },
      'H26': { value: '=-(H21-G21)*C10', isCalculated: true, format: 'currency' },

      // Free Cash Flow
      'B27': { value: 'Free Cash Flow', locked: true },
      'D27': { value: '=D24+D25+D26', isCalculated: true, format: 'currency' },
      'E27': { value: '=E24+E25+E26', isCalculated: true, format: 'currency' },
      'F27': { value: '=F24+F25+F26', isCalculated: true, format: 'currency' },
      'G27': { value: '=G24+G25+G26', isCalculated: true, format: 'currency' },
      'H27': { value: '=H24+H25+H26', isCalculated: true, format: 'currency' },

      // Terminal Value
      'B29': { value: 'Terminal Value', locked: true },
      'H29': { value: '=H27*(1+C18)/(C16-C18)', isCalculated: true, format: 'currency' },

      // Total Cash Flows
      'B30': { value: 'Total Cash Flow', locked: true },
      'D30': { value: '=D27', isCalculated: true, format: 'currency' },
      'E30': { value: '=E27', isCalculated: true, format: 'currency' },
      'F30': { value: '=F27', isCalculated: true, format: 'currency' },
      'G30': { value: '=G27', isCalculated: true, format: 'currency' },
      'H30': { value: '=H27+H29', isCalculated: true, format: 'currency' },

      // Discount Factor
      'B31': { value: 'Discount Factor', locked: true },
      'D31': { value: '=1/(1+C16)^1', isCalculated: true, format: 'number' },
      'E31': { value: '=1/(1+C16)^2', isCalculated: true, format: 'number' },
      'F31': { value: '=1/(1+C16)^3', isCalculated: true, format: 'number' },
      'G31': { value: '=1/(1+C16)^4', isCalculated: true, format: 'number' },
      'H31': { value: '=1/(1+C16)^5', isCalculated: true, format: 'number' },

      // PV of Cash Flows
      'B32': { value: 'PV of Cash Flow', locked: true },
      'D32': { value: '=D30*D31', isCalculated: true, format: 'currency' },
      'E32': { value: '=E30*E31', isCalculated: true, format: 'currency' },
      'F32': { value: '=F30*F31', isCalculated: true, format: 'currency' },
      'G32': { value: '=G30*G31', isCalculated: true, format: 'currency' },
      'H32': { value: '=H30*H31', isCalculated: true, format: 'currency' },

      // Valuation Summary
      'B34': { value: 'VALUATION SUMMARY', locked: true },
      'B35': { value: 'Enterprise Value', locked: true },
      'C35': { value: '=SUM(D32:H32)', isCalculated: true, format: 'currency' },
      'B36': { value: 'Less: Net Debt', locked: true },
      'C36': { value: 50, isInput: true, format: 'currency' },
      'B37': { value: 'Equity Value', locked: true },
      'C37': { value: '=C35-C36', isCalculated: true, format: 'currency' },
      'B38': { value: 'Shares Outstanding (M)', locked: true },
      'C38': { value: 10, isInput: true, format: 'number' },
      'B39': { value: 'Implied Share Price', locked: true },
      'C39': { value: '=C37/C38', isCalculated: true, format: 'currency' },
    },
    targetMetrics: {
      enterpriseValue: 1650,
      equityValue: 1600,
      impliedSharePrice: 160,
    },
    hints: [
      'Start with revenue projections using the growth rate',
      'Calculate EBITDA using the margin assumption',
      'Don\'t forget to subtract taxes to get NOPAT',
      'Free cash flow = NOPAT - Capex - Change in NWC',
      'Terminal value uses the Gordon Growth formula'
    ]
  },

  'dcf-2': {
    id: 'dcf-2',
    name: 'RetailExpand DCF',
    company: 'RetailExpand Corp.',
    description: 'Value a retail chain planning aggressive store expansion',
    difficulty: 'beginner',
    initialData: {
      // Store Metrics
      'B4': { value: 'Current Stores', locked: true },
      'C4': { value: 50, isInput: true, format: 'number' },
      'B5': { value: 'New Stores per Year', locked: true },
      'C5': { value: 10, isInput: true, format: 'number' },
      'B6': { value: 'Revenue per Store ($M)', locked: true },
      'C6': { value: 5, isInput: true, format: 'currency' },
      'B7': { value: 'Same Store Sales Growth', locked: true },
      'C7': { value: 0.03, isInput: true, format: 'percentage' },

      // Operating Metrics
      'B9': { value: 'EBITDA Margin', locked: true },
      'C9': { value: 0.15, isInput: true, format: 'percentage' },
      'B10': { value: 'Tax Rate', locked: true },
      'C10': { value: 0.25, isInput: true, format: 'percentage' },
      'B11': { value: 'Capex per New Store ($M)', locked: true },
      'C11': { value: 2, isInput: true, format: 'currency' },
      'B12': { value: 'Maintenance Capex (% Rev)', locked: true },
      'C12': { value: 0.02, isInput: true, format: 'percentage' },

      // Working Capital
      'B14': { value: 'Inventory Days', locked: true },
      'C14': { value: 60, isInput: true, format: 'number' },
      'B15': { value: 'Payables Days', locked: true },
      'C15': { value: 45, isInput: true, format: 'number' },

      // WACC
      'B17': { value: 'WACC', locked: true },
      'C17': { value: 0.09, isInput: true, format: 'percentage' },

      // Terminal Value
      'B19': { value: 'Terminal EBITDA Multiple', locked: true },
      'C19': { value: 8, isInput: true, format: 'number' },

      // Headers
      'D2': { value: 'Year 1', locked: true },
      'E2': { value: 'Year 2', locked: true },
      'F2': { value: 'Year 3', locked: true },
      'G2': { value: 'Year 4', locked: true },
      'H2': { value: 'Year 5', locked: true },

      // Store Count
      'B21': { value: 'Store Count', locked: true },
      'D21': { value: '=C4+C5', isCalculated: true, format: 'number' },
      'E21': { value: '=D21+C5', isCalculated: true, format: 'number' },
      'F21': { value: '=E21+C5', isCalculated: true, format: 'number' },
      'G21': { value: '=F21+C5', isCalculated: true, format: 'number' },
      'H21': { value: '=G21+C5', isCalculated: true, format: 'number' },

      // Revenue Calculation (simplified for now)
      'B22': { value: 'Revenue', locked: true },
      'D22': { value: '=D21*C6*(1+C7)', isCalculated: true, format: 'currency' },
      'E22': { value: '=E21*C6*(1+C7)^2', isCalculated: true, format: 'currency' },
      'F22': { value: '=F21*C6*(1+C7)^3', isCalculated: true, format: 'currency' },
      'G22': { value: '=G21*C6*(1+C7)^4', isCalculated: true, format: 'currency' },
      'H22': { value: '=H21*C6*(1+C7)^5', isCalculated: true, format: 'currency' },
    },
    targetMetrics: {
      enterpriseValue: 2100,
      equityValue: 1950,
    },
    hints: [
      'Calculate total stores for each year',
      'Revenue = Stores × Revenue per Store × SSS growth factor',
      'Working capital change impacts cash flow',
      'Use EBITDA multiple for terminal value'
    ]
  },

  'dcf-3': {
    id: 'dcf-3',
    name: 'IndustrialCo DCF',
    company: 'IndustrialCo Manufacturing',
    description: 'Value a manufacturing company with multiple product lines and heavy capex',
    difficulty: 'intermediate',
    initialData: {
      // Product Segments
      'B4': { value: 'Segment A Revenue ($M)', locked: true },
      'C4': { value: 150, isInput: true, format: 'currency' },
      'B5': { value: 'Segment A Growth', locked: true },
      'C5': { value: 0.05, isInput: true, format: 'percentage' },
      'B6': { value: 'Segment B Revenue ($M)', locked: true },
      'C6': { value: 100, isInput: true, format: 'currency' },
      'B7': { value: 'Segment B Growth', locked: true },
      'C7': { value: 0.08, isInput: true, format: 'percentage' },
      'B8': { value: 'Segment C Revenue ($M)', locked: true },
      'C8': { value: 75, isInput: true, format: 'currency' },
      'B9': { value: 'Segment C Growth', locked: true },
      'C9': { value: 0.03, isInput: true, format: 'percentage' },
    },
    targetMetrics: {
      enterpriseValue: 3200,
    },
    hints: [
      'Model each segment separately',
      'Different growth rates per segment',
      'Manufacturing requires significant capex'
    ]
  },

  'dcf-4': {
    id: 'dcf-4',
    name: 'BioPharma Pipeline DCF',
    company: 'BioPharma Innovations',
    description: 'Advanced DCF with probability-weighted drug pipeline and patent expiries',
    difficulty: 'advanced',
    initialData: {
      // Drug Pipeline
      'B4': { value: 'Drug A - Probability', locked: true },
      'C4': { value: 0.7, isInput: true, format: 'percentage' },
      'B5': { value: 'Drug A - Peak Sales ($M)', locked: true },
      'C5': { value: 500, isInput: true, format: 'currency' },
      'B6': { value: 'Drug B - Probability', locked: true },
      'C6': { value: 0.4, isInput: true, format: 'percentage' },
      'B7': { value: 'Drug B - Peak Sales ($M)', locked: true },
      'C7': { value: 800, isInput: true, format: 'currency' },
    },
    targetMetrics: {
      enterpriseValue: 4500,
    },
    hints: [
      'Probability-weight the revenue projections',
      'Model patent expiries as revenue cliffs',
      'R&D expenses are significant'
    ]
  },

  'dcf-5': {
    id: 'dcf-5',
    name: 'MegaCorp Conglomerate DCF',
    company: 'MegaCorp Global',
    description: 'Sum-of-the-parts valuation with multiple divisions and different WACCs',
    difficulty: 'advanced',
    initialData: {
      // Division Overview
      'B4': { value: 'Tech Division Rev ($M)', locked: true },
      'C4': { value: 400, isInput: true, format: 'currency' },
      'B5': { value: 'Industrial Div Rev ($M)', locked: true },
      'C5': { value: 600, isInput: true, format: 'currency' },
      'B6': { value: 'Services Div Rev ($M)', locked: true },
      'C6': { value: 300, isInput: true, format: 'currency' },
      'B8': { value: 'Tech Division WACC', locked: true },
      'C8': { value: 0.12, isInput: true, format: 'percentage' },
      'B9': { value: 'Industrial Div WACC', locked: true },
      'C9': { value: 0.08, isInput: true, format: 'percentage' },
      'B10': { value: 'Services Div WACC', locked: true },
      'C10': { value: 0.10, isInput: true, format: 'percentage' },
    },
    targetMetrics: {
      enterpriseValue: 12000,
    },
    hints: [
      'Value each division separately',
      'Use different WACCs per division',
      'Sum the division values for enterprise value'
    ]
  }
};

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
  display: flex;
  flex-direction: column;
`;

const ControlPanel = styled.div`
  background: white;
  padding: 1.5rem;
  border-bottom: 2px solid rgba(65, 83, 120, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProblemInfo = styled.div`
  flex: 1;
`;

const ProblemTitle = styled.h2`
  font-family: ${theme.fonts.header};
  color: ${theme.colors.primary};
  margin: 0 0 0.5rem 0;
`;

const ProblemDescription = styled.p`
  color: ${theme.colors.text};
  margin: 0;
  opacity: 0.8;
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const SubmitButton = styled(Button)`
  background: ${theme.colors.buttonPrimary};
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }
`;

const HintButton = styled(Button)`
  background: #f59e0b;
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
`;

const SpreadsheetContainer = styled.div`
  flex: 1;
  overflow: auto;
  background: white;
  margin: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const FormulaBar = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  gap: 1rem;
`;

const CellReference = styled.div`
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
`;

const FormulaInput = styled.input`
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 60px repeat(8, 120px);
  overflow: auto;
  padding: 1rem;
`;

const Cell = styled.div<{
  $isHeader?: boolean;
  $isSelected?: boolean;
  $isInput?: boolean;
  $isCalculated?: boolean;
  $isLocked?: boolean;
}>`
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  background: ${props =>
    props.$isHeader ? '#f0f0f0' :
    props.$isLocked ? '#f8f8f8' :
    props.$isInput ? '#e8f4ff' :
    props.$isCalculated ? '#f0fff4' :
    'white'
  };
  font-weight: ${props => props.$isHeader ? '600' : '400'};
  text-align: ${props => props.$isHeader ? 'center' : 'right'};
  cursor: ${props => props.$isLocked ? 'not-allowed' : 'cell'};
  font-size: 13px;
  position: relative;

  ${props => props.$isSelected && `
    outline: 2px solid ${theme.colors.primary};
    z-index: 1;
  `}

  &:hover {
    background: ${props => !props.$isLocked && !props.$isHeader && '#f5f5f5'};
  }

  input {
    width: 100%;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    text-align: inherit;

    &:focus {
      outline: none;
    }
  }
`;

const HintModal = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 500px;
`;

const HintTitle = styled.h3`
  color: ${theme.colors.primary};
  margin-bottom: 1rem;
`;

const HintText = styled.p`
  color: ${theme.colors.text};
  line-height: 1.6;
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DCFModelerProps {
  problemId: string;
  problemName?: string;
}

const DCFModeler: React.FC<DCFModelerProps> = ({ problemId, problemName }) => {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [cellData, setCellData] = useState<Record<string, CellData>>({});
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  // Load problem data
  const problem = DCF_PROBLEMS[problemId];

  useEffect(() => {
    if (problem) {
      setCellData(problem.initialData);
    }
  }, [problem]);

  // Cell selection and editing
  const handleCellClick = (cellId: string) => {
    const cell = cellData[cellId];
    if (cell?.locked) return;

    setSelectedCell(cellId);
    if (cell?.isInput) {
      setIsEditing(true);
      setEditValue(String(cell.value));
    }
  };

  const handleCellChange = (cellId: string, value: string) => {
    const cell = cellData[cellId];
    if (!cell || cell.locked || !cell.isInput) return;

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCellData(prev => ({
        ...prev,
        [cellId]: {
          ...prev[cellId],
          value: numValue
        }
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isEditing && selectedCell) {
      handleCellChange(selectedCell, editValue);
      setIsEditing(false);
      setEditValue('');
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

  // Format cell value for display
  const formatValue = (cell: CellData): string => {
    if (!cell) return '';

    const value = cell.value;
    if (typeof value === 'string') return value;
    if (typeof value !== 'number') return '';

    switch (cell.format) {
      case 'currency':
        return `$${value.toFixed(1)}`;
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
        return value.toFixed(2);
      default:
        return String(value);
    }
  };

  // Generate grid cells
  const renderGrid = () => {
    const rows = 40;
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const cells = [];

    // Header row
    cells.push(<Cell key="header-empty" $isHeader />);
    cols.forEach(col => {
      cells.push(
        <Cell key={`header-${col}`} $isHeader>
          {col}
        </Cell>
      );
    });

    // Data rows
    for (let row = 1; row <= rows; row++) {
      cells.push(
        <Cell key={`row-${row}`} $isHeader>
          {row}
        </Cell>
      );

      cols.forEach(col => {
        const cellId = `${col}${row}`;
        const cell = cellData[cellId];

        cells.push(
          <Cell
            key={cellId}
            $isSelected={selectedCell === cellId}
            $isInput={cell?.isInput}
            $isCalculated={cell?.isCalculated}
            $isLocked={cell?.locked}
            onClick={() => handleCellClick(cellId)}
          >
            {isEditing && selectedCell === cellId ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            ) : (
              formatValue(cell)
            )}
          </Cell>
        );
      });
    }

    return cells;
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const handleNextHint = () => {
    if (problem && currentHintIndex < problem.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score based on accuracy
    alert('DCF submitted! Calculating score...');
    navigate('/problems');
  };

  if (!problem) {
    return (
      <Container>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>DCF Problem not found</h2>
          <Button onClick={() => navigate('/problems')}>Back to Problems</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header />

      <ControlPanel>
        <ProblemInfo>
          <ProblemTitle>{problem.name}</ProblemTitle>
          <ProblemDescription>{problem.description}</ProblemDescription>
        </ProblemInfo>

        <ControlButtons>
          <HintButton onClick={handleShowHint}>
            Get Hint ({currentHintIndex + 1}/{problem.hints.length})
          </HintButton>
          <SubmitButton onClick={handleSubmit}>
            Submit DCF
          </SubmitButton>
        </ControlButtons>
      </ControlPanel>

      <SpreadsheetContainer>
        <FormulaBar>
          <CellReference>{selectedCell || 'A1'}</CellReference>
          <FormulaInput
            value={(selectedCell && cellData[selectedCell]?.formula) ||
                   (selectedCell && cellData[selectedCell]?.value) || ''}
            readOnly
          />
        </FormulaBar>

        <Grid ref={gridRef}>
          {renderGrid()}
        </Grid>
      </SpreadsheetContainer>

      <Overlay $isOpen={showHint} onClick={() => setShowHint(false)} />
      <HintModal $isOpen={showHint}>
        <HintTitle>Hint {currentHintIndex + 1}</HintTitle>
        <HintText>{problem.hints[currentHintIndex]}</HintText>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <Button onClick={() => setShowHint(false)}>Close</Button>
          {currentHintIndex < problem.hints.length - 1 && (
            <Button onClick={handleNextHint}>Next Hint</Button>
          )}
        </div>
      </HintModal>
    </Container>
  );
};

export default DCFModeler;