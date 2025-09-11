import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const logoFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
`;

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: ${theme.colors.white};
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: ${slideDown} 0.6s ease-out;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const Logo = styled.h1`
  font-size: 50px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    animation: ${logoFloat} 2s ease-in-out infinite;
    transform: scale(1.05);
  }
`;

const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavLink = styled.button<{ $active?: boolean; $index?: number }>`
  background: none;
  border: none;
  padding: 8px 16px;
  color: ${props => props.$active ? theme.colors.buttonPrimary : theme.colors.text};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  animation: ${fadeInRight} 0.6s ease-out ${props => (props.$index || 0) * 0.1}s backwards;

  &:hover {
    background-color: ${theme.colors.background};
    color: ${theme.colors.buttonPrimary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.2);
  }

  ${props => props.$active && `
    background-color: ${theme.colors.buttonPrimary};
    color: ${theme.colors.white};
    transform: scale(1.05);
    
    &:hover {
      background-color: ${theme.colors.buttonPrimary};
      color: ${theme.colors.white};
      transform: translateY(-2px) scale(1.05);
    }
  `}
`;

const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeInLeft} 0.6s ease-out 0.4s backwards;
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

interface HeaderProps {
  showNavigation?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showNavigation = true }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <Logo onClick={handleLogoClick}>Hugo</Logo>
        {showNavigation && (
          <Navigation>
            <NavLink 
              $active={isActive('/dashboard')}
              $index={0}
              onClick={() => navigate('/dashboard')}
            >
              🏠 Dashboard
            </NavLink>
            <NavLink 
              $active={isActive('/problems')}
              $index={1}
              onClick={() => navigate('/problems')}
            >
              📚 Problems
            </NavLink>
            <NavLink 
              $active={isActive('/multiplayer')}
              $index={2}
              onClick={() => navigate('/multiplayer')}
            >
              ⚡ Multiplayer
            </NavLink>
            <NavLink 
              $active={isActive('/leaderboard')}
              $index={3}
              onClick={() => navigate('/leaderboard')}
            >
              🏆 Leaderboard
            </NavLink>
          </Navigation>
        )}
      </LeftSection>
      
      <UserSection>
        <WelcomeText>Welcome, {user?.email}</WelcomeText>
        <LogoutButton onClick={handleSignOut}>Sign Out</LogoutButton>
      </UserSection>
    </HeaderContainer>
  );
};

export default Header;