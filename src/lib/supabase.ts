import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'mock-key'

const isMockMode = supabaseUrl === 'https://mock.supabase.co' || !supabaseUrl.includes('supabase.co')

if (isMockMode) {
  console.warn('Running in mock mode. Please add real Supabase credentials to your .env file for full functionality.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export { isMockMode }

// Database types
export interface User {
  id: string
  email: string
  username: string
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  name: string
  type: 'paper_lbo' | 'standard_lbo' | 'advanced_lbo'
  status: 'waiting' | 'in_progress' | 'completed'
  created_by: string
  started_at?: string
  ended_at?: string
  max_players: number
  scenario_id: string
}

export interface GameParticipant {
  game_id: string
  user_id: string
  joined_at: string
  final_score?: number
  completion_time?: number
  progress: number
  current_cell?: string
}

export interface LBOScenario {
  id: string
  name: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  input_data: any
  time_limit: number
  max_score: number
}

export interface FormulaTemplate {
  id: string
  scenario_id: string
  cell_reference: string
  correct_formula: string
  hint: string
  explanation: string
  points: number
}

export interface GameEvent {
  id: string
  game_id: string
  user_id: string
  event_type: 'cell_submit' | 'hint_request' | 'game_complete'
  cell_reference?: string
  submitted_formula?: string
  is_correct?: boolean
  timestamp: string
}