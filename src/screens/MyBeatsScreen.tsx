import React, { useState, useEffect, useRef } from 'react'; // Add useRef
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'; // Add updateDoc, deleteDoc
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

const BeatsContainer = styled.div`
  margin-top: 30px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 0;
  color: #888;
`;

const BeatCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const BeatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const BeatId = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #1DB954;
  flex-grow: 1; // Allow BeatId to grow
  margin-right: 10px; // Add space before rename button/input
`;

// Styles for Rename functionality
const RenameInput = styled.input`
  flex-grow: 1;
  padding: 6px 10px;
  border: 1px solid #555;
  background-color: #333;
  color: white;
  border-radius: 4px;
  font-size: 16px;
  margin-right: 10px;
`;

const RenameButton = styled.button`
  padding: 5px 10px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 10px; // Space it from LockStatus

  &:hover {
    background-color: #666;
  }
`;

const SaveRenameButton = styled(RenameButton)` // Inherit styles
  background-color: #1DB954;
  &:hover {
    background-color: #1ed760;
  }
`;

const CancelRenameButton = styled(RenameButton)` // Inherit styles
  background-color: #ff4050;
   margin-left: 5px; // Less space between save/cancel
  &:hover {
    background-color: #ff6070;
  }
`;


const LockStatus = styled.div<{ $locked: boolean }>`
  font-size: 14px;
  color: ${props => props.$locked ? '#9147ff' : '#ccc'};
  font-weight: ${props => props.$locked ? 'bold' : 'normal'};
`;

const BeatActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlayButton = styled.button<{ $isPlaying: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.$isPlaying ? '#ff4050' : '#1DB954'};
  border: none;
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 10px;
  
  &:hover {
    background-color: ${props => props.$isPlaying ? '#ff5060' : '#1ed760'};
  }
`;

const DownloadButton = styled.a`
  padding: 8px 15px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  display: inline-block;
  cursor: pointer;
  
  &:hover {
    background-color: #444;
  }
`;

// Add styling for DeleteButton
const DeleteButton = styled.button`
  padding: 8px 15px;
  background-color: #ff4050; // Red color for delete
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 10px; // Add some space

  &:hover {
    background-color: #ff6070;
  }
`;


const BeatDate = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 10px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  
  &:after {
    content: "";
    width: 30px;
    height: 30px;
    border: 4px solid #333;
    border-top: 4px solid #1DB954;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BackToHomeButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background-color: #1ed760;
  }
