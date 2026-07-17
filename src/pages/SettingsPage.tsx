import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export function SettingsPage() {
  const { profile, session, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    business_name: profile?.business_name || '',
    username: profile?.username || '',
    phone: profile?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.from('profiles').update({
      business_name: form.business_name,
      username: form.username,
      phone: form.phone,
    }).eq('id', session!.user.id)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Profile updated successfully')
      await refreshProfile()
    }
    setSaving(false)
  }

  async function handleQRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const fileName = `${session!.user.id}/qr-code.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('qr-codes').getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ qr_code_url: data.publicUrl })
      .eq('id', session!.user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('QR code uploaded successfully')
      await refreshProfile()
    }
    setUploading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your business profile</p>
        </div>
      </div>

      {message && (
        <div className="badge badge-success" style={{ padding: '10px 14px', marginBottom: 16, display: 'block' }}>
          {message}
        </div>
      )}
      {error && (
        <div className="auth-error">{error}</div>
      )}

      <div className="card mb-4" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Business Profile</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              className="form-input"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">Payment QR Code</h2>
        <p className="text-sm text-secondary mb-4">
          Upload a QR code image that customers can scan to pay you (e.g. ABA, ACLEDA, Wing).
        </p>

        {profile?.qr_code_url && (
          <div className="text-center mb-4">
            <img
              src={profile.qr_code_url}
              alt="Payment QR Code"
              style={{ maxWidth: 200, borderRadius: 12, border: '1px solid var(--border)' }}
            />
          </div>
        )}

        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Upload QR Code'}
          <input
            type="file"
            accept="image/*"
            onChange={handleQRUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  )
}
