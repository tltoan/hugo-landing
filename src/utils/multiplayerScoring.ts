// Multiplayer scoring system adapted from LBO Racing Game
// Scoring system for LBO Racing Game

export interface ScoreComponents {
  accuracy: number;       // 0-100 percentage
  timeBonus: number;      // Points based on speed
  streakBonus: number;    // Consecutive correct answers
  totalScore: number;     // Combined score
}

export interface ProblemScore {
  problemId: string;
  userId: string;
  accuracy: number;
  timeSeconds: number;
  score: number;
  completedAt: Date;
}

// Calculate accuracy score (percentage of correct formulas)
export function calculateAccuracy(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

// Calculate time bonus based on problem difficulty
export function calculateTimeBonus(
  timeSeconds: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  timeLimit: number
): number {
  // Base time targets by difficulty
  const timeTargets = {
    beginner: 300,      // 5 minutes
    intermediate: 1800, // 30 minutes
    advanced: 3600      // 60 minutes
  };

  const target = timeTargets[difficulty];
  
  // No bonus if over time limit
  if (timeSeconds > timeLimit) return 0;
  
  // Maximum bonus for beating target time
  const maxBonus = difficulty === 'beginner' ? 500 : 
                   difficulty === 'intermediate' ? 1000 : 1500;
  
  // Linear scaling of bonus based on time
  if (timeSeconds <= target) {
    // Full bonus for meeting target
    return maxBonus;
  } else {
    // Proportional reduction up to time limit
    const ratio = 1 - ((timeSeconds - target) / (timeLimit - target));
    return Math.round(maxBonus * Math.max(0, ratio));
  }
}

// Calculate streak bonus for consecutive correct answers
export function calculateStreakBonus(consecutiveCorrect: number): number {
  if (consecutiveCorrect < 3) return 0;
  
  // 50 points per correct answer in streak, capped at 500
  return Math.min(consecutiveCorrect * 50, 500);
}

// Calculate total score combining all factors
export function calculateTotalScore(
  correctAnswers: number,
  totalQuestions: number,
  timeSeconds: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  timeLimit: number,
  consecutiveCorrect: number = 0
): ScoreComponents {
  const accuracy = calculateAccuracy(correctAnswers, totalQuestions);
  const timeBonus = calculateTimeBonus(timeSeconds, difficulty, timeLimit);
  const streakBonus = calculateStreakBonus(consecutiveCorrect);
  
  // Base score from accuracy (max 1000 points)
  const accuracyScore = accuracy * 10;
  
  // Total score calculation
  const totalScore = accuracyScore + timeBonus + streakBonus;
  
  return {
    accuracy,
    timeBonus,
    streakBonus,
    totalScore
  };
}

// Get letter grade based on score
export function getGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'A-';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 55) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
}

// Calculate percentile rank among all scores
export function calculatePercentile(
  userScore: number,
  allScores: number[]
): number {
  if (allScores.length === 0) return 100;
  
  const sortedScores = [...allScores].sort((a, b) => a - b);
  const position = sortedScores.filter(s => s < userScore).length;
  
  return Math.round((position / allScores.length) * 100);
}

// Format score for display
export function formatScore(score: number): string {
  return score.toLocaleString();
}

// Format time for display
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Check achievement criteria
export function checkMultiplayerAchievements(
  userStats: {
    problemsCompleted: number;
    paperLBOsCompleted: number;
    standardLBOsCompleted: number;
    advancedLBOsCompleted: number;
    bestAccuracy: number;
    fastestPaperLBO: number;
    currentStreak: number;
    multiplayerWins: number;
  }
): string[] {
  const earned: string[] = [];
  
  if (userStats.problemsCompleted === 1) {
    earned.push('first_multiplayer');
  }
  
  if (userStats.multiplayerWins >= 5) {
    earned.push('racing_champion');
  }
  
  if (userStats.multiplayerWins >= 10) {
    earned.push('racing_legend');
  }
  
  if (userStats.bestAccuracy === 100) {
    earned.push('perfectionist');
  }
  
  if (userStats.fastestPaperLBO > 0 && userStats.fastestPaperLBO <= 300) {
    earned.push('speed_demon');
  }
  
  if (userStats.currentStreak >= 5) {
    earned.push('streak_master');
  }
  
  return earned;
}

// Multiplayer-specific scoring for real-time games
export interface MultiplayerGameScore {
  userId: string;
  gameId: string;
  finalScore: number;
  completionTime: number;
  accuracy: number;
  rank: number;
  isWinner: boolean;
}

export function calculateMultiplayerRank(
  scores: MultiplayerGameScore[]
): MultiplayerGameScore[] {
  // Sort by score (descending), then by time (ascending) as tiebreaker
  const sortedScores = scores.sort((a, b) => {
    if (b.finalScore === a.finalScore) {
      return a.completionTime - b.completionTime;
    }
    return b.finalScore - a.finalScore;
  });

  // Assign ranks
  return sortedScores.map((score, index) => ({
    ...score,
    rank: index + 1,
    isWinner: index === 0
  }));
}