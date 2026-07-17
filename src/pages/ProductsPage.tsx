import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatCurrency, formatDate, todayISO } from '../lib/utils'

export function ProductsPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [tab, setTab] = useState<'products' | 'movements'>('products')
  const [movements, setMovements] = useState<StockMovement[]>([])

  const [productForm, setProductForm] = useState({
    name: '', unit: 'ដុំ', cost_price: '', sell_price: '', low_stock_threshold: '5', currency: 'USD' as 'USD' | 'KHR',
  })
  const [stockForm, setStockForm] = useState({
    type: 'in' as 'in' | 'out' | 'adjust', quantity: '', note: '', movement_date: todayISO(),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [session])

  async function loadData() {
    if (!session?.user) return
    const [prodRes, moveRes] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('stock_movements').select('*, product:products(name)').eq('user_id', session.user.id).order('movement_date', { ascending: false }).limit(20),
    ])
    setProducts((prodRes.data as Product[]) || [])
    setMovements((moveRes.data as any[]) || [])
    setLoading(false)
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('products').insert({
      user_id: session!.user.id,
      name: productForm.name,
      unit: productForm.unit,
      cost_price: parseFloat(productForm.cost_price) || 0,
      sell_price: parseFloat(productForm.sell_price) || 0,
      low_stock_threshold: parseFloat(productForm.low_stock_threshold) || 5,
      currency: productForm.currency,
    })
    if (error) { setError(error.message); setSaving(false); return }
    setShowProductModal(false)
    setProductForm({ name: '', unit: 'ដុំ', cost_price: '', sell_price: '', low_stock_threshold: '5', currency: 'USD' })
    await loadData()
    setSaving(false)
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Delete this product and all its stock movements?')) return
    await supabase.from('products').delete().eq('id', id)
    await loadData()
  }

  async function handleStockMovement(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const qty = parseFloat(stockForm.quantity)
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be greater than 0'); setSaving(false); return }
    const { error } = await supabase.from('stock_movements').insert({
      product_id: selectedProduct!.id,
      user_id: session!.user.id,
      type: stockForm.type,
      quantity: qty,
      note: stockForm.note || null,
      movement_date: stockForm.movement_date,
    })
    if (error) { setError(error.message); setSaving(false); return }
    setShowStockModal(false)
    setStockForm({ type: 'in', quantity: '', note: '', movement_date: todayISO() })
    await loadData()
    setSaving(false)
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Stock</h1>
          <p className="page-subtitle">Manage your inventory and stock movements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>+ Add Product</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={`btn btn-sm ${tab === 'products' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('products')}>Products</button>
        <button className={`btn btn-sm ${tab === 'movements' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('movements')}>Stock Movements</button>
      </div>

      {tab === 'products' ? (
        <div className="card">
          {products.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">P</div><p>No products yet. Click "Add Product" to get started.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Unit</th><th>Stock Qty</th><th>Cost Price</th><th>Sell Price</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.quantity <= p.low_stock_threshold
                    return (
                      <tr key={p.id}>
                        <td className="font-semibold">{p.name}</td>
                        <td>{p.unit}</td>
                        <td style={{ color: isLow ? 'var(--error-600)' : 'var(--neutral-900)', fontWeight: 700 }}>
                          {p.quantity}
                          {isLow && <span className="badge badge-error" style={{ marginLeft: 8 }}>Low</span>}
                        </td>
                        <td>{formatCurrency(Number(p.cost_price), p.currency)}</td>
                        <td>{formatCurrency(Number(p.sell_price), p.currency)}</td>
                        <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedProduct(p); setShowStockModal(true) }}>Stock</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteProduct(p.id)}><span style={{ color: 'var(--error-600)' }}>Delete</span></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          {movements.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">S</div><p>No stock movements yet.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Note</th></tr></thead>
                <tbody>
                  {movements.map((m: any) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.movement_date)}</td>
                      <td className="font-semibold">{m.product?.name || '-'}</td>
                      <td><span className={`badge ${m.type === 'in' ? 'badge-success' : m.type === 'out' ? 'badge-error' : 'badge-neutral'}`}>{m.type}</span></td>
                      <td className="font-bold">{m.type === 'out' ? '-' : '+'}{m.quantity}</td>
                      <td>{m.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Product</h2>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input className="form-input" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-select" value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value as 'USD' | 'KHR' })}>
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cost Price</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sell Price</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={productForm.sell_price} onChange={(e) => setProductForm({ ...productForm, sell_price: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input className="form-input" type="number" min="0" value={productForm.low_stock_threshold} onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Stock Movement - {selectedProduct.name}</h2>
              <button className="modal-close" onClick={() => setShowStockModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleStockMovement}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Current Stock: {selectedProduct.quantity} {selectedProduct.unit}</label>
                </div>
                <div className="form-group">
                  <label className="form-label">Movement Type</label>
                  <select className="form-select" value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as 'in' | 'out' | 'adjust' })}>
                    <option value="in">Stock In (add)</option>
                    <option value="out">Stock Out (remove)</option>
                    <option value="adjust">Adjustment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" step="0.01" min="0.01" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={stockForm.movement_date} onChange={(e) => setStockForm({ ...stockForm, movement_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Note</label>
                  <input className="form-input" value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
