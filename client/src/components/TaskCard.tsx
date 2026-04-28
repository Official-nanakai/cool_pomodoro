import { useState, useEffect, useRef } from 'react';
import { formatDuration } from './formatTime';
import type { Task, ActiveEntry } from '../types';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
];

interface Props {
  task: Task;
  activeEntry: ActiveEntry | undefined;
  onToggle: (task: Task, forceMulti?: boolean) => void;
  onRename: (id: number, name: string) => void;
  onColorChange: (id: number, color: string) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TaskCard({ task, activeEntry, onToggle, onRename, onColorChange, onArchive, onDelete }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRunning = !!activeEntry;

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    setElapsed(nowSec - activeEntry.startedAt);
    const id = setInterval(() => {
      setElapsed(Math.floor(Date.now() / 1000) - activeEntry.startedAt);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, activeEntry?.startedAt]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColors(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function saveRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== task.name) onRename(task.id, trimmed);
    else setEditName(task.name);
    setEditing(false);
  }

  return (
    <div
      className="relative bg-gray-900 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300"
      style={
        isRunning
          ? { border: `1px solid ${task.color}80`, boxShadow: `0 0 20px ${task.color}30` }
          : { border: '1px solid #1f2937' }
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: task.color }}
            onClick={() => { setShowColors(!showColors); setShowMenu(false); }}
          />
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setEditName(task.name); setEditing(false); } }}
              className="bg-transparent border-b border-indigo-500 text-white font-medium text-sm focus:outline-none min-w-0 flex-1"
            />
          ) : (
            <span
              className="text-white font-medium text-sm truncate cursor-pointer hover:text-indigo-300 transition-colors"
              onDoubleClick={() => setEditing(true)}
              title="Двойной клик для переименования"
            >
              {task.name}
            </span>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setShowMenu(!showMenu); setShowColors(false); }}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 min-w-[150px] py-1">
              <button onClick={() => { setEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                <span>✏️</span> Переименовать
              </button>
              <button onClick={() => { setShowColors(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                <span>🎨</span> Цвет
              </button>
              <button onClick={() => { onArchive(task.id); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                <span>📦</span> Архивировать
              </button>
              <div className="border-t border-gray-700 my-1" />
              <button onClick={() => { onDelete(task.id); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                <span>🗑</span> Удалить
              </button>
            </div>
          )}

          {showColors && (
            <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 p-3">
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { onColorChange(task.id, c); setShowColors(false); }}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-gray-800"
                    style={{ backgroundColor: c, outline: task.color === c ? `2px solid ${c}` : undefined, outlineOffset: 2 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timer display */}
      <div
        className="timer-font text-3xl font-semibold text-center py-2 rounded-xl transition-all"
        style={{ color: isRunning ? task.color : '#6b7280' }}
      >
        {formatDuration(elapsed)}
      </div>

      {/* Play/Stop button */}
      <button
        onClick={() => onToggle(task)}
        className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
        style={
          isRunning
            ? { backgroundColor: `${task.color}20`, color: task.color, border: `1px solid ${task.color}50` }
            : { backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151' }
        }
      >
        {isRunning ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
            </svg>
            Стоп
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.8L17 10 6.3 17.2V2.8z" />
            </svg>
            Старт
          </>
        )}
      </button>
    </div>
  );
}
