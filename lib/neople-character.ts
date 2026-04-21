export interface EquipmentSlot {
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

export interface StatusEntry {
  name: string;
  value: number;
}

export interface AvatarEmblem {
  slotColor: string;  // 붉은빛 | 노란빛 | 녹색빛 | 푸른빛 | 플래티넘
  itemName: string;
  itemId?: string;
}

export interface AvatarClone {
  itemId: string;
  itemName: string;
}

export interface AvatarSlot {
  slotId: string;
  slotName: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
  optionAbility?: string | null;  // 단순 문자열: "뇌신의 기운 스킬Lv +1" 또는 "지능 +55" 등
  clone?: AvatarClone | null;
  emblems: AvatarEmblem[];
}

export interface CreatureArtifact {
  slotColor: string;  // RED | BLUE | GREEN (또는 붉은빛 | 푸른빛 | 녹색빛)
  itemId: string;
  itemName: string;
  itemRarity: string;
}

export interface CreatureData {
  itemId: string;
  itemName: string;
  itemRarity?: string;
  artifact: CreatureArtifact[];
}

function neopleUrl(serverId: string, characterId: string, path: string, apiKey: string): string {
  return `https://api.neople.co.kr/df/servers/${encodeURIComponent(serverId)}/characters/${encodeURIComponent(characterId)}/${path}?apikey=${encodeURIComponent(apiKey)}`;
}

export async function fetchCharacterEquipment(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<EquipmentSlot[]> {
  const url = neopleUrl(serverId, characterId, 'equip/equipment', apiKey);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[equipment] 401/error serverId:', serverId, 'characterId:', characterId, 'body:', body);
    throw new Error(`Equipment API ${res.status}`);
  }
  const data = await res.json();
  return data?.equipment ?? [];
}

export async function fetchCharacterOath(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<any> {
  const url = neopleUrl(serverId, characterId, 'equip/oath', apiKey);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[oath] 401/error serverId:', serverId, 'characterId:', characterId, 'body:', body);
    throw new Error(`Oath API ${res.status}`);
  }
  const data = await res.json();
  return data?.oath ?? null;
}

export async function fetchCharacterStatus(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<StatusEntry[]> {
  const url = neopleUrl(serverId, characterId, 'status', apiKey);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[status] 401/error serverId:', serverId, 'characterId:', characterId, 'body:', body);
    throw new Error(`Status API ${res.status}`);
  }
  const data = await res.json();
  return data?.status ?? [];
}

export async function fetchCharacterAvatar(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<AvatarSlot[]> {
  const url = neopleUrl(serverId, characterId, 'equip/avatar', apiKey);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[avatar] error serverId:', serverId, 'characterId:', characterId, 'body:', body);
    throw new Error(`Avatar API ${res.status}`);
  }
  const data = await res.json();
  // API returns { avatar: [...] }
  const raw: any[] = data?.avatar ?? [];

  return raw.map((slot: any) => ({
    slotId:        slot.slotId        ?? '',
    slotName:      slot.slotName      ?? '',
    itemId:        slot.itemId        ?? '',
    itemName:      slot.itemName      ?? '',
    itemRarity:    slot.itemRarity    ?? '',
    optionAbility: typeof slot.optionAbility === 'string' ? slot.optionAbility : null,
    clone:         slot.clone         ?? null,
    emblems:       Array.isArray(slot.emblems) ? slot.emblems : [],
  }));
}

export async function fetchCharacterCreature(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<CreatureData | null> {
  const url = neopleUrl(serverId, characterId, 'equip/creature', apiKey);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[creature] error serverId:', serverId, 'characterId:', characterId, 'body:', body);
    throw new Error(`Creature API ${res.status}`);
  }
  const data = await res.json();
  const c = data?.creature;
  if (!c || !c.itemId) return null;
  return {
    itemId:    c.itemId   ?? '',
    itemName:  c.itemName ?? '',
    itemRarity: c.itemRarity ?? '',
    artifact: Array.isArray(c.artifact) ? c.artifact : [],
  };
}

