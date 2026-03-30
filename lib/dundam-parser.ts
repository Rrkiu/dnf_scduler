// lib/dundam-parser.ts

export type ParsedCharacter = {
  adventureName: string;
  server: string;
  characterName: string;
  job: string;
  role: 'dealer' | 'buffer';
  fame: number;
  damage: number;
  buffPower: number;
  key?: string;
};

// Normalize damage based on GAS script logic
function normalizeDamage(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  const t = raw.toString().replace(/\s+/g, '').replace(/,/g, '');

  // Regex patterns from GAS script
  const eokManMatch = t.match(/^(\d+)억(?:(\d+)만)?$/);
  if (eokManMatch) {
    const eok = parseInt(eokManMatch[1], 10) || 0;
    const man = parseInt(eokManMatch[2] || '0', 10) || 0;
    return eok + man / 10000;
  }

  const manMatch = t.match(/^(\d+)만$/);
  if (manMatch) {
    const man = parseInt(manMatch[1], 10) || 0;
    return man / 10000;
  }

  if (/^\d+(\.\d+)?$/.test(t)) {
    if (t.includes('.')) return Number(t);
    return Number(t) / 10000;
  }

  return 0;
}

export async function fetchDundamSearch(name: string): Promise<ParsedCharacter[]> {
  const url = `https://dundam.xyz/dat//searchData.jsp?name=${encodeURIComponent(name)}&server=adven`;
  const res = await fetch(url, {
    method: 'POST',
    body: '{}',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Next.js App)',
      'Origin': 'https://dundam.xyz',
      'Referer': `https://dundam.xyz/search?server=adven&name=${encodeURIComponent(name)}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from Dundam: ${res.status}`);
  }

  // Dundam might return malformed JSON hidden in HTML sometimes according to the GAS script plan, 
  // but normally it should be JSON.
  let text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    // Attempt fallback json parser from GAS
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      json = JSON.parse(text.slice(start, end + 1));
    } else {
      throw err;
    }
  }

  const chars = Array.isArray(json?.characters) ? json.characters : [];

  return chars.map((o: any) => {
    // Determine role (simplified logic based on typical buffScore vs damage structure)
    // Characters with a buff score are usually buffers. Others are dealers.
    const buffScoreRaw = (o.buffScore || '').toString().replace(/[^0-9]/g, '');
    const buffPower = parseInt(buffScoreRaw, 10) || 0;
    
    // In DNF usually Crusader(M/F), Enchantress, Muse are buffers
    // This could also be refined via looking at `o.job` or checking if buffPower > 0
    const knownBufferJobs = ['크루세이더(남)', '크루세이더(여)', '인챈트리스', '뮤즈'];
    const role = knownBufferJobs.includes(o.job) || buffPower > 0 ? 'buffer' : 'dealer';

    return {
      adventureName: o.adventrueName || '', // Handle typical typo from Dundam API
      server: o.server || '',
      characterName: o.name || '',
      job: o.job || '',
      role,
      fame: parseInt((o.fame || '').toString(), 10) || 0,
      damage: normalizeDamage(o.ozma || ''),
      buffPower,
      key: o.key || o.id || ''
    };
  });
}

export async function triggerDundamRefresh(characters: ParsedCharacter[]): Promise<{ ok: number; fail: number }> {
  let ok = 0, fail = 0;
  const BATCH_SIZE = 3; // 3개씩 묶어서 동시에 던담을 찌름 (시간 최적화)

  for (let i = 0; i < characters.length; i += BATCH_SIZE) {
    const batch = characters.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (c) => {
        const server = (c.server || '').trim();
        const key = (c.key || '').trim();

        if (!server || !key) {
          fail++;
          return;
        }

        try {
          const url = `https://dundam.xyz/dat/viewData.jsp?image=${encodeURIComponent(key)}&server=${encodeURIComponent(server)}&`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Next.js App)',
              'Origin': 'https://dundam.xyz',
              'Referer': `https://dundam.xyz/character?server=${encodeURIComponent(server)}&key=${encodeURIComponent(key)}`
            },
            body: '{}'
          });

          if (res.ok) ok++;
          else fail++;
        } catch (err) {
          fail++;
        }
      })
    );

    // 각 병렬 그룹 사이에 짧은 대기 (IP 밴 방지용)
    if (i + BATCH_SIZE < characters.length) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  return { ok, fail };
}

