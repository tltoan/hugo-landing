import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

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

const DataCell = styled.td<{ $isSelected?: boolean; $isCorrect?: boolean; $hasError?: boolean }>`
  padding: 4px 8px;
  border: 1px solid rgba(65, 83, 120, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => {
    if (props.$isSelected) return 'rgba(65, 83, 120, 0.1)';
    if (props.$isCorrect) return 'rgba(34, 197, 94, 0.1)';
    if (props.$hasError) return 'rgba(239, 68, 68, 0.1)';
    return 'white';
  }};

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
      
      // Simple validation - in a real app this would be more sophisticated
      if (value && value.trim() !== '') {
        const newCompleted = new Set(completedCells);
        newCompleted.add(cellRef);
        setCompletedCells(newCompleted);
        setScore(prev => prev + 10);
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

  const renderCell = (col: number, row: number) => {
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const cell = cells[cellRef];
    const isSelected = selectedCell?.col === col && selectedCell?.row === row;

    return (
      <DataCell
        key={cellRef}
        $isSelected={isSelected}
        $isCorrect={completedCells.has(cellRef)}
        onClick={() => handleCellClick(col, row)}
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
    <LBOContainer>
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