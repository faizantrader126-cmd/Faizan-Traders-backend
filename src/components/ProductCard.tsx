import React, { useState } from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, MessageSquare, Eye, Sparkles } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isItemInCart: boolean;
}

// Color bubble codes map for Minimog swatches
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

export default function ProductCard({ 
  product, 
  onViewDetails, 
  onAddToCart, 
  isItemInCart 
}: ProductCardProps) {
  const price = product.price || 0;
  const originalPrice = product.originalPrice || price;
  const discountPct = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Track active thumbnail image (can be updated via hover or swatch selection)
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [isHovered, setIsHovered] = useState(false);

  // Keep activeImage in sync with product.image if the parent updates the product prop (e.g. self-healing)
  React.useEffect(() => {
    setActiveImage(product.image);
  }, [product.image]);

  // Fallback / second image swap for premium Minimog hover experience
  const secondaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  // Generate WhatsApp order link
  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productName = product.name || 'Product';
    const message = `Hello The Sweet Baby Shop!\nI want to order your "${productName}"\nPrice: Rs. ${price.toLocaleString()}\nStock Status: In Stock\nPlease confirm my order!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/923303511464?text=${encodedMessage}`, '_blank');
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (secondaryImage) {
      setActiveImage(secondaryImage);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveImage(product.image);
  };

  return (
    <div 
      onClick={() => onViewDetails(product)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200/60 bg-white transition-all duration-500 hover:shadow-xl hover:border-black cursor-pointer"
    >
      {/* Badge container info overlay - Sleek Minimog badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {discountPct > 0 && (
          <span className="rounded-md bg-black px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase font-mono">
            -{discountPct}%
          </span>
        )}
        {product.badge && (
          <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase font-mono shadow-xs">
            {product.badge}
          </span>
        )}
      </div>

      {/* Stock indicators - Elegant Minimog micro-labels */}
      <div className="absolute top-3 right-3 z-10">
        {(product.stock || 0) < 15 ? (
          <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] font-bold text-zinc-900 border border-zinc-250/50">
            <span className="h-1 w-1 rounded-full bg-black animate-pulse" />
            {product.stock || 0} Left
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-0.5 text-[8px] font-bold text-zinc-800 border border-neutral-200/50">
            <span className="h-1 w-1 rounded-full bg-zinc-400" />
            In Stock
          </span>
        )}
      </div>

      {/* Product Image Container with Crossfade Zoom */}
      <div className="relative aspect-square overflow-hidden bg-neutral-50 border-b border-neutral-100">
        <img 
          src={activeImage || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop'} 
          alt={product.name || 'Product'} 
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600';
          }}
        />
        
        {/* Hover Quick View Overlay - Slides up smoothly on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center pb-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[11px] font-bold text-black shadow-md transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-black hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Quick View
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="flex flex-1 flex-col p-4 text-left">
        {/* Category micro indicator */}
        <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-mono font-bold mb-1">
          {(product.category || 'general').replace('-', ' ')}
        </span>

        {/* Product Title */}
        <h3 className="font-display text-sm font-semibold text-neutral-800 line-clamp-1 group-hover:text-black group-hover:underline transition-colors duration-200">
          {product.name || 'Unnamed Product'}
        </h3>

        {/* Dynamic Swatches Section if variants are available (Minimog Signature) */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-1.5 flex gap-1 items-center overflow-x-auto scrollbar-none h-4">
            {product.variants.slice(0, 5).map((v) => (
              <span
                key={v}
                title={v}
                onClick={(e) => {
                  e.stopPropagation();
                  // We can display a specific variant color or set the active image if it is mapped
                  if (product.variantImages?.[v]) {
                    setActiveImage(product.variantImages[v]);
                  }
                }}
                className="h-3 w-3 rounded-full border border-neutral-300 cursor-pointer hover:scale-125 transition-transform"
                style={{ backgroundColor: getColorHex(v) }}
              />
            ))}
            {product.variants.length > 5 && (
              <span className="text-[8px] font-mono font-bold text-neutral-400">+{product.variants.length - 5}</span>
            )}
          </div>
        )}

        {/* Star Rating summary */}
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex text-zinc-900">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? 'fill-current' : 'opacity-20'}`} 
              />
            ))}
          </div>
          <span className="text-[9px] font-bold text-neutral-600 font-mono">
            {product.rating || 0}
          </span>
          <span className="text-[8px] text-neutral-400 font-mono">
            ({product.reviewsCount || 0})
          </span>
        </div>

        {/* Brief description */}
        <p className="mt-2 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
          {product.description || ''}
        </p>

        {/* Price layout */}
        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold text-black">
            Rs. {price.toLocaleString()}
          </span>
          {originalPrice > price && (
            <span className="font-mono text-[11px] text-neutral-400 line-through">
              Rs. {originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Double-action button panel - Highly styled for Minimog */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className={`flex items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold transition-all duration-300 border cursor-pointer ${
              isItemInCart 
                ? 'bg-neutral-100 border-neutral-200 text-neutral-400' 
                : 'bg-white border-neutral-300 hover:bg-black hover:border-black hover:text-white text-black'
            }`}
          >
            <ShoppingCart className="h-3 w-3" />
            {isItemInCart ? 'In Cart' : 'Add'}
          </button>

          {/* Quick WhatsApp Order Button */}
          <button
            onClick={handleWhatsAppOrder}
            className="flex items-center justify-center gap-1 rounded-lg bg-[#25d366] hover:bg-[#1ebd54] py-2 text-[11px] font-bold text-white shadow-xs transition-colors duration-200 cursor-pointer"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="h-3 w-3 shrink-0 fill-current"
            >
              <path d="M12.012 2c-5.506 0-9.985 4.479-9.985 9.985 0 2.14.675 4.12 1.826 5.748L2.03 22l4.385-1.152c1.558.85 3.336 1.33 5.228 1.33 5.506 0 10.021-4.479 10.021-9.985S17.518 2 12.012 2zm4.72 13.784c-.21.595-1.225 1.155-1.68 1.19-.455.035-.91.175-2.94-.63-2.45-.98-4.025-3.465-4.13-3.64-.105-.175-.875-1.19-.875-2.24 0-1.05.525-1.575.735-1.82.21-.245.455-.315.595-.315.14 0 .28 0 .42.035.14.035.315-.035.49.385.175.42.63 1.54.665 1.645.035.105.07.245 0 .385-.07.14-.14.28-.245.42-.105.14-.21.28-.315.385-.105.105-.21.245-.07.49.14.245.63 1.05 1.365 1.715.945.84 1.715 1.12 1.96 1.225.245.105.385.07.525-.07.14-.175.63-.735.805-.98.175-.245.35-.21.595-.105.245.105 1.54.735 1.82.875.28.14.455.21.525.315.07.14.07.77-.14 1.365z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

