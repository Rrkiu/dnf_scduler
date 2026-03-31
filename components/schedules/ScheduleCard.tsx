'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ScheduleCardProps {
  id: string;
  name: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function ScheduleCard({ id, name, createdAt }: ScheduleCardProps) {
  const [deleted, setDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`"${name}" 스케줄을 삭제할까요?`)) return;

    setIsDeleting(true);
    const { error } = await supabase.from('schedules').delete().eq('id', id);

    if (error) {
      alert(`삭제 실패: ${error.message}`);
      setIsDeleting(false);
    } else {
      setDeleted(true);
    }
  };

  if (deleted) return null;

  return (
    <div className="relative group">
      <Link href={`/schedules/${id}`}>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block border border-gray-100">
          <h2 className="text-xl font-semibold mb-2 text-blue-600">{name}</h2>
          <div className="text-sm text-gray-500">
            Created at: {formatDate(createdAt)}
          </div>
        </div>
      </Link>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-sm font-bold disabled:opacity-50"
        aria-label="Delete schedule"
      >
        ✕
      </button>
    </div>
  );
}
