import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Invoice } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatCurrency, formatDate, statusColor } from '../lib/utils'

export function InvoicesPage() {
  const { session } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all')

  useEffect(() => {
    async function load() {
      if (!session?.user) return
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setInvoices((data as Invoice[]) || [])
      setLoading(false)
    }
    load()
  }, [session])

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>
  }

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter)
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount), 0)
  const totalOutstanding = invoices.reduce((s, i) => s + Number(i.balance), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Create and manage customer invoices</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{invoices.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value income">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value expense">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4">
          {(['all', 'unpaid', 'partial', 'paid'] as const).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">I</div>
            <p>No invoices yet. Click "New Invoice" to create one.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Subtotal</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 700 }}>
                        #{inv.invoice_number}
                      </Link>
                    </td>
                    <td>{inv.customer_name}</td>
                    <td>{formatDate(inv.invoice_date)}</td>
                    <td>{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                    <td>{formatCurrency(Number(inv.subtotal), inv.currency)}</td>
                    <td className="text-success">{formatCurrency(Number(inv.paid_amount), inv.currency)}</td>
                    <td className="text-error">{formatCurrency(Number(inv.balance), inv.currency)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: `${statusColor(inv.status)}15`, color: statusColor(inv.status) }}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
