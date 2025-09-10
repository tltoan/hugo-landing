import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';

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
  padding: 2rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Logo = styled.h1`
  font-size: 32px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin: 0;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WelcomeText = styled.span`
  color: ${theme.colors.text};
  font-weight: 500;
`;

const LogoutButton = styled.button`
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

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h2`
  font-size: 32px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  text-align: center;
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.8s ease-out 0.2s backwards;
`;

const FilterSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.8s ease-out 0.4s backwards;
`;

const FilterButton = styled.button<{ $active: boolean }>`
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

const ProblemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ProblemCard = styled.div<{ delay?: number }>`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.8s ease-out ${props => (props.delay || 0) * 0.1}s backwards;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(65, 83, 120, 0.15);
  }
`;

const ProblemHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ProblemTitle = styled.h3`
  font-size: 20px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 0.5rem;
  flex: 1;
`;

const DifficultyBadge = styled.span<{ level: string }>`
  background-color: ${props => {
    switch (props.level) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return theme.colors.primary;
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ProblemDescription = styled.p`
  color: ${theme.colors.text};
  opacity: 0.8;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ProblemMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(65, 83, 120, 0.1);
`;

const MetaItem = styled.span`
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.7;
`;

const StartButton = styled.button`
  padding: 10px 20px;
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

interface Problem {
  id: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  timeLimit: number;
  maxScore: number;
}

// Mock data for now - we'll connect to real data later
const mockProblems: Problem[] = [
  {
    id: '1',
    name: 'TechCorp LBO',
    difficulty: 'beginner',
    description: 'A straightforward LBO analysis of a technology company. Perfect for getting started with LBO modeling fundamentals.',
    timeLimit: 45,
    maxScore: 1000
  },
  {
    id: '2',
    name: 'RetailMax Buyout',
    difficulty: 'beginner',
    description: 'Analyze the leveraged buyout of a retail chain. Focus on working capital and seasonality considerations.',
    timeLimit: 50,
    maxScore: 1000
  },
  {
    id: '3',
    name: 'Manufacturing Giant',
    difficulty: 'intermediate',
    description: 'Complex manufacturing company LBO with multiple debt tranches and detailed cash flow analysis.',
    timeLimit: 60,
    maxScore: 1500
  },
  {
    id: '4',
    name: 'Healthcare Services',
    difficulty: 'intermediate',
    description: 'LBO modeling for a healthcare services company with regulatory considerations and growth scenarios.',
    timeLimit: 65,
    maxScore: 1500
  },
  {
    id: '5',
    name: 'Energy Conglomerate',
    difficulty: 'advanced',
    description: 'Multi-divisional energy company with complex debt structures, commodity hedging, and environmental considerations.',
    timeLimit: 90,
    maxScore: 2000
  }
];

const ProblemsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const handleSignOut = () => {
    signOut();
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleStartProblem = (problemId: string) => {
    navigate(`/problem/${problemId}`);
  };

  const filteredProblems = selectedDifficulty === 'all' 
    ? mockProblems 
    : mockProblems.filter(p => p.difficulty === selectedDifficulty);

  return (
    <PageContainer>
      <Header>
        <Logo onClick={handleGoHome}>Hugo</Logo>
        <UserSection>
          <WelcomeText>Welcome, {user?.email}</WelcomeText>
          <LogoutButton onClick={handleSignOut}>Sign Out</LogoutButton>
        </UserSection>
      </Header>

      <Content>
        <PageTitle>Practice Problems</PageTitle>
        
        <FilterSection>
          <FilterButton 
            $active={selectedDifficulty === 'all'} 
            onClick={() => setSelectedDifficulty('all')}
          >
            All Problems
          </FilterButton>
          <FilterButton 
            $active={selectedDifficulty === 'beginner'} 
            onClick={() => setSelectedDifficulty('beginner')}
          >
            Beginner
          </FilterButton>
          <FilterButton 
            $active={selectedDifficulty === 'intermediate'} 
            onClick={() => setSelectedDifficulty('intermediate')}
          >
            Intermediate
          </FilterButton>
          <FilterButton 
            $active={selectedDifficulty === 'advanced'} 
            onClick={() => setSelectedDifficulty('advanced')}
          >
            Advanced
          </FilterButton>
        </FilterSection>

        <ProblemsGrid>
          {filteredProblems.map((problem, index) => (
            <ProblemCard key={problem.id} delay={index + 6}>
              <ProblemHeader>
                <div style={{ flex: 1 }}>
                  <ProblemTitle>{problem.name}</ProblemTitle>
                  <DifficultyBadge level={problem.difficulty}>
                    {problem.difficulty}
                  </DifficultyBadge>
                </div>
              </ProblemHeader>
              <ProblemDescription>{problem.description}</ProblemDescription>
              <ProblemMeta>
                <MetaItem>⏱️ {problem.timeLimit} min</MetaItem>
                <MetaItem>🎯 {problem.maxScore} pts</MetaItem>
                <StartButton onClick={() => handleStartProblem(problem.id)}>
                  Start Problem
                </StartButton>
              </ProblemMeta>
            </ProblemCard>
          ))}
        </ProblemsGrid>
      </Content>
    </PageContainer>
  );
};

export default ProblemsPage;