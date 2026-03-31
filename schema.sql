-- Drop tables if they exist
DROP TABLE IF EXISTS schedule_slots;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS adventures;

-- Create Adventures table
CREATE TABLE adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  server TEXT,
  job TEXT,
  role TEXT CHECK (role IN ('dealer', 'buffer')),
  fame INTEGER DEFAULT 0,
  damage NUMERIC DEFAULT 0,
  buff_power INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(adventure_id, character_name)
);

-- Create Schedules table
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  column_owners JSONB DEFAULT '[]'::jsonb
);

-- Create ScheduleSlots table
CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('dealer', 'buffer')),
  UNIQUE(schedule_id, position)
);
