import { multiplayerService } from './supabaseMultiplayerService';
import { RacingTrack, getModelForTrack } from './racingModels';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface AIPlayerConfig {
  difficulty: AIDifficulty;
  name: string;
  accuracy: number; // 0-100 percentage
  speed: number; // milliseconds per cell
  mistakeRate: number; // 0-1 chance of making a mistake
}

const AI_CONFIGS: Record<AIDifficulty, AIPlayerConfig> = {
  easy: {
    difficulty: 'easy',
    name: '🤖 AI Rookie',
    accuracy: 70,
    speed: 8000, // 8 seconds per cell
    mistakeRate: 0.3
  },
  medium: {
    difficulty: 'medium',
    name: '🤖 AI Challenger',
    accuracy: 85,
    speed: 5000, // 5 seconds per cell
    mistakeRate: 0.15
  },
  hard: {
    difficulty: 'hard',
    name: '🤖 AI Master',
    accuracy: 95,
    speed: 3000, // 3 seconds per cell
    mistakeRate: 0.05
  }
};

// Get LBO model answers based on track
function getLBOAnswers(track: RacingTrack = 'sprint') {
  const model = getModelForTrack(track);
  return model.filter(cell => !cell.locked && cell.answer).map(cell => ({
    cell: cell.id,
    answer: cell.answer || '',
    formula: cell.formula || ''
  }));
}

export interface AIPlayer {
  id: string;
  name: string;
  gameId: string;
  difficulty: AIDifficulty;
  progress: number;
  score: number;
  accuracy: number;
  isReady: boolean;
  isComplete: boolean;
  track?: RacingTrack;
}

export class AIPlayerService {
  private static instance: AIPlayerService;
  private activeAIPlayers: Map<string, AIPlayer> = new Map();
  private aiTimers: Map<string, NodeJS.Timeout[]> = new Map();
  
  private constructor() {}
  
  static getInstance(): AIPlayerService {
    if (!AIPlayerService.instance) {
      AIPlayerService.instance = new AIPlayerService();
    }
    return AIPlayerService.instance;
  }

  // Create an AI player for a game
  createAIPlayer(gameId: string, difficulty: AIDifficulty, track: RacingTrack = 'sprint'): AIPlayer {
    const config = AI_CONFIGS[difficulty];
    const aiId = `ai_${difficulty}_${Date.now()}`;
    
    const aiPlayer: AIPlayer = {
      id: aiId,
      name: config.name,
      gameId: gameId,
      difficulty: difficulty,
      progress: 0,
      score: 0,
      accuracy: 0,  // Start at 0 instead of 100
      isReady: false,
      isComplete: false,
      track: track
    };
    
    this.activeAIPlayers.set(aiId, aiPlayer);
    return aiPlayer;
  }

  // Get AI player by ID
  getAIPlayer(aiId: string): AIPlayer | undefined {
    return this.activeAIPlayers.get(aiId);
  }

  // Get all AI players in a game
  getGameAIPlayers(gameId: string): AIPlayer[] {
    return Array.from(this.activeAIPlayers.values()).filter(ai => ai.gameId === gameId);
  }

  // Mark AI as ready (happens automatically)
  markAIReady(aiId: string) {
    const ai = this.activeAIPlayers.get(aiId);
    if (ai) {
      ai.isReady = true;
      this.broadcastAIUpdate(ai);
    }
  }

