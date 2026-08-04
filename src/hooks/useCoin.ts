import { useState, useRef, useCallback } from 'react';
import type { GachaData, OwnedCard } from '../types';
import { loadGachaData, saveGachaData } from '../utils/storage';

export function useCoin() {
  const [gachaData, setGachaData] = useState<GachaData>(() => loadGachaData());
  const [lastCoinGain, setLastCoinGain] = useState(0);
  const [gainKey, setGainKey] = useState(0); // increment to re-trigger animation

  const dataRef = useRef(gachaData);
  dataRef.current = gachaData;

  const persist = useCallback((next: GachaData) => {
    dataRef.current = next;
    setGachaData(next);
    saveGachaData(next);
  }, []);

  const earnCoins = useCallback((
    date: string,
    completedCount: number,
    totalCount: number,
    isHard: boolean,
  ) => {
    const prev = dataRef.current;
    let delta = isHard ? 10 : 5;

    const bonuses = [...prev.dailyBonuses];
    const existingIdx = bonuses.findIndex(b => b.date === date);
    const existing = existingIdx >= 0
      ? { ...bonuses[existingIdx] }
      : { date, bonus5: false, bonus10: false, complete: false };

    if (completedCount >= 5 && !existing.bonus5) {
      delta += 10;
      existing.bonus5 = true;
    }
    if (completedCount >= 10 && !existing.bonus10) {
      delta += 20;
      existing.bonus10 = true;
    }
    if (totalCount > 0 && completedCount >= totalCount && !existing.complete) {
      delta += 20;
      existing.complete = true;
    }

    const newBonuses = existingIdx >= 0
      ? bonuses.map((b, i) => (i === existingIdx ? existing : b))
      : [...bonuses, existing];

    persist({ ...prev, coins: prev.coins + delta, dailyBonuses: newBonuses });
    setLastCoinGain(delta);
    setGainKey(k => k + 1);
  }, [persist]);

  const spendCoins = useCallback((amount: number): boolean => {
    const prev = dataRef.current;
    if (prev.coins < amount) return false;
    persist({ ...prev, coins: prev.coins - amount });
    return true;
  }, [persist]);

  const addOwnedCards = useCallback((cards: OwnedCard[]) => {
    const prev = dataRef.current;
    persist({ ...prev, ownedCards: [...prev.ownedCards, ...cards] });
  }, [persist]);

  const refundCoins = useCallback((amount: number) => {
    const prev = dataRef.current;
    const next = { ...prev, coins: prev.coins + amount };
    persist(next);
  }, [persist]);

  return {
    coins: gachaData.coins,
    ownedCards: gachaData.ownedCards,
    lastCoinGain,
    gainKey,
    earnCoins,
    spendCoins,
    refundCoins,
    addOwnedCards,
  };
}
