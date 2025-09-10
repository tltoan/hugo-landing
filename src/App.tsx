import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import Hero from './components/Hero';
import DemoVideo from './components/DemoVideo';
import Modal from './components/Modal';
import UserAccessForm from './components/UserAccessForm';
import InvestorForm from './components/InvestorForm';
import Confirmation from './components/Confirmation';
import { saveSubmission, getSubmissions, downloadSubmissionsCSV } from './utils/storage';

const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
`;

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to download submissions
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const submissions = getSubmissions();
        if (submissions.length > 0) {
          downloadSubmissionsCSV();
          alert(`Downloaded ${submissions.length} submission(s)`);
        } else {
          alert('No submissions to download');
        }
      }
      // Ctrl/Cmd + Shift + L to log submissions to console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        const submissions = getSubmissions();
        console.log('All Submissions:', submissions);
        alert(`${submissions.length} submission(s) logged to console`);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  const handleUserFormSubmit = (data: any) => {
    console.log('User form submitted:', data);
    saveSubmission({
      type: 'user',
      ...data
    });
    setShowConfirmation(true);
  };

  const handleInvestorFormSubmit = (data: any) => {
    console.log('Investor form submitted:', data);
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
    <>
      <GlobalStyles />
      <AppContainer>
        <Hero 
          onOpenModal={handleOpenModal}
          onDemoClick={handleDemoClick}
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
      </AppContainer>
    </>
  );
};

export default App;
