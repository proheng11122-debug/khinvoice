import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatCurrency, formatDate, todayISO } from '../lib/utils'

export function ProductsPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showProd, setShowProd] = useState(false)
  const [showStock, setShowStock] = useState(false)
  const [sel, setSel] = useState<Product | null>(null)
  const [tab, setTab] = useState<'products' | 'movements'>('products')
  const [movements, setMovements] = useState<any[]>([])
  const [pForm, setPForm] = useState({ name: '', unit: 'ដុំ', cost_price: '', sell_price: '', low_stock_threshold: '5', currency: 'USD' as 'USD' | 'KHR' })
  const [sForm, setSForm] = useState({ type: 'in' as 'in' | 'out' | 'adjust', quantity: '', note: '', movement_date: todayISO() })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [session])
  async function loadData() {
    if (!session?.user) return
    const [p, m] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('stock_movements').select('*, product:products(name)').eq('user_id', session.user.id).order('movement_date', { ascending: false }).limit(20),
    ])
    setProducts(p.data as Product[] || []); setMovements(m.data as any[] || []); setLoading(false)
  }
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    const { error } = await supabase.from('products').insert({ user_id: session!.user.id, name: pForm.name, unit: pForm.unit, cost_price: parseFloat(pForm.cost_price) || 0, sell_price: parseFloat(pForm.sell_price) || 0, low_stock_threshold: parseFloat(pForm.low_stock_threshold) || 5, currency: pForm.currency })
    if (error) { setError(error.message); setSaving(false); return }
    setShowProd(false); setPForm({ name: '', unit: 'ដុំ', cost_price: '', sell_price: '', low_stock_threshold: '5', currency: 'USD' }); await loadData(); setSaving(false)
  }
  async function handleDeleteProduct(id: string) { if (!confirm('Delete this product?')) return; await supabase.from('products').delete().eq('id', id); await loadData() }
  async function handleStock(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    const qty = parseFloat(sForm.quantity); if (isNaN(qty) || qty <= 0) { setError('Quantity must be > 0'); setSaving(false); return }
    const { error } = await supabase.from('stock_movements').insert({ product_id: sel!.id, user_id: session!.user.id, type: sForm.type, quantity: qty, note: sForm.note || null, movement_date: sForm.movement_date })
    if (error) { setError(error.message); setSaving(false); return }
    setShowStock(false); setSForm({ type: 'in', quantity: '', note: '', movement_date: todayISO() }); await loadData(); setSaving(false)
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Products & Stock</h1><p className="page-subtitle">Manage your inventory and stock movements</p></div><button className="btn btn-primary" onClick={() => setShowProd(true)}>+ Add Product</button></div>
      <div className="flex gap-2 mb-4"><button className={`btn btn-sm ${tab === 'products' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('products')}>Products</button><button className={`btn btn-sm ${tab === 'movements' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('movements')}>Stock Movements</button></div>
      {tab === 'products' ? (
        <div className="card">{products.length === 0 ? <div className="empty-state"><div className="empty-state-icon">P</div><p>No products yet. Click "Add Product" to get started.</p></div> : (
          <div className="table-wrapper"><table><thead><tr><th>Name</th><th>Unit</th><th>Stock Qty</th><th>Cost Price</th><th>Sell Price</th><th>Status</th><th></th></tr></thead><tbody>
            {products.map(p => { const low = p.quantity <= p.low_stock_threshold; return <tr key={p.id}><td className="font-semibold">{p.name}</td><td>{p.unit}</td><td style={{ color: low ? 'var(--error-600)' : 'var(--neutral-900)', fontWeight: 700 }}>{p.quantity}{low && <span className="badge badge-error" style={{ marginLeft: 8 }}>Low</span>}</td><td>{formatCurrency(Number(p.cost_price), p.currency)}</td><td>{formatCurrency(Number(p.sell_price), p.currency)}</td><td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td><td><div className="flex gap-2"><button className="btn btn-secondary btn-sm" onClick={() => { setSel(p); setShowStock(true) }}>Stock</button><button className="btn btn-ghost btn-sm" onClick={() => handleDeleteProduct(p.id)}><span style={{ color: 'var(--error-600)' }}>Delete</span></button></div></td></tr> })}
          </tbody></table></div>
        )}</div>
      ) : (
        <div className="card">{movements.length === 0 ? <div className="empty-state"><div className="empty-state-icon">S</div><p>No stock movements yet.</p></div> : (
          <div className="table-wrapper"><table><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Note</th></tr></thead><tbody>
            {movements.map(m => <tr key={m.id}><td>{formatDate(m.movement_date)}</td><td className="font-semibold">{m.product?.name || '-'}</td><td><span className={`badge ${m.type === 'in' ? 'badge-success' : m.type === 'out' ? 'badge-error' : 'badge-neutral'}`}>{m.type}</span></td><td className="font-bold">{m.type === 'out' ? '-' : '+'}{m.quantity}</td><td>{m.note || '-'}</td></tr>)}
          </tbody></table></div>
        )}</div>
      )}
      {showProd && (
        <div className="modal-overlay" onClick={() => setShowProd(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2 className="modal-title">Add Product</h2><button className="modal-close" onClick={() => setShowProd(false)}>&times;</button></div>
          <form onSubmit={handleAddProduct}>
            <div className="modal-body">{error && <div className="auth-error">{error}</div>}<div className="form-group"><label className="form-label">Product Name</label><input className="form-input" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} required /></div><div className="form-row"><div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={pForm.unit} onChange={e => setPForm({ ...pForm, unit: e.target.value })} /></div><div className="form-group"><label className="form-label">Currency</label><select className="form-select" value={pForm.currency} onChange={e => setPForm({ ...pForm, currency: e.target.value as 'USD' | 'KHR' })}><option value="USD">USD</option><option value="KHR">KHR</option></select></div></div><div className="form-row"><div className="form-group"><label className="form-label">Cost Price</label><input className="form-input" type="number" step="0.01" min="0" value={pForm.cost_price} onChange={e => setPForm({ ...pForm, cost_price: e.target.value })} /></div><div className="form-group"><label className="form-label">Sell Price</label><input className="form-input" type="number" step="0.01" min="0" value={pForm.sell_price} onChange={e => setPForm({ ...pForm, sell_price: e.target.value })} /></div></div><div className="form-group"><label className="form-label">Low Stock Threshold</label><input className="form-input" type="number" min="0" value={pForm.low_stock_threshold} onChange={e => setPForm({ ...pForm, low_stock_threshold: e.target.value })} /></div></div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowProd(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </form>
        </div></div>
      )}
      {showStock && sel && (
        <div className="modal-overlay" onClick={() => setShowStock(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2 className="modal-title">Stock Movement - {sel.name}</h2><button className="modal-close" onClick={() => setShowStock(false)}>&times;</button></div>
          <form onSubmit={handleStock}>
            <div className="modal-body">{error && <div className="auth-error">{error}</div>}<div className="form-group"><label className="form-label">Current Stock: {sel.quantity} {sel.unit}</label></div><div className="form-group"><label className="form-label">Movement Type</label><select className="form-select" value={sForm.type} onChange={e => setSForm({ ...sForm, type: e.target.value as 'in' | 'out' | 'adjust' })}><option value="in">Stock In (add)</option><option value="out">Stock Out (remove)</option><option value="adjust">Adjustment</option></select></div><div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" step="0.01" min="0.01" value={sForm.quantity} onChange={e => setSForm({ ...sForm, quantity: e.target.value })} required /></div><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={sForm.movement_date} onChange={e => setSForm({ ...sForm, movement_date: e.target.value })} required /></div><div className="form-group"><label className="form-label">Note</label><input className="form-input" value={sForm.note} onChange={e => setSForm({ ...sForm, note: e.target.value })} placeholder="Optional" /></div></div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowStock(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </form>
        </div></div>
      )}
    </div>
  )
}
