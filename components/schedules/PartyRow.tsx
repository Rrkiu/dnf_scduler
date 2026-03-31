'use client';

import { useState } from 'react';
import { Character } from '@/types';
import PartySlot from './PartySlot';
import PartySummary from './PartySummary';

interface SlotData {
  position: number;
  character_id?: string | null;
  characters?: Character | null;
}

interface PartyRowProps {
  partyIndex: number;
  slots: SlotData[];
  columnOwners: (string | null)[];
  allCharacters: Character[];
  assignedCharacterIds: Set<string>;
  onAssign: (position: number, characterId: string | null) => void;
  onRemove: () => void;
  loadingPosition: number | null;
}

export default function PartyRow({
  partyIndex,
  slots,
  columnOwners,
  allCharacters,
  assignedCharacterIds,
  onAssign,
  onRemove,
  loadingPosition,
}: PartyRowProps) {
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`rounded-xl p-4 shadow-sm cursor-pointer transition-colors duration-150 ${
        selected ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      onClick={() => setSelected((v) => !v)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-bold uppercase ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
          Party {partyIndex + 1}
        </h3>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition text-sm font-bold"
          aria-label="Remove party"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" onClick={(e) => e.stopPropagation()}>
        {slots.map((slot, i) => (
          <PartySlot
            key={slot.position}
            slotData={slot}
            colIndex={i}
            allCharacters={allCharacters}
            adventureId={columnOwners[i] ?? null}
            assignedCharacterIds={assignedCharacterIds}
            onAssign={onAssign}
            isLoading={loadingPosition === slot.position}
          />
        ))}
      </div>
      <PartySummary slots={slots} />
    </div>
  );
}
