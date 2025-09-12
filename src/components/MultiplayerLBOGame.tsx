import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { multiplayerService } from '../services/supabaseMultiplayerService';
import { GamePlayer } from '../services/supabaseMultiplayerService';

const GameContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${theme.colors.white};
  border-radius: 12px;
  overflow: hidden;
`;

const RaceTracker = styled.div`
  padding: 1rem;
  background: ${theme.colors.background};
  border-bottom: 1px solid #e5e7eb;
`;

const RacePositions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const RacerRow = styled.div<{ $isCurrentUser?: boolean; $position: number }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: ${props => props.$isCurrentUser ? 'rgba(65, 83, 120, 0.1)' : theme.colors.white};
  border-radius: 8px;
  border: ${props => props.$isCurrentUser ? `2px solid ${theme.colors.primary}` : '1px solid #e5e7eb'};
`;

const Position = styled.div<{ $position: number }>`
  font-size: 20px;
  font-weight: bold;
  width: 40px;
  text-align: center;
  color: ${props => {
    if (props.$position === 1) return '#fbbf24';
    if (props.$position === 2) return '#9ca3af';
    if (props.$position === 3) return '#f59e0b';
    return theme.colors.text;
  }};
`;

const RacerName = styled.div`
  flex: 1;
  font-weight: 500;
`;

const ProgressBarContainer = styled.div`
  flex: 2;
  background: #e5e7eb;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ $progress: number; $isLeader?: boolean }>`
  height: 100%;
  background: ${props => props.$isLeader ? '#22c55e' : theme.colors.primary};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

const SpreadsheetContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Cell = styled.td<{ 
  $isHeader?: boolean; 
  $isActive?: boolean; 
  $isCompleted?: boolean;
}>`
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  background: ${props => {
    if (props.$isHeader) return theme.colors.background;
    if (props.$isActive) return 'rgba(65, 83, 120, 0.1)';
    if (props.$isCompleted) return '#f0fdf4';
    return theme.colors.white;
  }};
  font-weight: ${props => props.$isHeader ? '600' : 'normal'};
  position: relative;
  
  ${props => props.$isActive && `
    box-shadow: 0 0 0 2px ${theme.colors.primary};
  `}
`;

const CellInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
`;

const CompletionStatus = styled.div`
  text-align: center;
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.8;
`;

const CompletionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const CompletionCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  
  h2 {
    font-size: 48px;
    color: ${theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  .stats {
    display: flex;
    justify-content: space-around;
    margin: 2rem 0;
    
    .stat {
      div:first-child {
        font-size: 32px;
        font-weight: bold;
        color: ${theme.colors.primary};
      }
      div:last-child {
        font-size: 14px;
        color: ${theme.colors.text};
        opacity: 0.7;
        margin-top: 0.5rem;
      }
    }
  }
`;

const Timer = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.primary};
  text-align: center;
  margin-bottom: 1rem;
