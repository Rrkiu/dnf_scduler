'use client';

import { useState, useTransition } from 'react';

interface EquipmentSlot {
  slotId: string;
  slotName: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
  setItemId?: string;
  setItemName?: string;
  reinforce?: number;
  refine?: number;
  amplificationName?: string | null;
}

interface StatusEntry {
  name: string;
  value: number;
}

interface OathCrystal {
  slotNo: number;
  itemName: string;
  itemRarity: string;
  tune: { level: number; setPoint: number };
}

interface OathData {
  info: { itemName: string; itemRarity: string; setPoint: number };
  crystal: OathCrystal[];
  setInfo: {
    setName: string;
    setOptionName: string;
    setRarityName: string;
    active: {
      status: Array<{ key: string; value: string | number }>;
      setPoint: { current: number; min: number; max: number };
    };
  };
  blessing: {
    status: Array<{ key: string; value: string | number }>;
  };
}

interface AvatarEmblem {
  slotColor: string;
  itemName: string;
  itemId?: string;
}

interface AvatarSlot {
  slotId: string;
  slotName: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
  optionAbility?: string | null;  // e.g. "뇌신의 기운 스킬Lv +1" or "지능 +55"
  clone?: { itemId: string; itemName: string } | null;
  emblems: AvatarEmblem[];
}

interface CreatureArtifact {
  slotColor: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
}

interface CreatureData {
  itemId: string;
  itemName: string;
  itemRarity?: string;
  artifact: CreatureArtifact[];
}

interface Snapshot {
  snapshot_at: string;
  equipment: EquipmentSlot[] | null;
  oath: OathData | null;
  status: StatusEntry[] | null;
  relic_count: number;
  epic_count: number;
  set_names: string[];
  avatar: AvatarSlot[] | null;
  creature: CreatureData | null;
}

interface CharacterDetailProps {
  characterId: string;
  hasNeopleId: boolean;
  initialSnapshot: Snapshot | null;
}

const ITEM_NAME_COLOR: Record<string, string> = {
  '레어':     'text-purple-600 dark:text-purple-400',
  '유니크':   'text-pink-500 dark:text-pink-400',
  '레전더리': 'text-amber-700 dark:text-amber-500',
  '에픽':     'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-transparent rounded-sm px-0.5',
  '태초':     'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-transparent rounded-sm px-0.5',
};

function getRarityColor(name: string): string {
  for (const rarity of ['태초', '에픽', '레전더리', '유니크', '레어']) {
    if (name.includes(rarity)) return ITEM_NAME_COLOR[rarity] ?? '';
  }
  return 'text-gray-500 dark:text-gray-400';
}

