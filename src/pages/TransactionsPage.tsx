import { useEffect, useState } from 'react'
import { supabase, Transaction, CustomUnit } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatCurrency, formatDate, todayISO } from '../lib/utils'

export function TransactionsPage() {
  const { session } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [units, setUnits] = useState<CustomUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', description: '', quantity: '1', unit: '', unit_price: '', currency: 'USD' as 'USD' | 'KHR', transaction_date: todayISO() })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [session])
  async function loadData() {
    if (!session?.user) return
    const [tx, un] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', session.user.id).order('transaction_date', { ascending: false }),
      supabase.from('custom_units').select('*').eq('user_id', session.user.id).order('name'),
    ])
    setTransactions(tx.data as Transaction[] || []); setUnits(un.data as CustomUnit[] || []); setLoading(false)
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    const qty = parseFloat(form.quantity), price = parseFloat(form.unit_price)
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be greater than 0'); setSaving(false); return }
    if (isNaN(price) || price <= 0) { setError('Unit price must be greater than 0'); setSaving(false); return }
    const { error } = await supabase.from('transactions').insert({ user_id: session!.user.id, type: form.type, description: form.description, quantity: qty, unit: form.unit || null, unit_price: price, currency: form.currency, transaction_date: form.transaction_date })
    if (error) { setError(error.message); setSaving(false); return }
    setShowModal(false); setForm({ type: 'income', description: '', quantity: '1', unit: '', unit_price: '', currency: 'USD', transaction_date: todayISO() }); await loadData(); setSaving(false)
  }
  async function handleDelete(id: string) { if (!confirm('Delete this transaction?')) return; await supabase.from('transactions').delete().eq('id', id); await loadData() }
  async function handleAddUnit() {
    const name = prompt('Enter unit name:'); if (!name?.trim()) return
    const { error } = await supabase.from('custom_units').insert({ user_id: session!.user.id, name: name.trim() })
    if (error) { alert(error.message); return } await loadData()
  }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)
  const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Transactions</h1><p className="page-subtitle">Track your income and expenses</p></div><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Transaction</button></div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total Income</div><div className="stat-value income">{formatCurrency(inc)}</div></div>
        <div className="stat-card"><div className="stat-label">Total Expense</div><div className="stat-value expense">{formatCurrency(exp)}</div></div>
        <div className="stat-card"><div className="stat-label">Net</div><div className="stat-value">{formatCurrency(inc - exp)}</div></div>
      </div>
      <div className="card">
        <div className="flex gap-2 mb-4">{(['all', 'income', 'expense'] as const).map(f => <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}</div>
        {filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">T</div><p>No transactions yet. Click "Add Transaction" to get started.</p></div> : (
          <div className="table-wrapper"><table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th><th></th></tr></thead><tbody>
            {filtered.map(t => <tr key={t.id}><td>{formatDate(t.transaction_date)}</td><td><span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-error'}`}>{t.type}</span></td><td>{t.description}</td><td>{t.quantity} {t.unit || ''}</td><td>{formatCurrency(Number(t.unit_price), t.currency)}</td><td className="font-bold" style={{ color: t.type === 'income' ? 'var(--success-600)' : 'var(--error-600)' }}>{formatCurrency(Number(t.amount), t.currency)}</td><td><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.id)}>Delete</button></td></tr>)}
          </tbody></table></div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2 className="modal-title">Add Transaction</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group"><label className="form-label">Type</label><div className="flex gap-2"><button type="button" className={`btn ${form.type === 'income' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setForm({ ...form, type: 'income' })}>Income</button><button type="button" className={`btn ${form.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setForm({ ...form, type: 'expense' })}>Expense</button></div></div>
              <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Sold 5 bottles of water" required /></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" step="0.01" min="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></div><div className="form-group"><label className="form-label">Unit <button type="button" className="text-sm" style={{ color: 'var(--primary-600)' }} onClick={handleAddUnit}>+ Add</button></label><select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option value="">No unit</option><option value="ដុំ">ដុំ</option><option value="កែវ">កែវ</option><option value="គីឡូ">គីឡូ</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Unit Price</label><input className="form-input" type="number" step="0.01" min="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} required /></div><div className="form-group"><label className="form-label">Currency</label><select className="form-select" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value as 'USD' | 'KHR' })}><option value="USD">USD</option><option value="KHR">KHR</option></select></div></div>
              <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} required /></div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </form>
        </div></div>
      )}
    </div>
  )
}