`;

interface CellData {
  id: string;
  value: string;
  formula?: string;
  answer?: string;
  locked?: boolean;
}

interface MultiplayerLBOGameProps {
  gameId: string;
  scenarioId: string;
  players: GamePlayer[];
  currentUserId: string;
  onComplete?: (score: number, accuracy: number) => void;
}

const MultiplayerLBOGame: React.FC<MultiplayerLBOGameProps> = ({ 
  gameId, 
  scenarioId, 
  players,
  currentUserId,
  onComplete 
}) => {
  const [cells, setCells] = useState<Record<string, CellData>>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [playerProgress, setPlayerProgress] = useState<Record<string, number>>({});
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalEditableCells, setTotalEditableCells] = useState(0);

  // Initialize spreadsheet structure based on scenario
  useEffect(() => {
    initializeSpreadsheet();
  }, [scenarioId]);

  // Update timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Update player progress from props
  useEffect(() => {
    const newProgress: Record<string, number> = {};
    players.forEach(player => {
      newProgress[player.user_id] = player.progress || 0;
    });
    setPlayerProgress(newProgress);
  }, [players]);

  const initializeSpreadsheet = () => {
    // Basic LBO model structure
    const initialCells: Record<string, CellData> = {
      'A1': { id: 'A1', value: 'LBO Model', locked: true },
      'A3': { id: 'A3', value: 'Revenue', locked: true },
      'B3': { id: 'B3', value: '100', locked: true },
      'C3': { id: 'C3', value: '', formula: '=B3*1.1', answer: '110' },
      'D3': { id: 'D3', value: '', formula: '=C3*1.1', answer: '121' },
      
      'A4': { id: 'A4', value: 'EBITDA Margin', locked: true },
      'B4': { id: 'B4', value: '20%', locked: true },
      'C4': { id: 'C4', value: '', formula: '=20%', answer: '20%' },
      'D4': { id: 'D4', value: '', formula: '=20%', answer: '20%' },
      
      'A5': { id: 'A5', value: 'EBITDA', locked: true },
      'B5': { id: 'B5', value: '', formula: '=B3*B4', answer: '20' },
      'C5': { id: 'C5', value: '', formula: '=C3*C4', answer: '22' },
      'D5': { id: 'D5', value: '', formula: '=D3*D4', answer: '24.2' },
      
      'A7': { id: 'A7', value: 'Entry Multiple', locked: true },
      'B7': { id: 'B7', value: '10x', locked: true },
      
      'A8': { id: 'A8', value: 'Enterprise Value', locked: true },
      'B8': { id: 'B8', value: '', formula: '=B5*10', answer: '200' },
      
      'A10': { id: 'A10', value: 'Exit Multiple', locked: true },
      'D10': { id: 'D10', value: '12x', locked: true },
      
      'A11': { id: 'A11', value: 'Exit Value', locked: true },
      'D11': { id: 'D11', value: '', formula: '=D5*12', answer: '290.4' },
      
      'A13': { id: 'A13', value: 'IRR', locked: true },
      'D13': { id: 'D13', value: '', formula: '=(D11/B8)^(1/3)-1', answer: '13.2%' },
    };

    setCells(initialCells);
    
    // Count editable cells
    const editableCount = Object.values(initialCells).filter(cell => !cell.locked && cell.answer).length;
    setTotalEditableCells(editableCount);
  };

  const handleCellChange = useCallback(async (cellId: string, value: string) => {
    const cell = cells[cellId];
    if (!cell || cell.locked || isCompleted) return;

    setCells(prev => ({
      ...prev,
      [cellId]: { ...prev[cellId], value }
    }));

    // Only check answer when user presses Enter or leaves the cell
    // This is handled in onBlur
  }, [cells, isCompleted]);

  const handleCellSubmit = useCallback(async (cellId: string) => {
    const cell = cells[cellId];
    if (!cell || cell.locked || !cell.answer || isCompleted) return;

    const userValue = cell.value.trim();
    if (!userValue) return;

    setTotalAttempts(prev => prev + 1);

    // Check if answer is correct (normalize the comparison)
    const isCorrect = normalizeAnswer(userValue) === normalizeAnswer(cell.answer);
    
    if (isCorrect) {
      setCorrectAttempts(prev => prev + 1);
      setCompletedCells(prev => {
        const newSet = new Set(prev);
        newSet.add(cellId);
        return newSet;
      });
      
      // Calculate progress
      const newCompletedCount = completedCells.size + 1;
      const progress = (newCompletedCount / totalEditableCells) * 100;
      
      // Calculate accuracy
      const accuracy = ((correctAttempts + 1) / (totalAttempts || 1)) * 100;
      
      // Calculate score (based on time and accuracy)
      const timeBonus = Math.max(0, 300 - elapsedTime); // Bonus for speed
      const score = Math.round((accuracy * 10) + timeBonus);
      
      // Update progress in database
      await multiplayerService.updatePlayerProgress(
        gameId,
        progress,
        score,
        accuracy,
        cellId
      );
      
      // Check if game is complete
      if (newCompletedCount === totalEditableCells) {
        await handleGameComplete(score, accuracy);
      }
    } else {
      // Show feedback for incorrect answer
      setCells(prev => ({
        ...prev,
        [cellId]: { ...prev[cellId], value: '' }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, completedCells, correctAttempts, totalAttempts, elapsedTime, totalEditableCells, gameId, isCompleted]);

  const normalizeAnswer = (value: string): string => {
    // Remove spaces, convert to lowercase, handle percentages
    let normalized = value.toLowerCase().replace(/\s/g, '');
    
    // Handle percentage formats (20% vs 0.2)
    if (normalized.includes('%')) {
      normalized = normalized.replace('%', '');
    }
    
    // Handle currency formats
    normalized = normalized.replace(/[$,]/g, '');
    
    return normalized;
  };

  const handleGameComplete = async (finalScore: number, finalAccuracy: number) => {
    setIsCompleted(true);
    
    // Complete game in database
    await multiplayerService.completeGameForPlayer(
      gameId,
      finalScore,
      finalAccuracy,
      elapsedTime
    );
    
    // Notify parent component
    if (onComplete) {
      onComplete(finalScore, finalAccuracy);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render spreadsheet cells
  const renderCell = (cellId: string) => {
    const cell = cells[cellId];
    if (!cell) return null;

    const isActive = activeCell === cellId;
    const isCompleted = completedCells.has(cellId);

    return (
      <Cell
        key={cellId}
        $isActive={isActive}
        $isCompleted={isCompleted}
        onClick={() => !cell.locked && !isCompleted && setActiveCell(cellId)}
      >
        {cell.locked ? (
          cell.value
        ) : isCompleted ? (
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ {cell.value}</span>
        ) : (
          <CellInput
            value={cell.value}
            placeholder={cell.formula}
            onChange={(e) => handleCellChange(cellId, e.target.value)}
            onFocus={() => setActiveCell(cellId)}
            onBlur={() => {
              setActiveCell(null);
              handleCellSubmit(cellId);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            disabled={isCompleted}
          />
        )}
      </Cell>
    );
  };

  // Sort players by progress
  const sortedPlayers = [...players].sort((a, b) => {
    const progressA = playerProgress[a.user_id] || a.progress || 0;
    const progressB = playerProgress[b.user_id] || b.progress || 0;
    return progressB - progressA;
  });

  return (
    <GameContainer>
      {isCompleted && (
        <CompletionOverlay>
          <CompletionCard>
            <h2>🎉 Completed!</h2>
            <div className="stats">
              <div className="stat">
                <div>{formatTime(elapsedTime)}</div>
                <div>Time</div>
              </div>
              <div className="stat">
                <div>{Math.round((correctAttempts / totalAttempts) * 100)}%</div>
                <div>Accuracy</div>
              </div>
              <div className="stat">
                <div>{Math.round((correctAttempts / totalAttempts) * 1000 + Math.max(0, 300 - elapsedTime))}</div>
                <div>Score</div>
              </div>
            </div>
            <p>Waiting for other players to finish...</p>
          </CompletionCard>
        </CompletionOverlay>
      )}
      
      <RaceTracker>
        <Timer>⏱️ {formatTime(elapsedTime)}</Timer>
        <RacePositions>
          {sortedPlayers.map((player, index) => {
            const progress = playerProgress[player.user_id] || player.progress || 0;
            const isCurrentUser = player.user_id === currentUserId;
            const position = index + 1;
            
            return (
              <RacerRow key={player.id} $isCurrentUser={isCurrentUser} $position={position}>
                <Position $position={position}>
                  {position === 1 && '🥇'}
                  {position === 2 && '🥈'}
                  {position === 3 && '🥉'}
                  {position > 3 && position}
                </Position>
                <RacerName>
                  {player.username} {isCurrentUser && '(You)'}
                </RacerName>
                <ProgressBarContainer>
                  <ProgressFill $progress={progress} $isLeader={position === 1}>
                    {Math.round(progress)}%
                  </ProgressFill>
                </ProgressBarContainer>
                <CompletionStatus>
                  {progress === 100 ? '✅ Finished!' : `${Math.round(progress)}%`}
                </CompletionStatus>
              </RacerRow>
            );
          })}
        </RacePositions>
      </RaceTracker>

      <SpreadsheetContainer>
        <Table>
          <tbody>
            <tr>
              <Cell $isHeader>A</Cell>
              <Cell $isHeader>B</Cell>
              <Cell $isHeader>C</Cell>
              <Cell $isHeader>D</Cell>
            </tr>
            {[1, 3, 4, 5, 7, 8, 10, 11, 13].map(row => (
              <tr key={row}>
                {['A', 'B', 'C', 'D'].map(col => renderCell(`${col}${row}`))}
              </tr>
            ))}
          </tbody>
        </Table>
      </SpreadsheetContainer>
    </GameContainer>
  );
};

export default MultiplayerLBOGame;