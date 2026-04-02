export interface EquipmentSlot {
  slotId: string;
  slotName: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
  setItemId?: string;
  setItemName?: string;
  reinforce?: number;
  amplificationName?: string | null;
}

export interface StatusEntry {
  name: string;
  value: number;
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
