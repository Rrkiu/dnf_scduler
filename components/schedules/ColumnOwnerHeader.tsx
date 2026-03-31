'use client';

import { Adventure } from '@/types';
import { COLUMN_COLORS } from './columnColors';

interface ColumnOwnerHeaderProps {
  columnOwners: (string | null)[];
  allAdventures: Adventure[];
  onOwnerChange: (colIndex: number, adventureId: string | null) => void;
  isSaving: boolean;
}

export default function ColumnOwnerHeader({
  columnOwners,
  allAdventures,
  onOwnerChange,
  isSaving,
}: ColumnOwnerHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">모험단 배정</h3>
        {isSaving && <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">저장 중...</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {columnOwners.map((adventureId, colIndex) => {
          const color = COLUMN_COLORS[colIndex];
          return (
            <div
              key={colIndex}
              className={`rounded-lg p-3 border-t-4 ${color.borderTop} ${color.bg}`}
            >
              <span className={`text-xs font-bold uppercase ${color.text} mb-2 block`}>
                Position {colIndex + 1}
              </span>
              <select
                className="w-full border border-gray-200 dark:border-gray-600 rounded-md p-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 dark:focus:ring-gray-500"
                value={adventureId || ''}
                onChange={(e) => onOwnerChange(colIndex, e.target.value || null)}
                disabled={isSaving}
              >
                <option value="">— 미할당 —</option>
                {allAdventures.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
