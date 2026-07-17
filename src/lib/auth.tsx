import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, Profile } from './supabase'
import { phoneToEmail } from './utils'

type AuthContextType = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (phone: string, password: string, businessName: string, username: string) => Promise<{ error: string | null }>
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) { console.error('Profile fetch error:', error); return }
    setProfile(data as Profile | null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        fetchProfile(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_OUT') { setProfile(null); setLoading(false); return }
      if (newSession?.user) {
        (async () => { await fetchProfile(newSession.user.id); setLoading(false) })()
      } else {
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(phone: string, password: string, businessName: string, username: string) {
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id, business_name: businessName, username, phone,
      })
      if (profileError) return { error: profileError.message }
    }
    return { error: null }
  }

  async function signIn(phone: string, password: string) {
    const email = phoneToEmail(phone)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function refreshProfile() {
    if (session?.user) { await fetchProfile(session.user.id) }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
