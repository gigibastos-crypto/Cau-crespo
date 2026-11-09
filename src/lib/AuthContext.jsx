import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({ session: null, loading: true, isStaff: null, role: null })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(null) // null = checking/unknown, true/false once resolved
  const [role, setRole] = useState(null) // 'master' | 'funcionario' | null

  async function checkStaff(user) {
    if (!user) {
      setIsStaff(null)
      setRole(null)
      return
    }
    const { data } = await supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle()
    setIsStaff(!!data)
    setRole(data?.role ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await checkStaff(data.session?.user)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      await checkStaff(newSession?.user)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, loading, isStaff, role, isMaster: role === 'master' }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
