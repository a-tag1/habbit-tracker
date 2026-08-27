import { useState } from 'react';
import type { OwnedCard, Rarity, CustomSeason, CardMaster } from '../../types';
import { CARD_MASTER } from '../../utils/cardMaster';
import { CARD_MASTER as CARD_MASTER_2, SEASON2_ID } from '../../utils/cardMaster2';

const RARITY_STYLE: Record<Rarity, { border: string; text: string; bg: string }> = {
  N:   { border: 'border-zinc-600',   text: 'text-zinc-400',   bg: 'bg-zinc-800' },
  R:   { border: 'border-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-950' },
  SR:  { border: 'border-purple-400', text: 'text-purple-400', bg: 'bg-purple-950' },
  SSR: { border: 'border-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-950' },
};

interface Props {
  ownedCards: OwnedCard[];
  customSeasons: CustomSeason[];
  activeSeasonId: string | null;
}

export default function CollectionView({ ownedCards, customSeasons, activeSeasonId }: Props) {
  const [viewingSeason, setViewingSeason] = useState<string | null>(activeSeasonId);
  const [selected, setSelected] = useState<OwnedCard | null>(null);

  const baseOwnedIds = new Set(ownedCards.filter(c => !c.seasonId).map(c => c.cardMasterId));
  const isBaseSeasonComplete = CARD_MASTER.length > 0 && CARD_MASTER.every(c => baseOwnedIds.has(c.id));

  const viewingCards: CardMaster[] = viewingSeason === null
    ? CARD_MASTER
    : viewingSeason === SEASON2_ID
    ? CARD_MASTER_2
    : (customSeasons.find(s => s.id === viewingSeason)?.cards ?? CARD_MASTER);

  const ownedInSeason = ownedCards.filter(c =>
    viewingSeason === null ? !c.seasonId : c.seasonId === viewingSeason
  );
  const ownedByMasterId = new Map(ownedInSeason.map(c => [c.cardMasterId, c]));
  const total = viewingCards.length;
  const owned = ownedInSeason.length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* シーズンタブ + 取得率バー */}
      <div className="nav-surface px-4 py-3 border-b border-zinc-800 shrink-0">
        {/* シーズンタブ */}
        {(isBaseSeasonComplete || customSeasons.length > 0) && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
            <button
              onClick={() => setViewingSeason(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${viewingSeason === null ? 'bg-zinc-600 border-zinc-500 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
            >
              ベース
            </button>
            {isBaseSeasonComplete && (
              <button
                onClick={() => setViewingSeason(SEASON2_ID)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${viewingSeason === SEASON2_ID ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
              >
                シーズン2
              </button>
            )}
            {customSeasons.map(s => (
              <button
                key={s.id}
                onClick={() => setViewingSeason(s.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${viewingSeason === s.id ? 'bg-yellow-600/30 border-yellow-500 text-yellow-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
              >
                {s.theme}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-400 font-medium">
            {viewingSeason === null ? 'ベースシーズン' : viewingSeason === SEASON2_ID ? 'シーズン2' : customSeasons.find(s => s.id === viewingSeason)?.theme}
          </span>
          <span className="text-xs font-mono text-zinc-300">{owned} / {total} 枚</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (owned / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* カードグリッド */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="grid grid-cols-3 gap-2">
          {viewingCards.map(master => {
            const card = ownedByMasterId.get(master.id);
            const style = RARITY_STYLE[master.rarity];

            return (
              <button
                key={master.id}
                onClick={() => card && setSelected(card)}
                className={`flex flex-col rounded-xl border-2 overflow-hidden ${style.border} ${
                  card ? 'active:scale-95 transition-transform' : 'opacity-40'
                }`}
              >
                <div className="relative w-full aspect-[2/3] bg-zinc-800">
                  {card ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <span className="text-2xl text-zinc-700">?</span>
                    </div>
                  )}
                  <div className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {master.rarity}
                  </div>
                </div>
                <div className="px-1.5 py-1 bg-zinc-900">
                  <p className="text-[10px] text-zinc-300 truncate">
                    {card ? card.name : '???'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* カード詳細モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className={`relative w-full max-w-xs rounded-2xl border-2 overflow-hidden bg-zinc-900 ${RARITY_STYLE[selected.rarity].border}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[2/3]">
              <img
                src={selected.imageUrl}
                alt={selected.name}
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget.parentElement!).classList.add('bg-zinc-800'); }}
              />
              <div className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${RARITY_STYLE[selected.rarity].bg} ${RARITY_STYLE[selected.rarity].text}`}>
                {selected.rarity}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-300 text-lg"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-4">
              <h3 className={`text-base font-bold mb-3 ${RARITY_STYLE[selected.rarity].text}`}>{selected.name}</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{selected.cheerMessage}</p>
              <p className="text-[10px] text-zinc-600 mt-3">
                取得日: {new Date(selected.obtainedAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
