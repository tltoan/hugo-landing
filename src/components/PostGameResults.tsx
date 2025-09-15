import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { GamePlayer } from '../services/supabaseMultiplayerService';
import { AIPlayer } from '../services/aiPlayerService';
import { CellConfig, RacingTrack, getModelForTrack } from '../services/racingModels';

const ResultsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: auto;
  padding: 2rem;
`;

const ResultsCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 20px;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.buttonSecondary});
  color: white;
  padding: 2rem;
  text-align: center;
  border-radius: 20px 20px 0 0;
  
  h1 {
    font-size: 36px;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    font-size: 18px;
    opacity: 0.9;
  }
`;

const TabSection = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 1rem;
  background: ${props => props.$active ? theme.colors.white : 'transparent'};
  border: none;
  border-bottom: ${props => props.$active ? `3px solid ${theme.colors.primary}` : 'none'};
  font-weight: ${props => props.$active ? '600' : '400'};
  color: ${props => props.$active ? theme.colors.primary : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? theme.colors.white : 'rgba(0, 0, 0, 0.02)'};
  }
`;

const Content = styled.div`
  padding: 2rem;
`;

const Podium = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 3rem;
`;

const PodiumPlace = styled.div<{ $place: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 150px;
  
  .player-card {
    background: ${props => {
      if (props.$place === 1) return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
      if (props.$place === 2) return 'linear-gradient(135deg, #9ca3af, #6b7280)';
      if (props.$place === 3) return 'linear-gradient(135deg, #f97316, #ea580c)';
      return '#e5e7eb';
    }};
    color: white;
    padding: 1rem;
    border-radius: 10px;
    text-align: center;
    width: 100%;
    margin-bottom: 0.5rem;
    
    .name {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .score {
      font-size: 24px;
      font-weight: bold;
    }
    
    .accuracy {
      font-size: 14px;
      opacity: 0.9;
    }
  }
  
  .stand {
    background: ${props => {
      if (props.$place === 1) return '#fbbf24';
      if (props.$place === 2) return '#9ca3af';
      if (props.$place === 3) return '#f97316';
      return '#e5e7eb';
    }};
    height: ${props => {
      if (props.$place === 1) return '120px';
      if (props.$place === 2) return '80px';
      if (props.$place === 3) return '60px';
      return '40px';
    }};
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: white;
    font-weight: bold;
    border-radius: 10px 10px 0 0;
  }
`;

const MistakesSection = styled.div`
  margin-top: 2rem;
  
  h3 {
    color: ${theme.colors.primary};
    margin-bottom: 1rem;
    font-size: 20px;
  }
`;

const MistakeCard = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .cell-id {
    font-weight: bold;
    color: #dc2626;
    margin-bottom: 0.5rem;
  }
  
  .your-answer {
    color: #7f1d1d;
    margin-bottom: 0.5rem;
    
    span {
      background: #fee2e2;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  }
  
  .correct-answer {
    color: #14532d;
    margin-bottom: 0.5rem;
    
    span {
      background: #dcfce7;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  }
  
  .explanation {
    color: #4b5563;
    font-size: 14px;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
  }
`;

const LearningPoint = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  h4 {
    color: #1e40af;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &::before {
      content: "💡";
    }
  }
  
  p {
    color: #3b4863;
    line-height: 1.6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${props => props.$primary ? `
    background: ${theme.colors.primary};
    color: white;
    
    &:hover {
      background: ${theme.colors.buttonSecondary};
      transform: translateY(-2px);
    }
  ` : `
    background: white;
    color: ${theme.colors.primary};
    border: 2px solid ${theme.colors.primary};
    
    &:hover {
      background: #f0f9ff;
    }
  `}
`;

interface PostGameResultsProps {
  gameId: string;
  players: GamePlayer[];
  aiPlayer?: AIPlayer | null;
  currentUserId: string;
  track: RacingTrack;
  userMistakes: Array<{
    cellId: string;
    userAnswer: string;
    correctAnswer: string;
    attempts: number;
  }>;
  onRematch?: () => void;
  onClose?: () => void;
}

const PostGameResults: React.FC<PostGameResultsProps> = ({
  gameId,
  players,
  aiPlayer,
  currentUserId,
  track,
  userMistakes,
  onRematch,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'results' | 'mistakes' | 'learning'>('results');
  const [modelCells, setModelCells] = useState<CellConfig[]>([]);
  
  useEffect(() => {
    setModelCells(getModelForTrack(track));
  }, [track]);
  
  // Combine and sort all players
  const allPlayers = [
    ...players.map(p => ({
      id: p.id,
      name: p.username,
      score: p.score,
      accuracy: p.accuracy,
      progress: p.progress,
      isUser: p.user_id === currentUserId,
      isAI: false
    })),
    ...(aiPlayer ? [{
      id: aiPlayer.id,
      name: aiPlayer.name,
      score: aiPlayer.score,
      accuracy: aiPlayer.accuracy,
      progress: aiPlayer.progress,
      isUser: false,
      isAI: true
    }] : [])
  ].sort((a, b) => b.score - a.score);
  
  const topThree = allPlayers.slice(0, 3);
  const currentUserRank = allPlayers.findIndex(p => p.isUser) + 1;
  const currentUser = allPlayers.find(p => p.isUser);
  
  const getLearningPoints = () => {
    const points = [];
    
    // Analyze mistakes for patterns
    const formulaMistakes = userMistakes.filter(m => m.userAnswer && !m.userAnswer.startsWith('='));
    if (formulaMistakes.length > 0) {
      points.push({
        title: "Remember Formula Syntax",
        content: "Excel formulas always start with '='. For example, =B3*1.1 multiplies cell B3 by 1.1"
      });
    }
    
    const growthMistakes = userMistakes.filter(m => 
      m.cellId.includes('4') && (m.userAnswer.includes('0.1') || m.userAnswer.includes('+'))
    );
    if (growthMistakes.length > 0) {
      points.push({
        title: "Growth Rate Calculations",
        content: "To calculate 10% growth, multiply by 1.1 (not 0.1). The formula is: Original × (1 + Growth Rate)"
      });
    }
    
    const ebitdaMistakes = userMistakes.filter(m => m.cellId.includes('5') || m.cellId.includes('6'));
    if (ebitdaMistakes.length > 0) {
      points.push({
        title: "EBITDA Margin Application",
        content: "EBITDA = Revenue × EBITDA Margin. This shows operational profitability before financing decisions."
      });
    }
    
    return points;
  };
  
  const getExplanation = (cellId: string): string => {
    const cell = modelCells.find(c => c.id === cellId);
    if (!cell) return '';
    
    // Provide context-specific explanations
    if (cellId.includes('4')) {
      return "Revenue projections typically use consistent growth rates. This creates the hockey-stick growth pattern common in LBO models.";
    }
    if (cellId.includes('5') || cellId.includes('6')) {
      return "EBITDA margins are kept constant in simple models but can vary with scale in advanced models.";
    }
    if (cellId.includes('8') || cellId.includes('9')) {
      return "Enterprise Value = EBITDA × Multiple. This is how PE firms value companies.";
    }
    if (cellId.includes('13')) {
      return "IRR measures annualized returns. PE firms typically target 20%+ IRR on investments.";
    }
    
    return cell.hint || "This calculation is part of the LBO model structure.";
  };
  
  return (
    <ResultsOverlay>
      <ResultsCard>
        <Header>
          <h1>🏁 Race Complete!</h1>
          <div className="subtitle">
            {track.charAt(0).toUpperCase() + track.slice(1)} Track Challenge
          </div>
        </Header>
        
        <TabSection>
          <Tab $active={activeTab === 'results'} onClick={() => setActiveTab('results')}>
            🏆 Results
          </Tab>
          <Tab $active={activeTab === 'mistakes'} onClick={() => setActiveTab('mistakes')}>
            📝 Your Mistakes ({userMistakes.length})
          </Tab>
          <Tab $active={activeTab === 'learning'} onClick={() => setActiveTab('learning')}>
            💡 Key Learnings
          </Tab>
        </TabSection>
        
        <Content>
          {activeTab === 'results' && (
            <>
              <Podium>
                {topThree[1] && (
                  <PodiumPlace $place={2}>
                    <div className="player-card">
                      <div className="name">{topThree[1].name}</div>
                      <div className="score">{topThree[1].score}</div>
                      <div className="accuracy">{topThree[1].accuracy.toFixed(1)}% accurate</div>
                    </div>
                    <div className="stand">2</div>
                  </PodiumPlace>
                )}
                {topThree[0] && (
                  <PodiumPlace $place={1}>
                    <div className="player-card">
                      <div className="name">{topThree[0].name}</div>
                      <div className="score">{topThree[0].score}</div>
                      <div className="accuracy">{topThree[0].accuracy.toFixed(1)}% accurate</div>
                    </div>
                    <div className="stand">1</div>
                  </PodiumPlace>
                )}
                {topThree[2] && (
                  <PodiumPlace $place={3}>
                    <div className="player-card">
                      <div className="name">{topThree[2].name}</div>
                      <div className="score">{topThree[2].score}</div>
                      <div className="accuracy">{topThree[2].accuracy.toFixed(1)}% accurate</div>
                    </div>
                    <div className="stand">3</div>
                  </PodiumPlace>
                )}
              </Podium>
              
              {currentUser && currentUserRank > 3 && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <h3>Your Position</h3>
                  <p style={{ fontSize: '24px', color: theme.colors.primary }}>
                    #{currentUserRank} out of {allPlayers.length}
                  </p>
                  <p>Score: {currentUser.score} | Accuracy: {currentUser.accuracy.toFixed(1)}%</p>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'mistakes' && (
            <MistakesSection>
              <h3>Review Your Mistakes</h3>
              {userMistakes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#22c55e', fontSize: '18px' }}>
                  🎉 Perfect run! No mistakes!
                </p>
              ) : (
                userMistakes.map((mistake, index) => (
                  <MistakeCard key={index}>
                    <div className="cell-id">Cell {mistake.cellId}</div>
                    <div className="your-answer">
                      Your answer: <span>{mistake.userAnswer || '(empty)'}</span>
                    </div>
                    <div className="correct-answer">
                      Correct answer: <span>{mistake.correctAnswer}</span>
                    </div>
                    <div className="explanation">
                      {getExplanation(mistake.cellId)}
                    </div>
                  </MistakeCard>
                ))
              )}
            </MistakesSection>
          )}
          
          {activeTab === 'learning' && (
            <MistakesSection>
              <h3>Key Takeaways</h3>
              {getLearningPoints().map((point, index) => (
                <LearningPoint key={index}>
                  <h4>{point.title}</h4>
                  <p>{point.content}</p>
                </LearningPoint>
              ))}
              
              <LearningPoint>
                <h4>LBO Model Structure</h4>
                <p>
                  The model follows this flow: Revenue → EBITDA → Enterprise Value → Equity Returns.
                  Each step builds on the previous, creating a complete picture of the investment.
                </p>
              </LearningPoint>
              
              <LearningPoint>
                <h4>Speed vs Accuracy Trade-off</h4>
                <p>
                  In real PE work, accuracy is more important than speed. Take time to double-check 
                  formulas, especially in complex models where errors compound.
                </p>
              </LearningPoint>
            </MistakesSection>
          )}
        </Content>
        
        <ButtonGroup>
          {onRematch && (
            <Button $primary onClick={onRematch}>
              🔄 Rematch
            </Button>
          )}
          <Button onClick={onClose}>
            Back to Lobby
          </Button>
        </ButtonGroup>
      </ResultsCard>
    </ResultsOverlay>
  );
};

export default PostGameResults;