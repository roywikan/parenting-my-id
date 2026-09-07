import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { CorePillar } from '../types';

interface InteractiveShowcaseProps {
  pillars: CorePillar[];
  title: string;
  subtitle?: string;
}

// Dynamic icon renderer from Lucide package
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name] || Icons.Sparkles;
  return <IconComponent className={className} />;
}

export default function InteractiveShowcase({ pillars, title, subtitle }: InteractiveShowcaseProps) {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  if (!pillars || pillars.length === 0) {
    return null;
  }

  const activePillar = useMemo(() => {
    return pillars[activeIdx] || pillars[0];
  }, [activeIdx, pillars]);

  return (
    <div id="interactive-showcase" className="w-full max-w-6xl mx-auto my-12 p-4 sm:p-6 lg:p-8 rounded-3xl bg-[#fdfcf9] dark:bg-zinc-900/50 border border-[#f3eee0] dark:border-zinc-800 shadow-xs">
      
      {/* Header section with refined typography */}
      <div className="mb-8 text-center sm:text-left max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column (5 columns): Vertical Tab Cards */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {pillars.map((pillar, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={pillar.id || idx}
                onClick={() => setActiveIdx(idx)}
                className={`w-full text-left p-4.5 rounded-[16px] border transition-all duration-300 flex items-start gap-4 cursor-pointer focus:outline-none relative group ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 border-[#f2a18f] dark:border-rose-500/50 shadow-xs'
                    : 'bg-white/65 dark:bg-zinc-900/40 border-transparent hover:bg-white dark:hover:bg-zinc-900 hover:border-slate-200 dark:hover:border-zinc-800'
                }`}
              >
                {/* Icon box container with cozy sizes */}
                <div
                  className={`p-3 rounded-xl shrink-0 transition-colors duration-300 flex items-center justify-center ${
                    isActive
                      ? 'bg-[#fef4f0] dark:bg-rose-950/50 text-[#e67e65] dark:text-rose-400'
                      : 'bg-[#f4f6f8] dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 group-hover:bg-[#ebedf0] dark:group-hover:bg-zinc-750'
                  }`}
                >
                  <DynamicIcon name={pillar.icon} className="w-5 h-5 shrink-0" />
                </div>

                {/* Text fields wrapping elegantly */}
                <div className="space-y-1 min-w-0 flex-1">
                  <h4
                    className={`text-sm sm:text-base font-bold transition-colors ${
                      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-zinc-300'
                    }`}
                  >
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2">
                    {pillar.desc || pillar.longDesc || pillar.content}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column (7 columns): Detailed Info Panel Card */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-[#f0eee6] dark:border-zinc-800 rounded-3xl p-6 sm:p-8 min-h-[460px] flex flex-col justify-between shadow-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="space-y-6">
                
                {/* Top Row: Eyebrow badge */}
                <div>
                  <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold text-[#e67e65] dark:text-rose-400 bg-[#fef2ee] dark:bg-rose-950/40 rounded-full border border-[#fde2d8] dark:border-rose-950/20 uppercase tracking-widest">
                    Pilar {activeIdx + 1}
                  </span>
                </div>

                {/* Big Title & Long Description */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight mb-3">
                    {activePillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {activePillar.longDesc || activePillar.content}
                  </p>
                </div>

                {/* Green Challenge Banner (Tantangan Harian) */}
                {activePillar.challenge && (
                  <div className="bg-[#eefcf5] dark:bg-emerald-950/20 border border-[#d1f2e0] dark:border-emerald-950/30 rounded-2xl p-4.5">
                    <div className="flex items-center gap-1.5 text-[#1b7a43] dark:text-emerald-400">
                      <Icons.Zap className="w-4 h-4 fill-[#1b7a43] dark:fill-emerald-400 text-transparent shrink-0" />
                      <h5 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        {activePillar.challengeTitle || 'FOKUS / HIGHLIGHT UTAMA'}
                      </h5>
                    </div>
                    <p className="text-xs sm:text-sm text-[#115e30] dark:text-emerald-300 font-semibold leading-relaxed mt-1.5">
                      {activePillar.challenge}
                    </p>
                  </div>
                )}

                {/* Practical Tips List */}
                {activePillar.tips && activePillar.tips.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h5 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Butir Rincian & Langkah Detail:
                    </h5>
                    <ul className="space-y-3">
                      {activePillar.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                          {/* Bullet marker representing the exact design in the image */}
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e67e65] dark:bg-rose-500 shrink-0 mt-2" />
                          <span className="leading-relaxed font-medium">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Detail Card Footer */}
              <div className="flex items-center justify-between border-t border-[#f0eee6] dark:border-zinc-800 pt-5 mt-6">
                {/* Footnote Benefit label */}
                <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 text-xs font-medium">
                  <Icons.Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500/10 shrink-0" />
                  <span>{activePillar.footnote || 'Keterangan Tambahan'}</span>
                </div>

                {/* Child-friendly methodology branding label */}
                <div className="text-[#2ca58d] dark:text-emerald-400 text-xs font-bold tracking-wide">
                  {activePillar.methodology || 'Kategori Terkait'}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