  // Start AI behavior when game starts
  startAIPlayer(aiId: string) {
    const ai = this.activeAIPlayers.get(aiId);
    if (!ai || ai.isComplete) return;
    
    // Prevent starting multiple times
    if (this.aiTimers.has(aiId)) {
      console.log(`⚠️ ${ai.name} is already playing`);
      return;
    }
    
    const config = AI_CONFIGS[ai.difficulty];
    const timers: NodeJS.Timeout[] = [];
    
    let completedCells = 0;
    let attempts = 0;
    let correctAttempts = 0;
    const startTime = Date.now();
    
    console.log(`🎮 ${ai.name} starting to play!`);
    
    // Get answers based on track
    const lboAnswers = getLBOAnswers(ai.track || 'sprint');
    
    // Solve each cell with delays
    lboAnswers.forEach((cellData, index) => {
      const baseDelay = index * config.speed;
      const variation = Math.random() * 1000 - 500; // Add randomness
      const delay = Math.max(1000, baseDelay + variation);
      
      const timer = setTimeout(() => {
        if (ai.isComplete) return;
        
        attempts++;
        
        // Determine if AI makes a mistake
        const makesMistake = Math.random() < config.mistakeRate;
        
        if (!makesMistake) {
          // Correct answer on first try
          correctAttempts++;
          completedCells++;
        } else {
          // Make a mistake, then retry
          console.log(`❌ ${ai.name} made a mistake on ${cellData.cell}`);
          
          // Retry after 2 seconds
          const retryTimer = setTimeout(() => {
            if (!ai.isComplete) {
              attempts++;
              correctAttempts++;
              completedCells++;
              
              // Update progress after retry
              ai.progress = (completedCells / lboAnswers.length) * 100;
              ai.accuracy = (correctAttempts / attempts) * 100;
              const elapsedTime = (Date.now() - startTime) / 1000;
              // More balanced scoring: accuracy (0-1000) + speed bonus (0-300) scaled by progress
              const progressMultiplier = ai.progress / 100;
              ai.score = Math.round((ai.accuracy * 10 + Math.max(0, 300 - elapsedTime * 2)) * progressMultiplier);
              
              console.log(`✅ ${ai.name} fixed ${cellData.cell}`);
              this.broadcastAIUpdate(ai);
            }
          }, 2000);
          
          timers.push(retryTimer);
          return;
        }
        
        // Update AI progress
        ai.progress = (completedCells / lboAnswers.length) * 100;
        ai.accuracy = (correctAttempts / attempts) * 100;
        const elapsedTime = (Date.now() - startTime) / 1000;
        // More balanced scoring: accuracy (0-1000) + speed bonus (0-300) scaled by progress
        const progressMultiplier = ai.progress / 100; // Scale score by how much is completed
        ai.score = Math.round((ai.accuracy * 10 + Math.max(0, 300 - elapsedTime * 2)) * progressMultiplier);
        
        console.log(`✅ ${ai.name} completed ${cellData.cell} (${Math.round(ai.progress)}%)`);
        this.broadcastAIUpdate(ai);
        
        // Check if AI completed the game
        if (completedCells === lboAnswers.length) {
          ai.isComplete = true;
          ai.progress = 100;
          
          console.log(`🏁 ${ai.name} finished!`);
          console.log(`   Score: ${ai.score}`);
          console.log(`   Accuracy: ${ai.accuracy.toFixed(1)}%`);
          console.log(`   Time: ${Math.floor(elapsedTime / 60)}:${Math.floor(elapsedTime % 60).toString().padStart(2, '0')}`);
          
          this.broadcastAIUpdate(ai);
          this.cleanupAI(aiId);
        }
      }, delay);
      
      timers.push(timer);
    });
    
    this.aiTimers.set(aiId, timers);
  }

  // Broadcast AI update
  private broadcastAIUpdate(ai: AIPlayer) {
    // Dispatch custom event that components can listen to
    window.dispatchEvent(new CustomEvent('ai-player-update', {
      detail: ai
    }));
  }

  // Stop AI player
  stopAIPlayer(aiId: string) {
    const timers = this.aiTimers.get(aiId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.aiTimers.delete(aiId);
    }
    
    const ai = this.activeAIPlayers.get(aiId);
    if (ai) {
      console.log(`🛑 Stopped ${ai.name}`);
    }
  }

  // Clean up AI after game
  private cleanupAI(aiId: string) {
    this.stopAIPlayer(aiId);
    // Keep the AI player data for final display
  }

  // Remove AI player completely
  removeAIPlayer(aiId: string) {
    this.stopAIPlayer(aiId);
    this.activeAIPlayers.delete(aiId);
  }

  // Stop all AI players in a game
  stopGameAIPlayers(gameId: string) {
    const aiPlayers = this.getGameAIPlayers(gameId);
    aiPlayers.forEach(ai => this.stopAIPlayer(ai.id));
  }

  // Clean up all AI players
  cleanup() {
    this.aiTimers.forEach((timers, aiId) => this.stopAIPlayer(aiId));
    this.activeAIPlayers.clear();
  }
}

// Export singleton instance
export const aiPlayerService = AIPlayerService.getInstance();