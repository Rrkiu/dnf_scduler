import { Character } from '@/types';

interface SlotWithChar {
  characters?: Character | null;
}

interface PartySummaryProps {
  slots: SlotWithChar[];
}

export default function PartySummary({ slots }: PartySummaryProps) {
  const dealerSlots = slots.filter(s => s.characters?.role === 'dealer');
  const bufferSlots = slots.filter(s => s.characters?.role === 'buffer');

  const totalDamage = dealerSlots.reduce((sum, s) => sum + (s.characters?.damage || 0), 0);
  const totalBuff = bufferSlots.reduce((sum, s) => sum + (s.characters?.buff_power || 0), 0);

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-600">
      <span>
        <span className="font-medium text-red-600">Dealers</span>: {dealerSlots.length} &mdash; Dmg: {totalDamage.toFixed(1)}
      </span>
      <span>
        <span className="font-medium text-blue-600">Buffers</span>: {bufferSlots.length} &mdash; B.Pow: {totalBuff.toLocaleString()}
      </span>
    </div>
  );
}
