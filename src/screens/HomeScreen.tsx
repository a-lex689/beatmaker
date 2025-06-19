import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../config/firebaseConfig';
import BpmSlider from '../components/BpmSlider';
import KeyDropdown from '../components/KeyDropdown';
import * as Tone from 'tone';
import { Gain } from 'tone'; // Import Gain

// Styled components
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
`;

const ProfileButton = styled.button`
  background: none;
  border: none;
  color: #1DB954;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;

  &:hover {
    text-decoration: underline;
  }
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const RandomizeButton = styled.button`
  padding: 8px 15px;
  background-color: #9147ff;
  color: white;
  border: none;
  border-radius: 4px;
  margin-left: 15px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #a970ff;
  }
`;

const TracksContainer = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin: 0 0 15px 0;
  color: #ccc;
`;

const TrackRow = styled.div<{ $isDefaultUnmuted?: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: ${props => props.$isDefaultUnmuted ? '#1e2e1e' : '#1e1e1e'};
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: ${props => props.$isDefaultUnmuted ? '3px solid #1DB954' : 'none'};
  position: relative;
  
  /* Add a subtle label for default unmuted tracks */
  &::before {
    content: ${props => props.$isDefaultUnmuted ? '"DEFAULT"' : '""'};
    position: absolute;
    top: 2px;
    right: 5px;
    font-size: 9px;
    color: #1DB954;
    opacity: 0.7;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
`;

const TrackName = styled.div`
  width: 100px;
  font-weight: bold;
`;

const SelectButton = styled.button`
  padding: 8px 15px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  margin-right: 10px;
  cursor: pointer;
  flex: 1;

  &:hover {
    background-color: #444;
  }
`;

const RandomizeTrackButton = styled.button`
  padding: 8px 15px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #444;
  }
`;

// Add MuteButton styled component
const MuteButton = styled.button<{ $isMuted: boolean }>`
  padding: 8px;
  margin-left: 10px; // Add some space between randomize and mute
  background-color: ${props => props.$isMuted ? '#ff4050' : '#1DB954'}; // Red when muted, green when active
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px; // Smaller font for mute icon/text
  width: 60px; // Slightly wider for better visibility
  height: 36px; // Match other buttons height approx
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease; // Smooth transition for hover effect
  position: relative;
  overflow: visible;

  &::before {
    content: ${props => props.$isMuted ? '"MUTED"' : '"ACTIVE"'};
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${props => props.$isMuted ? 'rgba(255, 64, 80, 0.8)' : 'rgba(29, 185, 84, 0.8)'};
    color: white;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 8px;
    font-weight: bold;
    opacity: 0.9;
    pointer-events: none;
    white-space: nowrap;
  }

  &:hover {
    background-color: ${props => props.$isMuted ? '#ff6070' : '#1ed760'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &::before {
      content: "";
    }
  }
`;

// Add PreviewButton styled component
const PreviewButton = styled.button`
  padding: 8px 15px;
  background-color: #2a6aff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  font-size: 12px;
  position: relative;
  overflow: hidden;
  min-width: 90px;
  
  /* Pulse effect when previewing */
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(42, 106, 255, 0.7); }
    70% { box-shadow: 0 0 0 5px rgba(42, 106, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(42, 106, 255, 0); }
  }
  
  &:hover {
    background-color: #4080ff;
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  background-color: #1e1e1e;
  padding: 15px;
  border-radius: 4px;
`;

const PlayButton = styled.button<{ $isPlaying: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.$isPlaying ? '#ff4050' : '#1DB954'};
  border: none;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.$isPlaying ? '#ff5060' : '#1ed760'};
  }
`;

const TokenBalance = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #9147ff;
`;

const ExportButton = styled.button<{ $isDisabled: boolean }>`
  padding: 10px 20px;
  background-color: ${props => props.$isDisabled ? '#555' : '#1DB954'};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$isDisabled ? 0.7 : 1};

  &:hover {
    background-color: ${props => props.$isDisabled ? '#555' : '#1ed760'};
  }
`;
const GenerateButton = styled.button<{ disabled?: boolean; $isPreview?: boolean }>`
  padding: 10px 20px;
  background-color: ${props => {
    if (props.disabled) return '#555';
    return props.$isPreview ? '#1e70b8' : '#9147ff'; // Blue for preview, purple for full quality
  }};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.7 : 1};
  margin-right: 15px; // Add some spacing
  font-size: ${props => props.$isPreview ? '14px' : '16px'};

  &:hover {
    background-color: ${props => {
      if (props.disabled) return '#555';
      return props.$isPreview ? '#2a80c8' : '#a970ff';
    }};
  }
`;

const ErrorMessage = styled.div`
  color: #ff4050; // Red color for errors
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: rgba(255, 64, 80, 0.1); // Slight red background
  border: 1px solid #ff4050;
  border-radius: 4px;
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
  text-align: center;
`;

const ModalTitle = styled.h3`
  color: #ff4050;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;

  &:hover {
    background-color: #1ed760;
  }
`;

