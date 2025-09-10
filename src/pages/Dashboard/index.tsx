import React from 'react';
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

const DashboardContainer = styled.div`
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

const WelcomeCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  text-align: center;
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.8s ease-out 0.2s backwards;
`;

const WelcomeTitle = styled.h2`
  font-size: 28px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 1rem;
`;

const WelcomeDescription = styled.p`
  font-size: ${theme.fontSizes.body};
  color: ${theme.colors.text};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FeatureCard = styled.div<{ delay?: number }>`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  text-align: center;
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.8s ease-out ${props => (props.delay || 0) * 0.1}s backwards;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(65, 83, 120, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 20px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
  color: ${theme.colors.text};
  opacity: 0.8;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const FeatureButton = styled.button`
  padding: 12px 24px;
  background-color: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }
`;

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <DashboardContainer>
      <Header>
        <Logo>Hugo</Logo>
        <UserSection>
          <WelcomeText>Welcome, {user?.email}</WelcomeText>
          <LogoutButton onClick={handleSignOut}>Sign Out</LogoutButton>
        </UserSection>
      </Header>

      <Content>
        <WelcomeCard>
          <WelcomeTitle>Welcome to Hugo Finance</WelcomeTitle>
          <WelcomeDescription>
            Master financial modeling through interactive LBO exercises. 
            Practice with real-world scenarios, compete on leaderboards, 
            and track your progress as you become a finance expert.
          </WelcomeDescription>
        </WelcomeCard>

        <FeatureGrid>
          <FeatureCard delay={4}>
            <FeatureIcon>📚</FeatureIcon>
            <FeatureTitle>Practice Problems</FeatureTitle>
            <FeatureDescription>
              Access 15 carefully crafted LBO problems across 3 difficulty levels. 
              From Paper LBOs to Advanced scenarios.
            </FeatureDescription>
            <FeatureButton>Start Practicing</FeatureButton>
          </FeatureCard>

          <FeatureCard delay={5}>
            <FeatureIcon>🏆</FeatureIcon>
            <FeatureTitle>Leaderboard</FeatureTitle>
            <FeatureDescription>
              Compete with other finance students. Track your ranking and 
              see how you stack up globally.
            </FeatureDescription>
            <FeatureButton>View Rankings</FeatureButton>
          </FeatureCard>

          <FeatureCard delay={6}>
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>Multiplayer Racing</FeatureTitle>
            <FeatureDescription>
              Race against other players in real-time LBO competitions. 
              Test your speed and accuracy.
            </FeatureDescription>
            <FeatureButton>Join Race</FeatureButton>
          </FeatureCard>
        </FeatureGrid>
      </Content>
    </DashboardContainer>
  );
};

export default Dashboard;