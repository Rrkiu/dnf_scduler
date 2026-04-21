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

-- Create AdventureHellEntries table
CREATE TABLE adventure_hell_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  entry_count INTEGER NOT NULL DEFAULT 0,
  content_type TEXT NOT NULL DEFAULT 'hell',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(adventure_id, week_key, content_type)
);

-- Create CharacterSnapshots table
CREATE TABLE character_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  equipment JSONB,
  oath JSONB,
  status JSONB,
  relic_count INTEGER DEFAULT 0,
  epic_count INTEGER DEFAULT 0,
  set_names TEXT[] DEFAULT '{}',
  avatar JSONB,     -- array of AvatarSlot objects from /equip/avatar
  creature JSONB    -- creature + artifact from /equip/creature
);

-- Migration: add avatar/creature columns to existing table if they don't exist
-- Run this if table already exists:
-- ALTER TABLE character_snapshots ADD COLUMN IF NOT EXISTS avatar JSONB;
-- ALTER TABLE character_snapshots ADD COLUMN IF NOT EXISTS creature JSONB;
