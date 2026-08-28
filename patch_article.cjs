const fs = require('fs');
let content = fs.readFileSync('src/views/ArticleDetailView.tsx', 'utf-8');

if (!content.includes('article-body')) {
  content = content.replace(
    'className="prose prose-rose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base space-y-4"',
    'className="article-body prose prose-rose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-4"'
  );
  
  // replace text-xs text-slate-500 with text-secondary text-slate-500
  content = content.replace(/text-xs text-slate-500/g, 'text-secondary text-slate-500');
  // replace text-sm text-slate-500 with text-secondary text-slate-500
  content = content.replace(/text-sm text-slate-500/g, 'text-secondary text-slate-500');

  fs.writeFileSync('src/views/ArticleDetailView.tsx', content);
}
