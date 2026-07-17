import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'kh-invoice-auth',
  },
})

export type Profile = {
  id: string; business_name: string | null; username: string | null; phone: string | null;
  is_locked: boolean | null; trial_started_at: string | null; created_at: string | null; qr_code_url: string | null
}
export type Transaction = {
  id: string; user_id: string; type: 'income' | 'expense'; transaction_date: string;
  description: string; quantity: number; unit: string | null; unit_price: number; amount: number; currency: 'USD' | 'KHR'; created_at: string
}
export type CustomUnit = { id: string; user_id: string; name: string; created_at: string }
export type Invoice = {
  id: string; user_id: string; invoice_number: number; customer_name: string; customer_phone: string | null;
  invoice_date: string; due_date: string | null; subtotal: number; paid_amount: number; balance: number;
  currency: string; notes: string | null; status: 'unpaid' | 'partial' | 'paid'; created_at: string
}
export type InvoiceItem = {
  id: string; invoice_id: string; product_id: string | null; description: string;
  quantity: number; unit_price: number; unit: string | null; total: number; created_at: string
}
export type InvoicePayment = { id: string; invoice_id: string; amount: number; note: string | null; payment_date: string; created_at: string }
export type Product = {
  id: string; user_id: string; name: string; unit: string; quantity: number; cost_price: number;
  sell_price: number; low_stock_threshold: number; currency: string; is_active: boolean; created_at: string
}
export type StockMovement = {
  id: string; product_id: string; user_id: string; type: 'in' | 'out' | 'adjust';
  quantity: number; note: string | null; movement_date: string; created_at: string
}
