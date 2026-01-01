
import React, { useState, useEffect } from 'react';
import { GameState, GameSetup, PlayerAssignment } from './types';
import { generateGameAssignments } from './services/geminiService';
import { PlayerCard } from './components/PlayerCard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [themeInput, setThemeInput] = useState('');
  const [playerCount, setPlayerCount] = useState(5);
  const [spyCount, setSpyCount] = useState(1);
  const [gameData, setGameData] = useState<GameSetup | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timer, setTimer] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (spyCount >= playerCount) {
      setSpyCount(playerCount - 1);
    }
  }, [playerCount]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleStartGame = async () => {
    if (!themeInput.trim()) return;
    setGameState(GameState.LOADING);
    try {
      const data = await generateGameAssignments(themeInput, playerCount, spyCount);
      setGameData(data);
      setGameState(GameState.DEALING);
      setCurrentPlayerIndex(0);
      setTimer(playerCount * 60);
    } catch (error) {
      console.error(error);
      alert("Не удалось начать игру. Попробуйте другую тему.");
      setGameState(GameState.SETUP);
    }
  };

  const handleNextPlayer = () => {
    if (gameData && currentPlayerIndex < gameData.assignments.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      setGameState(GameState.DISCUSSION);
      setIsTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSetup = () => (
    <div className="max-w-md mx-auto space-y-8 py-12 px-4 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">ШПИОН</h1>
        <p className="text-slate-400 font-medium">Параметры вашей миссии</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-8">
        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-400 uppercase tracking-widest flex justify-between">
            Тема игры <span>ОБЯЗАТЕЛЬНО</span>
          </label>
          <input
            type="text"
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            placeholder="Напр: Космос, Профессии, Еда..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Игроков</label>
            <span className="text-3xl font-black text-white leading-none">{playerCount}</span>
          </div>
          <input
            type="range"
            min="3"
            max="12"
            value={playerCount}
            onChange={(e) => setPlayerCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Шпионов</label>
            <span className="text-3xl font-black text-red-500 leading-none">{spyCount}</span>
          </div>
          <input
            type="range"
            min="0"
            max={playerCount - 1}
            value={spyCount}
            onChange={(e) => setSpyCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        <button
          onClick={handleStartGame}
          disabled={!themeInput.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl shadow-lg shadow-blue-900/20 transform transition-all active:scale-95 text-lg uppercase tracking-tighter"
        >
          Начать игру
        </button>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-pulse px-4 text-center">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-blue-500 text-2xl">
          🔍
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-black text-white uppercase tracking-tighter">Шифрование каналов</p>
        <p className="text-slate-400 max-w-xs mx-auto">ИИ придумывает секретные роли и распределяет кодовые слова...</p>
      </div>
    </div>
  );

  const renderDealing = () => {
    if (!gameData) return null;
    const current = gameData.assignments[currentPlayerIndex];
    return (
      <PlayerCard
        key={currentPlayerIndex}
        playerNumber={current.playerId}
        word={current.word}
        onDone={handleNextPlayer}
      />
    );
  };

  const renderDiscussion = () => (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-center animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-4xl font-black text-white italic uppercase">Этап обсуждения</h2>
        <p className="text-slate-400 uppercase tracking-widest text-xs">Вычислите предателей, пока не вышло время</p>
      </div>
      
      <div className="text-8xl font-mono text-blue-400 font-bold tracking-widest tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        {formatTime(timer)}
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-500 font-bold block mb-1">КОМАНДА</span>
            <span className="text-xl font-bold text-white">{playerCount} Агентов</span>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-500 font-bold block mb-1">УГРОЗА</span>
            <span className="text-xl font-bold text-red-400">{spyCount} Шпионов</span>
          </div>
        </div>
        
        <p className="text-slate-300 leading-relaxed text-sm">
          Задавайте вопросы друг другу. Будьте осторожны — лишние детали помогут шпионам. Шпионы должны угадать слово или просто выжить.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`flex-1 py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs shadow-lg ${isTimerRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isTimerRunning ? 'Пауза' : 'Продолжить'}
          </button>
          <button
            onClick={() => setGameState(GameState.REVEAL)}
            className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-900/20"
          >
            Раскрыть роли
          </button>
        </div>
      </div>
    </div>
  );

  const renderReveal = () => {
    if (!gameData) return null;
    const spies = gameData.assignments.filter(a => a.isSpy);
    
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Финал</h2>
          <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Дешифрованные данные</p>
        </div>

        <div className="grid gap-3">
          {gameData.assignments.map((player) => (
            <div 
              key={player.playerId}
              className={`p-5 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-500 ${
                player.isSpy 
                  ? 'bg-red-950/40 border-red-500/50 scale-[1.02]' 
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-1">Агент {player.playerId}</span>
                <span className={`text-2xl font-black uppercase tracking-tight ${player.isSpy ? 'text-red-400' : 'text-white'}`}>
                  {player.word}
                </span>
              </div>
              <div className="text-right">
                {player.isSpy ? (
                  <div className="flex flex-col items-end">
                    <span className="bg-red-600 text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase shadow-lg shadow-red-900/40">Шпион</span>
                  </div>
                ) : (
                  <span className="bg-slate-700 text-slate-400 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase">Мирный</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center space-y-6 shadow-2xl">
          <div className="space-y-1">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Итоговый статус</h3>
             {spies.length > 0 ? (
                <p className="text-xl font-bold text-slate-200">
                  Выявлено шпионов: <span className="text-red-500">{spies.length}</span>
                </p>
              ) : (
                <p className="text-xl font-bold text-slate-200">Шпионов не было. Тест на паранойю пройден!</p>
              )}
          </div>
          
          <button
            onClick={() => setGameState(GameState.SETUP)}
            className="w-full bg-white text-slate-900 font-black py-5 rounded-2xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs shadow-xl"
          >
            Новая миссия
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden selection:bg-blue-500/30">
      <nav className="p-6 flex justify-between items-center border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-900/20">
            Ш
          </div>
          <div>
            <span className="font-black text-white text-lg tracking-tighter block leading-none">ШПИОН</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ПРОТОКОЛ V 2.0</span>
          </div>
        </div>
        {gameState !== GameState.SETUP && (
          <button 
            onClick={() => window.confirm("Прервать миссию и вернуться в штаб?") && setGameState(GameState.SETUP)}
            className="text-[10px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest px-4 py-2 border border-slate-800 rounded-lg"
          >
            Выход
          </button>
        )}
      </nav>

      <main className="container mx-auto px-4">
        {gameState === GameState.SETUP && renderSetup()}
        {gameState === GameState.LOADING && renderLoading()}
        {gameState === GameState.DEALING && renderDealing()}
        {gameState === GameState.DISCUSSION && renderDiscussion()}
        {gameState === GameState.REVEAL && renderReveal()}
      </main>

      {gameState === GameState.SETUP && (
        <footer className="fixed bottom-0 w-full text-center py-6 text-slate-600">
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Зашифрованная сессия &bull; {new Date().getFullYear()}</p>
        </footer>
      )}
    </div>
  );
};

export default App;
