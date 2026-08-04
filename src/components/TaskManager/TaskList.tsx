import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Task } from '../../types';
import TaskModal from './TaskModal';
import { TASK_ICON_MAP } from '../../utils/taskIcons';

interface Props {
  tasks: Task[];
  onAdd: (title: string, frequencyType: Task['frequencyType'], frequencyCount: number, icon?: string, weekDays?: number[], difficulty?: Task['difficulty']) => void;
  onUpdate: (id: string, updates: Partial<Pick<Task, 'title' | 'frequencyType' | 'frequencyCount' | 'icon' | 'weekDays' | 'difficulty'>>) => void;
  onDelete: (id: string) => void;
  onReorder: (tasks: Task[]) => void;
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function TaskList({ tasks, onAdd, onUpdate, onDelete, onReorder }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(tasks);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onReorder(reordered);
  };

  const handleSave = (title: string, frequencyType: Task['frequencyType'], frequencyCount: number, icon?: string, weekDays?: number[], difficulty?: Task['difficulty']) => {
    if (editingTask) {
      onUpdate(editingTask.id, { title, frequencyType, frequencyCount, icon, weekDays, difficulty });
    } else {
      onAdd(title, frequencyType, frequencyCount, icon, weekDays, difficulty);
    }
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDelete = (task: Task) => {
    if (window.confirm(`「${task.title}」を削除しますか？\n関連する履歴もすべて削除されます。`)) {
      onDelete(task.id);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center justify-between">
        <h1 className="font-semibold text-base text-zinc-100">タスク管理</h1>
        <button
          onClick={() => { setEditingTask(null); setShowModal(true); }}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-3 py-2 rounded-full"
        >
          <span className="text-base leading-none">+</span>追加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600 text-sm gap-2">
            <span className="text-4xl">✦</span>
            <p>タスクがありません</p>
            <p className="text-xs">右上の「追加」から作成してください</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col divide-y divide-zinc-800/60">
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(prov, snapshot) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          className={`flex items-center gap-3 py-3 transition-all ${
                            snapshot.isDragging ? 'opacity-80 shadow-lg' : ''
                          }`}
                        >
                          {/* ドラッグハンドル */}
                          <div
                            {...prov.dragHandleProps}
                            className="text-zinc-600 cursor-grab active:cursor-grabbing select-none px-1"
                          >
                            ⋮⋮
                          </div>

                          {/* アイコン */}
                          {task.icon && (() => {
                            const Icon = TASK_ICON_MAP[task.icon!];
                            return Icon ? <Icon size={18} strokeWidth={1.5} className="text-zinc-300 shrink-0" /> : null;
                          })()}

                          {/* タスク情報 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-zinc-100">{task.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {task.frequencyType === 'daily'
                                ? '毎日'
                                : task.frequencyType === 'weekly'
                                ? task.weekDays && task.weekDays.length > 0
                                  ? task.weekDays.map(d => DAY_LABELS[d]).join('・')
                                  : `週 ${task.frequencyCount} 回`
                                : `月 ${task.frequencyCount} 回`
                              }
                            </p>
                          </div>

                          {/* 操作ボタン */}
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleEdit(task)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-700 text-sm"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDelete(task)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-red-900/40 hover:text-red-400 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {(showModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
