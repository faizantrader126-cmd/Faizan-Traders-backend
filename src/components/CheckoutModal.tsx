import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { PAKISTAN_CITIES } from '../data';
import { X, ShieldCheck, MapPin, Loader2, ClipboardCheck, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { saveOrderToSupabase } from '../lib/supabase';

interface CheckoutModalProps {
  cartItems: CartItem[];
  onClose: () => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
}

export default function CheckoutModal({
  cartItems,
  onClose,
  onClearCart,
  onOrderCompleted
}: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Karachi',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate base price adjustments if Sofa sizes are selected
  const getItemPrice = (item: CartItem) => {
    let p = item.product?.price || 0;
    const size = item.selectedSize;
    if (!size) return p;
    if (size.includes('2 Seater')) p += 500;
    if (size.includes('3 Seater')) p += 1000;
    if (size.includes('4 Seater')) p += 1500;
    if (size.includes('5 Seater')) p += 2500;
    if (size.includes('7 Seater')) p += 4500;
    if (size.includes('Extra Large')) p += 800;
    return p;
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (getItemPrice(item) * item.quantity), 0);
  
  // Free delivery limit Rs. 2,500
  const freeShippingThreshold = 2500;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 150;
  
  // Automatic first-order discount or 10% voucher
  const hasVoucherApplied = localStorage.getItem('voucherApplied') === 'true' || cartItems.length > 3;
  const discountAmount = hasVoucherApplied ? Math.round(subtotal * 0.1) : 0;
  const totalAmount = subtotal - discountAmount + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Generate WhatsApp order format string
  const formatWhatsAppOrderString = () => {
    const itemsStr = cartItems.map((item, index) => {
      const specs = [
        item.selectedColor ? `Color: ${item.selectedColor}` : '',
        item.selectedSize ? `Size: ${item.selectedSize}` : ''
      ].filter(Boolean).join(', ');
      return `${index + 1}. *${item.product?.name || 'Product'}* x ${item.quantity} ${specs ? `(${specs})` : ''} = Rs. ${(getItemPrice(item) * item.quantity).toLocaleString()}`;
    }).join('\n');

    return `Assalam-o-Alaikum Faizan Traders! 👋\nNew order has been placed!\n\n📋 *ITEMS ORDERED:*\n${itemsStr}\n\nInvoice Summary:\n- Subtotal: Rs. ${subtotal.toLocaleString()}\n- Discount: Rs. ${discountAmount.toLocaleString()}\n- Shipping: ${shippingCost === 0 ? 'FREE' : `Rs. ${shippingCost}`}\n- *TOTAL AMOUNT: Rs. ${totalAmount.toLocaleString()}*\n\n📍 *SHIPPING DETAILS:*\n- *Name:* ${formData.name}\n- *Phone:* ${formData.phone}\n- *WhatsApp:* ${formData.whatsapp || formData.phone}\n- *Address:* ${formData.address}\n- *City:* ${formData.city}\n- *Notes:* ${formData.notes || 'None'}\n\nPayment Method: Cash On Delivery (COD) 🇵🇰\nPlease verify this order!`;
  };

  // Submits to WhatsApp and registers in Supabase
  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;

    setIsSubmitting(true);
    const orderId = `FT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderId,
      customerDetails: {
        name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        address: formData.address,
        city: formData.city,
        notes: formData.notes
      },
      items: [...cartItems],
      totalAmount,
      shippingCost,
      date: new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'Pending',
      paymentMethod: 'WhatsApp Registered / COD'
    };

    try {
      // Save order structure to Supabase orders table
      const res = await saveOrderToSupabase(newOrder);
      if (!res.success) {
        console.warn('Supabase DB Sync skipped or failed. Be sure you run the "orders" table generator: ', res.error);
      }
    } catch (err) {
      console.error('Supabase sync background error:', err);
    }

    const message = formatWhatsAppOrderString();
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/9203303511464?text=${encoded}`, '_blank');
    
    onOrderCompleted(newOrder);
    onClearCart();
    setIsSubmitting(false);
  };

  // Standard Cash on Delivery form solver with Supabase save handler
  const handleStandardCODSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;

    setIsSubmitting(true);
    const orderId = `FT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderId,
      customerDetails: {
        name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        address: formData.address,
        city: formData.city,
        notes: formData.notes
      },
      items: [...cartItems],
      totalAmount,
      shippingCost,
      date: new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'Pending',
      paymentMethod: 'Cash on Delivery (COD)'
    };

    try {
      // Save order structure to Supabase database
      const res = await saveOrderToSupabase(newOrder);
      if (res.success) {
        alert("Order Saved Successfully to your Supabase backend! 🔥\nYour purchase details are safely stored.");
      } else {
        alert(`Order Received Locally! ⚠️\n(Notice: Could not save purchase into Supabase "orders" table yet: ${res.error}).\n\nPlease create the "orders" table in your Supabase SQL editor to enable DB syncing successfully.`);
      }
    } catch (err: any) {
      console.error('Supabase standard COD sync exception:', err);
      alert("Order Approved locally. Supabase connection exception occurred.");
    }

    onOrderCompleted(newOrder);
    onClearCart();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />

      {/* Main container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 grid h-full max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl md:grid-cols-12"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full border border-neutral-200 bg-white/90 p-2 text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Column Left: Order Form input fields */}
        <div className="md:col-span-7 overflow-y-auto p-6 md:p-8 flex flex-col justify-between max-h-[50vh] md:max-h-full">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-black" />
              <h2 className="font-display text-xl font-bold text-black uppercase tracking-tight">Shipping & Order Form</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Please enter your correct delivery address details to prevent delay in custom shipments.</p>
            
            <form id="checkout-form" className="mt-6 space-y-4 text-left">
              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">Full Name: *</label>
                <input 
                  type="text"
                  name="name"
                  placeholder="Enter your first and last name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-black"
                />
              </div>

              {/* Telephone contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">Call Contact Mobile: *</label>
                  <input 
                    type="tel"
                    name="phone"
                    placeholder="e.g. 03303511464"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-mono font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">WhatsApp Number (Optional):</label>
                  <input 
                    type="tel"
                    name="whatsapp"
                    placeholder="Same as call mobile if empty"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-mono font-bold text-black"
                  />
                </div>
              </div>

              {/* Home Address info */}
              <div>
                <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">Full Home & Street Address: *</label>
                <input 
                  type="text"
                  name="address"
                  placeholder="House #, Street #, Sector / Area details"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-black"
                />
              </div>

              {/* Cities drop selector */}
              <div>
                <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">Select City: *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-black"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom order notes */}
              <div>
                <label className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">Special Order / Custom Size Notes (Optional):</label>
                <textarea 
                  name="notes"
                  rows={2}
                  placeholder="Write color requirements, table dimensions in inches, or delivery guidelines..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-bold text-black"
                />
              </div>
            </form>
          </div>

          {/* Secure Double Submits buttons panel */}
          <div className="mt-6 border-t border-neutral-200 pt-5 space-y-2.5">
            <button
              onClick={handleStandardCODSubmit}
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.phone || !formData.address}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide bg-black hover:bg-neutral-900 text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Generating Order Credentials...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4.5 w-4.5" />
                  Place Order with Cash on Delivery
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppSubmit}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide bg-[#25d366] hover:bg-[#1ebd54] text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <MessageSquare className="h-4.5 w-4.5 fill-current" />
              Direct WhatsApp Checkout Invoice Now
            </button>
          </div>
        </div>

        {/* Column Right: Billing invoice breakdown */}
        <div className="md:col-span-5 bg-neutral-50 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[42vh] md:max-h-full">
          <div>
            <h3 className="font-display text-sm font-bold text-black uppercase tracking-wider border-b border-neutral-200 pb-3">Order Invoice</h3>
            
            {/* Scrollable products summary */}
            <div className="mt-4 space-y-3 max-h-[22rem] overflow-y-auto pr-1">
              {cartItems.map((item, id) => (
                <div key={id} className="flex gap-3 text-left">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-white">
                    <img src={item.product?.image || ''} className="h-full w-full object-cover" alt={item.product?.name || 'Product'} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h5 className="text-[11px] font-bold text-black leading-tight line-clamp-1">{item.product?.name || 'Product'}</h5>
                    <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                      {item.quantity} x Rs. {getItemPrice(item).toLocaleString()} 
                      {item.selectedSize && ` | Size: ${item.selectedSize}`}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-black flex items-center">
                    Rs. {(getItemPrice(item) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-5 text-left">
            {/* Invoice lines */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Cart Subtotal:</span>
                <span className="font-mono font-bold text-black">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Promo Discount:</span>
                  <span className="font-mono font-bold">-Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Shipping Expenses:</span>
                <span className="font-mono font-bold text-black">{shippingCost === 0 ? 'FREE' : `Rs. ${shippingCost}`}</span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-black border-t border-neutral-200 pt-3.5">
                <span>Grand Total:</span>
                <span className="font-mono font-black">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Safety lock alert tags */}
            <div className="mt-6 bg-white border border-neutral-200 p-3 rounded-lg flex items-start gap-2.5 shadow-xs">
              <ShieldCheck className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                <strong>Pay after Verification:</strong> Under Pakistan COD policy, you pay cash to the courier agent only after packages are delivered directly to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
