import type { OwnedCard, Rarity, CardMaster } from '../types';
import { CARDS_BY_RARITY } from './cardMaster';

// Rarity probabilities: N=50%, R=30%, SR=15%, SSR=5%
const RARITY_WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: 'N', weight: 50 },
  { rarity: 'R', weight: 30 },
  { rarity: 'SR', weight: 15 },
  { rarity: 'SSR', weight: 5 },
];
const TOTAL_WEIGHT = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);

export const GACHA_COST_SINGLE = 50;
export const GACHA_COST_FOCUSED = 200;
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

// --------------------------------------------------------------------------
// Cloudflare Workers AI 用の画像生成処理（Workerプロキシ経由）
// --------------------------------------------------------------------------
async function buildImageUrlCF(
  prompt: string,
  seed: number,
  workerUrl: string,
  model: string
): Promise<string> {
  const fullPrompt = `${prompt}, masterpiece, anime style, trading card format`;

  const PROXY_URL = workerUrl;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      seed: seed % 2147483647,
      model: model, // モデル名も必要に応じて Worker へ引き継ぐ
      width: 512,
      height: 768,
    }),
  });

  if (!response.ok) throw new Error(`Cloudflare Worker API Error: ${response.status}`);

  // 返ってきた画像バイナリを DataURL に変換
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('blob read failed'));
    reader.readAsDataURL(blob);
  });
}

interface AIHordeStatus {
  state?: 'requested' | 'processing' | 'done' | 'cancelled' | 'faulted';
  generations?: Array<{ img?: string }>;
}

async function buildImageUrlAIHorde(
  prompt: string,
  seed: number,
  apiKey: string,
  model: string,
): Promise<string> {
  const fullPrompt = `${prompt}, masterpiece, anime style, trading card format`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: apiKey || '0000000000',
    'Client-Agent': 'habit-tracker:1.0',
  };
  const submitResponse = await fetch('https://aihorde.net/api/v2/generate/async', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: fullPrompt,
      models: [model],
      params: {
        width: 512,
        height: 768,
        steps: 25,
        n: 1,
        seed: String(seed % 2147483647),
        sampler_name: 'k_euler',
        cfg_scale: 7,
      },
    }),
  });
  if (!submitResponse.ok) throw new Error(`AI Horde submit ${submitResponse.status}`);

  const job = await submitResponse.json() as { id?: string };
  if (!job.id) throw new Error('AI Horde did not return a job id');

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    const statusResponse = await fetch(`https://aihorde.net/api/v2/generate/status/${job.id}`, { headers });
    if (!statusResponse.ok) throw new Error(`AI Horde status ${statusResponse.status}`);
    const status = await statusResponse.json() as AIHordeStatus;
    if (status.state === 'done') {
      const image = status.generations?.[0]?.img;
      if (!image) throw new Error('AI Horde returned no image');
      return image;
    }
    if (status.state === 'cancelled' || status.state === 'faulted') {
      throw new Error(`AI Horde generation ${status.state}`);
    }
  }

  throw new Error('AI Horde generation timed out');
}

// --------------------------------------------------------------------------
// ImageConfig 型の拡張
// --------------------------------------------------------------------------
export interface ImageConfig {
  provider: 'pollinations' | 'huggingface' | 'cloudflare' | 'aihorde';
  hfToken?: string;
  hfModel?: string;
  cfWorkerUrl?: string;
  cfModel?: string;
  aihordeKey?: string;
  aihordeModel?: string;
}

const DEFAULT_HF_MODEL = 'stabilityai/stable-diffusion-3-medium-diffusers';
// 高速かつ高品質な FLUX.1-schnell をデフォルトに設定（SDXL 等に変更も可能）
const DEFAULT_CF_MODEL = '@cf/black-forest-labs/flux-1-schnell';

