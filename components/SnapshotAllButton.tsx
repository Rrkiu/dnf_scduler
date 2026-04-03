'use client';

import { useState } from 'react';
import { Character } from '@/types';

interface Props {
  characters: Character[];
}

type State = 'idle' | 'running' | 'done';

export default function SnapshotAllButton({ characters }: Props) {
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(0);

  const handleClick = async () => {
    if (state === 'running') return;
    setState('running');
    setProgress(0);
    setFailed(0);

    let failCount = 0;
    for (let i = 0; i < characters.length; i++) {
      try {
        const res = await fetch('/api/character-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: characters[i].id }),
        });
        if (!res.ok) failCount++;
      } catch {
        failCount++;
      }
      setProgress(i + 1);
    }

    setFailed(failCount);
    setState('done');
    setTimeout(() => setState('idle'), 3000);
  };

  if (state === 'running') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>{progress} / {characters.length} 갱신 중...</span>
      </div>
    );
  }

  if (state === 'done') {
    const success = characters.length - failed;
    return (
      <span className="text-sm text-green-600 dark:text-green-400">
        완료 ({success}/{characters.length}{failed > 0 ? `, 실패 ${failed}` : ''})
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
      전체 스냅샷 갱신
    </button>
  );
}
