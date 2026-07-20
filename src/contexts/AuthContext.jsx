import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchMe,
  fetchProgress,
  loginWithPassword as loginWithPasswordApi,
  requestEmailVerification as requestEmailVerificationApi,
  requestLoginCode as requestLoginCodeApi,
  registerAccount as registerAccountApi,
  saveProgress,
  setSessionToken,
  verifyLoginCode as verifyLoginCodeApi,
  verifyEmail as verifyEmailApi,
} from '../utils/accountApi'
import {
  collectLocalProgressSnapshot,
  mergeProgressSnapshot,
  STORAGE_SYNC_EVENT,
} from '../utils/storage'
import { hasLynkStudentAccess } from '../utils/featureAccess'

const AuthContext = createContext({
  status: 'loading',
  user: null,
  entitlements: [],
  accountLevel: 'visitor',
  isLoggedIn: false,
  isInternalStudent: false,
  isLynkStudent: false,
  requestEmailVerification: async () => {},
  requestLoginCode: async () => {},
  registerAccount: async () => {},
  loginWithPassword: async () => {},
  verifyLoginCode: async () => {},
  verifyEmail: async () => {},
  logout: () => {},
  syncNow: async () => {},
})

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)
  const [entitlements, setEntitlements] = useState([])
  const syncTimerRef = useRef(null)
  const syncingRef = useRef(false)

  const applyAccountData = useCallback((accountData) => {
    setUser(accountData.user || null)
    setEntitlements(accountData.entitlements || [])
    setStatus(accountData.user ? 'authenticated' : 'visitor')
  }, [])

  const syncNow = useCallback(async () => {
    if (!user || syncingRef.current) return
    syncingRef.current = true
    try {
      await saveProgress(collectLocalProgressSnapshot())
    } catch (error) {
      console.warn('Failed to sync progress:', error)
    } finally {
      syncingRef.current = false
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    async function restore() {
      try {
        const accountData = await fetchMe()
        if (cancelled) return
        applyAccountData(accountData)
        const progressData = await fetchProgress().catch(() => null)
        if (!cancelled && progressData?.snapshot) {
          mergeProgressSnapshot(progressData.snapshot)
          await saveProgress(collectLocalProgressSnapshot()).catch(() => {})
        }
      } catch {
        if (!cancelled) {
          setSessionToken('')
          setUser(null)
          setEntitlements([])
          setStatus('visitor')
        }
      }
    }
    restore()
    return () => { cancelled = true }
  }, [applyAccountData])

  useEffect(() => {
    const onLocalDataChange = () => {
      if (!user) return
      window.clearTimeout(syncTimerRef.current)
      syncTimerRef.current = window.setTimeout(() => {
        syncNow()
      }, 800)
    }
    window.addEventListener(STORAGE_SYNC_EVENT, onLocalDataChange)
    return () => {
      window.removeEventListener(STORAGE_SYNC_EVENT, onLocalDataChange)
      window.clearTimeout(syncTimerRef.current)
    }
  }, [syncNow, user])

  const requestLoginCode = useCallback((email) => {
    return requestLoginCodeApi(email)
  }, [])

  const requestEmailVerification = useCallback(() => {
    return requestEmailVerificationApi()
  }, [])

  const finishAuthenticated = useCallback(async (accountData) => {
    setSessionToken(accountData.sessionToken)
    applyAccountData(accountData)
    const progressData = await fetchProgress().catch(() => null)
    if (progressData?.snapshot) mergeProgressSnapshot(progressData.snapshot)
    await saveProgress(collectLocalProgressSnapshot()).catch(() => {})
    return accountData
  }, [applyAccountData])

  const registerAccount = useCallback((payload) => {
    return registerAccountApi(payload).then(finishAuthenticated)
  }, [finishAuthenticated])

  const loginWithPassword = useCallback((email, password) => {
    return loginWithPasswordApi(email, password).then(finishAuthenticated)
  }, [finishAuthenticated])

  const verifyLoginCode = useCallback(async (email, code) => {
    const accountData = await verifyLoginCodeApi(email, code)
    return finishAuthenticated(accountData)
  }, [finishAuthenticated])

  const verifyEmail = useCallback(async (code) => {
    await verifyEmailApi(code)
    const accountData = await fetchMe()
    applyAccountData(accountData)
    return accountData
  }, [applyAccountData])

  const logout = useCallback(() => {
    setSessionToken('')
    setUser(null)
    setEntitlements([])
    setStatus('visitor')
  }, [])

  const accountLevel = user?.account_level || (user ? 'free' : 'visitor')
  const isInternalStudent = hasLynkStudentAccess({ accountLevel, entitlements })

  const value = useMemo(() => ({
    status,
    user,
    entitlements,
    accountLevel,
    isLoggedIn: Boolean(user),
    isInternalStudent,
    isLynkStudent: isInternalStudent,
    requestEmailVerification,
    requestLoginCode,
    registerAccount,
    loginWithPassword,
    verifyLoginCode,
    verifyEmail,
    logout,
    syncNow,
  }), [accountLevel, entitlements, isInternalStudent, loginWithPassword, logout, registerAccount, requestEmailVerification, requestLoginCode, status, syncNow, user, verifyEmail, verifyLoginCode])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
