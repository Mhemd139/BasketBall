'use client'

import { useRef, useEffect, useCallback } from 'react'

const ITEM_H = 52

interface ScrollColumnProps {
    items: string[]
    value: string
    onChange: (v: string) => void
    ariaLabel: string
    accent?: string
    dark?: boolean
}

function ScrollColumn({ items, value, onChange, ariaLabel, accent = 'text-royal', dark = false }: ScrollColumnProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isProgrammatic = useRef(false)

    // Sync scroll position when value changes from outside
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const idx = items.indexOf(value)
        if (idx < 0) return
        const target = idx * ITEM_H
        if (Math.abs(el.scrollTop - target) > 2) {
            isProgrammatic.current = true
            el.scrollTo({ top: target, behavior: 'instant' })
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { isProgrammatic.current = false })
            })
        }
    }, [value, items])

    // Read final position after CSS snap settles
    useEffect(() => {
        const el = ref.current
        if (!el) return

        let fallbackTimer: ReturnType<typeof setTimeout> | undefined

        const readPosition = () => {
            if (isProgrammatic.current) return
            const index = Math.round(el.scrollTop / ITEM_H)
            const clamped = Math.max(0, Math.min(index, items.length - 1))
            if (items[clamped] && items[clamped] !== value) {
                onChange(items[clamped])
            }
        }

        // scrollend: fires once when all scrolling + snapping is done
        const handleScrollEnd = () => readPosition()

        // Fallback for browsers without scrollend
        const handleScroll = () => {
            if (fallbackTimer) clearTimeout(fallbackTimer)
            fallbackTimer = setTimeout(readPosition, 150)
        }

        if ('onscrollend' in window) {
            el.addEventListener('scrollend', handleScrollEnd)
        } else {
            el.addEventListener('scroll', handleScroll)
        }

        return () => {
            el.removeEventListener('scrollend', handleScrollEnd)
            el.removeEventListener('scroll', handleScroll)
            if (fallbackTimer) clearTimeout(fallbackTimer)
        }
    }, [items, value, onChange])

    const handleTap = useCallback((item: string) => {
        const idx = items.indexOf(item)
        if (idx < 0) return
        isProgrammatic.current = true
        ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
        onChange(item)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { isProgrammatic.current = false })
        })
    }, [items, onChange])

    const fadeFrom = dark ? 'from-[#0d1829]' : 'from-white'
    const fadeVia = dark ? 'via-[#0d1829]/90' : 'via-white/90'
    const inactiveText = dark ? 'text-white/15' : 'text-gray-300'

    return (
        <div className="relative flex-1 overflow-hidden select-none" aria-label={ariaLabel}>
            <div className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b ${fadeFrom} ${fadeVia} to-transparent z-10 pointer-events-none`} />
            <div className="scroll-sel-top" />
            <div className="scroll-sel-bottom" />
            <div className={`absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t ${fadeFrom} ${fadeVia} to-transparent z-10 pointer-events-none`} />

            <div ref={ref} className="scroll-col">
                <div className="scroll-col-pad" />
                {items.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => handleTap(item)}
                        aria-pressed={item === value}
                        className={`scroll-col-item w-full bg-transparent border-0 p-0 font-space font-black transition-colors duration-100 cursor-pointer ${
                            item === value ? `text-4xl ${accent}` : `text-2xl ${inactiveText}`
                        }`}
                    >
                        {item}
                    </button>
                ))}
                <div className="scroll-col-pad" />
            </div>
        </div>
    )
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

interface ScrollTimePickerProps {
    value: string
    onChange: (v: string) => void
    label?: string
    accentColor?: string
    variant?: 'light' | 'dark'
}

export function ScrollTimePicker({ value, onChange, label, accentColor, variant = 'light' }: ScrollTimePickerProps) {
    const dark = variant === 'dark'
    const accent = accentColor ?? (dark ? 'text-electric' : 'text-royal')
    const [hh, mm] = value.split(':')
    const snappedMm = MINUTES.reduce((prev, cur) =>
        Math.abs(parseInt(cur) - parseInt(mm)) < Math.abs(parseInt(prev) - parseInt(mm)) ? cur : prev
    )

    const handleHourChange = useCallback((h: string) => {
        onChange(`${h}:${snappedMm}`)
    }, [onChange, snappedMm])

    const handleMinuteChange = useCallback((m: string) => {
        onChange(`${hh}:${m}`)
    }, [onChange, hh])

    return (
        <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-white/[0.06] dark-picker' : 'bg-white'}`}>
            {label && (
                <div className="px-5 pt-4 pb-1">
                    <p className={`text-xs font-bold tracking-widest uppercase text-center ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</p>
                </div>
            )}
            <div className="flex items-center" dir="ltr">
                <ScrollColumn
                    items={HOURS}
                    value={hh}
                    onChange={handleHourChange}
                    ariaLabel="Hour"
                    accent={accent}
                    dark={dark}
                />
                <div className="flex flex-col items-center gap-3 shrink-0 px-1 pb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-gray-400'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-gray-400'}`} />
                </div>
                <ScrollColumn
                    items={MINUTES}
                    value={snappedMm}
                    onChange={handleMinuteChange}
                    ariaLabel="Minute"
                    accent={accent}
                    dark={dark}
                />
            </div>
        </div>
    )
}
