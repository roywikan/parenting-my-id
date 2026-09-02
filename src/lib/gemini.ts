import { GoogleGenAI } from '@google/genai';

/**
 * AI Assistant for Parenting.my.id Editor
 * Generates SEO descriptions, catchphrases, and article outlines.
 */
export async function generateParentingSEOMeta(title: string, content: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback if no Gemini key is provided
    return {
      metaTitle: `${title} | Parenting.my.id`,
      metaDescription: content.slice(0, 150).replace(/[#*`_]/g, '') + '...',
      tags: 'parenting, anak, keluarga, kesehatan anak, balita',
      excerpt: content.slice(0, 180).replace(/[#*`_]/g, '') + '...'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda adalah seorang Senior SEO Specialist & Parenting Content Strategist untuk website parenting.my.id.
Berdasarkan judul artikel: "${title}" dan isi ringkas: "${content.slice(0, 500)}", hasilkan format JSON persis seperti ini tanpa markdown:
{
  "metaTitle": "Judul SEO menarik maksimal 60 karakter diakhiri | Parenting.my.id",
  "metaDescription": "Deskripsi Meta SEO membujuk dan memuat kata kunci utama (120-155 karakter).",
  "tags": "5 kata kunci dipisahkan koma",
  "excerpt": "Ringkasan artikel 2 kalimat yang hangat dan emosional untuk pembaca orang tua."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      metaTitle: `${title} | Parenting.my.id`,
      metaDescription: content.slice(0, 150).replace(/[#*`_]/g, '') + '...',
      tags: 'parenting, anak, keluarga, kesehatan anak, balita',
      excerpt: content.slice(0, 180).replace(/[#*`_]/g, '') + '...'
    };
  } catch (err) {
    console.error('Gemini API Error:', err);
    return {
      metaTitle: `${title} | Parenting.my.id`,
      metaDescription: content.slice(0, 150).replace(/[#*`_]/g, '') + '...',
      tags: 'parenting, anak, keluarga, kesehatan anak, balita',
      excerpt: content.slice(0, 180).replace(/[#*`_]/g, '') + '...'
    };
  }
}
