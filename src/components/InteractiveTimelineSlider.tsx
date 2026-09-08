import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { TimelineSliderWidgetData } from '../types';

interface InteractiveTimelineSliderProps {
  data: TimelineSliderWidgetData;
  title: string;
  excerpt?: string;
}

export default function InteractiveTimelineSlider({ data, title, excerpt }: InteractiveTimelineSliderProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (!data || !data.phases || data.phases.length === 0) {
    return (
      <div className="w-full text-center p-6 border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
        <p className="text-zinc-500 text-sm">Data timeline slider kosong atau belum dikonfigurasi.</p>
      </div>
    );
  }

  const currentPhase = data.phases[activeIndex];

  return (
    <div id="interactive-timeline-slider" className="w-full max-w-5xl mx-auto my-12 p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
      {/* Eyebrow / Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-full">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Scenario Timeline Slider</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-white leading-tight mb-3">
          {title || data.widgetTitle}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed max-w-3xl">
          {excerpt || data.widgetDescription}
        </p>
      </div>

      {/* Interactive Time Track Slider */}
      <div className="mb-10 p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl">
        <div className="flex justify-between items-center mb-6 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pilih Fase Waktu:</span>
          <span className="flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200/30">
            <Clock className="w-3 h-3" />
            <span>{currentPhase.timeLabel}</span>
          </span>
        </div>

        {/* Labels Track */}
        <div className="relative mb-2">
          <div className="grid grid-cols-4 text-center">
            {data.phases.map((phase, idx) => (
              <button
                key={phase.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex flex-col items-center justify-center transition-all cursor-pointer focus:outline-none ${
                  idx === activeIndex
                    ? 'text-amber-700 dark:text-amber-400 scale-105 font-bold'
                    : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 font-medium'
                }`}
              >
                <span className="text-xs md:text-sm tracking-wide block truncate w-full px-1">{phase.label}</span>
                <span className="text-[10px] md:text-xs opacity-70 mt-1 block truncate w-full px-1">{phase.timeLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* The Slider Element */}
        <div className="relative mt-4 mb-4 px-4">
          {/* Timeline background track */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-zinc-200 dark:bg-zinc-800 rounded transform -translate-y-1/2 z-0"></div>
          
          {/* Timeline colored active track */}
          <div 
            className="absolute top-1/2 left-8 h-1 bg-amber-500/80 dark:bg-amber-400/80 rounded transform -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${(activeIndex / (data.phases.length - 1)) * 100}%`, maxWidth: 'calc(100% - 4rem)' }}
          ></div>

          {/* Input range */}
          <input
            type="range"
            min="0"
            max={data.phases.length - 1}
            value={activeIndex}
            onChange={(e) => setActiveIndex(Number(e.target.value))}
            className="relative w-full h-8 bg-transparent cursor-pointer appearance-none focus:outline-none z-10
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-6 
              [&::-webkit-slider-thumb]:h-6 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-amber-600 
              [&::-webkit-slider-thumb]:border-4
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:active:scale-125
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-amber-600
              [&::-moz-range-thumb]:border-4
              [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:active:scale-125"
          />
        </div>
      </div>

      {/* Dynamic Content Panel */}
      <div className="relative min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ backgroundColor: currentPhase.visual_hex_color || '#fffbeb' }}
            className="p-6 md:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-lg md:text-xl font-extrabold text-zinc-900">
                {currentPhase.fase}
              </h3>
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/80 border border-zinc-300/40 rounded-full text-zinc-800">
                <span>Siklus Biologis</span>
              </span>
            </div>

            {/* Condition Check */}
            <div className="mb-6 pb-6 border-b border-zinc-300/40">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                Kondisi Tubuh & Otak Anak:
              </h4>
              <p className="text-sm md:text-base text-zinc-800 leading-relaxed">
                {currentPhase.kondisi_biologis_anak}
              </p>
            </div>

            {/* Parent Challenges */}
            <div className="mb-8 p-4 bg-white/70 border border-red-200/50 rounded-xl">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-1">
                    Tantangan Khas Jam Ini:
                  </h5>
                  <p className="text-xs md:text-sm text-zinc-800 leading-relaxed font-medium">
                    {currentPhase.tantangan_orang_tua}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Steps */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">
                Langkah Aksi Cerdas (Screen-Free):
              </h4>
              <ul className="space-y-4">
                {currentPhase.langkah_transisi_damai.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 shrink-0 text-xs font-bold bg-white border border-zinc-300 text-zinc-800 rounded-full shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="text-sm md:text-base text-zinc-800 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
