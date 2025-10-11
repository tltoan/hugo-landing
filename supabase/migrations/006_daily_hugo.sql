-- Daily HUGO Feature - IB Interview Prep Questions
-- ============================================================================
-- This migration creates the tables needed for the Daily HUGO feature,
-- which provides daily IB interview prep questions to users
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Question categories based on IB interview topics
CREATE TYPE question_category AS ENUM (
  'accounting',
  'valuation',
  'ma', -- M&A
  'lbo',
  'markets',
  'brainteasers'
);

-- Difficulty levels
CREATE TYPE question_difficulty AS ENUM (
  'basic',
  'intermediate',
  'advanced'
);

-- Answer types
CREATE TYPE answer_type AS ENUM (
  'text',
  'multiple_choice',
  'numerical',
  'true_false',
  'walkthrough'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Store all IB interview questions
CREATE TABLE public.daily_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_number INTEGER UNIQUE NOT NULL, -- Maps to "Question #X of 400"
  category question_category NOT NULL,
  subcategory TEXT,
  difficulty question_difficulty NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  answer_type answer_type DEFAULT 'text',
  choices JSONB, -- For multiple choice questions
  detailed_explanation TEXT,
  common_mistakes TEXT[],
  follow_up_questions TEXT[],
  hints TEXT[], -- Progressive hints
  time_limit INTEGER DEFAULT 180, -- seconds (3 minutes default)
  points INTEGER DEFAULT 100,
  source TEXT DEFAULT '400_guide', -- Track question source
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule which question appears on which day
CREATE TABLE public.daily_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  question_id UUID REFERENCES public.daily_questions(id) ON DELETE CASCADE,
  category_theme TEXT, -- e.g., "Accounting Monday"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user attempts and performance
CREATE TABLE public.user_daily_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.daily_questions(id) ON DELETE CASCADE,
  schedule_date DATE, -- The date this question was featured
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken INTEGER, -- seconds
  user_answer TEXT,
  is_correct BOOLEAN,
  score INTEGER,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id, schedule_date) -- One attempt per user per question per day
);

-- Track user streaks and statistics
CREATE TABLE public.user_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  last_attempt_date DATE,
  category_performance JSONB DEFAULT '{}', -- Track performance by category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track questions that need review (spaced repetition)
