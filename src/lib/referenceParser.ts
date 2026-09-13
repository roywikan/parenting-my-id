/**
 * Reference Parser for Academic & Scientific Citations (E-E-A-T)
 * 
 * Supports tags:
 *   [ref: ...]
 *   [referensi: ...]
 *   [jurnal: ...]
 * 
 * URL/DOI is fully OPTIONAL at the end:
 *   - Without URL: [ref: Prof. Suparman, "Pola Makan Balita", Jurnal Kesehatan, 2026]
 *   - With URL/DOI: [ref: Prof. Suparman, "Pola Makan Balita", Jurnal Kesehatan, 2026, https://doi.org/10.1016/j.kesehatan.2026]
 *   - With raw DOI: [ref: Prof. Suparman, "Pola Makan Balita", Jurnal Kesehatan, 2026, 10.1016/j.kesehatan.2026]
 */

export interface ParsedReference {
  index: number;
  citationText: string;
  url?: string;
  displayUrl?: string;
}

/**
 * Unescapes common HTML entities to prevent double-escaping when Markdown
 * has already been partially processed by marked (e.g. &quot; -> ", &amp; -> &).
 */
export function unescapeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Cleans potential URL/DOI string by unwrapping any autolink <a> tags created
 * by Markdown parsers (GFM) and removing trailing encoded or unencoded brackets (%5D, ]).
 */
export function cleanUrlOrDoi(input: string): string {
  let clean = input.trim();
  // If wrapped in <a href="...">...</a> by marked autolink
  const aMatch = clean.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (aMatch) {
    clean = aMatch[1] || aMatch[2];
  }
  // Remove any residual HTML tags
  clean = clean.replace(/<[^>]+>/g, '').trim();
  // Strip trailing encoded or raw brackets/parentheses (%5D, %5d, ], ))
  clean = clean.replace(/(?:%5D|%5d|\]|\))+$/gi, '').trim();
  return clean;
}

/**
 * Splits reference string by commas while respecting quotes.
 * e.g. 'Prof. Suparman, "Pola Makan, Gizi & Tumbuh Kembang", Jurnal, 2026'
 */
