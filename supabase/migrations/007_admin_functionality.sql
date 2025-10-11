-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create policy for users to see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- Insert profile for existing users who don't have one
INSERT INTO user_profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Create an admin_actions table to log admin activities
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on admin_actions
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Set antonyltran@gmail.com as admin
UPDATE user_profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'antonyltran@gmail.com'
);

-- Create function to reset daily problem (admin only)
CREATE OR REPLACE FUNCTION reset_daily_problem(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_today DATE;
BEGIN
  -- Get user ID and check if admin
  SELECT u.id, COALESCE(up.is_admin, FALSE)
  INTO v_user_id, v_is_admin
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE u.email = user_email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User not found'
    );
  END IF;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  v_today := CURRENT_DATE;

  -- Delete today's attempts for all users
  DELETE FROM user_daily_attempts
  WHERE schedule_date = v_today;

  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, action_details)
  VALUES (
    v_user_id,
    'reset_daily_problem',
    jsonb_build_object(
      'date', v_today,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Daily problem reset successfully',
    'affected_date', v_today
  );
END;
$$;

-- Create function to reset specific user's attempt (admin only)
CREATE OR REPLACE FUNCTION reset_user_attempt(admin_email TEXT, target_user_email TEXT, target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_target_user_id UUID;
  v_deleted_count INT;
BEGIN
  -- Get admin ID and check if admin
  SELECT u.id, COALESCE(up.is_admin, FALSE)
  INTO v_admin_id, v_is_admin
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE u.email = admin_email;

  IF NOT FOUND OR NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Get target user ID
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = target_user_email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Target user not found'
    );
  END IF;

  -- Delete the attempt
  WITH deleted AS (
    DELETE FROM user_daily_attempts
    WHERE user_id = v_target_user_id
    AND schedule_date = target_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, action_details)
  VALUES (
    v_admin_id,
    'reset_user_attempt',
    jsonb_build_object(
      'target_user_email', target_user_email,
      'target_date', target_date,
      'deleted_count', v_deleted_count,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User attempt reset successfully',
    'deleted_count', v_deleted_count,
    'target_user', target_user_email,
    'date', target_date
  );
END;
$$;

-- Create function to get admin status
CREATE OR REPLACE FUNCTION get_admin_status(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT COALESCE(up.is_admin, FALSE)
  INTO v_is_admin
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE u.email = user_email;

  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

-- Create function to change question for today (admin only)
CREATE OR REPLACE FUNCTION change_todays_question(admin_email TEXT, new_question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_today DATE;
  v_old_question_id UUID;
BEGIN
  -- Get admin ID and check if admin
  SELECT u.id, COALESCE(up.is_admin, FALSE)
  INTO v_admin_id, v_is_admin
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE u.email = admin_email;

  IF NOT FOUND OR NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  v_today := CURRENT_DATE;

  -- Get current question for today
  SELECT question_id INTO v_old_question_id
  FROM daily_schedule
  WHERE schedule_date = v_today;

  -- Update the schedule
  UPDATE daily_schedule
  SET question_id = new_question_id
  WHERE schedule_date = v_today;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO daily_schedule (question_id, schedule_date, is_active)
    VALUES (new_question_id, v_today, TRUE);
  END IF;

  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, action_details)
  VALUES (
    v_admin_id,
    'change_todays_question',
    jsonb_build_object(
      'date', v_today,
      'old_question_id', v_old_question_id,
      'new_question_id', new_question_id,
      'timestamp', NOW()
    )
  );

  -- Delete all attempts for today since question changed
  DELETE FROM user_daily_attempts
  WHERE schedule_date = v_today;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Today''s question changed successfully',
    'date', v_today,
    'new_question_id', new_question_id
  );
END;
$$;

-- Create RLS policies for admin_actions table
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
DROP POLICY IF EXISTS "System inserts admin actions" ON admin_actions;

-- Admins can view all admin actions
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
    )
  );

-- Only system can insert admin actions (through functions)
CREATE POLICY "System inserts admin actions" ON admin_actions
  FOR INSERT
  WITH CHECK (FALSE);

-- Grant necessary permissions
GRANT SELECT ON admin_actions TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_problem TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_status TO authenticated;
GRANT EXECUTE ON FUNCTION change_todays_question TO authenticated;

-- Add comment
COMMENT ON TABLE admin_actions IS 'Logs all admin actions for audit purposes';
COMMENT ON COLUMN user_profiles.is_admin IS 'Indicates if the user has admin privileges';