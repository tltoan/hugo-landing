-- Fix RLS Policy Infinite Recursion Issue
-- The problem: multiplayer_games policies check game_players, and game_players policies check multiplayer_games
-- This creates infinite recursion

-- ============================================================================
-- DROP EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop multiplayer_games policies
DROP POLICY IF EXISTS "Users can view relevant games" ON public.multiplayer_games;
DROP POLICY IF EXISTS "Users can create games" ON public.multiplayer_games;
DROP POLICY IF EXISTS "Game creators can update games" ON public.multiplayer_games;

-- Drop game_players policies  
DROP POLICY IF EXISTS "Users can view game players" ON public.game_players;
DROP POLICY IF EXISTS "Users can join games" ON public.game_players;
DROP POLICY IF EXISTS "Users can update own player data" ON public.game_players;
DROP POLICY IF EXISTS "Users can leave games" ON public.game_players;

-- ============================================================================
-- CREATE FIXED POLICIES FOR MULTIPLAYER_GAMES
-- ============================================================================

-- Allow all authenticated users to view all games (simpler approach)
CREATE POLICY "Anyone can view games"
    ON public.multiplayer_games FOR SELECT
    USING (true);

-- Users can create games
CREATE POLICY "Authenticated users can create games"
    ON public.multiplayer_games FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Game creators can update their games
CREATE POLICY "Game creators can update their games"
    ON public.multiplayer_games FOR UPDATE
    USING (auth.uid() = created_by);

-- Game creators can delete their games
CREATE POLICY "Game creators can delete their games"
    ON public.multiplayer_games FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================================================
-- CREATE FIXED POLICIES FOR GAME_PLAYERS
-- ============================================================================

-- Anyone can view players in any game (simpler approach)
CREATE POLICY "Anyone can view game players"
    ON public.game_players FOR SELECT
    USING (true);

-- Users can add themselves as players
CREATE POLICY "Users can join games as players"
    ON public.game_players FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own player data
CREATE POLICY "Users can update their player data"
    ON public.game_players FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can remove themselves from games
CREATE POLICY "Users can leave games"
    ON public.game_players FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFY FIX
-- ============================================================================
-- Test that we can now query the tables
SELECT 'Testing multiplayer_games access...' as test;
SELECT COUNT(*) as game_count FROM public.multiplayer_games;

SELECT 'Testing game_players access...' as test;
SELECT COUNT(*) as player_count FROM public.game_players;

SELECT '✅ RLS policies fixed! No more infinite recursion.' as status;