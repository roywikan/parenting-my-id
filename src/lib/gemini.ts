/**
 * AI Assistant for Parenting.my.id Editor
 * Proxies through server-side API route for secure Gemini integration
 */
export async function generateParentingSEOMeta(title: string, content: string) {
  try {
    const res = await fetch('/api/ai/generate-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Gemini API Error via /api/ai/generate-meta:', err);
  }

  return {
    metaTitle: `${title} | Parenting.my.id`,
    metaDescription: content.slice(0, 150).replace(/[#*`_]/g, '') + '...',
    tags: 'parenting, anak, keluarga, kesehatan anak, balita',
    excerpt: content.slice(0, 180).replace(/[#*`_]/g, '') + '...',
    aiGenerated: false,
  };
}

