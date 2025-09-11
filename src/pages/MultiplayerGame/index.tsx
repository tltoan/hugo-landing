import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/shared/Header';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
`;

const GameInfoBar = styled.div`
  background: ${theme.colors.white};
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const GameInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 16px;
  color: ${theme.colors.text};
`;

const ExitButton = styled.button`
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

const GameContent = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  animation: ${fadeInUp} 0.8s ease-out 0.2s backwards;
`;

const GameTitle = styled.h2`
  font-size: 28px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  text-align: center;
  margin-bottom: 2rem;
`;

const PlayersSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: ${theme.colors.background};
  border-radius: 12px;
`;

const PlayerCard = styled.div<{ $isCurrentUser?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: ${props => props.$isCurrentUser ? theme.colors.buttonPrimary : theme.colors.white};
  color: ${props => props.$isCurrentUser ? theme.colors.white : theme.colors.text};
  border-radius: 8px;
  min-width: 120px;
`;

const PlayerName = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const PlayerScore = styled.div`
  font-size: 14px;
  opacity: 0.8;
`;

const GameArea = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
`;

const ComingSoonMessage = styled.div`
  text-align: center;
  color: ${theme.colors.text};
  font-size: 18px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${theme.colors.buttonPrimary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Mock data - will be replaced with real data
const mockPlayers = [
  { id: '1', name: 'You', score: 0, isCurrentUser: true },
  { id: '2', name: 'Player 2', score: 0, isCurrentUser: false },
];

const MultiplayerGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    // Simulate loading game data
    const timer = setTimeout(() => {
      setGameData({
        id: gameId,
        name: 'Sample Multiplayer Game',
        scenario: 'TechCorp LBO',
        players: mockPlayers
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameId]);

  const handleExitGame = () => {
    navigate('/multiplayer');
  };

  if (loading) {
    return (
      <PageContainer>
        <Header showNavigation={false} />
        <GameContent>
          <GameTitle>Joining Game...</GameTitle>
          <GameArea>
            <div>
              <LoadingSpinner />
              <ComingSoonMessage>
                Loading multiplayer game...
              </ComingSoonMessage>
            </div>
          </GameArea>
        </GameContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header showNavigation={false} />
      
      <GameInfoBar>
        <GameInfo>
          <span>🎮 {gameData?.name}</span>
          <span>📊 {gameData?.scenario}</span>
          <span>👥 {gameData?.players?.length} players</span>
        </GameInfo>
        <ExitButton onClick={handleExitGame}>Exit Game</ExitButton>
      </GameInfoBar>

      <GameContent>
        <GameTitle>Multiplayer LBO Racing</GameTitle>
        
        <PlayersSection>
          {gameData?.players?.map((player: any) => (
            <PlayerCard key={player.id} $isCurrentUser={player.isCurrentUser}>
              <PlayerName>{player.name}</PlayerName>
              <PlayerScore>Score: {player.score}</PlayerScore>
            </PlayerCard>
          ))}
        </PlayersSection>

        <GameArea>
          <ComingSoonMessage>
            <h3>🚧 Multiplayer Game Interface Coming Soon!</h3>
            <p>The real-time LBO modeling interface will be integrated here.</p>
            <p>Players will collaborate on the same spreadsheet model in real-time.</p>
          </ComingSoonMessage>
        </GameArea>
      </GameContent>
    </PageContainer>
  );
};

export default MultiplayerGamePage;