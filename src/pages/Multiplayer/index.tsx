import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { multiplayerService, MultiplayerGame } from '../../services/multiplayerService';
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

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h2`
  font-size: 32px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  text-align: center;
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.8s ease-out 0.2s backwards;
`;

const TabSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.8s ease-out 0.4s backwards;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background-color: ${props => props.$active ? theme.colors.buttonPrimary : theme.colors.white};
  color: ${props => props.$active ? theme.colors.white : theme.colors.primary};
  border: 2px solid ${theme.colors.buttonPrimary};
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonPrimary};
    color: ${theme.colors.white};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }
`;

const SectionCard = styled.div<{ delay?: number }>`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.8s ease-out ${props => (props.delay || 0) * 0.1}s backwards;
`;

const SectionTitle = styled.h3`
  font-size: 24px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 1.5rem;
`;

const CreateGameSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.buttonPrimary};
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
  background-color: white;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.buttonPrimary};
  }
`;

const CreateButton = styled.button`
  padding: 12px 24px;
  background-color: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GameCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.buttonPrimary};
    box-shadow: 0 2px 8px rgba(65, 83, 120, 0.1);
  }
`;

const GameInfo = styled.div`
  flex: 1;
`;

const GameName = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.primary};
  margin: 0 0 0.5rem 0;
`;

const GameMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.7;
`;

const JoinButton = styled.button`
  padding: 8px 16px;
  background-color: ${theme.colors.buttonPrimary};
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
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${theme.colors.text};
  opacity: 0.6;
`;

type TabType = 'lobby' | 'leaderboard' | 'practice';

const MultiplayerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('lobby');
  const [gameName, setGameName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('techcorp');
  const [isCreating, setIsCreating] = useState(false);
  const [games, setGames] = useState<MultiplayerGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const activeGames = await multiplayerService.getActiveGames();
      setGames(activeGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateGame = async () => {
    if (!gameName.trim() || !user?.id) return;
    
    setIsCreating(true);
    try {
      await multiplayerService.createGame(gameName, selectedScenario, user.id);
      setGameName('');
      await loadGames(); // Refresh the games list
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = (gameId: string) => {
    // Navigate to multiplayer game
    navigate(`/multiplayer/game/${gameId}`);
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

        {activeTab === 'lobby' && (
          <>
            <SectionCard delay={6}>
              <SectionTitle>Create New Game</SectionTitle>
              <CreateGameSection>
                <InputGroup>
                  <InputLabel>Game Name</InputLabel>
                  <Input
                    type="text"
                    placeholder="Enter game name..."
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                  />
                </InputGroup>
                <InputGroup>
                  <InputLabel>LBO Scenario</InputLabel>
                  <Select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                  >
                    <option value="techcorp">TechCorp LBO (Beginner)</option>
                    <option value="retailmax">RetailMax Buyout (Beginner)</option>
                    <option value="manufacturing">Manufacturing Giant (Intermediate)</option>
                    <option value="healthcare">Healthcare Services (Intermediate)</option>
                    <option value="energy">Energy Conglomerate (Advanced)</option>
                  </Select>
                </InputGroup>
                <CreateButton
                  onClick={handleCreateGame}
                  disabled={!gameName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Game'}
                </CreateButton>
              </CreateGameSection>
            </SectionCard>

            <SectionCard delay={7}>
              <SectionTitle>Active Games</SectionTitle>
              {loading ? (
                <EmptyState>
                  <p>Loading games...</p>
                </EmptyState>
              ) : games.length === 0 ? (
                <EmptyState>
                  <p>No active games found.</p>
                  <p>Create a new game to get started!</p>
                </EmptyState>
              ) : (
                <GamesList>
                  {games.map((game) => (
                    <GameCard key={game.id}>
                      <GameInfo>
                        <GameName>{game.name}</GameName>
                        <GameMeta>
                          <span>📊 {game.scenarioName}</span>
                          <span>👥 {game.players.length}/{game.maxPlayers} players</span>
                          <span>🟢 {game.status}</span>
                        </GameMeta>
                      </GameInfo>
                      <JoinButton onClick={() => handleJoinGame(game.id)}>
                        Join Game
                      </JoinButton>
                    </GameCard>
                  ))}
                </GamesList>
              )}
            </SectionCard>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <SectionCard delay={6}>
            <SectionTitle>Global Leaderboard</SectionTitle>
            <EmptyState>
              <p>🏆 Leaderboard coming soon!</p>
              <p>Complete multiplayer games to see rankings here.</p>
            </EmptyState>
          </SectionCard>
        )}

        {activeTab === 'practice' && (
          <SectionCard delay={6}>
            <SectionTitle>Practice Problems</SectionTitle>
            <EmptyState>
              <p>📚 Practice mode integration coming soon!</p>
              <p>Visit the Problems page for individual practice.</p>
            </EmptyState>
          </SectionCard>
        )}
      </Content>
    </PageContainer>
  );
};

export default MultiplayerPage;