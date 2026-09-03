import { useRef, useState } from 'react';
import type { AppData, ImageSettings } from '../../types';
import type { ThemeKey } from '../../types';
import { exportData, importData } from '../../utils/storage';

interface Props {
  data: AppData;
  onImport: (data: AppData) => void;
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
}

const THEME_OPTIONS: {
  key: ThemeKey;
  label: string;
  bg: string;
  fg: string;
  card: string;
  border: string;
  accent: string;
}[] = [
  { key: 'black',      label: 'ブラック',       bg: '#27272a', fg: '#f4f4f5', card: '#18181b', border: '#3f3f46', accent: '#3b82f6' },
  { key: 'white',      label: 'ホワイト',       bg: '#ffffff', fg: '#18181b', card: '#f4f4f5', border: '#e4e4e7', accent: '#16a34a' },
  { key: 'blue',       label: 'ブルー',         bg: '#1e293b', fg: '#e2e8f0', card: '#0f172a', border: '#334155', accent: '#3b82f6' },
  { key: 'white-blue', label: 'ホワイト×ブルー', bg: '#ffffff', fg: '#18181b', card: '#eff6ff', border: '#dbeafe', accent: '#3b82f6' },
  { key: 'sonota-theme', label: 'その他', bg: '#ffffff', fg: '#1616e2', card: '#effff1', border: '#dbfedd', accent: '#f63ba8' },
];

export default function SettingsView({ data, onImport, theme, onThemeChange, imageSettings, onImageSettingsChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExport = () => {
    exportData(data);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      onImport(imported);
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="nav-surface px-4 pt-4 pb-3 border-b border-zinc-800">
        <h1 className="font-semibold text-base text-zinc-100">設定</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* テーマ選択 */}
        <section>
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">テーマ</h2>
          <div className="flex gap-3">
            {THEME_OPTIONS.map(t => {
              const selected = theme === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onThemeChange(t.key)}
                  style={{
                    background: t.bg,
                    borderColor: selected ? '#10b981' : t.border,
                  }}
                  className="flex-1 flex flex-col items-center gap-3 pt-4 pb-3 rounded-2xl border-2 transition-all active:scale-95"
                >
                  {/* ミニUIプレビュー */}
                  <div className="w-full px-2.5 flex flex-col gap-1.5">
                    <div style={{ background: t.fg, opacity: 0.18 }} className="h-2 w-3/4 rounded-full" />
                    <div
                      style={{ background: t.card, borderColor: t.border }}
                      className="rounded-xl p-2 flex flex-col gap-1 border"
                    >
                      <div style={{ background: t.fg, opacity: 0.75 }} className="h-1.5 rounded-full" />
                      <div style={{ background: t.fg, opacity: 0.35 }} className="h-1.5 w-2/3 rounded-full" />
                    </div>
                    <div
                      style={{ background: t.card, borderColor: t.border }}
                      className="rounded-xl p-2 flex flex-col gap-1 border"
                    >
                      <div style={{ background: t.fg, opacity: 0.75 }} className="h-1.5 rounded-full" />
                      <div style={{ background: t.accent, opacity: 0.85 }} className="h-1.5 w-1/2 rounded-full" />
                    </div>
                  </div>
                  {/* ラベル */}
                  <div className="flex items-center gap-1.5">
                    {selected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    <span style={{ color: t.fg }} className="text-[11px] font-medium tracking-wide">
                      {t.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

{/* 画像生成設定 */}
        <section>
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">画像生成</h2>
          <div className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
            {/* プロバイダー選択（3択） */}
            <div className="flex gap-2">
              {(['pollinations', 'huggingface', 'cloudflare'] as const).map(p => (
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
                    : 'Cloudflare'}
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

            {/* フッター説明文 */}
            <p className="text-[10px] text-zinc-600">
              {imageSettings.provider === 'pollinations'
                ? 'Pollinations.aiで無料生成（APIキー不要）'
                : imageSettings.provider === 'huggingface'
                ? 'Hugging Faceで生成（トークン必要・失敗時はpollinationsにフォールバック）'
                : 'Cloudflare Workers AIで生成（Account ID・APIトークン必要）'}
            </p>
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
              <span className="text-zinc-400">バージョン</span>
              <span className="font-mono font-medium text-zinc-100">1.0.6</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">アップデート日</span>
              <span className="font-mono font-medium text-zinc-100">2026-09-03</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
