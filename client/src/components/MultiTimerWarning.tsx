interface Props {
  taskName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function MultiTimerWarning({ taskName, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-3xl text-center mb-3">⚠️</div>
        <h2 className="text-lg font-bold text-white text-center mb-2">Параллельная работа</h2>
        <p className="text-gray-400 text-sm text-center mb-1">
          Уже запущен другой таймер. Хотите одновременно отслеживать{' '}
          <span className="text-white font-medium">«{taskName}»</span>?
        </p>
        <p className="text-amber-400/80 text-xs text-center mb-6">
          💡 Исследования показывают: многозадачность снижает продуктивность на 40%. Лучше сосредоточиться на одном.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-2.5 rounded-xl transition-colors"
          >
            Остановить прежний
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 font-medium py-2.5 rounded-xl transition-colors"
          >
            Всё равно запустить
          </button>
        </div>
      </div>
    </div>
  );
}
