import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const ConfirmationContainer = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

const ConfirmationMessage = styled.div`
  background-color: rgba(65, 83, 120, 0.05);
  border: 2px solid rgba(65, 83, 120, 0.1);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ConfirmationText = styled.p`
  font-size: ${theme.fontSizes.body};
  color: ${theme.colors.text};
  line-height: 1.8;
  margin: 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;

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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.2);
  }
`;

interface ConfirmationProps {
  isInvestor: boolean;
  onHome: () => void;
  onDemoVideo: () => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ isInvestor, onHome, onDemoVideo }) => {
  return (
    <ConfirmationContainer>
      <ConfirmationMessage>
        <ConfirmationText>
          {isInvestor ? (
            <>
              We'll send you our latest pitch deck within 48 hours.
              <br />
              In the meantime, check out our demo video to see Hugo in action.
            </>
          ) : (
            <>
              We'll send you login details within 48 hours.
              <br />
              In the meantime, check out our demo video to see Hugo in action.
            </>
          )}
        </ConfirmationText>
      </ConfirmationMessage>
      
      <ButtonContainer>
        <Button onClick={onHome}>Home</Button>
        <Button $secondary onClick={onDemoVideo}>Demo-Video</Button>
      </ButtonContainer>
    </ConfirmationContainer>
  );
};

export default Confirmation;