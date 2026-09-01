import { useState, useEffect, useRef, useCallback } from 'react';
import type { GachaData, OwnedCard, CustomSeason } from '../types';
import { loadGachaData, saveGachaData, defaultGachaData } from '../utils/storage';
import { generateSeasonCards } from '../utils/seasonGenerator';

export function useCoin() {
  const [gachaData, setGachaData] = useState<GachaData>(defaultGachaData);
  const [lastCoinGain, setLastCoinGain] = useState(0);
  const [gainKey, setGainKey] = useState(0); // increment to re-trigger animation

  const dataRef = useRef(gachaData);
  dataRef.current = gachaData;
  const loadedRef = useRef(false);

  useEffect(() => {
    loadGachaData().then(d => {
      dataRef.current = d;
      setGachaData(d);
      loadedRef.current = true;
    });
  }, []);

  const persist = useCallback((next: GachaData) => {
    dataRef.current = next;
    setGachaData(next);
    if (loadedRef.current) {
      saveGachaData(next).catch(e => {
        console.error('[useCoin] データ保存失敗:', e);
      });
    }
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

  const replaceOwnedCard = useCallback((cardMasterId: string, newCard: OwnedCard) => {
    const prev = dataRef.current;
    const updated = prev.ownedCards.map(c => c.cardMasterId === cardMasterId ? newCard : c);
    persist({ ...prev, ownedCards: updated });
  }, [persist]);

  const refundCoins = useCallback((amount: number) => {
    const prev = dataRef.current;
    persist({ ...prev, coins: prev.coins + amount });
  }, [persist]);

  const createSeason = useCallback((theme: string) => {
    const prev = dataRef.current;
    const seasonId = `season_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cards = generateSeasonCards(theme, seasonId);
    const season: CustomSeason = { id: seasonId, theme, cards, createdAt: new Date().toISOString() };
    persist({ ...prev, customSeasons: [...prev.customSeasons, season], activeSeasonId: seasonId });
  }, [persist]);

  const switchSeason = useCallback((seasonId: string | null) => {
    const prev = dataRef.current;
    persist({ ...prev, activeSeasonId: seasonId });
  }, [persist]);

  return {
    coins: gachaData.coins,
    ownedCards: gachaData.ownedCards,
    customSeasons: gachaData.customSeasons,
    activeSeasonId: gachaData.activeSeasonId,
    lastCoinGain,
    gainKey,
    earnCoins,
    spendCoins,
    refundCoins,
    addOwnedCards,
    replaceOwnedCard,
    createSeason,
    switchSeason,
  };
}
