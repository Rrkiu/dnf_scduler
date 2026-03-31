'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Character, Adventure } from '@/types';
import PartyRow from './PartyRow';
import ColumnOwnerHeader from './ColumnOwnerHeader';

interface SlotData {
  position: number;
  character_id?: string | null;
  characters?: Character | null;
}

interface ScheduleBoardProps {
  scheduleId: string;
  initialSlots: SlotData[];
  initialColumnOwners: (string | null)[];
  allCharacters: Character[];
  allAdventures: Adventure[];
}

const PARTY_SIZE = 4;

function getInitialPartyBases(slots: SlotData[]): number[] {
  if (slots.length === 0) return [0];
  const maxPos = Math.max(...slots.map((s) => s.position));
  const count = Math.floor(maxPos / PARTY_SIZE) + 1;
  return Array.from({ length: count }, (_, i) => i * PARTY_SIZE);
}

export default function ScheduleBoard({
  scheduleId,
  initialSlots,
  initialColumnOwners,
  allCharacters,
  allAdventures,
}: ScheduleBoardProps) {
  const [partyBases, setPartyBases] = useState<number[]>(() => getInitialPartyBases(initialSlots));
  const [nextBase, setNextBase] = useState<number>(() => getInitialPartyBases(initialSlots).length * PARTY_SIZE);
  const [slots, setSlots] = useState<SlotData[]>(initialSlots);
  const [columnOwners, setColumnOwners] = useState<(string | null)[]>(initialColumnOwners);
  const [loadingPosition, setLoadingPosition] = useState<number | null>(null);
  const [isSavingOwners, setIsSavingOwners] = useState(false);

  const handleAssign = useCallback(
    async (position: number, characterId: string | null) => {
      setLoadingPosition(position);
      const selectedChar = allCharacters.find((c) => c.id === characterId);

      try {
        if (!characterId) {
          await supabase
            .from('schedule_slots')
            .delete()
            .match({ schedule_id: scheduleId, position });

          setSlots((prev) => prev.filter((s) => s.position !== position));
        } else {
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

          setSlots((prev) => [...prev.filter((s) => s.position !== position), data]);
        }
      } catch (err: any) {
        alert(`Error updating slot: ${err.message}`);
      } finally {
        setLoadingPosition(null);
      }
    },
    [scheduleId, allCharacters]
  );

  const handleColumnOwnerChange = useCallback(
    async (colIndex: number, adventureId: string | null) => {
      const next = columnOwners.map((v, i) => (i === colIndex ? adventureId : v));
      setColumnOwners(next);
      setIsSavingOwners(true);

      try {
        const { error } = await supabase
          .from('schedules')
          .update({ column_owners: next })
          .eq('id', scheduleId);

        if (error) throw new Error(error.message);
      } catch (err: any) {
        alert(`Error saving column assignment: ${err.message}`);
        setColumnOwners(columnOwners);
      } finally {
        setIsSavingOwners(false);
      }
    },
    [scheduleId, columnOwners]
  );

  const addParty = () => {
    setPartyBases((prev) => [...prev, nextBase]);
    setNextBase((prev) => prev + PARTY_SIZE);
  };

  const removeParty = useCallback(
    async (base: number) => {
      const positions = Array.from({ length: PARTY_SIZE }, (_, i) => base + i);

      try {
        await supabase
          .from('schedule_slots')
          .delete()
          .eq('schedule_id', scheduleId)
          .in('position', positions);

        setSlots((prev) => prev.filter((s) => !positions.includes(s.position)));
        setPartyBases((prev) => prev.filter((b) => b !== base));
      } catch (err: any) {
        alert(`Error removing party: ${err.message}`);
      }
    },
    [scheduleId]
  );

  const assignedCharacterIds = new Set(
    slots.map((s) => s.character_id).filter(Boolean) as string[]
  );

  return (
    <div className="mt-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-blue-800 border-b pb-2">Raid Party Configuration</h2>

      <ColumnOwnerHeader
        columnOwners={columnOwners}
        allAdventures={allAdventures}
        onOwnerChange={handleColumnOwnerChange}
        isSaving={isSavingOwners}
      />

      {partyBases.map((base, partyIndex) => {
        const partySlots: SlotData[] = Array.from({ length: PARTY_SIZE }, (_, i) => {
          const pos = base + i;
          return (
            slots.find((s) => s.position === pos) ?? {
              position: pos,
              character_id: null,
              characters: null,
            }
          );
        });

        return (
          <PartyRow
            key={base}
            partyIndex={partyIndex}
            slots={partySlots}
            columnOwners={columnOwners}
            allCharacters={allCharacters}
            assignedCharacterIds={assignedCharacterIds}
            onAssign={handleAssign}
            onRemove={() => removeParty(base)}
            loadingPosition={loadingPosition}
          />
        );
      })}

      <button
        onClick={addParty}
        className="w-full py-4 text-2xl text-gray-400 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:text-gray-600 transition"
        aria-label="Add party"
      >
        +
      </button>
    </div>
  );
}
