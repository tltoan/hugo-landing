import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

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

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
`;

const Logo = styled.h1`
  font-size: 72px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 0.5rem;
  font-weight: normal;
  animation: ${scaleIn} 0.8s ease-out;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 56px;
  }
`;

const Tagline = styled.p`
  font-size: ${theme.fontSizes.tagline};
  color: ${theme.colors.primary};
  font-style: italic;
  font-family: ${theme.fonts.body};
  margin-bottom: 4rem;
  animation: ${fadeIn} 1s ease-out 0.2s backwards;
`;

const ProblemStatement = styled.h2`
  font-size: 32px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  max-width: 900px;
  margin: 0 auto 3rem;
  line-height: 1.4;
  font-weight: normal;
  animation: ${fadeInUp} 0.8s ease-out 0.4s backwards;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 24px;
  }
`;

const SolutionText = styled.p`
  font-size: ${theme.fontSizes.body};
  color: ${theme.colors.text};
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.8;
  animation: ${fadeInUp} 0.8s ease-out 0.6s backwards;
`;

const FutureFeature = styled.p`
  font-size: ${theme.fontSizes.body};
  color: ${theme.colors.text};
  max-width: 800px;
  margin: 0 auto 4rem;
  line-height: 1.8;
  animation: ${fadeInUp} 0.8s ease-out 0.8s backwards;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.8s ease-out 1s backwards;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
`;

const Button = styled.button<{ $secondary?: boolean }>`
  padding: 16px 40px;
  font-size: ${theme.fontSizes.button};
  font-weight: 500;
  border-radius: 50px;
  background-color: ${props => props.$secondary ? theme.colors.buttonSecondary : theme.colors.buttonPrimary};
  color: ${props => props.$secondary ? theme.colors.buttonPrimary : theme.colors.white};
  border: 2px solid ${theme.colors.buttonPrimary};
  transition: all 0.3s ease;
  min-width: 200px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.2);
  }
`;

interface HeroProps {
  onOpenModal: () => void;
  onSignIn?: () => void;
}

const SignInLink = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 10;

  @media (max-width: ${theme.breakpoints.mobile}) {
    top: 1rem;
    right: 1rem;
  }
`;

const SignInButton = styled.button`
  padding: 8px 20px;
  background: transparent;
  color: ${theme.colors.primary};
  border: 2px solid ${theme.colors.primary};
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.primary};
    color: ${theme.colors.white};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: 6px 16px;
    font-size: 12px;
  }
`;

const Hero: React.FC<HeroProps> = ({ onOpenModal, onSignIn }) => {
  return (
    <HeroContainer>
      {onSignIn && (
        <SignInLink>
          <SignInButton onClick={onSignIn}>Sign In</SignInButton>
        </SignInLink>
      )}
      
      <Logo>Hugo</Logo>
      <Tagline>the leet code for finance.</Tagline>
      
      <ProblemStatement>
        Finance students pay $1,000+ for courses that don't provide hands-on practice.
      </ProblemStatement>
      
      <SolutionText>
        Hugo delivers interactive LBO modeling with real-time validation and competitive scoring.
      </SolutionText>
      
      <FutureFeature>
        Coming soon: AI-powered personalized coaching that analyzes your mistakes and provides targeted explanations to accelerate learning.
      </FutureFeature>
      
      <ButtonContainer>
        <Button onClick={onOpenModal}>Request Access</Button>
      </ButtonContainer>
    </HeroContainer>
  );
};

export default Hero;