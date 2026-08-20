import { useState, useEffect, useRef, useMemo } from 'react';
import type { OwnedCard, Rarity, CustomSeason, CardMaster } from '../../types';
import { drawCards, drawFocused, GACHA_COST_SINGLE, GACHA_COST_FOCUSED, DUPLICATE_REFUND, type GachaDraw, type DrawContext, type ImageConfig } from '../../utils/gachaUtils';
import { CARD_MASTER } from '../../utils/cardMaster';
import CollectionView from './CollectionView';

type GachaPhase = 'idle' | 'pulling' | 'reveal';
type SubTab = 'gacha' | 'collection';

interface Props {
  coins: number;
  ownedCards: OwnedCard[];
  customSeasons: CustomSeason[];
  activeSeasonId: string | null;
  onSpendCoins: (amount: number) => boolean;
  onAddCards: (cards: OwnedCard[]) => void;
  onAddCoins: (amount: number) => void;
  onReplaceCard: (cardMasterId: string, newCard: OwnedCard) => void;
  onCreateSeason: (theme: string) => void;
  onSwitchSeason: (id: string | null) => void;
  // --- プロバイダー設定の拡張 ---
  imageProvider: 'pollinations' | 'huggingface' | 'cloudflare';
  hfToken?: string;
  hfModel?: string;
  cfAccountId?: string;
  cfToken?: string;
  cfModel?: string;
}

const RARITY_STYLE: Record<Rarity, { border: string; text: string; glow: string; label: string }> = {
  N:   { border: 'border-zinc-500',  text: 'text-zinc-400',   glow: '',                    label: 'N' },
  R:   { border: 'border-blue-500',  text: 'text-blue-400',   glow: 'shadow-blue-500/40',  label: 'R' },
  SR:  { border: 'border-purple-400',text: 'text-purple-400', glow: 'shadow-purple-500/50',label: 'SR' },
  SSR: { border: 'border-yellow-400',text: 'text-yellow-400', glow: 'shadow-yellow-400/60',label: 'SSR' },
};

const EXAMPLE_THEMES = ['宇宙海賊', '和風妖怪', '魔法学校', '未来都市', '海底王国', '古代文明', 'カフェ&スイーツ', 'サムライ', '西部劇', '北欧神話'];

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
              <button onClick={() => { setState('loading'); setRetryKey(k => k + 1); }} className="text-xs text-zinc-400 underline">再読み込み</button>
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

function ResultCard({ draw, index }: { draw: GachaDraw; index: number }) {
  const { card, isDuplicate, coinRefund } = draw;
  const style = RARITY_STYLE[card.rarity];
  return (
    <div
      className={`card-reveal flex flex-col rounded-xl border-2 ${style.border} overflow-hidden bg-zinc-900 ${card.rarity !== 'N' ? `shadow-lg ${style.glow}` : ''}`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <CardImage url={card.imageUrl} name={card.name} rarity={card.rarity} />
      <div className="px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-bold ${style.text}`}>{style.label}</span>
          {isDuplicate && <span className="text-[10px] text-yellow-400 font-bold">被り +{coinRefund}🪙</span>}
        </div>
        <p className="text-[11px] text-zinc-200 font-medium leading-tight mt-0.5 truncate">{card.name}</p>
      </div>
    </div>
  );
}

function MagicCircle({ theme }: { theme?: string }) {
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
      <p className="text-sm text-zinc-300 animate-pulse">{theme ? `「${theme}」召喚中…` : '召喚中…'}</p>
    </div>
  );
}

