-- Multiplayer Games Table Structure (for reference)
-- This shows the correct structure of the multiplayer_games table

/*
The multiplayer_games table has these columns:
- id (UUID PRIMARY KEY)
- name (TEXT NOT NULL)
- scenario_id (TEXT)  
- scenario_name (TEXT NOT NULL)
- created_by (UUID REFERENCES profiles)
- status (game_status: 'waiting', 'in_progress', 'completed')
- max_players (INTEGER DEFAULT 4)
- current_players (INTEGER DEFAULT 1) -- This column might not exist!
- created_at (TIMESTAMP)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)

Note: current_players might be a calculated field, not stored
*/