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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '', payment_date: todayISO() })
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => {
    loadData()
  }, [id, session])

  async function loadData() {
    if (!id || !session?.user) return
    const [invRes, itemRes, payRes, profRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('id', id).maybeSingle(),
      supabase.from('invoice_items').select('*').eq('invoice_id', id).order('created_at'),
      supabase.from('invoice_payments').select('*').eq('invoice_id', id).order('payment_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
    ])
    setInvoice(invRes.data as Invoice | null)
    setItems((itemRes.data as InvoiceItem[]) || [])
    setPayments((payRes.data as InvoicePayment[]) || [])
    setProfile(profRes.data as Profile | null)
    setLoading(false)
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    setSavingPayment(true)
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      setSavingPayment(false)
      return
    }
    await supabase.from('invoice_payments').insert({
      invoice_id: id,
      amount,
      note: paymentForm.note || null,
      payment_date: paymentForm.payment_date,
    })
    setPaymentForm({ amount: '', note: '', payment_date: todayISO() })
    setShowPaymentModal(false)
    setSavingPayment(false)
    await loadData()
  }

  async function handleDeletePayment(paymentId: string) {
    if (!confirm('Delete this payment?')) return
    await supabase.from('invoice_payments').delete().eq('id', paymentId)
    await loadData()
  }

  async function handleDeleteInvoice() {
    if (!confirm('Delete this entire invoice? This cannot be undone.')) return
    await supabase.from('invoices').delete().eq('id', id)
    navigate('/invoices')
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>
  }

  if (!invoice) {
    return (
      <div className="empty-state">
        <p>Invoice not found.</p>
        <Link to="/invoices" className="btn btn-primary mt-4">Back to Invoices</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice #{invoice.invoice_number}</h1>
          <p className="page-subtitle">
            <span
              className="badge"
              style={{ background: `${statusColor(invoice.status)}15`, color: statusColor(invoice.status) }}
            >
              {invoice.status}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-danger btn-sm" onClick={handleDeleteInvoice}>Delete</button>
          <Link to="/invoices" className="btn btn-secondary btn-sm">Back</Link>
        </div>
      </div>

      <div className="card mb-4" style={{ marginBottom: 24 }}>
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <div className="text-sm text-secondary mb-2">From</div>
            <div className="font-bold text-lg">{profile?.business_name || 'My Business'}</div>
            <div className="text-sm text-secondary">{profile?.phone}</div>
          </div>
          <div>
            <div className="text-sm text-secondary mb-2">Bill To</div>
            <div className="font-bold text-lg">{invoice.customer_name}</div>
            {invoice.customer_phone && <div className="text-sm text-secondary">{invoice.customer_phone}</div>}
          </div>
        </div>
        <div className="form-row mt-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <div className="text-sm text-secondary">Invoice Date</div>
            <div className="font-semibold">{formatDate(invoice.invoice_date)}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Due Date</div>
            <div className="font-semibold">{invoice.due_date ? formatDate(invoice.due_date) : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Currency</div>
            <div className="font-semibold">{invoice.currency}</div>
          </div>
        </div>
      </div>

      <div className="card mb-4" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Items</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}{item.unit ? ` (${item.unit})` : ''}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(Number(item.unit_price), invoice.currency)}</td>
                  <td className="font-bold">{formatCurrency(Number(item.total), invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-right mt-4">
          <div className="text-sm text-secondary">Subtotal</div>
          <div className="text-lg font-bold">{formatCurrency(Number(invoice.subtotal), invoice.currency)}</div>
        </div>
      </div>

      <div className="card mb-4" style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title" style={{ margin: 0 }}>Payments</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)}>+ Add Payment</button>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-label">Subtotal</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</div>
          </div>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-label">Paid</div>
            <div className="stat-value income" style={{ fontSize: 20 }}>{formatCurrency(Number(invoice.paid_amount), invoice.currency)}</div>
          </div>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-label">Balance</div>
            <div className="stat-value expense" style={{ fontSize: 20 }}>{formatCurrency(Number(invoice.balance), invoice.currency)}</div>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="table-wrapper mt-4">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td>{formatDate(pay.payment_date)}</td>
                    <td className="text-success font-bold">{formatCurrency(Number(pay.amount), invoice.currency)}</td>
                    <td>{pay.note || '-'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeletePayment(pay.id)}>
                        <span style={{ color: 'var(--error-600)' }}>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {invoice.notes && (
        <div className="card">
          <h2 className="card-title">Notes</h2>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder={`Max: ${invoice.balance}`}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Note</label>
                  <input
                    className="form-input"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingPayment}>
                  {savingPayment ? 'Saving...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
