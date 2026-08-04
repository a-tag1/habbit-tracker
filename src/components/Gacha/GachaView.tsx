import { useState, useEffect, useRef } from 'react';
import type { OwnedCard, Rarity } from '../../types';
import { drawCards, GACHA_COST_SINGLE, GACHA_COST_MULTI, DUPLICATE_REFUND, type GachaDraw } from '../../utils/gachaUtils';
import { CARD_MASTER } from '../../utils/cardMaster';
import CollectionView from './CollectionView';

type GachaPhase = 'idle' | 'pulling' | 'reveal';
type SubTab = 'gacha' | 'collection';

interface Props {
  coins: number;
  ownedCards: OwnedCard[];
  onSpendCoins: (amount: number) => boolean;
  onAddCards: (cards: OwnedCard[]) => void;
  onAddCoins: (amount: number) => void;
}

const RARITY_STYLE: Record<Rarity, { border: string; text: string; glow: string; label: string }> = {
  N:   { border: 'border-zinc-500',  text: 'text-zinc-400',   glow: '',                             label: 'N' },
  R:   { border: 'border-blue-500',  text: 'text-blue-400',   glow: 'shadow-blue-500/40',            label: 'R' },
  SR:  { border: 'border-purple-400',text: 'text-purple-400', glow: 'shadow-purple-500/50',          label: 'SR' },
  SSR: { border: 'border-yellow-400',text: 'text-yellow-400', glow: 'shadow-yellow-400/60',          label: 'SSR' },
};

function CardImage({ url, name, rarity }: { url: string; name: string; rarity: Rarity }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  return (
    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800">
      {state !== 'loaded' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-900 to-purple-900">
          {state === 'loading' ? (
            <div className="w-6 h-6 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-2xl">✦</span>
              <button
                onClick={() => { setState('loading'); setRetryKey(k => k + 1); }}
                className="text-xs text-zinc-400 underline"
              >
                再読み込み
              </button>
            </>
          )}
        </div>
      )}
      <img
        key={retryKey}
        src={url}
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
      />
      {state === 'loaded' && rarity === 'SSR' && (
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 via-transparent to-transparent pointer-events-none" />
      )}
    </div>
  );
}

function ResultCard({ draw, index, visible }: { draw: GachaDraw; index: number; visible: boolean }) {
  const { card, isDuplicate, coinRefund } = draw;
  const style = RARITY_STYLE[card.rarity];

  return (
    <div
      className={`card-reveal flex flex-col rounded-xl border-2 ${style.border} overflow-hidden bg-zinc-900 ${
        card.rarity !== 'N' ? `shadow-lg ${style.glow}` : ''
      }`}
      style={{ animationDelay: `${index * 120}ms`, opacity: visible ? undefined : 0 }}
    >
      <CardImage url={card.imageUrl} name={card.name} rarity={card.rarity} />
      <div className="px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-bold ${style.text}`}>{style.label}</span>
          {isDuplicate && (
            <span className="text-[10px] text-yellow-400 font-bold">被り +{coinRefund}🪙</span>
          )}
        </div>
        <p className="text-[11px] text-zinc-200 font-medium leading-tight mt-0.5 truncate">{card.name}</p>
      </div>
    </div>
  );
}

function MagicCircle() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6">
      <div className="relative flex items-center justify-center w-48 h-48">
        <div className="absolute inset-0 rounded-full border-2 border-yellow-400/60 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-purple-400/60 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        <div className="absolute inset-8 rounded-full border border-blue-400/40 animate-spin" style={{ animationDuration: '4s' }} />
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/30 via-purple-500/20 to-blue-500/30 flex items-center justify-center animate-pulse">
          <span className="text-4xl">✦</span>
        </div>
      </div>
      <p className="text-sm text-zinc-300 animate-pulse">召喚中…</p>
    </div>
  );
}

