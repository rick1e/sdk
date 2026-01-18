-- Supabase Database Setup for Kalooki Game
-- Run this SQL in your Supabase SQL Editor

-- Create games table with proper PostgreSQL types
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL,
    game_state JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create unique index on game_id for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS games_game_id_idx ON games(game_id);

-- Create index for faster queries on active games
CREATE INDEX IF NOT EXISTS games_is_active_idx ON games(is_active);

-- Create index for updated_at queries (for cleanup)
CREATE INDEX IF NOT EXISTS games_updated_at_idx ON games(updated_at);

-- Enable Row Level Security (recommended for production)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (adjust as needed for your security requirements)
CREATE POLICY "Games can be accessed by all users" ON games
    FOR ALL USING (true)
    WITH CHECK (true);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed)
-- GRANT ALL ON games TO authenticated;
-- GRANT SELECT ON games TO anon;