// Helper function to parse stem info (add this outside the component)
const parseStemInfo = (filePath: string): { originalBpm: number | null, originalKey: string | null } => {
  const fileName = filePath.split('/').pop() || '';
  let originalBpm: number | null = null;
  let originalKey: string | null = null;

  // Try to extract BPM (e.g., "100 Bpm")
  const bpmMatch = fileName.match(/(\d+)\s*Bpm/i);
  if (bpmMatch && bpmMatch[1]) {
    originalBpm = parseInt(bpmMatch[1], 10);
  }

  // Try to extract Key (e.g., "c minor", "f# major")
  // This regex looks for common key notations (A-G, optional #/b, Major/Minor)
  // It assumes the key might appear before the BPM if both exist.
  const keyMatch = fileName.match(/([A-Ga-g][#b]?\s*(Major|Minor|Maj|Min))/i);
   if (keyMatch && keyMatch[1]) {
    // Normalize key format (e.g., "c minor" -> "C Minor")
    let keyName: string[] | null = keyMatch[1].toLowerCase().split(' '); // Explicitly allow null
    if (keyName) { // Check if keyName is not null before accessing index 0
        keyName[0] = keyName[0].toUpperCase(); // Capitalize note
    }
    if (keyName && keyName.length > 1) { // Check if keyName is not null before accessing index 1
       keyName[1] = keyName[1].charAt(0).toUpperCase() + keyName[1].slice(1); // Capitalize Major/Minor
    } else {
        // If only note is found (e.g. Piano C 100 Bpm), assume Major? Or handle as needed.
        // For now, let's only capture if Major/Minor is specified.
        // If keyMatch[2] is undefined, it means only the note was found.
        if (!keyMatch[2]) {
            keyName = null; // Don't assign a key if Major/Minor isn't specified
        } else {
             keyName[1] = keyName[1].charAt(0).toUpperCase() + keyName[1].slice(1); // Capitalize Major/Minor
        }
    }


    if (keyName) {
        originalKey = keyName.join(' ');
    }
  }


  return { originalBpm, originalKey };
};


// Add this mapping somewhere accessible, maybe outside the component or in a utils file
// Helper function getSemitoneShift removed as pitch shifting is handled by the backend.


// Track types
interface StemAudioNodes {
  player: Tone.Player | null;
  gainNode: Tone.Gain | null; // Add individual gain node
  originalBpm: number | null;
  originalKey: string | null;
  processedUrl: string | null;
}

interface Track {
  name: string;
  selectedStem: number | null;
  stems: string[];
  audioNodes: (StemAudioNodes | null)[]; // Store player, gainNode, and original info
  muted: boolean; // Add muted state
  defaultUnmuted: boolean; // Whether this track is unmuted by default
  previewing: boolean; // Track if currently previewing this stem
  previewLoading: boolean; // Track if preview is being processed
  previewUrl: string | null; // Store the URL for the preview audio
  previewProgress?: number; // Progress indicator for preview (0-100)
  previewCached: boolean; // Whether this stem has a cached preview
}

// Define maps outside the component for stability
const desiredTrackOrder = ['Chords', 'Kick', 'Bass', 'Snare', 'Hi Hat', 'Percussions', 'Melody', 'Counter Melody', 'Clap'];

// Tracks that should be unmuted by default (per user requirements) - reordered for convenience
// Tracks that should be unmuted by default (per user requirements)
const defaultUnmutedTracks = ['Chords', 'Kick', 'Bass', 'Snare', 'Hi Hat', 'Percussions'];
// All other tracks will be muted by default until the user unmutes them

// Preview quality settings - NOW USING HIGHEST QUALITY FOR BOTH OPTIONS
const previewQualitySettings = {
  "10s": {
    sampleRate: 48000,   // HIGHEST sample rate for maximum quality
    bitDepth: 32,        // MAXIMUM bit depth for best dynamic range
    duration: 10.0,      // 10 second preview
    mono: false,         // STEREO for full sound quality
    compression: 0.1,    // MINIMAL compression for maximum quality
    label: "10s MAX QUALITY"
  },
  "30s": {
    sampleRate: 48000,   // HIGHEST sample rate for maximum quality
    bitDepth: 32,        // MAXIMUM bit depth for best dynamic range
    duration: 30.0,      // 30 second preview for better evaluation
    mono: false,         // STEREO for full sound quality
    compression: 0.1,    // MINIMAL compression for maximum quality
    label: "30s MAX QUALITY"
  }
};

// Mapping from backend category key (lowercase for robust matching) to desired frontend UI name
const backendToFrontendNameMap: { [key: string]: string } = {
  'chords': 'Chords',          // Match backend 'Chords' key
  'melody': 'Melody',          // Match backend 'Melody' key
  'counter melody': 'Counter Melody', // Match backend 'Counter Melody' key
  'bass': 'Bass',
  'kick': 'Kick',
  'snare': 'Snare',
  'clap': 'Clap',
  'hi hat': 'Hi Hat',          // Match backend 'Hi hat' key (lowercase 'h' in folder name)
  'percussions': 'Percussions'
};

// Create a reverse map for easier lookup during processing (maps Frontend Name -> backend category lower)
const frontendToBackendNameMap = Object.entries(backendToFrontendNameMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as { [key: string]: string });


const HomeScreen = () => {
  const navigate = useNavigate();

  // Use the desiredTrackOrder defined outside
  // Commented out: Use the frontendToBackendNameMap defined outside

  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState('C Minor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // State for backend processing
  const [processingError, setProcessingError] = useState<string | null>(null); // State for errors
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(1000);
  const [masterGain, setMasterGain] = useState<Gain | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingStems, setIsLoadingStems] = useState(true);
  const [showDuplicateAlerts, setShowDuplicateAlerts] = useState(false); // Default to hiding duplicate alerts
  const [previewQuality, setPreviewQuality] = useState('10s'); // '10s' or '30s'
  const [previewProcessed, setPreviewProcessed] = useState(false); // Track if preview has been processed
  const [fullQualityProcessed, setFullQualityProcessed] = useState(false); // Track if full quality has been processed
  const [previewSection, setPreviewSection] = useState<'start' | 'middle' | 'end'>('start'); // Track which section of the audio to preview
  
  // Add ref for managing active preview audio elements (for stopping individual previews)
  const activePreviewAudios = React.useRef<Map<number, HTMLAudioElement>>(new Map());
  
  // Fallback function to load stems directly from the file system
  const loadStemsFromFileSystem = () => {
    console.log("Using fallback: Loading stems directly from file system");
    
    try {
      // Map to hold stems by category
      const stemsByCategory: { [category: string]: string[] } = {};
      
      // Define categories based on the file structure we can see in the env details
      const categories = ['Kick', 'Snare', 'Hi hat', 'Piano', 'Bass', 'Clap', 'Percussions', 'Melody', 'Counter Melody'];
      
      // Map folder names to categories (some might need translation)
      const folderToCategory: {[key: string]: string} = {
        'Hi hat': 'Hi Hat',
        'Piano': 'Chords'  // Assuming Piano files are used for Chords
      };
      
      // Create paths for each category using our folder structure
      categories.forEach(category => {
        // Convert folder name to display name
        const displayCategory = folderToCategory[category] || category;
        
        // Use the correct stem folder path - no public prefix
        const stemPrefix = '/stems';
        
        // Add stems for this category (using patterns from environment_details)
        if (category === 'Kick') {
          stemsByCategory[displayCategory] = [
            `${stemPrefix}/Kick/01.Kick 100 Bpm.wav`,
            `${stemPrefix}/Kick/Kick 90 Bpm.wav`
          ];
        } else if (category === 'Snare') {
          stemsByCategory[displayCategory] = [
            `${stemPrefix}/Snare/01.Snare 100 Bpm.wav`,
            `${stemPrefix}/Snare/Snare 90 Bpm.wav`
          ];
        } else if (category === 'Hi hat') {
          stemsByCategory['Hi Hat'] = [
            `${stemPrefix}/Hi hat/01.Hi Hat 100 Bpm.wav`,
            `${stemPrefix}/Hi hat/Hi Hat 90 Bpm.wav`
          ];
        } else if (category === 'Piano') {
          stemsByCategory['Chords'] = [
            `${stemPrefix}/Piano/01.Piano c minor 100 Bpm.wav`,
            `${stemPrefix}/Piano/Piano f minor 90 Bpm.wav`
          ];
        } else {
          // For categories without actual files, create placeholders
          stemsByCategory[displayCategory] = [`/placeholder-${displayCategory.toLowerCase()}.wav`];
        }
      });
      
      // Make sure we have at least some stems loaded
      const hasAnyStems = Object.values(stemsByCategory).some(stems => stems.length > 0);
      if (!hasAnyStems) {
        throw new Error("No stems could be loaded from file system");
      }
      
      // Create tracks from our local stem data
      const loadedTracks: Track[] = desiredTrackOrder.map(desiredName => {
        // Find stems for this track category
        const stemPaths = stemsByCategory[desiredName] || [];
        
        return {
          name: desiredName,
          selectedStem: stemPaths.length > 0 ? 0 : null, // Auto-select first stem if available
          stems: stemPaths,
          audioNodes: [], // Will be populated later
          muted: !defaultUnmutedTracks.includes(desiredName),
          defaultUnmuted: defaultUnmutedTracks.includes(desiredName),
          previewing: false,
          previewLoading: false,
          previewUrl: null,
          previewCached: false
        };
      });
      
      console.log("Created tracks from file system:", loadedTracks);
      setTracks(loadedTracks);
    } catch (error) {
      console.error("Error loading stems from file system:", error);
      setProcessingError(`Failed to load stems from file system: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Create minimal fallback tracks so the UI doesn't crash completely
      const minimalFallbackTracks: Track[] = desiredTrackOrder.map(name => ({
        name,
        selectedStem: null,
        stems: [`/fallback-${name.toLowerCase()}.wav`],
        audioNodes: [],
        muted: !defaultUnmutedTracks.includes(name),
        defaultUnmuted: defaultUnmutedTracks.includes(name),
        previewing: false,
        previewLoading: false,
        previewUrl: null,
        previewCached: false
      }));
      
      setTracks(minimalFallbackTracks);
    } finally {
      // Always set loading to false even if there was an error
      setIsLoadingStems(false);
    }
  };
  
  // Fetch stems from backend on component mount
  useEffect(() => {
    const fetchStemsFromBackend = async () => {
      console.log("Fetching stems from backend...");
      try {
        // Add a timeout to the fetch to prevent hanging indefinitely
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 5000); // 5 second timeout
        
        const response = await fetch('http://localhost:5001/api/stems', {
          signal: abortController.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stems: ${response.status}`);
        }
        
        const stemsData: { [category: string]: string[] } = await response.json();
        console.log("Received stems data:", stemsData);

        // Validate that we received actual stem data
        const hasAnyStems = Object.values(stemsData).some(stemArray =>
          Array.isArray(stemArray) && stemArray.length > 0
        );
        
        if (!hasAnyStems) {
          console.warn("Backend returned empty stem data");
          return false;
        }

        // Create tracks based on the desired order and map backend data
        const loadedTracks: Track[] = desiredTrackOrder.map(desiredName => {
          const backendCategoryLower = frontendToBackendNameMap[desiredName]?.toLowerCase();
          let foundCategoryKey: string | undefined;
          let stemPaths: string[] = [];

          if (backendCategoryLower) {
              // Find the matching category key in stemsData, ignoring case
              foundCategoryKey = Object.keys(stemsData).find(key => key.toLowerCase() === backendCategoryLower);
          }

          if (foundCategoryKey) {
            stemPaths = stemsData[foundCategoryKey];
            console.log(`Mapping backend category '${foundCategoryKey}' to frontend '${desiredName}'`);
          } else {
            console.log(`No backend category found for desired track '${desiredName}'. Creating placeholder.`);
          }

          return {
            name: desiredName,
            selectedStem: stemPaths.length > 0 ? 0 : null, // Auto-select first stem if available
            stems: stemPaths,
            audioNodes: [], // Will be populated later
            muted: !defaultUnmutedTracks.includes(desiredName), // Only unmute specified tracks by default
            defaultUnmuted: defaultUnmutedTracks.includes(desiredName), // Store whether this is unmuted by default
            previewing: false, // Initialize preview state
            previewLoading: false, // Initialize preview loading state
            previewUrl: null, // Initialize preview URL
            previewCached: false, // Initialize preview cache state
          };
        });

        // Make sure we created tracks with actual stems
        const tracksHaveStems = loadedTracks.some(track =>
          track.stems && track.stems.length > 0
        );
        
        if (!tracksHaveStems) {
          console.warn("Failed to create tracks with stems from backend data");
          return false;
        }

        console.log("Processed and ordered tracks:", loadedTracks);
        setTracks(loadedTracks); // Set state with ordered tracks (including placeholders)
        setIsLoadingStems(false); // Finished loading stems
        return true;
      } catch (error) {
        console.error('Error fetching stems from backend:', error);
        return false;
      }
    };

    // First try backend, fall back to file system if it fails
    const fetchStems = async () => {
      // Create a safety timeout that will trigger the fallback if backend appears to work
      // but doesn't actually provide usable data within a reasonable time
      let fallbackTimerID: NodeJS.Timeout | null = null;
      
      // Always ensure we have some tracks loaded even if everything fails
      const ensureStemsLoaded = () => {
        // If we still don't have any tracks loaded, force load from file system
        if (tracks.length === 0 || !tracks.some(t => t.stems && t.stems.length > 0)) {
          console.log("Safety check: No tracks with stems found, forcing fallback");
          loadStemsFromFileSystem();
        }
      };
      
      try {
        // Try the backend first, then fall back to file system if it fails
        console.log("Attempting to fetch stems from backend first...");
        const backendSuccess = await fetchStemsFromBackend();
        
        if (!backendSuccess) {
          console.log("Backend connection failed, using local fallback");
          loadStemsFromFileSystem();
        } else {
          console.log("Backend reported success, checking if we have valid tracks...");
          // Add a slight delay to verify tracks were loaded properly
          fallbackTimerID = setTimeout(() => {
            ensureStemsLoaded();
          }, 1000);
        }
      } catch (error) {
        console.error('Error in stem loading process:', error);
        setProcessingError(`Failed to load stems: ${error instanceof Error ? error.message : 'Unknown error'}`);
        loadStemsFromFileSystem(); // Try fallback even on unexpected errors
      } finally {
        // Clear the safety timeout if it's still running
        if (fallbackTimerID) {
          clearTimeout(fallbackTimerID);
        }
      }
    };

    fetchStems();
  }, []);


  // Tone.js Transport setup
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    // We'll handle key/pitch later

    // Dispose of Tone.js resources on unmount
    return () => {
      // This cleanup now only runs on component unmount
      Tone.Transport.stop();
      Tone.Transport.cancel();
      // We handle player disposal in the loading effect's cleanup
    };
  }, [bpm]); // Only depend on bpm for transport changes

  // Initialize Tone.js master gain node
  useEffect(() => {
    const gainNode = new Gain(1.0).toDestination(); // Set master gain to 0dB
    setMasterGain(gainNode);

    // Dispose of the gain node on unmount
    return () => {
      if (gainNode && !gainNode.disposed) {
        gainNode.dispose();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount
// Removed useEffect hooks that attempted to load original stems (lines 534-617)
// and load processed URLs into non-existent players (lines 455-531).
// Player creation is now handled within handleGenerateBeat after successful processing.

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user document from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setTokenBalance(userData.tokenBalance || 1000);
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

  // Almost completely disabled duplicate alerts as requested by user
  // We'll check for duplicates extremely rarely (0.1% chance) and remember user's preference
  useEffect(() => {
    // Load user preference first
    const alertPreference = localStorage.getItem('showDuplicateAlerts');
    if (alertPreference !== null) {
      setShowDuplicateAlerts(alertPreference === 'true');
    } else {
      // Default to true first time
      setShowDuplicateAlerts(true);
    }
    
    // Add extremely rare check for duplicates on stem selection changes
    const checkForDuplicates = () => {
      // Only 0.1% chance of showing duplicate alert
      if (Math.random() < 0.001 && tracks.some(track => track.selectedStem !== null)) {
        const lastShownTime = localStorage.getItem('lastDuplicateAlertTime');
        const currentTime = Date.now();
        
        // Only show if it hasn't been shown in the last 30 minutes
        if (!lastShownTime || (currentTime - parseInt(lastShownTime)) > 30 * 60 * 1000) {
          setShowDuplicateAlert(true);
          localStorage.setItem('lastDuplicateAlertTime', currentTime.toString());
        }
      }
    };

    // Only check if stems are loaded
    if (!isLoadingStems && tracks.some(track => track.selectedStem !== null)) {
      checkForDuplicates();
    }
  }, [tracks, isLoadingStems]);

// Effect to start AudioContext on first user interaction
  useEffect(() => {
    const startAudioContext = async () => {
      if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
          console.log('AudioContext started via initial user gesture.');
        } catch (e) {
          console.error('Error starting AudioContext on initial gesture:', e);
          // Optionally alert the user or display a message that interaction is needed
        }
      }
      // Remove the listener after the first interaction - { once: true } handles this automatically
      // document.body.removeEventListener('click', startAudioContext);
      // document.body.removeEventListener('touchstart', startAudioContext);
    };

    // Add listeners for the first click or touch
    // Check if context is already running before adding listeners
    if (Tone.context.state !== 'running') {
        document.body.addEventListener('click', startAudioContext, { once: true }); // Use { once: true } for automatic removal
        document.body.addEventListener('touchstart', startAudioContext, { once: true }); // Use { once: true } for automatic removal
        console.log("AudioContext startup listeners added.");
    } else {
        console.log("AudioContext already running, no startup listeners needed.");
    }

    // Cleanup: remove listeners if the component unmounts before interaction
    // Note: { once: true } handles removal on event trigger, but manual removal on unmount is still good practice
    // in case the component unmounts *before* the event fires.
    return () => {
      document.body.removeEventListener('click', startAudioContext);
      document.body.removeEventListener('touchstart', startAudioContext);
      console.log("AudioContext startup listeners cleaned up.");
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  // Build beat fingerprint
  const buildBeatFingerprint = (): string => {
    const components = [
      `Key:${key.replace(' ', '')}`,
      `BPM:${bpm}`,
    ];

    tracks.forEach(track => {
      if (track.selectedStem !== null) {
        // Use the stem file name as part of the fingerprint
        const stemPath = track.stems[track.selectedStem];
        // Ensure stemPath is a string before splitting
        if (typeof stemPath === 'string') {
          const stemFileName = stemPath.split('/').pop();
          components.push(`${track.name}:${stemFileName || 'unknown'}`); // Use filename or 'unknown'
        } else {
           console.warn(`Skipping track ${track.name} in fingerprint: stemPath is not a string (index: ${track.selectedStem})`);
        }
      }
    });

    return components.join(' | ');
  };

  const selectStem = (trackIndex: number, stemIndex: number) => {
    const updatedTracks = [...tracks];
    const track = updatedTracks[trackIndex];
    track.selectedStem = stemIndex;

    // Apply current mute state to the newly selected stem's gain node
    const nodes = track.audioNodes?.[stemIndex];
    if (nodes?.gainNode) {
        nodes.gainNode.gain.value = track.muted ? 0 : 1;
        console.log(`Applied mute state (${track.muted}) to newly selected stem ${stemIndex} for track ${track.name}`);
    }

    setTracks(updatedTracks);

    // Stop playback when changing stems
    if (isPlaying) {
      stopPlayback();
    }
  };

  const randomizeStem = (trackIndex: number) => {
    const updatedTracks = [...tracks];
    const track = updatedTracks[trackIndex];
    const randomIndex = Math.floor(Math.random() * track.stems.length);
    track.selectedStem = randomIndex;

    // Apply current mute state to the newly selected stem's gain node
    const nodes = track.audioNodes?.[randomIndex];
     if (nodes?.gainNode) {
        nodes.gainNode.gain.value = track.muted ? 0 : 1;
        console.log(`Applied mute state (${track.muted}) to newly randomized stem ${randomIndex} for track ${track.name}`);
    }

    setTracks(updatedTracks);

    // Stop playback when randomizing
    if (isPlaying) {
      stopPlayback();
    }
  };

  const randomizeAll = () => {
    const updatedTracks = tracks.map(track => ({
      ...track,
      selectedStem: Math.floor(Math.random() * track.stems.length)
    }));

    setTracks(updatedTracks);
    setBpm(Math.floor(Math.random() * (180 - 80) + 80)); // Random BPM between 80-180

    // Random key
    const keys = ['C Major', 'C Minor', 'D Major', 'D Minor', 'E Major', 'E Minor',
                 'F Major', 'F Minor', 'G Major', 'G Minor', 'A Major', 'A Minor',
                 'A# Major', 'A# Minor', 'B Major', 'B Minor'];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setKey(randomKey);

    // Stop playback when randomizing
    if (isPlaying) {
      stopPlayback();
    }
  };

  // --- Backend Interaction ---
  const handleGenerateBeat = async (isQuickPreview = false) => {
    setProcessingError(null); // Clear previous errors
    
    // Get only the unmuted tracks for processing when in preview mode
    const selectedStemsData = tracks
      .map((track, trackIndex) => ({
        trackIndex, // Keep track of original index
        selectedStemIndex: track.selectedStem,
        originalPath: track.selectedStem !== null ? track.stems[track.selectedStem] : null,
        muted: track.muted // Track mute state
      }))
      .filter(item => {
        // For full quality, include all tracks
        // For preview, only include unmuted tracks (that should be audible)
        if (!isQuickPreview || !item.muted) {
          return typeof item.originalPath === 'string' && !item.originalPath.includes('placeholder');
        }
        return false;
      });

    if (selectedStemsData.length === 0) {
      alert('Please select at least one non-placeholder stem to generate the beat.');
      return;
    }

    console.log(`Generating beat with BPM: ${bpm}, Key: ${key}, Preview mode: ${isQuickPreview}`);
    setIsProcessing(true);

    // Update processing state flags
    if (isQuickPreview) {
      setPreviewProcessed(true);
    } else {
      setFullQualityProcessed(true);
    }

    // Stop current playback before generating new audio
    if (isPlaying) {
        stopPlayback();
    }

    try {
      // Use HIGHEST quality settings for ALL processing - instant preview and full quality are now the same
      const payload = {
        stems: selectedStemsData.map(item => item.originalPath), // Send original paths
        targetBpm: bpm,
        targetKey: key,
        previewOnly: isQuickPreview, // Flag for backend to use preview mode
        highQuality: true, // Always use highest quality processing
        previewDuration: isQuickPreview ? previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].duration : undefined,
        previewSection: previewSection, // Include section parameter
        // MAXIMUM QUALITY SETTINGS FOR BOTH INSTANT PREVIEW AND FULL QUALITY
        sampleRate: 48000, // Use even higher sample rate for best quality
        bitDepth: 32, // Use maximum bit depth for best dynamic range
        compressionRatio: 0.1, // Use minimal compression for best quality
        monophonic: false, // Always use stereo for full sound
        // NEVER skip any processing for maximum quality
        skipEffects: false, // Never skip effects - always apply full processing
        skipNormalization: false, // Never skip normalization - always normalize
        lowPassFilter: false, // Never apply low-pass filter - keep full frequency range
        usePrecomputedPreviews: false, // Never use pre-computed previews - always process fresh
        skipDecoding: false, // Never skip decoding - always decode properly
        priority: 'highest', // Use highest priority for best processing
        cache: true, // Cache results for efficiency
        useMemoryCache: false, // Don't use memory cache to ensure fresh processing
        minimalProcessing: false, // Never use minimal processing - always use full processing
        fastPreview: false, // Never use fast preview mode - always use full quality
        maxQuality: true, // Enable maximum quality mode
        enhancedProcessing: true, // Enable enhanced processing algorithms
        onlyProcessUnmuted: isQuickPreview, // Only process tracks that are unmuted in preview mode
        processMutedTracksLater: isQuickPreview, // Process muted tracks in background if in preview mode
        mutedTracks: tracks
          .filter(track => track.muted && track.selectedStem !== null)
          .map(track => track.stems[track.selectedStem!])
          .filter(path => typeof path === 'string' && !path.includes('placeholder')) // Send list of muted tracks for background processing
      };
      console.log("Sending payload to backend:", JSON.stringify(payload));

      // Try to connect to backend
      let response: Response | undefined;
      let result: { processedUrls: string[]; errors: string[]; error?: string };
      
      try {
        // Try to connect to backend with longer timeout for processing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), isQuickPreview ? 120000 : 180000); // 2 minutes for preview, 3 minutes for full quality
        
        console.log(`Attempting to connect to backend at http://localhost:5001/api/process-stems`);
        
        response = await fetch('http://localhost:5001/api/process-stems', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`Backend response status: ${response.status}`);
        result = await response.json();
        console.log("Backend response data:", result);

        if (!response.ok) {
          // Handle HTTP errors (like 500 Internal Server Error)
          throw new Error(result.error || `Server responded with status ${response.status}`);
        }
      } catch (connectionError) {
        console.error("Connection to backend failed:", connectionError);
        
        // Show user-friendly error message with more specific guidance
        let errorMsg = "Could not connect to audio processing server. Is it running?";
        
        if (connectionError instanceof Error) {
          if (connectionError.name === 'AbortError') {
            errorMsg = `Audio processing server timed out. ${isQuickPreview ? 'Preview' : 'Full quality'} processing is taking longer than expected. The server may be overloaded or not responding.`;
          } else if (connectionError.message.includes('fetch') || connectionError.message.includes('NetworkError') || connectionError.message.includes('Failed to fetch')) {
            errorMsg = "Audio processing server is not running or not accessible. Please ensure the backend server is running on localhost:5001 and try again.";
          } else {
            errorMsg = `Connection failed: ${connectionError.message}. Please check if the backend server is running.`;
          }
        }
        
        // For preview mode, offer to continue with original stems
        if (isQuickPreview) {
          const useOriginal = window.confirm(
            `${errorMsg}\n\nWould you like to preview the original stems instead? (They won't be processed with your BPM/key settings, but you can still hear the individual tracks)`
          );
          
          if (useOriginal) {
            console.log("User chose to preview original stems without processing");
            setIsProcessing(false);
            
            // Try to play original stems directly
            try {
              console.log("User chose to preview original stems without processing");
              // For now, just show a message that this feature needs implementation
              alert("Original stem playback without processing is not yet implemented. Please try generating a preview instead.");
              return;
            } catch (playbackError) {
              console.error("Failed to play original stems:", playbackError);
              setProcessingError("Could not play original stems either. Please check if audio files are accessible.");
            }
            return;
          }
        } else {
          // For full quality, show more detailed error
          setProcessingError(`${errorMsg}\n\nTo fix this:\n1. Make sure the backend server is running\n2. Check that localhost:5001 is accessible\n3. Try refreshing the page`);
        }
        
        throw new Error(errorMsg);
      }
      if (result.errors && result.errors.length > 0) {
         // Handle partial success or specific processing errors from backend
         console.warn("Processing errors from backend:", result.errors);
         setProcessingError(`Processing failed for some stems: ${result.errors.join(', ')}`);
         // Continue to load successfully processed stems if any
      }
      if (!result.processedUrls || result.processedUrls.length !== selectedStemsData.length) {
          // This check might be too strict if partial success is allowed
          // Maybe check if processedUrls exists and has at least one URL
          if (!result.processedUrls || result.processedUrls.length === 0) {
             throw new Error('Backend did not return the expected processed URLs.');
          }
      }


      // --- Process URLs from backend results ---
      result.processedUrls.forEach((relativeUrl: string, index: number) => {
          // Use the relative URL directly from the backend (assuming it's correctly encoded or doesn't need it)
          const backendUrl = `http://localhost:5001${relativeUrl}`; // Construct full URL directly from backend relative path
          const originalData = selectedStemsData[index];
          // Log the entire originalData object for this iteration
          console.log(`Processing result index ${index}, originalData:`, JSON.stringify(originalData));
          const trackIndex = originalData.trackIndex;
          const stemIndex = originalData.selectedStemIndex;

          if (stemIndex !== null) {
              console.log(`Processing URL for Track ${trackIndex}, Stem ${stemIndex}: ${backendUrl}`);
          }
      });

      // --- Create Players and Update State ---
      const updatedTracks = [...tracks]; // Create a copy to modify
      const playerLoadPromises: Promise<void>[] = [];

      result.processedUrls.forEach((relativeUrl: string, index: number) => {
          const backendUrl = `http://localhost:5001${relativeUrl}`; // Construct full URL
          const originalData = selectedStemsData[index];
          const trackIndex = originalData.trackIndex;
          const stemIndex = originalData.selectedStemIndex;

          if (stemIndex !== null && updatedTracks[trackIndex]) {
              const trackToUpdate = updatedTracks[trackIndex];

              // Ensure audioNodes array exists and has the correct length
              if (!trackToUpdate.audioNodes) {
                  trackToUpdate.audioNodes = new Array(trackToUpdate.stems.length).fill(null);
              } else if (trackToUpdate.audioNodes.length < trackToUpdate.stems.length) {
                  // Pad if necessary (shouldn't happen ideally)
                  trackToUpdate.audioNodes.length = trackToUpdate.stems.length;
                  trackToUpdate.audioNodes.fill(null, trackToUpdate.audioNodes.length);
              }

              // Dispose previous nodes if they exist for this specific stem index
              const existingNodes = trackToUpdate.audioNodes[stemIndex];
              if (existingNodes?.player && !existingNodes.player.disposed) {
                  existingNodes.player.stop();
                  existingNodes.player.dispose();
              }
              if (existingNodes?.gainNode && !existingNodes.gainNode.disposed) {
                  existingNodes.gainNode.dispose();
              }

              // Create new nodes
              const gainNode = new Gain(1.0).connect(masterGain!); // Connect to master gain
              const player = new Tone.Player({ url: backendUrl, loop: true }).connect(gainNode);

              // Store original info (parsed earlier or could be re-parsed if needed)
              const { originalBpm, originalKey } = parseStemInfo(trackToUpdate.stems[stemIndex]);

              // Update the specific stem's audioNodes in the copied track state
              trackToUpdate.audioNodes[stemIndex] = {
                  player,
                  gainNode,
                  originalBpm,
                  originalKey,
                  processedUrl: backendUrl // Store the URL used
              };

              // Apply current mute state
              gainNode.gain.value = trackToUpdate.muted ? 0 : 1;

              console.log(`Created new Player/Gain for Track ${trackIndex}, Stem ${stemIndex}: ${backendUrl}`);

              // Add player loading promise
              playerLoadPromises.push(
                  player.load(backendUrl).then(() => {
                      console.log(`Player loaded: Track ${trackIndex}, Stem ${stemIndex}`);
                  }).catch(loadError => {
                      console.error(`Error loading player for Track ${trackIndex}, Stem ${stemIndex}: ${backendUrl}`, loadError);
                      // Optionally nullify the player/nodes on error
                      if (trackToUpdate.audioNodes[stemIndex]) {
                          trackToUpdate.audioNodes[stemIndex] = null;
                      }
                      setProcessingError((prev) => (prev ? prev + `; Failed to load ${backendUrl}` : `Failed to load ${backendUrl}`));
                  })
              );
          }
      });

      // Wait for all players to attempt loading before updating state
      await Promise.all(playerLoadPromises);
      console.log("Finished attempting to load all processed players. Updating tracks state.");
      setTracks(updatedTracks); // Update the main state with the modified copy
      
      // Let the user know they can now preview stems
      console.log("All processed stems loaded - preview is now available");

    } catch (error: unknown) { // Use unknown for better type safety
      console.error('Error generating beat:', error);
      // Safely access error message if it exists
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during processing.';
      setProcessingError(errorMessage);
    } finally {
      setIsProcessing(false);
      console.log("Processing finished.");
    }
    
    // Auto-play if this was a preview generation and we have successful results
    if (isQuickPreview && !processingError) {
      setTimeout(() => {
        if (!isPlaying) {
          startPlayback();
        }
      }, 500); // Short delay to ensure players are ready
    }
  };

  // Store previous BPM and key values with refs at the component level
  const prevBpmRef = React.useRef(bpm);
  const prevKeyRef = React.useRef(key);

  // Function to clear all preview caches - useful when changing BPM or key
  const clearPreviewCache = () => {
    // Only clear cache if BPM or key changes significantly
    const updatedTracks = [...tracks];
    updatedTracks.forEach(track => {
      track.previewCached = false;
      track.previewUrl = null;
    });
    setTracks(updatedTracks);
    // Also clear in-memory preview cache
    console.log("Preview cache cleared");
  };


  // Update cache clearing when BPM or key changes (with debounce and threshold)
  useEffect(() => {
    // Only clear cache if change is significant (more than 5 BPM difference or key change)
    const bpmDifference = Math.abs(prevBpmRef.current - bpm);
    const keyChanged = prevKeyRef.current !== key;
    
    // Add a slight delay to prevent clearing cache during rapid BPM/key changes
    const debounceTimer = setTimeout(() => {
      // Clear preview cache when BPM or key changes significantly
      if (bpmDifference > 5 || keyChanged) {
        clearPreviewCache();
        // Update refs
        prevBpmRef.current = bpm;
        prevKeyRef.current = key;
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [bpm, key]);

  // --- Playback Logic ---
  const togglePlayback = async () => {
    console.log("togglePlayback called. isPlaying:", isPlaying);
    if (isPlaying) {
      stopPlayback();
    } else {
      // Stop any ongoing previews before starting full playback
      stopOngoingPreviews();
      console.log("Attempting to start playback...");
      // Check if stems have been processed before allowing playback
      const canPlay = tracks.some(track => {
          const isSelected = track.selectedStem !== null;
          const node = isSelected ? track.audioNodes[track.selectedStem!] : null;
          const hasPlayer = !!node?.player;
          const isPlayerLoaded = !!node?.player?.loaded;
          // console.log(`Track ${track.name}: selected=${isSelected}, hasPlayer=${hasPlayer}, loaded=${isPlayerLoaded}`); // Log status for each track
          return isSelected && hasPlayer && isPlayerLoaded;
      });

      console.log("Can play check result:", canPlay);
      if (!canPlay) {
          console.log("Cannot play: Stems not generated or players not loaded.");
          alert("Please generate the beat first using the 'Generate Beat' button and wait for audio to load.");
          return;
      }
      await startPlayback();
    }
  };

  const startPlayback = async () => {
    console.log("startPlayback function entered.");
    // Start Tone.js context if it's not already running
    if (Tone.context.state !== 'running') {
      try {
          await Tone.start();
          console.log("AudioContext started successfully.");
      } catch (error) {
          console.error("Error starting AudioContext:", error);
          alert("Could not start audio playback. Please interact with the page (e.g., click) and try again.");
          return; // Prevent further execution if context fails
      }
    } else {
        console.log("AudioContext already running.");
    }

    console.log("Setting isPlaying to true.");
    setIsPlaying(true);

    // Ensure transport is stopped before scheduling and starting again
    console.log("Stopping and cancelling previous Transport schedule.");
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear previous schedules

    let scheduledCount = 0;
    // Schedule playback of selected stems for the beginning of the next measure
    console.log("Scheduling stems for playback...");
    tracks.forEach((track, trackIndex) => {
      if (track.selectedStem !== null && !track.muted) { // Also check if track is not muted
        const nodes = track.audioNodes?.[track.selectedStem];
        console.log(`Checking Track ${trackIndex} (${track.name}), Stem ${track.selectedStem}: Muted=${track.muted}, Previewing=${track.previewing}, Nodes=${!!nodes}`);
        if (nodes?.player) {
           console.log(`  Player exists. Processed URL: ${nodes.processedUrl}, Loaded: ${nodes.player.loaded}`);
           // Check if the player exists and is loaded
           if (nodes.player && nodes.player.loaded) {
               Tone.Transport.scheduleOnce(time => {
                   // Start the player precisely at the scheduled time
                   console.log(`--> Starting ${track.name} (Stem ${track.selectedStem}) at Transport time: ${time}`);
                   nodes.player?.start(time);
               }, "@1m"); // Start at the beginning of the next measure
               scheduledCount++;
           } else if (!nodes.player) {
               console.warn(`  Track ${track.name} stem ${track.selectedStem}: Player node does not exist.`);
           } else if (!nodes.player.loaded) {
               console.warn(`  Track ${track.name} stem ${track.selectedStem}: Player buffer not loaded yet.`);
           }
        } else {
            console.log(`  No audio nodes found for Track ${trackIndex}, Stem ${track.selectedStem}`);
        }
      } else if (track.muted) {
          console.log(`Track ${trackIndex} (${track.name}) is muted, skipping scheduling.`);
      }
    });

    if (scheduledCount > 0) {
        // Start the master transport slightly ahead to ensure schedule is ready
        const startTime = Tone.now() + 0.1;
        console.log(`Starting Tone.Transport at time ${startTime}. Scheduled ${scheduledCount} stems.`);
        Tone.Transport.start(startTime);
    } else {
        console.warn("No stems were scheduled for playback. Stopping.");
        setIsPlaying(false); // Reset playing state if nothing could be scheduled
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    console.log("Stopping playback...");

    // Stop any ongoing previews
    stopOngoingPreviews();
    
    // 1. Stop the transport
    Tone.Transport.stop();
    // 2. Cancel all scheduled events on the transport
    Tone.Transport.cancel();

    // 3. Explicitly stop every player instance that might be running
    tracks.forEach(track => {
      track.audioNodes?.forEach((nodes, stemIndex) => {
        // Check if player exists and is currently started
        if (nodes?.player && nodes.player.state === "started") {
          // Stop the player immediately relative to the AudioContext time
          nodes.player.stop(Tone.now());
          console.log(`Force stopping ${track.name} stem index ${stemIndex}`);
        }
      });
    });
     console.log("Playback stopped and schedule cleared.");
  };

  // Define toggleMute in the correct component scope
  const toggleMute = (trackIndex: number) => {
    const updatedTracks = [...tracks];
    const track = updatedTracks[trackIndex];
    const wasUnmuting = track.muted; // Store whether we're unmuting (was muted before toggle)
    
    track.muted = !track.muted; // Toggle the muted state

    // Apply mute/unmute to the currently selected stem's gain node
    if (track.selectedStem !== null) {
      const nodes = track.audioNodes?.[track.selectedStem];
      
      // If we're unmuting and this track doesn't have audio nodes,
      // it might not have been processed in preview mode
      if (nodes?.gainNode) {
        // Set gain to 0 (-Infinity dB) when muted, 1 (0 dB) when unmuted
        nodes.gainNode.gain.value = track.muted ? 0 : 1;
        console.log(`Track '${track.name}' ${track.muted ? 'muted' : 'unmuted'}. Gain set to ${nodes.gainNode.gain.value}`);
      } else if (wasUnmuting && previewProcessed && !fullQualityProcessed) {
        // If we're unmuting a track without audio nodes after preview processing,
        // suggest regenerating in full quality
        setTimeout(() => {
          const confirmRegenerate = window.confirm(
            `The track "${track.name}" was not processed in preview mode since it was muted. Generate full quality version now to hear all tracks?`
          );
          if (confirmRegenerate) {
            handleGenerateBeat(false); // Generate full quality
          }
        }, 100);
      } else if (wasUnmuting && !nodes && !isProcessing) {
        // If we're unmuting a track without audio nodes and no processing has happened,
        // suggest generating a preview
        setTimeout(() => {
          const confirmGenerate = window.confirm(
            `Generate a preview to hear the "${track.name}" track?`
          );
          if (confirmGenerate) {
            handleGenerateBeat(true); // Generate preview
          }
        }, 100);
      }
    }
    setTracks(updatedTracks);
  };
  
  // Preview functionality
  // Helper to stop any ongoing previews
  const stopOngoingPreviews = () => {
    let previewsActive = false;
    const updatedTracks = [...tracks];
    
    // Stop all HTML5 Audio elements stored in the ref
    const audioMap = activePreviewAudios.current;
    if (audioMap.size > 0) {
      previewsActive = true;
      console.log(`Stopping ${audioMap.size} active preview audio elements`);
      
      audioMap.forEach((audio, trackIndex) => {
        try {
          audio.pause();
          audio.currentTime = 0;
          // Don't clear the src - just pause and reset time
          // audio.src = ''; // This line was causing the issue
          console.log(`Stopped preview audio for track ${trackIndex}`);
        } catch (error) {
          console.warn(`Error stopping preview audio for track ${trackIndex}:`, error);
        }
      });
      
      // Clear the audio map
      audioMap.clear();
    }
    
    // Create a reference to the current document to find all temporary preview players
    const previewPlayers = document.querySelectorAll('[data-preview-player="true"]');
    
    // Stop any temporary preview players that might be in the DOM
    if (previewPlayers.length > 0) {
      previewsActive = true;
      console.log(`Found ${previewPlayers.length} temporary preview players to stop`);
      
      // Stop and dispose all Tone.js preview players
      Array.from(previewPlayers).forEach((elem) => {
        // Get the player instance from Tone.js internal registry if possible
        // If we can't access it directly, we'll at least remove the element
        elem.remove();
      });
    }
    
    // Then stop any previews playing through main track players
    updatedTracks.forEach((track) => {
      if (track.previewing && track.selectedStem !== null) {
        previewsActive = true;
        
        // Stop the player
        const nodes = track.audioNodes[track.selectedStem];
        if (nodes?.player && !nodes.player.disposed) {
          nodes.player.stop();
          // Restore loop setting if needed
          nodes.player.loop = true;
        }
        
        // Reset preview state
        track.previewing = false;
        // Also reset any progress indicators
        track.previewProgress = 0;
      }
    });
    
    if (previewsActive) {
      setTracks(updatedTracks);
      console.log("Stopped ongoing previews");
    }
  };
  
  
  // Function to add a visual progress indicator for previews
  
  const previewStem = async (trackIndex: number) => {
    try {
      // If already previewing this track, stop it individually
      const track = tracks[trackIndex];
      if (track.previewing) {
        console.log(`Stopping individual preview for track ${trackIndex} (${track.name})`);
        
        // Stop the specific audio element for this track
        const audioElement = activePreviewAudios.current.get(trackIndex);
        if (audioElement) {
          try {
            audioElement.pause();
            audioElement.currentTime = 0;
            // Don't clear the src when stopping individual previews
            // audioElement.src = ''; // This was causing the src reset issue
            console.log(`Stopped HTML5 audio element for track ${trackIndex}`);
          } catch (error) {
            console.warn(`Error stopping audio element for track ${trackIndex}:`, error);
          }
          // Remove from active previews map
          activePreviewAudios.current.delete(trackIndex);
        }
        
        // Stop processed audio player if it exists
        if (track.selectedStem !== null) {
          const nodes = track.audioNodes?.[track.selectedStem];
          if (nodes?.player && !nodes.player.disposed) {
            nodes.player.stop();
            nodes.player.loop = true; // Restore loop setting
            console.log(`Stopped processed audio player for track ${trackIndex}`);
          }
        }
        
        // Update track state
        const updatedTracks = [...tracks];
        updatedTracks[trackIndex].previewing = false;
        updatedTracks[trackIndex].previewProgress = 0;
        setTracks(updatedTracks);
        
        console.log(`Individual preview stopped for track ${trackIndex} (${track.name})`);
        return;
      }
      
      // Stop any ongoing preview
      stopOngoingPreviews();
      
      if (track.selectedStem === null) {
        console.warn('No stem selected for preview');
        alert('Please select a stem first before previewing.');
        return;
      }

      // Start Tone.js context if it's not already running
      if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
          console.log("AudioContext started for preview");
        } catch (contextError) {
          console.error("Failed to start AudioContext:", contextError);
          alert("Please click somewhere on the page first to enable audio, then try again.");
          return;
        }
      }
      
      const updatedTracks = [...tracks];
      const currentTrack = updatedTracks[trackIndex];
      
      // Check if we have already processed this stem (full version) - use it for preview
      if (currentTrack.selectedStem !== null && currentTrack.audioNodes?.[currentTrack.selectedStem]?.player?.loaded) {
        console.log(`Using already processed stem for preview of ${track.name} (${previewSection} section)`);
        // Mark this track as previewing
        currentTrack.previewing = true;
        setTracks(updatedTracks);
        
        const nodes = currentTrack.audioNodes[currentTrack.selectedStem!];
        if (nodes?.player) {
          // Store original loop setting
          const originalLoop = nodes.player.loop;
          
          // Set to non-looping for preview
          nodes.player.loop = false;
          
          // Get the total duration of the audio buffer
          const totalDuration = nodes.player.buffer ? nodes.player.buffer.duration : 0;
          
          // Calculate start position based on selected section
          let previewStartPosition = 0;
          if (totalDuration > 0) {
            switch (previewSection) {
              case 'start':
                previewStartPosition = 0;
                break;
              case 'middle':
                // Start in the middle, accounting for preview duration
                previewStartPosition = Math.max(0, (totalDuration / 2) - 1);
                break;
              case 'end': {
                // Start near the end, but leave enough time for the preview
                const previewDur = previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].duration;
                previewStartPosition = Math.max(0, totalDuration - (previewDur * 1.2));
                break;
              }
            }
          }
          
          // Use the selected preview quality duration setting
          const previewDuration = previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].duration;
          
          console.log(`Previewing ${track.name} (${previewSection} section) for ${previewDuration} seconds, starting at ${previewStartPosition.toFixed(2)}s`);
          
          // Start the player at the specified position
          nodes.player.start("+0.1", previewStartPosition);
          
          // Set timeout to stop preview and restore loop setting
          setTimeout(() => {
            if (nodes.player && !nodes.player.disposed) {
              nodes.player.stop();
              nodes.player.loop = originalLoop;
            }
            
            // Mark preview as complete
            const finalTracks = [...tracks];
            if (finalTracks[trackIndex]) {
              finalTracks[trackIndex].previewing = false;
              setTracks(finalTracks);
            }
            
            console.log(`Preview of ${track.name} ended`);
          }, previewDuration * 1000);
        }
        return;
      }
      
      // If no processed audio available, try to use the original stem file directly for preview
      console.log(`No processed audio available, attempting to preview original stem for ${track.name} (${previewSection} section)`);
      
      // Mark as loading
      currentTrack.previewLoading = true;
      setTracks(updatedTracks);
      
      // Get the stem path
      const stemPath = track.stems[track.selectedStem];
      
      // Check if the stem path is valid
      if (!stemPath || stemPath.includes('placeholder') || stemPath.includes('fallback')) {
        console.warn(`Invalid stem path for preview: ${stemPath}`);
        currentTrack.previewLoading = false;
        setTracks(updatedTracks);
        alert(`This track doesn't have a valid audio file to preview. Please select a different stem or check if the audio files are available.`);
        return;
      }
      
      // Try to play the original stem file directly via backend
      try {
        // Create a temporary player for the original file
        let originalStemUrl = stemPath;
        
        // Handle different URL formats - ensure proper path resolution through backend
        if (!originalStemUrl.startsWith('http')) {
          // Remove leading slash if present
          originalStemUrl = originalStemUrl.replace(/^\/+/, '');
          
          // Parse the path to extract category and filename
          // Expected format: "stems/Category/filename.wav"
          const pathParts = originalStemUrl.split('/');
          if (pathParts.length >= 3 && pathParts[0] === 'stems') {
            const category = pathParts[1];
            const filename = pathParts.slice(2).join('/'); // Handle filenames with slashes
            // Construct proper backend URL using the /stems/<category>/<filename> route
            originalStemUrl = `http://localhost:5001/stems/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
          } else {
            // Fallback: use the path as-is
            originalStemUrl = `http://localhost:5001/${originalStemUrl}`;
          }
        }
        
        console.log(`Attempting to preview original stem via backend: ${originalStemUrl} (${previewSection} section)`);
        console.log(`Original stem path: ${stemPath}`);
        
        // Check if we already have an audio element for this track
        let audio = activePreviewAudios.current.get(trackIndex);
        
        // Create new audio element only if we don't have one or if it's in an error state
        if (!audio || audio.error) {
          console.log(`Creating new audio element for track ${trackIndex}`);
          audio = new Audio();
          audio.crossOrigin = 'anonymous';
          
          // Store audio reference in the Map BEFORE setting src
          activePreviewAudios.current.set(trackIndex, audio);
          
          // Add event listeners BEFORE setting src to catch all events
          audio.addEventListener('loadstart', () => {
            console.log(`Audio load started for: ${originalStemUrl}`);
            console.log(`Audio src at loadstart: ${audio!.src}`);
          });
          
          audio.addEventListener('progress', () => {
            console.log(`Audio loading progress for: ${originalStemUrl}`);
            console.log(`Audio src at progress: ${audio!.src}`);
          });
          
          audio.addEventListener('canplay', () => {
            console.log(`Audio can play: ${originalStemUrl}`);
            console.log(`Audio src at canplay: ${audio!.src}`);
          });
        } else {
          console.log(`Reusing existing audio element for track ${trackIndex}`);
          // Stop current playback if any
          audio.pause();
          audio.currentTime = 0;
        }
        
        audio.addEventListener('loadeddata', () => {
          console.log(`Original stem loaded for preview: ${track.name}`);
          
          // Mark as previewing
          const previewTracks = [...tracks];
          if (previewTracks[trackIndex]) {
            previewTracks[trackIndex].previewLoading = false;
            previewTracks[trackIndex].previewing = true;
            setTracks(previewTracks);
            
            // Calculate start position based on section
            const totalDuration = audio.duration;
            let startPosition = 0;
            
            if (totalDuration > 0) {
              switch (previewSection) {
                case 'start':
                  startPosition = 0;
                  break;
                case 'middle':
                  startPosition = Math.max(0, (totalDuration / 2) - 1);
                  break;
                case 'end': {
                  const previewDur = previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].duration;
                  startPosition = Math.max(0, totalDuration - (previewDur * 1.2));
                  break;
                }
              }
            }
            
            console.log(`Starting preview at ${startPosition.toFixed(2)}s of ${totalDuration.toFixed(2)}s total duration`);
            
            // Set start position and play
            audio.currentTime = startPosition;
            audio.play().catch(e => console.error('Error playing audio:', e));
            
            // Stop after preview duration
            const previewDuration = previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].duration;
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
              // Don't clear src here - keep it for potential reuse
              // audio.src = '';
              
              // Don't remove from active previews map - keep for reuse
              // activePreviewAudios.current.delete(trackIndex);
              
              // Reset preview state
              const finalTracks = [...tracks];
              if (finalTracks[trackIndex]) {
                finalTracks[trackIndex].previewing = false;
                setTracks(finalTracks);
              }
              
              console.log(`Original stem preview of ${track.name} ended`);
            }, previewDuration * 1000);
          }
        });
        
        audio.addEventListener('error', (error) => {
          console.error(`Error loading original stem for preview:`, error);
          console.error(`Failed URL: ${originalStemUrl}`);
          console.error(`Original stem path: ${stemPath}`);
          console.error(`Audio element error details:`, {
            error: error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src
          });
          
          // Don't remove from active previews map on error - we might retry
          // activePreviewAudios.current.delete(trackIndex);
          
          // Reset loading state
          const errorTracks = [...tracks];
          if (errorTracks[trackIndex]) {
            errorTracks[trackIndex].previewLoading = false;
            setTracks(errorTracks);
          }
          
          // Show user-friendly message with more details
          alert(`Cannot preview "${track.name}". The audio file may not be accessible.\n\nTechnical details:\n- URL: ${originalStemUrl}\n- Original path: ${stemPath}\n\nTry selecting a different stem or check if the backend server is running.`);
        });
        
        // Set the source URL and load - do this ONCE at the end after all event listeners are set
        console.log(`Setting audio src to: ${originalStemUrl}`);
        audio.src = originalStemUrl;
        console.log(`Audio src after setting: ${audio.src}`);
        audio.load();
        
        // Verify the src is still correct after load()
        setTimeout(() => {
          console.log(`Audio src after load() call: ${audio.src}`);
          if (audio.src !== originalStemUrl) {
            console.error(`Audio src was changed! Expected: ${originalStemUrl}, Got: ${audio.src}`);
            // Try to restore the correct URL
            audio.src = originalStemUrl;
            console.log(`Restored audio src to: ${audio.src}`);
          }
        }, 100);
        
      } catch (directPreviewError) {
        console.error('Error creating direct preview:', directPreviewError);
        
        // Reset loading state
        const errorTracks = [...tracks];
        if (errorTracks[trackIndex]) {
          errorTracks[trackIndex].previewLoading = false;
          setTracks(errorTracks);
        }
        
        alert(`Cannot preview this stem. The audio file may not be available or accessible.`);
      }
      
    } catch (error) {
      console.error('Error in previewStem:', error);
      
      // Reset loading state
      const errorTracks = [...tracks];
      if (errorTracks[trackIndex]) {
        errorTracks[trackIndex].previewLoading = false;
        errorTracks[trackIndex].previewing = false;
        setTracks(errorTracks);
      }
      
      alert(`Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
// This useEffect hook is no longer needed as processing is moved to the backend.
// The backend will handle applying BPM and Key changes.

// Update Tone.js transport tempo directly (still useful for overall timing)
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // The useEffect hook around line 603 now handles both BPM and Key changes for GrainPlayer.
  // This old useEffect for key changes is no longer needed.

  const handleExport = () => {
    // Check if we have at least one stem selected
    const selectedStemsCount = tracks.filter(track => track.selectedStem !== null).length;

    if (selectedStemsCount === 0) {
      alert('Please select at least one instrument to create a beat');
      return;
    }

    // Get the list of selected stems, including their mute status
    const selectedStemsInfo = tracks
      .map(track => {
        if (track.selectedStem !== null) {
          const path = track.stems[track.selectedStem];
          // Ensure path is valid before including
          if (typeof path === 'string' && !path.includes('placeholder')) {
            return { path: path, muted: track.muted };
          }
        }
        return null; // Return null for tracks without a valid selected stem
      })
      .filter(item => item !== null); // Remove null entries

    // Filter out muted tracks for the export payload
    const unmutedStemsToExport = selectedStemsInfo.filter(item => item && !item.muted);

    if (unmutedStemsToExport.length === 0) {
        alert('No unmuted stems selected for export. Please unmute at least one track or select different stems.');
        return;
    }

    // Extract just the paths for the backend
    const unmutedStemPaths = unmutedStemsToExport.map(item => item!.path);

    // Navigate to payment screen, passing necessary data for backend export
    navigate('/payment', {
      state: {
        beatFingerprint: buildBeatFingerprint(), // Fingerprint might still include muted tracks, consider adjusting if needed
        stemCount: unmutedStemsToExport.length, // Count only unmuted stems for cost calculation?
        selectedStemPaths: unmutedStemPaths, // Pass only the list of UNMUTED stem paths
        targetBpm: bpm, // Pass the current BPM
        targetKey: key, // Pass the current Key
      }
    });
  };

  const isExportDisabled = tracks.every(track => track.selectedStem === null);

  return (
    <Container>
      <Header>
        <div></div> {/* Empty div to balance header */}
        <Title>Beat Maker Studio</Title>
        <ProfileButton onClick={() => navigate('/my-beats')}>
          My Beats
        </ProfileButton>
      </Header>

      <TopSection>
        <BpmSlider value={bpm} onChange={setBpm} />
        <KeyDropdown value={key} onChange={setKey} />
        <RandomizeButton onClick={randomizeAll}>
          Randomize
        </RandomizeButton>
      </TopSection>

      <TracksContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <SectionTitle>Instrument Layers</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e2e1e',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #1DB954'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#1DB954',
                borderRadius: '50%',
                marginRight: '5px',
                display: 'inline-block'
              }}></span>
              <span style={{ fontSize: '11px', color: '#ddd' }}>Auto-unmuted</span>
            </div>
            
            <button
              onClick={() => {
                // Reset mute states to defaults
                const resetTracks = [...tracks];
                resetTracks.forEach(track => {
                  track.muted = !track.defaultUnmuted;
                });
                setTracks(resetTracks);
              }}
              style={{
                padding: '5px 10px',
                backgroundColor: '#9147ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span style={{ marginRight: '5px' }}>↺</span> Reset Track States
            </button>
          </div>
        </div>
        {/* Enhanced explanation about track functionality */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            backgroundColor: 'rgba(29, 185, 84, 0.05)',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px solid rgba(29, 185, 84, 0.2)'
          }}>
            <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px', fontWeight: 'bold' }}>
              How Tracks Work:
            </p>
            <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '13px', color: '#bbb' }}>
              <li style={{ marginBottom: '5px' }}>
                <span style={{ color: '#1DB954', fontWeight: 'bold' }}>Core tracks</span> (Chords, Kick, Bass, Snare, Hi Hat, Percussion) are automatically unmuted for essential beat elements
              </li>
              <li style={{ marginBottom: '5px' }}>
                <span style={{ color: '#aaa', fontWeight: 'bold' }}>Additional tracks</span> (Melody, Counter Melody, etc.) stay muted until you choose to unmute them
              </li>
              <li>
                <span style={{ color: '#2a6aff', fontWeight: 'bold' }}>Preview any track</span> before processing to hear how it sounds individually
              </li>
            </ul>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(42, 106, 255, 0.05)',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px solid rgba(42, 106, 255, 0.2)'
          }}>
            <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px', fontWeight: 'bold' }}>
              Preview Options:
            </p>
            <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '13px', color: '#bbb' }}>
              <li style={{ marginBottom: '5px' }}>
                <span style={{ color: '#2a6aff', fontWeight: 'bold' }}>▶ Preview</span> - Quickly hear an individual track before processing
              </li>
              <li style={{ marginBottom: '5px' }}>
                <span style={{ color: '#1e70b8', fontWeight: 'bold' }}>⚡ Instant Preview</span> - Hear all tracks together with lower quality but much faster processing
              </li>
              <li>
                <span style={{ color: '#1DB954', fontWeight: 'bold' }}>Each stem has its own preview</span> - Preview any track independently
              </li>
            </ul>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e1e1e',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#ddd', fontWeight: 'bold' }}>Preview Quality:</span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
              <button
                onClick={() => {
                  console.log('Preview quality changed to: 10s');
                  setPreviewQuality('10s');
                  stopOngoingPreviews();
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: previewQuality === '10s' ? '#1DB954' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {previewQuality === '10s' ? '✓ ' : ''}10s Quick
              </button>
              
              <button
                onClick={() => {
                  console.log('Preview quality changed to: 30s');
                  setPreviewQuality('30s');
                  stopOngoingPreviews();
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: previewQuality === '30s' ? '#1DB954' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {previewQuality === '30s' ? '✓ ' : ''}30s Better
              </button>
            </div>
          </div>
          
          {/* Preview section selector - Simplified */}
          <div style={{
            marginTop: '15px',
            backgroundColor: '#1e1e1e',
            padding: '8px',
            borderRadius: '4px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', color: '#ddd', fontWeight: 'bold' }}>Preview Section:</span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
              {(['start', 'middle', 'end'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => {
                    console.log(`Preview section changed to: ${section}`);
                    setPreviewSection(section);
                    stopOngoingPreviews();
                    clearPreviewCache();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: previewSection === section ? '#1DB954' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {previewSection === section ? '✓ ' : ''}
                  {section === 'start' ? 'Start' : section === 'middle' ? 'Middle' : 'End'}
                </button>
              ))}
            </div>
            
            <div style={{
              marginTop: '8px',
              fontSize: '10px',
              color: '#aaa',
              textAlign: 'center'
            }}>
              Current: {previewSection.charAt(0).toUpperCase() + previewSection.slice(1)} section
            </div>
          </div>
        </div>
        
        {isLoadingStems ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Loading stems...</p>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: '30%', height: '100%', backgroundColor: '#1DB954', borderRadius: '2px', animation: 'loading 1.5s infinite ease-in-out' }}></div>
              </div>
              <style>{`
                @keyframes loading {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(400%); }
                }
              `}</style>
            </div>
        ) : tracks.length > 0 && tracks.some(track => track.stems && track.stems.length > 0) ? (
            /* Group tracks by default mute status */
            <>
              {/* First section - Default Unmuted Tracks */}
              <div style={{
                backgroundColor: 'rgba(29, 185, 84, 0.1)',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '15px',
                border: '1px solid rgba(29, 185, 84, 0.3)'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#1DB954',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#1DB954',
                    borderRadius: '50%',
                    marginRight: '5px',
                    display: 'inline-block'
                  }}></span>
                  CORE TRACKS (ON BY DEFAULT)
                </div>
                
                {tracks
                  .filter(track => defaultUnmutedTracks.includes(track.name))
                  .map((track, filteredIndex) => {
                    // Find the original index
                    const trackIndex = tracks.findIndex(t => t.name === track.name);
                    return (
                      <TrackRow
                        key={track.name}
                        $isDefaultUnmuted={true}
                        style={{
                          position: 'relative',
                          boxShadow: track.selectedStem !== null && !track.muted && isPlaying ?
                            '0 0 5px #1DB954' : 'none',
                          transition: 'box-shadow 0.3s ease',
                          marginBottom: filteredIndex === defaultUnmutedTracks.length - 1 ? 0 : 8
                        }}
                      >
                        <TrackName>{track.name}</TrackName>
                        <SelectButton
                          onClick={() => {
                            if (track.stems.length === 0) {
                              console.warn(`Track '${track.name}' has no stems to select.`);
                              return; // Do nothing if no stems
                            }
                            const currentSelection = track.selectedStem;
                            const nextIndex = currentSelection === null ? 0 : (currentSelection + 1) % track.stems.length;
                            selectStem(trackIndex, nextIndex);
                          }}
                          disabled={track.stems.length === 0}
                        >
                          {track.stems.length === 0
                            ? 'No Stems'
                            : track.selectedStem === null
                              ? 'Select Stem'
                              : track.stems[track.selectedStem]?.split('/').pop() ?? 'Error'}
                        </SelectButton>
                        <RandomizeTrackButton onClick={() => randomizeStem(trackIndex)}>
                          Randomize
                        </RandomizeTrackButton>
                        
                        {/* Preview Button with progress indicator - ENHANCED VERSION */}
                        <div style={{ position: 'relative', marginRight: '10px' }}>
                          <PreviewButton
                            onClick={() => previewStem(trackIndex)}
                            disabled={track.selectedStem === null || isProcessing || track.previewLoading}
                            style={{
                              backgroundColor: track.previewing ? '#4080ff' : track.previewLoading ? '#555' : '#2a6aff',
                              minWidth: '80px',
                              position: 'relative',
                              zIndex: 1,
                              boxShadow: '0 0 8px rgba(42, 106, 255, 0.4)'
                            }}
                          >
                            {track.previewLoading ? 'Loading...' : track.previewing ?
                              `Playing ${previewSection}...` :
                              `▶ Preview ${previewSection}`}
                          </PreviewButton>
                          
                          {/* Progress bar for preview */}
                          {(track.previewing || track.previewLoading) && typeof track.previewProgress === 'number' && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '3px',
                                width: `${track.previewProgress}%`,
                                backgroundColor: '#1ed760',
                                transition: 'width 0.3s ease-in-out',
                                zIndex: 2,
                                borderRadius: '3px'
                              }}
                            />
                          )}
                          
                          {/* Preview tooltip */}
                          {!track.previewing && !track.previewLoading && track.selectedStem !== null && (
                            <div style={{
                              position: 'absolute',
                              bottom: '-18px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '9px',
                              color: '#aaa',
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none'
                            }}>
                              Preview {previewSection} section
                            </div>
                          )}
                        </div>
                        
                        {/* Mute Button */}
                        <MuteButton
                          $isMuted={track.muted}
                          onClick={() => toggleMute(trackIndex)}
                          disabled={track.selectedStem === null}
                          title="Default: Unmuted"
                          style={{
                            border: '2px solid #1DB954',
                            boxSizing: 'border-box',
                            opacity: track.selectedStem === null ? 0.5 : 1
                          }}
                        >
                          {track.muted ? 'Unmute' : 'Mute'}
                        </MuteButton>
                      </TrackRow>
                    );
                  })}
              </div>
              
              {/* Second section - Additional (Muted by Default) Tracks */}
              {tracks.some(track => !defaultUnmutedTracks.includes(track.name)) && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#aaa',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#aaa',
                      borderRadius: '50%',
                      marginRight: '5px',
                      display: 'inline-block'
                    }}></span>
                    ADDITIONAL TRACKS (OFF BY DEFAULT)
                  </div>
                  
                  {tracks
                    .filter(track => !defaultUnmutedTracks.includes(track.name))
                    .map((track, filteredIndex) => {
                      // Find the original index
                      const trackIndex = tracks.findIndex(t => t.name === track.name);
                      // Get total number of non-default tracks for margin calculation
                      const nonDefaultTracksCount = tracks.filter(t => !defaultUnmutedTracks.includes(t.name)).length;
                      return (
                        <TrackRow
                          key={track.name}
                          $isDefaultUnmuted={false}
                          style={{
                            position: 'relative',
                            boxShadow: track.selectedStem !== null && !track.muted && isPlaying ?
                              '0 0 5px #1DB954' : 'none',
                            transition: 'box-shadow 0.3s ease',
                            marginBottom: filteredIndex === nonDefaultTracksCount - 1 ? 0 : 8
                          }}
                        >
                          <TrackName>{track.name}</TrackName>
                          <SelectButton
                            onClick={() => {
                              if (track.stems.length === 0) {
                                console.warn(`Track '${track.name}' has no stems to select.`);
                                return; // Do nothing if no stems
                              }
                              const currentSelection = track.selectedStem;
                              const nextIndex = currentSelection === null ? 0 : (currentSelection + 1) % track.stems.length;
                              selectStem(trackIndex, nextIndex);
                            }}
                            disabled={track.stems.length === 0}
                          >
                            {track.stems.length === 0
                              ? 'No Stems'
                              : track.selectedStem === null
                                ? 'Select Stem'
                                : track.stems[track.selectedStem]?.split('/').pop() ?? 'Error'}
                          </SelectButton>
                          <RandomizeTrackButton onClick={() => randomizeStem(trackIndex)}>
                            Randomize
                          </RandomizeTrackButton>
                          
                          {/* Preview Button with progress indicator - ENHANCED VERSION */}
                          <div style={{ position: 'relative', marginRight: '10px' }}>
                            <PreviewButton
                              onClick={() => previewStem(trackIndex)}
                              disabled={track.selectedStem === null || isProcessing || track.previewLoading}
                              style={{
                                backgroundColor: track.previewing ? '#4080ff' : track.previewLoading ? '#555' : '#2a6aff',
                                minWidth: '80px',
                                position: 'relative',
                                zIndex: 1,
                                boxShadow: '0 0 8px rgba(42, 106, 255, 0.4)'
                              }}
                            >
                              {track.previewLoading ? 'Loading...' : track.previewing ?
                                `Playing ${previewSection}...` :
                                `▶ Preview ${previewSection}`}
                            </PreviewButton>
                            
                            {/* Progress bar for preview */}
                            {(track.previewing || track.previewLoading) && typeof track.previewProgress === 'number' && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  height: '3px',
                                  width: `${track.previewProgress}%`,
                                  backgroundColor: '#1ed760',
                                  transition: 'width 0.3s ease-in-out',
                                  zIndex: 2,
                                  borderRadius: '3px'
                                }}
                              />
                            )}
                            
                            {/* Preview tooltip */}
                            {!track.previewing && !track.previewLoading && track.selectedStem !== null && (
                              <div style={{
                                position: 'absolute',
                                bottom: '-18px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '9px',
                                color: '#aaa',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none'
                              }}>
                                Preview {previewSection} section
                              </div>
                            )}
                          </div>
                          
                          {/* Mute Button */}
                          <MuteButton
                            $isMuted={track.muted}
                            onClick={() => toggleMute(trackIndex)}
                            disabled={track.selectedStem === null}
                            title="Default: Muted"
                            style={{
                              opacity: track.selectedStem === null ? 0.5 : 1
                            }}
                          >
                            {track.muted ? 'Unmute' : 'Mute'}
                          </MuteButton>
                        </TrackRow>
                      );
                    })}
                </div>
              )}
            </>
        ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(255, 64, 80, 0.1)', borderRadius: '4px', margin: '10px 0' }}>
              <p style={{ marginBottom: '10px' }}>No stems found or failed to load.</p>
              <button
                onClick={() => {
                  setIsLoadingStems(true);
                  setTimeout(() => {
                    loadStemsFromFileSystem();
                    setIsLoadingStems(false);
                  }, 500);
                }}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#1DB954',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
        )}
      </TracksContainer>

      <BottomSection>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '55%' }}>
           {/* Added a heading to make purpose clear */}
           <div style={{
             fontSize: '12px',
             color: '#ccc',
             fontWeight: 'bold',
             marginBottom: '-5px',
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center'
           }}>
             <span>GENERATE & PREVIEW OPTIONS</span>
             
             <div style={{
               display: 'flex',
               alignItems: 'center',
               gap: '5px'
             }}>
               <div style={{
                 width: '10px',
                 height: '10px',
                 backgroundColor: '#1e70b8',
                 borderRadius: '50%',
                 display: 'inline-block'
               }}></div>
               <span style={{ fontSize: '10px', color: '#aaa' }}>
                 = Faster preview
               </span>
             </div>
             
             <div style={{
               display: 'flex',
               alignItems: 'center',
               gap: '5px'
             }}>
               <div style={{
                 width: '10px',
                 height: '10px',
                 backgroundColor: '#9147ff',
                 borderRadius: '50%',
                 display: 'inline-block'
               }}></div>
               <span style={{ fontSize: '10px', color: '#aaa' }}>
                 = Full quality
               </span>
             </div>
           </div>

           {/* Added workflow explanation box */}
           <div style={{
             padding: '8px',
             backgroundColor: 'rgba(42, 106, 255, 0.1)',
             borderRadius: '4px',
             border: '1px solid rgba(42, 106, 255, 0.3)',
             marginBottom: '5px'
           }}>
             <div style={{ fontSize: '12px', color: '#2a6aff', fontWeight: 'bold', marginBottom: '5px' }}>
               ⚡ PREVIEW FIRST, PROCESS LATER
             </div>
             <ul style={{ margin: '0 0 0 15px', padding: 0, fontSize: '11px', color: '#ccc' }}>
               <li style={{ marginBottom: '3px' }}>Preview individual tracks using the ▶ button beside each track</li>
               <li style={{ marginBottom: '3px' }}>Use "Instant Preview" to quickly hear all tracks together</li>
               <li>Only generate full quality when you're satisfied with the sound</li>
             </ul>
           </div>
           
           {/* Quick Preview Button with enhanced UI */}
           <div
             style={{
               position: 'relative',
               animation: isProcessing ? 'pulse 1.5s infinite' : 'none',
               background: 'rgba(0,0,0,0.2)',
               padding: '8px',
               borderRadius: '4px'
             }}
           >
             <GenerateButton
               onClick={() => handleGenerateBeat(true)}
               disabled={isProcessing || isLoadingStems}
               $isPreview={true}
               style={{
                 position: 'relative',
                 padding: '10px 15px',
                 overflow: 'visible',
                 width: '100%',
                 boxShadow: '0 0 15px rgba(30, 112, 184, 0.5)'
               }}
             >
               <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <span style={{ marginRight: '5px' }}>⚡</span>
                 {isProcessing ?
                   'Processing...' :
                   <span>
                     Instant Preview All Tracks <span style={{ fontSize: '12px', opacity: 0.8 }}>
                       ({previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].duration}s preview)
                     </span>
                   </span>
                 }
               </div>
               {!isProcessing && (
                 <div style={{
                   position: 'absolute',
                   bottom: '2px',
                   right: '5px',
                   fontSize: '8px',
                   color: 'rgba(255,255,255,0.7)',
                   zIndex: 1
                 }}>
                   {previewQualitySettings[previewQuality as keyof typeof previewQualitySettings].label}
                 </div>
               )}
             </GenerateButton>
             
             {!isProcessing && (
               <div style={{
                 position: 'absolute',
                 bottom: '-15px',
                 left: '50%',
                 transform: 'translateX(-50%)',
                 color: '#aaa',
                 fontSize: '10px',
                 whiteSpace: 'nowrap',
                 textAlign: 'center'
               }}>
                 {previewQuality === '10s' ? '10 second' : '30 second'} preview with full BPM/Key processing - automatically plays when ready
               </div>
             )}
           </div>
           
           {/* Full Quality Generate Button with tooltip */}
           <div
             style={{
               position: 'relative',
               marginTop: '10px',
               background: 'rgba(0,0,0,0.2)',
               padding: '8px',
               borderRadius: '4px'
             }}
             title="Process with high-quality settings for the best sound (takes longer)"
           >
             <GenerateButton
               onClick={() => handleGenerateBeat(false)}
               disabled={isProcessing || isLoadingStems}
               style={{
                 position: 'relative',
                 padding: '10px 15px',
                 width: '100%',
                 boxShadow: '0 0 15px rgba(145, 71, 255, 0.5)'
               }}
             >
               <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <span style={{ marginRight: '5px' }}>🎵</span>
                 {isProcessing ? 'Processing Full Quality...' : (
                   fullQualityProcessed ? 'Regenerate High Quality Beat' :
                   (previewProcessed ? 'Generate Final Quality Beat' : 'Generate High Quality Beat')
                 )}
               </div>
               {!isProcessing && (
                 <div style={{
                   position: 'absolute',
                   bottom: '2px',
                   right: '5px',
                   fontSize: '8px',
                   color: 'rgba(255,255,255,0.7)',
                   zIndex: 1
                 }}>
                   48kHz / 32-bit / MAX QUALITY (INSTANT & FULL)
                 </div>
               )}
             </GenerateButton>
             
             {!isProcessing && (
               <div style={{
                 position: 'absolute',
                 bottom: '-15px',
                 left: '50%',
                 transform: 'translateX(-50%)',
                 color: previewProcessed ? '#1DB954' : '#aaa',
                 fontSize: '10px',
                 whiteSpace: 'nowrap',
                 fontWeight: previewProcessed ? 'bold' : 'normal'
               }}>
                 {fullQualityProcessed
                   ? 'Already processed! You can export this high-quality beat'
                   : (previewProcessed
                     ? 'Like what you hear? Generate final quality version'
                     : 'Takes longer (15-30 sec) but delivers highest audio quality')}
               </div>
             )}
           </div>
         </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px'
        }}>
          <PlayButton
            $isPlaying={isPlaying}
            onClick={togglePlayback}
            disabled={isProcessing || isLoadingStems || !tracks.some(t => t.selectedStem !== null && t.audioNodes?.[t.selectedStem]?.player?.loaded)}
            style={{
              width: '60px',
              height: '60px',
              boxShadow: isPlaying ? '0 0 15px rgba(255, 64, 80, 0.5)' : '0 0 15px rgba(29, 185, 84, 0.5)'
            }}
          >
            {isPlaying ? '■' : '▶'}
          </PlayButton>
          
          <div style={{
            fontSize: '12px',
            color: '#ccc',
            marginTop: '3px'
          }}>
            {isPlaying ? 'Stop' : 'Play'} Beat
          </div>
          
          {/* Active track indicator */}
          {isPlaying && (
            <div style={{
              fontSize: '11px',
              color: '#1DB954',
              marginTop: '5px',
              textAlign: 'center',
              maxWidth: '130px'
            }}>
              Playing {tracks.filter(t => !t.muted && t.selectedStem !== null).length} active tracks
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px'
        }}>
          <TokenBalance>
            {tokenBalance}
          </TokenBalance>
          <div style={{
            fontSize: '12px',
            color: '#9147ff',
            fontWeight: 'normal'
          }}>
            Available Tokens
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px'
        }}>
          <ExportButton
            $isDisabled={isExportDisabled || isLoadingStems}
            onClick={handleExport}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(29, 185, 84, 0.3)'
            }}
          >
            <span style={{ fontSize: '18px' }}>↑</span> Export Beat
          </ExportButton>
          
          <div style={{
            fontSize: '11px',
            color: '#ccc',
            maxWidth: '150px',
            textAlign: 'center'
          }}>
            Only exports unmuted tracks
          </div>
        </div>
      </BottomSection>

      {/* Display Processing Error */}
      {processingError && (
          <ErrorMessage>
            {processingError}
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <button
                onClick={() => setProcessingError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Dismiss
              </button>
            </div>
          </ErrorMessage>
      )}

      {/* Duplicate Beat Alert Modal - Only shown if user has enabled alerts */}
      {showDuplicateAlert && showDuplicateAlerts && (
        <Modal>
          <ModalContent>
            <ModalTitle>This beat already exists!</ModalTitle>
            <p>Change an instrument to create a unique beat.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <ModalButton
                onClick={() => {
                  setShowDuplicateAlert(false);
                  setShowDuplicateAlerts(false);
                  localStorage.setItem('showDuplicateAlerts', 'false');
                }}
                style={{ backgroundColor: '#666', marginRight: '10px' }}
              >
                Don't Show Again
              </ModalButton>
              <ModalButton onClick={() => setShowDuplicateAlert(false)}>
                Okay
              </ModalButton>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default HomeScreen;