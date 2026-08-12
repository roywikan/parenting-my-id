import { AutoLink } from '../types';

/**
 * Automatically converts keywords in HTML content to internal links.
 */
export function applyAutoLinks(html: string, autolinks: AutoLink[]): string {
  if (!html || !autolinks || autolinks.length === 0) return html;

  // Sort autolinks by keyword length descending (longer keywords first)
  const sortedAutolinks = [...autolinks].sort((a, b) => b.keyword.length - a.keyword.length);

  // Split HTML by tags to avoid replacing keywords inside HTML attributes or existing <a> tags
  const tokenRegex = /(<[^>]+>)/gi;
  const parts = html.split(tokenRegex);

  let inAnchor = false;

  return parts
    .map((part) => {
      // Check if this part is an HTML tag
      if (part.startsWith('<') && part.endsWith('>')) {
        const tagName = part.replace(/^<\/?([a-z0-9]+)/i, '$1').toLowerCase();
        if (tagName === 'a') {
          inAnchor = !part.startsWith('</');
        }
        return part;
      }

      // Skip text inside existing <a> tags
      if (inAnchor) return part;

      // Apply autolinks to text nodes
      let modifiedText = part;

      for (const item of sortedAutolinks) {
        if (!item.keyword) continue;

        // Case-insensitive boundary match for keywords
        const escapedKeyword = item.keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(`\\b(${escapedKeyword})\\b`, 'gi');

        // Only replace first occurrence per text node to avoid over-linking
        if (regex.test(modifiedText)) {
          modifiedText = modifiedText.replace(regex, (match) => {
            const tooltipAttr = item.description ? ` title="${item.description.replace(/"/g, '&quot;')}"` : '';
            return `<a href="${item.targetUrl}" class="autolink-item font-semibold text-rose-600 dark:text-rose-400 underline decoration-rose-300 hover:decoration-rose-600 transition-colors"${tooltipAttr}>${match}</a>`;
          });
          break; // Stop after first matched keyword in this text segment
        }
      }

      return modifiedText;
    })
    .join('');
}

/**
 * Calculates estimated read time in minutes.
 */
export function calculateReadTime(markdown: string): number {
  if (!markdown) return 1;
  const wordsPerMinute = 200;
  const cleanText = markdown.replace(/<[^>]*>/g, '').replace(/[#*`_~-]/g, '');
  const wordCount = cleanText.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Generates a clean URL slug from title.
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

      // Convert 3 or more consecutive newlines (i.e. 2 or more blank lines) into
      // paragraph breaks with <br /> tags
      text = text.replace(/\n{2,}/g, (match) => {
        const extraLines = match.length - 2;
        return '\n\n' + '<br />'.repeat(extraLines) + '\n\n';
      });

      return text;
    })
    .join('');
}
