import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background-color: ${theme.colors.background};
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${slideUp} 0.4s ease-out;

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: 1.5rem;
    max-width: 95%;
  }
`;

const TopControls = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${theme.colors.primary};
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(65, 83, 120, 0.1);
  }
`;

const InvestorToggle = styled.div`
  font-size: 14px;
  color: ${theme.colors.primary};
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.3s ease;
  white-space: nowrap;

  &:hover {
    opacity: 0.7;
  }
`;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isInvestor: boolean;
  onToggleInvestor: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, isInvestor, onToggleInvestor }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <TopControls>
          <InvestorToggle onClick={onToggleInvestor}>
            {isInvestor ? 'User?' : 'Investor?'}
          </InvestorToggle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </TopControls>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

export default Modal;