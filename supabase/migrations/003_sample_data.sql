-- Sample Data for Hugo LBO Platform
-- Insert initial scenarios and formula templates

-- ============================================================================
-- SAMPLE LBO SCENARIOS
-- ============================================================================
INSERT INTO public.lbo_scenarios (id, name, description, difficulty, time_limit, max_score, input_data, model_template) VALUES
(
    uuid_generate_v4(),
    'TechCorp LBO',
    'A straightforward LBO analysis of a technology company. Perfect for getting started with LBO modeling fundamentals.',
    'beginner',
    2700, -- 45 minutes
    1000,
    '{
        "company_name": "TechCorp Inc.",
        "enterprise_value": 1000,
        "revenue": 500,
        "ebitda": 100,
        "debt_capacity": 5.0,
        "equity_contribution": 0.3,
        "growth_rate": 0.05,
        "exit_multiple": 8.5
    }',
    '{
        "sections": ["Sources & Uses", "Operating Model", "Debt Schedule", "Returns Analysis"],
        "cells": {
            "B5": {"label": "Purchase Price", "type": "input"},
            "B6": {"label": "Debt Financing", "type": "formula"},
            "B7": {"label": "Equity Investment", "type": "formula"}
        }
    }'
),
(
    uuid_generate_v4(),
    'RetailMax Buyout',
    'Analyze the leveraged buyout of a retail chain. Focus on working capital and seasonality considerations.',
    'beginner',
    3000, -- 50 minutes
    1000,
    '{
        "company_name": "RetailMax Chain",
        "enterprise_value": 750,
        "revenue": 800,
        "ebitda": 80,
        "debt_capacity": 4.5,
        "equity_contribution": 0.35,
        "growth_rate": 0.03,
        "exit_multiple": 7.0
    }',
    '{
        "sections": ["Sources & Uses", "Operating Model", "Working Capital", "Returns Analysis"],
        "cells": {
            "B5": {"label": "Purchase Price", "type": "input"},
            "B6": {"label": "Debt Financing", "type": "formula"},
            "B7": {"label": "Equity Investment", "type": "formula"}
        }
    }'
),
(
    uuid_generate_v4(),
    'Manufacturing Giant',
    'Complex manufacturing company LBO with multiple debt tranches and detailed cash flow analysis.',
    'intermediate',
    3600, -- 60 minutes
    1500,
    '{
        "company_name": "Manufacturing Giant Corp",
        "enterprise_value": 2000,
        "revenue": 1200,
        "ebitda": 180,
        "debt_capacity": 6.0,
        "equity_contribution": 0.25,
        "growth_rate": 0.04,
        "exit_multiple": 9.0
    }',
    '{
        "sections": ["Sources & Uses", "Operating Model", "Debt Waterfall", "Returns Analysis"],
        "cells": {
            "B5": {"label": "Purchase Price", "type": "input"},
            "B6": {"label": "Senior Debt", "type": "formula"},
            "B7": {"label": "Subordinated Debt", "type": "formula"},
            "B8": {"label": "Equity Investment", "type": "formula"}
        }
    }'
),
(
    uuid_generate_v4(),
    'Healthcare Services',
    'LBO modeling for a healthcare services company with regulatory considerations and growth scenarios.',
    'intermediate',
    3900, -- 65 minutes
    1500,
    '{
        "company_name": "HealthCare Services LLC",
        "enterprise_value": 1500,
        "revenue": 900,
        "ebitda": 135,
        "debt_capacity": 5.5,
        "equity_contribution": 0.3,
        "growth_rate": 0.06,
        "exit_multiple": 8.0
    }',
    '{
        "sections": ["Sources & Uses", "Operating Model", "Regulatory Impact", "Returns Analysis"],
        "cells": {
            "B5": {"label": "Purchase Price", "type": "input"},
            "B6": {"label": "Debt Financing", "type": "formula"},
            "B7": {"label": "Equity Investment", "type": "formula"}
        }
    }'
),
(
    uuid_generate_v4(),
    'Energy Conglomerate',
    'Multi-divisional energy company with complex debt structures, commodity hedging, and environmental considerations.',
    'advanced',
    5400, -- 90 minutes
    2000,
    '{
        "company_name": "Energy Conglomerate Holdings",
        "enterprise_value": 5000,
        "revenue": 3000,
        "ebitda": 450,
        "debt_capacity": 7.0,
        "equity_contribution": 0.2,
        "growth_rate": 0.02,
        "exit_multiple": 10.0
    }',
    '{
        "sections": ["Sources & Uses", "Operating Model", "Commodity Hedging", "Environmental Costs", "Complex Debt Structure", "Returns Analysis"],
        "cells": {
            "B5": {"label": "Purchase Price", "type": "input"},
            "B6": {"label": "Revolving Credit", "type": "formula"},
            "B7": {"label": "Term Loan A", "type": "formula"},
            "B8": {"label": "Term Loan B", "type": "formula"},
            "B9": {"label": "High Yield Bond", "type": "formula"},
            "B10": {"label": "Equity Investment", "type": "formula"}
        }
    }'
);

