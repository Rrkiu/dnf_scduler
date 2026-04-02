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

export async function fetchCharacterEquipment(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<EquipmentSlot[]> {
  const url = `https://api.neople.co.kr/df/servers/${serverId}/characters/${characterId}/equip/equipment?apikey=${apiKey}`;
  console.log('[equipment] serverId:', serverId, 'characterId:', characterId, 'url:', url);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.log('[equipment] error body:', body);
    throw new Error(`Equipment API ${res.status}`);
  }
  const data = await res.json();
  console.log('[equipment] slots:', JSON.stringify(
    (data?.equipment ?? []).map((e: any) => ({ slot: e.slotName, item: e.itemName, rarity: e.itemRarity, set: e.setItemName })),
    null, 2
  ));
  return data?.equipment ?? [];
}

export async function fetchCharacterOath(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<any> {
  const url = `https://api.neople.co.kr/df/servers/${serverId}/characters/${characterId}/equip/oath?apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Oath API ${res.status}`);
  const data = await res.json();
  return data?.oath ?? null;
}

export async function fetchCharacterStatus(
  serverId: string,
  characterId: string,
  apiKey: string
): Promise<StatusEntry[]> {
  const url = `https://api.neople.co.kr/df/servers/${serverId}/characters/${characterId}/status?apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Status API ${res.status}`);
  const data = await res.json();
  return data?.status ?? [];
}
