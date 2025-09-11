import React from 'react';
import { useNavigate } from 'react-router-dom';
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

const Content = styled.main`
  max-width: 1000px;
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

const LeaderboardCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  animation: ${fadeInUp} 0.8s ease-out 0.4s backwards;
`;

const LeaderboardHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 120px 120px 120px;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 2px solid rgba(65, 83, 120, 0.1);
  font-weight: 600;
  color: ${theme.colors.primary};
`;

const LeaderboardRow = styled.div<{ $rank: number }>`
  display: grid;
  grid-template-columns: 60px 1fr 120px 120px 120px;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(65, 83, 120, 0.05);
  align-items: center;
  transition: all 0.3s ease;
  background-color: ${props => {
    if (props.$rank === 1) return 'rgba(255, 215, 0, 0.1)';
    if (props.$rank === 2) return 'rgba(192, 192, 192, 0.1)';
    if (props.$rank === 3) return 'rgba(205, 127, 50, 0.1)';
    return 'transparent';
  }};

  &:hover {
    background-color: rgba(65, 83, 120, 0.05);
    transform: translateX(5px);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  background-color: ${props => {
    if (props.$rank === 1) return '#ffd700';
    if (props.$rank === 2) return '#c0c0c0';
    if (props.$rank === 3) return '#cd7f32';
    return theme.colors.primary;
  }};
`;

const PlayerName = styled.div`
  font-weight: 500;
  color: ${theme.colors.primary};
`;

const StatValue = styled.div`
  font-weight: 500;
  color: ${theme.colors.text};
  text-align: center;
`;

// Mock leaderboard data
const mockLeaderboard = [
  { id: '1', name: 'Alex Chen', totalScore: 12500, problemsSolved: 15, avgAccuracy: 94 },
  { id: '2', name: 'Sarah Johnson', totalScore: 11800, problemsSolved: 14, avgAccuracy: 92 },
  { id: '3', name: 'Michael Rodriguez', totalScore: 11200, problemsSolved: 13, avgAccuracy: 89 },
  { id: '4', name: 'Emma Thompson', totalScore: 10900, problemsSolved: 12, avgAccuracy: 91 },
  { id: '5', name: 'David Kim', totalScore: 10500, problemsSolved: 12, avgAccuracy: 88 },
  { id: '6', name: 'Lisa Wang', totalScore: 10200, problemsSolved: 11, avgAccuracy: 85 },
  { id: '7', name: 'James Wilson', totalScore: 9800, problemsSolved: 11, avgAccuracy: 87 },
  { id: '8', name: 'Maria Garcia', totalScore: 9500, problemsSolved: 10, avgAccuracy: 90 },
  { id: '9', name: 'Robert Brown', totalScore: 9200, problemsSolved: 10, avgAccuracy: 86 },
  { id: '10', name: 'Jennifer Davis', totalScore: 8900, problemsSolved: 9, avgAccuracy: 83 }
];

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <Header />
      
      <Content>
        <PageTitle>🏆 Leaderboard</PageTitle>
        
        <LeaderboardCard>
          <LeaderboardHeader>
            <div>Rank</div>
            <div>Player</div>
            <div>Total Score</div>
            <div>Problems</div>
            <div>Accuracy</div>
          </LeaderboardHeader>
          
          {mockLeaderboard.map((player, index) => (
            <LeaderboardRow key={player.id} $rank={index + 1}>
              <RankBadge $rank={index + 1}>
                {index + 1}
              </RankBadge>
              <PlayerName>{player.name}</PlayerName>
              <StatValue>{player.totalScore.toLocaleString()}</StatValue>
              <StatValue>{player.problemsSolved}/15</StatValue>
              <StatValue>{player.avgAccuracy}%</StatValue>
            </LeaderboardRow>
          ))}
        </LeaderboardCard>
      </Content>
    </PageContainer>
  );
};

export default LeaderboardPage;