import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronRight, RotateCcw, Award, CheckCircle2, AlertCircle, ArrowLeft, Lightbulb, ClipboardList } from 'lucide-react';
import { QuizRouterWidgetData, QuizRouterOutcome } from '../types';

interface InteractiveQuizRouterProps {
  config: QuizRouterWidgetData;
}

export default function InteractiveQuizRouter({ config }: InteractiveQuizRouterProps) {
  const { widgetTitle, widgetDescription, questions = [], outcomes = [] } = config;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answersHistory, setAnswersHistory] = useState<string[]>([]); // track targeted outcome IDs
  const [finalOutcome, setFinalOutcome] = useState<QuizRouterOutcome | null>(null);

  if (!questions || questions.length === 0 || !outcomes || outcomes.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Data kuis router (pertanyaan atau pilihan profil) belum dikonfigurasi untuk widget ini.
      </div>
    );
  }

  const activeQuestion = questions[currentStep];
  const progressPercent = Math.round(((currentStep) / questions.length) * 100);

  const handleSelectOption = (targetOutcomeId: string) => {
    const updatedHistory = [...answersHistory, targetOutcomeId];
    setAnswersHistory(updatedHistory);

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // End of quiz: calculate the dominant outcome from history
      // Group and count occurrences of outcome IDs
      const counts: Record<string, number> = {};
      let maxCount = 0;
      let dominantId = targetOutcomeId; // fallback is last selected

      updatedHistory.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
        if (counts[id] > maxCount) {
          maxCount = counts[id];
          dominantId = id;
        }
      });

      // Find the outcome object matching the dominant ID
      const matched = outcomes.find((o) => o.id === dominantId) || outcomes[0];
      setFinalOutcome(matched);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setAnswersHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswersHistory([]);
    setFinalOutcome(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-10 p-5 sm:p-7 rounded-3xl bg-[#faf9f6] dark:bg-zinc-900/50 border border-[#f2ece0] dark:border-zinc-800 shadow-xs">
      {/* Quiz Router Header */}
      <div className="mb-6 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
          <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400">
            <ClipboardList className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            Rekomendasi Solusi & Alur Keputusan
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

      <AnimatePresence mode="wait">
        {!finalOutcome ? (
          <motion.div
            key={`question-${currentStep}`}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Tahap Evaluasi {currentStep + 1} dari {questions.length}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-[#f2ece0]/60 dark:border-zinc-800/80 shadow-xs">
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-black tracking-wider block mb-1">PERTANYAAN ANALISIS</span>
              <h4 className="text-sm sm:text-base font-serif font-black text-slate-800 dark:text-white leading-tight">
                {activeQuestion?.text}
              </h4>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {activeQuestion?.options && activeQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt.targetOutcomeId)}
                  className="w-full p-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-all flex items-center justify-between group"
                >
                  <span className="pr-4">{opt.text}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>

            {/* Back Button */}
            {currentStep > 0 && (
              <button
                onClick={handleBackStep}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke pertanyaan sebelumnya
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Outcome Display Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span
                    className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full"
                    style={{
                      backgroundColor: finalOutcome.badgeColor ? `${finalOutcome.badgeColor}20` : '#e0e7ff',
                      color: finalOutcome.badgeColor || '#4f46e5',
                    }}
                  >
                    Profil Hasil Diagnosis
                  </span>
                  <h4 className="text-base sm:text-lg font-serif font-black text-slate-800 dark:text-white leading-tight">
                    {finalOutcome.title}
                  </h4>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs border border-slate-100"
                  style={{
                    backgroundColor: finalOutcome.badgeColor ? `${finalOutcome.badgeColor}15` : '#f5f5f5',
                    color: finalOutcome.badgeColor || '#4f46e5',
                  }}
                >
                  <Award className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif">
                {finalOutcome.description}
              </p>

              {/* Action Steps */}
              {finalOutcome.actionSteps && finalOutcome.actionSteps.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-emerald-500 animate-bounce" />
                    Rekomendasi Langkah Aksi Praktis:
                  </span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {finalOutcome.actionSteps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Restart Quiz */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ulangi Tes Diagnosis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
