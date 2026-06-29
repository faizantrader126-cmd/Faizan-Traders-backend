import { createClient } from '@supabase/supabase-js';
import { getApiUrl } from './apiConfig';

// Fallback legacy client in case any other direct code relies on it
const defaultUrl = 'https://vwoqpxljyxqacadnpgfk.supabase.co';
const defaultKey = 'sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q';

export function getActiveSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('custom_supabase_url');
    const customKey = localStorage.getItem('custom_supabase_anon_key');
    if (customUrl && customKey) {
      return { url: customUrl, key: customKey, isCustom: true };
    }
  }
  return { url: defaultUrl, key: defaultKey, isCustom: false };
}

const creds = getActiveSupabaseCredentials();

export let supabaseUrl = creds.url;
export let supabaseKey = creds.key;
let activeClient = createClient(creds.url, creds.key);

export function updateSupabaseClient(url: string, key: string) {
  supabaseUrl = url;
  supabaseKey = key;
  activeClient = createClient(url, key);
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_supabase_url', url);
    localStorage.setItem('custom_supabase_anon_key', key);
  }
}

export const supabase = new Proxy({} as any, {
  get(target, prop, receiver) {
    return Reflect.get(activeClient, prop, receiver);
  }
});

export interface InquiryPayload {
  name: string;
  phone: string;
  message: string;
}

/**
 * Saves a customer inquiry or appointment booking directly to our cloud database.
 */
export async function saveInquiryToSupabase(data: InquiryPayload) {
  try {
    const credentials = getActiveSupabaseCredentials();
    if (credentials.isCustom) {
      const { error } = await supabase.from('appointments').insert({
        name: data.name,
        phone: data.phone,
        message: data.message
      });
      if (error) throw error;
      return { success: true, table: 'appointments' };
    } else {
      const res = await fetch(getApiUrl('/api/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        console.log('Inquiry Sync success: Saved into cloud database on server.');
        return { success: true, table: 'inquiries' };
      }
      return { success: false, error: json.error || 'Server returned error' };
    }
  } catch (err: any) {
    console.error('Inquiry sync error:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Saves completed web orders to our cloud database on server.
 */
export async function saveOrderToSupabase(order: any) {
  try {
    const credentials = getActiveSupabaseCredentials();
    if (credentials.isCustom) {
      const { error } = await supabase.from('orders').insert({
        order_id: order.order_id || order.id || ("order_" + Date.now()),
        customer_name: order.customer_name || order.customerName || "",
        customer_phone: order.customer_phone || order.customerPhone || "",
        customer_whatsapp: order.customer_whatsapp || order.customerWhatsapp || "",
        customer_address: order.customer_address || order.customerAddress || "",
        customer_city: order.customer_city || order.customerCity || "",
        customer_notes: order.customer_notes || order.customerNotes || "",
        items: order.items || [],
        total_amount: order.total_amount || order.totalAmount || 0,
        shipping_cost: order.shipping_cost || order.shippingCost || 0,
        status: order.status || "Pending",
        payment_method: order.payment_method || order.paymentMethod || "COD"
      });
      if (error) throw error;
      return { success: true };
    } else {
      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const json = await res.json();
      if (json.success) {
        console.log('Order Sync success: Saved into cloud database on server.');
        return { success: true };
      }
      return { success: false, error: json.error || 'Server returned error' };
    }
  } catch (err: any) {
    console.error('Order sync error:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Maps a frontend Product object to backend database column format.
 */
export function mapToSupabaseProduct(p: any) {
  return p;
}

/**
 * Maps a row back into a frontend Product model.
 */
export function mapFromSupabaseProduct(row: any) {
  return row;
}

/**
 * Fetches all products from our cloud database on server.
 */
export async function fetchProductsFromSupabase() {
  try {
    const credentials = getActiveSupabaseCredentials();
    if (credentials.isCustom) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return { success: true, data: data || [] };
    } else {
      const res = await fetch(getApiUrl('/api/products'));
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error || 'Server returned error' };
    }
  } catch (err: any) {
    console.error('Fetch products error:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Upserts a single product to our cloud database on server.
 */
export async function upsertProductToSupabase(product: any) {
  try {
    const credentials = getActiveSupabaseCredentials();
    if (credentials.isCustom) {
      const mappedProduct = {
        id: product.id,
        name: product.name || "",
        price: Number(product.price) || 0,
        original_price: Number(product.originalPrice || product.original_price) || 0,
        description: product.description || "",
        long_description: product.longDescription || product.long_description || "",
        image: product.image || "",
        images: product.images || [],
        rating: Number(product.rating) || 5,
        reviews_count: Number(product.reviewsCount || product.reviews_count) || 0,
        category: product.category || "",
        features: product.features || [],
        variants: product.variants || [],
        sizes: product.sizes || [],
        variant_images: product.variantImages || product.variant_images || {},
        stock: Number(product.stock) || 10,
        badge: product.badge || ""
      };
      const { error } = await supabase.from('products').upsert(mappedProduct);
      if (error) throw error;
      return { success: true };
    } else {
      const res = await fetch(getApiUrl('/api/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const json = await res.json();
      if (json.success) {
        return { success: true };
      }
      return { success: false, error: json.error || 'Server returned error' };
    }
  } catch (err: any) {
    console.error('Upsert product error:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Deletes a product from our cloud database on server.
 */
export async function deleteProductFromSupabase(productId: string) {
  try {
    const credentials = getActiveSupabaseCredentials();
    if (credentials.isCustom) {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      return { success: true };
    } else {
      const res = await fetch(getApiUrl(`/api/products/${productId}`), {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        return { success: true };
      }
      return { success: false, error: json.error || 'Server returned error' };
    }
  } catch (err: any) {
    console.error('Delete product error:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Pushes a batch of products to our cloud database on server.
 */
export async function pushAllProductsToSupabase(products: any[]) {
  try {
    const credentials = getActiveSupabaseCredentials();
    if (credentials.isCustom) {
      const mappedProducts = products.map(p => ({
        id: p.id,
        name: p.name || "",
        price: Number(p.price) || 0,
        original_price: Number(p.originalPrice || p.original_price) || 0,
        description: p.description || "",
        long_description: p.longDescription || p.long_description || "",
        image: p.image || "",
        images: p.images || [],
        rating: Number(p.rating) || 5,
        reviews_count: Number(p.reviewsCount || p.reviews_count) || 0,
        category: p.category || "",
        features: p.features || [],
        variants: p.variants || [],
        sizes: p.sizes || [],
        variant_images: p.variantImages || p.variant_images || {},
        stock: Number(p.stock) || 10,
        badge: p.badge || ""
      }));
      const { error } = await supabase.from('products').upsert(mappedProducts);
      if (error) throw error;
      return { success: true };
    } else {
      const res = await fetch(getApiUrl('/api/products/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
      });
      const json = await res.json();
      if (json.success) {
        return { success: true };
      }
      return { success: false, error: json.error || 'Server returned error' };
    }
  } catch (err: any) {
    console.error('Push products bulk error:', err);
    return { success: false, error: err.message || err };
  }
}

