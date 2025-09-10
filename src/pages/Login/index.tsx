import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { validateInviteCode, markInviteCodeUsed } from '../../utils/inviteCodes';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.background};
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(65, 83, 120, 0.15);
  max-width: 400px;
  width: 100%;
  animation: ${scaleIn} 0.8s ease-out;
`;

const Title = styled.h1`
  font-size: 28px;
  font-family: ${theme.fonts.header};
  color: ${theme.colors.primary};
  margin-bottom: 0.5rem;
  text-align: center;
  animation: ${slideUp} 0.6s ease-out 0.2s backwards;
`;

const Subtitle = styled.p`
  color: ${theme.colors.text};
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.7;
  animation: ${fadeIn} 0.6s ease-out 0.4s backwards;
`;

const Form = styled.form`
  animation: ${slideUp} 0.8s ease-out 0.6s backwards;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 14px;
  color: ${theme.colors.primary};
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid rgba(65, 83, 120, 0.2);
  border-radius: 10px;
  font-size: ${theme.fontSizes.button};
  background-color: ${theme.colors.white};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.1);
  }

  &::placeholder {
    color: rgba(65, 83, 120, 0.4);
  }
`;

const Button = styled.button`
  padding: 16px 32px;
  background-color: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 50px;
  font-size: ${theme.fontSizes.button};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  text-align: center;
  animation: ${slideUp} 0.4s ease-out;
`;

const ToggleText = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 14px;
  color: ${theme.colors.text};
  animation: ${fadeIn} 0.6s ease-out 0.8s backwards;
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    opacity: 0.7;
  }
`;

const FormContent = styled.div<{ $key: string }>`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${slideUp} 0.4s ease-out;
`;

const LoginPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('📝 Form submission:', { 
      isSignUp, 
      email, 
      username, 
      inviteCode: inviteCode ? 'provided' : 'missing' 
    });

    try {
      if (isSignUp) {
        console.log('🆕 Processing sign up...');
        // Validate invite code for sign up
        if (!inviteCode) {
          throw new Error('Invite code is required to create an account');
        }

        if (!validateInviteCode(inviteCode)) {
          throw new Error('Invalid or already used invite code');
        }

        // Create account
        const { error } = await signUp(email, password, { username, inviteCode });
        if (error) throw error;

        // Mark invite code as used
        markInviteCodeUsed(inviteCode, email);
      } else {
        console.log('🔑 Processing sign in...');
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('❌ Form submission error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Welcome to Hugo</Title>
        <Subtitle>
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormContent $key={isSignUp ? 'signup' : 'signin'} key={isSignUp ? 'signup' : 'signin'}>
            {isSignUp && (
              <>
                <FormGroup>
                  <Label>Invite Code *</Label>
                  <Input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter your invite code"
                    required={isSignUp}
                    style={{ textTransform: 'uppercase' }}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Username</Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required={isSignUp}
                  />
                </FormGroup>
              </>
            )}

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </FormGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </FormContent>
        </Form>

        <ToggleText>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <ToggleLink
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </ToggleLink>
        </ToggleText>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;