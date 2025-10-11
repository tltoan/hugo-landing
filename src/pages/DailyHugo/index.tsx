import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/shared/Header';
import { theme } from '../../styles/theme';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import {
  Clock,
  Flame,
  TrendingUp,
  Award,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mic,
  Play,
  Pause,
  Square,
  Volume2,
  FileText,
  RefreshCw,
  Shield
} from 'lucide-react';

// Types
interface DailyQuestion {
  question_id: string;
  question_number: number;
  category: string;
  difficulty: string;
  question: string;
  answer_type: string;
  choices?: any;
  time_limit: number;
  points: number;
}

interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_questions_answered: number;
  total_correct: number;
  total_points: number;
}

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
`;

const Content = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
`;

const DailyHugoCard = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
`;

const CardHeader = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.buttonPrimary});
  color: white;
  padding: 2rem;
`;

const Title = styled.h1`
  font-family: ${theme.fonts.header};
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateInfo = styled.div`
  font-size: 1rem;
  opacity: 0.9;
`;

const QuestionInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const Badge = styled.span<{ $variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${props =>
    props.$variant === 'difficulty' ? 'rgba(255, 255, 255, 0.2)' :
    props.$variant === 'category' ? 'rgba(255, 255, 255, 0.15)' :
    'rgba(255, 255, 255, 0.1)'
  };
`;

const CardBody = styled.div`
  padding: 2rem;
`;

const QuestionText = styled.div`
  font-size: 1.25rem;
  line-height: 1.8;
  color: ${theme.colors.text};
  margin-bottom: 2rem;
  font-weight: 500;
`;

const AnswerSection = styled.div`
  margin: 2rem 0;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 2px solid rgba(65, 83, 120, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(65, 83, 120, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const Button = styled.button<{ $variant?: string }>`
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => props.$variant === 'primary' ? `
    background: ${theme.colors.buttonPrimary};
    color: white;
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
    }
  ` : props.$variant === 'secondary' ? `
    background: rgba(65, 83, 120, 0.1);
    color: ${theme.colors.text};
    &:hover:not(:disabled) {
      background: ${theme.colors.primary};
      color: white;
    }
  ` : `
    background: transparent;
    color: ${theme.colors.primary};
    border: 2px solid ${theme.colors.primary};
    &:hover:not(:disabled) {
      background: ${theme.colors.primary};
      color: white;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Timer = styled.div<{ $warning?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$warning ? '#dc2626' : theme.colors.text};
  padding: 0.75rem 1.5rem;
  background: ${props => props.$warning ? '#fef2f2' : '#f8f9fa'};
  border-radius: 50px;
  transition: all 0.3s ease;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${theme.colors.text};
  opacity: 0.7;
  margin-top: 0.5rem;
`;

const ExplanationCard = styled.div<{ $correct?: boolean }>`
  background: ${props => props.$correct ? '#f0fdf4' : '#fef2f2'};
  border: 1px solid ${props => props.$correct ? '#86efac' : '#fecaca'};
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
`;

const ExplanationHeader = styled.div<{ $correct?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$correct ? '#16a34a' : '#dc2626'};
  margin-bottom: 1rem;
`;

const ExplanationText = styled.div`
  line-height: 1.6;
  color: ${theme.colors.text};
`;

const CorrectAnswer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #16a34a;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${theme.colors.text};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyStateText = styled.div`
  font-size: 1.25rem;
  color: ${theme.colors.text};
  margin-bottom: 2rem;
`;

// Audio Recording Components
const AnswerModeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: center;
`;

const ModeButton = styled.button<{ $isActive: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  border: 2px solid ${props => props.$isActive ? theme.colors.primary : 'rgba(65, 83, 120, 0.2)'};
  background: ${props => props.$isActive ? theme.colors.primary : 'white'};
  color: ${props => props.$isActive ? 'white' : theme.colors.text};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.2);
  }
`;

const AudioRecorderContainer = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
`;

const RecordingControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RecordButton = styled.button<{ $isRecording?: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.$isRecording ? '#dc2626' : '#ef4444'};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${props => props.$isRecording ? 'pulse 1.5s infinite' : 'none'};

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(239, 68, 68, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }
`;

const ControlButton = styled.button`
  padding: 0.75rem;
  border-radius: 50%;
  background: white;
  border: 2px solid ${theme.colors.primary};
  color: ${theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: ${theme.colors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RecordingTime = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${theme.colors.text};
  min-width: 80px;
  text-align: center;
`;

const TranscriptBox = styled.div`
  background: white;
  border: 2px solid rgba(65, 83, 120, 0.2);
  border-radius: 8px;
  padding: 1rem;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
  margin: 1rem 0;
`;

const TranscriptLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AudioPlayback = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin: 1rem 0;
`;

const AudioPlayer = styled.audio`
  flex: 1;
`;

const TranscribingIndicator = styled.div`
  color: #3b82f6;
  font-size: 0.875rem;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.875rem;
`;

// Admin Panel Components
const AdminPanel = styled.div`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.2);
`;

const AdminHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  margin-bottom: 1rem;
`;

const AdminTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AdminControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const AdminButton = styled.button<{ $variant?: string }>`
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => props.$variant === 'danger' ? `
    background: white;
    color: #dc2626;
    &:hover {
      background: #fef2f2;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    }
  ` : `
    background: rgba(255, 255, 255, 0.9);
    color: #6366f1;
    &:hover {
      background: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdminMessage = styled.div<{ $type?: string }>`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => props.$type === 'success' ? `
    background: rgba(134, 239, 172, 0.2);
    color: white;
    border: 1px solid rgba(134, 239, 172, 0.4);
  ` : `
    background: rgba(254, 202, 202, 0.2);
    color: white;
    border: 1px solid rgba(254, 202, 202, 0.4);
  `}
`;

// Main Component
const DailyHugo: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes default
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [hasAttemptedToday, setHasAttemptedToday] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [answerMode, setAnswerMode] = useState<'text' | 'audio'>('text');
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Audio recording hook
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    audioUrl,
    transcript,
    isTranscribing,
    error: audioError
  } = useAudioRecorder();

  // Fetch today's question with optimized parallel queries
  const fetchTodaysQuestion = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Create timeout wrapper for queries
      const withTimeout = (promise: Promise<any>, timeoutMs: number = 5000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
          )
        ]);
      };

      // Run all queries in parallel with timeouts
      const [attemptResult, questionResult, statsResult] = await Promise.allSettled([
        withTimeout(
          Promise.resolve(
            supabase
              .from('user_daily_attempts')
              .select('*')
              .eq('user_id', user.id)
              .eq('schedule_date', today)
              .single()
          )
        ),
        withTimeout(
          Promise.resolve(
            supabase.rpc('get_todays_question')
          )
        ),
        withTimeout(
          Promise.resolve(
            supabase
              .from('user_daily_stats')
              .select('*')
              .eq('user_id', user.id)
              .single()
          )
        )
      ]);

      // Process existing attempt
      if (attemptResult.status === 'fulfilled' && attemptResult.value.data) {
        const existingAttempt = attemptResult.value.data;
        setHasAttemptedToday(true);
        setIsSubmitted(true);
        setUserAnswer(existingAttempt.user_answer);
        setIsCorrect(existingAttempt.is_correct);
      }

      // Process today's question
      if (questionResult.status === 'fulfilled' && questionResult.value.data?.length > 0) {
        const q = questionResult.value.data[0];
        setQuestion(q);

        if (attemptResult.status === 'rejected' || !attemptResult.value.data) {
          setTimeLeft(q.time_limit || 180);
          setTimerActive(true);
        }

        // Fetch full question details (non-blocking)
        Promise.resolve(
          supabase
            .from('daily_questions')
            .select('answer, detailed_explanation')
            .eq('id', q.question_id)
            .single()
        ).then(({ data }) => {
          if (data) {
            setCorrectAnswer(data.answer);
            setExplanation(data.detailed_explanation || '');
          }
        }).catch((err: any) => console.log('Failed to fetch answer details:', err));
      } else if (questionResult.status === 'rejected') {
        console.error('Failed to fetch today\'s question:', questionResult.reason);
      }

      // Process user stats
      if (statsResult.status === 'fulfilled' && statsResult.value.data) {
        setUserStats(statsResult.value.data);
      }

    } catch (error) {
      console.error('Error in fetchTodaysQuestion:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchTodaysQuestion();
    }
  }, [user, fetchTodaysQuestion]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, timerActive, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update answer when transcript changes
  useEffect(() => {
    if (answerMode === 'audio' && transcript) {
      setUserAnswer(transcript);
    }
  }, [transcript, answerMode]);

  const calculateScore = (timeTaken: number, correct: boolean) => {
    if (!correct) return 0;
    const basePoints = question?.points || 100;
    const timeBonus = Math.max(0, Math.floor((question?.time_limit || 180 - timeTaken) / 10));
    return basePoints + timeBonus;
  };

  const handleSubmit = async () => {
    if (!question || !user) return;

    // Stop recording if still active
    if (isRecording) {
      stopRecording();
    }

    setTimerActive(false);
    setIsSubmitted(true);

    const timeTaken = (question.time_limit || 180) - timeLeft;

    // Use transcript for audio mode, typed answer for text mode
    const finalAnswer = answerMode === 'audio' ? transcript : userAnswer;

    // Simple answer checking (you may want to make this more sophisticated)
    const isAnswerCorrect = finalAnswer.toLowerCase().includes('income statement') ||
                           finalAnswer.toLowerCase().includes('balance sheet') ||
                           finalAnswer.toLowerCase().includes('cash flow');

    setIsCorrect(isAnswerCorrect);

    const score = calculateScore(timeTaken, isAnswerCorrect);

    // Save attempt to database
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_daily_attempts')
        .insert({
          user_id: user.id,
          question_id: question.question_id,
          schedule_date: today,
          time_taken: timeTaken,
          user_answer: finalAnswer,
          is_correct: isAnswerCorrect,
          score: score,
          answer_type: answerMode // Store whether it was text or audio
        });

      // The trigger will automatically update the streak and stats

      // Refresh stats
      const { data: updatedStats } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedStats) {
        setUserStats(updatedStats);
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  };

  const handleShare = () => {
    const shareText = `Daily HUGO #${question?.question_number}\n` +
      `Category: ${question?.category}\n` +
      `${isCorrect ? '✅ Correct!' : '❌ Incorrect'}\n` +
      `🔥 ${userStats?.current_streak || 0} day streak!\n` +
      `\nPractice IB interview questions at Hugo!`;

    navigator.clipboard.writeText(shareText);
    alert('Results copied to clipboard!');
  };

  // Admin functions
  const handleResetAllAttempts = async () => {
    if (!user?.email || !isAdmin) return;

    if (!window.confirm('Are you sure you want to reset ALL attempts for today? This action cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    setAdminMessage(null);

    try {
      const { data, error } = await supabase
        .rpc('reset_daily_problem', { user_email: user.email });

      if (error) throw error;

      if (data?.success) {
        setAdminMessage({ type: 'success', text: 'All attempts for today have been reset!' });
        // Refresh the page data
        await fetchTodaysQuestion();
      } else {
        setAdminMessage({ type: 'error', text: data?.error || 'Failed to reset attempts' });
      }
    } catch (error) {
      console.error('Error resetting attempts:', error);
      setAdminMessage({ type: 'error', text: 'An error occurred while resetting attempts' });
    } finally {
      setIsResetting(false);
      // Clear message after 5 seconds
      setTimeout(() => setAdminMessage(null), 5000);
    }
  };

  const handleResetMyAttempt = async () => {
    if (!user?.email || !isAdmin) return;

    setIsResetting(true);
    setAdminMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('reset_user_attempt', {
          admin_email: user.email,
          target_user_email: user.email,
          target_date: today
        });

      if (error) throw error;

      if (data?.success) {
        setAdminMessage({ type: 'success', text: 'Your attempt has been reset!' });
        // Reset the local state
        setHasAttemptedToday(false);
        setIsSubmitted(false);
        setUserAnswer('');
        setIsCorrect(false);
        setTimerActive(true);
        setTimeLeft(question?.time_limit || 180);
      } else {
        setAdminMessage({ type: 'error', text: data?.error || 'Failed to reset your attempt' });
      }
    } catch (error) {
      console.error('Error resetting attempt:', error);
      setAdminMessage({ type: 'error', text: 'An error occurred while resetting your attempt' });
    } finally {
      setIsResetting(false);
      // Clear message after 5 seconds
      setTimeout(() => setAdminMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header />
        <Content>
          <LoadingState>
            <div>Loading today's question...</div>
          </LoadingState>
        </Content>
      </Container>
    );
  }

  if (!question) {
    return (
      <Container>
        <Header />
        <Content>
          <EmptyState>
            <EmptyStateIcon>📚</EmptyStateIcon>
            <EmptyStateText>
              No question available today. Check back tomorrow!
            </EmptyStateText>
            <Button $variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </EmptyState>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Header />
      <Content>
        {/* Admin Panel */}
        {isAdmin && (
          <AdminPanel>
            <AdminHeader>
              <AdminTitle>
                <Shield size={20} />
                Admin Controls
              </AdminTitle>
            </AdminHeader>
            <AdminControls>
              <AdminButton
                onClick={handleResetMyAttempt}
                disabled={isResetting || !hasAttemptedToday}
              >
                <RefreshCw size={16} />
                Reset My Attempt
              </AdminButton>
              <AdminButton
                $variant="danger"
                onClick={handleResetAllAttempts}
                disabled={isResetting}
              >
                <RefreshCw size={16} />
                Reset All Attempts Today
              </AdminButton>
            </AdminControls>
            {adminMessage && (
              <AdminMessage $type={adminMessage.type}>
                {adminMessage.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {adminMessage.text}
              </AdminMessage>
            )}
          </AdminPanel>
        )}

        {/* Stats Section */}
        {userStats && (
          <StatsGrid>
            <StatCard>
              <StatValue>
                <Flame size={24} />
                {userStats.current_streak}
              </StatValue>
              <StatLabel>Current Streak</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                <TrendingUp size={24} />
                {userStats.total_correct}/{userStats.total_questions_answered}
              </StatValue>
              <StatLabel>Questions Correct</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                <Award size={24} />
                {userStats.total_points}
              </StatValue>
              <StatLabel>Total Points</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                {userStats.longest_streak}
              </StatValue>
              <StatLabel>Longest Streak</StatLabel>
            </StatCard>
          </StatsGrid>
        )}

        {/* Main Question Card */}
        <DailyHugoCard>
          <CardHeader>
            <Title>
              Daily HUGO #{question.question_number}
            </Title>
            <DateInfo>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DateInfo>
            <QuestionInfo>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge $variant="category">
                  {question.category.toUpperCase()}
                </Badge>
                <Badge $variant="difficulty">
                  {question.difficulty.toUpperCase()}
                </Badge>
              </div>
              {!isSubmitted && (
                <Timer $warning={timeLeft < 30}>
                  <Clock size={20} />
                  {formatTime(timeLeft)}
                </Timer>
              )}
            </QuestionInfo>
          </CardHeader>

          <CardBody>
            <QuestionText>
              {question.question}
            </QuestionText>

            <AnswerSection>
              {!isSubmitted && (
                <AnswerModeSelector>
                  <ModeButton
                    $isActive={answerMode === 'text'}
                    onClick={() => setAnswerMode('text')}
                  >
                    <FileText size={20} />
                    Type Answer
                  </ModeButton>
                  <ModeButton
                    $isActive={answerMode === 'audio'}
                    onClick={() => setAnswerMode('audio')}
                  >
                    <Mic size={20} />
                    Record Audio
                  </ModeButton>
                </AnswerModeSelector>
              )}

              {answerMode === 'text' ? (
                <TextArea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={isSubmitted}
                />
              ) : (
                <AudioRecorderContainer>
                  {audioError && (
                    <ErrorMessage>
                      <AlertCircle size={16} />
                      {audioError}
                    </ErrorMessage>
                  )}

                  {!isSubmitted && (
                    <>
                      <RecordingControls>
                        {!isRecording && !audioUrl ? (
                          <RecordButton
                            onClick={startRecording}
                            $isRecording={false}
                          >
                            <Mic size={24} />
                          </RecordButton>
                        ) : isRecording ? (
                          <>
                            <RecordButton
                              onClick={stopRecording}
                              $isRecording={true}
                            >
                              <Square size={24} />
                            </RecordButton>
                            <RecordingTime>{formatTime(recordingTime)}</RecordingTime>
                            <ControlButton
                              onClick={isPaused ? resumeRecording : pauseRecording}
                            >
                              {isPaused ? <Play size={20} /> : <Pause size={20} />}
                            </ControlButton>
                          </>
                        ) : null}
                      </RecordingControls>

                      {isRecording && (
                        <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          <Mic size={16} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                          Recording in progress...
                        </div>
                      )}
                    </>
                  )}

                  {(transcript || isTranscribing) && (
                    <>
                      <TranscriptLabel>
                        <FileText size={16} />
                        Transcript
                        {isTranscribing && (
                          <TranscribingIndicator>
                            (Transcribing...)
                          </TranscribingIndicator>
                        )}
                      </TranscriptLabel>
                      <TranscriptBox>
                        {transcript || 'Listening for speech...'}
                      </TranscriptBox>
                    </>
                  )}

                  {audioUrl && (
                    <AudioPlayback>
                      <Volume2 size={20} color={theme.colors.primary} />
                      <AudioPlayer controls src={audioUrl} />
                    </AudioPlayback>
                  )}

                  {audioUrl && !isRecording && !isSubmitted && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <Button
                        $variant="secondary"
                        onClick={() => {
                          // Reset recording
                          setUserAnswer('');
                          startRecording();
                        }}
                      >
                        <Mic size={20} />
                        Record Again
                      </Button>
                    </div>
                  )}
                </AudioRecorderContainer>
              )}
            </AnswerSection>

            {!isSubmitted ? (
              <ButtonGroup>
                <Button
                  $variant="primary"
                  onClick={handleSubmit}
                  disabled={
                    answerMode === 'text'
                      ? !userAnswer.trim()
                      : !transcript && !isRecording
                  }
                >
                  Submit Answer
                  <ChevronRight size={20} />
                </Button>
                <Button $variant="secondary" onClick={() => {
                  // Implement hint system
                  alert('Hint feature coming soon!');
                }}>
                  Get Hint (-25 pts)
                  <AlertCircle size={20} />
                </Button>
              </ButtonGroup>
            ) : (
              <>
                <ExplanationCard $correct={isCorrect}>
                  <ExplanationHeader $correct={isCorrect}>
                    {isCorrect ? (
                      <>
                        <CheckCircle size={24} />
                        Correct! Great job!
                      </>
                    ) : (
                      <>
                        <XCircle size={24} />
                        Not quite right
                      </>
                    )}
                  </ExplanationHeader>

                  {!isCorrect && (
                    <CorrectAnswer>
                      <strong>Correct Answer:</strong>
                      <div style={{ marginTop: '0.5rem' }}>
                        {correctAnswer}
                      </div>
                    </CorrectAnswer>
                  )}

                  {explanation && (
                    <ExplanationText>
                      <strong>Explanation:</strong> {explanation}
                    </ExplanationText>
                  )}
                </ExplanationCard>

                <ButtonGroup>
                  <Button $variant="primary" onClick={handleShare}>
                    Share Results
                  </Button>
                  <Button
                    $variant="secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </ButtonGroup>
              </>
            )}
          </CardBody>
        </DailyHugoCard>
      </Content>
    </Container>
  );
};

export default DailyHugo;