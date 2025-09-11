// Multiplayer service for managing games, players, and real-time updates
// This will be integrated with Supabase for real-time multiplayer functionality

export interface MultiplayerGame {
  id: string;
  name: string;
  scenarioId: string;
  scenarioName: string;
  createdBy: string;
  status: 'waiting' | 'in_progress' | 'completed';
  players: string[];
  maxPlayers: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface GamePlayer {
  userId: string;
  username: string;
  currentCell?: string;
  score: number;
  accuracy: number;
  progress: number;
  isReady: boolean;
}

export interface GameEvent {
  id: string;
  gameId: string;
  userId: string;
  type: 'join' | 'leave' | 'cell_update' | 'formula_submit' | 'complete';
  data: any;
  timestamp: Date;
}

// Mock data for initial implementation
const mockGames: MultiplayerGame[] = [];
let gameIdCounter = 1;

export class MultiplayerService {
  private static instance: MultiplayerService;
  
  private constructor() {}
  
  static getInstance(): MultiplayerService {
    if (!MultiplayerService.instance) {
      MultiplayerService.instance = new MultiplayerService();
    }
    return MultiplayerService.instance;
  }

  // Game Management
  async createGame(
    name: string, 
    scenarioId: string, 
    userId: string,
    maxPlayers: number = 4
  ): Promise<MultiplayerGame> {
    const game: MultiplayerGame = {
      id: `game_${gameIdCounter++}`,
      name: name.trim(),
      scenarioId,
      scenarioName: this.getScenarioName(scenarioId),
      createdBy: userId,
      status: 'waiting',
      players: [userId],
      maxPlayers,
      createdAt: new Date()
    };

    mockGames.push(game);
    return game;
  }

  async getActiveGames(): Promise<MultiplayerGame[]> {
    // Filter games that are waiting or in progress
    return mockGames.filter(game => 
      game.status === 'waiting' || game.status === 'in_progress'
    );
  }

  async getGame(gameId: string): Promise<MultiplayerGame | null> {
    return mockGames.find(game => game.id === gameId) || null;
  }

  async joinGame(gameId: string, userId: string): Promise<boolean> {
    const game = mockGames.find(g => g.id === gameId);
    if (!game) return false;
    
    if (game.players.length >= game.maxPlayers) return false;
    if (game.players.includes(userId)) return true; // Already joined
    if (game.status !== 'waiting') return false;

    game.players.push(userId);
    return true;
  }

  async leaveGame(gameId: string, userId: string): Promise<boolean> {
    const game = mockGames.find(g => g.id === gameId);
    if (!game) return false;

    const index = game.players.indexOf(userId);
    if (index === -1) return false;

    game.players.splice(index, 1);
    
    // If creator left, cancel the game or transfer ownership
    if (game.createdBy === userId) {
      if (game.players.length === 0) {
        game.status = 'completed'; // Cancel empty game
      } else {
        game.createdBy = game.players[0]; // Transfer to first player
      }
    }

    return true;
  }

  async startGame(gameId: string, userId: string): Promise<boolean> {
    const game = mockGames.find(g => g.id === gameId);
    if (!game) return false;
    if (game.createdBy !== userId) return false;
    if (game.status !== 'waiting') return false;

    game.status = 'in_progress';
    game.startedAt = new Date();
    return true;
  }

  async deleteGame(gameId: string, userId: string): Promise<boolean> {
    const gameIndex = mockGames.findIndex(g => g.id === gameId);
    if (gameIndex === -1) return false;
    
    const game = mockGames[gameIndex];
    if (game.createdBy !== userId) return false;

    mockGames.splice(gameIndex, 1);
    return true;
  }

  // Player Management
  async getGamePlayers(gameId: string): Promise<GamePlayer[]> {
    const game = await this.getGame(gameId);
    if (!game) return [];

    // Mock player data - would come from database in real implementation
    return game.players.map((playerId, index) => ({
      userId: playerId,
      username: `Player ${index + 1}`,
      score: 0,
      accuracy: 0,
      progress: 0,
      isReady: false
    }));
  }

  async updatePlayerProgress(
    gameId: string, 
    userId: string, 
    progress: Partial<GamePlayer>
  ): Promise<boolean> {
    // In real implementation, this would update the database
    // and broadcast to other players via real-time subscriptions
    console.log('Updating player progress:', { gameId, userId, progress });
    return true;
  }

  // Real-time Events (Mock implementation)
  async subscribeToGame(
    gameId: string, 
    callback: (event: GameEvent) => void
  ): Promise<() => void> {
    // In real implementation, this would set up Supabase real-time subscription
    console.log('Subscribing to game:', gameId);
    
    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from game:', gameId);
    };
  }

  async broadcastEvent(gameId: string, event: Omit<GameEvent, 'id' | 'timestamp'>): Promise<void> {
    // In real implementation, this would broadcast via Supabase
    console.log('Broadcasting event:', { gameId, event });
  }

  // Scenarios
  private getScenarioName(scenarioId: string): string {
    const scenarios: Record<string, string> = {
      'techcorp': 'TechCorp LBO',
      'retailmax': 'RetailMax Buyout', 
      'manufacturing': 'Manufacturing Giant',
      'healthcare': 'Healthcare Services',
      'energy': 'Energy Conglomerate'
    };
    return scenarios[scenarioId] || 'Unknown Scenario';
  }

  async getAvailableScenarios() {
    return [
      { id: 'techcorp', name: 'TechCorp LBO', difficulty: 'beginner', timeLimit: 600 },
      { id: 'retailmax', name: 'RetailMax Buyout', difficulty: 'beginner', timeLimit: 600 },
      { id: 'manufacturing', name: 'Manufacturing Giant', difficulty: 'intermediate', timeLimit: 1800 },
      { id: 'healthcare', name: 'Healthcare Services', difficulty: 'intermediate', timeLimit: 1800 },
      { id: 'energy', name: 'Energy Conglomerate', difficulty: 'advanced', timeLimit: 3600 }
    ];
  }

  // Leaderboards
  async getGlobalLeaderboard(limit: number = 50) {
    // Mock leaderboard data
    return [
      { rank: 1, userId: 'user1', username: 'Player 1', score: 2500, gamesWon: 15 },
      { rank: 2, userId: 'user2', username: 'Player 2', score: 2200, gamesWon: 12 },
      { rank: 3, userId: 'user3', username: 'Player 3', score: 1800, gamesWon: 8 }
    ];
  }

  async getUserRank(userId: string): Promise<{ rank: number; percentile: number } | null> {
    // Mock user ranking
    return { rank: 42, percentile: 78 };
  }
}

// Export singleton instance
export const multiplayerService = MultiplayerService.getInstance();