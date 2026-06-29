import { createClient } from '@supabase/supabase-js';
import { getApiUrl } from './apiConfig';

// Fallback legacy client in case any other direct code relies on it
const defaultUrl = 'https://vwoqpxljyxqacadnpgfk.supabase.co';
const defaultKey = 'sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q';
export const supabaseUrl = defaultUrl;
export const supabaseKey = defaultKey;
export const supabase = createClient(defaultUrl, defaultKey);

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
    const res = await fetch(getApiUrl('/api/products'));
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Server returned error' };
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
    const res = await fetch(getApiUrl(`/api/products/${productId}`), {
      method: 'DELETE'
    });
    const json = await res.json();
    if (json.success) {
      return { success: true };
    }
    return { success: false, error: json.error || 'Server returned error' };
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
  } catch (err: any) {
    console.error('Push products bulk error:', err);
    return { success: false, error: err.message || err };
  }
}
