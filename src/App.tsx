import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AuthPage } from './pages/AuthPage'
import { AppLayout } from './pages/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { TransactionsPage } from './pages/TransactionsPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { InvoiceDetailPage } from './pages/InvoiceDetailPage'
import { CreateInvoicePage } from './pages/CreateInvoicePage'
import { ProductsPage } from './pages/ProductsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!session) return <AuthPage />
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<CreateInvoicePage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
