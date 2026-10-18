/**
 * Standard Levenshtein distance — O(n*m), fine for short name strings.
 */
export function levenshtein(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0]![j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }
  return matrix[s1.length]![s2.length]!;
}

/**
 * Scores a candidate against an incoming beneficiary record.
 * Returns 0–1, higher = more likely duplicate.
 */
export function scoreDuplicateMatch(
  existing: {
    fullName: string;
    phone?: string | null;
    nationalId?: string | null;
    region?: string | null;
    woreda?: string | null;
  },
  incoming: {
    fullName: string;
    phone?: string | null;
    nationalId?: string | null;
    region?: string | null;
    woreda?: string | null;
  }
): { score: number; reasons: string[] } {
  const _reasons: string[] = [];

  // National ID exact
  if (existing.nationalId && incoming.nationalId && existing.nationalId === incoming.nationalId) {
    return { score: 1.0, reasons: ['national_id_exact'] };
  }

  // Phone exact
  if (existing.phone && incoming.phone && existing.phone === incoming.phone) {
    return { score: 0.95, reasons: ['phone_exact'] };
  }

  const nameDistance = levenshtein(existing.fullName, incoming.fullName);
  const sameWoreda = existing.woreda && incoming.woreda && existing.woreda === incoming.woreda;
  const sameRegion = existing.region && incoming.region && existing.region === incoming.region;

  // Name exact + same woreda
  if (nameDistance === 0 && sameWoreda) {
    return { score: 0.9, reasons: ['name_exact', 'same_woreda'] };
  }

  // Name close + same woreda
  if (nameDistance <= 2 && sameWoreda) {
    return { score: 0.75, reasons: [`name_distance_${nameDistance}`, 'same_woreda'] };
  }

  // Name close + same region
  if (nameDistance <= 2 && sameRegion) {
    return { score: 0.65, reasons: [`name_distance_${nameDistance}`, 'same_region'] };
  }

  // Name very close (typos) + phone last 4 match
  const existingPhoneTail = existing.phone?.slice(-4);
  const incomingPhoneTail = incoming.phone?.slice(-4);
  if (nameDistance <= 3 && existingPhoneTail && existingPhoneTail === incomingPhoneTail) {
    return { score: 0.6, reasons: [`name_distance_${nameDistance}`, 'phone_suffix_match'] };
  }

  return { score: 0, reasons: [] };
}