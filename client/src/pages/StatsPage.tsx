import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '../api/client';
import { formatDuration, formatSeconds } from '../components/formatTime';
import type { StatsResponse } from '../types';

type Period = 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';

function getPeriodRange(period: Period, customFrom: string, customTo: string): [number, number] {
  const now = new Date();
  switch (period) {
    case 'today':
      return [Math.floor(startOfDay(now).getTime() / 1000), Math.floor(endOfDay(now).getTime() / 1000)];
    case 'week':
      return [Math.floor(startOfWeek(now, { weekStartsOn: 1 }).getTime() / 1000), Math.floor(endOfWeek(now, { weekStartsOn: 1 }).getTime() / 1000)];
    case 'month':
      return [Math.floor(startOfMonth(now).getTime() / 1000), Math.floor(endOfMonth(now).getTime() / 1000)];
    case 'last7':
      return [Math.floor(startOfDay(subDays(now, 6)).getTime() / 1000), Math.floor(endOfDay(now).getTime() / 1000)];
    case 'last30':
      return [Math.floor(startOfDay(subDays(now, 29)).getTime() / 1000), Math.floor(endOfDay(now).getTime() / 1000)];
    case 'custom':
      return [
        Math.floor(startOfDay(new Date(customFrom)).getTime() / 1000),
        Math.floor(endOfDay(new Date(customTo)).getTime() / 1000),
      ];
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Сегодня',
  week: 'Эта неделя',
  month: 'Этот месяц',
  last7: '7 дней',
  last30: '30 дней',
  custom: 'Произвольно',
};

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const [from, to] = getPeriodRange(period, customFrom, customTo);
    setLoading(true);
    api.stats.get(from, to).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [period, customFrom, customTo]);

  const totalSeconds = stats?.totals.reduce((acc, t) => acc + t.total_seconds, 0) ?? 0;
  const nonZero = stats?.totals.filter((t) => t.total_seconds > 0) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Period selector */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex gap-3 items-center mt-3">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <span className="text-gray-500">—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Загрузка...</div>
      ) : (
        <>
          {/* Total */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-4 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Всего за период</div>
            <div className="timer-font text-4xl font-semibold text-white">{formatDuration(totalSeconds)}</div>
          </div>

          {/* Per task breakdown */}
          {nonZero.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-3">📭</div>
              <p>Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nonZero.map((t) => {
                const pct = totalSeconds > 0 ? (t.total_seconds / totalSeconds) * 100 : 0;
                return (
                  <div key={t.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-white font-medium text-sm">{t.name}</span>
                        {t.status === 'archived' && (
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">архив</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="timer-font text-base font-semibold" style={{ color: t.color }}>
                          {formatDuration(t.total_seconds)}
                        </div>
                        <div className="text-xs text-gray-500">{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: t.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Daily breakdown */}
          {stats && stats.daily.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">По дням</h3>
              <div className="space-y-2">
                {(() => {
                  const byDay = stats.daily.reduce<Record<string, typeof stats.daily>>((acc, d) => {
                    (acc[d.day] ??= []).push(d);
                    return acc;
                  }, {});
                  return Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).map(([day, entries]) => {
                    const dayTotal = entries.reduce((s, e) => s + e.seconds, 0);
                    return (
                      <div key={day} className="bg-gray-900/70 border border-gray-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300 font-medium">
                            {format(new Date(day), 'd MMMM, EEEE', { locale: ru })}
                          </span>
                          <span className="timer-font text-sm text-gray-400">{formatSeconds(dayTotal)}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {entries.filter(e => e.seconds > 0).map((e) => (
                            <div key={e.taskId} className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg px-2 py-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                              <span>{e.name}</span>
                              <span className="timer-font text-gray-500">{formatSeconds(e.seconds)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
