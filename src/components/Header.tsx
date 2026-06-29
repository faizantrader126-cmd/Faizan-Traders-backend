import React, { useState } from 'react';
import Logo from './Logo';
import { Search, ShoppingBag, PhoneCall, Truck, ClipboardList, Menu, X, HelpCircle, MessageSquare, Sliders } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cartItems: CartItem[];
  onCartClick: () => void;
  onTrackerClick: () => void;
  onManagerClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: { id: string; name: string }[];
  activeCategory: string;
  onCategorySelect: (id: string) => void;
}

export default function Header({
  cartItems,
  onCartClick,
  onTrackerClick,
  onManagerClick,
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategorySelect
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = cartItems.reduce((acc, current) => acc + current.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Main Core Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 text-black cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Brand Logo component */}
        <div className="flex-shrink-0 md:mt-2">
          <Logo size="md" showPhone={false} className="scale-95 sm:scale-100 origin-left" />
        </div>

        {/* Live Search Block matching inputs */}
        <div className="hidden md:flex flex-1 max-w-lg relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text"
            placeholder="Search for products, brands and more..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:bg-white focus:ring-1 focus:ring-black focus:outline-hidden text-black font-semibold transition-all"
          />
        </div>

        {/* Actions Button panel (Orders list, shopping cart) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Minimog Theme Identifier */}
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            <span>Minimog Edition</span>
          </div>

          {/* Owner Catalog Desk */}
          <button
            onClick={onManagerClick}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 sm:px-3.5 py-2 text-xs font-extrabold text-black hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"
            title="Manage store items, edit prices & stock"
          >
            <Sliders className="h-4 w-4" />
            <span className="hidden lg:inline">Manage Items</span>
          </button>

          {/* Cart triggers */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 rounded-lg bg-black hover:bg-neutral-900 text-white px-3 sm:px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-white font-mono shadow-xs ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded categories row lists on Desktop - Pure Minimog Minimalist Style */}
      <div className="hidden md:block border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-center gap-8 text-xs font-semibold tracking-wider uppercase">
          <button 
            onClick={() => onCategorySelect('all')}
            className={`pb-1 relative cursor-pointer font-bold transition-all ${
              activeCategory === 'all' 
                ? 'text-black border-b-2 border-black' 
                : 'text-neutral-400 hover:text-black'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onCategorySelect(c.id)}
              className={`pb-1 relative cursor-pointer font-bold transition-all ${
                activeCategory === c.id 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-neutral-400 hover:text-black'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile search list block */}
      <div className="px-4 py-3 md:hidden border-t border-neutral-100 bg-neutral-50/50">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text"
            placeholder="Search for products, brands and more..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden text-black font-semibold"
          />
        </div>
      </div>

      {/* Mobile menu panel overlay drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6">
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <Logo size="sm" showPhone={false} className="origin-left" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">Shop Categories</h4>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      onCategorySelect('all');
                      setMobileMenuOpen(false);
                    }}
                    className={`text-xs font-bold py-2.5 px-3 rounded-lg text-left transition-colors ${
                      activeCategory === 'all' ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    All Collections
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onCategorySelect(c.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`text-xs font-bold py-2.5 px-3 rounded-lg text-left transition-colors ${
                        activeCategory === c.id ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 text-left space-y-3">
              {/* Owner Portal Shortcut */}
              <button
                onClick={() => {
                  onManagerClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-black hover:bg-neutral-900 text-white font-extrabold text-xs py-2.5 rounded-lg text-center block cursor-pointer"
              >
                Owner Panel: Manage Items ⚙️
              </button>

              <div className="flex items-center gap-3">
                <a href="tel:+923303511464" className="w-full bg-black text-white py-2.5 rounded-lg text-xs font-bold text-center block">
                  Call Support
                </a>
                <a href="https://wa.me/923303511464" className="w-full bg-[#25d366] text-white py-2.5 rounded-lg text-xs font-bold text-center block">
                  WhatsApp Support
                </a>
              </div>
              <p className="text-[10px] text-zinc-400 mt-3 text-center">The Sweet Baby Shop - Premium Clothing</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
