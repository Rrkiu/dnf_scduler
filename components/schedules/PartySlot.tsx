'use client';

import { Character } from '@/types';
import { COLUMN_COLORS } from './columnColors';

interface SlotData {
  position: number;
  character_id?: string | null;
  characters?: Character | null;
}

interface PartySlotProps {
  slotData: SlotData;
  colIndex: number;
  allCharacters: Character[];
  adventureId: string | null;
  assignedCharacterIds: Set<string>;
  onAssign: (position: number, characterId: string | null) => void;
  isLoading: boolean;
}

export default function PartySlot({
  slotData,
  colIndex,
  allCharacters,
  adventureId,
  assignedCharacterIds,
  onAssign,
  isLoading,
}: PartySlotProps) {
  const { position, character_id, characters: assignedChar } = slotData;
  const color = COLUMN_COLORS[colIndex];

  const availableCharacters = adventureId
    ? allCharacters.filter(
        (c) =>
          c.adventure_id === adventureId &&
          (!assignedCharacterIds.has(c.id) || c.id === character_id)
      )
    : [];

  const isUnassignedColumn = !adventureId;

  return (
    <div
      className={`border-t-4 ${color.borderTop} ${color.bg} border border-gray-200 dark:border-gray-600 rounded-lg p-2 md:p-3 flex flex-col items-center hover:shadow-sm transition`}
    >
      <span className={`text-xs font-bold uppercase mb-2 px-2 py-0.5 rounded-full ${color.badge}`}>
        P{(position % 4) + 1}
      </span>

      {isLoading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-2">Updating...</div>
      ) : isUnassignedColumn ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500 italic text-center">모험단 미배정</span>
        </div>
      ) : (
        <select
          className={`w-full border border-gray-200 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 ${
            !character_id ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100 font-medium'
          }`}
          value={character_id || ''}
          onChange={(e) => onAssign(position, e.target.value || null)}
        >
          <option value="">캐릭터 선택</option>
          {availableCharacters.map((char) => (
            <option key={char.id} value={char.id}>
              [{char.role === 'buffer' ? 'B' : 'D'}] {char.character_name}{' '}
              {char.role === 'dealer'
                ? `(${char.damage.toFixed(1)})`
                : `(${char.buff_power.toLocaleString('en-US')})`}
            </option>
          ))}
        </select>
      )}

      <div className="mt-1 md:mt-2 text-xs w-full text-center flex flex-col items-center justify-center gap-1">
        {assignedChar ? (
          <>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{assignedChar.job}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                assignedChar.role === 'dealer'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {assignedChar.role === 'dealer' ? 'Dealer' : 'Buffer'}
            </span>
          </>
        ) : !isUnassignedColumn ? (
          <span className="text-gray-400 dark:text-gray-500 italic">Empty</span>
        ) : null}
      </div>
    </div>
  );
}
