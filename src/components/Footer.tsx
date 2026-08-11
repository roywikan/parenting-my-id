import { Heart, ShieldCheck, Zap, Database, GitBranch, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Parenting<span className="text-rose-400">.my.id</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Platform media edukasi parenting terpercaya di Indonesia. Didesain dengan arsitektur Edge Serverless Cloudflare D1 & GitHub CMS yang ultra-cepat, responsif, dan 100% SEO-friendly.
            </p>

            {/* TECH STACK BADGES */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-rose-300 font-medium">
                <Zap className="w-3 h-3 text-amber-400" /> Cloudflare Pages Edge
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-sky-300 font-medium">
                <Database className="w-3 h-3 text-sky-400" /> Cloudflare D1 SQLite
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-purple-300 font-medium">
                <GitBranch className="w-3 h-3 text-purple-400" /> GitHub REST Storage
              </span>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Kategori Artikel
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-slate-400 hover:text-rose-400 transition-colors">
                  • Pola Asuh Demokratis
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-rose-400 transition-colors">
                  • Stimulasi Balita & Sensory Play
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-rose-400 transition-colors">
                  • Pencegahan Stunting & MPASI
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-rose-400 transition-colors">
                  • Kesehatan & Gizi Anak
                </span>
              </li>
            </ul>
          </div>

          {/* SEO & INFRASTRUCTURE */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Otomatisasi SEO
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Dynamic Sitemap.xml</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Dynamic RSS Feed</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <span className="text-slate-400 inline-flex items-center gap-1">
                  <span>Auto-Linking Engine On-Page</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                </span>
              </li>
              <li>
                <span className="text-slate-400">
                  Image WebP Pipeline Edge
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Parenting.my.id. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1">
            <span>Serverless Edge Architecture on</span>
            <span className="text-slate-300 font-semibold">Cloudflare Workers & D1</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
