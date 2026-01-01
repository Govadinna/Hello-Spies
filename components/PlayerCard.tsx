
import React, { useState } from 'react';

interface PlayerCardProps {
  playerNumber: number;
  word: string;
  onDone: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ playerNumber, word, onDone }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto p-4 animate-fade-in">
      <h2 className="text-3xl font-bold text-blue-400 uppercase tracking-tighter">ИГРОК {playerNumber}</h2>
      
      <div className="perspective-1000 w-full h-80 cursor-pointer" onClick={() => setIsRevealed(!isRevealed)}>
        <div className={`flip-card-inner w-full h-full relative ${isRevealed ? 'flip-card-flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front bg-slate-800 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-lg text-slate-400 text-center font-bold uppercase tracking-tight">Нажми, чтобы увидеть слово</p>
            <p className="text-sm text-slate-500 mt-4 italic">Убедись, что никто не смотрит!</p>
          </div>
          
          {/* Back */}
          <div className="flip-card-back bg-blue-600 border-2 border-blue-400 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-blue-200 mb-2 font-bold">Твое секретное слово</span>
            <p className="text-4xl font-black text-white text-center uppercase tracking-tighter">{word}</p>
            <p className="text-sm text-blue-200 mt-8 opacity-70">Нажми, чтобы скрыть</p>
          </div>
        </div>
      </div>

      {isRevealed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
          className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-colors shadow-xl uppercase tracking-widest text-sm"
        >
          Я запомнил слово
        </button>
      )}
    </div>
  );
};
