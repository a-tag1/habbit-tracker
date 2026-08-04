import type { OwnedCard, Rarity, CardMaster } from '../types';
import { CARDS_BY_RARITY } from './cardMaster';

// Rarity probabilities: N=60%, R=25%, SR=12%, SSR=3%
const RARITY_WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: 'N', weight: 60 },
  { rarity: 'R', weight: 25 },
  { rarity: 'SR', weight: 12 },
  { rarity: 'SSR', weight: 3 },
];
const TOTAL_WEIGHT = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);

export const GACHA_COST_SINGLE = 50;
export const GACHA_COST_MULTI = 450;
export const DUPLICATE_REFUND = 25;

export interface DrawContext {
  cardPool: Record<Rarity, CardMaster[]>;
  seasonId: string;
}

function pickRarity(): Rarity {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const { rarity, weight } of RARITY_WEIGHTS) {
    rand -= weight;
    if (rand <= 0) return rarity;
  }
  return 'N';
}

// For 10-pull, guarantee at least one SR+
function pickRarityGuaranteed(): Rarity {
  const rand = Math.random() * (RARITY_WEIGHTS[2].weight + RARITY_WEIGHTS[3].weight);
  return rand < RARITY_WEIGHTS[2].weight ? 'SR' : 'SSR';
}

export function buildImageUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(`${prompt}, masterpiece, anime style, trading card format`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=768&seed=${seed}&nologo=true`;
}

export interface GachaDraw {
  card: OwnedCard;
  isDuplicate: boolean;
  coinRefund: number;
}

function drawSingle(ownedMasterIds: Set<string>, rarity?: Rarity, ctx?: DrawContext): GachaDraw {
  const r = rarity ?? pickRarity();
  const pool = ctx ? ctx.cardPool[r] : CARDS_BY_RARITY[r];
  // Guard: if rarity pool is empty, fall back to N
  const safePool = pool.length > 0 ? pool : (ctx ? ctx.cardPool['N'] : CARDS_BY_RARITY['N']);
  const master = safePool[Math.floor(Math.random() * safePool.length)];
  const seed = Math.floor(Math.random() * 1000000);
  const isDuplicate = ownedMasterIds.has(master.id);

  const card: OwnedCard = {
    userCardId: `uc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    cardMasterId: master.id,
    name: master.name,
    rarity: master.rarity,
    seed,
    imageUrl: buildImageUrl(master.prompt, seed),
    cheerMessage: master.cheerMessage,
    obtainedAt: new Date().toISOString(),
    seasonId: ctx?.seasonId,
  };

  return {
    card,
    isDuplicate,
    coinRefund: isDuplicate ? DUPLICATE_REFUND : 0,
  };
}

export function drawCards(count: 1 | 10, ownedMasterIds: Set<string>, ctx?: DrawContext): GachaDraw[] {
  const results: GachaDraw[] = [];

  if (count === 1) {
    results.push(drawSingle(ownedMasterIds, undefined, ctx));
  } else {
    // 10-pull: guarantee one SR+ in the last slot
    let hasHighRarity = false;
    for (let i = 0; i < 9; i++) {
      const draw = drawSingle(ownedMasterIds, undefined, ctx);
      if (draw.card.rarity === 'SR' || draw.card.rarity === 'SSR') hasHighRarity = true;
      results.push(draw);
    }
    // Last card: guaranteed SR+ if none appeared
    const lastRarity = hasHighRarity ? undefined : pickRarityGuaranteed();
    results.push(drawSingle(ownedMasterIds, lastRarity, ctx));
  }

  return results;
}

