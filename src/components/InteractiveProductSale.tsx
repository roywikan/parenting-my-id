import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import SEOHelper from './SEOHelper';
import { 
  ShoppingBag, 
  Phone, 
  Copy, 
  CheckCircle, 
  Trash, 
  Edit3, 
  Plus, 
  X, 
  ExternalLink,
  ChevronLeft,
  DollarSign,
  Maximize2
} from 'lucide-react';

interface InteractiveProductSaleProps {
  isAdmin?: boolean;
  currentUser?: any;
  activeProductSlug?: string;
  siteConfig?: any;
}

function getSafeExternalUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.toLowerCase().startsWith('javascript:')) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.length > 0 && !trimmed.includes('<script')) {
    return `https://${trimmed}`;
  }
  return '';
}

export default function InteractiveProductSale({ isAdmin = false, currentUser, activeProductSlug, siteConfig }: InteractiveProductSaleProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout States
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [buyerNotes, setBuyerNotes] = useState<string>('');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment'>('details');
  const [copiedPrice, setCopiedPrice] = useState<boolean>(false);

  // Admin Modal States
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formWhatsappNumber, setFormWhatsappNumber] = useState<string>('');
  const [formQrisImageUrl, setFormQrisImageUrl] = useState<string>('');
  const [formBankInfo, setFormBankInfo] = useState<string>('');
  const [formPaymentMode, setFormPaymentMode] = useState<'all' | 'qris' | 'bank' | 'third_party' | 'whatsapp'>('all');
  const [formThirdPartyCheckoutUrl, setFormThirdPartyCheckoutUrl] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'available' | 'sold'>('available');
  const [formError, setFormError] = useState<string>('');

  // Fetch Products on Mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync active product slug from URL
  useEffect(() => {
    if (activeProductSlug && products.length > 0) {
      const match = products.find(p => p.slug.toLowerCase() === activeProductSlug.toLowerCase());
      if (match) {
        setSelectedProduct(match);
      }
    }
  }, [activeProductSlug, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (activeProductSlug) {
          const match = data.find((p: Product) => p.slug.toLowerCase() === activeProductSlug.toLowerCase());
          if (match) setSelectedProduct(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormPrice(0);
    setFormImageUrl('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80');
    setFormWhatsappNumber('628123456789');
    setFormQrisImageUrl('https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=400&h=400&q=80');
    setFormBankInfo(siteConfig?.seller_bank_accounts || '');
    setFormPaymentMode('all');
    setFormThirdPartyCheckoutUrl('');
    setFormStatus('available');
    setFormError('');
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormSlug(product.slug);
    setFormDescription(product.description);
    setFormPrice(product.price);
    setFormImageUrl(product.imageUrl);
    setFormWhatsappNumber(product.whatsappNumber);
    setFormQrisImageUrl(product.qrisImageUrl || '');
    setFormBankInfo(product.bankInfo || '');
    setFormPaymentMode(product.paymentMode || 'all');
    setFormThirdPartyCheckoutUrl(product.thirdPartyCheckoutUrl || '');
    setFormStatus(product.status);
    setFormError('');
    setShowAdminModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle || !formSlug || !formDescription || !formPrice || !formImageUrl || !formWhatsappNumber) {
      setFormError('Semua kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    const payload = {
      title: formTitle,
      slug: formSlug,
      description: formDescription,
      price: Number(formPrice),
      imageUrl: formImageUrl,
      whatsappNumber: formWhatsappNumber,
      qrisImageUrl: formQrisImageUrl,
      bankInfo: formBankInfo,
      paymentMode: formPaymentMode,
      thirdPartyCheckoutUrl: formThirdPartyCheckoutUrl,
      status: formStatus
    };

    const token = localStorage.getItem('cms_token') || localStorage.getItem('session_token') || '';

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setShowAdminModal(false);
        fetchProducts();
      } else {
        setFormError(data.error || 'Gagal menyimpan produk.');
      }
    } catch (err) {
      setFormError('Gangguan jaringan. Silakan coba kembali.');
    }
  };

  const handleDeleteProduct = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk lukisan ini?')) return;

    const token = localStorage.getItem('cms_token') || localStorage.getItem('session_token') || '';

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchProducts();
        if (selectedProduct?.id === id) {
          setSelectedProduct(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerPhone) {
      alert('Nama Lengkap dan Nomor WhatsApp Anda wajib diisi.');
      return;
    }

    if (!selectedProduct) return;

    // Send data to D1 first
    try {
      await fetch('/api/products/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          buyer_notes: buyerNotes || '',
          product_id: selectedProduct.id,
          product_title: selectedProduct.title,
          product_slug: selectedProduct.slug,
          product_price: selectedProduct.price
        })
      });
    } catch (err) {
      console.error('Failed to log product purchase lead:', err);
    }

    // Compose custom WhatsApp message
    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedProduct.price);
    const textMessage = `Halo, saya tertarik dengan ${selectedProduct.title}:\n\n` +
      `📦 *${selectedProduct.title}*\n` +
      `💰 Harga: ${formattedPrice}\n\n` +
      `Berikut rincian pemesan saya:\n` +
      `👤 *Nama:* ${buyerName}\n` +
      `📱 *No. HP/WhatsApp:* ${buyerPhone}\n` +
      `📝 *Catatan:* ${buyerNotes || '-'}\n\n` +
      `Saya akan melakukan pembayaran menggunakan metode yang tertera di halaman jualan. Tolong bantu konfirmasi ketersediaan dan pengiriman. Terima kasih!`;

    const encodedText = encodeURIComponent(textMessage);
    const waUrl = `https://api.whatsapp.com/send?phone=${selectedProduct.whatsappNumber.replace(/[^0-9]/g, '')}&text=${encodedText}`;

    // Open WhatsApp in new tab
    window.open(waUrl, '_blank');

    // Advance to payment step
    setCheckoutStep('payment');
  };

  const copyPriceToClipboard = () => {
    if (!selectedProduct) return;
    navigator.clipboard.writeText(selectedProduct.price.toString());
    setCopiedPrice(true);
    setTimeout(() => setCopiedPrice(false), 2000);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    setCheckoutStep('details');
    const baseNavPath = siteConfig?.products_nav_path || '/produk';
    const cleanNavPath = baseNavPath.startsWith('/') ? baseNavPath : `/${baseNavPath}`;
    
    if (product) {
      window.history.pushState({}, '', `${cleanNavPath}/${product.slug}`);
    } else {
      window.history.pushState({}, '', cleanNavPath);
    }
  };

  // Dynamic Hero Section Config values
  const prodNavLabel = siteConfig?.products_nav_label || 'Produk Jualan';
  const heroBadge = siteConfig?.products_hero_badge || `🛍️ Katalog ${prodNavLabel} Eksklusif`;
  const heroTitle = siteConfig?.products_hero_title || `Miliki ${prodNavLabel} Pilihan Terbaik & Berkualitas`;
  const heroSubtitle = siteConfig?.products_hero_subtitle || `Temukan berbagai koleksi ${prodNavLabel.toLowerCase()}, paket, dan penawaran terbaik. Didukung pembayaran instan QRIS/Bank dan koordinasi pengiriman aman via WhatsApp.`;
  const heroBtnText = siteConfig?.products_hero_btn_text || `Tambah ${prodNavLabel} Baru`;
  const heroImageUrl = siteConfig?.products_hero_image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';
  const heroImageCaption = siteConfig?.products_hero_image_caption || `Katalog ${prodNavLabel}`;
  const emptyTitle = siteConfig?.products_empty_title || `Belum Ada ${prodNavLabel}`;
  const emptySubtitle = siteConfig?.products_empty_subtitle || `Katalog ${prodNavLabel.toLowerCase()} belum diunggah. Silakan masuk sebagai administrator untuk menambahkan item ${prodNavLabel.toLowerCase()} pertama Anda.`;

  const defaultSiteName = siteConfig?.site_name || 'Website';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {selectedProduct ? (
        <SEOHelper
          title={`${selectedProduct.title} | ${defaultSiteName}`}
          description={selectedProduct.description || `Beli ${selectedProduct.title} secara mudah dan aman di ${defaultSiteName}.`}
          image={selectedProduct.imageUrl}
          canonicalUrl={typeof window !== 'undefined' ? window.location.href : `/produk/${selectedProduct.slug}`}
          type="product"
          siteName={defaultSiteName}
        />
      ) : (
        <SEOHelper
          title={`${heroTitle} | ${defaultSiteName}`}
          description={heroSubtitle || `Temukan koleksi ${prodNavLabel.toLowerCase()} terbaik di ${defaultSiteName}.`}
          canonicalUrl={typeof window !== 'undefined' ? window.location.href : '/produk'}
          type="website"
          siteName={defaultSiteName}
        />
      )}
      {/* HEADER HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300 font-bold uppercase tracking-wider">
            {heroBadge}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {heroTitle}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {heroSubtitle}
          </p>
          
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{heroBtnText}</span>
            </button>
          )}
        </div>
        <div className="w-full md:w-80 h-48 bg-slate-800/40 rounded-2xl border border-white/10 p-2 flex items-center justify-center relative overflow-hidden shrink-0 group">
          <img 
            src={heroImageUrl} 
            alt={heroImageCaption} 
            className="w-full h-full object-cover rounded-xl opacity-90 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest">{heroImageCaption}</span>
          </div>
        </div>
      </div>

      {/* PRODUCT DISPLAY & DETAIL */}
      {selectedProduct ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* BACK TO GALLERY ROW */}
          <div className="lg:col-span-12">
            <button
              onClick={() => handleSelectProduct(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Daftar {prodNavLabel}</span>
            </button>
          </div>

          {/* LEFT: ARTWORK PREVIEW */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 space-y-4 shadow-sm">
            <div className="relative aspect-4/3 md:aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 border border-slate-100 dark:border-slate-800">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                className="w-full h-full object-contain hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                selectedProduct.status === 'available'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {selectedProduct.status === 'available' ? 'Tersedia' : 'Terjual'}
              </span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {selectedProduct.title}
              </h2>
              <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                {formatRupiah(selectedProduct.price)}
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                {selectedProduct.description}
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE CHECKOUT & PAYMENTS PANEL */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
            {(() => {
              const mode = selectedProduct.paymentMode || 'all';
              const thirdPartyUrl = getSafeExternalUrl(selectedProduct.thirdPartyCheckoutUrl);
              const effectiveBankInfo = (selectedProduct.bankInfo && selectedProduct.bankInfo.trim())
                ? selectedProduct.bankInfo
                : (siteConfig?.seller_bank_accounts || '');

              const showThirdParty = (mode === 'all' || mode === 'third_party') && Boolean(thirdPartyUrl);
              const showBank = (mode === 'all' || mode === 'bank') && Boolean(effectiveBankInfo);
              const showQris = (mode === 'all' || mode === 'qris') && Boolean(selectedProduct.qrisImageUrl);
              const showWhatsapp = mode === 'all' || mode === 'whatsapp';

              if (checkoutStep === 'details') {
                return (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pilihan Pembayaran &amp; Checkout</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pilih metode transaksi atau hubungi penjual langsung di bawah ini.
                      </p>
                    </div>

                    {/* THIRD PARTY CHECKOUT BUTTON IF AVAILABLE */}
                    {showThirdParty && (
                      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Checkout Pihak Ketiga (Shopping Cart)</span>
                          </span>
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded font-bold">Resmi</span>
                        </div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">
                          Lanjutkan pembelian melalui platform marketplace/shopping cart eksternal penjual.
                        </p>
                        <a
                          href={thirdPartyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Checkout via Pihak Ketiga &rarr;</span>
                        </a>
                      </div>
                    )}

                    {/* BANK ACCOUNTS (AUTO-INSERTED DEFAULT FROM ADMIN CONFIG OR CUSTOM) */}
                    {showBank && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            <span>Rekening Bank &amp; Info Pengiriman</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Multi-Bank</span>
                        </div>
                        <div className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          {effectiveBankInfo}
                        </div>
                        <button
                          type="button"
                          onClick={copyPriceToClipboard}
                          className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedPrice ? 'Nominal Price Tersalin!' : `Salin Harga (${formatRupiah(selectedProduct.price)})`}</span>
                        </button>
                      </div>
                    )}

                    {/* WHATSAPP CONTACT & QRIS TRIGGER */}
                    {showWhatsapp && (
                      <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Nama Lengkap Anda *
                          </label>
                          <input
                            type="text"
                            required
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Cth: Budi Santoso"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Nomor HP/WhatsApp Anda *
                          </label>
                          <input
                            type="tel"
                            required
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            placeholder="Cth: 081234567890"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Catatan Pengiriman / Pesan Khusus
                          </label>
                          <textarea
                            value={buyerNotes}
                            onChange={(e) => setBuyerNotes(e.target.value)}
                            placeholder="Masukkan alamat pengiriman, request khusus packing kayu, atau penawaran."
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          />
                        </div>

                        {selectedProduct.status === 'available' ? (
                          <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md shadow-rose-600/20"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Beli via WhatsApp &amp; {showQris ? 'Tampilkan QRIS' : 'Proses Order'}</span>
                          </button>
                        ) : (
                          <div className="p-4 text-center bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl font-bold text-sm">
                            Barang ini telah Terjual (Sold Out)
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Diinisiasi via WhatsApp</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Silakan selesaikan pesan di tab WhatsApp. Berikut detail info transaksi dan QRIS pembayaran:
                    </p>
                  </div>

                  {/* QRIS FRAME IF ENABLED */}
                  {showQris && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-xs mx-auto space-y-3 shadow-2xs">
                      <div className="bg-white p-2 rounded-xl flex items-center justify-center aspect-square border border-slate-200">
                        <img 
                          src={selectedProduct.qrisImageUrl} 
                          alt="QRIS QR Code" 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                        QRIS MANDIRI / GOPAY / DANA / ALL BANK
                      </div>
                    </div>
                  )}

                  {/* BANK INFO IF ENABLED */}
                  {showBank && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>Rekening Bank &amp; Info Pengiriman</span>
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {effectiveBankInfo}
                      </div>
                    </div>
                  )}

                  {/* THIRD PARTY CHECKOUT IF AVAILABLE */}
                  {showThirdParty && (
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide block">
                        Link Checkout Pihak Ketiga
                      </span>
                      <a
                        href={thirdPartyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka Halaman Checkout Pihak Ketiga &rarr;</span>
                      </a>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Jumlah Nominal Transfer</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatRupiah(selectedProduct.price)}
                      </span>
                    </div>
                    <button
                      onClick={copyPriceToClipboard}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/[0.02] flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedPrice ? 'Tersalin!' : 'Salin Angka Nominal'}</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStep('details')}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Kembali ke Form
                    </button>
                    <button
                      onClick={() => handleSelectProduct(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 dark:hover:bg-slate-750 text-white font-bold text-xs transition-colors"
                    >
                      Selesai &amp; Tutup
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* PRODUCT CATALOG GRID */
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500">Memuat koleksi {prodNavLabel.toLowerCase()}...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{emptyTitle}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {emptySubtitle}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-rose-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 bg-slate-950 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      product.status === 'available'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {product.status === 'available' ? 'Tersedia' : 'Terjual'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        {formatRupiah(product.price)}
                      </div>
                      
                      {isAdmin && (
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEditModal(product, e)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProduct(product.id, e)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN ADD/EDIT MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Lukisan Koleksi' : 'Tambah Lukisan Koleksi Baru'}
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Judul Lukisan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (!editingProduct) {
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="Cth: Senja di Hamparan Sawah"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Slug Link (ID Unik) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="cth: senja-sawah"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Kisah / Filosofi Seni &amp; Spesifikasi Detail *
                </label>
                <textarea
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ceritakan tentang inspirasi di balik lukisan ini, media (cat minyak di atas kanvas), ukuran, dan detail bingkai."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice || ''}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Cth: 15000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Status Produk *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'available' | 'sold')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  >
                    <option value="available">Tersedia (Available)</option>
                    <option value="sold">Terjual (Sold Out)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Nomor WhatsApp Penjual (Format: 628...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formWhatsappNumber}
                    onChange={(e) => setFormWhatsappNumber(e.target.value)}
                    placeholder="Cth: 628123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    URL Gambar QRIS
                  </label>
                  <input
                    type="text"
                    value={formQrisImageUrl}
                    onChange={(e) => setFormQrisImageUrl(e.target.value)}
                    placeholder="URL gambar QR Code QRIS Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  URL Gambar Lukisan / Barang *
                </label>
                <input
                  type="text"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="URL gambar lukisan resolusi tinggi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Opsi Metode Pembayaran di Halaman Produk *
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    Tentukan metode pembayaran yang akan diaktifkan untuk produk ini.
                  </p>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  >
                    <option value="all">Semua Metode (QRIS, Bank, Link Pihak Ketiga &amp; WhatsApp)</option>
                    <option value="qris">Hanya Pembayaran QRIS</option>
                    <option value="bank">Hanya Transfer Rekening Bank</option>
                    <option value="third_party">Hanya Link / Tombol Checkout Pihak Ketiga (Shopping Cart)</option>
                    <option value="whatsapp">Hanya WhatsApp Checkout Direct</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center justify-between">
                    <span>URL / Link Checkout Pihak Ketiga (Shopping Cart Services)</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">Aman &amp; Anti-XSS</span>
                  </label>
                  <input
                    type="url"
                    value={formThirdPartyCheckoutUrl}
                    onChange={(e) => setFormThirdPartyCheckoutUrl(e.target.value)}
                    placeholder="Contoh: https://shopee.co.id/product/123 atau https://mayar.link/checkout/xyz"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Sediakan URL / link checkout belanja pihak ketiga (Shopee, Tokopedia, Mayar, TripPay, Midtrans, Lynk.id, Gumroad, Stripe, dll).
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Nomor Rekening Bank Penjual &amp; Syarat Delivery/Shipping Fee
                  </label>
                  {siteConfig?.seller_bank_accounts && (
                    <button
                      type="button"
                      onClick={() => setFormBankInfo(siteConfig.seller_bank_accounts)}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      + Isi dari Config Admin
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={formBankInfo}
                  onChange={(e) => setFormBankInfo(e.target.value)}
                  placeholder={"Bisa diisi keterangan nomor rekening berbagai bank dengan pemisah ganti baris (multi-baris), serta keterangan delivery/shipping fee.\n\nContoh:\nBank BCA: 1234567890 a/n John Doe\nBank Mandiri: 0987654321 a/n John Doe\n\nSyarat Delivery / Shipping Fee:\n- Gratis Ongkir area Jakarta\n- Luar pulau +Rp 50.000 (Packing Kayu)"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-mono leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Text box bebas multi-baris untuk nomor rekening berbagai bank &amp; info pengiriman. Jika dikosongkan, sistem otomatis menggunakan default rekening dari Admin Config.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
