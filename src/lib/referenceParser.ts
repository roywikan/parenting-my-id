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
  const clean = input.trim();
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
  const elements = splitRespectingQuotes(rawContent);

  if (elements.length === 0) {
    return {
      index,
      citationText: rawContent.trim(),
    };
  }

  // Check if the last parameter is a URL or DOI
  const lastElement = elements[elements.length - 1];
  const urlCheck = detectUrlOrDoi(lastElement);

  if (urlCheck.isUrl && urlCheck.canonicalUrl) {
    const citationParts = elements.slice(0, -1);
    const citationText = citationParts.length > 0 ? citationParts.join(', ') : lastElement;
    return {
      index,
      citationText,
      url: urlCheck.canonicalUrl,
      displayUrl: urlCheck.displayUrl,
    };
  }

  // No URL provided: all elements constitute the citation text
  return {
    index,
    citationText: elements.join(', '),
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
 * Parses article HTML, replaces [ref:...], [referensi:...], [jurnal:...] with
 * superscript footnote links [1], and appends a bibliography list at the bottom.
 */
export function parseAndRenderReferences(rawHtml: string): string {
  const refs: ParsedReference[] = [];
  let refIndex = 1;

  // Replace tags inline with superscript footnotes
  let parsedHtml = rawHtml.replace(/\[(?:ref|referensi|jurnal):\s*([^\]]+)\]/gi, (_match, refContent) => {
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

  // Generate reference list (Bibliography)
  const refListHtml = `
    <div class="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800" id="daftar-referensi">
      <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
        <span class="text-rose-600">📚</span> Referensi Ilmiah &amp; Jurnal
      </h3>
      <ol class="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-decimal pl-5">
        ${refs.map((ref) => {
          const escapedCitation = escapeHtml(ref.citationText);
          const hasUrl = Boolean(ref.url);
          const escapedUrl = ref.url ? escapeHtml(ref.url) : '';
          const escapedDisplayUrl = ref.displayUrl ? escapeHtml(ref.displayUrl) : escapedUrl;

          return `
            <li id="ref-item-${ref.index}" class="pl-1 leading-relaxed">
              <span class="font-medium text-slate-800 dark:text-slate-200">${escapedCitation}</span>
              ${hasUrl ? `
                <span class="text-slate-400 dark:text-slate-600 mx-1">—</span>
                <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-0.5 font-semibold">
                  <span>${escapedDisplayUrl}</span>
                  <svg class="w-3 h-3 inline-block ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              ` : ''}
              <a href="#ref-back-${ref.index}" class="text-rose-500 hover:text-rose-700 ml-1.5 font-bold transition-colors" title="Kembali ke teks">↩</a>
            </li>
          `;
        }).join('')}
      </ol>
    </div>
  `;

  return parsedHtml + refListHtml;
}