CREATE TABLE public.user_question_review (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.daily_questions(id) ON DELETE CASCADE,
  next_review_date DATE NOT NULL,
  review_count INTEGER DEFAULT 0,
  last_attempt_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_daily_questions_category ON public.daily_questions(category);
CREATE INDEX idx_daily_questions_difficulty ON public.daily_questions(difficulty);
CREATE INDEX idx_daily_questions_number ON public.daily_questions(question_number);
CREATE INDEX idx_daily_schedule_date ON public.daily_schedule(date);
CREATE INDEX idx_user_attempts_user_date ON public.user_daily_attempts(user_id, schedule_date);
CREATE INDEX idx_user_attempts_question ON public.user_daily_attempts(question_id);
CREATE INDEX idx_user_stats_user ON public.user_daily_stats(user_id);
CREATE INDEX idx_user_review_date ON public.user_question_review(user_id, next_review_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_review ENABLE ROW LEVEL SECURITY;

-- Daily questions are viewable by all authenticated users
CREATE POLICY "Anyone can view questions"
  ON public.daily_questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Daily schedule is viewable by all authenticated users
CREATE POLICY "Anyone can view schedule"
  ON public.daily_schedule FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only view and manage their own attempts
CREATE POLICY "Users can view own attempts"
  ON public.user_daily_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts"
  ON public.user_daily_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON public.user_daily_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only view and manage their own stats
CREATE POLICY "Users can view own stats"
  ON public.user_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stats"
  ON public.user_daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only view and manage their own review schedule
CREATE POLICY "Users can view own reviews"
  ON public.user_question_review FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reviews"
  ON public.user_question_review FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.user_question_review FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.user_question_review FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate and update user streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  attempt_date DATE;
  streak_count INTEGER;
BEGIN
  -- Get the user's last attempt date
  SELECT last_attempt_date, current_streak
  INTO last_date, streak_count
  FROM public.user_daily_stats
  WHERE user_id = NEW.user_id;

  attempt_date := NEW.schedule_date;

  -- If first attempt ever
  IF last_date IS NULL THEN
    INSERT INTO public.user_daily_stats (user_id, current_streak, last_attempt_date, total_questions_answered)
    VALUES (NEW.user_id, 1, attempt_date, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET current_streak = 1,
        last_attempt_date = attempt_date,
        total_questions_answered = user_daily_stats.total_questions_answered + 1;

  -- If continuing streak (next day)
  ELSIF attempt_date = last_date + INTERVAL '1 day' THEN
    UPDATE public.user_daily_stats
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_attempt_date = attempt_date,
        total_questions_answered = total_questions_answered + 1
    WHERE user_id = NEW.user_id;

  -- If same day attempt (don't update streak)
  ELSIF attempt_date = last_date THEN
    UPDATE public.user_daily_stats
    SET total_questions_answered = total_questions_answered + 1
    WHERE user_id = NEW.user_id;

  -- If streak broken
  ELSE
    UPDATE public.user_daily_stats
    SET current_streak = 1,
        last_attempt_date = attempt_date,
        total_questions_answered = total_questions_answered + 1
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update correct answers count and points if answer was correct
  IF NEW.is_correct THEN
    UPDATE public.user_daily_stats
    SET total_correct = total_correct + 1,
        total_points = total_points + COALESCE(NEW.score, 0)
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak when user attempts a question
CREATE TRIGGER trigger_update_streak
AFTER INSERT ON public.user_daily_attempts
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- Function to get today's question
CREATE OR REPLACE FUNCTION get_todays_question()
RETURNS TABLE (
  question_id UUID,
  question_number INTEGER,
  category question_category,
  difficulty question_difficulty,
  question TEXT,
  answer_type answer_type,
  choices JSONB,
  time_limit INTEGER,
  points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dq.id as question_id,
    dq.question_number,
    dq.category,
    dq.difficulty,
    dq.question,
    dq.answer_type,
    dq.choices,
    dq.time_limit,
    dq.points
  FROM public.daily_schedule ds
  JOIN public.daily_questions dq ON ds.question_id = dq.id
  WHERE ds.date = CURRENT_DATE
  AND ds.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA - Sample Questions
-- ============================================================================

-- Insert sample IB interview questions
INSERT INTO public.daily_questions (
  question_number,
  category,
  difficulty,
  question,
  answer,
  answer_type,
  detailed_explanation,
  time_limit,
  points,
  tags
) VALUES
(1, 'accounting', 'basic',
 'Walk me through the three financial statements.',
 'The three financial statements are the Income Statement, Balance Sheet, and Cash Flow Statement. The Income Statement shows revenues, expenses, and profits over a period. The Balance Sheet shows assets, liabilities, and equity at a point in time. The Cash Flow Statement shows cash inflows and outflows from operating, investing, and financing activities.',
 'text',
 'The Income Statement (IS) shows the company''s profitability over a period of time, typically a quarter or year. It starts with Revenue and subtracts various expenses to arrive at Net Income. The Balance Sheet (BS) provides a snapshot of what the company owns (Assets) and owes (Liabilities), with the difference being Shareholders'' Equity. The Cash Flow Statement (CFS) reconciles Net Income to actual cash by adjusting for non-cash items and changes in working capital, then shows cash from investing and financing activities.',
 300, 100, ARRAY['fundamentals', 'financial_statements']),

(2, 'accounting', 'intermediate',
 'If depreciation goes up by $10, what happens to the three financial statements?',
 'IS: EBIT falls by $10, Net Income falls by $6 (assuming 40% tax rate). BS: PP&E falls by $10, Cash increases by $4, Retained Earnings falls by $6. CFS: Net Income down $6, Depreciation added back +$10, Cash increases by $4.',
 'text',
 'This is testing your understanding of how non-cash expenses flow through the statements. Depreciation reduces pre-tax income but provides a tax shield. The key is remembering that depreciation is a non-cash expense that reduces taxes, so the cash impact is just the tax benefit.',
 180, 150, ARRAY['accounting_mechanics', 'depreciation']),

(3, 'valuation', 'basic',
 'What are the three main valuation methodologies?',
 'The three main valuation methodologies are: 1) Comparable Company Analysis (Comps) - comparing the company to similar public companies, 2) Precedent Transaction Analysis (Precedents) - looking at recent M&A transactions of similar companies, 3) Discounted Cash Flow Analysis (DCF) - projecting future cash flows and discounting them to present value.',
 'text',
 'Comps provide a market-based valuation using current trading multiples. Precedents show what acquirers have actually paid, including control premiums. DCF is an intrinsic valuation based on fundamental cash flow projections. Investment bankers typically use all three to triangulate a valuation range.',
 180, 100, ARRAY['valuation', 'fundamentals']),

(4, 'lbo', 'intermediate',
 'Walk me through a basic LBO model.',
 'In an LBO: 1) Calculate purchase price and sources of funds (debt and equity), 2) Project financial statements and cash flows, 3) Calculate debt paydown from free cash flow, 4) Determine exit value using exit multiple, 5) Calculate equity returns (IRR and multiple of money).',
 'text',
 'The key to LBO models is understanding that private equity firms use significant leverage to amplify equity returns. The model tracks how the company''s cash flow pays down debt over the investment period, increasing equity value. Returns come from debt paydown, EBITDA growth, and multiple expansion.',
 240, 150, ARRAY['lbo', 'private_equity']),

(5, 'ma', 'basic',
 'What is the difference between accretive and dilutive M&A?',
 'A deal is accretive if it increases the acquirer''s EPS (earnings per share) and dilutive if it decreases EPS. This typically depends on whether the acquirer''s P/E ratio is higher (stock deals) or if the after-tax cost of debt is lower than the target''s earnings yield (cash deals).',
 'text',
 'Accretion/dilution analysis is crucial in M&A. For all-stock deals, if Acquirer P/E > Target P/E, the deal is accretive. For cash deals, if the after-tax interest rate on acquisition debt < target''s E/P ratio (inverse of P/E), the deal is accretive. This is a simplified view that doesn''t account for synergies.',
 180, 100, ARRAY['ma', 'accretion_dilution']);

-- Create a schedule for the next 30 days
INSERT INTO public.daily_schedule (date, question_id, category_theme)
SELECT
  CURRENT_DATE + (n || ' days')::INTERVAL,
  (SELECT id FROM public.daily_questions WHERE question_number = ((n % 5) + 1)),
  CASE
    WHEN EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::INTERVAL) = 1 THEN 'Accounting Monday'
    WHEN EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::INTERVAL) = 2 THEN 'Valuation Tuesday'
    WHEN EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::INTERVAL) = 3 THEN 'M&A Wednesday'
    WHEN EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::INTERVAL) = 4 THEN 'LBO Thursday'
    WHEN EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::INTERVAL) = 5 THEN 'Markets Friday'
    ELSE 'Weekend Review'
  END
FROM generate_series(0, 29) AS n;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for authenticated users
GRANT SELECT ON public.daily_questions TO authenticated;
GRANT SELECT ON public.daily_schedule TO authenticated;
GRANT ALL ON public.user_daily_attempts TO authenticated;
GRANT ALL ON public.user_daily_stats TO authenticated;
GRANT ALL ON public.user_question_review TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Daily HUGO tables created successfully!' as status;