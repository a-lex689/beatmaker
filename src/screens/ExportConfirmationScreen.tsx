import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #121212;
  color: white;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  text-align: center;
  width: 100%;
  color: #1DB954;
`;

const SuccessCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 30px;
  margin-top: 40px;
  text-align: center;
`;

const SuccessIcon = styled.div`
  font-size: 48px;
  color: #1DB954;
  margin-bottom: 20px;
`;

const SuccessTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
`;

const InfoSection = styled.div`
  border: 1px solid #333;
  border-radius: 4px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #ccc;
`;

const InfoValue = styled.span`
  font-weight: bold;
  color: white;
`;

const DownloadButton = styled.a`
  display: inline-block;
  padding: 12px 24px;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin: 20px 0;
  text-decoration: none;
  
  &:hover {
    background-color: #1ed760;
  }
`;

const BackButton = styled.button`
  display: inline-block;
  width: 100%;
  padding: 12px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background-color: #444;
  }
`;

const ExportConfirmationScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data passed from PaymentScreen
  const state = location.state as {
    beatId: string;
    locked: boolean;
    downloadUrl: string; // Add downloadUrl
  } || {
    beatId: 'beat_' + Math.floor(Math.random() * 1000000),
    locked: false,
    downloadUrl: '', // Provide a default empty string
  };

  const beatId = state.beatId;
  const isLocked = state.locked;
  const downloadUrl = state.downloadUrl; // Get the download URL

  // Truncate the beat ID for display
  const displayBeatId = beatId.length > 12
    ? `${beatId.substring(0, 8)}...`
    : beatId;

  // Use the actual download URL passed from the payment screen
  // const downloadLink = `/api/download/${beatId}.wav`; // Remove mock link

  useEffect(() => {
    // If we got here without state or without a downloadUrl, redirect to home
    if (!location.state || !location.state.downloadUrl) {
      console.error("ExportConfirmationScreen: Missing state or downloadUrl, redirecting.");
      navigate('/');
    }
  }, [location.state, navigate]);
  
  return (
    <Container>
      <Header>
        <Title>Beat Export Successful!</Title>
      </Header>
      
      <SuccessCard>
        <SuccessIcon>✓</SuccessIcon>
        <SuccessTitle>Your beat has been exported successfully!</SuccessTitle>
        
        <InfoSection>
          <InfoRow>
            <InfoLabel>Beat ID:</InfoLabel>
            <InfoValue>{displayBeatId}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>License:</InfoLabel>
            <InfoValue>{isLocked ? 'Exclusive Rights (Locked)' : 'Standard License'}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>Format:</InfoLabel>
            <InfoValue>WAV (44.1kHz, 16-bit)</InfoValue>
          </InfoRow>
        </InfoSection>
        
        {/* Use the actual downloadUrl received from the state */}
        {downloadUrl ? (
          <DownloadButton
            href={`http://localhost:5001${downloadUrl}`} // Construct full URL with backend origin
            download={`beat_${beatId}.wav`} // Suggest filename based on beatId
          >
            Download Beat
          </DownloadButton>
        ) : (
           <p>Download link not available.</p> // Handle case where downloadUrl is missing
        )}

        <p>Your beat has also been added to your "My Beats" collection.</p>
        
        <BackButton onClick={() => navigate('/')}>
          Back to Beat Builder
        </BackButton>
      </SuccessCard>
    </Container>
  );
};

export default ExportConfirmationScreen;