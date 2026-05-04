'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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
  const [currentName, setCurrentName] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`"${currentName}" 스케줄을 삭제할까요?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || '삭제 실패');
      }
      setDeleted(true);
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
      setIsDeleting(false);
    }
  };

  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(currentName);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(currentName);
  };

  const saveEdit = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === currentName) {
      cancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || '이름 변경 실패');
      }
      setCurrentName(trimmed);
      setIsEditing(false);
    } catch (err: any) {
      alert(`이름 변경 실패: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  if (deleted) return null;

  return (
    <div className="relative group">
      <Link href={`/schedules/${id}`}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block border border-gray-100 dark:border-gray-700">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="flex-1 text-xl font-semibold text-blue-600 dark:text-blue-400 bg-transparent border-b-2 border-blue-400 focus:outline-none min-w-0"
              />
              <button
                onClick={saveEdit}
                disabled={isSaving}
                className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 shrink-0"
              >
                저장
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 shrink-0"
              >
                취소
              </button>
            </div>
          ) : (
            <h2 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">{currentName}</h2>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Created at: {formatDate(createdAt)}
          </div>
        </div>
      </Link>

      {!isEditing && (
        <button
          onClick={startEdit}
          className="absolute top-2 right-9 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition text-sm"
          aria-label="Rename schedule"
        >
          ✎
        </button>
      )}

      {!isEditing && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-sm font-bold disabled:opacity-50"
          aria-label="Delete schedule"
        >
          ✕
        </button>
      )}
    </div>
  );
}
