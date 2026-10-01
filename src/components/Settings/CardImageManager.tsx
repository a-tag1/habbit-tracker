import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, ImagePlus, LoaderCircle, Pause, Play, RotateCcw, Search, Square, Trash2, Upload } from 'lucide-react';
import type { CustomSeason, RegisteredCardImages } from '../../types';
import { CARD_MASTER } from '../../utils/cardMaster';
import { CARD_MASTER as CARD_MASTER_2 } from '../../utils/cardMaster2';
import { generateRegisteredCardImage, type ImageConfig } from '../../utils/gachaUtils';
import { optimizeImageBlob } from '../../utils/imageUtils';

interface Props {
  customSeasons: CustomSeason[];
  registeredCardImages: RegisteredCardImages;
  onRegisteredCardImagesChange: (images: RegisteredCardImages) => void;
  imageConfig: ImageConfig;
  onBack: () => void;
}

async function optimizeUploadedImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name}: 画像ファイルを選択してください。`);
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: 10MB以下の画像を選択してください。`);
  return optimizeImageBlob(file);
}

type QueueResult = 'generating' | 'failed' | 'complete';
interface ImageBackup { format: 'habit-tracker-card-images'; version: 1; images: RegisteredCardImages }

export default function CardImageManager({
  customSeasons, registeredCardImages, onRegisteredCardImagesChange, imageConfig, onBack,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const cancelQueueRef = useRef(false);
  const pauseQueueRef = useRef(false);
  const resumeQueueRef = useRef<(() => void) | null>(null);
  const [selectedCardId, setSelectedCardId] = useState(CARD_MASTER[0].id);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [queueResults, setQueueResults] = useState<Record<string, QueueResult>>({});
  const [currentQueueCardId, setCurrentQueueCardId] = useState<string | null>(null);

  const managedCards = useMemo(() => [
    ...CARD_MASTER.map(card => ({ card, season: 'ベースシーズン' })),
    ...CARD_MASTER_2.map(card => ({ card, season: 'シーズン2' })),
    ...customSeasons.flatMap(season => season.cards.map(card => ({ card, season: season.theme }))),
  ], [customSeasons]);
  const selectedCard = managedCards.find(({ card }) => card.id === selectedCardId) ?? managedCards[0];
  const selectedImages = registeredCardImages[selectedCard?.card.id] ?? [];
  const registeredImageCount = Object.values(registeredCardImages).reduce((sum, images) => sum + images.length, 0);
  const visibleCards = managedCards.filter(({ card }) => `${card.name} ${card.rarity} ${card.id}`.toLowerCase().includes(search.toLowerCase()));
  const failedCardIds = Object.entries(queueResults).filter(([, result]) => result === 'failed').map(([id]) => id);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !selectedCard) return;
    setIsUploading(true);
    setError('');
    try {
      const optimizedImages: string[] = [];
      for (const file of files) optimizedImages.push(await optimizeUploadedImage(file));
      const cardId = selectedCard.card.id;
      onRegisteredCardImagesChange({
        ...registeredCardImages,
        [cardId]: [...(registeredCardImages[cardId] ?? []), ...optimizedImages],
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '画像を登録できませんでした。');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    if (!selectedCard) return;
    const cardId = selectedCard.card.id;
    const remainingImages = (registeredCardImages[cardId] ?? []).filter((_, imageIndex) => imageIndex !== index);
    const nextImages = { ...registeredCardImages };
    if (remainingImages.length) nextImages[cardId] = remainingImages;
    else delete nextImages[cardId];
    onRegisteredCardImagesChange(nextImages);
  };

  const toggleCard = (cardId: string) => {
    setSelectedCardIds(current => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const selectUnregistered = () => {
    setSelectedCardIds(new Set(managedCards
      .filter(({ card }) => !(registeredCardImages[card.id]?.length))
      .map(({ card }) => card.id)));
  };

  const runGenerationQueue = async (cardIds: string[]) => {
    if (isGenerating || cardIds.length === 0) return;
    cancelQueueRef.current = false;
    pauseQueueRef.current = false;
    setIsPaused(false);
    setIsGenerating(true);
    setError('');
    let nextImages = { ...registeredCardImages };

    try {
      for (const cardId of cardIds) {
        if (cancelQueueRef.current) break;
        if (pauseQueueRef.current) {
          await new Promise<void>(resolve => { resumeQueueRef.current = resolve; });
          resumeQueueRef.current = null;
        }
        if (cancelQueueRef.current) break;

        const card = managedCards.find(({ card: item }) => item.id === cardId)?.card;
        if (!card) continue;
        setCurrentQueueCardId(cardId);
        setQueueResults(current => ({ ...current, [cardId]: 'generating' }));
        try {
          const generated = await generateRegisteredCardImage(card.prompt, imageConfig);
          nextImages = { ...nextImages, [cardId]: [...(nextImages[cardId] ?? []), generated.imageUrl] };
          onRegisteredCardImagesChange(nextImages);
          setQueueResults(current => ({ ...current, [cardId]: 'complete' }));
        } catch {
          setQueueResults(current => ({ ...current, [cardId]: 'failed' }));
        }
      }
    } finally {
      setCurrentQueueCardId(null);
      setIsGenerating(false);
      setIsPaused(false);
    }
  };

  const pauseQueue = () => {
    pauseQueueRef.current = true;
    setIsPaused(true);
  };

  const resumeQueue = () => {
    pauseQueueRef.current = false;
    setIsPaused(false);
    resumeQueueRef.current?.();
  };

  const stopQueue = () => {
    cancelQueueRef.current = true;
    pauseQueueRef.current = false;
    resumeQueueRef.current?.();
  };

  const exportImageBackup = () => {
    const backup: ImageBackup = { format: 'habit-tracker-card-images', version: 1, images: registeredCardImages };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-card-images-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importImageBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text()) as Partial<ImageBackup>;
      if (backup.format !== 'habit-tracker-card-images' || backup.version !== 1 || !backup.images || typeof backup.images !== 'object') {
        throw new Error('画像バックアップの形式が正しくありません。');
      }
      const next = { ...registeredCardImages };
      for (const [cardId, images] of Object.entries(backup.images)) {
        if (!Array.isArray(images) || !images.every(image => typeof image === 'string' && image.startsWith('data:image/'))) {
          throw new Error('バックアップ内に読み込めない画像があります。');
        }
        next[cardId] = [...new Set([...(next[cardId] ?? []), ...images])];
      }
      onRegisteredCardImagesChange(next);
      setBackupMessage('画像を復元しました。');
    } catch (backupError) {
      setBackupMessage(backupError instanceof Error ? backupError.message : 'バックアップを読み込めませんでした。');
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="nav-surface flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button type="button" onClick={onBack} aria-label="設定に戻る" className="rounded-lg p-2 text-zinc-300 active:bg-zinc-800">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-[color:var(--text-primary)]">カード画像管理</h1>
          <p className="text-xs text-zinc-500">登録画像 {registeredImageCount} 枚</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section className="flex gap-2">
          <button type="button" onClick={exportImageBackup} disabled={registeredImageCount === 0} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs text-zinc-200 disabled:opacity-50">
            <Download size={15} /> 画像をバックアップ
          </button>
          <input ref={backupInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importImageBackup} />
          <button type="button" onClick={() => backupInputRef.current?.click()} disabled={isGenerating} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs text-zinc-200 disabled:opacity-50">
            <Upload size={15} /> バックアップを復元
          </button>
        </section>
        {backupMessage && <p role="status" className="text-xs text-zinc-400">{backupMessage}</p>}

        <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">一括生成</h2>
            <button type="button" onClick={selectUnregistered} disabled={isGenerating} className="text-xs text-emerald-300 disabled:opacity-50">
              未登録を選択
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2">
            <Search size={15} className="shrink-0 text-zinc-500" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="カード名で検索" className="min-w-0 flex-1 bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-600" />
          </label>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-1">
            {visibleCards.map(({ card, season }) => {
              const isRegistered = (registeredCardImages[card.id]?.length ?? 0) > 0;
              const result = queueResults[card.id];
              const status = result === 'generating' ? '生成中' : result === 'failed' ? '失敗' : isRegistered ? '登録済み' : '未登録';
              return (
                <label key={card.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-800">
                  <input type="checkbox" checked={selectedCardIds.has(card.id)} disabled={isGenerating} onChange={() => toggleCard(card.id)} className="accent-emerald-500" />
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">{season} / {card.rarity} / {card.name}</span>
                  <span className={`shrink-0 text-[10px] ${result === 'failed' ? 'text-rose-400' : result === 'generating' ? 'text-yellow-300' : isRegistered ? 'text-emerald-400' : 'text-zinc-500'}`}>{status}</span>
                </label>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isGenerating ? (
              <button type="button" onClick={() => void runGenerationQueue([...selectedCardIds])} disabled={selectedCardIds.size === 0} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-medium text-white disabled:opacity-40">
                <ImagePlus size={15} /> 選択した{selectedCardIds.size}件を生成
              </button>
            ) : <>
              <button type="button" onClick={isPaused ? resumeQueue : pauseQueue} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-700 px-3 py-2.5 text-xs text-white">
                {isPaused ? <Play size={15} /> : <Pause size={15} />}{isPaused ? '再開' : '一時停止'}
              </button>
              <button type="button" onClick={stopQueue} className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300">
                <Square size={14} /> 停止
              </button>
            </>}
            {failedCardIds.length > 0 && !isGenerating && (
              <button type="button" onClick={() => void runGenerationQueue(failedCardIds)} className="flex items-center justify-center gap-2 rounded-lg border border-rose-900 px-3 py-2.5 text-xs text-rose-300">
                <RotateCcw size={14} /> 失敗分を再試行
              </button>
            )}
          </div>
          {isGenerating && <p role="status" className="flex items-center gap-2 text-xs text-zinc-400"><LoaderCircle size={14} className="animate-spin" />{isPaused ? '一時停止中' : `${managedCards.find(({ card }) => card.id === currentQueueCardId)?.card.name ?? '次のカード'}を生成中。停止は現在の画像生成後に反映されます。`}</p>}
          <p className="text-[10px] text-zinc-500">一度に1枚ずつ生成します。生成した画像は512×768のWebPに変換して保存します。</p>
        </section>

        <section className="space-y-3">
          <div>
            <label htmlFor="registered-card-select" className="mb-1.5 block text-xs text-zinc-400">カード</label>
            <select
              id="registered-card-select"
              value={selectedCard?.card.id ?? ''}
              onChange={event => setSelectedCardId(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-500"
            >
              {managedCards.map(({ card, season }) => (
                <option key={card.id} value={card.id}>{season} / {card.rarity} / {card.name}</option>
              ))}
            </select>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!selectedCard || isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900/30 px-3 py-3 text-sm font-medium text-emerald-200 disabled:opacity-50"
          >
            <ImagePlus size={17} />
            {isUploading ? '画像を登録中…' : '画像を追加'}
          </button>
          <p className="text-[10px] text-zinc-500">複数画像を選択できます。最大512×768に圧縮し、この端末に保存します。</p>
          <p className="text-[10px] text-amber-500">登録画像は専用バックアップから復元できます。</p>
          {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
        </section>

        <section aria-label="登録済み画像">
          {selectedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selectedImages.map((src, index) => (
                <div key={`${selectedCard?.card.id}-${index}`} className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
                  <img src={src} alt={`${selectedCard?.card.name} ${index + 1}`} className="aspect-[2/3] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label={`${selectedCard?.card.name}の画像${index + 1}を削除`}
                    className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-1.5 text-xs text-white"
                  >
                    <Trash2 size={13} /> 削除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-y border-zinc-800 py-8 text-center text-sm text-zinc-500">
              このカードには画像がまだ登録されていません。
            </div>
          )}
        </section>
      </div>
    </div>
  );
}