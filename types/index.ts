export type Character = {
  id: string;
  adventure_id: string;
  character_name: string;
  server: string;
  job: string;
  role: 'dealer' | 'buffer';
  fame: number;
  damage: number;
  buff_power: number;
  updated_at: string;
};

export type Adventure = {
  id: string;
  name: string;
  created_at: string;
};

export type Schedule = {
  id: string;
  name: string;
  created_at: string;
};

export type ScheduleSlot = {
  id: string;
  schedule_id: string;
  position: number;
  character_id: string | null;
  role: 'dealer' | 'buffer' | null;
};