export default function GachaView({ coins, ownedCards, onSpendCoins, onAddCards, onAddCoins }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('gacha');
  const [phase, setPhase] = useState<GachaPhase>('idle');
  const [draws, setDraws] = useState<GachaDraw[]>([]);
  const [pullCount, setPullCount] = useState<1 | 10>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const ownedMasterIds = new Set(ownedCards.map(c => c.cardMasterId));

  const executePull = (count: 1 | 10) => {
    const cost = count === 1 ? GACHA_COST_SINGLE : GACHA_COST_MULTI;
    if (!onSpendCoins(cost)) return;

    setPullCount(count);
    setPhase('pulling');

    timerRef.current = setTimeout(() => {
      const results = drawCards(count, ownedMasterIds);
      setDraws(results);
      setPhase('reveal');

      // Credit refund coins for duplicates
      const refund = results.reduce((s, d) => s + d.coinRefund, 0);
      if (refund > 0) onAddCoins(refund);

      // Add non-duplicate cards to collection
      const newCards = results.filter(d => !d.isDuplicate).map(d => d.card);
      if (newCards.length > 0) onAddCards(newCards);
    }, 3000);
  };

  const handleReset = () => {
    setPhase('idle');
    setDraws([]);
  };

  const totalRefund = draws.reduce((s, d) => s + d.coinRefund, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-base text-zinc-100">ガチャ</h1>
          <div className="flex items-center gap-1.5 bg-zinc-800 rounded-full px-3 py-1">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-mono font-bold text-yellow-400">{coins}</span>
          </div>
        </div>
        {/* サブタブ */}
        <div className="flex rounded-xl bg-zinc-800 p-0.5 gap-0.5">
          {(['gacha', 'collection'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${
                subTab === tab ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              {tab === 'gacha' ? '✦ ガチャ' : '⊞ 図鑑'}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'collection' ? (
        <CollectionView ownedCards={ownedCards} />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {phase === 'pulling' && <MagicCircle />}

          {phase === 'reveal' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {pullCount === 1 && draws[0] ? (
                  // 単発：大きく中央表示
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-48">
                      <ResultCard draw={draws[0]} index={0} visible={true} />
                    </div>
                    <div className={`px-4 py-3 rounded-xl bg-zinc-800 border ${RARITY_STYLE[draws[0].card.rarity].border} max-w-xs w-full`}>
                      <p className="text-xs text-zinc-300 text-center leading-relaxed">
                        {draws[0].card.cheerMessage}
                      </p>
                    </div>
                    {totalRefund > 0 && (
                      <p className="text-xs text-yellow-400">被りにつき {totalRefund}🪙 還元されました</p>
                    )}
                  </div>
                ) : (
                  // 10連：グリッド表示
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      {draws.map((draw, i) => (
                        <ResultCard key={draw.card.userCardId} draw={draw} index={i} visible={true} />
                      ))}
                    </div>
                    {totalRefund > 0 && (
                      <p className="text-xs text-yellow-400 text-center">被りにつき {totalRefund}🪙 還元されました</p>
                    )}
                  </div>
                )}
              </div>
              <div className="px-4 py-4 border-t border-zinc-800 shrink-0">
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-zinc-700 text-zinc-100 text-sm font-medium"
                >
                  戻る
                </button>
              </div>
            </div>
          )}

          {phase === 'idle' && (
            <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 gap-6">
              {/* ガチャ演出エリア */}
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-500/20 via-purple-500/15 to-blue-500/20 border border-zinc-700 flex items-center justify-center">
                  <span className="text-5xl">✦</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">AIキャラクターカードをゲットしよう</p>
              </div>

              {/* 排出率 */}
              <div className="bg-zinc-800/60 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-400 font-medium mb-2">排出率</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(['SSR', 'SR', 'R', 'N'] as const).map(r => (
                    <div key={r}>
                      <div className={`text-xs font-bold ${RARITY_STYLE[r].text}`}>{r}</div>
                      <div className="text-xs text-zinc-500">{r === 'SSR' ? '3%' : r === 'SR' ? '12%' : r === 'R' ? '25%' : '60%'}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 text-center">10連は SR以上 1枚確定</p>
              </div>

              {/* ガチャボタン */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => executePull(1)}
                  disabled={coins < GACHA_COST_SINGLE}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-semibold text-sm disabled:opacity-40 transition-opacity active:scale-95"
                >
                  <div>1回引く</div>
                  <div className="text-xs font-normal opacity-80 mt-0.5">🪙 {GACHA_COST_SINGLE} コイン</div>
                </button>
                <button
                  onClick={() => executePull(10)}
                  disabled={coins < GACHA_COST_MULTI}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold text-sm disabled:opacity-40 transition-opacity active:scale-95"
                >
                  <div>10連引く <span className="text-xs font-normal">（SR以上確定）</span></div>
                  <div className="text-xs font-normal opacity-80 mt-0.5">🪙 {GACHA_COST_MULTI} コイン <span className="opacity-70">（10%割引）</span></div>
                </button>
              </div>

              {/* コイン獲得方法 */}
              <div className="bg-zinc-800/60 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-400 font-medium mb-2">🪙 コイン獲得方法</p>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex justify-between"><span>タスク1個完了</span><span className="text-yellow-500">+5</span></div>
                  <div className="flex justify-between"><span>ハードタスク1個完了</span><span className="text-yellow-500">+10</span></div>
                  <div className="flex justify-between"><span>その日5個完了ボーナス</span><span className="text-yellow-500">+10</span></div>
                  <div className="flex justify-between"><span>その日10個完了ボーナス</span><span className="text-yellow-500">+20</span></div>
                  <div className="flex justify-between"><span>デイリーコンプリート</span><span className="text-yellow-500">+20</span></div>
                </div>
              </div>

              {/* 全{CARD_MASTER.length}種類 */}
              <p className="text-center text-xs text-zinc-600">全{CARD_MASTER.length}種類のカードが存在します</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
