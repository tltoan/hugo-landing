import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const VideoSection = styled.section`
  padding: 4rem 2rem;
  background-color: ${theme.colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  scroll-margin-top: 80px;
`;

const VideoContainer = styled.div`
  width: 100%;
  max-width: 900px;
  background-color: rgba(65, 83, 120, 0.1);
  border-radius: 20px;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  border: 2px dashed ${theme.colors.primary};

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: 2rem 1rem;
    min-height: 300px;
  }
`;

const VideoPlaceholder = styled.div`
  text-align: center;
`;

const PlayButton = styled.div`
  width: 80px;
  height: 80px;
  background-color: ${theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 24px rgba(65, 83, 120, 0.3);
  }

  &::after {
    content: '';
    width: 0;
    height: 0;
    border-left: 20px solid ${theme.colors.white};
    border-top: 12px solid transparent;
    border-bottom: 12px solid transparent;
    margin-left: 5px;
  }
`;

const VideoTitle = styled.h3`
  font-size: 24px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 1rem;
`;

const VideoDescription = styled.p`
  font-size: ${theme.fontSizes.body};
  color: ${theme.colors.text};
  opacity: 0.8;
`;

const DemoVideo: React.FC = () => {
  return (
    <VideoSection id="demo-video">
      <VideoContainer>
        <VideoPlaceholder>
          <PlayButton />
          <VideoTitle>Demo Video Coming Soon</VideoTitle>
          <VideoDescription>
            Watch how Hugo transforms financial modeling practice with interactive exercises and real-time feedback.
          </VideoDescription>
        </VideoPlaceholder>
      </VideoContainer>
    </VideoSection>
  );
};

export default DemoVideo;