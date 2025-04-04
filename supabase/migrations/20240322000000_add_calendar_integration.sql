-- Create table for storing calendar tokens
CREATE TABLE creator_calendar_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_calendar_tokens_creator_id ON creator_calendar_tokens(creator_id);

-- Enable RLS
ALTER TABLE creator_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Creators can view their own calendar tokens"
  ON creator_calendar_tokens FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own calendar tokens"
  ON creator_calendar_tokens FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own calendar tokens"
  ON creator_calendar_tokens FOR DELETE
  USING (auth.uid() = creator_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_creator_calendar_tokens_updated_at
  BEFORE UPDATE ON creator_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
