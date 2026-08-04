import { useState } from 'react';
import type { OwnedCard, Rarity } from '../../types';
import { CARD_MASTER } from '../../utils/cardMaster';

const RARITY_STYLE: Record<Rarity, { border: string; text: string; bg: string }> = {
  N:   { border: 'border-zinc-600',   text: 'text-zinc-400',   bg: 'bg-zinc-800' },
  R:   { border: 'border-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-950' },
  SR:  { border: 'border-purple-400', text: 'text-purple-400', bg: 'bg-purple-950' },
  SSR: { border: 'border-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-950' },
};

interface Props {
  ownedCards: OwnedCard[];
}

export default function CollectionView({ ownedCards }: Props) {
  const [selected, setSelected] = useState<OwnedCard | null>(null);

  const ownedByMasterId = new Map(ownedCards.map(c => [c.cardMasterId, c]));
  const owned = ownedCards.length;
  const total = CARD_MASTER.length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 取得率バー */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-400 font-medium">コレクション</span>
          <span className="text-xs font-mono text-zinc-300">{owned} / {total} 枚</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${(owned / total) * 100}%` }}
          />
        </div>
      </div>

      {/* カードグリッド */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="grid grid-cols-3 gap-2">
          {CARD_MASTER.map(master => {
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
