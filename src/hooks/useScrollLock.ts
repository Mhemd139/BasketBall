import { useEffect } from 'react'

let lockCount = 0

export function useScrollLock() {
    useEffect(() => {
        if (lockCount === 0) document.body.style.overflow = 'hidden'
        lockCount++
        return () => {
            lockCount--
            if (lockCount === 0) document.body.style.overflow = ''
        }
    }, [])
}
