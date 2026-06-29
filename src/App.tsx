import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import Logo from './components/Logo';
import ProductManagerModal from './components/ProductManagerModal';

// Data models
import { PRODUCTS, CATEGORIES, BANNER_SLIDES, REVIEWS, COLLECTIONS } from './data';
import { Product, CartItem, Order, BannerSlide, LayoutConfig } from './types';
import { saveInquiryToSupabase } from './lib/supabase';
import { getApiUrl } from './lib/apiConfig';

// Icons
import { 
  Bed, User, ChefHat, GlassWater, Sparkles, Utensils, Tv, Smartphone, Zap,
  ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, 
  Truck, HelpCircle, Mail, Send, AlertCircle, ShoppingBag, 
  ThumbsUp, Clock, MapPin, Phone, Award, Gem, Star
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Help helper for category icons
const getCategoryIcon = (iconName: string) => {
  const iconClasses = "h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform duration-300";
  switch (iconName) {
    case 'Bed': return <Bed className={`${iconClasses} text-neutral-800`} />;
    case 'User': return <User className={`${iconClasses} text-neutral-800`} />;
    case 'Smartphone': return <Smartphone className={`${iconClasses} text-neutral-800`} />;
    case 'ChefHat': return <ChefHat className={`${iconClasses} text-neutral-800`} />;
    case 'GlassWater': return <GlassWater className={`${iconClasses} text-neutral-800`} />;
    case 'Sparkles': return <Sparkles className={`${iconClasses} text-neutral-800`} />;
    default: return <ShoppingBag className={`${iconClasses} text-neutral-800`} />;
  }
};

/**
 * Safe utility to write to LocalStorage with robust error catching
 * to handle any QuotaExceededError when saving large images.
 */
function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.error(`LocalStorage write error for key "${key}":`, e);
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      alert(
        "⚠️ Browser Storage Space Full!\n\n" +
        "We couldn't save some settings/images locally because the browser's storage space is full.\n\n" +
        "To solve this:\n" +
        "1. Avoid uploading massive image files.\n" +
        "2. Connect your Supabase Cloud Database to save unlimited items in the cloud!\n" +
        "3. Clear out some old products in the admin panel to free up storage."
      );
    }
    return false;
  }
}

