import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Transaction, Invoice, Product } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatCurrency, formatDate, statusColor } from '../lib/utils'

export function Dashboard() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])

  useEffect(() => {
    async function loadData() {
      if (!session?.user) return
      const userId = session.user.id

      const [txRes, invRes, prodRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false })
          .limit(5),
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true),
      ])

      setTransactions(txRes.data as Transaction[] || [])
      setInvoices(invRes.data as Invoice[] || [])
      const products = (prodRes.data as Product[]) || []
      setLowStockProducts(products.filter((p) => p.quantity <= p.low_stock_threshold))

      setLoading(false)
    }
    loadData()
  }, [session])

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    )
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid')
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + Number(i.balance), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your business finances</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value expense">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value">{formatCurrency(totalIncome - totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding Invoices</div>
          <div className="stat-value">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="card mb-4" style={{ marginBottom: 24 }}>
          <h2 className="card-title">Low Stock Alert</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Qty</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td style={{ color: 'var(--error-600)', fontWeight: 600 }}>{p.quantity} {p.unit}</td>
                    <td>{p.low_stock_threshold} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title" style={{ margin: 0 }}>Recent Transactions</h2>
            <Link to="/transactions" className="text-sm">View all</Link>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">T</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.transaction_date)}</td>
                      <td>{t.description}</td>
                      <td style={{ color: t.type === 'income' ? 'var(--success-600)' : 'var(--error-600)', fontWeight: 600 }}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title" style={{ margin: 0 }}>Recent Invoices</h2>
            <Link to="/invoices" className="text-sm">View all</Link>
          </div>
          {invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">I</div>
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 600 }}>
                          #{inv.invoice_number}
                        </Link>
                      </td>
                      <td>{inv.customer_name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: `${statusColor(inv.status)}15`, color: statusColor(inv.status) }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="font-semibold">{formatCurrency(Number(inv.subtotal), inv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
