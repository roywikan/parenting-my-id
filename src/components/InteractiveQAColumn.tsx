import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Send, Heart, UserCheck, MessageSquare, Check, Sparkles, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { InteractiveQAColumnData, QAColumnCase } from '../types';

interface InteractiveQAColumnProps {
  config: InteractiveQAColumnData;
}

export default function InteractiveQAColumn({ config }: InteractiveQAColumnProps) {
  const { widgetTitle, widgetDescription, buttonText, cases = [], submissionPlaceholder } = config;

  // Selected active Q&A case for close inspection, defaults to the first one if present
  const [activeCaseId, setActiveCaseId] = useState<string>(cases[0]?.id || '');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  // Submission Form States
  const [formCategory, setFormCategory] = useState<string>('Umum');
  const [formAgeGender, setFormAgeGender] = useState<string>('');
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedStatus, setSubmittedStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!cases || cases.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2" id="qa-widget-empty">
        <AlertCircle className="w-4 h-4" />
        Data kolom tanya jawab klinis belum dikonfigurasi untuk widget ini.
      </div>
    );
  }

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  // Practical advice steps checked status toggler
  const handleToggleStep = (caseId: string, index: number) => {
    setCheckedSteps((prev) => {
      const caseSteps = prev[caseId] || {};
      return {
        ...prev,
        [caseId]: {
          ...caseSteps,
          [index]: !caseSteps[index],
        },
      };
    });
  };

  // Submit anonymous dilemma simulation
  const handleSubmitDilemma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) return;

    if (formQuestion.length < 20) {
      alert('Mohon tuliskan keluh kesah Anda secara lebih detail (minimal 20 karakter).');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedStatus('success');
      setFormQuestion('');
      setFormAgeGender('');
    }, 1500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-10 space-y-8" id="qa-widget-container">
      {/* Widget Header Section */}
      <div className="text-center sm:text-left border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <span className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <MessageSquare className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
            Kolom Tanya Jawab & Konsultasi Ahli
          </span>
        </div>
        <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white leading-tight">
          {widgetTitle}
        </h3>
        {widgetDescription && (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {widgetDescription}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Cases Sidebar (Left Column) */}
        <div className="md:col-span-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 mb-3">
            Daftar Kasus Pilihan
          </h4>
          {cases.map((c, idx) => {
            const isSelected = c.id === activeCaseId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCaseId(c.id);
                  setSubmittedStatus('idle');
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 focus:outline-hidden ${
                  isSelected
                    ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-white border-zinc-100 hover:bg-zinc-50 dark:bg-zinc-900/20 dark:border-zinc-800 text-slate-700 dark:text-slate-300'
                }`}
                style={{ borderRadius: '8px' }}
                id={`qa-case-btn-${c.id}`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-sm">
                    {c.category}
                  </span>
                  {c.senderAgeGender && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                      {c.senderAgeGender}
                    </span>
                  )}
                </div>
                <h5 className="text-xs font-bold font-serif line-clamp-2 leading-snug">
                  {idx + 1}. {c.title}
                </h5>
              </button>
            );
          })}
        </div>

        {/* Selected Q&A Content Area (Right Column) */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-xs"
              style={{ borderRadius: '12px' }}
              id="qa-case-active-panel"
            >
              {/* Case Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-50 dark:border-zinc-800/50 pb-3">
                <span className="text-xs font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                  Kasus Terulas: {activeCase.category}
                </span>
                {activeCase.senderAgeGender && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 rounded-sm">
                    Kategori Pengirim: <strong className="text-slate-700 dark:text-slate-300">{activeCase.senderAgeGender}</strong>
                  </span>
                )}
              </div>

              {/* Reader's Dilemma */}
              <div className="space-y-2 bg-[#fdfbf7] dark:bg-amber-950/5 p-4 rounded-lg border border-[#f5eedc] dark:border-amber-900/10" style={{ borderRadius: '8px' }}>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-amber-400 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Dilema & Curahan Hati Pembaca
                </div>
                <p className="text-xs sm:text-sm font-medium font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  &ldquo;{activeCase.questionText}&rdquo;
                </p>
              </div>

              {/* Expert Credentials Header */}
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80" style={{ borderRadius: '8px' }}>
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 font-bold font-serif text-sm">
                  {activeCase.expertAvatar ? (
                    <img
                      src={activeCase.expertAvatar}
                      alt={activeCase.expertName}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    activeCase.expertName.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs sm:text-sm font-serif font-black text-slate-800 dark:text-white">
                      {activeCase.expertName}
                    </h5>
                    <span className="inline-flex items-center gap-0.5 text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase px-1 rounded-sm">
                      <UserCheck className="w-2.5 h-2.5" /> Terverifikasi
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold leading-none">
                    {activeCase.expertTitle}
                  </p>
                </div>
              </div>

              {/* Therapist Analysis Assessment */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Analisis Psikologis & Penilaian Klinis
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium pl-1">
                  {activeCase.analysisMarkdown}
                </div>
              </div>

              {/* Actionable Practical Checklist Steps */}
              {activeCase.adviceSteps && activeCase.adviceSteps.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-zinc-50 dark:border-zinc-800/50">
                  <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Rencana Aksi & Saran Praktis Terapi
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">
                    Centang saran di bawah ini setelah Anda merencanakannya atau mencobanya dalam kehidupan nyata:
                  </p>
                  <div className="space-y-2">
                    {activeCase.adviceSteps.map((step, idx) => {
                      const isChecked = !!checkedSteps[activeCase.id]?.[idx];
                      return (
                        <button
                          key={idx}
                          onClick={() => handleToggleStep(activeCase.id, idx)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all focus:outline-hidden ${
                            isChecked
                              ? 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/5 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 line-through decoration-emerald-200 dark:decoration-emerald-900/40'
                              : 'bg-zinc-50/50 border-zinc-100 hover:bg-zinc-50 dark:bg-zinc-900/20 dark:border-zinc-800 text-slate-700 dark:text-slate-300'
                          }`}
                          style={{ borderRadius: '8px' }}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border transition-all ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                            {step}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Anonymous Problem Submission Form Panel */}
      <div className="bg-[#fcfcfc] dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xs" style={{ borderRadius: '12px' }} id="qa-submission-form-panel">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
              Punya Dilema atau Masalah Pribadi Serupa?
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              Konsultasi 100% aman, dijamin anonim penuh, dan rahasia terlindungi.
            </p>
          </div>
        </div>

        {submittedStatus === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-5 text-center space-y-3"
            style={{ borderRadius: '8px' }}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-serif font-black text-emerald-800 dark:text-emerald-300">
              Curahan Hati Anda Berhasil Dikirimkan!
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Terima kasih telah bersuara secara anonim. Cerita/konflik Anda telah masuk antrean ulasan tim klinis. Kami akan memilih kasus Anda untuk diulas secara profesional pada penerbitan kolom nasehat psikolog berikutnya.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSubmittedStatus('idle')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 focus:outline-hidden"
              >
                Kirim Dilema Lainnya
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmitDilemma} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
                  Kategori Dilema
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-200 dark:focus:ring-amber-800/30 focus:outline-hidden transition text-slate-700 dark:text-slate-200"
                  style={{ borderRadius: '8px' }}
                >
                  <option value="Komunikasi Orang Tua & Anak">Komunikasi Orang Tua & Anak</option>
                  <option value="Hubungan Pasutri / Konflik Keluarga">Hubungan Pasutri / Konflik Keluarga</option>
                  <option value="Burnout / Kesehatan Mental Ibu">Burnout / Kesehatan Mental Ibu</option>
                  <option value="Tumbuh Kembang & Tantrum">Tumbuh Kembang & Tantrum</option>
                  <option value="Lainnya">Lainnya / Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
                  Identitas Pengirim (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu (32 thn), Jakarta atau Anonim"
                  value={formAgeGender}
                  onChange={(e) => setFormAgeGender(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-200 dark:focus:ring-amber-800/30 focus:outline-hidden transition text-slate-700 dark:text-slate-200"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
                Tulis Masalah, Dilema, atau Konflik Anda Secara Rinci
              </label>
              <textarea
                rows={4}
                placeholder={submissionPlaceholder || "Ceritakan masalah hubungan, pola asuh anak, kecemasan, atau konflik rumah tangga yang sedang Anda hadapi saat ini secara jujur... Ahli kami akan mengulasnya tanpa menghakimi."}
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-200 dark:focus:ring-amber-800/30 focus:outline-hidden transition text-slate-700 dark:text-slate-200"
                style={{ borderRadius: '8px' }}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  Mendukung format tulisan bebas anonim.
                </span>
                <span className={`text-[10px] font-bold ${formQuestion.length < 20 ? 'text-slate-400' : 'text-emerald-500'}`}>
                  {formQuestion.length} karakter (Min. 20)
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !formQuestion.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ borderRadius: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengirimkan Curahan Hati...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {buttonText || "Kirim Masalah Anda (Anonim)"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
