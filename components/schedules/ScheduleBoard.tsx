'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Character, ScheduleSlot } from '@/types';

interface ScheduleBoardProps {
  scheduleId: string;
  initialSlots: any[];
  allCharacters: Character[];
}

export default function ScheduleBoard({ scheduleId, initialSlots, allCharacters }: ScheduleBoardProps) {
  const [slots, setSlots] = useState<any[]>(initialSlots);
  const [loadingParam, setLoadingParam] = useState<number | null>(null);

  // We map position 0 to 11 (assume max 12 slots for DNF Raids like Bakal or Ozma)
  const MAX_POSITIONS = 12;

  const handleAssign = async (position: number, characterId: string | null) => {
    setLoadingParam(position);
    
    // Find char details to save role safely, or set null
    const selectedChar = allCharacters.find(c => c.id === characterId);
    
    try {
      if (!characterId) {
        // Unassign slot -> delete it safely via Supabase
        await supabase
          .from('schedule_slots')
          .delete()
          .match({ schedule_id: scheduleId, position });
        
        setSlots(slots.filter(s => s.position !== position));
      } else {
        // Upsert slot
        const payload = {
          schedule_id: scheduleId,
          position,
          character_id: selectedChar?.id || null,
          role: selectedChar?.role || null,
        };

        const { data, error } = await supabase
          .from('schedule_slots')
          .upsert(payload, { onConflict: 'schedule_id, position' })
          .select('*, characters(*)')
          .single();

        if (error) throw new Error(error.message);

        setSlots(prev => {
          const newSlots = [...prev];
          const idx = newSlots.findIndex(s => s.position === position);
          if (idx >= 0) newSlots[idx] = data;
          else newSlots.push(data);
          return newSlots;
        });
      }
    } catch (err: any) {
      alert(`Error updating slot: ${err.message}`);
    } finally {
      setLoadingParam(null);
    }
  };

  // Pre-generate grid mapping positions
  const gridPositions = Array.from({ length: MAX_POSITIONS }, (_, i) => i);

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">Raid Party Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gridPositions.map(pos => {
          const slotData = slots.find(s => s.position === pos);
          const isSlotLoading = loadingParam === pos;
          const assignedCharId = slotData?.character_id || '';

          return (
            <div key={pos} className="border border-gray-200 rounded p-4 flex flex-col items-center bg-gray-50 hover:shadow transition">
              <span className="text-xs font-bold text-gray-500 uppercase mb-2 bg-gray-200 px-2 py-1 rounded">Position {pos + 1}</span>
              
              {isSlotLoading ? (
                <div className="text-sm text-gray-500 py-2">Updating...</div>
              ) : (
                <select
                  className={`w-full border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${!assignedCharId ? 'text-gray-400' : 'text-gray-900 font-medium'}`}
                  value={assignedCharId}
                  onChange={(e) => handleAssign(pos, e.target.value === '' ? null : e.target.value)}
                >
                  <option value="">-- Empty --</option>
                  {allCharacters.map(char => (
                    <option key={char.id} value={char.id}>
                      [{char.role === 'buffer' ? 'B' : 'D'}] {char.character_name} 
                      ({char.fame.toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
              
              {/* Context display for slot */}
              <div className="mt-3 text-xs w-full text-center min-h-[40px]">
                {slotData?.characters ? (
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <span className="font-semibold text-blue-700">{slotData.characters.job}</span>
                    <span className="text-gray-500">
                      {slotData.characters.role === 'dealer'
                        ? `Dmg: ${slotData.characters.damage?.toFixed(1) || '-'}`
                        : `B.Pow: ${(slotData.characters.buff_power || 0).toLocaleString()}`
                      }
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No character</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
