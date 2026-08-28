export interface ThemePreset {
  id: string;
  name: string;
  category: 'corporate' | 'news_agency' | 'magazine' | 'personal_blog' | 'simple';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    sans: string;
    heading: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  // Corporate (Professional, clean, trustworthy)
  { id: 'corp-blue', name: 'Corporate Blue', category: 'corporate', colors: { primary: '#2563eb', secondary: '#1e40af', background: '#f8fafc', surface: '#ffffff', text: '#0f172a' }, fonts: { sans: '"Inter", sans-serif', heading: '"Inter", sans-serif' } },
  { id: 'corp-slate', name: 'Corporate Slate', category: 'corporate', colors: { primary: '#475569', secondary: '#334155', background: '#f8fafc', surface: '#ffffff', text: '#0f172a' }, fonts: { sans: '"Roboto", sans-serif', heading: '"Roboto", sans-serif' } },
  { id: 'corp-teal', name: 'Corporate Teal', category: 'corporate', colors: { primary: '#0d9488', secondary: '#0f766e', background: '#f0fdfa', surface: '#ffffff', text: '#134e4a' }, fonts: { sans: '"Open Sans", sans-serif', heading: '"Open Sans", sans-serif' } },
  { id: 'corp-indigo', name: 'Corporate Indigo', category: 'corporate', colors: { primary: '#4f46e5', secondary: '#4338ca', background: '#fefefe', surface: '#ffffff', text: '#1e1b4b' }, fonts: { sans: '"Inter", sans-serif', heading: '"Inter", sans-serif' } },
  { id: 'corp-emerald', name: 'Corporate Emerald', category: 'corporate', colors: { primary: '#059669', secondary: '#047857', background: '#f8fafc', surface: '#ffffff', text: '#022c22' }, fonts: { sans: '"Nunito", sans-serif', heading: '"Nunito", sans-serif' } },
  { id: 'corp-navy', name: 'Corporate Navy', category: 'corporate', colors: { primary: '#1e3a8a', secondary: '#172554', background: '#f1f5f9', surface: '#ffffff', text: '#020617' }, fonts: { sans: '"Montserrat", sans-serif', heading: '"Montserrat", sans-serif' } },

  // News Agency (High contrast, readable, serious)
  { id: 'news-classic', name: 'News Classic', category: 'news_agency', colors: { primary: '#b91c1c', secondary: '#991b1b', background: '#ffffff', surface: '#f3f4f6', text: '#000000' }, fonts: { sans: '"Georgia", serif', heading: '"Playfair Display", serif' } },
  { id: 'news-modern', name: 'News Modern', category: 'news_agency', colors: { primary: '#000000', secondary: '#374151', background: '#ffffff', surface: '#f9fafb', text: '#111827' }, fonts: { sans: '"Inter", sans-serif', heading: '"Merriweather", serif' } },
  { id: 'news-crimson', name: 'News Crimson', category: 'news_agency', colors: { primary: '#dc2626', secondary: '#b91c1c', background: '#fafafa', surface: '#ffffff', text: '#171717' }, fonts: { sans: '"Lora", serif', heading: '"Lora", serif' } },
  { id: 'news-midnight', name: 'News Midnight', category: 'news_agency', colors: { primary: '#312e81', secondary: '#1e1b4b', background: '#f8fafc', surface: '#ffffff', text: '#0f172a' }, fonts: { sans: '"Roboto", sans-serif', heading: '"Oswald", sans-serif' } },
  { id: 'news-paper', name: 'News Paper', category: 'news_agency', colors: { primary: '#000000', secondary: '#1f2937', background: '#fdfbf7', surface: '#ffffff', text: '#111827' }, fonts: { sans: '"Merriweather", serif', heading: '"Merriweather", serif' } },
  { id: 'news-bold', name: 'News Bold', category: 'news_agency', colors: { primary: '#ea580c', secondary: '#c2410c', background: '#ffffff', surface: '#fafaf9', text: '#1c1917' }, fonts: { sans: '"Open Sans", sans-serif', heading: '"Fira Sans", sans-serif' } },

  // Magazine (Vibrant, stylish, expressive)
  { id: 'mag-vogue', name: 'Mag Vogue', category: 'magazine', colors: { primary: '#db2777', secondary: '#be185d', background: '#ffffff', surface: '#fdf2f8', text: '#111827' }, fonts: { sans: '"Jost", sans-serif', heading: '"Playfair Display", serif' } },
  { id: 'mag-lifestyle', name: 'Mag Lifestyle', category: 'magazine', colors: { primary: '#eab308', secondary: '#ca8a04', background: '#fffbeb', surface: '#ffffff', text: '#422006' }, fonts: { sans: '"Poppins", sans-serif', heading: '"Poppins", sans-serif' } },
  { id: 'mag-tech', name: 'Mag Tech', category: 'magazine', colors: { primary: '#8b5cf6', secondary: '#7c3aed', background: '#0f172a', surface: '#1e293b', text: '#f8fafc' }, fonts: { sans: '"Space Grotesk", sans-serif', heading: '"Space Grotesk", sans-serif' } },
  { id: 'mag-travel', name: 'Mag Travel', category: 'magazine', colors: { primary: '#06b6d4', secondary: '#0891b2', background: '#f0f9ff', surface: '#ffffff', text: '#083344' }, fonts: { sans: '"Quicksand", sans-serif', heading: '"Quicksand", sans-serif' } },
  { id: 'mag-food', name: 'Mag Food', category: 'magazine', colors: { primary: '#f97316', secondary: '#ea580c', background: '#fff7ed', surface: '#ffffff', text: '#431407' }, fonts: { sans: '"Rubik", sans-serif', heading: '"Cormorant Garamond", serif' } },
  { id: 'mag-art', name: 'Mag Art', category: 'magazine', colors: { primary: '#ec4899', secondary: '#db2777', background: '#ffffff', surface: '#fcfafb', text: '#000000' }, fonts: { sans: '"Work Sans", sans-serif', heading: '"Syne", sans-serif' } },

  // Personal Blog (Warm, inviting, character)
  { id: 'blog-warm', name: 'Blog Warm', category: 'personal_blog', colors: { primary: '#f59e0b', secondary: '#d97706', background: '#fffbeb', surface: '#ffffff', text: '#451a03' }, fonts: { sans: '"Nunito", sans-serif', heading: '"Nunito", sans-serif' } },
  { id: 'blog-pastel', name: 'Blog Pastel', category: 'personal_blog', colors: { primary: '#f472b6', secondary: '#db2777', background: '#fdf2f8', surface: '#ffffff', text: '#831843' }, fonts: { sans: '"Quicksand", sans-serif', heading: '"Quicksand", sans-serif' } },
  { id: 'blog-earth', name: 'Blog Earth', category: 'personal_blog', colors: { primary: '#65a30d', secondary: '#4d7c0f', background: '#f7fee7', surface: '#ffffff', text: '#1a2e05' }, fonts: { sans: '"Lora", serif', heading: '"Cabin", sans-serif' } },
  { id: 'blog-minimal', name: 'Blog Minimal', category: 'personal_blog', colors: { primary: '#525252', secondary: '#404040', background: '#fafafa', surface: '#ffffff', text: '#171717' }, fonts: { sans: '"Inter", sans-serif', heading: '"Inter", sans-serif' } },
  { id: 'blog-ocean', name: 'Blog Ocean', category: 'personal_blog', colors: { primary: '#0284c7', secondary: '#0369a1', background: '#f0f9ff', surface: '#ffffff', text: '#082f49' }, fonts: { sans: '"Mulish", sans-serif', heading: '"Mulish", sans-serif' } },
  { id: 'blog-sunset', name: 'Blog Sunset', category: 'personal_blog', colors: { primary: '#ef4444', secondary: '#dc2626', background: '#fef2f2', surface: '#ffffff', text: '#450a0a' }, fonts: { sans: '"Karla", sans-serif', heading: '"Karla", sans-serif' } },

  // Simple (Minimalist, barebones, focused)
  { id: 'simple-mono', name: 'Simple Mono', category: 'simple', colors: { primary: '#171717', secondary: '#000000', background: '#ffffff', surface: '#f5f5f5', text: '#000000' }, fonts: { sans: '"IBM Plex Mono", monospace', heading: '"IBM Plex Mono", monospace' } },
  { id: 'simple-light', name: 'Simple Light', category: 'simple', colors: { primary: '#3b82f6', secondary: '#2563eb', background: '#ffffff', surface: '#ffffff', text: '#111827' }, fonts: { sans: '"Inter", sans-serif', heading: '"Inter", sans-serif' } },
  { id: 'simple-dark', name: 'Simple Dark', category: 'simple', colors: { primary: '#60a5fa', secondary: '#3b82f6', background: '#121212', surface: '#1e1e1e', text: '#f3f4f6' }, fonts: { sans: '"Inter", sans-serif', heading: '"Inter", sans-serif' } },
  { id: 'simple-serif', name: 'Simple Serif', category: 'simple', colors: { primary: '#000000', secondary: '#333333', background: '#ffffff', surface: '#ffffff', text: '#111111' }, fonts: { sans: '"PT Serif", serif', heading: '"PT Serif", serif' } },
  { id: 'simple-gray', name: 'Simple Gray', category: 'simple', colors: { primary: '#64748b', secondary: '#475569', background: '#f8fafc', surface: '#ffffff', text: '#334155' }, fonts: { sans: '"Roboto", sans-serif', heading: '"Roboto", sans-serif' } },
  { id: 'simple-clean', name: 'Simple Clean', category: 'simple', colors: { primary: '#14b8a6', secondary: '#0d9488', background: '#ffffff', surface: '#fafafa', text: '#1f2937' }, fonts: { sans: '"Helvetica Neue", sans-serif', heading: '"Helvetica Neue", sans-serif' } }
];
