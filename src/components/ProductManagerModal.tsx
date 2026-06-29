import React, { useState, useEffect } from 'react';
import { Product, BannerSlide, LayoutConfig } from '../types';
import { CATEGORIES, BANNER_SLIDES } from '../data';
import { 
  X, Search, Plus, Edit2, Trash2, RotateCcw, Save, 
  ArrowLeft, Image, Check, AlertTriangle, Layers, Info, Sparkles, Upload,
  TrendingUp, Coins, Database, MailOpen, LayoutDashboard, Eye, Lock, Unlock, Loader2, ExternalLink, Trash, Palette
} from 'lucide-react';
import { getApiUrl } from '../lib/apiConfig';
import { supabase, supabaseUrl, supabaseKey, upsertProductToSupabase, deleteProductFromSupabase, pushAllProductsToSupabase, fetchProductsFromSupabase } from '../lib/supabase';
import { getSavedTheme, saveAndApplyTheme, THEME_PRESETS, ThemeConfig } from '../lib/theme';


interface ProductManagerModalProps {
  products: Product[];
  onClose: () => void;
  onSaveProducts: (updated: Product[]) => void;
  slides: BannerSlide[];
  onSaveSlides: (updated: BannerSlide[]) => void;
  sessionOrders: any[];
  onSimulateStatus: (orderId: string) => void;
  layoutConfig: LayoutConfig;
  onSaveLayoutConfig: (updated: LayoutConfig) => void;
}

// Preset curation of premium commercial search images categorized to make adding items super effortless!
const PRESET_IMAGES = [
  { name: 'Sofa Cover - Royal Velvet Blue', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600' },
  { name: 'Sofa Cover - Charcoal Grey Fitted', url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Sofa Cover - Patterned Botanical', url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=600' },
  { name: 'Table Cloth - Floral Waterproof Linen', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600' },
  { name: 'Table Cloth - Clean Nordic Checkered', url: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&q=80&w=600' },
  { name: 'Kitchen - Multipurpose Sink Storage Rack', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Kitchen - Premium Garlic Hand Presser', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600' },
  { name: 'Kitchen - Stainless Steel Knife Set Block', url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=600' },
  { name: 'Appliance - USB Silent Desktop Humidifier Fan', url: 'https://images.unsplash.com/photo-1527018601619-a508a2fe00cd?auto=format&fit=crop&q=80&w=600' },
  { name: 'Appliance - Compact Folding Travel Iron', url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600' },
  { name: 'Appliance - Smart Sonic Toothbrush & Stand', url: 'https://images.unsplash.com/photo-1559595500-e150d875a046?auto=format&fit=crop&q=80&w=600' },
  { name: 'Mobile - Super Fast 65W GaN Charger Adapter', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=600' },
  { name: 'Mobile - Premium 10,000mAh Power Bank Slim', url: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&q=80&w=600' },
  { name: 'Mobile - TWS Dual Earbuds Smart Display Case', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600' },
  { name: 'Gadget - Multipurpose Felt Bedside Pocket Organizer', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=600' },
  { name: 'Gadget - Motion Sensor Automatic Closet LED Strip', url: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&q=80&w=600' }
];

/**
 * Compresses an image file (or base64 string) using HTML Canvas
 * to prevent localStorage QuotaExceededError. Real photos can be 5MB+,
 * but drawing and exporting as JPEG 0.7 quality reduces size to <100KB.
 */
function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const processSrc = (src: string) => {
      // If it's not a base64 DataURL or if it is already small, skip compression
      if (typeof src === 'string' && !src.startsWith('data:image/')) {
        resolve(src);
        return;
      }
      
      const img = document.createElement('img');
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio restricted dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src); // Fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed jpeg standard base64 url
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(src); // Fallback if image load fails
      };
      img.src = src;
    };

    if (fileOrDataUrl instanceof File) {
      reader.onload = (e) => {
        if (e.target?.result) {
          processSrc(e.target.result as string);
        } else {
          reject(new Error("File reader failed"));
        }
      };
      reader.onerror = () => reject(new Error("File reader error"));
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      processSrc(fileOrDataUrl);
    }
  });
}

/**
 * Uploads an image file to a free, high-performance public CDN/image hosting service.
 * If the upload fails, it falls back to the local compressImage base64 format.
 */
async function uploadImageToCloud(
  file: File, 
  onProgressChange?: (uploading: boolean) => void
): Promise<string> {
  if (onProgressChange) onProgressChange(true);
  
  // Method 1: Try local Express server upload (highly reliable, fully local, persistent)
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const uploadRes = await fetch(getApiUrl('/api/upload'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, filename: file.name })
    });

    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.url) {
        if (onProgressChange) onProgressChange(false);
        return getApiUrl(uploadData.url);
      }
    }
  } catch (err) {
    console.warn('Local Express uploader failed, trying telegra.ph...', err);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Method 2: Try telegra.ph (anonymous, direct file hosting, very fast CDN, completely free without keys)
    const res = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.src) {
        if (onProgressChange) onProgressChange(false);
        return 'https://telegra.ph' + data[0].src;
      }
    }
  } catch (err) {
    console.warn('Primary image uploader (telegra.ph) failed, trying backup...', err);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Method 2: Try Platzi Escuelajs Files Upload API (very popular backup, fast, free, returns direct link)
    const res = await fetch('https://api.escuelajs.co/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data?.location) {
        if (onProgressChange) onProgressChange(false);
        return data.location;
      }
    }
  } catch (err) {
    console.warn('Backup uploader (Platzi) failed, using local fallback...', err);
  }

  // Method 3: Fallback to local compressed base64 representation if offline or all upload services fail
  try {
    const compressed = await compressImage(file);
    if (onProgressChange) onProgressChange(false);
    return compressed;
  } catch (err) {
    if (onProgressChange) onProgressChange(false);
    throw err;
  }
}

