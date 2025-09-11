import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { multiplayerService, MultiplayerGame } from '../../services/supabaseMultiplayerService';
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

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
`;

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 48px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 2rem;
  text-align: center;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const TabSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  animation: ${fadeInUp} 0.6s ease-out 0.1s backwards;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  padding: 12px 24px;
  background: ${props => props.$active ? theme.colors.buttonPrimary : theme.colors.white};
  color: ${props => props.$active ? theme.colors.white : theme.colors.text};
  border: 2px solid ${theme.colors.buttonPrimary};
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.2);
  }
`;

const SectionCard = styled.div<{ delay?: number }>`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  animation: ${fadeInUp} 0.6s ease-out ${props => (props.delay || 3) * 0.1}s backwards;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 15px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(65, 83, 120, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 15px;
  font-size: 16px;
  background: ${theme.colors.white};
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(65, 83, 120, 0.1);
  }
`;

const CreateButton = styled.button`
  padding: 12px 32px;
  background: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 20px;
  font-size: 16px;
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

const GamesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const GameCard = styled.div`
  background: ${theme.colors.white};
  border: 2px solid #e5e7eb;
  border-radius: 15px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.1);
  }
`;

const GameInfo = styled.div`
  flex: 1;
`;

const GameName = styled.h3`
  font-size: 18px;
  color: ${theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const GameMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.8;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'waiting': return '#22c55e';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#94a3b8';
      default: return theme.colors.primary;
    }
  }};
  color: white;
`;

const JoinButton = styled.button`
  padding: 10px 24px;
  background: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid ${theme.colors.primary};
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${theme.colors.text};
  opacity: 0.6;
`;

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 1rem;
  text-align: center;
`;

type TabType = 'lobby' | 'leaderboard' | 'practice';

const MultiplayerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('lobby');
  const [gameName, setGameName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('techcorp');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [games, setGames] = useState<MultiplayerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
    
    // Subscribe to real-time updates
    const channel = multiplayerService.subscribeToLobby((payload) => {
      console.log('Real-time update received:', payload);
      // Reload games when there's an update
      loadGames();
    });

    // Cleanup on unmount
    return () => {
      multiplayerService.unsubscribeFromLobby();
    };
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeGames = await multiplayerService.getActiveGames();
      setGames(activeGames);
    } catch (error) {
      console.error('Error loading games:', error);
      setError('Failed to load games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScenarioName = (scenarioId: string): string => {
    const scenarios: Record<string, string> = {
      'techcorp': 'TechCorp LBO',
      'retailmax': 'RetailMax Buyout',
      'manufacturing': 'Manufacturing Giant',
      'healthcare': 'Healthcare Services',
      'energy': 'Energy Conglomerate'
    };
    return scenarios[scenarioId] || 'Unknown Scenario';
  };

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      setError('Please enter a game name');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const game = await multiplayerService.createGame(
        gameName, 
        selectedScenario,
        getScenarioName(selectedScenario),
        4
      );
      
      if (game) {
        setSuccess('Game created successfully!');
        setGameName('');
        // Navigate to the game
        setTimeout(() => {
          navigate(`/multiplayer/game/${game.id}`);
        }, 500);
      } else {
        setError('Failed to create game. Please try again.');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('An error occurred while creating the game.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    setIsJoining(gameId);
    setError(null);
    
    try {
      const success = await multiplayerService.joinGame(gameId);
      if (success) {
        // Navigate to the game
        navigate(`/multiplayer/game/${gameId}`);
      } else {
        setError('Unable to join game. It may be full or already started.');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setError('An error occurred while joining the game.');
    } finally {
      setIsJoining(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <PageContainer>
      <Header />
      
      <Content>
        <PageTitle>🏆 Multiplayer Racing</PageTitle>
        
        <TabSection>
          <TabButton 
            $active={activeTab === 'lobby'} 
            onClick={() => setActiveTab('lobby')}
          >
            Game Lobby
          </TabButton>
          <TabButton 
            $active={activeTab === 'leaderboard'} 
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </TabButton>
          <TabButton 
            $active={activeTab === 'practice'} 
            onClick={() => setActiveTab('practice')}
          >
            Practice Mode
          </TabButton>
        </TabSection>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {activeTab === 'lobby' && (
          <>
            <SectionCard delay={2}>
              <SectionTitle>Create New Game</SectionTitle>
              <FormGroup>
                <Input
                  type="text"
                  placeholder="Enter game name..."
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  disabled={isCreating}
                />
                <Select 
                  value={selectedScenario} 
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={isCreating}
                >
                  <option value="techcorp">TechCorp LBO (Beginner)</option>
                  <option value="retailmax">RetailMax Buyout (Beginner)</option>
                  <option value="manufacturing">Manufacturing Giant (Intermediate)</option>
                  <option value="healthcare">Healthcare Services (Intermediate)</option>
                  <option value="energy">Energy Conglomerate (Advanced)</option>
                </Select>
                <CreateButton onClick={handleCreateGame} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Game'}
                </CreateButton>
              </FormGroup>
            </SectionCard>

            <SectionCard delay={3}>
              <SectionTitle>Active Games</SectionTitle>
              {loading ? (
                <LoadingContainer>
                  <LoadingSpinner />
                  <span>Loading games...</span>
                </LoadingContainer>
              ) : games.length > 0 ? (
                <GamesList>
                  {games.map((game) => (
                    <GameCard key={game.id}>
                      <GameInfo>
                        <GameName>{game.name}</GameName>
                        <GameMeta>
                          <MetaItem>🎮 {game.scenario_name}</MetaItem>
                          <MetaItem>👥 {game.current_players}/{game.max_players} players</MetaItem>
                          <MetaItem>🕐 {formatDate(game.created_at)}</MetaItem>
                          <StatusBadge status={game.status}>{game.status}</StatusBadge>
                        </GameMeta>
                      </GameInfo>
                      <JoinButton 
                        onClick={() => handleJoinGame(game.id)}
                        disabled={isJoining === game.id || game.status !== 'waiting'}
                      >
                        {isJoining === game.id ? 'Joining...' : 
                         game.status === 'waiting' ? 'Join Game' : 'In Progress'}
                      </JoinButton>
                    </GameCard>
                  ))}
                </GamesList>
              ) : (
                <EmptyState>
                  <p>No active games at the moment.</p>
                  <p>Create one to get started!</p>
                </EmptyState>
              )}
            </SectionCard>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <SectionCard delay={2}>
            <SectionTitle>Global Leaderboard</SectionTitle>
            <EmptyState>
              <p>Leaderboard coming soon!</p>
              <p>Complete multiplayer games to earn your spot on the leaderboard.</p>
            </EmptyState>
          </SectionCard>
        )}

        {activeTab === 'practice' && (
          <SectionCard delay={2}>
            <SectionTitle>Practice Mode</SectionTitle>
            <EmptyState>
              <p>Practice against AI opponents to improve your skills!</p>
              <p>Coming soon...</p>
            </EmptyState>
          </SectionCard>
        )}
      </Content>
    </PageContainer>
  );
};

export default MultiplayerPage;