const RARITY_STYLE: Record<string, string> = {
  '태초': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  '에픽': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  '유니크': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  '레어': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const KEY_STATS = [
  '힘', '지능', '체력', '정신력',
  '물리 공격', '마법 공격', '독립 공격',
  '물리 크리티컬', '마법 크리티컬',
  '쿨타임 감소',
  '공격 속도', '이동 속도', '캐스팅 속도',
  '물리 방어', '마법 방어',
];

type Tab = 'equipment' | 'oath' | 'status' | 'avatar';

export default function CharacterDetail({ characterId, hasNeopleId, initialSnapshot }: CharacterDetailProps) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<Tab>('equipment');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/character-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? '갱신 실패');
        setSnapshot(json.snapshot);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'equipment', label: '장비 세트' },
    { key: 'oath',      label: '서약' },
    { key: 'status',    label: '주요 스텟' },
    { key: 'avatar',    label: '아바타 & 크리쳐' },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl">
      {/* 탭 헤더 */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {hasNeopleId && (
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="mr-3 px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isPending ? '갱신 중...' : '갱신'}
          </button>
        )}
      </div>

      {/* 탭 내용 */}
      <div className="p-4">
        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        {!snapshot ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 italic py-6">
            {hasNeopleId ? '갱신 버튼을 눌러 데이터를 불러오세요.' : 'Neople ID가 등록되지 않은 캐릭터입니다.'}
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-right">
              스냅샷: {new Date(new Date(snapshot.snapshot_at).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ')}
            </p>

            {activeTab === 'equipment' && (
              <EquipmentTab equipment={snapshot.equipment ?? []} />
            )}
            {activeTab === 'oath' && (
              <OathTab oath={snapshot.oath} />
            )}
            {activeTab === 'status' && (
              <StatusTab status={snapshot.status ?? []} />
            )}
            {activeTab === 'avatar' && (
              <AvatarCreatureTab
                avatar={snapshot.avatar ?? []}
                creature={snapshot.creature ?? null}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EquipmentTab({ equipment }: { equipment: EquipmentSlot[] }) {
  if (!equipment.length) return <Empty />;

  // 세트명 기준으로 그룹핑
  const grouped: Record<string, EquipmentSlot[]> = {};
  for (const slot of equipment) {
    const key = slot.setItemName ?? '없음';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(slot);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([setName, slots]) => (
        <div key={setName}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            {setName === '없음' ? '세트 없음' : `${setName} (${slots.length})`}
          </div>
          <div className="space-y-1">
            {slots.map(slot => (
              <div key={slot.slotId} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500 w-16 shrink-0 text-xs">{slot.slotName}</span>
                <span className="w-24 shrink-0 text-xs font-bold flex items-center gap-1">
                  {slot.amplificationName ? (
                    <span className="text-fuchsia-400">+{slot.reinforce ?? 0}</span>
                  ) : slot.reinforce && slot.reinforce > 0 ? (
                    <span className="text-sky-400">+{slot.reinforce}</span>
                  ) : null}
                  {slot.slotId === 'WEAPON' && slot.refine && slot.refine > 0 && (
                    <span className="text-gray-400 dark:text-gray-500">({slot.refine})</span>
                  )}
                </span>
                <span className={`truncate flex-1 ${ITEM_NAME_COLOR[slot.itemRarity] ?? 'text-gray-900 dark:text-gray-100'}`}>{slot.itemName}</span>
                <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${ITEM_NAME_COLOR[slot.itemRarity] ?? 'text-gray-500'}`}>
                  {slot.itemRarity}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusTab({ status }: { status: StatusEntry[] }) {
  const filtered = status.filter(s => KEY_STATS.includes(s.name));
  if (!filtered.length) return <Empty />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filtered.map(s => (
        <div key={s.name} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.name}</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {s.value.toLocaleString('en-US')}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotsTab({ equipment, relicCount, epicCount, setNames }: {
  equipment: EquipmentSlot[];
  relicCount: number;
  epicCount: number;
  setNames: string[];
}) {
  return (
    <div className="space-y-5">
      {/* 희귀도 요약 */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">태초</div>
          <div className="text-xl font-bold text-cyan-700 dark:text-cyan-300">{relicCount}</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">에픽</div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-300">{epicCount}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">기타</div>
          <div className="text-xl font-bold text-gray-700 dark:text-gray-300">{equipment.length - relicCount - epicCount}</div>
        </div>
      </div>

      {/* 부위별 희귀도 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">부위별 현황</div>
        <div className="space-y-1">
          {equipment.map(slot => (
            <div key={slot.slotId} className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 dark:text-gray-500 w-16 shrink-0 text-xs">{slot.slotName}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className={`h-full rounded-full ${
                  slot.itemRarity === '태초' ? 'bg-cyan-400' :
                  slot.itemRarity === '에픽' ? 'bg-orange-400' :
                  slot.itemRarity === '유니크' ? 'bg-yellow-400' : 'bg-gray-300'
                }`} style={{ width: '100%' }} />
              </div>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${RARITY_STYLE[slot.itemRarity] ?? 'bg-gray-100 text-gray-500'}`}>
                {slot.itemRarity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 세트 구성 */}
      {setNames.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">보유 세트</div>
          <div className="flex flex-wrap gap-2">
            {setNames.map(name => (
              <span key={name} className="px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OathTab({ oath }: { oath: OathData | null }) {
  if (!oath) return <Empty />;

  return (
    <div className="space-y-5">
      {/* 1. 서약 세트 정보 */}
      {oath.setInfo && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${getRarityColor(oath.setInfo.setRarityName)}`}>{oath.setInfo.setName}</span>
            <span className={`text-xs font-semibold ${getRarityColor(oath.setInfo.setRarityName)}`}>{oath.setInfo.setRarityName}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            세트 포인트: <span className={`font-semibold ${getRarityColor(oath.setInfo.setRarityName)}`}>{oath.setInfo.active.setPoint.current}</span> / {oath.setInfo.active.setPoint.max}
          </div>
          <div className="flex flex-wrap gap-2">
            {(oath.setInfo.active.status ?? []).map((s, i) => (
              <span key={i} className="text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded">
                {s.key}: {s.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. 장착 서약 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">장착 서약</div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`font-semibold ${ITEM_NAME_COLOR[oath.info.itemRarity] ?? 'text-gray-900 dark:text-gray-100'}`}>{oath.info.itemName}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ITEM_NAME_COLOR[oath.info.itemRarity] ?? 'text-gray-500'}`}>
            {oath.info.itemRarity}
          </span>
        </div>
        {oath.blessing && (
          <div className="flex flex-wrap gap-2">
            {oath.blessing.status.map((s, i) => (
              <span key={i} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                {s.key}: {s.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. 장착 결정 */}
      {oath.crystal?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">장착 결정 ({oath.crystal.length})</div>
          <div className="space-y-1">
            {oath.crystal.map((c) => (
              <div key={c.slotNo} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500 w-6 shrink-0 text-xs">{c.slotNo}</span>
                <span className={`truncate ${ITEM_NAME_COLOR[c.itemRarity] ?? 'text-gray-900 dark:text-gray-100'}`}>{c.itemName}</span>
                <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${ITEM_NAME_COLOR[c.itemRarity] ?? 'text-gray-500'}`}>
                  {c.itemRarity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarCreatureTab({ avatar, creature }: { avatar: AvatarSlot[]; creature: CreatureData | null }) {
  const EMBLEM_COLOR: Record<string, string> = {
    '붉은빛': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    '노란빛': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    '녹색빛': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    '푸른빛': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    '플래티넘': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  };

  const ARTIFACT_COLOR: Record<string, string> = {
    'RED':    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'BLUE':   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'GREEN':  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    '붉은빛': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    '푸른빛': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    '녹색빛': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };

  const hasAvatar = avatar && avatar.length > 0;
  const hasCreature = creature && creature.itemId;

  if (!hasAvatar && !hasCreature) return <Empty />;

  return (
    <div className="space-y-6">
      {/* ── 아바타 섹션 ── */}
      {hasAvatar && (
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            아바타
          </div>
          <div className="space-y-2">
            {avatar.map((slot) => {
              const isClone = !!slot.clone?.itemId;
              const showItemName = !isClone; // 클론이면 외형 아이템명 숨김

              return (
                <div
                  key={slot.slotId}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  {/* 슬롯명 + 착용 아이템 */}
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 w-16">
                      {slot.slotName}
                    </span>
                    <div className="flex-1 min-w-0">
                      {isClone ? (
                        // 클론 착용 시: 클론임을 표시, 외형명은 생략
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded">
                          클론 아바타
                        </span>
                      ) : showItemName && slot.itemName ? (
                        <span className={`text-sm font-medium truncate ${ITEM_NAME_COLOR[slot.itemRarity] ?? 'text-gray-800 dark:text-gray-200'}`}>
                          {slot.itemName}
                        </span>
                      ) : null}
                    </div>
                    {slot.itemRarity && (
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${ITEM_NAME_COLOR[slot.itemRarity] ?? 'text-gray-400'}`}>
                        {slot.itemRarity}
                      </span>
                    )}
                  </div>

                  {/* 아바타 옵션 (스킬Lv 포함 여부로 아이콘 분기) */}
                  {slot.optionAbility && (
                    <div className={`text-xs mb-2 ${
                      slot.optionAbility.includes('스킬Lv')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {slot.optionAbility.includes('스킬Lv') ? '🎯' : '⚡'} {slot.optionAbility}
                    </div>
                  )}
                  {/* 엠블렘 */}
                  {slot.emblems && slot.emblems.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {slot.emblems.map((em, i) => (
                        <span
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${EMBLEM_COLOR[em.slotColor] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                        >
                          {em.itemName || em.slotColor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 크리쳐 섹션 ── */}
      {hasCreature && (
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            크리쳐
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-sm font-semibold ${ITEM_NAME_COLOR[creature!.itemRarity ?? ''] ?? 'text-gray-900 dark:text-gray-100'}`}>
                {creature!.itemName}
              </span>
              {creature!.itemRarity && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ITEM_NAME_COLOR[creature!.itemRarity] ?? 'text-gray-400'}`}>
                  {creature!.itemRarity}
                </span>
              )}
            </div>

            {/* 아티팩트 */}
            {creature!.artifact && creature!.artifact.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">아티팩트</div>
                <div className="flex flex-wrap gap-1.5">
                  {creature!.artifact.map((art, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded font-medium ${ARTIFACT_COLOR[art.slotColor] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                      {art.itemName || art.slotColor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <p className="text-center text-sm text-gray-400 dark:text-gray-500 italic py-4">데이터 없음</p>;
}
