import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import MultiTimerWarning from '../components/MultiTimerWarning';
import type { Task } from '../types';

export default function TimerPage() {
  const { tasks, activeEntries, setTasks, upsertTask, removeTask, setActiveEntries, startEntry, stopEntry, stopAll } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [warningTask, setWarningTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const activeTasks = tasks.filter((t) => t.status === 'active');
  const archivedTasks = tasks.filter((t) => t.status === 'archived');

  useEffect(() => {
    Promise.all([api.tasks.list(), api.timer.active()]).then(([t, a]) => {
      setTasks(t);
      setActiveEntries(a);
      setLoading(false);
    });
  }, []);

  const handleToggle = useCallback(
    async (task: Task, forceMulti = false) => {
      const entry = activeEntries.find((e) => e.taskId === task.id);

      if (entry) {
        await api.timer.stop(task.id);
        stopEntry(task.id);
        return;
      }

      // Check if another timer is already running
      if (activeEntries.length > 0 && !forceMulti) {
        setWarningTask(task);
        return;
      }

      if (!forceMulti && activeEntries.length === 0) {
        // Normal start: stop all (shouldn't be any) then start
        const res = await api.timer.start(task.id);
        stopAll();
        startEntry({ entryId: res.entryId, taskId: task.id, startedAt: Math.floor(Date.now() / 1000) });
      } else {
        // Multi or confirmed: start without stopping existing
        const res = await api.timer.start(task.id);
        startEntry({ entryId: res.entryId, taskId: task.id, startedAt: Math.floor(Date.now() / 1000) });
      }
    },
    [activeEntries]
  );

  async function handleWarningCancel() {
    // Stop current, start new
    await api.timer.stop();
    stopAll();
    if (warningTask) {
      const res = await api.timer.start(warningTask.id);
      startEntry({ entryId: res.entryId, taskId: warningTask.id, startedAt: Math.floor(Date.now() / 1000) });
    }
    setWarningTask(null);
  }

  async function handleWarningConfirm() {
    if (!warningTask) return;
    const res = await api.timer.start(warningTask.id);
    startEntry({ entryId: res.entryId, taskId: warningTask.id, startedAt: Math.floor(Date.now() / 1000) });
    setWarningTask(null);
  }

  async function handleAdd(name: string, color: string) {
    const task = await api.tasks.create(name, color);
    upsertTask(task);
  }

  async function handleRename(id: number, name: string) {
    const task = await api.tasks.update(id, { name });
    upsertTask(task);
  }

  async function handleColorChange(id: number, color: string) {
    const task = await api.tasks.update(id, { color });
    upsertTask(task);
  }

  async function handleArchive(id: number) {
    if (activeEntries.find((e) => e.taskId === id)) {
      await api.timer.stop(id);
      stopEntry(id);
    }
    const task = await api.tasks.update(id, { status: 'archived' });
    upsertTask(task);
  }

  async function handleUnarchive(id: number) {
    const task = await api.tasks.update(id, { status: 'active' });
    upsertTask(task);
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить задачу и всю её историю времени?')) return;
    if (activeEntries.find((e) => e.taskId === id)) {
      await api.timer.stop(id);
      stopEntry(id);
    }
    await api.tasks.delete(id);
    removeTask(id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Active tasks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            activeEntry={activeEntries.find((e) => e.taskId === task.id)}
            onToggle={handleToggle}
            onRename={handleRename}
            onColorChange={handleColorChange}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        ))}

        {/* Add task button */}
        <button
          onClick={() => setShowAdd(true)}
          className="border-2 border-dashed border-gray-700 hover:border-indigo-500/60 hover:bg-indigo-950/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-indigo-400 transition-all duration-200 min-h-[180px]"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Добавить задачу</span>
        </button>
      </div>

      {/* Archived section */}
      {archivedTasks.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Архив ({archivedTasks.length})
          </h3>
          <div className="space-y-2">
            {archivedTasks.map((task) => (
              <div key={task.id} className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full opacity-50" style={{ backgroundColor: task.color }} />
                  <span className="text-gray-400 text-sm">{task.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleUnarchive(task.id)} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors px-2 py-1 hover:bg-gray-800 rounded-lg">
                    Восстановить
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 hover:bg-gray-800 rounded-lg">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddTaskModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {warningTask && (
        <MultiTimerWarning
          taskName={warningTask.name}
          onConfirm={handleWarningConfirm}
          onCancel={handleWarningCancel}
        />
      )}
    </div>
  );
}
