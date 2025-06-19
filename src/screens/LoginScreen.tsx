import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebaseConfig';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #121212;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 40px;
  text-align: center;
  color: #1DB954;
`;

const Card = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 30px;
  width: 100%;
  max-width: 400px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #ccc;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  
  &:hover {
    background-color: #1ed760;
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #357ae8;
  }
`;

const GoogleIcon = styled.span`
  margin-right: 10px;
  font-size: 18px;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  
  &:before, &:after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #333;
  }
  
  &:before {
    margin-right: 10px;
  }
  
  &:after {
    margin-left: 10px;
  }
`;

const DividerText = styled.span`
  color: #777;
  font-size: 14px;
`;

const ToggleText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #ccc;
  font-size: 14px;
`;

const ToggleLink = styled.span`
  color: #1DB954;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4050;
  margin-top: 15px;
  font-size: 14px;
  text-align: center;
`;

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(firestore, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          tokenBalance: 1000, // Starting balance
          beatHistory: [],
          createdAt: new Date()
        });
      }
      
      // Navigate to home screen
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if the user document exists
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          email: user.email,
          tokenBalance: 1000, // Starting balance
          beatHistory: [],
          createdAt: new Date()
        });
      }
      
      // Navigate to home screen
      navigate('/');
    } catch (error: any) {
      console.error('Google auth error:', error);
      setError('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Logo>BEAT MAKER</Logo>
      
      <Card>
        <Form onSubmit={handleEmailAuth}>
          <InputGroup>
            <Label>Email</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </InputGroup>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </SubmitButton>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
        
        <Divider>
          <DividerText>OR</DividerText>
        </Divider>
        
        <GoogleButton onClick={handleGoogleAuth} disabled={loading}>
          <GoogleIcon>G</GoogleIcon>
          Sign {isLogin ? 'in' : 'up'} with Google
        </GoogleButton>
        
        <ToggleText>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <ToggleLink onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </ToggleLink>
        </ToggleText>
      </Card>
    </Container>
  );
};

export default LoginScreen;