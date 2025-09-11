// Real Supabase-connected multiplayer service
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MultiplayerGame {
  id: string;
  name: string;
  scenario_id?: string; // Optional - it's UUID in DB but we use strings
  scenario_name: string;
  created_by: string;
  status: 'waiting' | 'in_progress' | 'completed';
  max_players: number;
  current_players: number; // Actually exists in table with default 1
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  username: string;
  current_cell?: string;
  score: number;
  accuracy: number;
  progress: number;
  is_ready: boolean;
  joined_at: string;
  last_active: string;
}

export interface GameEvent {
  id: string;
  game_id: string;
  user_id: string;
  event_type: 'cell_submit' | 'hint_request' | 'game_complete' | 'player_join' | 'player_leave';
  event_data: any;
  created_at: string;
}

export class SupabaseMultiplayerService {
  private static instance: SupabaseMultiplayerService;
  private gameChannel: RealtimeChannel | null = null;
  private gameSubscriptions: Map<string, RealtimeChannel> = new Map();
  
  private constructor() {}
  
  static getInstance(): SupabaseMultiplayerService {
    if (!SupabaseMultiplayerService.instance) {
      SupabaseMultiplayerService.instance = new SupabaseMultiplayerService();
    }
    return SupabaseMultiplayerService.instance;
  }

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  }

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  }

  // Create a new game
  async createGame(
    name: string, 
    scenarioId: string, 
    scenarioName: string,
    maxPlayers: number = 4
  ): Promise<MultiplayerGame | null> {
    const user = await this.getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      return null;
    }

    const profile = await this.getUserProfile(user.id);
    if (!profile) {
      console.error('No user profile found');
      return null;
    }

    // Prepare game data matching the actual table structure
    const gameData = {
      name: name.trim(),
      scenario_name: scenarioName, // Just use the name, not the ID
      created_by: user.id,
      status: 'waiting',
      max_players: maxPlayers,
      current_players: 1 // This column exists with default 1
      // Don't include scenario_id - it expects UUID but we have strings
    };
    
    console.log('Attempting to create game with data:', gameData);
    
    // Insert the game
    const { data: game, error: gameError } = await supabase
      .from('multiplayer_games')
      .insert(gameData)
      .select()
      .single();

    if (gameError) {
      console.error('Error creating game:', gameError);
      console.error('Full error object:', JSON.stringify(gameError, null, 2));
      
      // Try to parse the error message if it contains JSON
      if (gameError.message) {
        try {
          const parsed = JSON.parse(gameError.message);
          console.error('Parsed error:', parsed);
        } catch {
          console.error('Error message:', gameError.message);
        }
      }
      
      return null;
    }

    // Add creator as first player
    const { error: playerError } = await supabase
      .from('game_players')
      .insert({
        game_id: game.id,
        user_id: user.id,
        username: profile.username || profile.email,
        score: 0,
        accuracy: 0,
        progress: 0,
        is_ready: false
      });

    if (playerError) {
      console.error('Error adding player to game:', playerError);
      // Clean up the game if we couldn't add the player
      await supabase.from('multiplayer_games').delete().eq('id', game.id);
      return null;
    }

    // Log game creation event
    await this.logGameEvent(game.id, user.id, 'player_join', { 
      username: profile.username || profile.email 
    });

    return game;
  }

  // Get all active games (current_players is in the table)
  async getActiveGames(): Promise<MultiplayerGame[]> {
    const { data: games, error } = await supabase
      .from('multiplayer_games')
      .select('*')
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active games:', error);
      console.error('Active games error details:', error.message);
      return [];
    }

    return games || [];
  }

  // Get games for current user
  async getUserGames(): Promise<MultiplayerGame[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('multiplayer_games')
      .select('*')
      .or(`created_by.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user games:', error);
      return [];
    }

    return data || [];
  }

  // Join a game
  async joinGame(gameId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      return false;
    }

    const profile = await this.getUserProfile(user.id);
    if (!profile) {
      console.error('No user profile found');
      return false;
    }

    // Check if game exists and is joinable
    const { data: game, error: gameError } = await supabase
      .from('multiplayer_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      console.error('Game not found:', gameError);
      return false;
    }

    if (game.status !== 'waiting') {
      console.error('Game is not accepting new players');
      return false;
    }

    // Check if already in game
    const { data: existingPlayer } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .single();

    if (existingPlayer) {
      console.log('Already in this game');
      return true; // Already in the game
    }

    // Check if game is full
    const { count } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);

    if (count && count >= game.max_players) {
      console.error('Game is full');
      return false;
    }

    // Add player to game
    const { error: joinError } = await supabase
      .from('game_players')
      .insert({
        game_id: gameId,
        user_id: user.id,
        username: profile.username || profile.email,
        score: 0,
        accuracy: 0,
        progress: 0,
        is_ready: false
      });

    if (joinError) {
      console.error('Error joining game:', joinError);
      return false;
    }

    // Update player count
    await supabase
      .from('multiplayer_games')
      .update({ current_players: (count || 0) + 1 })
      .eq('id', gameId);

    // Log join event
    await this.logGameEvent(gameId, user.id, 'player_join', { 
      username: profile.username || profile.email 
    });

    return true;
  }

  // Leave a game
  async leaveGame(gameId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Remove player from game
    const { error } = await supabase
      .from('game_players')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving game:', error);
      return false;
    }

    // Check how many players are left
    const { count } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);

    // Update player count
    await supabase
      .from('multiplayer_games')
      .update({ current_players: count || 0 })
      .eq('id', gameId);

    // Log leave event
    await this.logGameEvent(gameId, user.id, 'player_leave', {});

    // If no players left, mark game as completed
    if (count === 0) {
      await supabase
        .from('multiplayer_games')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_players: 0
        })
        .eq('id', gameId);
    }

    return true;
  }

  // Get game details with players
  async getGameDetails(gameId: string): Promise<{ game: MultiplayerGame | null; players: GamePlayer[] }> {
    const { data: game, error: gameError } = await supabase
      .from('multiplayer_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      console.error('Error fetching game:', gameError);
      return { game: null, players: [] };
    }

    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return { game, players: [] };
    }

    return { game, players: players || [] };
  }

  // Toggle player ready status
  async togglePlayerReady(gameId: string, isReady: boolean): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Update player ready status
    const { error } = await supabase
      .from('game_players')
      .update({ 
        is_ready: isReady,
        last_active: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating ready status:', error);
      return false;
    }

    return true;
  }

  // Update player progress and score
  async updatePlayerProgress(
    gameId: string, 
    progress: number, 
    score?: number,
    accuracy?: number,
    currentCell?: string
  ): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const updateData: any = {
      progress: Math.min(100, Math.max(0, progress)),
      last_active: new Date().toISOString()
    };

    if (score !== undefined) updateData.score = score;
    if (accuracy !== undefined) updateData.accuracy = accuracy;
    if (currentCell !== undefined) updateData.current_cell = currentCell;

    const { error } = await supabase
      .from('game_players')
      .update(updateData)
      .eq('game_id', gameId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating player progress:', error);
      return false;
    }

    // Log progress event
    await this.logGameEvent(gameId, user.id, 'cell_submit', {
      progress,
      score,
      accuracy,
      currentCell
    });

    return true;
  }

  // Complete game for player
  async completeGameForPlayer(
    gameId: string,
    finalScore: number,
    finalAccuracy: number,
    completionTime: number
  ): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Update player's final stats
    const { error: playerError } = await supabase
      .from('game_players')
      .update({
        progress: 100,
        score: finalScore,
        accuracy: finalAccuracy,
        last_active: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('user_id', user.id);

    if (playerError) {
      console.error('Error completing game for player:', playerError);
      return false;
    }

    // Log completion event
    await this.logGameEvent(gameId, user.id, 'game_complete', {
      finalScore,
      finalAccuracy,
      completionTime
    });

    // Check if all players have completed
    const { data: players } = await supabase
      .from('game_players')
      .select('progress')
      .eq('game_id', gameId);

    if (players && players.every(p => p.progress === 100)) {
      // All players completed - mark game as completed
      await supabase
        .from('multiplayer_games')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', gameId);
    }

    return true;
  }

  // Start a game
  async startGame(gameId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Check if user is the game creator
    const { data: game, error } = await supabase
      .from('multiplayer_games')
      .select('*')
      .eq('id', gameId)
      .eq('created_by', user.id)
      .single();

    if (error || !game) {
      console.error('Not authorized to start this game');
      return false;
    }

    // Update game status
    const { error: updateError } = await supabase
      .from('multiplayer_games')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('Error starting game:', updateError);
      return false;
    }

    return true;
  }

  // Subscribe to game updates
  subscribeToGame(gameId: string, onUpdate: (payload: any) => void): RealtimeChannel {
    // Unsubscribe from existing channel if any
    if (this.gameSubscriptions.has(gameId)) {
      const existingChannel = this.gameSubscriptions.get(gameId);
      existingChannel?.unsubscribe();
    }

    // Create new subscription
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Player update:', payload);
          onUpdate({ type: 'player_update', data: payload });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_events',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Game event:', payload);
          onUpdate({ type: 'game_event', data: payload });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log('Game update:', payload);
          onUpdate({ type: 'game_update', data: payload });
        }
      )
      .subscribe();

    this.gameSubscriptions.set(gameId, channel);
    return channel;
  }

  // Unsubscribe from game updates
  unsubscribeFromGame(gameId: string) {
    const channel = this.gameSubscriptions.get(gameId);
    if (channel) {
      channel.unsubscribe();
      this.gameSubscriptions.delete(gameId);
    }
  }

  // Subscribe to all games (for lobby)
  subscribeToLobby(onUpdate: (payload: any) => void): RealtimeChannel {
    if (this.gameChannel) {
      this.gameChannel.unsubscribe();
    }

    this.gameChannel = supabase
      .channel('lobby')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_games'
        },
        (payload) => {
          console.log('Lobby update:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    return this.gameChannel;
  }

  // Unsubscribe from lobby
  unsubscribeFromLobby() {
    if (this.gameChannel) {
      this.gameChannel.unsubscribe();
      this.gameChannel = null;
    }
  }

  // Log game event
  private async logGameEvent(
    gameId: string, 
    userId: string, 
    eventType: GameEvent['event_type'], 
    eventData: any
  ): Promise<void> {
    const { error } = await supabase
      .from('game_events')
      .insert({
        game_id: gameId,
        user_id: userId,
        event_type: eventType,
        event_data: eventData
      });

    if (error) {
      console.error('Error logging game event:', error);
    }
  }

  // Clean up on logout
  cleanup() {
    this.unsubscribeFromLobby();
    this.gameSubscriptions.forEach(channel => channel.unsubscribe());
    this.gameSubscriptions.clear();
  }
}

// Export singleton instance
export const multiplayerService = SupabaseMultiplayerService.getInstance();