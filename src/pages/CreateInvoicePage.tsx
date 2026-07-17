import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Product, CustomUnit } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { todayISO, formatCurrency } from '../lib/utils'

type ItemRow = { product_id: string | null; description: string; quantity: string; unit: string; unit_price: string }

export function CreateInvoicePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [units, setUnits] = useState<CustomUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', invoice_date: todayISO(), due_date: '', currency: 'USD' as 'USD' | 'KHR', notes: '' })
  const [items, setItems] = useState<ItemRow[]>([{ product_id: null, description: '', quantity: '1', unit: '', unit_price: '' }])

  useEffect(() => {
    async function load() {
      if (!session?.user) return
      const [p, u] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', session.user.id).eq('is_active', true),
        supabase.from('custom_units').select('*').eq('user_id', session.user.id),
      ])
      setProducts(p.data as Product[] || []); setUnits(u.data as CustomUnit[] || []); setLoading(false)
    }
    load()
  }, [session])

  function addItem() { setItems([...items, { product_id: null, description: '', quantity: '1', unit: '', unit_price: '' }]) }
  function removeItem(i: number) { setItems(items.filter((_, x) => x !== i)) }
  function updateItem(i: number, field: keyof ItemRow, value: string) {
    const updated = [...items]; updated[i] = { ...updated[i], [field]: value }
    if (field === 'product_id' && value) { const p = products.find(x => x.id === value); if (p) { updated[i].description = p.name; updated[i].unit = p.unit; updated[i].unit_price = String(p.sell_price) } }
    setItems(updated)
  }
  const subtotal = items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    if (!form.customer_name.trim()) { setError('Customer name is required'); setSaving(false); return }
    const valid = items.filter(i => i.description.trim() && parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) >= 0)
    if (valid.length === 0) { setError('Add at least one line item'); setSaving(false); return }
    const { data: inv, error: ie } = await supabase.from('invoices').insert({ user_id: session!.user.id, customer_name: form.customer_name, customer_phone: form.customer_phone || null, invoice_date: form.invoice_date, due_date: form.due_date || null, subtotal, currency: form.currency, notes: form.notes || null, status: 'unpaid' }).select().single()
    if (ie || !inv) { setError(ie?.message || 'Failed to create invoice'); setSaving(false); return }
    const { error: se } = await supabase.from('invoice_items').insert(valid.map(item => ({ invoice_id: inv.id, product_id: item.product_id || null, description: item.description, quantity: parseFloat(item.quantity), unit: item.unit || null, unit_price: parseFloat(item.unit_price) })))
    if (se) { setError(se.message); setSaving(false); return }
    navigate(`/invoices/${inv.id}`)
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">New Invoice</h1><p className="page-subtitle">Create a new invoice for your customer</p></div></div>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card-title">Customer Details</h2>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-row"><div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required /></div><div className="form-group"><label className="form-label">Customer Phone</label><input className="form-input" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div></div>
          <div className="form-row"><div className="form-group"><label className="form-label">Invoice Date</label><input className="form-input" type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} /></div><div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div></div>
          <div className="form-row"><div className="form-group"><label className="form-label">Currency</label><select className="form-select" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value as 'USD' | 'KHR' })}><option value="USD">USD</option><option value="KHR">KHR</option></select></div><div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div></div>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between mb-4"><h2 className="card-title" style={{ margin: 0 }}>Line Items</h2><button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button></div>
          {items.map((item, i) => (
            <div key={i} className="invoice-item-row">
              <div>{products.length > 0 && <select className="form-select" style={{ marginBottom: 4 }} value={item.product_id || ''} onChange={e => updateItem(i, 'product_id', e.target.value)}><option value="">No product link</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}<input className="form-input" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></div>
              <input className="form-input" type="number" step="0.01" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
              <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}><option value="">No unit</option><option value="ដុំ">ដុំ</option><option value="កែវ">កែវ</option><option value="គីឡូ">គីឡូ</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
              <input className="form-input" type="number" step="0.01" placeholder="Unit Price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(i)}><span style={{ color: 'var(--error-600)' }}>Remove</span></button>
            </div>
          ))}
          <div className="text-right mt-4"><div className="text-sm text-secondary">Subtotal</div><div className="text-lg font-bold">{formatCurrency(subtotal, form.currency)}</div></div>
        </div>
        <div className="flex gap-2"><button type="button" className="btn btn-secondary" onClick={() => navigate('/invoices')}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</button></div>
      </form>
    </div>
  )
}
