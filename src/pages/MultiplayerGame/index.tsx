import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/shared/Header';
import { multiplayerService, MultiplayerGame, GamePlayer } from '../../services/supabaseMultiplayerService';
import MultiplayerLBOGame from '../../components/MultiplayerLBOGame';

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

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
`;

const GameInfoBar = styled.div`
  background: transparent;
  border-bottom: 1px solid rgba(229, 231, 235, 0.3);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GameInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 16px;
  color: ${theme.colors.text};
`;

const ExitButton = styled.button`
  padding: 10px 20px;
  background-color: transparent;
  color: ${theme.colors.primary};
  border: 2px solid ${theme.colors.primary};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
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
  flex-wrap: wrap;
`;

const PlayerCard = styled.div<{ $isCurrentUser?: boolean; $isReady?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: ${props => 
    props.$isCurrentUser ? theme.colors.buttonPrimary : 
    props.$isReady ? '#22c55e' : 
    theme.colors.white
  };
  color: ${props => (props.$isCurrentUser || props.$isReady) ? theme.colors.white : theme.colors.text};
  border-radius: 8px;
  min-width: 150px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const PlayerName = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 16px;
`;

const PlayerScore = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const PlayerStatus = styled.div`
  font-size: 12px;
  margin-top: 0.5rem;
  padding: 2px 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
`;

const GameArea = styled.div`
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.background};
  border-radius: 12px;
  padding: 2rem;
`;

const ComingSoonMessage = styled.div`
  text-align: center;
  color: ${theme.colors.text};
  
  h3 {
    font-size: 24px;
    margin-bottom: 1rem;
    color: ${theme.colors.primary};
  }
  
  p {
    opacity: 0.8;
    margin-bottom: 0.5rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${theme.colors.primary};
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 1rem;
  text-align: center;
  max-width: 600px;
  margin: 2rem auto;
`;

const EmptySlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(65, 83, 120, 0.05);
  border: 2px dashed rgba(65, 83, 120, 0.2);
  border-radius: 8px;
  min-width: 150px;
  min-height: 100px;
  
  span {
    color: ${theme.colors.text};
    opacity: 0.5;
    font-size: 14px;
  }
`;

const GameStatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(65, 83, 120, 0.05);
  border-radius: 10px;
`;

const StatusText = styled.div`
  font-size: 16px;
  color: ${theme.colors.text};
  
  strong {
    color: ${theme.colors.primary};
  }
`;

const ActionButton = styled.button<{ $isReady?: boolean }>`
  padding: 10px 24px;
  background: ${props => props.$isReady ? '#22c55e' : theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CountdownOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeInUp} 0.3s ease-out;
`;

const CountdownNumber = styled.div`
  font-size: 120px;
  font-weight: bold;
  color: ${theme.colors.white};
  text-shadow: 0 0 40px rgba(65, 83, 120, 0.8);
  animation: ${fadeInUp} 0.5s ease-out;
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  animation: pulse 1s ease-in-out;
`;

const CountdownText = styled.div`
  font-size: 24px;
  color: ${theme.colors.white};
  margin-top: 20px;
  text-align: center;
`;

const MultiplayerGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<MultiplayerGame | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError('No game ID provided');
      setLoading(false);
      return;
    }

    loadGameData();
    
    // Subscribe to real-time updates
    const channel = multiplayerService.subscribeToGame(gameId, (payload) => {
      console.log('Game update received:', payload);
      // Reload game data when there's an update
      loadGameData();
    });

    // Cleanup on unmount
    return () => {
      multiplayerService.unsubscribeFromGame(gameId);
    };
  }, [gameId]);

  // Countdown effect when all players are ready
  useEffect(() => {
    if (!game || !isCreator || game.status !== 'waiting') {
      setCountdown(null);
      return;
    }

    // Check if all players are ready (minimum 2 players)
    const allReady = players.length >= 2 && players.every(p => p.is_ready);
    
    if (allReady && countdown === null) {
      // Start countdown
      setCountdown(5);
    } else if (!allReady && countdown !== null) {
      // Cancel countdown if someone becomes not ready
      setCountdown(null);
    }
  }, [players, game, isCreator, countdown]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        // Auto-start the game
        handleStartGame();
        setCountdown(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const loadGameData = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { game: gameData, players: gamePlayers } = await multiplayerService.getGameDetails(gameId);
      
      if (!gameData) {
        setError('Game not found');
        setLoading(false);
        return;
      }
      
      setGame(gameData);
      setPlayers(gamePlayers);
      setIsCreator(gameData.created_by === user?.id);
      
    } catch (err) {
      console.error('Error loading game:', err);
      setError('Failed to load game data');
    } finally {
      setLoading(false);
    }
  };

  const handleExitGame = async () => {
    if (!gameId || !user) return;
    
    try {
      // Leave the game
      const success = await multiplayerService.leaveGame(gameId);
      if (success) {
        navigate('/multiplayer');
      } else {
        setError('Failed to leave game');
      }
    } catch (err) {
      console.error('Error leaving game:', err);
      setError('An error occurred while leaving the game');
    }
  };

  const handleStartGame = async () => {
    if (!gameId || !isCreator) return;
    
    try {
      const success = await multiplayerService.startGame(gameId);
      if (success) {
        // Reload game data to reflect the status change
        await loadGameData();
      } else {
        setError('Failed to start game');
      }
    } catch (err) {
      console.error('Error starting game:', err);
      setError('An error occurred while starting the game');
    }
  };

  const handleToggleReady = async () => {
    if (!gameId || !user) return;
    
    // Find current player
    const currentPlayer = players.find(p => p.user_id === user.id);
    if (!currentPlayer) return;
    
    try {
      const success = await multiplayerService.togglePlayerReady(gameId, !currentPlayer.is_ready);
      if (success) {
        // Reload game data to reflect the status change
        await loadGameData();
      } else {
        setError('Failed to update ready status');
      }
    } catch (err) {
      console.error('Error toggling ready status:', err);
      setError('An error occurred while updating ready status');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header showNavigation={false} />
        <GameContent>
          <LoadingContainer>
            <LoadingSpinner />
            <div>Loading game...</div>
          </LoadingContainer>
        </GameContent>
      </PageContainer>
    );
  }

  if (error || !game) {
    return (
      <PageContainer>
        <Header showNavigation={false} />
        <GameContent>
          <ErrorMessage>
            {error || 'Game not found'}
          </ErrorMessage>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <ActionButton onClick={() => navigate('/multiplayer')}>
              Back to Lobby
            </ActionButton>
          </div>
        </GameContent>
      </PageContainer>
    );
  }

  // Create empty slots for remaining player spots
  const emptySlots = [];
  for (let i = players.length; i < game.max_players; i++) {
    emptySlots.push(
      <EmptySlot key={`empty-${i}`}>
        <span>🎮</span>
        <span>Waiting for player...</span>
      </EmptySlot>
    );
  }

  return (
    <PageContainer>
      <Header showNavigation={false} />
      
      {countdown !== null && (
        <CountdownOverlay>
          <div>
            <CountdownNumber>{countdown}</CountdownNumber>
            <CountdownText>Game starting...</CountdownText>
          </div>
        </CountdownOverlay>
      )}
      
      <GameInfoBar>
        <GameInfo>
          <span>🎮 {game.name}</span>
          <span>📊 {game.scenario_name}</span>
          <span>👥 {players.length}/{game.max_players} players</span>
          <span>
            {game.status === 'waiting' && '⏳ Waiting to start'}
            {game.status === 'in_progress' && '🏁 In Progress'}
            {game.status === 'completed' && '✅ Completed'}
          </span>
        </GameInfo>
        <ExitButton onClick={handleExitGame}>
          {game.status === 'waiting' ? 'Leave Game' : 'Exit Game'}
        </ExitButton>
      </GameInfoBar>

      <GameContent>
        <GameTitle>{game.name}</GameTitle>
        
        {game.status === 'waiting' && (
          <GameStatusBar>
            <StatusText>
              Waiting for players to join... <strong>{players.length}/{game.max_players}</strong> players | <strong>{players.filter(p => p.is_ready).length}</strong> ready
            </StatusText>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {!players.find(p => p.user_id === user?.id)?.is_ready && (
                <ActionButton 
                  onClick={handleToggleReady}
                  $isReady={false}
                >
                  Mark as Ready
                </ActionButton>
              )}
              {players.find(p => p.user_id === user?.id)?.is_ready && !isCreator && (
                <ActionButton 
                  onClick={handleToggleReady}
                  $isReady={true}
                >
                  ✅ Ready
                </ActionButton>
              )}
              {isCreator && (
                <ActionButton 
                  onClick={handleStartGame}
                  disabled={players.length < 2 || players.some(p => !p.is_ready)}
                >
                  {players.length < 2 ? 'Need 2+ Players' : 
                   players.some(p => !p.is_ready) ? 'Waiting for All Ready' : 
                   'Start Game 🚀'}
                </ActionButton>
              )}
            </div>
          </GameStatusBar>
        )}
        
        <PlayersSection>
          {players.map((player) => (
            <PlayerCard 
              key={player.id} 
              $isCurrentUser={player.user_id === user?.id}
              $isReady={player.is_ready}
            >
              <PlayerName>
                {player.username}
                {player.user_id === game.created_by && ' 👑'}
              </PlayerName>
              <PlayerScore>Score: {player.score}</PlayerScore>
              {game.status === 'waiting' && (
                <PlayerStatus>
                  {player.is_ready ? '✅ Ready' : '⏳ Not Ready'}
                </PlayerStatus>
              )}
              {game.status === 'in_progress' && (
                <PlayerStatus>
                  Progress: {Math.round(player.progress)}%
                </PlayerStatus>
              )}
            </PlayerCard>
          ))}
          {game.status === 'waiting' && emptySlots}
        </PlayersSection>

        <GameArea>
          {game.status === 'waiting' && (
            <ComingSoonMessage>
              <h3>⏳ Waiting for Game to Start</h3>
              <p>The game will begin once the host starts it.</p>
              <p>Minimum 2 players required to begin.</p>
            </ComingSoonMessage>
          )}
          
          {game.status === 'in_progress' && user && (
            <MultiplayerLBOGame
              gameId={game.id}
              scenarioId={game.scenario_id || 'techcorp'}
              players={players}
              currentUserId={user.id}
              onComplete={(score, accuracy) => {
                console.log('Game completed!', { score, accuracy });
                // Handle game completion
              }}
            />
          )}
          
          {game.status === 'completed' && (
            <ComingSoonMessage>
              <h3>🏆 Game Completed!</h3>
              <p>Final scores and rankings will be displayed here.</p>
            </ComingSoonMessage>
          )}
        </GameArea>
      </GameContent>
    </PageContainer>
  );
};

export default MultiplayerGamePage;