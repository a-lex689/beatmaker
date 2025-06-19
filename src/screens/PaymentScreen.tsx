import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../config/firebaseConfig';

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

const BackButton = styled.button`
  background: none;
  border: none;
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    color: white;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const PaymentCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 30px;
  margin-top: 40px;
`;

const SummaryTitle = styled.h2`
  font-size: 22px;
  margin-top: 0;
  margin-bottom: 20px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  color: #ccc;
`;

const SummaryValue = styled.span`
  font-weight: bold;
  color: #1DB954;
`;

const TokenBalance = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background-color: #252525;
  border-radius: 4px;
  margin: 25px 0;
`;

const BalanceLabel = styled.span`
  color: #ccc;
`;

const BalanceValue = styled.span`
  font-weight: bold;
  color: #9147ff;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  margin: 10px 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PayWithTokensButton = styled(ActionButton)`
  background-color: #1DB954;
  color: white;
  
  &:hover:not([disabled]) {
    background-color: #1ed760;
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const LockBeatButton = styled(ActionButton)`
  background-color: #9147ff;
  color: white;
  
  &:hover:not([disabled]) {
    background-color: #a970ff;
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const BuyTokensButton = styled(ActionButton)`
  background-color: #333;
  color: white;
  
  &:hover {
    background-color: #444;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1e1e1e;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
`;

const ModalButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;
  font-weight: bold;
`;

const CancelButton = styled(ModalButton)`
  background-color: #333;
  color: white;
  
  &:hover {
    background-color: #444;
  }
`;

const ConfirmButton = styled(ModalButton)`
  background-color: #1DB954;
  color: white;
  
  &:hover {
    background-color: #1ed760;
  }
`;

const PaymentScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get data passed from HomeScreen
  const state = location.state as {
    beatFingerprint: string;
    stemCount: number;
    selectedStemPaths: string[]; // Add selectedStemPaths
    targetBpm: number; // Add targetBpm
    targetKey: string; // Add targetKey
  } || { beatFingerprint: '', stemCount: 0, selectedStemPaths: [], targetBpm: 120, targetKey: 'C Minor' }; // Provide defaults
  
  const beatFingerprint = state.beatFingerprint || 'Key:CMinor | BPM:120 | PianoID:1 | KickID:1 | SnareID:1';
  const stemCount = state.stemCount || 6;
  const selectedStemPaths = state.selectedStemPaths; // Get the selected stem paths
  const targetBpm = state.targetBpm; // Get the target BPM
  const targetKey = state.targetKey; // Get the target Key
  
  // Calculate token cost
  const tokensNeeded = stemCount * 5; // 5 tokens per stem
  const premiumLockCost = 100; // Additional cost for premium lock
  
  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        try {
          // Fetch user document from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setTokenBalance(userData.tokenBalance || 0);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  const handlePayWithTokens = () => {
    if (tokenBalance < tokensNeeded) {
      setShowInsufficientTokens(true);
      return;
    }
    
    setShowPaymentConfirm(true);
  };
  
  const handleLockBeat = () => {
    if (tokenBalance < (tokensNeeded + premiumLockCost)) {
      setShowInsufficientTokens(true);
      return;
    }
    
    setShowLockConfirm(true);
  };
  
  const processBeatExport = async (isLocked: boolean) => {
    if (!userId) return;
    
    setIsProcessing(true);
    
    try {
      // Generate a unique beat ID (in real app, use a more robust ID generation)
      const beatId = `beat_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // --- Call the new backend export endpoint ---
      console.log("Calling backend /api/export-beat...");
      const exportResponse = await fetch('http://localhost:5001/api/export-beat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stems: selectedStemPaths, // Send the selected stem paths
          targetBpm: targetBpm,     // Send the target BPM
          targetKey: targetKey,     // Send the target Key
          beatId: beatId,           // Send the generated beat ID
        }),
      });
      
      console.log(`Backend export response status: ${exportResponse.status}`);
      const exportResult = await exportResponse.json();
      console.log("Backend export response data:", exportResult);
      
      if (!exportResponse.ok) {
        // Handle HTTP errors from the export endpoint
        throw new Error(exportResult.error || `Backend export failed with status ${exportResponse.status}`);
      }
      
      // Add stricter check for downloadUrl
      if (!exportResult.downloadUrl || typeof exportResult.downloadUrl !== 'string' || exportResult.downloadUrl.trim() === '') {
          console.error("Invalid downloadUrl received from backend:", exportResult.downloadUrl);
          throw new Error('Backend did not return a valid, non-empty download URL string.');
      }
      
      const downloadUrl = exportResult.downloadUrl; // Get the download URL from the backend
      
      // --- Update Firestore (only if backend export was successful) ---
      const beatData = { // Create data object separately for logging
        beatId,
        fingerprint: beatFingerprint,
        stemCount,
        owner: userId,
        isLocked,
        createdAt: Timestamp.now(),
        downloadUrl: downloadUrl, // Store the actual download URL
      };
      console.log("Attempting to write to Firestore with data:", JSON.stringify(beatData, null, 2)); // Log the data

      // Create a beat document in Firestore
      await setDoc(doc(firestore, 'beats', beatId), beatData); // Use the data object
      
      // Update user document
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        tokenBalance: tokenBalance - (isLocked ? tokensNeeded + premiumLockCost : tokensNeeded),
        beatHistory: arrayUnion(beatId)
      });
      
      // Navigate to success screen, passing the download URL
      navigate('/export-confirmation', {
        state: {
          beatId,
          locked: isLocked,
          downloadUrl: downloadUrl, // Pass the download URL to the confirmation screen
        }
      });
      
    } catch (error: unknown) { // Use 'unknown' for better type safety
      console.error('Error exporting beat:', error);
      // Safely access error message if it exists
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during processing.';
      alert(`An error occurred while exporting your beat: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
      setShowPaymentConfirm(false);
      setShowLockConfirm(false);
    }
  };
  
  const handleBuyTokens = () => {
    // In a real app, this would open a payment modal for Stripe/PayPal
    alert('This would open a Stripe/PayPal payment modal in the real app');
  };
  
  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          ← Back
        </BackButton>
        <Title>Payment / Export</Title>
        <div></div> {/* Empty div to balance header */}
      </Header>
      
      <PaymentCard>
        <SummaryTitle>Your Beat Summary</SummaryTitle>
        
        <SummaryRow>
          <SummaryLabel>Stems used</SummaryLabel>
          <SummaryValue>{stemCount}</SummaryValue>
        </SummaryRow>
        
        <SummaryRow>
          <SummaryLabel>Total Tokens Needed</SummaryLabel>
          <SummaryValue>{tokensNeeded}</SummaryValue>
        </SummaryRow>
        
        <TokenBalance>
          <BalanceLabel>Token Balance</BalanceLabel>
          <BalanceValue>{tokenBalance}</BalanceValue>
        </TokenBalance>
        
        <PayWithTokensButton 
          onClick={handlePayWithTokens}
          disabled={isProcessing || tokenBalance < tokensNeeded}
        >
          Pay with Tokens
        </PayWithTokensButton>
        
        <LockBeatButton 
          onClick={handleLockBeat}
          disabled={isProcessing || tokenBalance < (tokensNeeded + premiumLockCost)}
        >
          Lock Beat for Exclusive Rights: ${premiumLockCost/10} ({premiumLockCost} tokens)
        </LockBeatButton>
        
        <BuyTokensButton 
          onClick={handleBuyTokens}
          disabled={isProcessing}
        >
          Buy More Tokens
        </BuyTokensButton>
      </PaymentCard>
      
      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <Modal>
          <ModalContent>
            <ModalTitle>Confirm Beat Export</ModalTitle>
            <p>Are you sure you want to export this beat for {tokensNeeded} tokens?</p>
            <p>Your new balance will be {tokenBalance - tokensNeeded} tokens.</p>
            
            <ModalButtonsContainer>
              <CancelButton 
                onClick={() => setShowPaymentConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={() => processBeatExport(false)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </ConfirmButton>
            </ModalButtonsContainer>
          </ModalContent>
        </Modal>
      )}
      
      {/* Lock Confirmation Modal */}
      {showLockConfirm && (
        <Modal>
          <ModalContent>
            <ModalTitle>Confirm Beat Lock</ModalTitle>
            <p>Are you sure you want to lock this beat for exclusive rights?</p>
            <p>This will cost {tokensNeeded + premiumLockCost} tokens total.</p>
            <p>Your new balance will be {tokenBalance - (tokensNeeded + premiumLockCost)} tokens.</p>
            
            <ModalButtonsContainer>
              <CancelButton 
                onClick={() => setShowLockConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={() => processBeatExport(true)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </ConfirmButton>
            </ModalButtonsContainer>
          </ModalContent>
        </Modal>
      )}
      
      {/* Insufficient Tokens Modal */}
      {showInsufficientTokens && (
        <Modal>
          <ModalContent>
            <ModalTitle>Insufficient Tokens</ModalTitle>
            <p>You don't have enough tokens for this operation.</p>
            <p>Would you like to purchase more tokens?</p>
            
            <ModalButtonsContainer>
              <CancelButton onClick={() => setShowInsufficientTokens(false)}>
                Not Now
              </CancelButton>
              <ConfirmButton 
                onClick={() => {
                  setShowInsufficientTokens(false);
                  handleBuyTokens();
                }}
              >
                Buy Tokens
              </ConfirmButton>
            </ModalButtonsContainer>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default PaymentScreen;