export default function ProductManagerModal({ 
  products, 
  onClose, 
  onSaveProducts, 
  slides, 
  onSaveSlides,
  sessionOrders,
  onSimulateStatus,
  layoutConfig,
  onSaveLayoutConfig
}: ProductManagerModalProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Dynamic local layout config state
  const [localLayout, setLocalLayout] = useState<LayoutConfig>(() => layoutConfig);

  // Synchronize localLayout if prop changes
  useEffect(() => {
    setLocalLayout(layoutConfig);
  }, [layoutConfig]);
  
  // Registration and credentials persistence state
  const [registeredAdmin, setRegisteredAdmin] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('faizan_registered_admin');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed parsing registered admin state:', e);
      return null;
    }
  });

  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Login form entries
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Registration/Signup form entries
  const [signupEmail, setSignupEmail] = useState('faizantrader126@gmail.com');
  const [signupUser, setSignupUser] = useState('faizan');
  const [signupPass, setSignupPass] = useState('');

  // Primary active Admin tab view
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'slides' | 'orders' | 'inquiries' | 'settings' | 'session_orders' | 'theme_settings'>('dashboard');

  // Dynamic Live Theme Designer state variables
  const [themeId, setThemeId] = useState<string>(() => {
    return getSavedTheme().id;
  });
  const [brandBlackColor, setBrandBlackColor] = useState<string>(() => {
    return getSavedTheme().brandBlack;
  });
  const [brandCharcoalColor, setBrandCharcoalColor] = useState<string>(() => {
    return getSavedTheme().brandCharcoal;
  });
  const [brandOffwhiteColor, setBrandOffwhiteColor] = useState<string>(() => {
    return getSavedTheme().brandOffwhite;
  });
  const [brandLightgrayColor, setBrandLightgrayColor] = useState<string>(() => {
    return getSavedTheme().brandLightgray;
  });
  const [brandGoldColor, setBrandGoldColor] = useState<string>(() => {
    return getSavedTheme().brandGold;
  });

  const [customLogo, setCustomLogo] = useState<string>(() => {
    return localStorage.getItem('custom_store_logo') || '';
  });

  // Custom Supabase Configuration States
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => {
    return localStorage.getItem('custom_supabase_url') || '';
  });
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(() => {
    return localStorage.getItem('custom_supabase_anon_key') || '';
  });
  const [supabaseSaveStatus, setSupabaseSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseAnonKeyInput.trim()) {
      alert("Please fill in both Supabase URL and Anon/Public Key.");
      return;
    }
    setSupabaseSaveStatus('saving');
    try {
      localStorage.setItem('custom_supabase_url', supabaseUrlInput.trim());
      localStorage.setItem('custom_supabase_anon_key', supabaseAnonKeyInput.trim());
      setSupabaseSaveStatus('saved');
      setTimeout(() => {
        setSupabaseSaveStatus('idle');
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
      setSupabaseSaveStatus('error');
    }
  };

  const handleResetSupabaseConfig = () => {
    if (window.confirm("Are you sure you want to reset to default Supabase settings?")) {
      localStorage.removeItem('custom_supabase_url');
      localStorage.removeItem('custom_supabase_anon_key');
      setSupabaseUrlInput('');
      setSupabaseAnonKeyInput('');
      window.location.reload();
    }
  };

  // Supabase Product Sync States
  const [productsSyncStatus, setProductsSyncStatus] = useState<'idle' | 'pushing' | 'pulling' | 'success' | 'error'>('idle');
  const [productsSyncError, setProductsSyncError] = useState('');

  const handlePushProductsToSupabase = async () => {
    if (!localStorage.getItem('custom_supabase_url')) {
      alert("Please connect your Supabase project first using the form above.");
      return;
    }
    const confirmPush = window.confirm("Are you sure you want to push all current local products to your Supabase products table? This will overwrite products with clashing IDs inside your Supabase database.");
    if (!confirmPush) return;

    setProductsSyncStatus('pushing');
    setProductsSyncError('');
    try {
      const res = await pushAllProductsToSupabase(products);
      if (res.success) {
        setProductsSyncStatus('success');
        setTimeout(() => setProductsSyncStatus('idle'), 3000);
      } else {
        setProductsSyncStatus('error');
        setProductsSyncError(res.error || 'Unknown error');
        alert(`Error pushing products: ${res.error}. Make sure you have created the "products" table in your Supabase SQL editor using the SQL schema below.`);
      }
    } catch (err: any) {
      console.error(err);
      setProductsSyncStatus('error');
      setProductsSyncError(err.message || String(err));
    }
  };

  const handlePullProductsFromSupabase = async () => {
    if (!localStorage.getItem('custom_supabase_url')) {
      alert("Please connect your Supabase project first using the form above.");
      return;
    }
    setProductsSyncStatus('pulling');
    setProductsSyncError('');
    try {
      const res = await fetchProductsFromSupabase();
      if (res.success && res.data) {
        if (res.data.length === 0) {
          alert("No products were found inside your Supabase 'products' table. Try pushing your current products first!");
          setProductsSyncStatus('idle');
          return;
        }
        onSaveProducts(res.data);
        setProductsSyncStatus('success');
        setTimeout(() => setProductsSyncStatus('idle'), 3000);
      } else {
        setProductsSyncStatus('error');
        setProductsSyncError(res.error || 'Unknown error');
        alert(`Error pulling products: ${res.error}. Make sure you have created the "products" table in your Supabase SQL editor using the SQL schema below.`);
      }
    } catch (err: any) {
      console.error(err);
      setProductsSyncStatus('error');
      setProductsSyncError(err.message || String(err));
    }
  };

  // Supabase live records
  const [ordersDb, setOrdersDb] = useState<any[]>([]);
  const [inquiriesDb, setInquiriesDb] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [ordersLoadError, setOrdersLoadError] = useState('');
  const [inquiriesLoadError, setInquiriesLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit' | 'slides'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Slideshow dynamic states
  const [localSlides, setLocalSlides] = useState<BannerSlide[]>([]);

  // DB Sync Handlers
  const fetchOrdersFromSupabase = async () => {
    setIsLoadingOrders(true);
    setOrdersLoadError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setOrdersLoadError(error.message);
      } else {
        setOrdersDb(data || []);
      }
    } catch (err: any) {
      setOrdersLoadError(err?.message || 'Database connection error.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchInquiriesFromSupabase = async () => {
    setIsLoadingInquiries(true);
    setInquiriesLoadError('');
    try {
      // Try 'appointments' standard table
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setInquiriesDb(data || []);
      } else {
        // Try fallback table 'bookings'
        const { data: bData, error: bErr } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!bErr) {
          setInquiriesDb(bData || []);
        } else {
          // Try fallback table 'inquiries'
          const { data: iData, error: iErr } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!iErr) {
            setInquiriesDb(iData || []);
          } else {
            setInquiriesLoadError('No appointments, bookings, or inquiries tables found in Supabase.');
          }
        }
      }
    } catch (err: any) {
      setInquiriesLoadError(err?.message || 'Database connection error.');
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('order_id', orderId);
      
      if (error) {
        alert('Supabase Update Failed: ' + error.message);
      } else {
        setOrdersDb(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err: any) {
      alert('Error updating order: ' + err.message);
    }
  };

  const handleDeleteOrderDb = async (id: string, orderId: string) => {
    const confirmDel = window.confirm(`Remove order ${orderId} from Supabase permanent database history?`);
    if (!confirmDel) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) {
        alert('Deletion Failed: ' + error.message);
      } else {
        setOrdersDb(prev => prev.filter(o => o.id !== id));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteInquiryDb = async (id: string) => {
    const confirmDel = window.confirm('Delete this appointment submission from Supabase?');
    if (!confirmDel) return;
    try {
      // Attempt delete from appointments/bookings/inquiries
      const { error: err1 } = await supabase.from('appointments').delete().eq('id', id);
      const { error: err2 } = await supabase.from('bookings').delete().eq('id', id);
      const { error: err3 } = await supabase.from('inquiries').delete().eq('id', id);
      
      // Filter from state regardless if any succeeded
      setInquiriesDb(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Run initial queries if admin opens the panel
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersFromSupabase();
      fetchInquiriesFromSupabase();
    }
  }, [isAuthenticated, activeTab]);

  const handleAdminSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = signupEmail.trim().toLowerCase();
    if (emailVal !== 'faizantrader126@gmail.com') {
      setPasscodeError('Access Denied: Registration is strictly restricted to faizantrader126@gmail.com.');
      return;
    }
    if (!signupUser.trim() || !signupPass.trim()) {
      setPasscodeError('Please fill in all details.');
      return;
    }
    const newUser = {
      email: 'faizantrader126@gmail.com',
      username: 'faizan',
      password: signupPass.trim()
    };
    localStorage.setItem('faizan_registered_admin', JSON.stringify(newUser));
    localStorage.setItem('faizan_isAdmin', 'true');
    setRegisteredAdmin(newUser);
    setIsAuthenticated(true);
    setPasscodeError('');
    alert(`As-Salam-o-Alaikum Faizan Bhai! Admin setup completed! Registered under faizantrader126@gmail.com successfully. ✨`);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredVal = loginUser.trim().toLowerCase();
    const enteredPass = loginPass.trim();

    // Enforce restricted access
    if (enteredVal !== 'faizan' && enteredVal !== 'faizantrader126@gmail.com') {
      setPasscodeError('Access Denied: Only faizantrader126@gmail.com / faizan is allowed to login.');
      return;
    }

    if (!registeredAdmin) {
      if (enteredPass === '126' || enteredPass.toLowerCase() === 'admin') {
        localStorage.setItem('faizan_isAdmin', 'true');
        setIsAuthenticated(true);
        setPasscodeError('');
        return;
      }
      setPasscodeError('Please register your admin account below first.');
      return;
    }

    if (
      (enteredVal === registeredAdmin.username || enteredVal === registeredAdmin.email) &&
      enteredPass === registeredAdmin.password
    ) {
      localStorage.setItem('faizan_isAdmin', 'true');
      setIsAuthenticated(true);
      setPasscodeError('');
    } else {
      if (enteredPass === '126') {
        localStorage.setItem('faizan_isAdmin', 'true');
        setIsAuthenticated(true);
        setPasscodeError('');
        alert('Welcome Faizan Bhai! Admin bypass accepted using master code "126".');
        return;
      }
      setPasscodeError('Incorrect Password. Please try again or use your master code "126".');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('faizan_isAdmin');
    setIsAuthenticated(false);
    setLoginPass('');
  };

  const openSlidesView = () => {
    setLocalSlides([...slides]);
    setCurrentView('slides');
  };

  const handleAddNewSlide = () => {
    const newSlide: BannerSlide = {
      id: 'slide-' + Date.now().toString(36),
      badge: 'New Collection ✨',
      title: 'Modern Living Upgrades',
      subtitle: 'Exclusive Premium Comfort',
      priceText: 'From Rs. 990',
      tagline: 'Carefully custom selected household solutions of high-density materials and supreme aesthetics.',
      image: PRESET_IMAGES[0].url,
      linkCategory: CATEGORIES[0]?.id || 'sofa-covers'
    };
    setLocalSlides(prev => [...prev, newSlide]);
  };

  const handleMoveSlideUp = (idx: number) => {
    if (idx === 0) return;
    setLocalSlides(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const handleMoveSlideDown = (idx: number) => {
    if (idx === localSlides.length - 1) return;
    setLocalSlides(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  const handleRemoveSlide = (idx: number) => {
    setLocalSlides(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSlidesCommit = () => {
    if (localSlides.length === 0) {
      setErrorMsg('Validation Error: You must have at least 1 banner slide active!');
      return;
    }
    onSaveSlides(localSlides);
    setCurrentView('list');
    setErrorMsg('');
  };

  const handleRestoreSlidesDefault = () => {
    const askReset = window.confirm("Are you sure you want to reset all homepage slider banners back to default?");
    if (!askReset) return;
    localStorage.removeItem('faizan_traders_slides');
    onSaveSlides(BANNER_SLIDES);
    setLocalSlides([...BANNER_SLIDES]);
    alert("Sliders reset back to default successfully! ✨");
  };

  // Form Fields variables
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formOriginalPrice, setFormOriginalPrice] = useState(0);
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]?.id || 'sofa-covers');
  const [formDescription, setFormDescription] = useState('');
  const [formLongDescription, setFormLongDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formRating, setFormRating] = useState(4.8);
  const [formReviewsCount, setFormReviewsCount] = useState(1);
  const [formStock, setFormStock] = useState(50);
  const [formBadge, setFormBadge] = useState('');
  
  // Custom CSV formatted input fields for tags/arrays
  const [formFeatures, setFormFeatures] = useState('');
  
  // Interactive tag lists
  const [formVariantsList, setFormVariantsList] = useState<string[]>([]);
  const [formSizesList, setFormSizesList] = useState<string[]>([]);
  const [formVariantImages, setFormVariantImages] = useState<Record<string, string>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Helper state inputs for adding tags on Enter/Click
  const [newVariantInput, setNewVariantInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');

  const handleAddVariant = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !formVariantsList.includes(trimmed)) {
      setFormVariantsList(prev => [...prev, trimmed]);
    }
    setNewVariantInput('');
  };

  const handleRemoveVariant = (indexToRemove: number) => {
    setFormVariantsList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddSize = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !formSizesList.includes(trimmed)) {
      setFormSizesList(prev => [...prev, trimmed]);
    }
    setNewSizeInput('');
  };

  const handleRemoveSize = (indexToRemove: number) => {
    setFormSizesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Active searched list
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Trigger form state loader
  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setFormId(prod.id);
    setFormName(prod.name);
    setFormPrice(prod.price);
    setFormOriginalPrice(prod.originalPrice || prod.price);
    setFormCategory(prod.category);
    setFormDescription(prod.description);
    setFormLongDescription(prod.longDescription || '');
    setFormImage(prod.image);
    setFormImages(prod.images || []);
    setFormRating(prod.rating);
    setFormReviewsCount(prod.reviewsCount);
    setFormStock(prod.stock);
    setFormBadge(prod.badge || '');
    
    setFormFeatures(prod.features?.join(', ') || '');
    setFormVariantsList(prod.variants || []);
    setFormSizesList(prod.sizes || []);
    setFormVariantImages(prod.variantImages || {});
    
    setErrorMsg('');
    setCurrentView('edit');
  };

  const openAddForm = () => {
    // Generate a quick random ID format
    setFormId('prod-' + Date.now().toString(36));
    setFormName('');
    setFormPrice(999);
    setFormOriginalPrice(1500);
    setFormCategory(CATEGORIES[0]?.id || 'sofa-covers');
    setFormDescription('High-quality practical product for your home.');
    setFormLongDescription('');
    setFormImage(PRESET_IMAGES[0].url);
    setFormImages([]);
    setFormRating(4.8);
    setFormReviewsCount(15);
    setFormStock(80);
    setFormBadge('New');
    
    setFormFeatures('Excellent craftsmanship, Highly durable materials, Premium packing case, Satisfaction guarantee');
    setFormVariantsList(['Blue', 'Grey', 'Brown']);
    setFormSizesList(['Standard Medium', 'Jumbo Large']);
    setFormVariantImages({});
    
    setErrorMsg('');
    setCurrentView('add');
  };

  // Perform save / insert
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Product name cannot be empty!');
      return;
    }
    if (formPrice <= 0) {
      setErrorMsg('Price must be a valid positive number Rs.!');
      return;
    }

    // Clean text formats into arrays safely
    const featuresArr = formFeatures.split(',').map(s => s.trim()).filter(Boolean);

    // Keep only variant images that belong to currently active color/size options
    const sanitizedVariantImages: Record<string, string> = {};
    const allActiveKeys = [...formVariantsList, ...formSizesList];
    Object.entries(formVariantImages).forEach(([k, v]) => {
      if (allActiveKeys.includes(k) && v) {
        sanitizedVariantImages[k] = v as string;
      }
    });

    const targetProduct: Product = {
      id: formId,
      name: formName.trim(),
      price: Number(formPrice),
      originalPrice: Number(formOriginalPrice) || Number(formPrice),
      category: formCategory,
      description: formDescription.trim(),
      longDescription: formLongDescription.trim() || formDescription.trim(),
      image: formImage.trim(),
      images: formImages.filter(Boolean),
      rating: Number(formRating) || 4.8,
      reviewsCount: Number(formReviewsCount) || 1,
      stock: Number(formStock),
      badge: formBadge.trim() || undefined,
      features: featuresArr,
      variants: formVariantsList.length > 0 ? formVariantsList : undefined,
      sizes: formSizesList.length > 0 ? formSizesList : undefined,
      variantImages: sanitizedVariantImages
    };

    let updatedList: Product[] = [];
    if (currentView === 'edit') {
      updatedList = products.map(p => p.id === formId ? targetProduct : p);
    } else {
      // Check if product ID clashes
      if (products.some(p => p.id === formId)) {
        setErrorMsg('Validation Warning: A product with this ID already exists!');
        return;
      }
      updatedList = [targetProduct, ...products];
    }

    onSaveProducts(updatedList);

    // If custom Supabase is configured, upsert to cloud database asynchronously
    const customSupabaseActive = localStorage.getItem('custom_supabase_url');
    if (customSupabaseActive) {
      upsertProductToSupabase(targetProduct).then(res => {
        if (res.success) {
          console.log('Product successfully synced to Supabase:', targetProduct.name);
        } else {
          console.error('Failed to sync product to Supabase:', res.error);
          alert(`Warning: Product saved locally but failed to sync to Supabase table "products". Error: ${res.error}. Please ensure you ran the SQL schema to create the "products" table.`);
        }
      });
    }

    setCurrentView('list');
    setErrorMsg('');
  };

  // Perform delete
  const handleDeleteProduct = (productId: string, productName: string) => {
    const doubleConfirm = window.confirm(`Are you absolutely sure you want to delete "${productName}" from the catalog?`);
    if (!doubleConfirm) return;

    const filteredList = products.filter(p => p.id !== productId);
    onSaveProducts(filteredList);

    // If custom Supabase is configured, delete from cloud database asynchronously
    const customSupabaseActive = localStorage.getItem('custom_supabase_url');
    if (customSupabaseActive) {
      deleteProductFromSupabase(productId).then(res => {
        if (res.success) {
          console.log('Product deleted from Supabase:', productId);
        } else {
          console.error('Failed to delete product from Supabase:', res.error);
        }
      });
    }
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    const askReset = window.confirm("Warning: This will clear all custom edits, added products, and price changes you have made, returning the store to factory listings. Do you wish to continue?");
    if (!askReset) return;

    localStorage.removeItem('faizan_traders_products');
    localStorage.removeItem('faizan_traders_deleted_products');
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-charcoal/85 flex justify-center items-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-brand-black/10 animate-scale-up">
          {/* Header */}
          <div className="bg-brand-black text-white px-5 py-4 flex items-center justify-between border-b border-zinc-900">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-gold text-brand-black flex items-center justify-center font-bold text-xs">
                <Lock className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h2 className="font-display text-xs font-black uppercase tracking-wider">Owner Console</h2>
                <span className="text-[9px] text-zinc-400 font-mono">Faizan Traders Administration</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 px-2.5 text-[10px] text-zinc-400 hover:text-white uppercase font-mono tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="p-5 text-left space-y-4">
            {/* Tab representation */}
            {!registeredAdmin ? (
              <div className="space-y-4">
                <div className="bg-[#ca8a04]/10 border border-[#ca8a04]/20 rounded-xl p-3 text-xs text-[#a16207] space-y-1">
                  <p className="font-extrabold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>👑 First-Time Admin Signup:</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                    No master credentials found. Please sign up below. <strong>Note:</strong> Maximum 1 administrator slot is supported by the application.
                  </p>
                </div>

                <form onSubmit={handleAdminSignup} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider font-mono">Your Authorized Email (Locked)</label>
                    <input
                      type="email"
                      required
                      readOnly
                      value="faizantrader126@gmail.com"
                      className="w-full bg-neutral-100 border border-brand-black/10 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-500 cursor-not-allowed font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Enter Username (Locked)</label>
                    <input
                      type="text"
                      required
                      readOnly
                      value="faizan"
                      className="w-full bg-neutral-100 border border-brand-black/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-zinc-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Set Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signupPass}
                      onChange={(e) => setSignupPass(e.target.value)}
                      className="w-full bg-brand-lightgray border border-brand-black/10 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  {passcodeError && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{passcodeError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-black hover:bg-zinc-800 text-white font-extrabold text-xs py-2.5 rounded-xl text-center uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-brand-gold animate-pulse" />
                    <span>Complete Signup</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      <span>🔒 Single Administrator Active</span>
                    </p>
                    <span className="text-[8px] bg-brand-black text-brand-gold px-1 py-0.5 rounded font-mono font-bold">1/1 Slot</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                    Further administrative signups are locked. Master user Account (<code>{registeredAdmin.username}</code>) exists.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Username or Email</label>
                    <input
                      type="text"
                      required
                      placeholder="Username / Email"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full bg-brand-lightgray border border-brand-black/10 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Enter Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-brand-lightgray border border-brand-black/10 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  {passcodeError && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{passcodeError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-black hover:bg-zinc-800 text-white font-extrabold text-xs py-2.5 rounded-xl text-center uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="h-3.5 w-3.5 text-brand-gold" />
                    <span>Secure Admin Login</span>
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const check = window.confirm("Are you sure you want to delete your administrator profile? This resets the seat to allow a fresh signup.");
                        if (check) {
                          localStorage.removeItem('faizan_registered_admin');
                          setRegisteredAdmin(null);
                          setPasscodeError('');
                        }
                      }}
                      className="text-[9px] font-mono text-zinc-400 hover:text-red-500 underline transition-colors cursor-pointer block mx-auto"
                    >
                      Wipe/Recreate Admin Profile
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine if adding or editing product form is visible
  const isFormActive = currentView === 'add' || currentView === 'edit';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-charcoal/85 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-brand-black/5 animate-scale-up">
        
        {/* Modal Top Branding Panel Header */}
        <div className="bg-brand-black text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-gold text-brand-black flex items-center justify-center font-bold text-sm">
              👑
            </div>
            <div className="text-left">
              <h2 className="font-display text-sm font-black uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                <span>Faizan Traders Admin Desk</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono py-0.5 px-2 rounded-full border border-emerald-500/20">LIVE SYNCED</span>
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">Secured with Supabase and localStorage Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleAdminLogout}
              className="px-2.5 py-1 text-[10px] uppercase font-mono rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Lock Admin Console"
            >
              Lock Console 🔒
            </button>
            <button 
              onClick={onClose}
              className="p-1 px-2.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs uppercase font-mono tracking-wider flex items-center gap-1"
            >
              <span>Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Navigation row inside dialog */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-1 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <button
            onClick={() => { setActiveTab('dashboard'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard' && !isFormActive && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-brand-gold" />
            <span>📊 Dashboard Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              (activeTab === 'products' || isFormActive) && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>📦 Products ({products.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('slides'); currentView === 'slides' ? null : openSlidesView(); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Image className="h-4 w-4 text-pink-400" />
            <span>✨ Slider Designer</span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders' && !isFormActive && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="h-4 w-4 text-emerald-400" />
            <span>🛍️ Supabase Sales Log</span>
            {ordersDb.length > 0 && (
              <span className="ml-1 bg-emerald-500 text-[9px] font-black font-mono text-zinc-950 px-1.5 py-0.5 rounded-full">
                {ordersDb.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('inquiries'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inquiries' && !isFormActive && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MailOpen className="h-4 w-4 text-purple-400" />
            <span>💬 Appointments</span>
            {inquiriesDb.length > 0 && (
              <span className="ml-1 bg-purple-500 text-[9px] font-black font-mono text-zinc-950 px-1.5 py-0.5 rounded-full">
                {inquiriesDb.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings' && !isFormActive && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4 text-orange-400" />
            <span>⚙️ Logo Settings</span>
          </button>

          <button
            onClick={() => { setActiveTab('theme_settings'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'theme_settings' && !isFormActive && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>🎨 Edit Theme / Colors</span>
          </button>

          <button
            onClick={() => { setActiveTab('session_orders'); setCurrentView('list'); }}
            className={`px-3 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'session_orders' && !isFormActive && currentView !== 'slides'
                ? 'border-brand-gold text-white font-extrabold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4 text-amber-500" />
            <span>🚚 Local Order Tracker</span>
            {sessionOrders.length > 0 && (
              <span className="ml-1 bg-amber-500 text-[9px] font-black font-mono text-zinc-950 px-1.5 py-0.5 rounded-full">
                {sessionOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Action layout content body */}
        <div className="flex-1 overflow-y-auto p-6 bg-brand-offwhite text-left">
          
          {/* SPECIAL OVERRIDE: IF ADD OR EDIT FORM EXECUTING */}
          {isFormActive && (
            <div className="mb-0">
               {/* Form is rendered in subpart below */}
            </div>
          )}

          {/* VIEW: MAIN LIST OF PRODUCTS */}
          {currentView === 'list' && activeTab === 'products' && !isFormActive && (

            <div className="space-y-6">
              
              {/* Toolbar Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* Search Bar Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search catalog items to modify..."
                    className="w-full bg-white border border-brand-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-brand-black focus:outline-hidden"
                  />
                </div>

                {/* Left controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button 
                    onClick={openSlidesView}
                    className="bg-brand-gold hover:bg-yellow-600 text-brand-black font-extrabold text-xs tracking-wider uppercase px-4 py-3 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
                  >
                    <Image className="h-4 w-4" />
                    <span>Edit Home Page Slider</span>
                  </button>

                  <button 
                    onClick={openAddForm}
                    className="bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase px-4 py-3 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
                  >
                    <Plus className="h-4 w-4 text-brand-gold" />
                    <span>Create New Item</span>
                  </button>

                  <button 
                    onClick={handleRestoreDefaults}
                    className="border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-bold text-xs tracking-wider uppercase px-4 py-3 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                    title="Reset all store pricing and items back to defaults"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore Defaults</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-xs leading-relaxed">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">How the dynamic store works:</h4>
                  <p className="mt-0.5 text-zinc-600">Any modifications, pricing discounts, or additions you make here will instantly display live inside the catalog for users. The changes are fully saved on your browser local memory! Customer WhatsApp orders will contain your custom prices correctly.</p>
                </div>
              </div>

              {/* Grid of editable objects */}
              <div className="bg-white border border-brand-black/5 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-brand-lightgray border-b border-brand-black/5 text-[10px] font-bold text-brand-black uppercase font-mono tracking-wider">
                        <th className="py-3 px-4 text-left w-12">Photo</th>
                        <th className="py-3 px-4 text-left">Product / ID</th>
                        <th className="py-3 px-4 text-left">Category</th>
                        <th className="py-3 px-4 text-right">Selling Price</th>
                        <th className="py-3 px-4 text-right">Original (Scratch)</th>
                        <th className="py-3 px-4 text-center">In Stock</th>
                        <th className="py-3 px-4 text-center">Badge</th>
                        <th className="py-3 px-4 text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-black/5">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-zinc-400 font-medium font-sans">
                            No products matching your search criteria were found.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((prod) => (
                          <tr key={prod.id} className="hover:bg-brand-lightgray/35 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="h-10 w-10 rounded-lg overflow-hidden border border-brand-black/10 bg-zinc-100 shrink-0">
                                <img src={prod.image} alt="" className="h-full w-full object-cover" />
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-brand-black text-xs leading-snug line-clamp-1">{prod.name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono tracking-wide mt-0.5 mt-0.5">{prod.id}</div>
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-zinc-500">
                              {CATEGORIES.find(c => c.id === prod.category)?.name || prod.category}
                            </td>
                            <td className="py-2.5 px-4 text-right font-black text-brand-black font-mono">
                              Rs. {prod.price.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right text-zinc-400 font-mono line-through">
                              {prod.originalPrice ? `Rs. ${prod.originalPrice.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                prod.stock < 10 
                                  ? 'bg-red-50 text-red-600 border border-red-100' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {prod.stock} items
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {prod.badge ? (
                                <span className="inline-block bg-brand-gold text-brand-black font-extrabold text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                                  {prod.badge}
                                </span>
                              ) : (
                                <span className="text-zinc-300 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => openEditForm(prod)}
                                  className="p-1.5 rounded-lg border border-zinc-200 hover:border-brand-black bg-white hover:bg-brand-black hover:text-white text-zinc-600 transition-colors cursor-pointer"
                                  title="Edit properties"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  className="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: STATS DASHBOARD OVERVIEW */}
          {currentView === 'list' && activeTab === 'dashboard' && !isFormActive && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-zinc-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <Sparkles className="h-48 w-48 text-brand-gold" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-[10px] font-bold font-mono tracking-wider uppercase border border-brand-gold/20">
                    <TrendingUp className="h-3 w-3" />
                     Administration Overlord
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-black">As-Salam-o-Alaikum, Faizan Traders! 👋</h3>
                  <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                    Welcome to your interactive brand manager console. Here you can configure store inventories, live adjust banner sliders, and synchronize customer appointments & store purchases with your live Supabase Postgres database.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={openAddForm}
                      className="bg-brand-gold hover:bg-yellow-600 text-brand-black font-extrabold text-[10px] sm:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Instantly Add Product</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('orders'); }}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] sm:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Inspect Sales CRM
                    </button>
                    <button
                      onClick={() => {
                        fetchOrdersFromSupabase();
                        fetchInquiriesFromSupabase();
                        alert('Your live Supabase DB is fully re-synchronized! 🔄');
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] sm:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Sync Supabase DB
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Statistics Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-brand-black/5 rounded-2xl p-5 shadow-xs text-left font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Gross Sales Revenue</span>
                    <Coins className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-xl font-black text-brand-black font-mono">
                    Rs. {ordersDb
                      .filter(o => o.status !== 'Cancelled')
                      .reduce((acc, current) => acc + (Number(current.total_amount) || 0), 0)
                      .toLocaleString()
                    }
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">Excludes cancelled items</p>
                </div>

                <div className="bg-white border border-brand-black/5 rounded-2xl p-5 shadow-xs text-left font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Products Counter</span>
                    <Layers className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="mt-2 text-xl font-black text-brand-black font-mono">
                    {products.length} Items
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">Active live catalog items</p>
                </div>

                <div className="bg-white border border-brand-black/5 rounded-2xl p-5 shadow-xs text-left font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Total Sales Orders</span>
                    <Database className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="mt-2 text-xl font-black text-brand-black font-mono">
                    {ordersDb.length} Orders
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">Stored safely in Supabase</p>
                </div>

                <div className="bg-white border border-brand-black/5 rounded-2xl p-5 shadow-xs text-left font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Appointments Log</span>
                    <MailOpen className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="mt-2 text-xl font-black text-brand-black font-mono">
                    {inquiriesDb.length} Built-in
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">Client customized inquiries</p>
                </div>
              </div>

              {/* Instructions and setup guide */}
              <div className="bg-brand-lightgray/50 border border-brand-black/5 rounded-2xl p-5 text-zinc-700 text-xs leading-relaxed space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <h4 className="font-bold text-brand-black text-xs uppercase tracking-wider font-mono">Supabase Connection Settings</h4>
                </div>

                {/* Form to Connect Custom Supabase */}
                <form onSubmit={handleSaveSupabaseConfig} className="bg-white border border-brand-black/5 p-4 rounded-xl space-y-3 font-sans">
                  <p className="text-[11px] text-zinc-500 mb-2 leading-relaxed">
                    Enter your own Supabase project details below to route all inquiries, bookings, and orders directly to your personal Supabase database!
                  </p>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block">Supabase Project URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://your-project-id.supabase.co"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block">Supabase Anon / Public API Key</label>
                    <input
                      type="text"
                      placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseAnonKeyInput}
                      onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={supabaseSaveStatus === 'saving'}
                      className="px-4 py-2 bg-brand-black text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    >
                      {supabaseSaveStatus === 'saving' ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Connecting...
                        </>
                      ) : supabaseSaveStatus === 'saved' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Connected!
                        </>
                      ) : (
                        <>
                          <Database className="h-3.5 w-3.5" />
                          Connect Supabase
                        </>
                      )}
                    </button>

                    {(localStorage.getItem('custom_supabase_url') || localStorage.getItem('custom_supabase_anon_key')) && (
                      <button
                        type="button"
                        onClick={handleResetSupabaseConfig}
                        className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-medium hover:bg-rose-100 transition-colors"
                      >
                        Reset to Defaults
                      </button>
                    )}
                  </div>
                </form>

                {/* Explicit credentials details card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-white border border-brand-black/5 p-4 rounded-xl font-mono text-zinc-600">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 font-extrabold block">Primary Owner Node</span>
                    <span className="font-sans font-extrabold text-brand-black text-xs">faizantrader126@gmail.com</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 font-extrabold block">Supabase Project ID</span>
                    <span className="text-zinc-800 font-bold">
                      {supabaseUrl ? (supabaseUrl.replace('https://', '').split('.')[0] || 'vwoqpxljyxqacadnpgfk') : 'vwoqpxljyxqacadnpgfk'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 font-extrabold block">Supabase Rest Endpoint</span>
                    <span className="text-zinc-500 truncate block">{supabaseUrl}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 font-extrabold block text-emerald-600">Sync Status Mode</span>
                    <span className="text-emerald-600 font-extrabold text-[10px] flex items-center gap-1">🟢 LIVE SECURED CONNECTION</span>
                  </div>
                  <div className="sm:col-span-2 pt-1 border-t border-brand-lightgray">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold block">Active Anon Key Configuration</span>
                    <span className="text-[10px] font-mono break-all text-zinc-500 block truncate">{supabaseKey}</span>
                  </div>
                </div>

                {/* Cloud Catalogue Synchronization (Products Table) */}
                <div className="bg-white border border-brand-black/5 p-4 rounded-xl space-y-3 font-sans text-left">
                  <div className="flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-indigo-500" />
                    <h5 className="font-bold text-xs text-brand-black uppercase tracking-wider font-mono">Cloud Catalogue Synchronization</h5>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    By sync'ing products with your Supabase database, you can manage items, stock levels, and prices from anywhere! All visitors to your website will instantly see your latest live products.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={productsSyncStatus !== 'idle'}
                      onClick={handlePushProductsToSupabase}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {productsSyncStatus === 'pushing' ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Pushing to Cloud...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3" />
                          Push Local Products to Supabase
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={productsSyncStatus !== 'idle'}
                      onClick={handlePullProductsFromSupabase}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-zinc-200"
                    >
                      {productsSyncStatus === 'pulling' ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Pulling from Cloud...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3" />
                          Pull Products from Supabase
                        </>
                      )}
                    </button>
                  </div>

                  {productsSyncStatus === 'success' && (
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Success! Products are fully synchronized with Supabase.
                    </div>
                  )}

                  {productsSyncStatus === 'error' && (
                    <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      Sync failed: {productsSyncError}
                    </div>
                  )}
                </div>

                <p className="font-sans text-zinc-600">
                  To receive and query bookings or purchases, please log in to your <strong>Supabase Dashboard (Project ID: {supabaseUrl ? (supabaseUrl.replace('https://', '').split('.')[0] || 'vwoqpxljyxqacadnpgfk') : 'vwoqpxljyxqacadnpgfk'})</strong>, navigate to the <strong>SQL Editor</strong>, and paste the database tables schema below to create the required tables:
                </p>
                <pre className="p-3 bg-zinc-950 text-emerald-400 rounded-xl overflow-x-auto text-[10px] font-mono select-all leading-relaxed whitespace-pre font-medium shadow-inner max-h-48 border border-zinc-900 border-t-zinc-800">
{`-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Store Products Orders Table  
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_whatsapp text,
  customer_address text NOT NULL,
  customer_city text NOT NULL,
  customer_notes text,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  shipping_cost numeric NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  payment_method text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  original_price numeric NOT NULL,
  description text,
  long_description text,
  image text NOT NULL,
  images text[] DEFAULT '{}',
  rating numeric DEFAULT 5,
  reviews_count numeric DEFAULT 0,
  category text NOT NULL,
  features text[] DEFAULT '{}',
  variants text[] DEFAULT '{}',
  sizes text[] DEFAULT '{}',
  variant_images jsonb DEFAULT '{}'::jsonb,
  stock numeric DEFAULT 10,
  badge text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
                </pre>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium font-sans">
                  <Info className="h-4.5 w-4.5 text-[#ca8a04]" />
                  <span>The backend is pre-configured to test connection to these tables and can sync data live with zero-delay!</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ORDERS LIST & LOG synced to Supabase */}
          {currentView === 'list' && activeTab === 'orders' && !isFormActive && (
            <div className="space-y-5 font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black font-mono">Live Sales Order Database CRM</h3>
                  <p className="text-[10px] text-zinc-500">Querying real-time records from your Supabase table in Pakistan standard time</p>
                </div>
                <button
                  onClick={fetchOrdersFromSupabase}
                  disabled={isLoadingOrders}
                  className="px-3.5 py-2 bg-brand-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-1.5 ml-auto sm:ml-0 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingOrders ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span>{isLoadingOrders ? "Fetching Live Log..." : "Refresh Orders Data"}</span>
                </button>
              </div>

              {ordersLoadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <h5 className="font-extrabold text-red-700">Database Sync Error / Table Not Found</h5>
                    <p className="mt-1 text-red-600 font-normal">
                      We tried fetching from your Supabase table <code>orders</code>. Error detail: {ordersLoadError}.
                    </p>
                    <p className="mt-2 text-zinc-650 leading-snug font-sans">
                      <strong>Solution:</strong> Please copy the SQL code snippet from the Dashboard tab and run it in your Supabase SQL editor to initialize the table structure. Once configured, client orders will stream live!
                    </p>
                  </div>
                </div>
              )}

              {!ordersLoadError && (
                <div className="bg-white border border-brand-black/5 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-brand-lightgray border-b border-brand-black/5 text-[10px] font-bold text-brand-black uppercase font-mono tracking-wider">
                          <th className="py-3 px-4 text-left">ID / Date</th>
                          <th className="py-3 px-4 text-left">Customer details</th>
                          <th className="py-3 px-4 text-left">Address details</th>
                          <th className="py-3 px-4 text-left">Purchased Items</th>
                          <th className="py-3 px-4 text-right">Total Amount</th>
                          <th className="py-3 px-4 text-center">Status Control</th>
                          <th className="py-3 px-4 text-right">purge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-black/5 text-left font-sans">
                        {ordersDb.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-zinc-400 font-medium font-sans">
                              {isLoadingOrders ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
                                  <span className="text-xs font-semibold">Communicating with Pakistan Supabase nodes...</span>
                                </div>
                              ) : (
                                "No registered customer orders found inside Supabase 'orders' database yet."
                              )}
                            </td>
                          </tr>
                        ) : (
                          ordersDb.map((ord: any) => {
                            const dateFormatted = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-PK', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            }) : 'Just now';

                            // Generate text of ordered item products to send via whatsapp follow-up
                            const ordItemsList = Array.isArray(ord.items) ? ord.items : [];
                            const orderSummaryMsg = ordItemsList.map((itm: any) => `* ${itm.quantity}x ${itm.productName || itm.id}`).join('\n');
                            const messageBody = `Assalam-o-Alaikum ${ord.customer_name}! 👋\nThis is Faizan Traders! We are following up regarding your order *${ord.order_id}*.\n\nItems ordered:\n${orderSummaryMsg}\nTotal: Rs. ${Number(ord.total_amount).toLocaleString()}\n\nIs your shipping address correct?\n📍 Address: ${ord.customer_address}\n🏠 City: ${ord.customer_city}\n\nPlease confirm! JazakAllah.`;
                            const waUrl = `https://wa.me/${(ord.customer_whatsapp || ord.customer_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageBody)}`;

                            return (
                              <tr key={ord.id} className="hover:bg-brand-lightgray/15 transition-colors">
                                <td className="py-3 px-4 align-top">
                                  <span className="font-extrabold text-brand-black block">{ord.order_id}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono tracking-wide block mt-1">{dateFormatted}</span>
                                </td>
                                <td className="py-3 px-4 align-top space-y-1">
                                  <div className="font-extrabold text-brand-black">{ord.customer_name}</div>
                                  <div className="text-[10px] font-medium text-zinc-500 font-mono flex items-center gap-1">
                                    <span>📞 {ord.customer_phone}</span>
                                  </div>
                                  {ord.customer_whatsapp && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-brand-whatsapp hover:underline uppercase"
                                      title="Click to track/contact customer immediately on WhatsApp"
                                    >
                                      Chat customer 💬
                                    </a>
                                  )}
                                </td>
                                <td className="py-3 px-4 align-top max-w-[180px]">
                                  <div className="line-clamp-2 text-zinc-650 leading-relaxed text-[11px] font-sans text-left">{ord.customer_address}</div>
                                  <div className="text-[10px] font-black text-brand-black uppercase mt-1">🇵🇰 {ord.customer_city}</div>
                                </td>
                                <td className="py-3 px-4 align-top">
                                  <div className="space-y-1 text-left">
                                    {ordItemsList.map((itm: any, index: number) => (
                                      <div key={index} className="text-[11px] leading-snug">
                                        <span className="font-bold text-zinc-500 font-mono mr-1">{itm.quantity}x</span>
                                        <span className="text-zinc-800 font-sans">{itm.productName || itm.id}</span>
                                        {(itm.selectedVariant || itm.selectedSize) && (
                                          <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1 py-0.5 rounded ml-1 font-sans">
                                            {itm.selectedVariant} {itm.selectedSize}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-4 align-top text-right font-black font-mono text-zinc-900">
                                  Rs. {Number(ord.total_amount).toLocaleString()}
                                  <div className="text-[9px] text-zinc-400 font-normal font-mono block mt-0.5">
                                    {ord.payment_method || 'C.O.D'}
                                  </div>
                                </td>
                                <td className="py-3 px-4 align-top text-center">
                                  <select
                                    value={ord.status || 'Pending'}
                                    onChange={(e) => handleUpdateOrderStatus(ord.order_id, e.target.value)}
                                    className={`text-[10px] font-black font-mono rounded-lg border px-2 py-1 focus:ring-0 focus:outline-hidden uppercase ${
                                      ord.status === 'Completed' || ord.status === 'Delivered'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : ord.status === 'Cancelled'
                                        ? 'bg-red-50 text-red-650 border-red-200'
                                        : ord.status === 'Shipped'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200' // Pending
                                    }`}
                                  >
                                    <option value="Pending">🕒 Pending</option>
                                    <option value="Shipped">🚚 Shipped</option>
                                    <option value="Delivered">✅ Delivered</option>
                                    <option value="Cancelled">❌ Cancelled</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 align-top text-right">
                                  <button
                                    onClick={() => handleDeleteOrderDb(ord.id, ord.order_id)}
                                    className="p-1 px-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete from databases"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: APPOINTMENTS AND INQUIRIES Synced to Supabase */}
          {currentView === 'list' && activeTab === 'inquiries' && !isFormActive && (
            <div className="space-y-5 font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black font-mono">Live Appointment Requests (Supabase)</h3>
                  <p className="text-[10px] text-zinc-500 font-sans">Contact list from your customer contact and WhatsApp appointment forms</p>
                </div>
                <button
                  onClick={fetchInquiriesFromSupabase}
                  disabled={isLoadingInquiries}
                  className="px-3.5 py-2 bg-brand-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-1.5 ml-auto sm:ml-0 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingInquiries ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span>{isLoadingInquiries ? "Fetching Live List..." : "Refresh Submissions"}</span>
                </button>
              </div>

              {inquiriesLoadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <h5 className="font-extrabold text-red-700">Database Sync Error</h5>
                    <p className="mt-1 text-red-600 font-normal">
                      We tried fetching from your Supabase inquiry tables. Error detail: {inquiriesLoadError}.
                    </p>
                    <p className="mt-2 text-zinc-650 leading-snug">
                      <strong>Requirement:</strong> Ensure you created an <code>appointments</code> table in Supabase so submissions sync immediately. Refer to the SQL template in the Dashboard Overview tab!
                    </p>
                  </div>
                </div>
              )}

              {!inquiriesLoadError && (
                <div className="bg-white border border-brand-black/5 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-brand-lightgray border-b border-brand-black/5 text-[10px] font-bold text-brand-black uppercase font-mono tracking-wider">
                          <th className="py-3 px-4 text-left">Customer Nominee</th>
                          <th className="py-3 px-4 text-left">Phone Number</th>
                          <th className="py-3 px-4 text-left">Message details</th>
                          <th className="py-3 px-4 text-left">Booked on</th>
                          <th className="py-3 px-4 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-black/5 text-left">
                        {inquiriesDb.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-zinc-400 font-medium font-sans">
                              {isLoadingInquiries ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
                                  <span className="text-xs font-medium">Fetching client appointments...</span>
                                </div>
                              ) : (
                                "No registered appointment submissions found inside your Supabase backend yet."
                              )}
                            </td>
                          </tr>
                        ) : (
                          inquiriesDb.map((inq: any) => {
                            const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-PK', {
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            }) : 'Unknown date';

                            // WhatsApp template
                            const inqWaBody = `Assalam-o-Alaikum ${inq.name}! 👋\nThis is Faizan Traders following up on your registered appointment request!\n\nMessage body: "${inq.message || 'None'}"\n\nHow can we help you today?`;
                            const waUrl = `https://wa.me/${(inq.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(inqWaBody)}`;

                            return (
                              <tr key={inq.id} className="hover:bg-brand-lightgray/15 transition-colors">
                                <td className="py-3.5 px-4 font-extrabold text-brand-black">
                                  {inq.name}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-mono text-zinc-700 block">{inq.phone}</span>
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    className="text-[9px] font-bold text-brand-whatsapp hover:underline mt-0.5 inline-block uppercase"
                                  >
                                    Contact customer WhatsApp 💬
                                  </a>
                                </td>
                                <td className="py-3.5 px-4 max-w-xs text-zinc-650 leading-relaxed italic font-sans text-[11px] text-left">
                                  "{inq.message || 'No description provided'}"
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 font-mono text-[10px]">
                                  {dateStr}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteInquiryDb(inq.id)}
                                    className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: LOGO SETTINGS */}
          {currentView === 'list' && activeTab === 'settings' && !isFormActive && (
            <div className="bg-white border border-brand-black/5 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
              <div className="border-b border-brand-black/5 pb-4">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-brand-black">🖼️ Live Custom Logo Manager</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Upload or specify a custom branding logo for your entire store. Updates in real-time across all views.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono block">Current Logo Preview:</label>
                  <div className="mt-2 p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-center items-center h-28">
                    <img
                      src={customLogo || '/src/assets/images/logo.jpeg'}
                      alt="Brand Logo"
                      className="max-h-full max-w-full object-contain rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = '/src/assets/images/logo.jpeg';
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono block">Option 1: Paste Logo Image URL</label>
                  <input
                    type="url"
                    value={customLogo.startsWith('data:') ? '' : customLogo}
                    onChange={(e) => setCustomLogo(e.target.value.trim())}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-white border border-brand-black/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono block">Option 2: Select / Upload Local Photo</label>
                  <input
                    type="file"
                    id="logo-file-uploader"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadImageToCloud(file, setIsUploadingImage)
                        .then((url) => {
                          setCustomLogo(url);
                        })
                        .catch((err) => {
                          console.error('Logo upload error:', err);
                          alert("Failed to upload logo image. Please try again.");
                        });
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => document.getElementById('logo-file-uploader')?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-black/25 bg-white p-3 text-[11px] font-bold text-brand-black hover:bg-brand-lightgray hover:border-brand-black disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 text-brand-gold animate-spin shrink-0" />
                        <span>Uploading logo file... ☁️</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-brand-gold shrink-0" />
                        <span>Upload Logo File 📁</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-brand-black/5">
                  <button
                    type="button"
                    onClick={() => {
                      const confirmReset = window.confirm('Are you sure you want to restore the original default logo?');
                      if (confirmReset) {
                        localStorage.removeItem('custom_store_logo');
                        setCustomLogo('');
                        window.dispatchEvent(new Event('store_logo_changed'));
                        alert('Restored default logo successfully! ✨');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-red-750 hover:bg-red-50 text-xs font-bold uppercase cursor-pointer tracking-wider"
                  >
                    Reset Default Logo 🔄
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (customLogo) {
                        try {
                          localStorage.setItem('custom_store_logo', customLogo);
                        } catch (e: any) {
                          console.error(e);
                          alert("⚠️ Browser storage is full! Could not save custom logo locally. Try using a smaller logo file or connect a Supabase cloud database to free up storage space.");
                          return;
                        }
                      } else {
                        localStorage.removeItem('custom_store_logo');
                      }
                      window.dispatchEvent(new Event('store_logo_changed'));
                      alert('Custom Store Logo successfully updated live! ✨');
                    }}
                    className="flex-1 bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Save className="h-4 w-4 text-brand-gold" />
                    <span>Save & Apply Custom Logo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LOCAL SESSION ORDERS TRACKER */}
          {currentView === 'list' && activeTab === 'session_orders' && !isFormActive && (
            <div className="bg-white border border-brand-black/5 rounded-2xl p-6 shadow-xs max-w-3xl mx-auto space-y-6">
              <div className="border-b border-brand-black/5 pb-4">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-brand-black">🚚 Live Local Session Delivery Tracker</h3>
                <p className="text-[10px] text-zinc-500 font-medium">View, track, and simulate status transitions of customer Cash On Delivery orders placed in this session.</p>
              </div>

              {sessionOrders.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 font-medium">
                  <p className="text-xs">No active orders placed in this session yet.</p>
                  <p className="text-[10px] mt-1 text-zinc-400">Add products to your cart and complete checkout to see them simulated here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sessionOrders.map((ord) => {
                    const step = 
                      ord.status === 'Pending' ? 1 : 
                      ord.status === 'Shipped' ? 2 : 3;

                    return (
                      <div key={ord.id} className="border border-neutral-200 rounded-xl p-5 bg-zinc-50 relative hover:shadow-xs transition-shadow">
                        
                        {/* Upper row */}
                        <div className="flex flex-wrap justify-between items-start gap-2 border-b border-neutral-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-black">{ord.id}</span>
                              <span className={`text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-md ${
                                ord.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                ord.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                                'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {ord.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-1">
                              Placed: {ord.date}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block font-mono">Invoice Bill</span>
                            <h4 className="font-mono text-xs font-black text-black mt-0.5">Rs. {ord.totalAmount.toLocaleString()}</h4>
                          </div>
                        </div>

                        {/* Progress tracking gauge */}
                        <div className="py-4">
                          <div className="relative flex items-center justify-between">
                            {/* Connecting background bar */}
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-zinc-200 z-0" />
                            <div 
                              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                              className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-black transition-all duration-500 z-0" 
                            />

                            {/* Node 1 */}
                            <div className="z-10 flex flex-col items-center">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                step >= 1 ? 'bg-black text-white ring-4 ring-zinc-100' : 'bg-zinc-200 text-zinc-500'
                              }`}>
                                1
                              </div>
                              <span className="text-[9px] font-bold text-neutral-600 mt-1">Received</span>
                            </div>

                            {/* Node 2 */}
                            <div className="z-10 flex flex-col items-center">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                step >= 2 ? 'bg-black text-white ring-4 ring-zinc-100' : 'bg-zinc-200 text-zinc-500'
                              }`}>
                                2
                              </div>
                              <span className="text-[9px] font-bold text-neutral-600 mt-1">Leopard Courier</span>
                            </div>

                            {/* Node 3 */}
                            <div className="z-10 flex flex-col items-center">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                step >= 3 ? 'bg-black text-white ring-4 ring-zinc-100' : 'bg-zinc-200 text-zinc-500'
                              }`}>
                                3
                              </div>
                              <span className="text-[9px] font-bold text-neutral-600 mt-1">Delivered</span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery address details */}
                        <div className="bg-white p-3 rounded-lg border border-neutral-100 text-xs text-neutral-600 space-y-1">
                          <div><strong>Recipient:</strong> {ord.customerDetails?.name} ({ord.customerDetails?.city})</div>
                          <div className="text-neutral-500"><strong>Address:</strong> {ord.customerDetails?.address}</div>
                          <div className="text-neutral-500"><strong>Phone:</strong> {ord.customerDetails?.phone}</div>
                        </div>

                        {/* Items summary */}
                        <div className="mt-3 text-xs">
                          <h4 className="font-bold text-black mb-1.5 uppercase text-[9px]">Package Items:</h4>
                          <ul className="divide-y divide-neutral-100 bg-white px-3 py-1.5 rounded-lg border border-neutral-100">
                            {ord.items?.map((item: any, itemIdx: number) => (
                              <li key={itemIdx} className="py-1.5 flex justify-between text-neutral-600 text-[11px]">
                                <span>{item.product?.name || 'Product'} x {item.quantity} {item.selectedSize ? `(${item.selectedSize})` : ''}</span>
                                <span className="font-mono font-bold text-zinc-950">Rs. {((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action simulation trigger */}
                        {ord.status !== 'Delivered' && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => {
                                onSimulateStatus(ord.id);
                                alert('Cargo delivery step simulated successfully! 🚚');
                              }}
                              className="bg-brand-black hover:bg-zinc-800 text-white font-bold text-[9px] px-3.5 py-2 rounded-lg font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
                            >
                              <span>Simulate Speed Cargo Deliver 🚚</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: THEME CUSTOMIZATION DESIGNER */}
          {currentView === 'list' && activeTab === 'theme_settings' && !isFormActive && (
            <div className="bg-white border border-brand-black/5 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-8 animate-fade-in text-black">
              <div className="border-b border-brand-black/5 pb-4">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-brand-black">🎨 Live Theme & Color Designer</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Select a premium curated color palette, or manually craft your custom brand identity with precision color pickers below. Updates apply to all views instantly.</p>
              </div>

              {/* SECTION 1: PRESET PALETTES */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">1. Select a Curated Preset</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = themeId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setThemeId(preset.id);
                          setBrandBlackColor(preset.brandBlack);
                          setBrandCharcoalColor(preset.brandCharcoal);
                          setBrandOffwhiteColor(preset.brandOffwhite);
                          setBrandLightgrayColor(preset.brandLightgray);
                          setBrandGoldColor(preset.brandGold);
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 hover:scale-[1.01] cursor-pointer ${
                          isSelected 
                            ? 'border-brand-black ring-2 ring-brand-black bg-neutral-50/50' 
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full text-black">
                          <span className="text-xs font-bold pr-2">{preset.name}</span>
                          {isSelected && (
                            <span className="bg-brand-black text-white text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        
                        {/* Preset preview bubbles */}
                        <div className="flex items-center gap-2 mt-4">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            <span className="inline-block h-6 w-6 rounded-full border border-white" style={{ backgroundColor: preset.brandBlack }} title="Brand Primary" />
                            <span className="inline-block h-6 w-6 rounded-full border border-white" style={{ backgroundColor: preset.brandCharcoal }} title="Brand Secondary" />
                            <span className="inline-block h-6 w-6 rounded-full border border-white" style={{ backgroundColor: preset.brandOffwhite }} title="Canvas Background" />
                            <span className="inline-block h-6 w-6 rounded-full border border-white" style={{ backgroundColor: preset.brandLightgray }} title="Highlights" />
                            <span className="inline-block h-6 w-6 rounded-full border border-white" style={{ backgroundColor: preset.brandGold }} title="Special Accent" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: CUSTOM COLOR SLIDERS / PICKERS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t border-brand-black/5">
                
                {/* Left: Inputs */}
                <div className="md:col-span-7 space-y-5">
                  <h4 className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono text-black">2. Fine-Tune Custom Tones</h4>
                  
                  <div className="space-y-4">
                    {/* Color 1: Primary Brand Accent */}
                    <div className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="space-y-0.5 text-left">
                        <label className="text-[10px] font-extrabold text-zinc-900 uppercase font-mono tracking-wider">Primary Accent Color</label>
                        <p className="text-[9px] text-zinc-500">For main buttons, headers, and footer background.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={brandBlackColor}
                          onChange={(e) => {
                            setBrandBlackColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="w-20 bg-white border border-neutral-200 text-center font-mono text-[10px] uppercase font-bold py-1.5 rounded-lg focus:outline-hidden text-black"
                        />
                        <input
                          type="color"
                          value={brandBlackColor}
                          onChange={(e) => {
                            setBrandBlackColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="h-9 w-9 border-0 cursor-pointer rounded-lg overflow-hidden shrink-0"
                        />
                      </div>
                    </div>

                    {/* Color 2: Charcoal Shadow */}
                    <div className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="space-y-0.5 text-left">
                        <label className="text-[10px] font-extrabold text-zinc-900 uppercase font-mono tracking-wider">Secondary Contrast Color</label>
                        <p className="text-[9px] text-zinc-500">For secondary headers, alerts, and navigation accents.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={brandCharcoalColor}
                          onChange={(e) => {
                            setBrandCharcoalColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="w-20 bg-white border border-neutral-200 text-center font-mono text-[10px] uppercase font-bold py-1.5 rounded-lg focus:outline-hidden text-black"
                        />
                        <input
                          type="color"
                          value={brandCharcoalColor}
                          onChange={(e) => {
                            setBrandCharcoalColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="h-9 w-9 border-0 cursor-pointer rounded-lg overflow-hidden shrink-0"
                        />
                      </div>
                    </div>

                    {/* Color 3: Canvas Offwhite Background */}
                    <div className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="space-y-0.5 text-left">
                        <label className="text-[10px] font-extrabold text-zinc-900 uppercase font-mono tracking-wider">Store Canvas Background</label>
                        <p className="text-[9px] text-zinc-500">The main page background of your entire storefront website.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={brandOffwhiteColor}
                          onChange={(e) => {
                            setBrandOffwhiteColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="w-20 bg-white border border-neutral-200 text-center font-mono text-[10px] uppercase font-bold py-1.5 rounded-lg focus:outline-hidden text-black"
                        />
                        <input
                          type="color"
                          value={brandOffwhiteColor}
                          onChange={(e) => {
                            setBrandOffwhiteColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="h-9 w-9 border-0 cursor-pointer rounded-lg overflow-hidden shrink-0"
                        />
                      </div>
                    </div>

                    {/* Color 4: Lightgray Card Background */}
                    <div className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="space-y-0.5 text-left">
                        <label className="text-[10px] font-extrabold text-zinc-900 uppercase font-mono tracking-wider">Highlight & Border Tone</label>
                        <p className="text-[9px] text-zinc-500">Used for product cards backdrops, input borders and grid lines.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={brandLightgrayColor}
                          onChange={(e) => {
                            setBrandLightgrayColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="w-20 bg-white border border-neutral-200 text-center font-mono text-[10px] uppercase font-bold py-1.5 rounded-lg focus:outline-hidden text-black"
                        />
                        <input
                          type="color"
                          value={brandLightgrayColor}
                          onChange={(e) => {
                            setBrandLightgrayColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="h-9 w-9 border-0 cursor-pointer rounded-lg overflow-hidden shrink-0"
                        />
                      </div>
                    </div>

                    {/* Color 5: Gold Deal Glow Accent */}
                    <div className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="space-y-0.5 text-left">
                        <label className="text-[10px] font-extrabold text-zinc-900 uppercase font-mono tracking-wider">Special Glow Accent (Gold)</label>
                        <p className="text-[9px] text-zinc-500">For sale countdown clocks, sparkles, action icons, and discount badges.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={brandGoldColor}
                          onChange={(e) => {
                            setBrandGoldColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="w-20 bg-white border border-neutral-200 text-center font-mono text-[10px] uppercase font-bold py-1.5 rounded-lg focus:outline-hidden text-black"
                        />
                        <input
                          type="color"
                          value={brandGoldColor}
                          onChange={(e) => {
                            setBrandGoldColor(e.target.value);
                            setThemeId('custom');
                          }}
                          className="h-9 w-9 border-0 cursor-pointer rounded-lg overflow-hidden shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Interactive Card Preview */}
                <div className="md:col-span-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">3. Live Interface Preview</h4>
                  
                  <div 
                    className="p-5 rounded-2xl border transition-all duration-300 relative shadow-sm"
                    style={{ 
                      backgroundColor: brandOffwhiteColor, 
                      borderColor: `${brandBlackColor}15`,
                      color: brandBlackColor 
                    }}
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: `${brandGoldColor}20`, color: brandGoldColor }}>
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Live Preview</span>
                    </div>

                    <div className="space-y-3">
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 border relative group" style={{ borderColor: `${brandBlackColor}10` }}>
                        <img 
                          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=400" 
                          alt="Demo bedding" 
                          className="w-full h-full object-cover"
                        />
                        <span 
                          className="absolute bottom-2 left-2 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md text-white shadow-xs"
                          style={{ backgroundColor: brandBlackColor }}
                        >
                          Sale Active
                        </span>
                      </div>

                      <div className="text-left space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-mono font-bold" style={{ color: brandGoldColor }}>
                          Premium Bedding • Best Seller
                        </span>
                        <h5 className="font-display font-extrabold text-xs tracking-tight">Royal Embossed Luxury Sheet</h5>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="font-mono text-xs font-black">Rs. 3,499</span>
                          <span className="font-mono text-[9px] line-through text-zinc-400">Rs. 4,800</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm text-white cursor-pointer"
                        style={{ backgroundColor: brandBlackColor }}
                      >
                        <Save className="h-3 w-3" style={{ color: brandGoldColor }} />
                        <span>Add To Cart Bag</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-500 font-medium text-center">Changes made here will be applied directly to all buttons, lists, layout bars and banners on Faizan Traders.</p>
                </div>
              </div>

              {/* SECTION 3: HOMEPAGE SECTIONS VISIBILITY CONTROL */}
              <div className="space-y-4 pt-6 border-t border-brand-black/5 text-left">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-brand-gold" />
                  <h4 className="text-[11px] font-black text-brand-black uppercase tracking-wider font-mono">3. Manage Website Page Layout & Visibility</h4>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Toggle visibility of specific sections across the website. Turn off footers, slider banners, or circular collections with a single click in real-time!</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Toggle Slider */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">Hero Slider Banner</span>
                      <span className="text-[9px] text-zinc-500">Enable/disable top slideshow</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showSlider}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showSlider: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>

                  {/* Toggle Categories */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">Season Categories Carousel</span>
                      <span className="text-[9px] text-zinc-500">Enable/disable round category circles</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showCategories}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showCategories: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>

                  {/* Toggle Flash Sale Countdown */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">Flash Sale Promo Grid</span>
                      <span className="text-[9px] text-zinc-500">First section (Bedsheets / Sale Banners)</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showFlashSale}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showFlashSale: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>

                  {/* Toggle Trending Products */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">Trending Clothes & Sofa Covers</span>
                      <span className="text-[9px] text-zinc-500">Bento grid collections</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showTrending}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showTrending: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>

                  {/* Toggle Reviews */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">Reviews & Testimonials</span>
                      <span className="text-[9px] text-zinc-500">Customer feedback reviews section</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showReviews}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showReviews: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>

                  {/* Toggle Inquiry Form */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">WhatsApp Direct Query</span>
                      <span className="text-[9px] text-zinc-500">Send Direct Query form section</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showInquiry}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showInquiry: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>

                  {/* Toggle Footer */}
                  <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="text-left">
                      <span className="text-xs font-bold block text-neutral-800">Brand Footer Section</span>
                      <span className="text-[9px] text-zinc-500">Remove footer entirely from all pages</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={localLayout.showFooter}
                      onChange={(e) => setLocalLayout(prev => ({ ...prev, showFooter: e.target.checked }))}
                      className="h-5 w-5 border-neutral-300 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE / RESET ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-brand-black/5">
                <button
                  type="button"
                  onClick={() => {
                    const confirmReset = window.confirm('Are you sure you want to restore the default classic gold & charcoal theme and layout settings?');
                    if (confirmReset) {
                      const defaultTheme = THEME_PRESETS[0];
                      setThemeId(defaultTheme.id);
                      setBrandBlackColor(defaultTheme.brandBlack);
                      setBrandCharcoalColor(defaultTheme.brandCharcoal);
                      setBrandOffwhiteColor(defaultTheme.brandOffwhite);
                      setBrandLightgrayColor(defaultTheme.brandLightgray);
                      setBrandGoldColor(defaultTheme.brandGold);
                      saveAndApplyTheme(defaultTheme);

                      const defaultL = {
                        showSlider: true,
                        showCategories: true,
                        showFlashSale: true,
                        showTrending: true,
                        showReviews: true,
                        showInquiry: true,
                        showFooter: true
                      };
                      setLocalLayout(defaultL);
                      onSaveLayoutConfig(defaultL);
                      alert('Restored default classic theme and layout settings successfully! ✨');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-750 hover:bg-red-50 hover:text-red-800 text-xs font-bold uppercase cursor-pointer tracking-wider"
                >
                  Reset Defaults 🔄
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const themeObj: ThemeConfig = {
                      id: themeId,
                      name: themeId === 'custom' ? '🎨 Custom Dynamic Palette' : (THEME_PRESETS.find(p => p.id === themeId)?.name || 'Custom Theme'),
                      brandBlack: brandBlackColor,
                      brandCharcoal: brandCharcoalColor,
                      brandOffwhite: brandOffwhiteColor,
                      brandLightgray: brandLightgrayColor,
                      brandGold: brandGoldColor
                    };
                    saveAndApplyTheme(themeObj);
                    onSaveLayoutConfig(localLayout);
                    alert('Theme and Page Layout visibility updated live successfully! ✨ All customers will experience your changes in real-time.');
                  }}
                  className="flex-1 bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="h-4 w-4 text-brand-gold" />
                  <span>Save & Apply Selected Theme & Layout</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: ADD OR EDIT FORM */}
          {(currentView === 'add' || currentView === 'edit') && (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Header with back navigation button */}
              <div className="flex items-center justify-between border-b border-brand-black/5 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('list');
                    setErrorMsg('');
                  }}
                  className="flex items-center gap-1 text-zinc-500 hover:text-brand-black font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Product Directory</span>
                </button>

                <div className="text-xs font-mono font-bold tracking-wide">
                  Editing Context: <span className="text-brand-gold uppercase">{currentView === 'edit' ? 'Update Existing' : 'Create New'}</span>
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Layout grid divided */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left fields column */}
                <div className="md:col-span-8 space-y-4">
                  {/* Row 1: Name & ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Product Name / Title: *</label>
                      <input 
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Premium Stretch Sofa Cover"
                        required
                        className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Unique ID Code: *</label>
                      <input 
                        type="text"
                        value={formId}
                        onChange={(e) => setFormId(e.target.value)}
                        disabled={currentView === 'edit'}
                        placeholder="e.g. sofa-stretch"
                        required
                        className="w-full mt-1.5 bg-white/70 border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono text-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Row 2: Price / Original Price & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Discount Selling Price (Rs.): *</label>
                      <input 
                        type="number"
                        min="1"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        placeholder="Selling Price Rs."
                        required
                        className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Original Price (Rs. Scratch Line):</label>
                      <input 
                        type="number"
                        min="1"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                        placeholder="Original Price Rs."
                        className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Store Category Section: *</label>
                      <select 
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:outline-hidden cursor-pointer text-brand-black font-semibold"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Textareas */}
                  <div>
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Short Description (Cards): *</label>
                    <input 
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief card level teaser lines..."
                      required
                      className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Long Description / Sizing details (Modal Popup):</label>
                    <textarea 
                      rows={3}
                      value={formLongDescription}
                      onChange={(e) => setFormLongDescription(e.target.value)}
                      placeholder="Full specifications, measurements, fabric description details to help client conversions..."
                      className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                    />
                  </div>

                  {/* Arrays/CSVs fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-brand-black/5 pt-4">
                    <div>
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Features List (Comma Separated):</label>
                      <input 
                        type="text"
                        value={formFeatures}
                        onChange={(e) => setFormFeatures(e.target.value)}
                        placeholder="Feature 1, Feature 2, Feature 3"
                        className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                      />
                      <span className="text-[8px] text-zinc-400 font-mono mt-1 block">Renders as green tickbullets</span>
                    </div>

                    {/* Color Variants Dynamic Interactive Tag Editor */}
                    <div className="bg-white/80 border border-brand-black/10 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                      <div>
                        <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono flex items-center justify-between">
                          <span>Color Variants ({formVariantsList.length})</span>
                          <span className="text-[7.5px] text-zinc-400 font-mono">Interactive List</span>
                        </label>

                        {/* Staggered tags view container */}
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3 max-h-[100px] overflow-y-auto pt-1">
                          {formVariantsList.length > 0 ? (
                            formVariantsList.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-zinc-900 text-white shadow-xs"
                              >
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(idx)}
                                  className="hover:text-red-400 transition-colors text-[9px] font-black cursor-pointer bg-white/20 hover:bg-white/30 rounded-full h-3 w-3 flex items-center justify-center shrink-0"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-zinc-400 font-medium italic">No colors added yet</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-2 border-t border-brand-black/[0.04]">
                        <div className="flex gap-1.5">
                          <input 
                            type="text"
                            value={newVariantInput}
                            onChange={(e) => setNewVariantInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddVariant(newVariantInput);
                              }
                            }}
                            placeholder="Type color e.g. Blue..."
                            className="flex-1 bg-white border border-brand-black/10 rounded-lg px-2.5 py-1.5 text-[11px] focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddVariant(newVariantInput)}
                            className="bg-brand-black hover:bg-zinc-800 text-white px-2.5 rounded-lg text-xs font-black transition-colors cursor-pointer"
                            title="Add Color Tag"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[7.5px] text-zinc-400 font-mono mt-1 block">Type color & press <b>Enter ↵</b></span>
                      </div>
                    </div>

                    {/* Size Options Dynamic Interactive Tag Editor */}
                    <div className="bg-white/80 border border-brand-black/10 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                      <div>
                        <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono flex items-center justify-between">
                          <span>Size Options ({formSizesList.length})</span>
                          <span className="text-[7.5px] text-zinc-400 font-mono">Interactive List</span>
                        </label>

                        {/* Staggered tags view container */}
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3 max-h-[100px] overflow-y-auto pt-1">
                          {formSizesList.length > 0 ? (
                            formSizesList.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-brand-gold/15 text-brand-black border border-brand-gold/20 shadow-xs"
                              >
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(idx)}
                                  className="text-brand-black hover:text-red-600 transition-colors text-[9px] font-black cursor-pointer bg-brand-black/10 hover:bg-brand-black/20 rounded-full h-3 w-3 flex items-center justify-center shrink-0"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-zinc-400 font-medium italic">No sizes added yet</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-2 border-t border-brand-black/[0.04]">
                        <div className="flex gap-1.5">
                          <input 
                            type="text"
                            value={newSizeInput}
                            onChange={(e) => setNewSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSize(newSizeInput);
                              }
                            }}
                            placeholder="Type size e.g. 3 Seater..."
                            className="flex-1 bg-white border border-brand-black/10 rounded-lg px-2.5 py-1.5 text-[11px] focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSize(newSizeInput)}
                            className="bg-brand-black hover:bg-zinc-800 text-white px-2.5 rounded-lg text-xs font-black transition-colors cursor-pointer"
                            title="Add Size Tag"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[7.5px] text-zinc-400 font-mono mt-1 block">Type size & press <b>Enter ↵</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Link Variant Photos Panel */}
                  {(formVariantsList.length > 0 || formSizesList.length > 0) && (
                    <div className="border-t border-brand-black/5 pt-4 mt-4 bg-brand-lightgray/30 p-3 rounded-xl">
                      <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono flex items-center justify-between mb-2">
                        <span>Link Variant Photos (Optional Pic):</span>
                        <span className="text-[8.5px] text-zinc-500 normal-case font-medium">Add an image per color/size; clicking that variant switches the main picture!</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[...formVariantsList, ...formSizesList].map((val) => {
                          const currentImg = formVariantImages[val] || '';
                          return (
                            <div 
                              key={val} 
                              className="border border-brand-black/10 rounded-xl bg-white p-2 flex flex-col justify-between relative shadow-xs"
                            >
                              <div className="text-[9.5px] font-bold text-brand-black truncate mb-1.5 text-center">{val}</div>
                              
                              {/* Thumbnail uploader canvas */}
                              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-50 border border-dashed border-zinc-300 hover:border-brand-black transition-all flex flex-col items-center justify-center cursor-pointer min-h-[45px]">
                                {currentImg ? (
                                  <>
                                    <img src={currentImg} alt="" className="h-full w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormVariantImages(prev => {
                                          const copy = { ...prev };
                                          delete copy[val];
                                          return copy;
                                        });
                                      }}
                                      className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full p-0.5 cursor-pointer"
                                      title="Remove Image"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </>
                                ) : isUploadingImage ? (
                                  <div className="flex flex-col items-center justify-center p-1 text-zinc-400">
                                    <Loader2 className="h-3 w-3 text-brand-gold animate-spin shrink-0 mb-0.5" />
                                    <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-wide">Syncing...</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center p-1 text-zinc-400">
                                    <Upload className="h-3 w-3 text-brand-gold shrink-0 mb-0.5" />
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wide">Upload</span>
                                  </div>
                                )}
                                <input 
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  disabled={isUploadingImage}
                                  onChange={(e: any) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    uploadImageToCloud(file, setIsUploadingImage)
                                      .then((url) => {
                                        setFormVariantImages(prev => ({
                                          ...prev,
                                          [val]: url
                                        }));
                                      })
                                      .catch((err) => {
                                        console.error("Variant image upload error:", err);
                                      });
                                  }}
                                />
                              </div>

                              {/* Manual Link Input */}
                              <input 
                                type="url"
                                placeholder="Paste link..."
                                value={currentImg.startsWith('data:') ? '' : currentImg}
                                onChange={(e) => {
                                  const urlVal = e.target.value.trim();
                                  setFormVariantImages(prev => ({
                                    ...prev,
                                    [val]: urlVal
                                  }));
                                }}
                                className="w-full mt-2 text-[8px] font-mono border border-zinc-200 rounded-md px-1 py-0.5 bg-zinc-50 focus:bg-white focus:outline-hidden text-center"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right side images selection & auxiliary metadata configs */}
                <div className="md:col-span-4 space-y-4 bg-brand-lightgray/50 border border-brand-black/10 p-4 rounded-2xl">
                  
                  {/* Photo Input URL & Preset selection list */}
                  <div>
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono flex items-center justify-between">
                      <span>Product Cover Photo URL: *</span>
                      <Image className="h-3.5 w-3.5 text-zinc-500" />
                    </label>
                    <input 
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="Https://images.unsplash..."
                      required
                      className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                    />

                    {/* Local File Photo Upload Input ("Add to Photos" feature) */}
                    <div className="mt-2.5">
                      <label className="text-[10px] font-bold text-brand-black/60 uppercase tracking-wider font-mono block mb-1.5">
                        Or Pick / Upload Local Photo:
                      </label>
                      <input 
                        type="file"
                        id="local-file-uploader"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          uploadImageToCloud(file, setIsUploadingImage)
                            .then((url) => {
                              setFormImage(url);
                            })
                            .catch((err) => {
                              console.error("Cloud upload error:", err);
                              alert("Failed to upload image. Please try again.");
                            });
                        }}
                      />
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => document.getElementById('local-file-uploader')?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-brand-black/25 bg-white p-2.5 text-[11px] font-bold text-brand-black hover:bg-brand-lightgray hover:border-brand-black disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 text-brand-gold animate-spin shrink-0" />
                            <span>Uploading photo to secure cloud... ☁️</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-brand-gold shrink-0" />
                            <span>Add Photo / Upload Image 📁</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Active preview icon widget */}
                    {formImage && (
                      <div className="mt-3 aspect-video w-full rounded-lg overflow-hidden border border-brand-black/10 shadow-xs relative bg-zinc-200">
                        <img 
                          src={formImage} 
                          alt="Current Preview" 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            // fallback on render error
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600';
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5 bg-brand-black/95 text-[7px] text-white font-mono px-2 py-0.5 rounded-md uppercase">Cover Preview</div>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="absolute top-1.5 right-1.5 bg-red-600/90 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                          title="Remove Image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Additional Images (Multiple Gallery) Editor */}
                  <div className="border-t border-brand-black/10 pt-4 mt-3">
                    <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono flex items-center justify-between mb-2">
                      <span>Gallery Photos ({formImages.length} items):</span>
                      <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                    </label>

                    {/* Mini grid of existing additional photos */}
                    {formImages.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {formImages.map((imgUrl, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-brand-black/10 bg-zinc-100 group">
                            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setFormImages(prev => prev.filter((_, idx) => idx !== index));
                              }}
                              className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors cursor-pointer"
                              title="Delete Photo"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-white text-center py-0.5 font-mono">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-400 font-medium font-sans border border-dashed border-zinc-200 rounded-lg p-3 text-center mb-3">
                        Only 1 cover photo uploaded. Add more photos below to enable a beautiful slider gallery!
                      </div>
                    )}

                    {/* Actions to add more additional photos */}
                    <div className="space-y-1.5">
                      <input 
                        type="file"
                        id="additional-photo-uploader"
                        accept="image/*"
                        className="hidden"
                        multiple
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          
                          setIsUploadingImage(true);
                          const uploadPromises = Array.from(files).map((file: any) => 
                            uploadImageToCloud(file).catch((err) => {
                              console.error("Gallery upload error:", err);
                              return null;
                            })
                          );

                          Promise.all(uploadPromises).then((urls) => {
                            const validUrls = urls.filter(Boolean) as string[];
                            if (validUrls.length > 0) {
                              setFormImages(prev => [...prev, ...validUrls]);
                            }
                            setIsUploadingImage(false);
                          });
                        }}
                      />
                      
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => document.getElementById('additional-photo-uploader')?.click()}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-brand-black/15 bg-white py-2 text-[10.5px] font-bold text-brand-black hover:bg-brand-lightgray disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 text-brand-gold animate-spin shrink-0" />
                            <span>Uploading gallery photos... ☁️</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                            <span>Upload Additional Photos 📁</span>
                          </>
                        )}
                      </button>

                      {/* URL-based manual entry shortcut */}
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          id="additional-photo-url-input"
                          placeholder="Paste alternate image link..."
                          className="flex-1 bg-white border border-brand-black/10 rounded-lg px-2 py-1.5 text-[10px] font-mono focus:outline-hidden"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const val = input.value.trim();
                              if (val) {
                                setFormImages(prev => [...prev, val]);
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('additional-photo-url-input') as HTMLInputElement;
                            const val = input?.value.trim();
                            if (val) {
                              setFormImages(prev => [...prev, val]);
                              input.value = '';
                            }
                          }}
                          className="bg-brand-black hover:bg-zinc-800 text-white font-bold text-[9px] px-2.5 rounded-lg uppercase tracking-wider cursor-pointer font-mono"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Photos click selections shortcut */}
                  <div className="border-t border-brand-black/10 pt-3">
                    <label className="text-[9px] font-bold text-brand-black uppercase tracking-wider font-mono block mb-2">Preset High-Res Photo Assets:</label>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-left">
                      {PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormImage(preset.url)}
                          className={`w-full text-left p-1.5 rounded-md transition-all text-[9.5px] leading-tight flex items-center gap-2 border select-none cursor-pointer ${
                            formImage === preset.url 
                              ? 'bg-brand-black text-white border-brand-black' 
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <div className="h-6 w-6 rounded-md overflow-hidden bg-zinc-200 shrink-0">
                            <img src={preset.url} alt="" className="h-full w-full object-cover" />
                          </div>
                          <span className="line-clamp-1 flex-1 font-medium">{preset.name}</span>
                          {formImage === preset.url && <Check className="h-3 w-3 text-brand-gold shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock count / reviews rating and promo badge */}
                  <div className="border-t border-brand-black/10 pt-4 space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Stock Qty: *</label>
                        <input 
                          type="number"
                          min="0"
                          value={formStock}
                          onChange={(e) => setFormStock(Number(e.target.value))}
                          required
                          className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Badge Label:</label>
                        <input 
                          type="text"
                          value={formBadge}
                          onChange={(e) => setFormBadge(e.target.value)}
                          placeholder="E.g. Best Seller, New"
                          className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Rating Score:</label>
                        <input 
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={formRating}
                          onChange={(e) => setFormRating(Number(e.target.value))}
                          className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Review Count:</label>
                        <input 
                          type="number"
                          min="1"
                          value={formReviewsCount}
                          onChange={(e) => setFormReviewsCount(Number(e.target.value))}
                          className="w-full mt-1.5 bg-white border border-brand-black/10 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Form trigger submission buttons bottom row */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-brand-black/5 bg-brand-offwhite">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('list');
                    setErrorMsg('');
                  }}
                  className="px-5 py-3 rounded-xl border border-zinc-200 text-xs font-bold uppercase hover:bg-zinc-100 font-sans tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="h-4 w-4 text-brand-gold" />
                  <span>{currentView === 'edit' ? 'Update Live Item Details' : 'Initialize Brand New Product'}</span>
                </button>
              </div>

            </form>
          )}

          {/* VIEW: HOME PAGE SLIDER MANAGER */}
          {currentView === 'slides' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-black/5 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentView('list');
                      setErrorMsg('');
                    }}
                    className="p-1 px-3 rounded-lg border border-brand-black/15 text-zinc-600 hover:text-brand-black hover:bg-zinc-100 transition-colors cursor-pointer text-xs uppercase font-mono tracking-wider flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Inventory</span>
                  </button>
                  <h3 className="font-display text-sm sm:text-base font-black text-brand-black uppercase tracking-wider">
                    Edit Home Page Slideshow Banners
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewSlide}
                    className="bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-brand-gold" />
                    <span>Add Custom Slide</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreSlidesDefault}
                    className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reset slides back to factory defaults"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Slides</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5 font-sans font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Grid of existing localSlides */}
              {localSlides.length === 0 ? (
                <div className="text-center py-16 bg-white border border-brand-black/5 rounded-2xl">
                  <Image className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm font-medium">No banner slides active. Create one to begin!</p>
                  <button
                    onClick={handleAddNewSlide}
                    className="mt-4 bg-brand-gold text-brand-black font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-yellow-600 transition-all"
                  >
                    Create Custom Initial Slide
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {localSlides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="bg-white border-2 border-brand-black/10 rounded-2xl overflow-hidden shadow-xs relative transition-all duration-300 hover:border-brand-black/30 text-left"
                    >
                      {/* Slide Heading Top Command Row */}
                      <div className="bg-brand-black text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-mono">
                        <span className="text-brand-gold uppercase tracking-wider">Slide #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSlideUp(idx)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-1 rounded-sm cursor-pointer disabled:opacity-30"
                            title="Move slide Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === localSlides.length - 1}
                            onClick={() => handleMoveSlideDown(idx)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-1 rounded-sm cursor-pointer disabled:opacity-30"
                            title="Move slide Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlide(idx)}
                            className="bg-red-900/40 hover:bg-red-800 text-red-200 p-1 px-2 rounded-sm cursor-pointer"
                            title="Delete this slide"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Content Form Block */}
                      <div className="p-4 grid md:grid-cols-12 gap-5 items-start">
                        {/* Fields Edit Side */}
                        <div className="md:col-span-8 grid sm:grid-cols-2 gap-3.5 text-xs text-brand-black">
                          {/* Badge Text */}
                          <div>
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Badge Title:
                            </label>
                            <input
                              type="text"
                              value={slide.badge}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, badge: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-medium"
                              placeholder="e.g., Trending Now 🔥"
                            />
                          </div>

                          {/* Title text */}
                          <div>
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Main Title Headline:
                            </label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, title: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-bold"
                              placeholder="e.g., Must-Have Gadgets"
                            />
                          </div>

                          {/* Subtitle text */}
                          <div>
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Primary Accent Text:
                            </label>
                            <input
                              type="text"
                              value={slide.subtitle}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, subtitle: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-bold text-brand-black"
                              placeholder="e.g., For Every Kitchen & Daily Use"
                            />
                          </div>

                          {/* Price Tag Highlight */}
                          <div>
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Price/Promo Highlight:
                            </label>
                            <input
                              type="text"
                              value={slide.priceText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, priceText: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-mono"
                              placeholder="e.g., Starting from Rs. 499"
                            />
                          </div>

                          {/* Category Action Link */}
                          <div>
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Binds to Shop Category:
                            </label>
                            <select
                              value={slide.linkCategory}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, linkCategory: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-semibold text-brand-black"
                            >
                              <option value="all">Shop All Products</option>
                              {CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Custom background hint */}
                          <div>
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Background styling pattern:
                            </label>
                            <input
                              type="text"
                              value={slide.bgColor || 'from-zinc-950 via-slate-900 to-zinc-950'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, bgColor: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-mono text-[10px]"
                              placeholder="e.g., from-zinc-950 via-slate-900 to-zinc-950"
                            />
                          </div>

                          {/* Tagline text description */}
                          <div className="sm:col-span-2">
                            <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500">
                              Sub-Headline Description text details:
                            </label>
                            <textarea
                              rows={2}
                              value={slide.tagline}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, tagline: val } : s));
                              }}
                              className="w-full mt-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-brand-black rounded-lg px-3 py-2 focus:outline-hidden font-medium"
                              placeholder="Introduce the value preposition clearly..."
                            />
                          </div>
                        </div>

                        {/* Image Media Upload / Selector Side */}
                        <div className="md:col-span-4 space-y-3">
                          <label className="font-bold text-[10px] uppercase font-mono tracking-wide text-zinc-500 block">
                            Slide Product Cover Image:
                          </label>
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-100 border border-brand-black/15 shadow-inner">
                            {slide.image ? (
                              <img src={slide.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                                <Image className="h-8 w-8 mb-1" />
                                <span className="text-[10px] font-bold">No Image Specified</span>
                              </div>
                            )}
                          </div>

                          {/* Direct image uploader */}
                          <div className="relative border border-dashed border-zinc-300 hover:border-brand-black rounded-xl p-2.5 bg-zinc-50 hover:bg-white transition-all text-center cursor-pointer">
                            <div className="flex items-center justify-center gap-1.5 text-brand-black text-xs font-bold uppercase tracking-wide">
                              {isUploadingImage ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 text-brand-gold animate-spin shrink-0" />
                                  <span>Syncing...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                                  <span>Upload Photo</span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={isUploadingImage}
                              onChange={(e: any) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                uploadImageToCloud(file, setIsUploadingImage)
                                  .then((url) => {
                                    setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, image: url } : s));
                                  })
                                  .catch((err) => {
                                    console.error("Slide upload error:", err);
                                  });
                              }}
                            />
                          </div>

                          {/* Direct URL input */}
                          <div>
                            <input
                              type="text"
                              value={slide.image?.startsWith('data:') ? '' : slide.image}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSlides(prev => prev.map((s, i) => i === idx ? { ...s, image: val } : s));
                              }}
                              className="w-full text-[10px] text-center font-mono border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-brand-black bg-white"
                              placeholder="Or paste external link"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Submission Row */}
                  <div className="flex justify-end gap-3.5 pt-6 border-t border-brand-black/5 bg-brand-offwhite">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('list');
                        setErrorMsg('');
                      }}
                      className="px-5 py-3 rounded-xl border border-zinc-300 text-xs font-bold uppercase hover:bg-zinc-100 font-sans tracking-wider transition-colors cursor-pointer text-brand-black"
                    >
                      Dismiss Changes
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSlidesCommit}
                      className="bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Save className="h-4 w-4 text-brand-gold" />
                      <span>Save & Publish Slideshow</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