function SeasonCreationModal({
  onClose, onConfirm, isCreating,
}: { onClose: () => void; onConfirm: (theme: string) => void; isCreating: boolean }) {
  const [input, setInput] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75" />
      <div
        className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-700 p-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-zinc-100 mb-1">✦ 新シーズンを召喚</h2>
        <p className="text-xs text-zinc-500 mb-4">好きなテーマを入力して、新しい50種のカードを生成しよう</p>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="例: 宇宙海賊、和風妖怪…"
          maxLength={20}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500 transition-colors mb-3"
          autoFocus
        />
        <div className="flex flex-wrap gap-1.5 mb-4">
          {EXAMPLE_THEMES.map(t => (
            <button
              key={t}
              onClick={() => setInput(t)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 active:bg-zinc-700 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 text-sm">キャンセル</button>
          <button
            onClick={() => input.trim() && onConfirm(input.trim())}
            disabled={!input.trim() || isCreating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-sm font-semibold disabled:opacity-40"
          >
            {isCreating ? '生成中…' : '召喚する'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GachaView({
  coins, ownedCards, customSeasons, activeSeasonId,
  onSpendCoins, onAddCards, onAddCoins, onReplaceCard, onCreateSeason, onSwitchSeason,
  imageProvider, hfToken, hfModel, cfAccountId, cfToken, cfModel, // ← Cloudflare用のPropsを受け取り
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('gacha');
  const [phase, setPhase] = useState<GachaPhase>('idle');
  const [draws, setDraws] = useState<GachaDraw[]>([]);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [overwriteSet, setOverwriteSet] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const currentSeasonMaster: CardMaster[] = useMemo(() => {
    if (activeSeasonId === null) return CARD_MASTER;
    return customSeasons.find(s => s.id === activeSeasonId)?.cards ?? CARD_MASTER;
  }, [activeSeasonId, customSeasons]);

  const currentSeasonCardsByRarity = useMemo(() => ({
    N:   currentSeasonMaster.filter(c => c.rarity === 'N'),
    R:   currentSeasonMaster.filter(c => c.rarity === 'R'),
    SR:  currentSeasonMaster.filter(c => c.rarity === 'SR'),
    SSR: currentSeasonMaster.filter(c => c.rarity === 'SSR'),
  }), [currentSeasonMaster]);

  const ownedMasterIds = useMemo(() => new Set(
    ownedCards
      .filter(c => activeSeasonId === null ? !c.seasonId : c.seasonId === activeSeasonId)
      .map(c => c.cardMasterId)
  ), [ownedCards, activeSeasonId]);

  const isCurrentSeasonComplete = useMemo(
    () => currentSeasonMaster.length > 0 && currentSeasonMaster.every(c => ownedMasterIds.has(c.id)),
    [currentSeasonMaster, ownedMasterIds]
  );

  const activeSeasonTheme = activeSeasonId === null
    ? 'ベースシーズン'
    : (customSeasons.find(s => s.id === activeSeasonId)?.theme ?? '');

  const handleCreateSeason = (theme: string) => {
    setIsCreatingSeason(true);
    setTimeout(() => {
      onCreateSeason(theme);
      setIsCreatingSeason(false);
      setShowSeasonModal(false);
    }, 1200);
  };

  const executePull = (mode: 'single' | 'focused') => {
    const cost = mode === 'single' ? GACHA_COST_SINGLE : GACHA_COST_FOCUSED;
    if (!onSpendCoins(cost)) return;
    setPhase('pulling');

    const ctx: DrawContext | undefined = activeSeasonId !== null
      ? { cardPool: currentSeasonCardsByRarity, seasonId: activeSeasonId }
      : undefined;

    // --- ImageConfig に Cloudflare パラメータを設定 ---
    const imgConfig: ImageConfig = {
      provider: imageProvider,
      hfToken: hfToken || undefined,
      hfModel,
      cfAccountId: cfAccountId || undefined,
      cfToken: cfToken || undefined,
      cfModel,
    };

    Promise.all([
      mode === 'single' ? drawCards(ownedMasterIds, ctx, imgConfig) : drawFocused(ownedMasterIds, ctx, imgConfig),
      new Promise<void>(r => { timerRef.current = setTimeout(r, 3000); }),
    ]).then(([results]) => {
      setDraws(results);
      setPhase('reveal');
      const refund = results.reduce((s, d) => s + d.coinRefund, 0);
      if (refund > 0) onAddCoins(refund);
      const newCards = results.filter(d => !d.isDuplicate).map(d => d.card);
      if (newCards.length > 0) onAddCards(newCards);
    }).catch(() => {
      // 失敗時はコインを返金しidleに戻る
      onAddCoins(cost);
      setPhase('idle');
    });
  };

  const totalRefund = draws.reduce((s, d) => s + d.coinRefund, 0);
  // 被り重複をcardMasterId単位で1件にまとめる
  const uniqueDuplicateDraws = draws.filter(
    (d, idx) => d.isDuplicate && draws.findIndex(x => x.card.cardMasterId === d.card.cardMasterId) === idx
  );

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
        <div className="flex rounded-xl bg-zinc-800 p-0.5 gap-0.5">
          {(['gacha', 'collection'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${subTab === tab ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-500'}`}
            >
              {tab === 'gacha' ? '✦ ガチャ' : '⊞ 図鑑'}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'collection' ? (
        <CollectionView ownedCards={ownedCards} customSeasons={customSeasons} activeSeasonId={activeSeasonId} />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {phase === 'pulling' && <MagicCircle theme={activeSeasonId !== null ? activeSeasonTheme : undefined} />}

          {phase === 'reveal' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {draws[0] && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-48"><ResultCard draw={draws[0]} index={0} /></div>
                    <div className={`px-4 py-3 rounded-xl bg-zinc-800 border ${RARITY_STYLE[draws[0].card.rarity].border} max-w-xs w-full`}>
                      <p className="text-xs text-zinc-300 text-center leading-relaxed">{draws[0].card.cheerMessage}</p>
                    </div>
                    {totalRefund > 0 && <p className="text-xs text-yellow-400">被りにつき {totalRefund}🪙 還元されました</p>}
                  </div>
                )}
                {uniqueDuplicateDraws.length > 0 && (
                  <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-3">
                    <p className="text-[11px] text-zinc-500 mb-3 font-medium">被りカードのイラストを更新しますか？</p>
                    <div className="flex flex-col gap-4">
                      {uniqueDuplicateDraws.map(draw => {
                        const existingCard = ownedCards.find(c => c.cardMasterId === draw.card.cardMasterId);
                        return (
                          <div key={draw.card.cardMasterId} className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold ${RARITY_STYLE[draw.card.rarity].text}`}>
                                {RARITY_STYLE[draw.card.rarity].label}
                              </span>
                              <span className="text-xs text-zinc-300 truncate">{draw.card.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-zinc-500 text-center">現在</p>
                                {existingCard && <CardImage url={existingCard.imageUrl} name={existingCard.name} rarity={existingCard.rarity} />}
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-zinc-500 text-center">新規</p>
                                <CardImage url={draw.card.imageUrl} name={draw.card.name} rarity={draw.card.rarity} />
                              </div>
                            </div>
                            <button
                              onClick={() => setOverwriteSet(prev => {
                                const next = new Set(prev);
                                if (next.has(draw.card.cardMasterId)) next.delete(draw.card.cardMasterId);
                                else next.add(draw.card.cardMasterId);
                                return next;
                              })}
                              className={`w-full py-2 rounded-xl text-[11px] font-medium transition-colors ${
                                overwriteSet.has(draw.card.cardMasterId)
                                  ? 'bg-emerald-700 text-emerald-100'
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {overwriteSet.has(draw.card.cardMasterId) ? '✓ 新規に上書き' : 'そのまま'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-4 border-t border-zinc-800 shrink-0">
                <button
                  onClick={() => {
                    overwriteSet.forEach(masterId => {
                      const draw = draws.find(d => d.card.cardMasterId === masterId);
                      if (draw) onReplaceCard(masterId, draw.card);
                    });
                    setOverwriteSet(new Set());
                    setPhase('idle');
                    setDraws([]);
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-700 text-zinc-100 text-sm font-medium"
                >
                  {overwriteSet.size > 0 ? `上書きして戻る（${overwriteSet.size}枚）` : '戻る'}
                </button>
              </div>
            </div>
          )}

          {phase === 'idle' && (
            <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 gap-4">

              {/* シーズンセレクター */}
              {customSeasons.length > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-500 mb-1.5 font-medium">シーズン</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                    <button
                      onClick={() => onSwitchSeason(null)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeSeasonId === null ? 'bg-zinc-600 border-zinc-500 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                    >
                      ベース
                    </button>
                    {customSeasons.map(s => (
                      <button
                        key={s.id}
                        onClick={() => onSwitchSeason(s.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeSeasonId === s.id ? 'bg-yellow-600/30 border-yellow-500 text-yellow-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                      >
                        {s.theme}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* コンプリートバナー */}
              {isCurrentSeasonComplete && (
                <div className="rounded-xl bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-600/50 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-bold text-yellow-300">{activeSeasonTheme} コンプリート！</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">新しいテーマで50枚の新カードを生成できます</p>
                  <button
                    onClick={() => setShowSeasonModal(true)}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-sm font-semibold"
                  >
                    ✦ 新しいテーマを召喚する
                  </button>
                </div>
              )}

              {/* 現在シーズン情報 */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-zinc-500">現在のシーズン</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-0.5">{activeSeasonTheme}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">取得枚数</p>
                  <p className="text-sm font-mono font-bold text-yellow-400 mt-0.5">{ownedMasterIds.size} / {currentSeasonMaster.length}</p>
                </div>
              </div>

              {/* ガチャ演出 */}
              <div className="flex items-center justify-center py-2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 via-purple-500/15 to-blue-500/20 border border-zinc-700 flex items-center justify-center">
                  <span className="text-4xl">✦</span>
                </div>
              </div>

              {/* 排出率 */}
              <div className="bg-zinc-800/60 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-400 font-medium mb-2">排出率</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(['SSR', 'SR', 'R', 'N'] as const).map(r => (
                    <div key={r}>
                      <div className={`text-xs font-bold ${RARITY_STYLE[r].text}`}>{r}</div>
                      <div className="text-xs text-zinc-500">{r === 'SSR' ? '3%' : r === 'SR' ? '12%' : r === 'R' ? '30%' : '55%'}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 text-center">🎯未取得優先：全レアリティ横断で未取得から約85%の確率で抽選</p>
              </div>

              {/* ガチャボタン */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => executePull('single')}
                  disabled={coins < GACHA_COST_SINGLE}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <div>1回引く</div>
                  <div className="text-xs font-normal opacity-80 mt-0.5">🪙 {GACHA_COST_SINGLE} コイン</div>
                </button>
                <button
                  onClick={() => executePull('focused')}
                  disabled={coins < GACHA_COST_FOCUSED}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <div>🎯 未取得優先ガチャ</div>
                  <div className="text-xs font-normal opacity-80 mt-0.5">🪙 {GACHA_COST_FOCUSED} コイン</div>
                </button>
              </div>

              {/* コイン獲得方法 */}
              <div className="bg-zinc-800/60 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-400 font-medium mb-2">🪙 コイン獲得方法</p>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex justify-between"><span>タスク1個完了</span><span className="text-yellow-500">+5</span></div>
                  <div className="flex justify-between"><span>ハードタスク1個完了</span><span className="text-yellow-500">+10</span></div>
                  <div className="flex justify-between"><span>5個完了ボーナス（1日1回）</span><span className="text-yellow-500">+10</span></div>
                  <div className="flex justify-between"><span>10個完了ボーナス（1日1回）</span><span className="text-yellow-500">+20</span></div>
                  <div className="flex justify-between"><span>デイリーコンプリート（1日1回）</span><span className="text-yellow-500">+20</span></div>
                  <div className="flex justify-between"><span>被りカード還元</span><span className="text-yellow-500">+{DUPLICATE_REFUND}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showSeasonModal && (
        <SeasonCreationModal
          onClose={() => !isCreatingSeason && setShowSeasonModal(false)}
          onConfirm={handleCreateSeason}
          isCreating={isCreatingSeason}
        />
      )}
    </div>
  );
}