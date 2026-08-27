import type { AppView } from '../../types';

interface Props {
  current: AppView;
  onChange: (view: AppView) => void;
}

const NAV_ITEMS: { view: AppView; label: string; icon: string }[] = [
  { view: 'daily', label: '今日', icon: '○' },
  { view: 'tasks', label: 'タスク', icon: '☰' },
  { view: 'statistics', label: '統計', icon: '▦' },
  { view: 'gacha', label: 'ガチャ', icon: '✦' },
  { view: 'settings', label: '設定', icon: '◎' },
];

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="flex border-t border-zinc-800 nav-surface shrink-0 pb-safe">
      {NAV_ITEMS.map(item => (
        <button
          key={item.view}
          onClick={() => onChange(item.view)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
            current === item.view ? 'text-zinc-100' : 'text-zinc-600'
          }`}
        >
          <span className={`text-base leading-none ${item.view === 'gacha' && current === item.view ? 'text-yellow-400' : ''}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-medium">{item.label}</span>
          {current === item.view && (
            <div className={`w-1 h-1 rounded-full mt-0.5 ${item.view === 'gacha' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
          )}
        </button>
      ))}
    </nav>
  );
}