async function resolveImageUrl(prompt: string, seed: number, config?: ImageConfig): Promise<{ url: string; generatedBy: GeneratedBy }> {
  // Hugging Face 選択時
  if (config?.provider === 'huggingface' && config.hfToken) {
    const model = config.hfModel ?? DEFAULT_HF_MODEL;
    try {
      const url = await buildImageUrlHF(prompt, seed, config.hfToken, model);
      return { url, generatedBy: { provider: 'Hugging Face', model } };
    } catch {
      // 失敗時は pollinations へフォールバック
      const url = buildImageUrl(prompt, seed);
      return { url, generatedBy: { provider: 'Pollinations.AI', model: 'flux' } };
    }
  }

  // Cloudflare 選択時
  if (config?.provider === 'cloudflare' && config.cfWorkerUrl) {
    const model = config.cfModel ?? DEFAULT_CF_MODEL;
    try {
      const url = await buildImageUrlCF(prompt, seed, config.cfWorkerUrl, model);
      return { url, generatedBy: { provider: 'CF Workers AI', model } };
    } catch {
      // 失敗時は pollinations へフォールバック
      const url = buildImageUrl(prompt, seed);
      return { url, generatedBy: { provider: 'Pollinations.AI', model: 'flux' } };
    }
  }

  // AI Horde選択時（無料・非同期キュー）
  if (config?.provider === 'aihorde') {
    const model = config.aihordeModel ?? 'Deliberate';
    try {
      const url = await buildImageUrlAIHorde(prompt, seed, config.aihordeKey ?? '0000000000', model);
      return { url, generatedBy: { provider: 'AI Horde', model } };
    } catch {
      const url = buildImageUrl(prompt, seed);
      return { url, generatedBy: { provider: 'Pollinations.AI', model: 'flux' } };
    }
  }

  // デフォルト / Pollinations 選択時
  const url = buildImageUrl(prompt, seed);
  return { url, generatedBy: { provider: 'Pollinations.AI', model: 'flux' } };
}

export interface GeneratedBy {
  provider: string;
  model: string;
}

export interface GachaDraw {
  card: OwnedCard;
  isDuplicate: boolean;
  coinRefund: number;
  generatedBy: GeneratedBy;
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
  const { url: imageUrl, generatedBy } = await resolveImageUrl(master.prompt, seed, imageConfig);
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
  return { card, isDuplicate, coinRefund, generatedBy };
}

export async function drawCards(ownedMasterIds: Set<string>, ctx?: DrawContext, imageConfig?: ImageConfig): Promise<GachaDraw[]> {
  return [await buildDraw(drawSingle(ownedMasterIds, undefined, ctx), imageConfig)];
}

const FOCUSED_UNOWNED_RATE = 0.85;

// 全レアリティ横断で未取得カードを高確率で優先抽選
export async function drawFocused(ownedMasterIds: Set<string>, ctx?: DrawContext, imageConfig?: ImageConfig): Promise<GachaDraw[]> {
  const unownedByRarity = (['N', 'R', 'SR', 'SSR'] as Rarity[]).reduce((acc, r) => {
    const pool = ctx ? ctx.cardPool[r] : CARDS_BY_RARITY[r];
    acc[r] = pool.filter(c => !ownedMasterIds.has(c.id));
    return acc;
  }, {} as Record<Rarity, typeof CARDS_BY_RARITY['N']>);

  const hasAnyUnowned = (Object.values(unownedByRarity) as (typeof CARDS_BY_RARITY['N'])[]).some(p => p.length > 0);

  let master: typeof CARDS_BY_RARITY['N'][number];

  if (hasAnyUnowned && Math.random() < FOCUSED_UNOWNED_RATE) {
    const available = RARITY_WEIGHTS.filter(({ rarity }) => unownedByRarity[rarity].length > 0);
    const totalWeight = available.reduce((s, { weight }) => s + weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedRarity: Rarity = available[available.length - 1].rarity;
    for (const { rarity, weight } of available) {
      rand -= weight;
      if (rand <= 0) { selectedRarity = rarity; break; }
    }
    const pool = unownedByRarity[selectedRarity];
    master = pool[Math.floor(Math.random() * pool.length)];
  } else {
    const r = pickRarity();
    const pool = ctx ? ctx.cardPool[r] : CARDS_BY_RARITY[r];
    const safePool = pool.length > 0 ? pool : (ctx ? ctx.cardPool['N'] : CARDS_BY_RARITY['N']);
    master = safePool[Math.floor(Math.random() * safePool.length)];
  }

  const seed = Math.floor(Math.random() * 1000000);
  const isDuplicate = ownedMasterIds.has(master.id);
  const base = { master, seed, isDuplicate, coinRefund: isDuplicate ? DUPLICATE_REFUND : 0, seasonId: ctx?.seasonId };
  return [await buildDraw(base, imageConfig)];
}