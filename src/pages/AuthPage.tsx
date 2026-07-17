import { useState } from 'react'
import { useAuth } from '../lib/auth'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true)
    if (mode === 'signup') {
      if (!businessName.trim()) { setError('Please enter your business name'); setLoading(false); return }
      const { error } = await signUp(phone, password, businessName, username)
      if (error) setError(error)
    } else {
      const { error } = await signIn(phone, password)
      if (error) setError(error)
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">KH</div>
        <h1 className="auth-title">KH Invoice</h1>
        <p className="auth-subtitle">Manage your business finances with ease</p>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>Sign In</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input className="form-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Sok Pisey Shop" required />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. pisey_shop" />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 012345678" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
