import React from 'react';
import { Order } from '../types';
import { X, ClipboardCheck, AlertCircle, ShoppingBag, Eye, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderTrackerModalProps {
  orders: Order[];
  onClose: () => void;
  onSimulateStatus: (orderId: string) => void;
}

export default function OrderTrackerModal({
  orders,
  onClose,
  onSimulateStatus
}: OrderTrackerModalProps) {
  // Calculate price adjustments
  const getProductPrice = (item: any) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
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
        className="relative z-10 flex h-full max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 bg-neutral-50">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5.5 w-5.5 text-black" />
            <h3 className="font-display text-base font-bold text-black uppercase tracking-tight">Order & Delivery Tracker</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full bg-white border border-neutral-200 p-1.5 text-black hover:bg-black hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content body log */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          {orders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-70 py-12">
              <AlertCircle className="h-12 w-12 text-neutral-300 mb-3" />
              <h4 className="font-display text-sm font-bold text-neutral-500 uppercase tracking-wider">No orders found!</h4>
              <p className="text-xs text-neutral-500 max-w-xs mt-1.5 leading-relaxed">
                You haven't placed any Cash on Delivery orders during this session yet. Build a cart list and checkout to track your courier parcel delivery!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((ord) => {
                const step = 
                  ord.status === 'Pending' ? 1 : 
                  ord.status === 'Shipped' ? 2 : 3;

                return (
                  <div key={ord.id} className="border border-neutral-200 rounded-xl p-5 bg-white relative hover:shadow-xs transition-shadow">
                    
                    {/* Upper row */}
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-neutral-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-black">{ord.id}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-md ${
                            ord.status === 'Pending' ? 'bg-neutral-100 text-neutral-800 border border-neutral-200' :
                            ord.status === 'Shipped' ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 animate-pulse' :
                            'bg-black text-white border border-black'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>Placed: {ord.date}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">Invoice Bill</span>
                        <h4 className="font-mono text-sm font-black text-black mt-0.5">Rs. {ord.totalAmount.toLocaleString()}</h4>
                      </div>
                    </div>

                    {/* Progress tracking gauge */}
                    <div className="py-5">
                      <div className="relative flex items-center justify-between">
                        {/* Connecting background bar */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-zinc-100 z-0" />
                        <div 
                          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-black transition-all duration-500 z-0" 
                        />

                        {/* Node 1: Received */}
                        <div className="z-10 flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step >= 1 ? 'bg-black text-white ring-4 ring-zinc-100' : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            1
                          </div>
                          <span className="text-[10px] font-bold text-neutral-600 mt-1.5">Received</span>
                        </div>

                        {/* Node 2: Shipped */}
                        <div className="z-10 flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step >= 2 ? 'bg-black text-white ring-4 ring-zinc-100' : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            2
                          </div>
                          <span className="text-[10px] font-bold text-neutral-600 mt-1.5 font-sans">Leopard Courier</span>
                        </div>

                        {/* Node 3: Delivered */}
                        <div className="z-10 flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step >= 3 ? 'bg-black text-white ring-4 ring-zinc-100' : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            3
                          </div>
                          <span className="text-[10px] font-bold text-neutral-600 mt-1.5">Delivered</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery addresses details */}
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex gap-2 text-xs text-neutral-600">
                      <MapPin className="h-4.5 w-4.5 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Deliver address to:</strong> {ord.customerDetails.name} ({ord.customerDetails.city})<br/>
                        <span className="text-neutral-500">{ord.customerDetails.address}</span>
                      </div>
                    </div>

                    {/* Items expander summary panel */}
                    <div className="mt-4 pt-1 text-xs">
                      <h4 className="font-semibold text-black mb-2 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Package Contents:
                      </h4>
                      <ul className="divide-y divide-neutral-100">
                        {ord.items.map((item, id) => (
                          <li key={id} className="py-2 flex items-center justify-between text-neutral-600 font-medium">
                            <span>
                              {item.product?.name || 'Product'} x {item.quantity} 
                              {item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}
                              {item.selectedColor ? ` | Color: ${item.selectedColor}` : ''}
                            </span>
                            <span className="font-mono text-black font-bold">
                              Rs. {(getProductPrice(item) * item.quantity).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Simulation step control launcher */}
                    {ord.status !== 'Delivered' && (
                      <div className="mt-4 border-t border-neutral-100 pt-3 flex justify-end">
                        <button
                          onClick={() => onSimulateStatus(ord.id)}
                          className="bg-black hover:bg-neutral-900 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400 animate-bounce" />
                          Simulate Speed Cargo Deliver
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
