import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { multiplayerService } from '../services/supabaseMultiplayerService';
import { GamePlayer } from '../services/supabaseMultiplayerService';
import { AIPlayer } from '../services/aiPlayerService';
import { RacingTrack, getModelForTrack, validateAnswer, getRandomScenarioName } from '../services/racingModels';
import PostGameResults from './PostGameResults';

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

const Legend = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  align-items: center;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .sample {
      width: 24px;
      height: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
    }
    
    .editable {
      background: #fffbf0;
      border: 1px dashed #d97706;
    }
    
    .completed {
      background: #f0fdf4;
    }
    
    .hint {
      background: white;
      position: relative;
      
      &::after {
        content: "?";
        position: absolute;
        top: 1px;
        right: 1px;
        width: 10px;
        height: 10px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        font-size: 7px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
    }
  }
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
  $isSection?: boolean;
  $hasHint?: boolean;
  $hasError?: boolean;
  $isEditable?: boolean;
  $colspan?: number;
}>`
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  background: ${props => {
    if (props.$isSection) return 'rgba(65, 83, 120, 0.08)';
    if (props.$isHeader) return theme.colors.background;
    if (props.$isCompleted) return '#f0fdf4';
    if (props.$hasError) return 'rgba(239, 68, 68, 0.1)';
    if (props.$isActive) return 'rgba(65, 83, 120, 0.1)';
    if (props.$isEditable) return '#fffbf0'; // Light yellow for editable cells
    return theme.colors.white;
  }};
  font-weight: ${props => (props.$isHeader || props.$isSection) ? '600' : 'normal'};
  position: relative;
  text-align: ${props => (props.$isSection || props.$isHeader) ? 'center' : 'left'};
  font-size: ${props => props.$isSection ? '12px' : '14px'};
  text-transform: ${props => props.$isSection ? 'uppercase' : 'none'};
  letter-spacing: ${props => props.$isSection ? '0.5px' : 'normal'};
  color: ${props => props.$isSection ? theme.colors.primary : 'inherit'};
  min-width: ${props => props.$isHeader ? '40px' : 'auto'};
  cursor: ${props => props.$isEditable && !props.$isCompleted ? 'pointer' : 'default'};
  
  ${props => props.$isActive && `
    box-shadow: 0 0 0 2px ${theme.colors.primary};
  `}
  
  ${props => props.$isEditable && !props.$isCompleted && `
    border: 1px dashed #d97706;
    &:hover {
      background: #fef3c7;
    }
  `}
  
  ${props => props.$hasHint && `
    &::after {
      content: "?";
      position: absolute;
      top: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      font-size: 9px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  `}
`;

const CellInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: ${props => props.$hasError ? '#dc2626' : 'inherit'};
  
  &::placeholder {
    color: #9ca3af;
    font-style: italic;
    font-size: 12px;
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
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 20px;
    width: 10px;
    height: 10px;
    background: ${props => props.$isError ? '#ef4444' : theme.colors.primary};
    transform: rotate(45deg);
  }
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
  hint?: string;
  hasError?: boolean;
}

interface MultiplayerLBOGameProps {
  gameId: string;
  scenarioId: string;
  players: GamePlayer[];
  currentUserId: string;
  aiPlayer?: AIPlayer | null;
  track?: RacingTrack;
  onComplete?: (score: number, accuracy: number) => void;
}

