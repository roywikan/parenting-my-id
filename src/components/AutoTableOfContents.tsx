import React, { useState } from 'react';
import { List, ChevronDown, ChevronUp, Anchor } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface AutoTableOfContentsProps {
  items: TocItem[];
}

export default function AutoTableOfContents({ items }: AutoTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Daftar Isi Artikel"
      className="my-6 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 transition-all duration-200 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <List className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
            Daftar Isi Artikel
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold font-mono">
            {items.length} Bagian
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          aria-label={isOpen ? 'Sembunyikan Daftar Isi' : 'Tampilkan Daftar Isi'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <ul className="mt-4 space-y-2 border-t border-slate-200/60 dark:border-slate-800/80 pt-3 text-xs sm:text-sm">
          {items.map((item, idx) => (
            <li
              key={item.id || idx}
              className={`transition-all ${item.level === 3 ? 'pl-4 border-l-2 border-slate-200 dark:border-slate-800' : ''}`}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group flex items-start gap-2 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 py-1 transition-colors leading-relaxed"
              >
                <Anchor className="w-3.5 h-3.5 mt-0.5 opacity-60 group-hover:opacity-100 group-hover:text-rose-600 shrink-0 transition-opacity" />
                <span className="font-semibold group-hover:underline decoration-rose-400/50 underline-offset-4">
                  {item.text}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
