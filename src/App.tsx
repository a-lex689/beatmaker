import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import './App.css';
import styled from 'styled-components';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PaymentScreen from './screens/PaymentScreen';
import ExportConfirmationScreen from './screens/ExportConfirmationScreen';
import MyBeatsScreen from './screens/MyBeatsScreen';

// Styled component for 404 page
const NotFoundContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #121212;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const NotFoundTitle = styled.h1`
  font-size: 36px;
  margin-bottom: 20px;
`;

const NotFoundMessage = styled.p`
  font-size: 18px;
  margin-bottom: 30px;
  color: #999;
`;

const BackButton = styled.button`
  padding: 12px 30px;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #1ed760;
  }
`;

// Protected route component to check authentication
const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // While checking auth state, return null
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// 404 Not Found page
const NotFound = () => {
  return (
    <NotFoundContainer>
      <NotFoundTitle>404 - Page Not Found</NotFoundTitle>
      <NotFoundMessage>
        The page you are looking for doesn't exist or has been moved.
      </NotFoundMessage>
      <BackButton onClick={() => window.location.href = '/'}>
        Back to Home
      </BackButton>
    </NotFoundContainer>
  );
};

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginScreen />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/payment" element={<PaymentScreen />} />
        <Route path="/export-confirmation" element={<ExportConfirmationScreen />} />
        <Route path="/my-beats" element={<MyBeatsScreen />} />
      </Route>
      
      {/* 404 Not Found route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
