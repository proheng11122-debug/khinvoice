import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, Invoice, InvoiceItem, InvoicePayment, Profile } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatCurrency, formatDate, statusColor, todayISO } from '../lib/utils'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<InvoicePayment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', note: '', payment_date: todayISO() })
  const [savingPay, setSavingPay] = useState(false)

  useEffect(() => { loadData() }, [id, session])

  async function loadData() {
    if (!id || !session?.user) return
    const [inv, it, pa, pr] = await Promise.all([
      supabase.from('invoices').select('*').eq('id', id).maybeSingle(),
      supabase.from('invoice_items').select('*').eq('invoice_id', id).order('created_at'),
      supabase.from('invoice_payments').select('*').eq('invoice_id', id).order('payment_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
    ])
    setInvoice(inv.data as Invoice | null); setItems(it.data as InvoiceItem[] || []); setPayments(pa.data as InvoicePayment[] || []); setProfile(pr.data as Profile | null); setLoading(false)
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault(); setSavingPay(true)
    const amt = parseFloat(payForm.amount); if (isNaN(amt) || amt <= 0) { setSavingPay(false); return }
    await supabase.from('invoice_payments').insert({ invoice_id: id, amount: amt, note: payForm.note || null, payment_date: payForm.payment_date })
    setPayForm({ amount: '', note: '', payment_date: todayISO() }); setShowPay(false); setSavingPay(false); await loadData()
  }

  async function handleDeletePay(pid: string) { if (!confirm('Delete this payment?')) return; await supabase.from('invoice_payments').delete().eq('id', pid); await loadData() }
  async function handleDeleteInvoice() { if (!confirm('Delete this entire invoice?')) return; await supabase.from('invoices').delete().eq('id', id); navigate('/invoices') }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!invoice) return <div className="empty-state"><p>Invoice not found.</p><Link to="/invoices" className="btn btn-primary mt-4">Back to Invoices</Link></div>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header"><div><h1 className="page-title">Invoice #{invoice.invoice_number}</h1><p className="page-subtitle"><span className="badge" style={{ background: `${statusColor(invoice.status)}15`, color: statusColor(invoice.status) }}>{invoice.status}</span></p></div><div className="flex gap-2"><button className="btn btn-danger btn-sm" onClick={handleDeleteInvoice}>Delete</button><Link to="/invoices" className="btn btn-secondary btn-sm">Back</Link></div></div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}><div><div className="text-sm text-secondary mb-2">From</div><div className="font-bold text-lg">{profile?.business_name || 'My Business'}</div><div className="text-sm text-secondary">{profile?.phone}</div></div><div><div className="text-sm text-secondary mb-2">Bill To</div><div className="font-bold text-lg">{invoice.customer_name}</div>{invoice.customer_phone && <div className="text-sm text-secondary">{invoice.customer_phone}</div>}</div></div>
        <div className="form-row mt-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}><div><div className="text-sm text-secondary">Invoice Date</div><div className="font-semibold">{formatDate(invoice.invoice_date)}</div></div><div><div className="text-sm text-secondary">Due Date</div><div className="font-semibold">{invoice.due_date ? formatDate(invoice.due_date) : '-'}</div></div><div><div className="text-sm text-secondary">Currency</div><div className="font-semibold">{invoice.currency}</div></div></div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Items</h2>
        <div className="table-wrapper"><table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{items.map(it => <tr key={it.id}><td>{it.description}{it.unit ? ` (${it.unit})` : ''}</td><td>{it.quantity}</td><td>{formatCurrency(Number(it.unit_price), invoice.currency)}</td><td className="font-bold">{formatCurrency(Number(it.total), invoice.currency)}</td></tr>)}</tbody></table></div>
        <div className="text-right mt-4"><div className="text-sm text-secondary">Subtotal</div><div className="text-lg font-bold">{formatCurrency(Number(invoice.subtotal), invoice.currency)}</div></div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-4"><h2 className="card-title" style={{ margin: 0 }}>Payments</h2><button className="btn btn-primary btn-sm" onClick={() => setShowPay(true)}>+ Add Payment</button></div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}><div className="stat-card" style={{ padding: 16 }}><div className="stat-label">Subtotal</div><div className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</div></div><div className="stat-card" style={{ padding: 16 }}><div className="stat-label">Paid</div><div className="stat-value income" style={{ fontSize: 20 }}>{formatCurrency(Number(invoice.paid_amount), invoice.currency)}</div></div><div className="stat-card" style={{ padding: 16 }}><div className="stat-label">Balance</div><div className="stat-value expense" style={{ fontSize: 20 }}>{formatCurrency(Number(invoice.balance), invoice.currency)}</div></div></div>
        {payments.length > 0 && <div className="table-wrapper mt-4"><table><thead><tr><th>Date</th><th>Amount</th><th>Note</th><th></th></tr></thead><tbody>{payments.map(p => <tr key={p.id}><td>{formatDate(p.payment_date)}</td><td className="text-success font-bold">{formatCurrency(Number(p.amount), invoice.currency)}</td><td>{p.note || '-'}</td><td><button className="btn btn-ghost btn-sm" onClick={() => handleDeletePay(p.id)}><span style={{ color: 'var(--error-600)' }}>Delete</span></button></td></tr>)}</tbody></table></div>}
      </div>
      {invoice.notes && <div className="card"><h2 className="card-title">Notes</h2><p className="text-sm">{invoice.notes}</p></div>}
      {showPay && (
        <div className="modal-overlay" onClick={() => setShowPay(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Add Payment</h2><button className="modal-close" onClick={() => setShowPay(false)}>&times;</button></div>
            <form onSubmit={handleAddPayment}>
              <div className="modal-body"><div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" step="0.01" min="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder={`Max: ${invoice.balance}`} required /></div><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required /></div><div className="form-group"><label className="form-label">Note</label><input className="form-input" value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} placeholder="Optional" /></div></div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowPay(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={savingPay}>{savingPay ? 'Saving...' : 'Add Payment'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
