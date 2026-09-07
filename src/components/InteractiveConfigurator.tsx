import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
import { InteractiveConfiguratorData, InteractiveRecommendation } from '../types';

interface InteractiveConfiguratorProps {
  data: InteractiveConfiguratorData;
  title: string;
  excerpt?: string;
}

export default function InteractiveConfigurator({ data, title, excerpt }: InteractiveConfiguratorProps) {
  const [val1, setVal1] = useState<string>('');
  const [val2, setVal2] = useState<string>('');
  const [val3, setVal3] = useState<string>('');
  const [recommendation, setRecommendation] = useState<InteractiveRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const {
    criterion1Name,
    criterion1Options,
    criterion2Name,
    criterion2Options,
    criterion3Name,
    criterion3Options,
    recommendations,
  } = data;

  const handleGenerate = () => {
    if (!val1 || !val2 || !val3) return;

    setIsGenerating(true);

    // Dynamic, satisfying timeout for realistic calculation feel
    setTimeout(() => {
      const key = `${val1}_${val2}_${val3}`;
      const found = recommendations?.[key];

      if (found) {
        setRecommendation(found);
      } else {
        // Dynamic Intelligent Fallback in case the author missed some combinations
        setRecommendation({
          judul: `Solusi Optimal: Kompilasi ${val1} & ${val2}`,
          deskripsi: `Rekomendasi khusus yang dirancang untuk pendampingan ${val1.toLowerCase()} dengan pendekatan berbasis ${val3.toLowerCase()} pada tingkat ${val2.toLowerCase()}.`,
          langkah_implementasi: [
            `Identifikasi prioritas utama untuk ${val1} sesuai kebutuhan kelompok ${val2}.`,
            `Lakukan penyesuaian aktivitas harian berbasis stimulasi ${val3} secara teratur.`,
            `Konsisten melakukan evaluasi mingguan terhadap respon serta kenyamanan anak.`,
          ],
          tips_tambahan: `Pastikan semua pendamping memiliki persepsi yang sama untuk hasil berkelanjutan yang lebih optimal.`,
          visual_hex_color: '#fef3c7', // Warm neutral pastel amber-yellow
        });
      }
      setIsGenerating(false);
    }, 600);
  };

  const handleReset = () => {
    setVal1('');
    setVal2('');
    setVal3('');
    setRecommendation(null);
  };

  const isFormValid = val1 && val2 && val3;

  return (
    <div id="interactive-configurator" class="w-full max-w-6xl mx-auto my-12 p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left Column: Intro & Features */}
        <div class="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Configurator</span>
            </div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-4">
              {title}
            </h2>
            <p class="text-zinc-600 dark:text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
              {excerpt || 'Sesuaikan preferensi Anda di sebelah kanan untuk menghasilkan rekomendasi dan panduan aksi praktis yang terpersonalisasi secara instan.'}
            </p>
          </div>

          <div class="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
            <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
              Keunggulan Fitur
            </h4>
            <ul class="space-y-3.5">
              <li class="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span class="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Instan & Tanpa API Server (Client-Side State)</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span class="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Rekomendasi taktis berbasis skema riset</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span class="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Langkah implementasi aksi konkret yang matang</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Form Selectors & Result Card */}
        <div class="lg:col-span-7 flex flex-col space-y-6">
          <div class="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 md:p-6 space-y-5">
            <h3 class="text-base font-bold text-zinc-900 dark:text-white mb-2">
              Lengkapi Parameter Pilihan Anda
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Criterion 1 */}
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {criterion1Name}
                </label>
                <div class="relative">
                  <select
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    disabled={isGenerating}
                    class="w-full h-11 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 appearance-none disabled:opacity-60"
                  >
                    <option value="">Pilih...</option>
                    {criterion1Options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Criterion 2 */}
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {criterion2Name}
                </label>
                <div class="relative">
                  <select
                    value={val2}
                    onChange={(e) => setVal2(e.target.value)}
                    disabled={isGenerating}
                    class="w-full h-11 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 appearance-none disabled:opacity-60"
                  >
                    <option value="">Pilih...</option>
                    {criterion2Options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Criterion 3 */}
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {criterion3Name}
                </label>
                <div class="relative">
                  <select
                    value={val3}
                    onChange={(e) => setVal3(e.target.value)}
                    disabled={isGenerating}
                    class="w-full h-11 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 appearance-none disabled:opacity-60"
                  >
                    <option value="">Pilih...</option>
                    {criterion3Options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={!isFormValid || isGenerating}
                class="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-sm font-bold rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Lihat Rekomendasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {recommendation && (
                <button
                  onClick={handleReset}
                  class="h-11 px-4 inline-flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-bold rounded-lg transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Results Block */}
          <div class="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              {recommendation ? (
                <motion.div
                  key="result-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    backgroundColor: recommendation.visual_hex_color || '#fafaf9',
                  }}
                  className="p-6 md:p-8 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 shadow-sm"
                >
                  <div class="flex items-start justify-between mb-4">
                    <span class="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-white/70 text-zinc-800 rounded border border-zinc-200/50">
                      Rekomendasi Terpilih
                    </span>
                    <span class="text-xs text-zinc-500 font-medium">Akurasi Tinggi ✓</span>
                  </div>

                  <h3 class="text-lg md:text-xl font-extrabold text-zinc-900 mb-2">
                    {recommendation.judul}
                  </h3>
                  
                  <p class="text-sm md:text-base text-zinc-700 leading-relaxed mb-6 border-b border-zinc-200/60 pb-4">
                    {recommendation.deskripsi}
                  </p>

                  <div class="space-y-4 mb-6">
                    <h4 class="text-xs font-black uppercase tracking-wider text-zinc-500">
                      Langkah Aksi Konkret
                    </h4>
                    <ol class="space-y-3">
                      {recommendation.langkah_implementasi.map((step, idx) => (
                        <li key={idx} class="flex items-start gap-3">
                          <span class="flex items-center justify-center w-5 h-5 shrink-0 text-xs font-bold bg-white border border-zinc-300 text-zinc-800 rounded-full">
                            {idx + 1}
                          </span>
                          <span class="text-sm text-zinc-800 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {recommendation.tips_tambahan && (
                    <div class="bg-white/80 border border-zinc-200/50 rounded-lg p-4">
                      <h5 class="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
                        Tips Tambahan Taktis
                      </h5>
                      <p class="text-xs text-zinc-700 leading-relaxed">
                        {recommendation.tips_tambahan}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  class="flex flex-col items-center justify-center p-8 md:p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/40 dark:bg-zinc-950/20"
                >
                  <div class="w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full mb-4">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h4 class="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Belum Ada Hasil Rekomendasi
                  </h4>
                  <p class="text-xs text-zinc-500 dark:text-zinc-500 max-w-sm leading-relaxed">
                    Silakan tentukan semua sub-kriteria di dropdown atas terlebih dahulu, kemudian klik tombol "Lihat Rekomendasi" untuk merender hasil.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
