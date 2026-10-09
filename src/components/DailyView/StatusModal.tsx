import type { Task, TaskStatus } from '../../types';

interface Props {
  task: Task;
  currentStatus: TaskStatus;
  onSelect: (status: TaskStatus) => void;
  onClose: () => void;
}

const OPTIONS: { status: TaskStatus; label: string; icon: string }[] = [
  { status: 'pending', label: '未完了', icon: '○' },
  { status: 'skipped', label: 'やらない', icon: '—' },
  { status: 'completed', label: '完了', icon: '✓' },
];

export default function StatusModal({ task, currentStatus, onSelect, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-[480px] bg-zinc-900 rounded-t-2xl px-4 pt-4 pb-8 safe-area-pb"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
        <p className="text-center text-sm text-zinc-400 mb-4 font-medium">{task.title}</p>
        <div className="flex flex-col gap-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.status}
              onClick={() => onSelect(opt.status)}
              style={currentStatus === opt.status ? {
                backgroundColor: `var(--theme-${opt.status === 'completed' ? 'complete' : opt.status === 'skipped' ? 'skip' : 'primary'})`,
                color: `var(--theme-${opt.status === 'completed' ? 'complete-text' : opt.status === 'skipped' ? 'skip-text' : 'primary-text'})`,
                borderColor: 'transparent',
              } : undefined}
              className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                currentStatus === opt.status
                  ? ''
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700 active:bg-zinc-700'
              }`}
            >
              <span className="w-6 text-center font-mono">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
