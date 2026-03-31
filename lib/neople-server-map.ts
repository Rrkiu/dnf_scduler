export const SERVER_MAP: Record<string, string> = {
  '카인': 'cain',
  '디레지에': 'diregie',
  '바칼': 'bakal',
  '안톤': 'anton',
  '프레이': 'prey',
  '시로코': 'siroco',
  '카시야스': 'casillas',
  '힐더': 'hilder',
};

export function toNeopleServerId(koreanName: string): string {
  return SERVER_MAP[koreanName.trim()] ?? koreanName;
}
