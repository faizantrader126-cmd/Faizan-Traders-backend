import React, { useState } from 'react';
import { Product, Review } from '../types';
import { X, Star, ThumbsUp, ShoppingCart, MessageSquare, ShieldCheck, Truck, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  isItemInCart: boolean;
}

export default function ProductModal({ 
  product, 
  onClose, 
  onAddToCart, 
  isItemInCart 
}: ProductModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>(product?.variants?.[0] || '');
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [customActiveImage, setCustomActiveImage] = useState<string | null>(null);

  const handleSelectColor = (v: string) => {
    setSelectedColor(v);
    if (product?.variantImages?.[v]) {
      setCustomActiveImage(product.variantImages[v]);
    }
  };

  const handleSelectSize = (sz: string) => {
    setSelectedSize(sz);
    if (product?.variantImages?.[sz]) {
      setCustomActiveImage(product.variantImages[sz]);
    }
  };
  const [reviews, setReviews] = useState<Review[]>([
    { id: '1', writer: 'Imran Jamil', rating: 5, date: 'June 01, 2026', text: `This is the absolute best purchase I have made this year! Fits exactly as promised. Value for money.` },
    { id: '2', writer: 'Zoya Fatima', rating: 5, date: 'May 28, 2026', text: `Very fast delivery. Product quality is excellent and exactly matched the pictures. Packing was neat.` }
  ]);
  const [newReviewWriter, setNewReviewWriter] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!product) return null;

  // Calculate discount percentage
  const discountPct = (product.originalPrice && product.price) ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  // Variant size markup multipliers (Sofa sizes often affect baseline price)
  const getAdjustedPrice = () => {
    if (!selectedSize) return product.price;
    if (selectedSize.includes('2 Seater')) return product.price + 500;
    if (selectedSize.includes('3 Seater')) return product.price + 1000;
    if (selectedSize.includes('4 Seater')) return product.price + 1500;
    if (selectedSize.includes('5 Seater')) return product.price + 2500;
    if (selectedSize.includes('7 Seater')) return product.price + 4500;
    if (selectedSize.includes('Extra Large')) return product.price + 800;
    return product.price;
  };

  const currentPrice = getAdjustedPrice();

  const handleQtyChange = (val: number) => {
    if (quantity + val < 1) return;
    if (quantity + val > product.stock) return;
    setQuantity(quantity + val);
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity, selectedColor, selectedSize);
  };

  // Pre-filled WhatsApp direct link matching customized variants
  const handleWhatsAppCheckout = () => {
    const specsString = [
      selectedColor ? `Color: ${selectedColor}` : '',
      selectedSize ? `Size: ${selectedSize}` : '',
      `Qty: ${quantity}`
    ].filter(Boolean).join(', ');

    const message = `Assalam-o-Alaikum Faizan Traders!\nI want to buy:\n🛍️ *${product.name}*\n⚙️ Details: (${specsString})\n💵 Price: Rs. ${currentPrice.toLocaleString()} each\n💰 Total: Rs. ${(currentPrice * quantity).toLocaleString()}\n\nMy Shipping Details:\nName: \nCity: \nAddress: \n\nPlease confirm availability!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/9203303511464?text=${encoded}`, '_blank');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewWriter.trim() || !newReviewText.trim()) return;

    setSubmittingReview(true);
    setTimeout(() => {
      const addedReview: Review = {
        id: Math.random().toString(),
        writer: newReviewWriter,
        rating: newReviewRating,
        date: 'Today',
        text: newReviewText
      };
      setReviews([addedReview, ...reviews]);
      setNewReviewWriter('');
      setNewReviewText('');
      setNewReviewRating(5);
      setSubmittingReview(false);
    }, 600);
  };

  // Color bubble codes map
  const getColorHex = (colorName: string): string => {
    const map: Record<string, string> = {
      'Ocean Blue': '#1d4ed8',
      'Charcoal Grey': '#4b5563',
      'Coffee Brown': '#78350f',
      'Crimson Red': '#dc2626',
      'Beige Cream': '#fdf6e2',
      'Classic Black': '#000000',
      'Navy Blue': '#1e3a8a',
      'Forest Green': '#064e3b',
      'Teal': '#0f766e',
      'Nordic Stripe': '#cbd5e1',
      'Floral Bloom': '#f472b6',
      'Golden Wave': '#f59e0b',
      'Abstract Marble': '#a1a1aa',
      'Stone Gray': '#71717a',
      'Luxury White': '#ffffff',
      'Midnight Blue': '#172554',
      'Khaki': '#f5f5dc',
      'Emerald Green': '#047857',
      'Royal Crimson': '#be123c',
      'Imperial Gold': '#ca8a04',
      'Sapphire Blue': '#0284c7',
      'Ivory Lace': '#fafaf9',
      'Rustic Flax': '#d6d3d1',
      'Peony Pink': '#fbcfe8',
      'Grey Chevron': '#94a3b8',
      'Yellow Arrow': '#facc15',
      'Blue Mosaic': '#60a5fa',
      'Golden Jasmine': '#eab308',
      'Silver Lilac': '#e2e8f0',
      'Rose Copper': '#fb923c',
      'Dual Grey-White': '#e4e4e7',
      'Reversible Brown-Khaki': '#d2b48c'
    };
    return map[colorName] || '#94a3b8';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic Backdrop blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />

      {/* Main Modal container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 grid h-full max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl md:grid-cols-12"
      >
        {/* Close Button Trigger */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full border border-neutral-200 bg-white/90 p-2 text-black hover:bg-black hover:text-white shadow-xs transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Column Left: Visual & Core Perks */}
        <div className="md:col-span-5 bg-neutral-50 relative p-6 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-full">
          <div>
            {(() => {
              const allImages = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)));
              const activeImg = customActiveImage || allImages[activeImageIdx] || product.image;
              
              return (
                <div className="mb-6">
                  {/* Aspect Square Image Canvas */}
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-white shadow-inner relative group select-none">
                    <img 
                      src={activeImg} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-all duration-300"
                    />
                    
                    {allImages.length > 1 && (
                      <>
                        {/* Prev & Next internal triggers */}
                        <button
                          onClick={() => {
                            setActiveImageIdx(prev => (prev - 1 + allImages.length) % allImages.length);
                            setCustomActiveImage(null);
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/85 text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors text-xs font-black shadow-xs cursor-pointer"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => {
                            setActiveImageIdx(prev => (prev + 1) % allImages.length);
                            setCustomActiveImage(null);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/85 text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors text-xs font-black shadow-xs cursor-pointer"
                        >
                          ›
                        </button>
                        
                        {/* Status tracker tag */}
                        <span className="absolute bottom-3 right-3 bg-black/85 text-[8.5px] text-white font-mono font-bold tracking-widest px-2.5 py-1 rounded-md uppercase">
                          {activeImageIdx + 1}/{allImages.length}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Dynamic horizontal scroll preview thumbnails if multiple images exist */}
                  {(allImages.length > 1 || customActiveImage) && (
                    <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                      {allImages.map((imgUrl, idx) => {
                        const isCurrentActive = !customActiveImage && activeImageIdx === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveImageIdx(idx);
                              setCustomActiveImage(null);
                            }}
                            className={`relative aspect-square w-12 shrink-0 rounded-lg overflow-hidden border bg-white transition-all cursor-pointer ${
                              isCurrentActive 
                                ? 'border-black ring-1 ring-black scale-95 shadow-xs' 
                                : 'border-zinc-200 opacity-60 hover:opacity-100 hover:border-zinc-400'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                          </button>
                        );
                      })}
                      
                      {/* Render custom temporary active variant thumbnail if preset wasn't inside standard images */}
                      {customActiveImage && !allImages.includes(customActiveImage) && (
                        <button
                          onClick={() => {}}
                          className="relative aspect-square w-12 shrink-0 rounded-lg overflow-hidden border transition-all scale-95 shadow-xs border-black ring-1 ring-black bg-white"
                        >
                          <img src={customActiveImage} alt="" className="h-full w-full object-cover animate-pulse" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/95 text-[7px] font-mono text-center font-bold text-white uppercase py-0.5 tracking-wider">
                            Variant
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Quick trust badges panel */}
            <div className="space-y-3.5 bg-white/80 p-4.5 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-black" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-black">Nationwide Delivery</h4>
                  <p className="text-[10px] text-zinc-500">Quick and safe cash on delivery speed across Pakistan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-black" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-black">Quality Verification</h4>
                  <p className="text-[10px] text-zinc-500">Each gadget and home item is checked by engineers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-black" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-black">24/7 WhatsApp Support</h4>
                  <p className="text-[10px] text-zinc-500">Helpful customer assistants always ready to chat</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 mt-6 hidden md:block">
            <h4 className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-[0.15em] mb-2">Category Highlights</h4>
            <div className="flex gap-1.5 flex-wrap">
              {product.features.slice(0, 3).map((feat, idx) => (
                <span key={idx} className="bg-white/60 text-neutral-700 border border-neutral-200 px-2.5 py-1 rounded-md text-[10px] font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-black" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Column Right: Details, Variators, Shipping selection, Quick checkout & reviews */}
        <div className="md:col-span-7 overflow-y-auto p-6 md:p-8 flex flex-col justify-between max-h-[50vh] md:max-h-full text-left">
          <div>
            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase font-mono">
              {product.category.replace('-', ' ')}
            </span>
            <h2 className="font-display text-2xl font-bold text-black mt-1 leading-tight uppercase tracking-tight">
              {product.name}
            </h2>

            {/* Stars rating banner details */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex text-zinc-900">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4.5 w-4.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'opacity-35'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-black font-mono">
                {product.rating} Out of 5.0
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({product.reviewsCount} verified customers)
              </span>
            </div>

            {/* Price layout details */}
            <div className="mt-4 flex items-center gap-3 bg-neutral-50 px-4.5 py-3 rounded-xl border border-neutral-200">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase leading-none">Your Price</span>
                <span className="font-mono text-2xl font-black text-black mt-1">
                  Rs. {currentPrice.toLocaleString()}
                </span>
              </div>
              {product.originalPrice > product.price && (
                <div className="flex flex-col border-l border-neutral-200 pl-3">
                  <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase leading-none">Market Price</span>
                  <span className="font-mono text-sm text-neutral-400 line-through mt-2.5">
                    Rs. {(product.originalPrice + (currentPrice - product.price)).toLocaleString()}
                  </span>
                </div>
              )}
              {discountPct > 0 && (
                <span className="ml-auto rounded-lg bg-black px-2.5 py-1 text-xs font-extrabold tracking-wide text-white uppercase font-mono">
                  SAVE {discountPct}%
                </span>
              )}
            </div>

            {/* Specifications Brief */}
            <p className="mt-5 text-sm text-zinc-600 leading-relaxed border-b border-neutral-200 pb-5">
              {product.longDescription}
            </p>

            {/* Variant selections fields (Sofa dimensions, fabrics colors) */}
            <div className="mt-5 space-y-5">
              {/* Product.variants Color Picker if exists */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-black uppercase font-mono tracking-wider">Select Theme Color:</label>
                    <span className="text-xs font-semibold text-neutral-600 font-mono">{selectedColor}</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const hex = getColorHex(v);
                      return (
                        <button
                          key={v}
                          onClick={() => handleSelectColor(v)}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                            selectedColor === v 
                              ? 'border-black bg-black text-white shadow-xs' 
                              : 'border-zinc-200 hover:border-black/40 text-black bg-white'
                          }`}
                        >
                          <span 
                            className="h-3.5 w-3.5 rounded-full border border-neutral-200 shrink-0 flex items-center justify-center" 
                            style={{ backgroundColor: hex }}
                          >
                            {selectedColor === v && (
                              <svg 
                                className={`h-2.5 w-2.5 ${
                                  v === 'Luxury White' || v === 'Ivory Lace' || v === 'Beige Cream' || v === 'Khaki' || v === 'Silver Lilac' || v === 'Dual Grey-White' ? 'text-black' : 'text-white'
                                }`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor" 
                                strokeWidth={4}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span>{v}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sofa / Cloth dimension selector if exists  */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-black uppercase font-mono tracking-wider">Select Size Variant:</label>
                    <span className="text-xs font-semibold text-zinc-600 font-mono">
                      {selectedSize.includes('Seater') && selectedSize !== '1 Seater' ? '+ Price adjustments' : 'Standard'}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => handleSelectSize(sz)}
                        className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus:outline-hidden cursor-pointer ${
                          selectedSize === sz 
                            ? 'border-black bg-black text-white shadow-xs' 
                            : 'border-zinc-200 hover:border-black/40 text-black bg-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div>
                <label className="text-xs font-bold text-black uppercase font-mono tracking-wider block mb-2.5">Set Quantity:</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
                    <button 
                      onClick={() => handleQtyChange(-1)}
                      className="px-3.5 py-2.5 hover:bg-zinc-200 text-black font-bold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-5 font-mono font-bold text-black min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => handleQtyChange(1)}
                      className="px-3.5 py-2.5 hover:bg-zinc-200 text-black font-bold transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {product.stock <= 10 && (
                    <span className="text-[11px] font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg">
                      Hurry, only {product.stock} left!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Buttons Matrix to Add or Order on WhatsApp */}
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3.5 border-t border-neutral-200 pt-6">
              <button
                onClick={handleAddToCartClick}
                disabled={isItemInCart}
                className={`w-full py-3.5 sm:py-4.5 px-3 sm:px-6 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 border cursor-pointer ${
                  isItemInCart 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-black border-black hover:bg-neutral-900 text-white shadow-md'
                }`}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>{isItemInCart ? 'In Cart' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleWhatsAppCheckout}
                className="w-full py-3.5 sm:py-4.5 px-3 sm:px-6 rounded-xl font-bold text-xs sm:text-sm tracking-wide bg-[#25d366] hover:bg-[#20ba5a] text-white transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md cursor-pointer"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 fill-current"
                >
                  <path d="M12.012 2c-5.506 0-9.985 4.479-9.985 9.985 0 2.14.675 4.12 1.826 5.748L2.03 22l4.385-1.152c1.558.85 3.336 1.33 5.228 1.33 5.506 0 10.021-4.479 10.021-9.985S17.518 2 12.012 2zm4.72 13.784c-.21.595-1.225 1.155-1.68 1.19-.455.035-.91.175-2.94-.63-2.45-.98-4.025-3.465-4.13-3.64-.105-.175-.875-1.19-.875-2.24 0-1.05.525-1.575.735-1.82.21-.245.455-.315.595-.315.14 0 .28 0 .42.035.14.035.315-.035.49.385.175.42.63 1.54.665 1.645.035.105.07.245 0 .385-.07.14-.14.28-.245.42-.105.14-.21.28-.315.385-.105.105-.21.245-.07.49.14.245.63 1.05 1.365 1.715.945.84 1.715 1.12 1.96 1.225.245.105.385.07.525-.07.14-.175.63-.735.805-.98.175-.245.35-.21.595-.105.245.105 1.54.735 1.82.875.28.14.455.21.525.315.07.14.07.77-.14 1.365z" />
                </svg>
                <span>WhatsApp Order</span>
              </button>
            </div>

            {/* Comprehensive details bullet grid */}
            <div className="mt-8 border-t border-neutral-200 pt-6">
              <h3 className="font-display text-sm font-bold text-black uppercase tracking-wider mb-3">Key Features & Specifications</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-700">
                {product.features.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-black font-extrabold mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic Customer Reviews Board */}
            <div className="mt-9 border-t border-neutral-200 pt-7">
              <h3 className="font-display text-base font-bold text-black flex items-center justify-between mb-4">
                <span>Customer Reviews ({reviews.length})</span>
                <span className="text-xs text-neutral-500 font-mono">Join the conversation</span>
              </h3>

              {/* Reviews stream */}
              <div className="space-y-4 max-h-[18rem] overflow-y-auto mb-6 pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-black">{rev.writer}</h4>
                        <div className="flex text-zinc-900 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < rev.rating ? 'fill-current' : 'opacity-25'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">{rev.date}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>

              {/* Write Review form */}
              <form onSubmit={handleReviewSubmit} className="bg-neutral-50 p-4.5 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-bold text-black uppercase tracking-wider font-mono mb-3.5">Write Your Verified Review</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-left">
                  <input 
                    type="text" 
                    placeholder="Your Full Name"
                    value={newReviewWriter}
                    onChange={(e) => setNewReviewWriter(e.target.value)}
                    required
                    className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-black"
                  />
                  
                  <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2.5">
                    <span className="text-xs text-neutral-500 font-medium">Your Rating:</span>
                    <div className="flex text-zinc-900">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewReviewRating(i + 1)}
                          className="focus:outline-hidden transform hover:scale-115 transition-transform cursor-pointer"
                        >
                          <Star 
                            className={`h-4.5 w-4.5 ${i < newReviewRating ? 'fill-current' : 'opacity-25'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea 
                  rows={2}
                  placeholder="Share details of your experience with this product..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  required
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden mb-3 font-bold text-black"
                />

                <button 
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-black hover:bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded-lg transition-colors cursor-pointer"
                >
                  {submittingReview ? 'Submitting Review...' : 'Publish Customer Testimonial'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