export function splitRespectingQuotes(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if ((char === '"' || char === "'" || char === '“' || char === '”') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if ((char === quoteChar || (quoteChar === '“' && char === '”')) && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      current += char;
    } else if (char === ',' && !inQuotes) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Detects if a string is a URL or DOI.
 * Matches: http://, https://, 10.xxx, doi:xxx, doi.org/xxx
 */
export function detectUrlOrDoi(input: string): { isUrl: boolean; canonicalUrl?: string; displayUrl?: string } {
  const clean = cleanUrlOrDoi(input);
  if (!clean) return { isUrl: false };

  // 1. Standard http:// or https://
  if (/^https?:\/\//i.test(clean)) {
    let display = clean;
    if (/doi\.org\/10\./i.test(clean)) {
      display = 'DOI: ' + clean.split(/doi\.org\//i)[1];
    } else if (display.length > 45) {
      display = display.substring(0, 42) + '...';
    }
    return { isUrl: true, canonicalUrl: clean, displayUrl: display };
  }

  // 2. DOI format starting with 10. (e.g. 10.1016/j.kesehatan.2026)
  if (/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i.test(clean)) {
    return {
      isUrl: true,
      canonicalUrl: `https://doi.org/${clean}`,
      displayUrl: `DOI: ${clean}`,
    };
  }

  // 3. Prefix doi: or doi.org/
  if (/^doi:\s*/i.test(clean)) {
    const doiClean = clean.replace(/^doi:\s*/i, '').trim();
    return {
      isUrl: true,
      canonicalUrl: `https://doi.org/${doiClean}`,
      displayUrl: `DOI: ${doiClean}`,
    };
  }

  if (/^doi\.org\//i.test(clean)) {
    return {
      isUrl: true,
      canonicalUrl: `https://${clean}`,
      displayUrl: `DOI: ${clean.replace(/^doi\.org\//i, '')}`,
    };
  }

  return { isUrl: false };
}

/**
 * Parses the interior content of a reference tag.
 */
export function parseSingleReference(rawContent: string, index: number): ParsedReference {
  // Decode any HTML entities (&quot;, &amp;, etc.) so quotes and ampersands can be processed cleanly
  const unescaped = unescapeHtmlEntities(rawContent);
  const elements = splitRespectingQuotes(unescaped);

  if (elements.length === 0) {
    return {
      index,
      citationText: unescaped.replace(/<[^>]+>/g, '').trim(),
    };
  }

  // Check if the last parameter is a URL or DOI
  const lastElement = elements[elements.length - 1];
  const urlCheck = detectUrlOrDoi(lastElement);

  if (urlCheck.isUrl && urlCheck.canonicalUrl) {
    const citationParts = elements.slice(0, -1).map(part => part.replace(/<[^>]+>/g, '').trim());
    const citationText = citationParts.length > 0 ? citationParts.join(', ') : cleanUrlOrDoi(lastElement);
    return {
      index,
      citationText,
      url: urlCheck.canonicalUrl,
      displayUrl: urlCheck.displayUrl,
    };
  }

  // No URL provided: all elements constitute the citation text
  const cleanedParts = elements.map(part => part.replace(/<[^>]+>/g, '').trim());
  return {
    index,
    citationText: cleanedParts.join(', '),
  };
}

/**
 * Helper to escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses article HTML or Markdown, replaces [ref:...], [referensi:...], [jurnal:...] with
 * superscript footnote links [1], and appends a bibliography list at the bottom.
 *
 * Robust against marked GFM autolink issues (e.g. trailing `%5D` and `]</a>`).
 */
export function parseAndRenderReferences(rawHtml: string, headingLabel?: string): string {
  const refs: ParsedReference[] = [];
  let refIndex = 1;

  // Replace tags inline with superscript footnotes.
  // Note: (?:<\/a>)? handles case where marked GFM autolink placed <a> after the closing bracket.
  const regex = /\[(?:ref|referensi|jurnal):\s*([\s\S]*?)\](?:<\/a>)?/gi;

  let parsedHtml = rawHtml.replace(regex, (_match, refContent) => {
    const currentIndex = refIndex++;
    const parsed = parseSingleReference(refContent, currentIndex);
    refs.push(parsed);

    const escapedTitle = escapeHtml(parsed.citationText);
    return `<sup><a href="#ref-item-${currentIndex}" id="ref-back-${currentIndex}" class="text-rose-600 dark:text-rose-400 font-extrabold hover:underline ml-0.5" title="${escapedTitle}">[${currentIndex}]</a></sup>`;
  });

  // If no references were found, return original HTML
  if (refs.length === 0) {
    return parsedHtml;
  }

  const finalHeadingLabel = headingLabel || 'Referensi';

  // Generate reference list (Bibliography)
  const refListHtml = `<div class="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800" id="daftar-referensi"><h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3"><span class="text-rose-600">📚</span> ${escapeHtml(finalHeadingLabel)}</h3><ol class="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-decimal pl-5">${refs.map((ref) => {
    const escapedCitation = escapeHtml(ref.citationText);
    const hasUrl = Boolean(ref.url);
    const escapedUrl = ref.url ? escapeHtml(ref.url) : '';
    const escapedDisplayUrl = ref.displayUrl ? escapeHtml(ref.displayUrl) : escapedUrl;

    return `<li id="ref-item-${ref.index}" class="pl-1 leading-relaxed scroll-mt-28 transition-all duration-300"><span class="font-medium text-slate-800 dark:text-slate-200">${escapedCitation}</span>${hasUrl ? ` <span class="text-slate-400 dark:text-slate-600 mx-1">—</span> <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-0.5 font-semibold"><span>${escapedDisplayUrl}</span><svg class="w-3 h-3 inline-block ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>` : ''} <a href="#ref-back-${ref.index}" class="text-rose-500 hover:text-rose-700 ml-1.5 font-bold transition-colors" title="Kembali ke teks">↩</a></li>`;
  }).join('')}</ol></div>`;

  return parsedHtml + refListHtml;
}
