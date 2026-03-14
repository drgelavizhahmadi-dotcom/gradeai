import { useState, useEffect } from 'react'

export function useTimer(initialHours = 23, initialMinutes = 47, initialSeconds = 12) {
  const [timeLeft, setTimeLeft] = useState(
    `${initialHours.toString().padStart(2, '0')}:${initialMinutes.toString().padStart(2, '0')}:${initialSeconds.toString().padStart(2, '0')}`
  )

  useEffect(() => {
    const endTime = Date.now() + initialHours * 3600000 + initialMinutes * 60000 + initialSeconds * 1000
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now())
      if (remaining === 0) {
        clearInterval(interval)
        return
      }
      
      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      )
    }, 1000)
    
    return () => clearInterval(interval)
  }, [initialHours, initialMinutes, initialSeconds])

  return timeLeft
}
