import React from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useAuth } from "../../contexts/AuthContext";

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
  padding: 1rem 2rem;
  margin: -2rem -2rem 3rem -2rem;
`;

const Logo = styled.h1`
  font-size: 50px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin: 0;
  cursor: pointer;
  font-weight: normal;
  
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
  font-size: 14px;
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
  animation: ${fadeInUp} 0.8s ease-out ${(props) => (props.delay || 0) * 0.1}s
    backwards;

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

const DailyHugoCard = styled.div`
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.2);
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.8s ease-out 0.4s backwards;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(255, 107, 107, 0.3);
  }
`;

const DailyHugoContent = styled.div`
  flex: 1;
`;

const DailyHugoTitle = styled.h3`
  font-size: 24px;
  font-family: ${theme.fonts.header};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DailyHugoDescription = styled.p`
  font-size: 16px;
  opacity: 0.95;
  line-height: 1.5;
  margin-bottom: 1.5rem;
`;

const DailyHugoButton = styled.button`
  padding: 14px 32px;
  background-color: white;
  color: #FF6B6B;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
`;

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
  };

  const handleStartPracticing = () => {
    navigate("/problems");
  };

  const handleViewRankings = () => {
    navigate("/leaderboard");
  };

  const handleJoinRace = () => {
    navigate("/multiplayer");
  };

  const handleDailyHugo = () => {
    navigate("/daily-hugo");
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
          <WelcomeTitle>Welcome to Hugo</WelcomeTitle>
          <WelcomeDescription>
            Master financial modeling through interactive LBO exercises.
            Practice with real-world scenarios, compete on leaderboards, and
            track your progress as you become a finance expert.
          </WelcomeDescription>
        </WelcomeCard>

        <DailyHugoCard onClick={handleDailyHugo} style={{ cursor: 'pointer' }}>
          <DailyHugoContent>
            <DailyHugoTitle>
              <span style={{ fontSize: '28px' }}>🎯</span>
              Daily HUGO
            </DailyHugoTitle>
            <DailyHugoDescription>
              Practice IB interview questions daily. Build streaks, earn points,
              and master the 400 essential questions for investment banking interviews.
            </DailyHugoDescription>
            <DailyHugoButton onClick={(e) => {
              e.stopPropagation();
              handleDailyHugo();
            }}>
              Today's Question →
            </DailyHugoButton>
          </DailyHugoContent>
        </DailyHugoCard>

        <FeatureGrid>
          <FeatureCard delay={4}>
            <FeatureIcon>📚</FeatureIcon>
            <FeatureTitle>Practice Problems</FeatureTitle>
            <FeatureDescription>
              Master 10 financial models: 5 LBO and 5 DCF problems across 3 difficulty levels. From beginner to advanced scenarios.
            </FeatureDescription>
            <FeatureButton onClick={handleStartPracticing}>
              Start Practicing
            </FeatureButton>
          </FeatureCard>

          <FeatureCard delay={5}>
            <FeatureIcon>🏆</FeatureIcon>
            <FeatureTitle>Leaderboard</FeatureTitle>
            <FeatureDescription>
              Compete with other finance students. Track your ranking and see
              how you stack up globally.
            </FeatureDescription>
            <FeatureButton onClick={handleViewRankings}>
              View Rankings
            </FeatureButton>
          </FeatureCard>

          <FeatureCard delay={6}>
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>Multiplayer Racing</FeatureTitle>
            <FeatureDescription>
              Race against other players in real-time LBO competitions. Create games,
              join existing races, and compete on global leaderboards.
            </FeatureDescription>
            <FeatureButton onClick={handleJoinRace}>
              Start Racing
            </FeatureButton>
          </FeatureCard>
        </FeatureGrid>
      </Content>
    </DashboardContainer>
  );
};

export default Dashboard;
