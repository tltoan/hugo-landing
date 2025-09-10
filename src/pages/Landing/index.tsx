import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Hero from '../../components/Hero';
import DemoVideo from '../../components/DemoVideo';
import Modal from '../../components/Modal';
import UserAccessForm from '../../components/UserAccessForm';
import InvestorForm from '../../components/InvestorForm';
import Confirmation from '../../components/Confirmation';
import { saveSubmission } from '../../utils/storage';
import { submitToNetlify } from '../../utils/netlifyForms';

const LandingContainer = styled.div`
  min-height: 100vh;
  position: relative;
`;

interface LandingPageProps {
  onUserSignup?: (data: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onUserSignup }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setShowConfirmation(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsInvestor(false);
    setShowConfirmation(false);
  };

  const handleToggleInvestor = () => {
    setIsInvestor(!isInvestor);
    setShowConfirmation(false);
  };

  const handleUserFormSubmit = async (data: any) => {
    console.log('User form submitted:', data);
    
    // Submit to Netlify Forms
    await submitToNetlify('user-access', data);
    
    // Save locally as backup
    saveSubmission({
      type: 'user',
      ...data
    });
    
    // If parent component provided signup handler, call it
    if (onUserSignup) {
      onUserSignup(data);
    }
    
    setShowConfirmation(true);
  };

  const handleInvestorFormSubmit = async (data: any) => {
    console.log('Investor form submitted:', data);
    
    // Submit to Netlify Forms
    await submitToNetlify('investor-access', data);
    
    // Save locally as backup
    saveSubmission({
      type: 'investor',
      ...data
    });
    
    setShowConfirmation(true);
  };

  const handleDemoClick = () => {
    const demoSection = document.getElementById('demo-video');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
    handleCloseModal();
  };

  const handleHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleCloseModal();
  };

  return (
    <LandingContainer>
      <Hero 
        onOpenModal={handleOpenModal}
        onDemoClick={handleDemoClick}
        onSignIn={() => navigate('/login')}
      />
      <DemoVideo />
      
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isInvestor={isInvestor}
        onToggleInvestor={handleToggleInvestor}
      >
        {showConfirmation ? (
          <Confirmation
            isInvestor={isInvestor}
            onHome={handleHome}
            onDemoVideo={handleDemoClick}
            onGetStarted={() => navigate('/login')}
          />
        ) : (
          <>
            {isInvestor ? (
              <InvestorForm onSubmit={handleInvestorFormSubmit} />
            ) : (
              <UserAccessForm onSubmit={handleUserFormSubmit} />
            )}
          </>
        )}
      </Modal>
    </LandingContainer>
  );
};

export default LandingPage;