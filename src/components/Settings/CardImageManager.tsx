import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import type { CustomSeason, RegisteredCardImages } from '../../types';
import { CARD_MASTER } from '../../utils/cardMaster';
import { CARD_MASTER as CARD_MASTER_2 } from '../../utils/cardMaster2';

interface Props {
  customSeasons: CustomSeason[];
  registeredCardImages: RegisteredCardImages;
  onRegisteredCardImagesChange: (images: RegisteredCardImages) => void;
  onBack: () => void;
}

async function optimizeUploadedImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name}: 画像ファイルを選択してください。`);
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: 10MB以下の画像を選択してください。`);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 512 / bitmap.width, 768 / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('画像を処理できませんでした。');
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('画像を圧縮できませんでした。')), 'image/webp', 0.82);
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    reader.readAsDataURL(blob);
  });
}

export default function CardImageManager({
  customSeasons, registeredCardImages, onRegisteredCardImagesChange, onBack,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedCardId, setSelectedCardId] = useState(CARD_MASTER[0].id);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const managedCards = useMemo(() => [
    ...CARD_MASTER.map(card => ({ card, season: 'ベースシーズン' })),
    ...CARD_MASTER_2.map(card => ({ card, season: 'シーズン2' })),
    ...customSeasons.flatMap(season => season.cards.map(card => ({ card, season: season.theme }))),
  ], [customSeasons]);
  const selectedCard = managedCards.find(({ card }) => card.id === selectedCardId) ?? managedCards[0];
  const selectedImages = registeredCardImages[selectedCard?.card.id] ?? [];
  const registeredImageCount = Object.values(registeredCardImages).reduce((sum, images) => sum + images.length, 0);

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
          <p className="text-[10px] text-amber-500">登録画像は通常のJSONバックアップには含まれません。</p>
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