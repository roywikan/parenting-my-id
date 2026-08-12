import { AutoLink } from '../types';

/**
 * Applies auto-linking for registered keywords on HTML content.
 * Intelligently avoids replacing keywords inside existing <a> tags, headings, attributes, or code blocks.
 */
export function applyAutoLinks(htmlContent: string, autolinks: AutoLink[]): string {
  if (!htmlContent || !autolinks || autolinks.length === 0) {
    return htmlContent;
  }

  // Sort autolinks by keyword length descending so longer phrases match first (e.g. "pola asuh anak" before "pola asuh")
  const sortedLinks = [...autolinks].sort((a, b) => b.keyword.length - a.keyword.length);

  let processedHtml = htmlContent;

  for (const link of sortedLinks) {
    if (!link.keyword || !link.targetUrl) continue;

    const keywordEscaped = link.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match the keyword outside of existing HTML tags or inside <a> tags
    // Regex matches HTML tags OR the keyword
    const tagOrKeywordRegex = new RegExp(
      `(<a\\b[^>]*?>[\\s\\S]*?<\\/a>|<code\\b[^>]*?>[\\s\\S]*?<\\/code>|<h[1-6]\\b[^>]*?>[\\s\\S]*?<\\/h[1-6]>|<[^>]+>)|(\\b${keywordEscaped}\\b)`,
      'gi'
    );

    let replacedCount = 0;
    const maxReplacementsPerKeyword = 2; // Prevent link spamming, max 2 links per keyword per post

    processedHtml = processedHtml.replace(tagOrKeywordRegex, (match, htmlTag, keywordMatch) => {
      if (htmlTag) {
        // Leave existing tags, links, headings, code intact
        return htmlTag;
      }

      if (keywordMatch && replacedCount < maxReplacementsPerKeyword) {
        replacedCount++;
        return `<a href="${link.targetUrl}" class="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium underline decoration-rose-300 dark:decoration-rose-600 underline-offset-4 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-1 py-0.5 rounded transition-all group/autolink" title="Artikel terkait: ${link.description || link.keyword}" data-autolink-id="${link.id}">${keywordMatch}<span class="inline-block text-[10px] opacity-70 group-hover/autolink:translate-x-0.5 transition-transform">↗</span></a>`;
      }

      return match;
    });
  }

  return processedHtml;
}

/**
 * Calculates estimated reading time based on word count.
 */
export function calculateReadTime(text: string): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  const wpm = 200; // average reading speed
  return Math.max(1, Math.ceil(words / wpm));
}

/**
 * Generates clean URL slug from title.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Preprocesses markdown string so that multiple blank lines (consecutive newlines)
 * are preserved as visible line breaks (<br />) in rendered HTML preview and output.
 */
export function preprocessMarkdownLineBreaks(markdown: string): string {
  if (!markdown) return '';

  // Normalize \r\n to \n
  let normalized = markdown.replace(/\r\n/g, '\n');

  // Split by code blocks (```...```) so we don't alter whitespace inside code blocks
  const parts = normalized.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part, index) => {
      // Odd indices are code blocks
      if (index % 2 === 1) {
        return part;
      }

      // Replace lines containing only spaces or tabs with clean newlines
      let text = part.replace(/\n[ \t]+\n/g, '\n\n');

      // Convert 2 or more consecutive newlines (i.e. 1 or more blank lines) into
      // paragraph breaks with <br /> tags
      text = text.replace(/\n{2,}/g, (match) => {
        const extraLines = match.length - 1;
        return '\n\n' + '<br />'.repeat(extraLines) + '\n\n';
      });

      return text;
    })
    .join('');
}
