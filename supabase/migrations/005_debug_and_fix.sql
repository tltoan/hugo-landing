-- Debug and fix multiplayer_games table issues

-- First, let's see the actual structure of the table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'multiplayer_games'
ORDER BY ordinal_position;

-- Check if we have any enum type constraints
SELECT 
    c.column_name,
    c.data_type,
    e.data_type as enum_type
FROM information_schema.columns c
LEFT JOIN information_schema.element_types e 
    ON ((c.table_schema, c.table_name, 'TABLE', c.dtd_identifier) 
        = (e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
WHERE c.table_schema = 'public' 
AND c.table_name = 'multiplayer_games';

-- Check if there are any CHECK constraints
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
JOIN pg_class cls ON cls.oid = con.conrelid
WHERE nsp.nspname = 'public'
AND cls.relname = 'multiplayer_games'
AND con.contype = 'c';

-- If scenario_id has a foreign key constraint, let's check what values are valid
SELECT * FROM public.lbo_scenarios LIMIT 5;

-- Let's also check if current_players column exists
SELECT COUNT(*) as has_current_players
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'multiplayer_games'
AND column_name = 'current_players';

-- Create a simple test to see what works
-- Try inserting a minimal game record
INSERT INTO public.multiplayer_games (
    name,
    scenario_name,
    created_by,
    status,
    max_players
) VALUES (
    'Test Game from SQL',
    'Test Scenario',
    'b33630cd-d679-47b5-abd1-4cf0c652d65e', -- Your user ID
    'waiting',
    4
) RETURNING *;

-- If that works, clean it up
DELETE FROM public.multiplayer_games WHERE name = 'Test Game from SQL';