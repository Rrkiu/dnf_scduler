'use client';

import { useState } from 'react';
import { Adventure } from '@/types';

interface SyncButtonProps {
  adventures: Adventure[];
}

export default function SyncButton({ adventures }: SyncButtonProps) {
  const [newAdventureName, setNewAdventureName] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncAllProgress, setSyncAllProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const runSync = async (adventureName: string, id: string) => {
    setSyncingId(id);
    setMessage(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adventureName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync');

      setMessage({ text: `[${adventureName}] ${data.updatedCount}개 캐릭터 갱신 완료`, ok: true });
      window.location.reload();
    } catch (err: any) {
      setMessage({ text: `오류: ${err.message}`, ok: false });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingId('__all__');
    setSyncAllProgress(0);
    setMessage(null);

    let successCount = 0;
    let failNames: string[] = [];

    for (let i = 0; i < adventures.length; i++) {
      const adv = adventures[i];
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adventureName: adv.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        successCount++;
      } catch {
        failNames.push(adv.name);
      }
      setSyncAllProgress(i + 1);
    }

    setSyncingId(null);

    if (failNames.length === 0) {
      setMessage({ text: `전체 ${successCount}개 모험단 갱신 완료`, ok: true });
    } else {
      setMessage({ text: `${successCount}개 성공, 실패: ${failNames.join(', ')}`, ok: false });
    }

    window.location.reload();
  };

  const handleNewSync = async () => {
    const name = newAdventureName.trim();
    if (!name) {
      setMessage({ text: '모험단 이름을 입력해주세요.', ok: false });
      return;
    }
    await runSync(name, '__new__');
    setNewAdventureName('');
  };

  return (
    <div className="flex flex-col gap-5">

      {/* 등록된 모험단 갱신 */}
      {adventures.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">등록된 모험단</p>
            <button
              onClick={handleSyncAll}
              disabled={syncingId !== null}
              className="text-sm bg-gray-700 hover:bg-gray-800 text-white font-medium py-1 px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncingId === '__all__' ? `갱신 중... (${syncAllProgress}/${adventures.length})` : '전체 갱신'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {adventures.map((adv) => {
              const isSyncing = syncingId === adv.id;
              return (
                <div
                  key={adv.id}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                >
                  <span className="text-sm font-semibold text-gray-800">{adv.name}</span>
                  <button
                    onClick={() => runSync(adv.name, adv.id)}
                    disabled={syncingId !== null}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? '갱신 중...' : '갱신'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 새 모험단 추가 */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">새 모험단 추가</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="모험단 이름 입력"
            className="border border-gray-300 p-2 rounded w-64 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newAdventureName}
            onChange={(e) => setNewAdventureName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNewSync()}
            disabled={syncingId !== null}
          />
          <button
            onClick={handleNewSync}
            disabled={syncingId !== null}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingId === '__new__' ? '등록 중...' : '등록 및 동기화'}
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.ok ? 'text-green-600' : 'text-red-500'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
