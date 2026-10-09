import { useRef, useState } from 'react';
import { ChevronRight, Copy, Images, RotateCcw } from 'lucide-react';
import type { AppData, CustomSeason, CustomThemeKey, ImageSettings, RegisteredCardImages, ThemeColors, ThemeSettings } from '../../types';
import { exportData, importData } from '../../utils/storage';
import { CUSTOM_THEME_KEYS, DEFAULT_CUSTOM_THEMES, FIXED_THEME_COLORS, THEME_COLOR_GROUPS } from '../../utils/theme';
import CardImageManager from './CardImageManager';

interface Props {
  data: AppData;
  onImport: (data: AppData) => void;
  themeSettings: ThemeSettings;
  onThemeSettingsChange: (settings: ThemeSettings) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  customSeasons: CustomSeason[];
  registeredCardImages: RegisteredCardImages;
  onRegisteredCardImagesChange: (images: RegisteredCardImages) => void;
}

export default function SettingsView({
  data, onImport, themeSettings, onThemeSettingsChange, imageSettings, onImageSettingsChange,
  customSeasons, registeredCardImages, onRegisteredCardImagesChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCardImageManager, setShowCardImageManager] = useState(false);
  const registeredImageCount = Object.values(registeredCardImages).reduce((sum, images) => sum + images.length, 0);
  const selectedCustomKey = CUSTOM_THEME_KEYS.includes(themeSettings.activeTheme as CustomThemeKey)
    ? themeSettings.activeTheme as CustomThemeKey
    : null;
  const selectedCustomTheme = selectedCustomKey ? themeSettings.customThemes[selectedCustomKey] : null;

  const updateCustomTheme = (customTheme: typeof selectedCustomTheme) => {
    if (!selectedCustomKey || !customTheme) return;
    onThemeSettingsChange({
      ...themeSettings,
      customThemes: { ...themeSettings.customThemes, [selectedCustomKey]: customTheme },
    });
  };

  const handleExport = () => {
    exportData(data, themeSettings);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      onImport(imported.data);
      if (imported.themeSettings) onThemeSettingsChange(imported.themeSettings);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '不明なエラー');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 4000);
    }
    // ファイル入力をリセット
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (showCardImageManager) {
    return (
      <CardImageManager
        customSeasons={customSeasons}
        registeredCardImages={registeredCardImages}
        onRegisteredCardImagesChange={onRegisteredCardImagesChange}
        imageConfig={{
          provider: imageSettings.provider,
          hfToken: imageSettings.hfToken || undefined,
          hfModel: imageSettings.hfModel,
          cfWorkerUrl: imageSettings.cfWorkerUrl || undefined,
          cfModel: imageSettings.cfModel,
          aihordeKey: imageSettings.aihordeKey || undefined,
          aihordeModel: imageSettings.aihordeModel,
        }}
        onBack={() => setShowCardImageManager(false)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="nav-surface px-4 pt-4 pb-3 border-b border-zinc-800">
        <h1 className="font-semibold text-base text-[color:var(--text-primary)]">設定</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* テーマ選択 */}
        <section>
          <h2 className="text-xs text-[color:var(--text-muted)] font-medium uppercase tracking-wider mb-3">テーマ</h2>
          <div className="grid grid-cols-5 gap-2">
            {([
              { key: 'black' as const, label: '黒系' },
              { key: 'white-blue' as const, label: '白×青' },
              ...CUSTOM_THEME_KEYS.map(key => ({ key, label: themeSettings.customThemes[key].name })),
            ]).map(option => {
              const selected = themeSettings.activeTheme === option.key;
              const colors = option.key === 'black' || option.key === 'white-blue'
                ? FIXED_THEME_COLORS[option.key]
                : themeSettings.customThemes[option.key].colors;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onThemeSettingsChange({ ...themeSettings, activeTheme: option.key })}
                  style={{
                    background: colors.appBg,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                  className="min-w-0 flex flex-col items-center gap-2 rounded-xl border-2 px-1.5 py-2.5 transition-colors"
                >
                  <div className="flex gap-1">
                    {[colors.navBg, colors.panelBg, colors.primary, colors.complete, colors.skip].map((color, index) => (
                      <span key={`${color}-${index}`} className="h-3 w-3 rounded-full" style={{ background: color }} />
                    ))}
                  </div>
                  <span className="w-full truncate text-center text-[10px] font-medium" style={{ color: colors.textPrimary }}>{option.label}</span>
                </button>
              );
            })}
          </div>

          {selectedCustomKey && selectedCustomTheme && (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <label className="mb-3 block text-xs font-medium text-zinc-300">
                テーマ名
                <input
                  value={selectedCustomTheme.name}
                  maxLength={24}
                  onChange={event => updateCustomTheme({ ...selectedCustomTheme, name: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                />
              </label>
              <div className="mb-3 flex gap-2">
                {(['black', 'white-blue'] as const).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateCustomTheme({ ...selectedCustomTheme, colors: { ...FIXED_THEME_COLORS[key] } })}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-[11px] text-zinc-200 active:bg-zinc-700"
                  >
                    <Copy size={13} /> {key === 'black' ? '黒系を複製' : '白×青を複製'}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="このテーマを初期化"
                  title="初期化"
                  onClick={() => updateCustomTheme(DEFAULT_CUSTOM_THEMES[selectedCustomKey])}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 active:bg-zinc-700"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {THEME_COLOR_GROUPS.map(group => (
                  <details key={group.label} className="rounded-lg border border-zinc-800 px-3">
                    <summary className="cursor-pointer py-2 text-xs font-medium text-zinc-300">{group.label}</summary>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 pb-3">
                      {group.fields.map(field => (
                        <label key={field.key} className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-zinc-400">
                          <span className="truncate">{field.label}</span>
                          <input
                            type="color"
                            aria-label={field.label}
                            value={selectedCustomTheme.colors[field.key]}
                            onChange={event => updateCustomTheme({
                              ...selectedCustomTheme,
                              colors: { ...selectedCustomTheme.colors, [field.key]: event.target.value } as ThemeColors,
                            })}
                            className="h-7 w-9 shrink-0 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>

{/* 画像生成設定 */}
        <section>
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">画像生成</h2>
          <div className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-800 p-1" role="group" aria-label="ガチャ画像の取得方法">
              {([
                { value: 'generate', label: '抽選時に生成' },
                { value: 'registered', label: '登録画像から抽選' },
              ] as const).map(option => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={imageSettings.sourceMode === option.value}
                  onClick={() => onImageSettingsChange({ ...imageSettings, sourceMode: option.value })}
                  className={`rounded-lg px-2 py-2.5 text-xs font-medium transition-colors ${
                    imageSettings.sourceMode === option.value ? 'bg-emerald-700 text-white' : 'text-zinc-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {imageSettings.sourceMode === 'generate' && <>
            {/* プロバイダー選択 */}
            <div className="flex gap-2">
              {(['pollinations', 'huggingface', 'cloudflare', 'aihorde'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => onImageSettingsChange({ ...imageSettings, provider: p })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                    imageSettings.provider === p
                      ? 'bg-emerald-700/30 border-emerald-600 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {p === 'pollinations'
                    ? 'Pollinations'
                    : p === 'huggingface'
                    ? 'Hugging Face'
                    : p === 'cloudflare'
                    ? 'Cloudflare'
                    : 'AI Horde'}
                </button>
              ))}
            </div>

            {/* Hugging Face 設定項目の表示 */}
            {imageSettings.provider === 'huggingface' && (
              <>
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">APIトークン</p>
                  <input
                    type="password"
                    value={imageSettings.hfToken || ''}
                    onChange={e => onImageSettingsChange({ ...imageSettings, hfToken: e.target.value })}
                    placeholder="hf_..."
                    autoComplete="off"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">
                    huggingface.co/settings/tokens でトークンを取得してください
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">モデル</p>
                  <select
                    value={imageSettings.hfModel || ''}
                    onChange={e => onImageSettingsChange({ ...imageSettings, hfModel: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="stabilityai/stable-diffusion-3-medium-diffusers">SD3 Medium（推奨）</option>
                    <option value="black-forest-labs/FLUX.1-schnell">FLUX.1-schnell</option>
                    <option value="black-forest-labs/FLUX.1-dev">FLUX.1-dev</option>
                  </select>
                </div>
                <p className="text-[10px] text-zinc-500">FLUX → nscale  SD3 → hf-inference</p>
              </>
            )}

            {/* Cloudflare Workers AI 設定項目の表示 */}
            {imageSettings.provider === 'cloudflare' && (
              <>
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">Worker URL</p>
                  <input
                    type="text"
                    value={imageSettings.cfWorkerUrl || ''}
                    onChange={e => onImageSettingsChange({ ...imageSettings, cfWorkerUrl: e.target.value })}
                    placeholder="https://cf-ai-proxy.xxxx.workers.dev"
                    autoComplete="off"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">
                    デプロイした Cloudflare Worker の URL を入力してください
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">モデル</p>
                  <select
                    value={imageSettings.cfModel || '@cf/bytedance/stable-diffusion-xl-lightning'}
                    onChange={e => onImageSettingsChange({ ...imageSettings, cfModel: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="@cf/bytedance/stable-diffusion-xl-lightning">SDXL Lightning（高速・推奨）</option>
                    <option value="@cf/black-forest-labs/flux-1-schnell">FLUX.1 Schnell</option>
                    <option value="@cf/stabilityai/stable-diffusion-xl-base-1.0">SDXL Base 1.0</option>
                    <option value="@cf/lykon/dreamshaper-8-lcm">DreamShaper 8 LCM</option>
                  </select>
                </div>
              </>
            )}

            {/* AI Horde設定項目の表示 */}
            {imageSettings.provider === 'aihorde' && (
              <>
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">APIキー（任意）</p>
                  <input
                    type="password"
                    value={imageSettings.aihordeKey || ''}
                    onChange={e => onImageSettingsChange({ ...imageSettings, aihordeKey: e.target.value })}
                    placeholder="0000000000（匿名）"
                    autoComplete="off"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">
                    未入力でも無料利用できます。登録キーを使うと匿名利用より優先度が上がります
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">モデル</p>
                  <select
                    value={imageSettings.aihordeModel || 'Deliberate'}
                    onChange={e => onImageSettingsChange({ ...imageSettings, aihordeModel: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Deliberate">Deliberate</option>
                    <option value="Anything Diffusion">Anything Diffusion</option>
                    <option value="DreamShaper">DreamShaper</option>
                  </select>
                </div>
              </>
            )}

            {/* フッター説明文 */}
            <p className="text-[10px] text-zinc-600">
              {imageSettings.provider === 'pollinations'
                ? 'Pollinations.aiで無料生成（APIキー不要）'
                : imageSettings.provider === 'huggingface'
                ? 'Hugging Faceで生成（トークン必要・失敗時はpollinationsにフォールバック）'
                : imageSettings.provider === 'cloudflare'
                ? 'Cloudflare Workers AIで生成（Worker URLが必要）'
                : 'AI Hordeで無料生成（混雑時は待ち時間が長くなります）'}
            </p>
            </>}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200">カード画像管理</p>
                <p className="mt-1 text-xs text-zinc-500">登録画像 {registeredImageCount} 枚</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCardImageManager(true)}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-200 active:bg-zinc-700"
              >
                <Images size={16} /> 管理する <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* データ管理セクション */}
        <section>
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">データ管理</h2>
          <div className="flex flex-col gap-2">
            {/* エクスポート */}
            <div className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4">
              <p className="font-medium text-sm mb-1 text-zinc-100">バックアップ（エクスポート）</p>
              <p className="text-xs text-zinc-500 mb-3">
                現在のすべてのデータをJSONファイルとして端末に保存します。
              </p>
              <button
                onClick={handleExport}
                className="w-full py-3 rounded-xl border border-zinc-600 text-zinc-100 text-sm font-medium transition-colors active:bg-zinc-700"
              >
                データをエクスポート
              </button>
            </div>

            {/* インポート */}
            <div className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4">
              <p className="font-medium text-sm mb-1 text-zinc-100">復元・移行（インポート）</p>
              <p className="text-xs text-zinc-500 mb-3">
                バックアップファイルを読み込んでデータを上書き復元します。
                現在のデータはすべて置き換えられます。
              </p>
              <button
                onClick={handleImportClick}
                className="w-full py-3 rounded-xl bg-emerald-700 text-white text-sm font-medium transition-opacity active:opacity-80"
              >
                ファイルを選択してインポート
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
              {importStatus === 'success' && (
                <p className="text-xs text-emerald-400 mt-2 text-center">インポートが完了しました ✓</p>
              )}
              {importStatus === 'error' && (
                <p className="text-xs text-red-500 mt-2 text-center">{errorMsg}</p>
              )}
            </div>
          </div>
        </section>

        {/* アプリ情報 */}
        <section>
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">データ概要</h2>
          <div className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">登録タスク数</span>
              <span className="font-mono font-medium text-zinc-100">{data.tasks.length} 件</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">記録数（履歴）</span>
              <span className="font-mono font-medium text-zinc-100">{data.history.length} 件</span>
            </div>
          </div>
        </section>

        {/* バージョン情報 */}
        <section>
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">バージョン情報</h2>
          <div className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">version</span>
              <span className="font-mono font-medium text-zinc-100">1.2.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">update</span>
              <span className="font-mono font-medium text-zinc-100">2026-10-09</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
