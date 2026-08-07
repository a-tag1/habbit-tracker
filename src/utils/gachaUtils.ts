import type { OwnedCard, Rarity, CardMaster } from '../types';
import { CARDS_BY_RARITY } from './cardMaster';

// Rarity probabilities: N=60%, R=28%, SR=10%, SSR=2%
const RARITY_WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: 'N', weight: 60 },
  { rarity: 'R', weight: 28 },
  { rarity: 'SR', weight: 10 },
  { rarity: 'SSR', weight: 2 },
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

async function buildImageUrlHF(prompt: string, seed: number, token: string, model: string): Promise<string> {
  const fullPrompt = `${prompt}, masterpiece, anime style, trading card format`;
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: fullPrompt, parameters: { seed: seed % 2147483647 } }),
    }
  );
  if (!response.ok) throw new Error(`HF API ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('blob read failed'));
    reader.readAsDataURL(blob);
  });
}

export interface ImageConfig {
  provider: 'pollinations' | 'huggingface';
  hfToken?: string;
  hfModel?: string;
}

const DEFAULT_HF_MODEL = 'stabilityai/stable-diffusion-3-medium-diffusers';

async function resolveImageUrl(prompt: string, seed: number, config?: ImageConfig): Promise<string> {
  if (config?.provider === 'huggingface' && config.hfToken) {
    try {
      return await buildImageUrlHF(prompt, seed, config.hfToken, config.hfModel ?? DEFAULT_HF_MODEL);
    } catch {
      // HF失敗時はpollinationsへフォールバック
      return buildImageUrl(prompt, seed);
    }
  }
  return buildImageUrl(prompt, seed);
}

export interface GachaDraw {
  card: OwnedCard;
  isDuplicate: boolean;
  coinRefund: number;
}

function drawSingle(ownedMasterIds: Set<string>, rarity?: Rarity, ctx?: DrawContext): { master: { id: string; name: string; rarity: Rarity; prompt: string; cheerMessage: string }; seed: number; isDuplicate: boolean; coinRefund: number; seasonId?: string } {
  const r = rarity ?? pickRarity();
  const pool = ctx ? ctx.cardPool[r] : CARDS_BY_RARITY[r];
  // Guard: if rarity pool is empty, fall back to N
  const safePool = pool.length > 0 ? pool : (ctx ? ctx.cardPool['N'] : CARDS_BY_RARITY['N']);
  const master = safePool[Math.floor(Math.random() * safePool.length)];
  const seed = Math.floor(Math.random() * 1000000);
  const isDuplicate = ownedMasterIds.has(master.id);
  return { master, seed, isDuplicate, coinRefund: isDuplicate ? DUPLICATE_REFUND : 0, seasonId: ctx?.seasonId };
}

async function buildDraw(base: ReturnType<typeof drawSingle>, imageConfig?: ImageConfig): Promise<GachaDraw> {
  const { master, seed, isDuplicate, coinRefund, seasonId } = base;
  const imageUrl = await resolveImageUrl(master.prompt, seed, imageConfig);
  const card: OwnedCard = {
    userCardId: `uc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    cardMasterId: master.id,
    name: master.name,
    rarity: master.rarity,
    seed,
    imageUrl,
    cheerMessage: master.cheerMessage,
    obtainedAt: new Date().toISOString(),
    seasonId,
  };
  return { card, isDuplicate, coinRefund };
}

export async function drawCards(count: 1 | 10, ownedMasterIds: Set<string>, ctx?: DrawContext, imageConfig?: ImageConfig): Promise<GachaDraw[]> {
  if (count === 1) {
    return [await buildDraw(drawSingle(ownedMasterIds, undefined, ctx), imageConfig)];
  } else {
    // レアリティを先に確定（同期）してから画像生成を並列実行
    let hasHighRarity = false;
    const bases = Array.from({ length: 9 }, () => {
      const b = drawSingle(ownedMasterIds, undefined, ctx);
      if (b.master.rarity === 'SR' || b.master.rarity === 'SSR') hasHighRarity = true;
      return b;
    });
    bases.push(drawSingle(ownedMasterIds, hasHighRarity ? undefined : pickRarityGuaranteed(), ctx));
    return Promise.all(bases.map(b => buildDraw(b, imageConfig)));
  }
}

