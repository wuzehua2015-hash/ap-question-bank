import { useState, useEffect, useRef } from 'react'

/**
 * Timer Component - Universal countdown timer for exam sections.
 *
 * Features:
 * - Displays remaining time in mm:ss format
 * - Color transitions: green (>=60%) → yellow (20-60%) → red + blink (<20%)
 * - Auto-triggers onTimeout when time reaches zero
 * - Persists remaining time in sessionStorage (survives page refresh)
 * - Handles tab background throttling via document.visibilitychange
 *
 * Props:
 *   - seconds: total time limit in seconds (from subjects.json config)
 *   - storageKey: unique sessionStorage key for this timer instance
 *   - onTimeout: callback when time reaches zero
 *   - phase: 'playing' | 'submitted' — only counts down when 'playing'
 */
function Timer({ seconds, storageKey, onTimeout, phase = 'playing' }) {
  const [remaining, setRemaining] = useState(() => {
    // On mount: restore from sessionStorage if exists, else use initial
    const saved = sessionStorage.getItem(storageKey)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return seconds
  })

  const intervalRef = useRef(null)
  const lastTickRef = useRef(0)
  const hasTimedOut = useRef(false)

  // Initialize lastTickRef after mount (avoid Date.now() during render)
  useEffect(() => {
    lastTickRef.current = Date.now()
  }, [])

  // Persist remaining time to sessionStorage on every change
  useEffect(() => {
    if (remaining > 0) {
      sessionStorage.setItem(storageKey, String(remaining))
    } else {
      sessionStorage.removeItem(storageKey)
    }
  }, [remaining, storageKey])

  // Handle tab visibility change — prevent throttling from stealing time
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) return
      // Tab became visible: sync with wall-clock
      const now = Date.now()
      const elapsed = Math.floor((now - lastTickRef.current) / 1000)
      if (elapsed > 1) {
        setRemaining(prev => {
          const next = Math.max(0, prev - elapsed)
          return next
        })
      }
      lastTickRef.current = now
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Main countdown logic
  useEffect(() => {
    if (phase !== 'playing' || remaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    lastTickRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // Time's up
          clearInterval(intervalRef.current)
          intervalRef.current = null
          if (!hasTimedOut.current) {
            hasTimedOut.current = true
            // Call onTimeout on next tick to avoid state update during render
            setTimeout(() => onTimeout?.(), 0)
          }
          return 0
        }
        lastTickRef.current = Date.now()
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase, onTimeout, remaining])

  // Reset timeout flag when phase changes back to playing
  useEffect(() => {
    if (phase === 'playing') {
      hasTimedOut.current = false
    }
  }, [phase])

  const percentage = seconds > 0 ? remaining / seconds : 1
  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`

  // Color logic
  let colorClass = 'text-green-600'
  let bgClass = 'bg-green-50'
  if (percentage <= 0.2) {
    colorClass = 'text-red-600'
    bgClass = 'bg-red-50'
  } else if (percentage <= 0.6) {
    colorClass = 'text-yellow-600'
    bgClass = 'bg-yellow-50'
  }

  // Blink when < 20%
  const blinkClass = percentage <= 0.2 ? 'animate-pulse' : ''

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgClass} ${blinkClass} border border-opacity-30 ${percentage <= 0.2 ? 'border-red-300' : percentage <= 0.6 ? 'border-yellow-300' : 'border-green-300'}`}>
      <svg className={`w-4 h-4 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`text-sm font-mono font-bold ${colorClass}`}>
        {timeStr}
      </span>
    </div>
  )
}

export default Timer
