import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import AuthPage from './components/AuthPage';
import TimerPage from './pages/TimerPage';
import StatsPage from './pages/StatsPage';

export default function App() {
  const { token, username, logout, activeEntries } = useStore();

  if (!token) return <AuthPage />;

  const runningCount = activeEntries.length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏱</span>
              <span className="font-bold text-white text-sm">TimeTrack</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/timers"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                Таймеры
                {runningCount > 0 && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                Статистика
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm hidden sm:block">{username}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/timers" replace />} />
          <Route path="/timers" element={<TimerPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
}