-- ============================================================================
-- SAMPLE FORMULA TEMPLATES (For TechCorp LBO scenario)
-- ============================================================================
-- Get the TechCorp scenario ID
DO $$
DECLARE
    techcorp_id UUID;
BEGIN
    SELECT id INTO techcorp_id FROM public.lbo_scenarios WHERE name = 'TechCorp LBO';
    
    INSERT INTO public.formula_templates (scenario_id, cell_reference, correct_formula, hint, explanation, points) VALUES
    (techcorp_id, 'B5', '1000', 'The purchase price is given in the scenario data', 'This is the enterprise value we are paying for the company', 10),
    (techcorp_id, 'B6', '=B5*0.7', 'Debt typically finances 60-80% of the purchase price', 'Debt financing is calculated as a percentage of the purchase price', 15),
    (techcorp_id, 'B7', '=B5*0.3', 'Equity fills the gap between purchase price and debt', 'Equity investment equals purchase price minus debt financing', 15),
    (techcorp_id, 'B8', '=100*1.05', 'Apply the growth rate to base EBITDA', 'Year 1 EBITDA grows at the specified growth rate', 20),
    (techcorp_id, 'B9', '=B8*8.5', 'Exit value uses the exit multiple on final year EBITDA', 'Enterprise value at exit is calculated using the exit multiple', 25),
    (techcorp_id, 'B10', '=(B9-B6)/B7', 'MOIC is exit equity value divided by initial equity investment', 'Money-on-Money return shows how many times the equity investment grew', 30);
END $$;

-- ============================================================================
-- ADMIN USER FUNCTIONS
-- ============================================================================
-- Function to get platform statistics (accessible via RPC)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.profiles),
        'total_games_played', (SELECT COUNT(*) FROM public.multiplayer_games WHERE status = 'completed'),
        'active_games', (SELECT COUNT(*) FROM public.multiplayer_games WHERE status IN ('waiting', 'in_progress')),
        'total_scenarios', (SELECT COUNT(*) FROM public.lbo_scenarios),
        'avg_completion_rate', (
            SELECT COALESCE(AVG(
                CASE WHEN is_completed THEN 1.0 ELSE 0.0 END
            ) * 100, 0)
            FROM public.user_progress
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    username TEXT,
    total_score INTEGER,
    problems_completed INTEGER,
    accuracy DECIMAL(5,2),
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.username,
        us.total_score,
        us.total_problems_completed,
        us.average_accuracy,
        ROW_NUMBER() OVER (ORDER BY us.total_score DESC)::INTEGER as rank
    FROM public.user_stats us
    JOIN public.profiles p ON us.user_id = p.id
    WHERE us.total_score > 0
    ORDER BY us.total_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS FOR GAME MANAGEMENT
-- ============================================================================
-- Function to join a multiplayer game
CREATE OR REPLACE FUNCTION public.join_multiplayer_game(game_uuid UUID)
RETURNS JSON AS $$
DECLARE
    game_rec RECORD;
    player_count INTEGER;
    result JSON;
BEGIN
    -- Get game details
    SELECT * INTO game_rec FROM public.multiplayer_games WHERE id = game_uuid;
    
    IF game_rec IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Game not found');
    END IF;
    
    IF game_rec.status != 'waiting' THEN
        RETURN json_build_object('success', false, 'error', 'Game is not accepting new players');
    END IF;
    
    -- Check if user is already in the game
    IF EXISTS (SELECT 1 FROM public.game_players WHERE game_id = game_uuid AND user_id = auth.uid()) THEN
        RETURN json_build_object('success', false, 'error', 'You are already in this game');
    END IF;
    
    -- Check if game is full
    SELECT COUNT(*) INTO player_count FROM public.game_players WHERE game_id = game_uuid;
    
    IF player_count >= game_rec.max_players THEN
        RETURN json_build_object('success', false, 'error', 'Game is full');
    END IF;
    
    -- Add player to game
    INSERT INTO public.game_players (game_id, user_id, username)
    SELECT game_uuid, auth.uid(), p.username
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    -- Update game player count
    UPDATE public.multiplayer_games 
    SET current_players = player_count + 1
    WHERE id = game_uuid;
    
    -- Log join event
    INSERT INTO public.game_events (game_id, user_id, event_type, event_data)
    VALUES (game_uuid, auth.uid(), 'player_join', json_build_object('player_count', player_count + 1));
    
    RETURN json_build_object('success', true, 'message', 'Successfully joined game');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;