export default function App() {
  // Navigation & Catalogs filter state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // popular, price-low, price-high, rating

  // Cart, Orders & checkout structures
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Modal open states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Dynamic Store Layout section configurations
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => {
    const saved = localStorage.getItem('store_layout_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      showSlider: true,
      showCategories: true,
      showFlashSale: true,
      showTrending: true,
      showReviews: true,
      showInquiry: true,
      showFooter: true
    };
  });

  // Dynamic Products Inventory state loaded from LocalStorage or PRODUCTS defaults
  const [products, setProducts] = useState<Product[]>(() => {
    let initialList = PRODUCTS;
    const saved = localStorage.getItem('faizan_traders_products');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved) as Product[];
        if (Array.isArray(parsed)) {
          // Merge missing default items (excluding those explicitly deleted by the admin)
          const deletedSaved = localStorage.getItem('faizan_traders_deleted_products');
          let deletedIdsSet = new Set<string>();
          if (deletedSaved) {
            try {
              const parsedDeleted = JSON.parse(deletedSaved);
              if (Array.isArray(parsedDeleted)) {
                deletedIdsSet = new Set(parsedDeleted);
              }
            } catch (err) {
              console.error(err);
            }
          }

          const existingIds = new Set(parsed.map(p => p.id));
          const missing = PRODUCTS.filter(p => !existingIds.has(p.id) && !deletedIdsSet.has(p.id));
          if (missing.length > 0) {
            initialList = [...parsed, ...missing];
          } else {
            initialList = parsed;
          }
        }
      } catch (e) { 
        console.error(e); 
      }
    }

    // Synchronous self-healing for legacy glitched/corrupted images
    let changed = false;
    const sanitizedList = initialList.map(p => {
      let itemChanged = false;
      let img = p.image;
      if (img && img.includes('photo-1522771739844-6a9f6d5f14af')) {
        img = img.replace('photo-1522771739844-6a9f6d5f14af', p.id === 'embroidered-bridal-bedsheet' ? 'photo-1631679706909-1844bbd07221' : 'photo-1505693416388-ac5ce068fe85');
        itemChanged = true;
      }
      let imgs = p.images;
      if (imgs && imgs.some(url => url.includes('photo-1522771739844-6a9f6d5f14af'))) {
        imgs = imgs.map(url => url.includes('photo-1522771739844-6a9f6d5f14af') ? url.replace('photo-1522771739844-6a9f6d5f14af', 'photo-1505693416388-ac5ce068fe85') : url);
        itemChanged = true;
      }
      if (itemChanged) {
        changed = true;
        return { ...p, image: img, images: imgs };
      }
      return p;
    });

    if (changed || saved === null) {
      safeSetLocalStorage('faizan_traders_products', JSON.stringify(sanitizedList));
    }
    return sanitizedList;
  });

  const saveProductsToStorage = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    safeSetLocalStorage('faizan_traders_products', JSON.stringify(updatedProducts));
    
    // Find which of the default products are missing/deleted
    const remainingIds = new Set(updatedProducts.map(p => p.id));
    const deletedDefaultIds = PRODUCTS.filter(p => !remainingIds.has(p.id)).map(p => p.id);
    safeSetLocalStorage('faizan_traders_deleted_products', JSON.stringify(deletedDefaultIds));

    // Post bulk changes to server to keep save cloud node fully synced
    fetch(getApiUrl('/api/products/bulk'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProducts)
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          console.error('Failed to sync products list bulk payload to cloud server database:', json.error);
        }
      })
      .catch(err => console.error('Network error bulk syncing products:', err));
  };

  // Dynamic Banners / Slideshow state loaded from LocalStorage or default BANNER_SLIDES
  const [slides, setSlides] = useState<BannerSlide[]>(() => {
    let initialSlides = BANNER_SLIDES;
    const saved = localStorage.getItem('faizan_traders_slides');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          initialSlides = parsed;
        }
      } catch (e) { console.error(e); }
    }

    // Synchronous self-healing for legacy glitched/corrupted slide images
    let slideChanged = false;
    const sanitizedSlides = initialSlides.map(s => {
      if (s.image && s.image.includes('photo-1522771739844-6a9f6d5f14af')) {
        slideChanged = true;
        return { ...s, image: s.image.replace('photo-1522771739844-6a9f6d5f14af', 'photo-1505693416388-ac5ce068fe85') };
      }
      return s;
    });

    if (slideChanged || saved === null) {
      safeSetLocalStorage('faizan_traders_slides', JSON.stringify(sanitizedSlides));
    }
    return sanitizedSlides;
  });

  const saveSlidesToStorage = (updatedSlides: BannerSlide[]) => {
    setSlides(updatedSlides);
    safeSetLocalStorage('faizan_traders_slides', JSON.stringify(updatedSlides));

    // Post slides to server
    fetch(getApiUrl('/api/slides'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSlides)
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          console.error('Failed to sync slides to cloud server:', json.error);
        }
      })
      .catch(err => console.error('Network error syncing slides:', err));
  };

  const saveLayoutConfigToStorage = (updatedLayout: LayoutConfig) => {
    setLayoutConfig(updatedLayout);
    safeSetLocalStorage('store_layout_config', JSON.stringify(updatedLayout));

    // Post to Express backend
    fetch(getApiUrl('/api/layout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLayout)
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          console.error('Failed to sync layout config to cloud server:', json.error);
        }
      })
      .catch(err => console.error('Network error syncing layout config:', err));
  };

  // Home slides banner ticker
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Safeguard: Ensure currentSlideIdx is always within bounds of active slides
  useEffect(() => {
    const activeLength = Array.isArray(slides) ? slides.length : 0;
    if (activeLength > 0 && currentSlideIdx >= activeLength) {
      setCurrentSlideIdx(0);
    }
  }, [slides, currentSlideIdx]);

  // Load products, slides, and orders from Express backend API
  useEffect(() => {
    import('./lib/supabase').then(({ fetchProductsFromSupabase }) => {
      fetchProductsFromSupabase().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          console.log('Synchronized products catalogue live from cloud server.');
          setProducts(res.data);
          safeSetLocalStorage('faizan_traders_products', JSON.stringify(res.data));
        }
      });
    }).catch(err => {
      console.error('Failed to import database helper:', err);
    });

    // Fetch slides from Express backend
    fetch(getApiUrl('/api/slides'))
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data && json.data.length > 0) {
          setSlides(json.data);
          safeSetLocalStorage('faizan_traders_slides', JSON.stringify(json.data));
        }
      })
      .catch(err => console.error('Error fetching slides from server:', err));

    // Fetch orders from Express backend
    fetch(getApiUrl('/api/orders'))
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setOrders(json.data);
          safeSetLocalStorage('faizan_traders_orders', JSON.stringify(json.data));
        }
      })
      .catch(err => console.error('Error fetching orders from server:', err));

    // Fetch layout config from Express backend
    fetch(getApiUrl('/api/layout'))
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setLayoutConfig(json.data);
          safeSetLocalStorage('store_layout_config', JSON.stringify(json.data));
        }
      })
      .catch(err => console.error('Error fetching layout config from server:', err));
  }, []);

  // Flash sales deal countdown
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Category slider custom dynamic states with automatic rotating slide every 3 seconds
  const [collectionsList, setCollectionsList] = useState([...COLLECTIONS]);

  // Sync collections when COLLECTIONS updates
  useEffect(() => {
    setCollectionsList([...COLLECTIONS]);
  }, []);

  useEffect(() => {
    const colSliderTimer = setInterval(() => {
      setCollectionsList((prev) => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 3000);
    return () => clearInterval(colSliderTimer);
  }, []);

  const handleNextColSlide = () => {
    setCollectionsList((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const handlePrevColSlide = () => {
    setCollectionsList((prev) => {
      if (prev.length <= 1) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      return [last, ...rest];
    });
  };

  // Custom feedback/inquiry states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Sync state with LocalStorage for high fidelity persistence
  useEffect(() => {
    const savedCart = localStorage.getItem('faizan_traders_cart');
    const savedOrders = localStorage.getItem('faizan_traders_orders');
    if (savedCart) {
      try { 
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } catch (e) { console.error(e); }
    }
    if (savedOrders) {
      try { 
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
    safeSetLocalStorage('faizan_traders_cart', JSON.stringify(updatedCart));
  };

  const saveOrdersToStorage = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    safeSetLocalStorage('faizan_traders_orders', JSON.stringify(updatedOrders));
  };

  // Automatic slideshow ticking
  useEffect(() => {
    if (slides.length === 0) return;
    const slideTimer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  // Flash Sale Dynamic ticking countdown
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset simulated clock
          return { hours: 4, minutes: 34, seconds: 12 };
        }
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, []);

  // Product Selection management
  const handleAddToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    const existingIdx = cartItems.findIndex(
      (item) => item.product.id === product.id && 
                item.selectedColor === color && 
                item.selectedSize === size
    );

    let updatedCart = [...cartItems];
    if (existingIdx > -1) {
      updatedCart[existingIdx].quantity += quantity;
    } else {
      updatedCart.push({
        product,
        quantity,
        selectedColor: color,
        selectedSize: size
      });
    }

    saveCartToStorage(updatedCart);
    setSelectedProduct(null); // Close modal on add for simple UX
    setIsCartOpen(true); // Open Sidebar to prompt checkout!
  };

  const handleUpdateQty = (productId: string, val: number, color?: string, size?: string) => {
    const updated = cartItems.map((item) => {
      if (item.product.id === productId && item.selectedColor === color && item.selectedSize === size) {
        const nextQty = item.quantity + val;
        return { ...item, quantity: nextQty < 1 ? 1 : nextQty };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleRemoveFromCart = (productId: string, color?: string, size?: string) => {
    const filtered = cartItems.filter(
      (item) => !(item.product.id === productId && item.selectedColor === color && item.selectedSize === size)
    );
    saveCartToStorage(filtered);
  };

  const hangleOrderCompleted = (newOrder: Order) => {
    const nextOrders = [newOrder, ...orders];
    saveOrdersToStorage(nextOrders);
    setIsCheckoutOpen(false);
    setIsTrackerOpen(true); // Auto view status!
  };

  const handleSimulateStatus = (orderId: string) => {
    const nextList = orders.map((ord) => {
      if (ord.id === orderId) {
        const nextStatus = ord.status === 'Pending' ? 'Shipped' : 'Delivered';
        return { ...ord, status: nextStatus as any };
      }
      return ord;
    });
    saveOrdersToStorage(nextList);
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
  };

  const handleCollectionClick = (colId: string) => {
    setSearchQuery('');
    if (colId === 'trending-gadgets') {
      setSearchQuery('gadget');
    } else if (colId === 'trending-fashion') {
      setSearchQuery('fashion');
    } else if (colId === 'national-event') {
      setSearchQuery('suit');
    } else if (colId === 'ramadan-eid') {
      setSearchQuery('suit');
    } else {
      setActiveCategory('all');
    }
    document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Inquiry submit to Supabase
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) return;

    setInquirySubmitted(true);
    try {
      const res = await saveInquiryToSupabase({
        name: inquiryName,
        phone: inquiryPhone,
        message: inquiryMessage
      });
      
      setInquiryName('');
      setInquiryPhone('');
      setInquiryMessage('');
      
      if (res.success) {
        alert(`Inquiry Sent Successfully! ✅\nSaved into your Supabase "${res.table}" table. Our agent will contact you shortly.`);
      } else {
        alert(`Inquiry Registered Locally! ⚠️\n(Warning: Could not save to Supabase because the target tables do not exist or are offline: ${res.error}).\n\nPlease create the "appointments" or "bookings" table inside your Supabase dashboard to enable database syncing.`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Inquiry Sent. Supabase network connection offline.");
    } finally {
      setInquirySubmitted(false);
    }
  };

  // Filter & Sort Logic for Product catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'all' || prod.category === activeCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount; // popular/best sellers first
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-offwhite text-brand-black selection:bg-brand-black selection:text-white">
      
      {/* 1. Header Layout Block */}
      <Header
        cartItems={cartItems}
        onCartClick={() => setIsCartOpen(true)}
        onTrackerClick={() => setIsTrackerOpen(true)}
        onManagerClick={() => setIsManagerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategorySelect={(id) => {
          setActiveCategory(id);
          // Scroll smoothly to products grid
          document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      {/* 2. Hero Slideshow banner (Full Width Edge-to-Edge) */}
      {layoutConfig.showSlider && (
        <section className="relative overflow-hidden bg-brand-charcoal w-full text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/20 via-transparent to-transparent opacity-85 pointer-events-none" />

          {slides.length > 0 && slides[currentSlideIdx] ? (
            <div className="w-full relative z-10">
              {/* Full Width Image Slide element */}
              <div 
                onClick={() => {
                  if (slides[currentSlideIdx].linkCategory) {
                    setActiveCategory(slides[currentSlideIdx].linkCategory);
                    document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="relative group aspect-[2.1/1] sm:aspect-[2.8/1] md:aspect-[3.1/1] xl:aspect-[3.4/1] w-full overflow-hidden bg-zinc-900 cursor-pointer"
              >
                <img 
                  src={slides[currentSlideIdx].image} 
                  alt={slides[currentSlideIdx].title || "Banner Slide"} 
                  className="h-full w-full object-cover transform scale-100 hover:scale-[1.015] transition-transform duration-700"
                />
                
                {/* Premium dark shading on left part to assist typography visibility if any */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />

                {/* Dynamic Overlay Text & CTA Button if slide is configured with information */}
                {(slides[currentSlideIdx].title || slides[currentSlideIdx].subtitle) && (
                  <div className="absolute inset-0 flex items-center justify-start p-6 sm:p-12 md:p-16 text-left select-none">
                    <div className="max-w-xs sm:max-w-lg md:max-w-xl space-y-1.5 sm:space-y-3.5 z-20 animate-fade-in">
                      {slides[currentSlideIdx].badge && (
                        <span className="inline-block bg-white text-black text-[9px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-md border border-black/10">
                          {slides[currentSlideIdx].badge}
                        </span>
                      )}
                      <h1 className="font-display text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
                        {slides[currentSlideIdx].title}
                      </h1>
                      <p className="text-zinc-200 text-xs sm:text-base md:text-lg font-bold drop-shadow-sm font-sans">
                        {slides[currentSlideIdx].subtitle}
                      </p>
                      {slides[currentSlideIdx].priceText && (
                        <div className="text-white text-xs sm:text-sm md:text-lg font-black font-mono tracking-wide border-l-2 border-white pl-2">
                          {slides[currentSlideIdx].priceText}
                        </div>
                      )}
                      
                      <div className="pt-1 sm:pt-3">
                        <span className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-100 font-black text-[8px] sm:text-[10px] md:text-xs px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl uppercase tracking-wider transition-all duration-300 shadow-lg">
                          <span>Shop Now</span>
                          <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slider Absolute Edge Actions - Left Chevron */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIdx((prev) => (prev - 1 + slides.length) % slides.length);
                  }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-25 h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-white/90 hover:bg-white text-brand-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Previous Banner"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>

                {/* Slider Absolute Edge Actions - Right Chevron */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
                  }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-25 h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-white/90 hover:bg-white text-brand-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Next Banner"
                >
                  <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>

                {/* Dynamic Bottom Indicators dots overlay */}
                <div 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-25 flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full border border-white/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlideIdx === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/45 hover:bg-white'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-zinc-950">
              <p className="text-zinc-400 font-mono text-xs">No Slider Banners Active. Configure some inside the Admin portal.</p>
            </div>
          )}
        </section>
      )}

      {/* 3. Season Collection - Circular Auto-Sliding Carousel */}
      {layoutConfig.showCategories && (
        <section className="py-12 bg-white border-b border-neutral-100 select-none overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative group/carousel">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white bg-black px-2.5 py-1 rounded-md inline-block mb-2">
              Trending Categories
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-black tracking-tight uppercase">
              Season Collection
            </h2>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">Discover what's hot & trending this week</p>
            
            <div className="relative mt-8 px-8 flex items-center justify-center">
              {/* Left manual slide action */}
              <button
                onClick={handlePrevColSlide}
                className="absolute left-0 z-20 h-10 w-10 rounded-full bg-black text-white hover:bg-neutral-800 flex items-center justify-center shadow-md transition-all hover:scale-105 border border-white/10 cursor-pointer"
                title="Slide Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Rotating Slider Container */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full max-w-5xl mx-auto py-2 justify-items-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  {collectionsList.map((col, idx) => {
                    // Display only 4 on desktop, 3 on tablet, 2 on mobile to avoid overflow and maintain perfect alignment with no cutoffs
                    const isVisible = idx < 4;
                    if (!isVisible) return null;

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        key={col.id}
                        onClick={() => handleCollectionClick(col.id)}
                        className={`flex flex-col items-center group cursor-pointer text-center relative w-full ${
                          idx === 2 ? 'hidden sm:flex' : idx === 3 ? 'hidden md:flex' : 'flex'
                        }`}
                      >
                        <div className="aspect-square w-full max-w-[120px] xs:max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[210px] rounded-full overflow-hidden border-2 border-brand-black/5 group-hover:border-black transition-all duration-300 scale-100 group-hover:scale-105 shadow-md bg-zinc-50 relative flex items-center justify-center mx-auto">
                          {col.image ? (
                            <img 
                              src={col.image} 
                              alt={col.name} 
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                // Custom robust fallback if image cannot load
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=300';
                              }}
                            />
                          ) : (
                            // Blank image / Placeholder pattern
                            <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-zinc-300">
                              <ShoppingBag className="h-8 w-8" />
                            </div>
                          )}
                          {/* Dynamic glow overlay */}
                          <div className="absolute inset-0 bg-brand-black/5 group-hover:bg-transparent transition-colors pointer-events-none" />
                        </div>
                        
                        <span className="text-[12px] sm:text-sm font-extrabold text-neutral-800 mt-4 group-hover:text-black transition-colors font-sans tracking-wide block max-w-[110px] sm:max-w-[150px] line-clamp-1">
                          {col.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Right manual slide action */}
              <button
                onClick={handleNextColSlide}
                className="absolute right-0 z-20 h-10 w-10 rounded-full bg-black text-white hover:bg-neutral-800 flex items-center justify-center shadow-md transition-all hover:scale-105 border border-white/10 cursor-pointer"
                title="Slide Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Main Contents Block (Bento Lookbook Home vs Filtered Search Grid) */}
      {activeCategory !== 'all' || searchQuery !== '' ? (
        // --- FILTERED SEARCH RESULTS GRID ---
        <section id="product-catalog-grid" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-neutral-200 pb-6 mb-8 text-left">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                <h2 className="font-display text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                  {searchQuery ? `Search Results` : CATEGORIES.find(c => c.id === activeCategory)?.name}
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Showing <span className="font-bold text-black">{filteredProducts.length}</span> premium baby items.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-black border border-neutral-900 p-3 rounded-xl shadow-md self-stretch lg:self-auto text-white">
              <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest font-mono shrink-0 pl-1">
                ⚡ FLASH DEAL ENDS IN:
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-xs">
                <span className="bg-neutral-800 text-white px-2.5 py-1 rounded-md min-w-[2rem] text-center border border-neutral-700">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-neutral-500">:</span>
                <span className="bg-neutral-800 text-white px-2.5 py-1 rounded-md min-w-[2rem] text-center border border-neutral-700">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="text-neutral-500">:</span>
                <span className="bg-neutral-800 text-white px-2.5 py-1 rounded-md min-w-[2rem] text-center border border-neutral-700">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-neutral-200 p-4 rounded-xl mb-8 shadow-xs w-full">
            <div className="text-left w-full sm:w-auto">
              {searchQuery ? (
                <p className="text-xs text-neutral-500 font-bold">
                  Active search: <strong className="text-black">"{searchQuery}"</strong>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-red-600 hover:underline font-bold ml-2 text-[10px] uppercase font-mono tracking-wide"
                  >
                    Clear✕
                  </button>
                </p>
              ) : (
                <p className="text-xs text-neutral-500 font-bold">
                  Filter: <span className="font-extrabold text-black">{activeCategory.replace('-', ' ')}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-black font-extrabold focus:outline-hidden cursor-pointer hover:border-black transition-colors"
              >
                <option value="popular">Popular Sellers</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Best Rated Reviews</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-xs">
              <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <h4 className="font-display text-sm font-bold text-black">No products match your filters!</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Try adjusting your search query or reset filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 animate-fade-in">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onViewDetails={setSelectedProduct}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  isItemInCart={cartItems.some(item => item.product.id === prod.id)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        // --- PREMIUM BENTO LOOKBOOK HOMEPAGE (No Filters Active) ---
        <div id="product-catalog-grid" className="space-y-16 py-12 bg-neutral-50/30">
          
          {/* Section A: Bedsheets Grid */}
          {layoutConfig.showFlashSale && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 text-left border-b border-neutral-100 pb-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-neutral-500 uppercase font-mono">SWEET DEALS • 30% OFF</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">Premium Bedsheets</h2>
                </div>
                <button 
                  onClick={() => setActiveCategory('bedsheet')}
                  className="text-xs font-bold text-neutral-500 hover:text-black hover:underline transition-colors mt-2 sm:mt-0"
                >
                  View all bedsheets &rarr;
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => p.category === 'bedsheet').slice(0, 8).map((prod) => (
                  <ProductCard
                     key={prod.id}
                     product={prod}
                     onViewDetails={setSelectedProduct}
                     onAddToCart={(p) => handleAddToCart(p, 1)}
                     isItemInCart={cartItems.some(item => item.product.id === prod.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section B, C, D, E: Bento collections */}
          {layoutConfig.showTrending && (
            <>
              {/* Section B: Cloth Men and Women Grid */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 text-left border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-neutral-500 uppercase font-mono">MOST POPULAR • LOVED BY ALL</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">Cloth Men and Women</h2>
                  </div>
                  <button 
                    onClick={() => setActiveCategory('cloth-men-women')}
                    className="text-xs font-bold text-neutral-500 hover:text-black hover:underline transition-colors mt-2 sm:mt-0"
                  >
                    View all clothes &rarr;
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.filter(p => p.category === 'cloth-men-women').slice(0, 4).map((prod) => (
                    <ProductCard
                       key={prod.id}
                       product={prod}
                       onViewDetails={setSelectedProduct}
                       onAddToCart={(p) => handleAddToCart(p, 1)}
                       isItemInCart={cartItems.some(item => item.product.id === prod.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Section C: Electronic & Gadgets - Bento Spotlight Layout */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 text-left border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-neutral-500 uppercase font-mono">COOL DEVICES & SMART LIFESTYLE</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">Electronic & Gadgets</h2>
                  </div>
                  <button 
                    onClick={() => setActiveCategory('electronic-gadgets')}
                    className="text-xs font-bold text-neutral-500 hover:text-black hover:underline transition-colors mt-2 sm:mt-0"
                  >
                    View all gadgets &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Premium Lookbook Promotional Banner Card (1/3 wide) */}
                  <div className="lg:col-span-4 relative rounded-2xl overflow-hidden aspect-4/5 lg:aspect-auto bg-neutral-900 text-white min-h-[350px] lg:min-h-full flex flex-col justify-end p-6 sm:p-8 shadow-md group">
                    <img 
                      src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600" 
                      alt="Electronic and Gadgets Lookbook" 
                      className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 text-left space-y-3">
                      <span className="bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
                        FLAT 30% OFF
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        Smart Daily Devices
                      </h3>
                      <p className="text-zinc-200 text-xs">
                        Curated with the latest high-performance audio systems, portable fitness bands and ambient lamps.
                      </p>
                      <div className="pt-2">
                        <button 
                          onClick={() => setActiveCategory('electronic-gadgets')}
                          className="bg-white text-black hover:bg-zinc-100 hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                        >
                          Shop Collection
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Product List Next to it (2/3 wide) */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {products.filter(p => p.category === 'electronic-gadgets').slice(0, 3).map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onViewDetails={setSelectedProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        isItemInCart={cartItems.some(item => item.product.id === prod.id)}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Section D: Kitchen Accessories - Bento Spotlight Layout */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 text-left border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-neutral-500 uppercase font-mono">PRACTICAL & MODERN HOME COOKING</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">Kitchen Accessories</h2>
                  </div>
                  <button 
                    onClick={() => setActiveCategory('kitchen-accessories')}
                    className="text-xs font-bold text-neutral-500 hover:text-black hover:underline transition-colors mt-2 sm:mt-0"
                  >
                    View all accessories &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* 3-Column Product List (2/3 wide) */}
                  <div className="lg:col-span-8 order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {products.filter(p => p.category === 'kitchen-accessories').slice(0, 3).map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onViewDetails={setSelectedProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        isItemInCart={cartItems.some(item => item.product.id === prod.id)}
                      />
                    ))}
                  </div>

                  {/* Premium Lookbook Promotional Banner Card (1/3 wide) on the right */}
                  <div className="lg:col-span-4 order-1 lg:order-2 relative rounded-2xl overflow-hidden aspect-4/5 lg:aspect-auto bg-neutral-900 text-white min-h-[350px] lg:min-h-full flex flex-col justify-end p-6 sm:p-8 shadow-md group">
                    <img 
                      src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600" 
                      alt="Kitchen Accessories Lookbook" 
                      className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 text-left space-y-3">
                      <span className="bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
                        MODERN KITCHEN
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        Premium Cooking Tools
                      </h3>
                      <p className="text-zinc-200 text-xs">
                        Crafted with premium grade food-safe silicone, warm organic beechwood handles & durable steel.
                      </p>
                      <div className="pt-2">
                        <button 
                          onClick={() => setActiveCategory('kitchen-accessories')}
                          className="bg-white text-black hover:bg-zinc-100 hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                        >
                          Shop Kitchen Wear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section E: Water Bottles - Bento Spotlight Layout */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 text-left border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-neutral-500 uppercase font-mono">BPA-FREE TRITAN & INSULATED STEEL FLASKS</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">Water Bottles</h2>
                  </div>
                  <button 
                    onClick={() => setActiveCategory('water-bottles')}
                    className="text-xs font-bold text-neutral-500 hover:text-black hover:underline transition-colors mt-2 sm:mt-0"
                  >
                    View all bottles &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Premium Lookbook Promotional Banner Card (1/3 wide) */}
                  <div className="lg:col-span-4 relative rounded-2xl overflow-hidden aspect-4/5 lg:aspect-auto bg-neutral-900 text-white min-h-[350px] lg:min-h-full flex flex-col justify-end p-6 sm:p-8 shadow-md group">
                    <img 
                      src="https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600" 
                      alt="Water Bottles Lookbook" 
                      className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 text-left space-y-3">
                      <span className="bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
                        BPA FREE HYDRATION
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        Insulated Thermal Flasks
                      </h3>
                      <p className="text-zinc-200 text-xs">
                        Keep liquids cold up to 24 hours or steaming hot for 12 hours with smart leakproof travel options.
                      </p>
                      <div className="pt-2">
                        <button 
                          onClick={() => setActiveCategory('water-bottles')}
                          className="bg-white text-black hover:bg-zinc-100 hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                        >
                          Shop Bottles
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Product List (2/3 wide) */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {products.filter(p => p.category === 'water-bottles').slice(0, 3).map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onViewDetails={setSelectedProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        isItemInCart={cartItems.some(item => item.product.id === prod.id)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

        </div>
      )}

      {/* 5. Why Choose The Sweet Baby Shop Trust Section */}
      <section className="bg-neutral-50/50 py-16 border-t border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <span className="text-xs font-bold tracking-[0.15em] text-neutral-500 font-mono uppercase block mb-1">Our Standard Values</span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">Why Shop With Us?</h2>
          
          {/* Bento grid layout items */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-left">
            
            <div className="bg-white p-6 rounded-xl border border-neutral-100 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-sm">
              <div className="rounded-full bg-zinc-100 text-black h-11 w-11 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">Premium Cotton Care</h4>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Every item is checked to verify non-allergenic, extra-soft fabrics suitable for newborn skin.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-100 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-sm">
              <div className="rounded-full bg-zinc-100 text-black h-11 w-11 flex items-center justify-center mb-4 font-bold text-base font-mono">
                Rs.
              </div>
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">Honest Factory Rates</h4>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Direct manufacturer sourcing allows us to offer adorable designs without heavy retail markups.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-100 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-sm">
              <div className="rounded-full bg-zinc-100 text-black h-11 w-11 flex items-center justify-center mb-4">
                <Clock className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">Loving WhatsApp Support</h4>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Our friendly assistants are available on Chat to help with sizing recommendations.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-100 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-sm">
              <div className="rounded-full bg-zinc-100 text-black h-11 w-11 flex items-center justify-center mb-4">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">Handpicked Boutique Sets</h4>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Beautiful matching sets, rompers, jewelry accessories, and custom styles curated for your family.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-100 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-sm">
              <div className="rounded-full bg-zinc-100 text-black h-11 w-11 flex items-center justify-center mb-4">
                <Truck className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">Rapid Pakistan Shipping</h4>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Fast delivery to Karachi, Lahore, Islamabad, and nationwide with Cash on Delivery options.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Editorial Story & Mission / Vision Bento-grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12 items-center text-left">
        
        {/* Story Text left */}
        <div className="md:col-span-7 space-y-6">
          <span className="text-xs font-bold tracking-[0.15em] text-neutral-500 uppercase font-mono">Our Beautiful Story</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-neutral-950 leading-tight tracking-tight">
            Nurturing Soft Cuddles & Happy Little Smiles
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The Sweet Baby Shop is Pakistan’s favorite online destination for premium infant, baby, and young children wear. We curate comfortable, highly breathable, and fashionable garments that ensure absolute joy for kids and parents.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            From playful matching shorts sets to winter nightsuits and dazzling kids jewelry packs, we believe every child deserves boutique luxury combined with honest pricing. We carefully handpick our combed-cotton lines to avoid synthetic irritations.
          </p>
          <p className="text-sm text-neutral-800 font-bold leading-relaxed border-l-4 border-black pl-4">
            We focus on softness, trust, and loving customer care, making us a household favorite for families across all regions of Pakistan.
          </p>
        </div>

        {/* Mission Vision values bento right column */}
        <div className="md:col-span-5 space-y-6">
          {/* Mission */}
          <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-xs">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-black text-white shrink-0 flex items-center justify-center">
                <Award className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-neutral-900 uppercase tracking-wider">Our Mission</h3>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  To supply premium organic baby outfits, accessories, and cute wear at direct factory pricing with exceptional customer satisfaction.
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-xs">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-black text-white shrink-0 flex items-center justify-center">
                <Gem className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-neutral-900 uppercase tracking-wider">Our Vision</h3>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  To grow as Pakistan's trusted household digital boutique for baby apparel, loved by moms and celebrated for quality.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic statistics numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-black">500+</span>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Stitch Patterns</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-black">10,000+</span>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Happy Babies</p>
            </div>
          </div>
        </div>

      </section>

      {/* 7. Standalone Customer Reviews Banner */}
      {layoutConfig.showReviews && (
        <section className="bg-neutral-950 py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase font-mono">Verified Testimonials</span>
            <h2 className="font-display text-2xl sm:text-3xl font-black mt-1 text-white">What Happy Moms Say</h2>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {REVIEWS.map((rev) => (
                <div key={rev.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex text-white gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current text-white" />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-xs italic mt-4 leading-relaxed font-medium">
                      "{rev.text}"
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-white pr-4">{rev.writer}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Contact Desk Form & Address Info Location Desk Grid */}
      {layoutConfig.showInquiry && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12 items-start text-left">
          
          {/* left column coordinates address details info */}
          <div className="md:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Phone className="h-5.5 w-5.5 text-black" />
              <h3 className="font-display text-lg font-bold text-neutral-900 uppercase tracking-tight">Contact Desk</h3>
            </div>
            
            <p className="text-xs text-neutral-500 leading-relaxed border-b border-neutral-200 pb-4">
              Have queries regarding matching sizing, gift packaging bundles, or custom orders? Reach out immediately to our Karachi assistance hotlines.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5 text-left">
                <MapPin className="h-5 w-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-tight">Boutique & Warehouse:</h4>
                  <p className="text-xs text-neutral-600 mt-1 whitespace-pre-line">The Sweet Baby Shop, Liaquatabad Town, Karachi, Pakistan</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-left">
                <Phone className="h-5 w-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-tight">Call Line Support:</h4>
                  <div className="space-y-1 mt-1 font-mono text-xs font-extrabold text-neutral-800">
                    <a href="tel:+923303511464" className="hover:underline block">
                      +92 330 3511464
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-left">
                <Mail className="h-5 w-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-tight">Official Email:</h4>
                  <a href="mailto:support@thesweetbabyshop.com" className="text-xs font-extrabold text-neutral-800 hover:underline mt-1 block font-mono">
                    support@thesweetbabyshop.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-left">
                <Clock className="h-5 w-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-tight">Timings Open:</h4>
                  <p className="text-xs text-neutral-600 mt-1">Monday – Saturday | 10:00 AM - 09:30 PM</p>
                </div>
              </div>
            </div>

            {/* Simple neat map graphic mock */}
            <div className="h-28 bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden relative flex items-center justify-center p-3">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative text-center">
                <MapPin className="h-5 w-5 text-black mx-auto mb-1 animate-bounce" />
                <span className="text-[10px] uppercase font-bold text-neutral-900 tracking-wider block">Liaquatabad Karachi</span>
                <span className="text-[8px] text-neutral-500 font-mono mt-0.5 block">24.9080° N, 67.0423° E</span>
              </div>
            </div>
          </div>

          {/* right column enquiry forms */}
          <div className="md:col-span-7 bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="font-display text-lg font-bold text-neutral-900 uppercase tracking-tight">Send Us A Direct Query</h3>
            <p className="text-xs text-neutral-500 mt-1">Submit your baby specifications and clothing requests. Our staff will check live stock and respond on WhatsApp.</p>
            
            <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider font-mono">Your Full Name: *</label>
                  <input 
                    type="text" 
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider font-mono">WhatsApp Mobile No: *</label>
                  <input 
                    type="tel" 
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. 03303511464"
                    required
                    className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider font-mono">Your Inquiry / Sizing details: *</label>
                <textarea 
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Describe baby height/weight or custom garment combinations required..."
                  required
                  className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={inquirySubmitted}
                className="w-full bg-black hover:bg-neutral-900 text-white font-bold text-xs tracking-wider uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {inquirySubmitted ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Transmit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </section>
      )}

      {/* 9. Brand footer area panel */}
      {layoutConfig.showFooter && (
        <footer className="mt-auto bg-neutral-900 text-white pt-16 pb-12 text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
            
            {/* Brand details and logo */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white p-3.5 rounded-2xl max-w-[14rem] flex justify-center items-center shadow-md">
                <Logo size="sm" showPhone={false} className="scale-95" />
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm pt-2">
                The Sweet Baby Shop is Pakistan's premier digital storefront for lovable, premium combed-cotton apparel, starter sets, playful kids clothing, and cute accessories crafted for ultimate childhood comfort.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pt-2">
                👶 Premium Softness • Liaquatabad Karachi
              </div>
            </div>

            {/* Links Quick column */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-display text-xs font-black uppercase tracking-wider text-zinc-200">Shop Collections</h4>
              <div className="flex flex-col gap-2 text-zinc-400 text-xs">
                {CATEGORIES.slice(0, 4).map((c) => (
                  <button 
                    key={c.id} 
                    onClick={() => {
                      setActiveCategory(c.id);
                      document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors text-left font-semibold cursor-pointer"
                  >
                    Shop Cute {c.name.split(' & ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Guidelines Links column */}
            <div className="md:col-span-4 space-y-4 text-xs font-mono">
              <h4 className="font-display text-xs font-black uppercase tracking-wider text-white">Trust Badges</h4>
              <div className="space-y-3 pt-1 text-zinc-400 font-sans">
                <p className="flex items-center gap-2.5">
                  <Truck className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
                  <span>Nationwide Pakistan Delivery COD</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
                  <span>Non-Allergenic 100% Baby Cotton Verified</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
                  <span>Guaranteed Direct Factory Rates</span>
                </p>
              </div>
            </div>

          </div>

          {/* Copy bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-850 mt-12 pt-8 space-y-4 text-zinc-500 text-[11px] font-mono text-center sm:text-left">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <span>&copy; {new Date().getFullYear()} The Sweet Baby Shop. All Rights Reserved.</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Safety Standard</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Terms of Love</a>
              </div>
            </div>

            {/* User-provided metadata info directly in footer */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse"></span>
                  <span className="text-white font-bold uppercase tracking-wider text-[10px]">Database Connection Status</span>
                </div>
                <p className="text-zinc-400 text-[10px]">
                  Connected to project <strong className="text-white">vwoqpxljyxqacadnpgfk</strong> | Owner Node <strong className="text-white">thesweetbabyshop@gmail.com</strong>
                </p>
                <div className="text-[9px] text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px] sm:max-w-md">
                  Publishable Key: sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q
                </div>
              </div>
              
              <button
                onClick={() => setIsManagerOpen(true)}
                className="px-4 py-2 bg-white text-black text-[10px] font-extrabold uppercase rounded-xl hover:bg-zinc-100 transition-colors shrink-0 tracking-wide cursor-pointer flex items-center gap-1.5"
              >
                🔐 Admin Panel & CRM Access
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* 10. Sticky WhatsApp Floating badge indicator clickable bottom right */}
      <a
        href="https://wa.me/923303511464?text=Assalam-o-Alaikum%20The%20Sweet%20Baby%20Shop!%20I%20am%20visiting%20your%20website%20and%20I%20need%20assistance."
        target="_blank"
        referrerPolicy="no-referrer"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full bg-[#25d366] p-4 text-white shadow-2xl hover:scale-105 transition-transform group"
        title="Chat on WhatsApp"
      >
        <span className="max-w-0 overflow-hidden font-bold text-xs whitespace-nowrap group-hover:max-w-xs group-hover:mr-2 transition-all duration-300">
          Chat With Us
        </span>
        <svg 
          role="img" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 fill-current"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.57.15-.097.297-.378.735-.462.83-.084.1-.168.11-.465-.04-.3-.149-1.265-.467-2.41-1.485-.89-.79-1.49-1.77-1.666-2.07-.176-.3-.02-.462.13-.61.137-.134.3-.349.45-.523.15-.174.2-.297.3-.495.1-.2.05-.371-.02-.52-.07-.149-.572-1.378-.784-1.893-.207-.502-.416-.434-.57-.442-.143-.008-.308-.01-.472-.01a.92.92 0 0 0-.668.312c-.23.25-.875.855-.875 2.083c0 1.228.89 2.414.992 2.551c.102.137 1.748 2.67 4.232 3.742c.592.255 1.055.408 1.417.522c.594.19 1.131.163 1.558.1c.475-.072 1.472-.6 1.67-.183l.035.035a1.866 1.866 0 0 1-.806 1.157c-.23.111-.53.21-.926.3c.097-.091.196-.183.29-.278zM12.016 0C5.383 0 0 5.385 0 12.018c0 2.223.606 4.3 1.657 6.104l-1.65 6.03l6.175-1.618a11.96 11.96 0 0 0 5.834 1.503c6.634 0 12.018-5.385 12.018-12.019c0-6.633-5.384-12.018-12.018-12.018zm0 22.02c-1.956 0-3.873-.526-5.55-1.523l-.398-.236l-3.666.96l.978-3.57l-.26-.413A9.972 9.972 0 0 1 12.016 2.008c5.518 0 10.01 4.49 10.01 10.01c0 5.517-4.492 10.012-10.01 10.012z"/>
        </svg>
      </a>

      {/* 11. MODALS HANDLER PORTALS */}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            isItemInCart={cartItems.some(item => item.product.id === selectedProduct.id)}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer off-canvas */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            cartItems={cartItems}
            onClose={() => setIsCartOpen(false)}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Checkout Forms Portal Dialog */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <CheckoutModal
            cartItems={cartItems}
            onClose={() => setIsCheckoutOpen(false)}
            onClearCart={handleClearCart}
            onOrderCompleted={hangleOrderCompleted}
          />
        )}
      </AnimatePresence>

      {/* Past Orders Tracker Board overlay Dialog */}
      <AnimatePresence>
        {isTrackerOpen && (
          <OrderTrackerModal
            orders={orders}
            onClose={() => setIsTrackerOpen(false)}
            onSimulateStatus={handleSimulateStatus}
          />
        )}
      </AnimatePresence>

      {/* Product Catalog & Inventory Manage Portal */}
      <AnimatePresence>
        {isManagerOpen && (
          <ProductManagerModal
            products={products}
            onClose={() => setIsManagerOpen(false)}
            onSaveProducts={saveProductsToStorage}
            slides={slides}
            onSaveSlides={saveSlidesToStorage}
            sessionOrders={orders}
            onSimulateStatus={handleSimulateStatus}
            layoutConfig={layoutConfig}
            onSaveLayoutConfig={saveLayoutConfigToStorage}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
