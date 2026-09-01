import { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { TASK_ICON_OPTIONS, TASK_ICON_MAP } from '../../utils/taskIcons';

type FrequencyType = Task['frequencyType'];
type Difficulty = Task['difficulty'];

interface Props {
  task?: Task | null;
  onSave: (title: string, frequencyType: FrequencyType, frequencyCount: number, icon?: string, weekDays?: number[], difficulty?: Difficulty, memoEnabled?: boolean, numberEnabled?: boolean) => void;
  onClose: () => void;
}

const FREQ_LABELS: { value: FrequencyType; label: string }[] = [
  { value: 'daily',   label: '毎日' },
  { value: 'weekly',  label: '曜日指定' },
  { value: 'monthly', label: '月 X 回' },
];

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function TaskModal({ task, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(task?.frequencyType ?? 'daily');
  const [frequencyCount, setFrequencyCount] = useState(task?.frequencyCount ?? 1);
  const [icon, setIcon] = useState<string | undefined>(task?.icon);
  const [weekDays, setWeekDays] = useState<number[]>(task?.weekDays ?? []);
  const [difficulty, setDifficulty] = useState<Difficulty>(task?.difficulty ?? 'normal');
  const [memoEnabled, setMemoEnabled] = useState(task?.memoEnabled ?? false);
  const [numberEnabled, setNumberEnabled] = useState(task?.numberEnabled ?? false);

  const toggleWeekDay = (day: number) => {
    setWeekDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setFrequencyType(task.frequencyType);
      setFrequencyCount(task.frequencyCount);
      setIcon(task.icon);
      setWeekDays(task.weekDays ?? []);
      setDifficulty(task.difficulty ?? 'normal');
      setMemoEnabled(task.memoEnabled ?? false);
      setNumberEnabled(task.numberEnabled ?? false);
    }
  }, [task]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (frequencyType === 'weekly' && weekDays.length === 0) return;
    const effectiveCount = frequencyType === 'weekly' ? weekDays.length : frequencyCount;
    onSave(trimmed, frequencyType, effectiveCount, icon, frequencyType === 'weekly' ? weekDays : undefined, difficulty, memoEnabled, numberEnabled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[480px] bg-zinc-900 rounded-t-2xl px-4 pt-4 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
        <h2 className="text-base font-semibold mb-4 text-zinc-100">{task ? 'タスクを編集' : 'タスクを追加'}</h2>

        {/* アイコン選択 */}
        <label className="block text-xs text-zinc-400 mb-2 font-medium">アイコン</label>
        <div className="flex gap-2 flex-wrap mb-4">
          {TASK_ICON_OPTIONS.map(opt => {
            const Icon = TASK_ICON_MAP[opt.key];
            const selected = icon === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setIcon(icon === opt.key ? undefined : opt.key)}
                className={`flex flex-col items-center gap-1.5 w-14 py-2.5 rounded-xl border text-xs transition-all ${
                  selected
                    ? 'bg-zinc-100 border-zinc-100 text-zinc-900'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-[10px] leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* タスク名 */}
        <label className="block text-xs text-zinc-400 mb-1 font-medium">タスク名</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例：朝の読書"
          className="w-full border border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors mb-4"
          autoFocus
        />

        {/* 繰り返し設定 */}
        <label className="block text-xs text-zinc-400 mb-2 font-medium">繰り返し</label>
        <div className="flex gap-2 mb-4">
          {FREQ_LABELS.map(f => (
            <button
              key={f.value}
              onClick={() => setFrequencyType(f.value)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                frequencyType === f.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 曜日選択（週設定） */}
        {frequencyType === 'weekly' && (
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-2 font-medium">対象曜日</label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleWeekDay(idx)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    weekDays.includes(idx)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 回数設定（月設定のみ） */}
        {frequencyType === 'monthly' && (
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-2 font-medium">月の目標回数</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFrequencyCount(c => Math.max(1, c - 1))}
                className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-100 flex items-center justify-center text-lg font-light"
              >
                -
              </button>
              <input
                type="number"
                value={frequencyCount}
                min={1}
                max={31}
                onChange={e => {
                  const val = Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1));
                  setFrequencyCount(val);
                }}
                className="flex-1 text-center text-2xl font-mono font-semibold text-zinc-100 bg-transparent border border-zinc-700 rounded-xl py-1 outline-none focus:border-emerald-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setFrequencyCount(c => Math.min(31, c + 1))}
                className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-100 flex items-center justify-center text-lg font-light"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* 難易度設定 */}
        <label className="block text-xs text-zinc-400 mb-2 font-medium">難易度</label>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setDifficulty('normal')}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              difficulty !== 'hard'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            ノーマル（+5🪙）
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              difficulty === 'hard'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            ハード ★（+10🪙）
          </button>
        </div>

        {/* 追加機能 */}
        <label className="block text-xs text-zinc-400 mb-2 font-medium">追加機能</label>
        <div className="bg-zinc-800 rounded-xl divide-y divide-zinc-700 mb-6">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-zinc-100">メモ</p>
              <p className="text-xs text-zinc-500">タスクに自由記述メモを記録</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={memoEnabled}
              onClick={() => setMemoEnabled(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                memoEnabled ? 'bg-emerald-600' : 'bg-zinc-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                memoEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-zinc-100">数値入力</p>
              <p className="text-xs text-zinc-500">タスクに数値を記録</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={numberEnabled}
              onClick={() => setNumberEnabled(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                numberEnabled ? 'bg-emerald-600' : 'bg-zinc-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                numberEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!title.trim() || (frequencyType === 'weekly' && weekDays.length === 0)}
          className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-30 transition-opacity"
        >
          {task ? '保存する' : '追加する'}
        </button>
      </div>
    </div>
  );
}
