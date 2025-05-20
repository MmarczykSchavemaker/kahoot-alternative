ALTER TABLE games
ADD COLUMN game_code text UNIQUE DEFAULT (substring(md5(gen_random_uuid()::text) for 8));

-- Update existing games with short codes
UPDATE games 
SET game_code = substring(md5(id::text) for 8)
WHERE game_code IS NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS games_game_code_idx ON games (game_code);