import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, RotateCcw, AlertCircle, Heart, Zap, Plus, Check, RefreshCw, Star, Info } from 'lucide-react';
import { HabitSimulatorWidgetData } from '../types';

interface InteractiveHabitSimulatorProps {
  config: HabitSimulatorWidgetData;
}

export default function InteractiveHabitSimulator({ config }: InteractiveHabitSimulatorProps) {
  const { widgetTitle, widgetDescription, baselineScore = 50, habits = [], habitTips = [] } = config;

  // Track completed habits/tasks in the current simulation session
  const [activeHabitIds, setActiveHabitIds] = useState<string[]>([]);
  const [simulatedDays, setSimulatedDays] = useState<number>(1);

  if (!habits || habits.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Belum ada daftar habit yang didefinisikan untuk widget Simulasi Kebiasaan ini.
      </div>
    );
  }

  const handleToggleHabit = (id: string) => {
    setActiveHabitIds((prev) =>
      prev.includes(id) ? prev.filter((hId) => hId !== id) : [...prev, id]
    );
  };

  const handleResetSimulation = () => {
    setActiveHabitIds([]);
    setSimulatedDays(1);
  };

  // Calculate simulated score over the days
  const calculateTotalScore = () => {
    let dailyDelta = 0;
    habits.forEach((habit) => {
      if (activeHabitIds.includes(habit.id)) {
        dailyDelta += habit.impactScore;
      }
    });

    const compoundedScore = baselineScore + (dailyDelta * simulatedDays);
    return Math.max(0, Math.min(100, compoundedScore));
  };

  const totalScore = calculateTotalScore();
  const progressRatio = totalScore / 100;

  return (
    <div className="w-full max-w-2xl mx-auto my-10 p-5 sm:p-7 rounded-3xl bg-[#faf9f6] dark:bg-zinc-900/50 border border-[#f2ece0] dark:border-zinc-800 shadow-xs">
      {/* Widget Header */}
      <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
            <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400">
              <Zap className="w-4 h-4 text-amber-500" />
            </span>
            <span className="text-[10px] font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase">
              Simulator Kebiasaan Efektif
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-black text-slate-900 dark:text-white leading-tight">
            {widgetTitle}
          </h3>
          {widgetDescription && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {widgetDescription}
            </p>
          )}
        </div>
        <button
          onClick={handleResetSimulation}
          className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all"
          title="Reset Simulasi"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Side: Habit Lists */}
        <div className="space-y-4">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
            Pilih Rutinitas / Toggles Kebiasaan:
          </div>
          <div className="space-y-3">
            {habits.map((habit) => {
              const isActive = activeHabitIds.includes(habit.id);
              return (
                <div
                  key={habit.id}
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500 text-slate-800 dark:text-white'
                      : 'bg-white dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-black block leading-tight">{habit.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-1.5 rounded-sm ${
                        habit.impactScore > 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {habit.impactScore > 0 ? `+${habit.impactScore}` : habit.impactScore} Poin
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 italic block truncate">
                        Cue: {habit.cue}
                      </span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Compounding Simulator Details */}
        <div className="space-y-5 bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-xs">
          {/* Days Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <span>Waktu Simulasi (Hari)</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                {simulatedDays} Hari
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={simulatedDays}
              onChange={(e) => setSimulatedDays(Number(e.target.value))}
              className="w-full accent-emerald-500 dark:accent-emerald-400 bg-slate-100 dark:bg-zinc-700 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-400 font-black">
              <span>Hari 1</span>
              <span>Hari 15</span>
              <span>Hari 30</span>
            </div>
          </div>

          {/* Core Compounding Gauge */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Indeks Kebiasaan</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{totalScore} / 100</span>
            </div>
            {/* Elegant ProgressBar */}
            <div className="w-full h-4 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-zinc-700">
              <div
                className="h-full rounded-full transition-all duration-300 relative bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${totalScore}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Prediction feedback */}
          <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/40 dark:border-indigo-950/20 text-left space-y-1">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider">Prediksi Komparatif</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif">
              {totalScore >= 75
                ? 'Luar biasa! Kombinasi habit positif Anda secara signifikan akan mempercepat pembentukan kedisiplinan dan kekebalan mental anak/keluarga dalam jangka panjang.'
                : totalScore >= 45
                ? 'Hasil moderat. Beberapa pemicu (cue) masih dapat dioptimalkan agar habit sehat berjalan dengan minim hambatan psikologis.'
                : 'Sinyal waspada. Skenario rutinitas harian yang berjalan menunjukkan kecenderungan penurunan produktivitas atau tingkat kebugaran.'}
            </p>
          </div>
        </div>
      </div>

      {/* Habit tips list */}
      {habitTips && habitTips.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-3">
            Tips Pengondisian Lingkungan (Habit Loop):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {habitTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
