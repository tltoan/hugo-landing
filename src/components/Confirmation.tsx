import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

const slideUp = keyframes`
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
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const ConfirmationContainer = styled.div`
  text-align: center;
  padding: 2rem 0;
  animation: ${slideUp} 0.6s ease-out 0.1s backwards;
`;

const ConfirmationMessage = styled.div`
  background-color: rgba(65, 83, 120, 0.05);
  border: 2px solid rgba(65, 83, 120, 0.1);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  animation: ${scaleIn} 0.7s ease-out 0.3s backwards;
`;

const ConfirmationText = styled.p`
  font-size: ${theme.fontSizes.body};
  color: ${theme.colors.text};
  line-height: 1.8;
  margin: 0;
  animation: ${fadeIn} 0.5s ease-out 0.5s backwards;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: ${slideUp} 0.6s ease-out 0.7s backwards;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Button = styled.button<{ $secondary?: boolean }>`
  padding: 14px 32px;
  font-size: ${theme.fontSizes.button};
  font-weight: 500;
  border-radius: 50px;
  background-color: ${props => props.$secondary ? theme.colors.buttonSecondary : theme.colors.buttonPrimary};
  color: ${props => props.$secondary ? theme.colors.buttonPrimary : theme.colors.white};
  border: 2px solid ${theme.colors.buttonPrimary};
  transition: all 0.3s ease;
  min-width: 150px;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(65, 83, 120, 0.3);
  }

  &:active {
    transform: translateY(0px);
    transition: transform 0.1s ease;
  }
`;

interface ConfirmationProps {
  isInvestor: boolean;
  onHome: () => void;
  onGetStarted?: () => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ isInvestor, onHome, onGetStarted }) => {
  return (
    <ConfirmationContainer>
      <ConfirmationMessage>
        <ConfirmationText>
          {isInvestor ? (
            <>
              We'll send you our latest pitch deck within 48 hours.
            </>
          ) : (
            <>
              Thank you for your interest! Your account has been created successfully.
              <br />
              You can now sign in and start using Hugo.
            </>
          )}
        </ConfirmationText>
      </ConfirmationMessage>
      
      <ButtonContainer>
        <Button onClick={onHome}>Home</Button>
        {onGetStarted && (
          <Button $secondary onClick={onGetStarted}>Get Started</Button>
        )}
      </ButtonContainer>
    </ConfirmationContainer>
  );
};

export default Confirmation;