import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({ session: null, loading: true, isStaff: null })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(null) // null = checking/unknown, true/false once resolved

  async function checkStaff(user) {
    if (!user) {
      setIsStaff(null)
      return
    }
    const { data } = await supabase.from('staff').select('user_id').eq('user_id', user.id).maybeSingle()
    setIsStaff(!!data)
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

  return <AuthContext.Provider value={{ session, loading, isStaff }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