`;

interface Beat {
  id: string;
  beatId: string;
  isLocked: boolean;
  createdAt: Date;
  fingerprint: string;
}

const MyBeatsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null); // Keep track of the Firestore beat ID being played
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref to hold the audio element
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null); // ID of beat being renamed
  const [newName, setNewName] = useState(''); // Input value for new name


  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch user beats
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true);
          
          // Fetch user document from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const beatHistory = userData.beatHistory || [];
            
            if (beatHistory.length === 0) {
              setLoading(false);
              return;
            }
            
            // Query beats collection for this user's beats
            const beatsRef = collection(firestore, 'beats');
            const q = query(beatsRef, where('owner', '==', user.uid));
            const querySnapshot = await getDocs(q);
            
            const userBeats: Beat[] = [];
            querySnapshot.forEach((doc) => {
              const beatData = doc.data();
              userBeats.push({
                id: doc.id,
                beatId: beatData.beatId,
                isLocked: beatData.isLocked,
                createdAt: beatData.createdAt.toDate(),
                fingerprint: beatData.fingerprint
              });
            });
            
            // Sort beats by creation date (newest first)
            userBeats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            setBeats(userBeats);
          }
        } catch (error) {
          console.error('Error fetching beats:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  const togglePlayback = (beat: Beat) => {
    const beatAudioUrl = `/download/${beat.beatId}.wav`; // Assuming this is the correct URL

    // Stop currently playing audio if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleAudioEnd); // Clean up listener
      audioRef.current = null;
    }

    // If the clicked beat was the one playing, just stop it
    if (playingBeatId === beat.id) {
      setPlayingBeatId(null);
    } else {
      // Play the new beat
      try {
        audioRef.current = new Audio(beatAudioUrl);
        audioRef.current.addEventListener('ended', handleAudioEnd); // Add listener for when audio finishes
        audioRef.current.play().catch((error: Error) => { // Add type annotation for error
          console.error("Error playing audio:", error);
          alert(`Failed to play beat: ${error.message}`);
          setPlayingBeatId(null); // Reset state on error
          audioRef.current = null;
        });
        setPlayingBeatId(beat.id); // Set the Firestore ID as playing
        console.log(`Playing beat: ${beat.beatId} (ID: ${beat.id}) from ${beatAudioUrl}`);
      } catch (error: unknown) { // Use unknown for better type safety
        console.error("Error creating Audio object:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        alert(`Failed to load beat audio for ${beat.beatId}: ${message}`);
        setPlayingBeatId(null);
        audioRef.current = null;
      }
    }
  };

  // Function to reset playing state when audio finishes
  const handleAudioEnd = () => {
    console.log("Audio ended");
    setPlayingBeatId(null);
    if (audioRef.current) {
       audioRef.current.removeEventListener('ended', handleAudioEnd); // Clean up listener
       audioRef.current = null;
    }
  };


  // Function to handle beat deletion
  const handleDeleteBeat = async (beatIdToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete beat ${beatIdToDelete}? This action cannot be undone.`)) {
      return;
    }

    // Stop playback if the deleted beat is currently playing
    if (playingBeatId === beatIdToDelete && audioRef.current) {
        audioRef.current.pause();
        setPlayingBeatId(null);
        audioRef.current = null;
    }

    try {
      const beatDocRef = doc(firestore, 'beats', beatIdToDelete);
      await deleteDoc(beatDocRef);
      console.log(`Successfully deleted beat: ${beatIdToDelete}`);
      // Update local state to remove the beat
      setBeats(prevBeats => prevBeats.filter(beat => beat.id !== beatIdToDelete));
      alert('Beat deleted successfully.');
    } catch (error) {
      console.error(`Error deleting beat ${beatIdToDelete}:`, error);
      alert(`Failed to delete beat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  // --- Rename Handlers ---
  const handleStartRename = (beat: Beat) => {
    setEditingBeatId(beat.id);
    setNewName(beat.beatId); // Pre-fill input with current name
  };

  const handleCancelRename = () => {
    setEditingBeatId(null);
    setNewName('');
  };

  const handleSaveRename = async (beatIdToRename: string) => {
    if (!newName.trim()) {
      alert('Beat name cannot be empty.');
      return;
    }
    if (newName.length > 50) { // Optional: Add length limit
        alert('Beat name cannot exceed 50 characters.');
        return;
    }

    // Stop playback if the renamed beat is currently playing
    if (playingBeatId === beatIdToRename && audioRef.current) {
        audioRef.current.pause();
        setPlayingBeatId(null);
        audioRef.current = null;
    }


    try {
      const beatDocRef = doc(firestore, 'beats', beatIdToRename);
      await updateDoc(beatDocRef, {
        beatId: newName.trim() // Update the beatId field
      });
      console.log(`Successfully renamed beat: ${beatIdToRename} to ${newName.trim()}`);

      // Update local state
      setBeats(prevBeats =>
        prevBeats.map(beat =>
          beat.id === beatIdToRename ? { ...beat, beatId: newName.trim() } : beat
        )
      );

      handleCancelRename(); // Exit editing mode
      alert('Beat renamed successfully.');

    } catch (error) {
      console.error(`Error renaming beat ${beatIdToRename}:`, error);
      alert(`Failed to rename beat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  // --- End Rename Handlers ---


  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          ← Back
        </BackButton>
        <Title>My Beats</Title>
        <div></div> {/* Empty div to balance header */}
      </Header>
      
      <BeatsContainer>
        {loading ? (
          <LoadingSpinner />
        ) : beats.length === 0 ? (
          <EmptyState>
            <p>You haven't created any beats yet.</p>
            <BackToHomeButton onClick={() => navigate('/')}>
              Create Your First Beat
            </BackToHomeButton>
          </EmptyState>
        ) : (
          <>
            {beats.map((beat) => (
              <BeatCard key={beat.id}>
                <BeatHeader>
                  {editingBeatId === beat.id ? (
                    <>
                      <RenameInput
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        maxLength={50} // Match validation
                        autoFocus
                      />
                      <SaveRenameButton onClick={() => handleSaveRename(beat.id)}>Save</SaveRenameButton>
                      <CancelRenameButton onClick={handleCancelRename}>Cancel</CancelRenameButton>
                    </>
                  ) : (
                    <>
                      <BeatId>{beat.beatId}</BeatId>
                      <LockStatus $locked={beat.isLocked}>
                        {beat.isLocked ? 'Exclusive Rights' : 'Standard License'}
                      </LockStatus>
                      <RenameButton onClick={() => handleStartRename(beat)}>Rename</RenameButton>
                    </>
                  )}
                </BeatHeader>
                
                <BeatActions>
                  <PlayButton
                    $isPlaying={playingBeatId === beat.id} // Compare with Firestore ID
                    onClick={() => togglePlayback(beat)} // Pass the whole beat object
                  >
                    {playingBeatId === beat.id ? '■' : '▶'}
                  </PlayButton>
                  
                  <DownloadButton 
                    href={`/download/${beat.beatId}.wav`}
                    download={`beat_${beat.beatId}.wav`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </DownloadButton>
                  {/* Add Delete Button */}
                  <DeleteButton onClick={() => handleDeleteBeat(beat.id)}>
                    Delete
                  </DeleteButton>
                </BeatActions>

                <BeatDate>
                  Created: {formatDate(beat.createdAt)}
                </BeatDate>
              </BeatCard>
            ))}
            
            <BackToHomeButton onClick={() => navigate('/')}>
              Back to Beat Builder
            </BackToHomeButton>
          </>
        )}
      </BeatsContainer>
    </Container>
  );
};

export default MyBeatsScreen;