const MultiplayerLBOGame: React.FC<MultiplayerLBOGameProps> = ({ 
  gameId, 
  scenarioId, 
  players,
  currentUserId,
  aiPlayer,
  track = 'sprint',
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
  const [showHint, setShowHint] = useState<{cellId: string; text: string; x: number; y: number; isError?: boolean} | null>(null);
  const [hintUsage, setHintUsage] = useState<Record<string, number>>({});
  const [userMistakes, setUserMistakes] = useState<Array<{cellId: string; userAnswer: string; correctAnswer: string; attempts: number}>>([]);
  const [showPostGameResults, setShowPostGameResults] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Initialize spreadsheet structure based on track
  useEffect(() => {
    initializeSpreadsheet();
  }, [track]);

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
    // Get model based on selected track
    const modelCells = getModelForTrack(track);
    const scenarioName = getRandomScenarioName();
    
    // Convert model to spreadsheet cells preserving original layout
    const initialCells: Record<string, CellData> = {
      'A1': { id: 'A1', value: `${scenarioName} - ${track.charAt(0).toUpperCase() + track.slice(1)} Track`, locked: true },
    };
    
    // For racing models, we'll use the original cell positions from the model
    // but add section headers in between
    modelCells.forEach((cell) => {
      // Use the original cell ID from the model
      initialCells[cell.id] = {
        id: cell.id,
        value: cell.locked ? (cell.label || cell.answer || '') : '',
        formula: cell.formula,
        answer: cell.answer,
        locked: cell.locked,
        hint: cell.hint,
        hasError: false
      };
    });
    
    setCells(initialCells);
    
    // Count editable cells
    const editableCount = modelCells.filter(cell => !cell.locked).length;
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

    // Check if answer is correct using the validateAnswer function
    const isCorrect = validateAnswer(userValue, cell.answer || '');
    
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
      // Track the mistake
      setUserMistakes(prev => {
        const existingMistake = prev.find(m => m.cellId === cellId);
        if (existingMistake) {
          return prev.map(m => 
            m.cellId === cellId 
              ? { ...m, attempts: m.attempts + 1, userAnswer: userValue }
              : m
          );
        } else {
          return [...prev, {
            cellId,
            userAnswer: userValue,
            correctAnswer: cell.answer || '',
            attempts: 1
          }];
        }
      });
      
      // Show feedback for incorrect answer
      setCells(prev => ({
        ...prev,
        [cellId]: { ...prev[cellId], hasError: true }
      }));
      
      // Show error hint if available
      if (cell?.hint) {
        const rect = document.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect();
        if (rect) {
          setShowHint({
            cellId,
            text: `Incorrect! Hint: ${cell.hint}`,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 10,
            isError: true
          });
          
          setTimeout(() => setShowHint(null), 3000);
        }
      }
      
      // Clear error state after 2 seconds
      setTimeout(() => {
        setCells(prev => ({
          ...prev,
          [cellId]: { ...prev[cellId], hasError: false }
        }));
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, completedCells, correctAttempts, totalAttempts, elapsedTime, totalEditableCells, gameId, isCompleted]);

  const normalizeAnswer = (value: string): string => {
    // Use the validateAnswer function from racingModels
    return value.toLowerCase().replace(/\s/g, '').replace(/[$,]/g, '').replace('%', '');
  };

  const handleGameComplete = async (finalScore: number, finalAccuracy: number) => {
    setIsCompleted(true);
    setGameCompleted(true);
    
    // Complete game in database
    await multiplayerService.completeGameForPlayer(
      gameId,
      finalScore,
      finalAccuracy,
      elapsedTime
    );
    
    // Show post-game results after a short delay
    setTimeout(() => {
      setShowPostGameResults(true);
    }, 2000);
    
    // Notify parent component
    if (onComplete) {
      onComplete(finalScore, finalAccuracy);
    }
  };
  
  const handleRematch = () => {
    // Reset game state for rematch
    setIsCompleted(false);
    setGameCompleted(false);
    setShowPostGameResults(false);
    setCompletedCells(new Set());
    setUserMistakes([]);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    initializeSpreadsheet();
    
    // TODO: Create new game with same players
  };
  
  const handleCloseResults = () => {
    setShowPostGameResults(false);
    // Navigate back to lobby or handle as needed
    if (onComplete) {
      onComplete(0, 0); // Signal to parent to handle navigation
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle right-click for hints
  const handleCellRightClick = (e: React.MouseEvent, cellId: string) => {
    e.preventDefault();
    
    const cell = cells[cellId];
    if (cell?.hint && !cell.locked && !completedCells.has(cellId)) {
      const attemptCount = hintUsage[cellId] || 0;
      
      setShowHint({
        cellId,
        text: cell.hint,
        x: e.clientX - 10,
        y: e.clientY + 20,
        isError: false
      });
      
      // Track hint usage
      setHintUsage(prev => ({
        ...prev,
        [cellId]: attemptCount + 1
      }));
      
      // Hide after 5 seconds
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  // Render spreadsheet cells
  const renderCell = (cellId: string) => {
    const cell = cells[cellId];
    if (!cell) return <Cell key={cellId}></Cell>; // Empty cell

    const isActive = activeCell === cellId;
    const isCompleted = completedCells.has(cellId);
    const hasHint = !!(cell?.hint && !cell.locked && !isCompleted);
    const isEditable = !!(cell?.answer && !cell.locked);

    return (
      <Cell
        key={cellId}
        data-cell={cellId}
        $isActive={isActive}
        $isCompleted={isCompleted}
        $hasHint={hasHint}
        $hasError={cell.hasError}
        $isEditable={isEditable}
        onClick={() => !cell.locked && !isCompleted && setActiveCell(cellId)}
        onContextMenu={(e) => handleCellRightClick(e, cellId)}
      >
        {cell.locked ? (
          cell.value
        ) : isCompleted ? (
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ {cell.value}</span>
        ) : (
          <CellInput
            value={cell.value}
            placeholder=""
            $hasError={cell.hasError}
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

  // Combine human and AI players for display
  const allPlayers = [
    ...players.map(p => ({
      id: p.id,
      name: p.username,
      progress: playerProgress[p.user_id] || p.progress || 0,
      isCurrentUser: p.user_id === currentUserId,
      isAI: false
    })),
    ...(aiPlayer ? [{
      id: aiPlayer.id,
      name: aiPlayer.name,
      progress: aiPlayer.progress,
      isCurrentUser: false,
      isAI: true
    }] : [])
  ];
  
  // Sort all players by progress
  const sortedPlayers = allPlayers.sort((a, b) => b.progress - a.progress);

  return (
    <>
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
            const position = index + 1;
            
            return (
              <RacerRow key={player.id} $isCurrentUser={player.isCurrentUser} $position={position}>
                <Position $position={position}>
                  {position === 1 && '🥇'}
                  {position === 2 && '🥈'}
                  {position === 3 && '🥉'}
                  {position > 3 && position}
                </Position>
                <RacerName>
                  {player.name} {player.isCurrentUser && '(You)'}
                </RacerName>
                <ProgressBarContainer>
                  <ProgressFill $progress={player.progress} $isLeader={position === 1}>
                    {Math.round(player.progress)}%
                  </ProgressFill>
                </ProgressBarContainer>
                <CompletionStatus>
                  {player.progress === 100 ? '✅ Finished!' : `${Math.round(player.progress)}%`}
                </CompletionStatus>
              </RacerRow>
            );
          })}
        </RacePositions>
      </RaceTracker>

      <Legend>
        <div className="legend-item">
          <div className="sample editable"></div>
          <span>Needs to be filled</span>
        </div>
        <div className="legend-item">
          <div className="sample completed"></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="sample hint"></div>
          <span>Right-click for hint</span>
        </div>
        <div className="legend-item">
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            Press Enter or Tab to submit • Click cells to edit
          </span>
        </div>
      </Legend>

      <SpreadsheetContainer>
        <Table>
          <tbody>
            {/* Dynamic column headers */}
            {(() => {
              // Determine columns needed
              const columnLetters = new Set<string>();
              Object.keys(cells).forEach(key => {
                if (!key.startsWith('SECTION_')) {
                  const match = key.match(/([A-Z])(\d+)/);
                  if (match) {
                    columnLetters.add(match[1]);
                  }
                }
              });
              
              const allCols = Array.from(columnLetters).sort();
              const maxCol = allCols.length > 0 ? allCols[allCols.length - 1] : 'D';
              const colsToShow: string[] = [];
              for (let i = 65; i <= Math.max(68, maxCol.charCodeAt(0)); i++) {
                colsToShow.push(String.fromCharCode(i));
              }
              
              return (
                <>
                  <tr>
                    <Cell $isHeader></Cell>
                    {colsToShow.map(col => (
                      <Cell key={col} $isHeader>{col}</Cell>
                    ))}
                  </tr>
                  {/* Title row */}
                  <tr>
                    <Cell $isHeader>1</Cell>
                    <Cell colSpan={colsToShow.length}>{cells['A1']?.value}</Cell>
                  </tr>
                </>
              );
            })()}
            {/* Dynamic rows based on cells */}
            {(() => {
              // Get all unique rows and columns from cells
              const rowNumbers = new Set<number>();
              const columnLetters = new Set<string>();
              
              Object.keys(cells).forEach(key => {
                if (key !== 'A1' && !key.startsWith('SECTION_')) {
                  const match = key.match(/([A-Z])(\d+)/);
                  if (match) {
                    columnLetters.add(match[1]);
                    rowNumbers.add(parseInt(match[2]));
                  }
                }
              });
              
              // Sort rows and columns
              const allRows = Array.from(rowNumbers).sort((a, b) => a - b);
              const allCols = Array.from(columnLetters).sort();
              
              // Determine max columns to show (at least D, but more if needed)
              const maxCol = allCols.length > 0 ? allCols[allCols.length - 1] : 'D';
              const colsToShow: string[] = [];
              for (let i = 65; i <= Math.max(68, maxCol.charCodeAt(0)); i++) {
                colsToShow.push(String.fromCharCode(i));
              }
              
              return allRows.map(row => {
                // Check if this row has a section header in column A
                const cellA = cells[`A${row}`];
                const isSection = cellA?.value?.startsWith('━━━') || false;
                
                if (isSection && cellA) {
                  // Render section header row
                  return (
                    <tr key={`section_${row}`}>
                      <Cell $isHeader>{row}</Cell>
                      <Cell $isSection colSpan={colsToShow.length}>
                        {cellA.value}
                      </Cell>
                    </tr>
                  );
                }
                
                // Regular data row
                return (
                  <tr key={row}>
                    <Cell $isHeader>{row}</Cell>
                    {colsToShow.map(col => renderCell(`${col}${row}`))}
                  </tr>
                );
              });
            })()}
          </tbody>
        </Table>
      </SpreadsheetContainer>
    </GameContainer>
    
    {/* Hint Tooltip */}
    {showHint && (
      <HintTooltip
        $isError={showHint.isError}
        style={{
          left: `${showHint.x}px`,
          top: `${showHint.y}px`
        }}
        onMouseLeave={() => !showHint.isError && setShowHint(null)}
      >
        {showHint.text}
      </HintTooltip>
    )}
    
    {/* Post-Game Results */}
    {showPostGameResults && (
      <PostGameResults
        gameId={gameId}
        players={players}
        aiPlayer={aiPlayer}
        currentUserId={currentUserId}
        track={track}
        userMistakes={userMistakes}
        onRematch={handleRematch}
        onClose={handleCloseResults}
      />
    )}
    </>
  );
};

export default MultiplayerLBOGame;