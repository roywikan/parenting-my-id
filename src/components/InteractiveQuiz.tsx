import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RotateCcw, AlertCircle, HelpCircle, Award } from 'lucide-react';
import { QuizWidgetConfig } from '../types';

interface InteractiveQuizProps {
  config: QuizWidgetConfig;
}

export default function InteractiveQuiz({ config }: InteractiveQuizProps) {
  const { widgetTitle, widgetDescription, baseScore = 80, pointsPerCorrect = 15, questions = [] } = config;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState<boolean>(false);

  // Fallback in case of empty questions array
  if (!questions || questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Belum ada soal kuis yang didefinisikan untuk widget ini.
      </div>
    );
  }

  const activeQuestion = questions[currentStep];
  const progressPercent = Math.round(((currentStep) / questions.length) * 100);

  // Score Calculation
  const getCorrectAnswersCount = () => {
    let count = 0;
    questions.forEach((q, idx) => {
      const selectedOptIdx = selectedAnswers[idx];
      if (selectedOptIdx !== undefined && q.options[selectedOptIdx]?.isCorrect) {
        count++;
      }
    });
    return count;
  };

  const correctCount = getCorrectAnswersCount();
  const finalScore = baseScore + (correctCount * pointsPerCorrect);

  const handleSelectOption = (optIdx: number) => {
    if (hasCheckedAnswer) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentStep]: optIdx,
    }));
  };

  const handleNextStep = () => {
    setHasCheckedAnswer(false);
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedAnswers({});
    setIsCompleted(false);
    setHasCheckedAnswer(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-10 p-5 sm:p-7 rounded-3xl bg-[#faf9f6] dark:bg-zinc-900/50 border border-[#f2ece0] dark:border-zinc-800 shadow-xs">
      {/* Quiz Header */}
      <div className="mb-6 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
          <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400">
            <HelpCircle className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Uji Pengetahuan & IQ Interaktif
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
        {!isCompleted ? (
          <motion.div
            key={`question-${currentStep}`}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Progress indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                <span>PROGRESS: SOAL {currentStep + 1} DARI {questions.length}</span>
                <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card container */}
            <div className="bg-white dark:bg-zinc-900 border border-[#f0eae0] dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center">
                <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 rounded-md uppercase tracking-wider">
                  {activeQuestion.category || 'Logika'}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100 leading-snug">
                {activeQuestion.question}
              </h4>

              {/* Options list */}
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {activeQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentStep] === idx;
                  
                  let optionStyle = "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-500/[0.01]";
                  if (isSelected) {
                    optionStyle = "border-indigo-500 dark:border-indigo-400 bg-indigo-500/[0.04] dark:bg-indigo-400/[0.05] ring-1 ring-indigo-500/30";
                  }

                  if (hasCheckedAnswer) {
                    if (option.isCorrect) {
                      optionStyle = "border-emerald-500 dark:border-emerald-400 bg-emerald-500/[0.04] dark:bg-emerald-400/[0.05] ring-1 ring-emerald-500/30";
                    } else if (isSelected && !option.isCorrect) {
                      optionStyle = "border-red-500 dark:border-red-400 bg-red-500/[0.04] dark:bg-red-400/[0.05] ring-1 ring-red-500/30";
                    } else {
                      optionStyle = "border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/30 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasCheckedAnswer}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 group text-xs sm:text-sm font-medium ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] sm:text-xs transition-colors duration-150 ${
                          isSelected 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-slate-700 dark:text-zinc-200">
                          {option.text}
                        </span>
                      </div>

                      {hasCheckedAnswer && option.isCorrect && (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      )}
                      {hasCheckedAnswer && isSelected && !option.isCorrect && (
                        <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom action controls */}
            <div className="flex justify-end gap-3 pt-2">
              {!hasCheckedAnswer ? (
                <button
                  type="button"
                  disabled={selectedAnswers[currentStep] === undefined}
                  onClick={() => setHasCheckedAnswer(true)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer"
                >
                  Periksa Jawaban
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
                >
                  {currentStep < questions.length - 1 ? 'Soal Berikutnya →' : 'Selesaikan Tes 🎓'}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="quiz-results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Visual Result Score Card */}
            <div className="p-6 rounded-3xl bg-[#f5fbf7] dark:bg-emerald-950/10 border border-[#e2f3e8] dark:border-emerald-900/30 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  Skor Akhir Anda Terkalkulasi
                </span>
                <h4 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mt-1">
                  {finalScore} <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium font-sans">poin</span>
                </h4>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Anda berhasil menjawab <strong className="text-emerald-600 dark:text-emerald-400">{correctCount} dari {questions.length}</strong> pertanyaan dengan benar. Skor dasar tes ini adalah {baseScore} poin dengan nilai tambah +{pointsPerCorrect} poin per soal yang benar.
              </p>
            </div>

            {/* Answer breakdown mini grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                Rincian Analisis Jawaban Anda
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {questions.map((q, idx) => {
                  const chosenOptIdx = selectedAnswers[idx];
                  const isCorrect = chosenOptIdx !== undefined && q.options[chosenOptIdx]?.isCorrect;
                  const chosenOption = chosenOptIdx !== undefined ? q.options[chosenOptIdx] : null;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-100 dark:border-emerald-950/50 bg-emerald-500/[0.01]'
                          : 'border-red-100 dark:border-red-950/50 bg-red-500/[0.01]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase text-slate-400">
                          SOAL #{idx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="p-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-0.5 rounded-md bg-red-500/10 text-red-500">
                            <XCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                        {q.question}
                      </p>

                      <div className="mt-2 pt-2 border-t border-dashed border-slate-100 dark:border-zinc-800 text-[10px]">
                        <span className="text-slate-400">Pilihan Anda: </span>
                        <strong className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                          {chosenOption ? chosenOption.text : 'Tidak dijawab'}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Restart button action */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mulai Ulang Tes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
