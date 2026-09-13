import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Award, Star, HelpCircle, ThumbsUp, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { BattleCardWidgetData } from '../types';
import { getOptimizedImageUrl, getResponsiveSrcSet } from '../lib/imageUtils';

interface InteractiveBattleCardProps {
  config: BattleCardWidgetData;
}

export default function InteractiveBattleCard({ config }: InteractiveBattleCardProps) {
  const {
    widgetTitle,
    widgetDescription,
    comparisonCriteria = [],
    optionA,
    optionB,
    verdictTitle,
    verdictContent,
  } = config;

  const [activeTab, setActiveTab] = useState<'compare' | 'option_a' | 'option_b' | 'verdict'>('compare');
  const [hasRevealedVerdict, setHasRevealedVerdict] = useState<boolean>(false);

  if (!optionA || !optionB) {
    return (
      <div className="w-full max-w-3xl mx-auto my-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Data pembanding (Option A & B) belum didefinisikan untuk widget Battle Card ini.
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-10 p-5 sm:p-7 rounded-3xl bg-[#faf9f6] dark:bg-zinc-900/50 border border-[#f2ece0] dark:border-zinc-800 shadow-xs">
      {/* Widget Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-black tracking-widest text-rose-600 dark:text-rose-400 uppercase">
            Analisis Komparasi Interaktif
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

      {/* Interactive Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 mb-6 p-1 bg-slate-100/60 dark:bg-zinc-800/40 rounded-xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all ${
            activeTab === 'compare'
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Komparasi
        </button>
        <button
          onClick={() => setActiveTab('option_a')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all ${
            activeTab === 'option_a'
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {optionA.name}
        </button>
        <button
          onClick={() => setActiveTab('option_b')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all ${
            activeTab === 'option_b'
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {optionB.name}
        </button>
        <button
          onClick={() => setActiveTab('verdict')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all ${
            activeTab === 'verdict'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Keputusan
        </button>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                      {optionA.badge || 'Opsi A'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(optionA.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {optionA.image && (
                    <img
                      src={getOptimizedImageUrl(optionA.image, { width: 400, quality: 60 })}
                      srcSet={getResponsiveSrcSet(optionA.image, [300, 500], 60)}
                      sizes="(max-width: 640px) 100vw, 350px"
                      alt={optionA.name}
                      width={350}
                      height={140}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-32 object-cover rounded-xl mb-3.5"
                    />
                  )}
                  <h4 className="text-base font-serif font-black text-slate-800 dark:text-white mb-2">
                    {optionA.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {optionA.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black block">Cocok Untuk:</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{optionA.bestFor}</p>
                </div>
              </div>

              {/* Option B card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                      {optionB.badge || 'Opsi B'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(optionB.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {optionB.image && (
                    <img
                      src={getOptimizedImageUrl(optionB.image, { width: 400, quality: 60 })}
                      srcSet={getResponsiveSrcSet(optionB.image, [300, 500], 60)}
                      sizes="(max-width: 640px) 100vw, 350px"
                      alt={optionB.name}
                      width={350}
                      height={140}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-32 object-cover rounded-xl mb-3.5"
                    />
                  )}
                  <h4 className="text-base font-serif font-black text-slate-800 dark:text-white mb-2">
                    {optionB.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {optionB.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black block">Cocok Untuk:</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{optionB.bestFor}</p>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Criteria */}
            {comparisonCriteria && comparisonCriteria.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-[#f2ece0] dark:border-zinc-800 shadow-xs">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-black tracking-widest block mb-3.5 text-center">
                  Metrik & Parameter Perbandingan
                </span>
                <div className="space-y-3.5">
                  {comparisonCriteria.map((criterion, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800/40 last:border-0 gap-1 sm:gap-4">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {criterion}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
                          {optionA.name}: Optimal
                        </span>
                        <span className="text-xs text-slate-400 font-medium">vs</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                          {optionB.name}: Stabil
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'option_a' && (
          <motion.div
            key="option_a"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <h4 className="text-lg font-serif font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-indigo-500" />
                Detail {optionA.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                {optionA.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/30">
                  <h5 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" /> Kelebihan / Pros
                  </h5>
                  <ul className="space-y-2">
                    {optionA.strengths && optionA.strengths.map((str, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/30">
                  <h5 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Kekurangan / Cons
                  </h5>
                  <ul className="space-y-2">
                    {optionA.weaknesses && optionA.weaknesses.map((weak, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-amber-400 dark:bg-amber-500 rounded-full shrink-0 mt-2" />
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'option_b' && (
          <motion.div
            key="option_b"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <h4 className="text-lg font-serif font-black text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-emerald-500" />
                Detail {optionB.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                {optionB.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30">
                  <h5 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Kelebihan / Pros
                  </h5>
                  <ul className="space-y-2">
                    {optionB.strengths && optionB.strengths.map((str, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/30">
                  <h5 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Kekurangan / Cons
                  </h5>
                  <ul className="space-y-2">
                    {optionB.weaknesses && optionB.weaknesses.map((weak, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-amber-400 dark:bg-amber-500 rounded-full shrink-0 mt-2" />
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'verdict' && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white dark:bg-zinc-800 border border-[#f2ece0] dark:border-zinc-800 shadow-xs"
          >
            {!hasRevealedVerdict ? (
              <div className="space-y-4 py-8">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-xs border border-rose-100 dark:border-rose-900/40">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-black text-slate-800 dark:text-white">
                    Siap Melihat Keputusan & Verdict Akhir?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Klik tombol di bawah ini untuk menampilkan ringkasan rekomendasi medis & praktis dari tim redaksi kami.
                  </p>
                </div>
                <button
                  onClick={() => setHasRevealedVerdict(true)}
                  className="px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 transition-all transform hover:-translate-y-0.5"
                >
                  Buka Rekomendasi Verdict
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 py-3 text-left w-full"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400">
                    <Award className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-rose-600 dark:text-rose-400 uppercase block leading-none">Keputusan Terpadu</span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white font-serif">{verdictTitle || 'Verdict & Rekomendasi Akhir'}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif bg-rose-50/30 dark:bg-rose-950/10 p-4 rounded-xl border border-rose-100/40 dark:border-rose-950/20">
                  {verdictContent}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic">Disusun berdasarkan studi literatur & rekomendasi medis.</span>
                  <button
                    onClick={() => setHasRevealedVerdict(false)}
                    className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-all"
                  >
                    Sembunyikan
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
