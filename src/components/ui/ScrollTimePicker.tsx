'use client'

import { useRef, useEffect, useCallback } from 'react'

const ITEM_H = 52

interface ScrollColumnProps {
    items: string[]
    value: string
    onChange: (v: string) => void
    ariaLabel: string
    accent?: string
}

function ScrollColumn({ items, value, onChange, ariaLabel, accent = 'text-royal' }: ScrollColumnProps) {
    const ref = useRef<HTMLDivElement>(null)
    const selectedIndex = items.indexOf(value)

    const scrollTo = useCallback((index: number, smooth = false) => {
        ref.current?.scrollTo({ top: index * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
    }, [])

    useEffect(() => {
        scrollTo(selectedIndex)
    }, [selectedIndex, scrollTo])

    const snapOnEnd = useCallback(() => {
        const el = ref.current
        if (!el) return
        const index = Math.round(el.scrollTop / ITEM_H)
        scrollTo(index, true)
        if (items[index] && items[index] !== value) onChange(items[index])
    }, [items, value, onChange, scrollTo])

    return (
        <div className="relative flex-1 overflow-hidden select-none" aria-label={ariaLabel}>
            {/* Strong top fade */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white via-white/90 to-transparent z-10 pointer-events-none" />
            {/* Two thin lines as selection indicator */}
            <div className="scroll-sel-top" />
            <div className="scroll-sel-bottom" />
            {/* Strong bottom fade */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none" />

            <div
                ref={ref}
                onTouchEnd={snapOnEnd}
                onMouseUp={snapOnEnd}
                onScroll={snapOnEnd}
                className="scroll-col"
            >
                <div className="scroll-col-pad" />
                {items.map((item) => (
                    <div
                        key={item}
                        className={`scroll-col-item font-space font-black transition-colors duration-100 ${
                            item === value ? `text-4xl ${accent}` : 'text-2xl text-gray-300'
                        }`}
                    >
                        {item}
                    </div>
                ))}
                <div className="scroll-col-pad" />
            </div>
        </div>
    )
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

interface ScrollTimePickerProps {
    value: string   // "HH:MM"
    onChange: (v: string) => void
    label?: string
    accentColor?: string
}

export function ScrollTimePicker({ value, onChange, label, accentColor = 'text-royal' }: ScrollTimePickerProps) {
    const [hh, mm] = value.split(':')
    const snappedMm = MINUTES.reduce((prev, cur) =>
        Math.abs(parseInt(cur) - parseInt(mm)) < Math.abs(parseInt(prev) - parseInt(mm)) ? cur : prev
    )

    return (
        <div className="bg-white rounded-2xl overflow-hidden">
            {label && (
                <div className="px-5 pt-4 pb-1">
                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase text-center">{label}</p>
                </div>
            )}
            <div className="flex items-center" dir="ltr">
                <ScrollColumn
                    items={HOURS}
                    value={hh}
                    onChange={(h) => onChange(`${h}:${snappedMm}`)}
                    ariaLabel="Hour"
                    accent={accentColor}
                />
                <div className="flex flex-col items-center gap-3 shrink-0 px-1 pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
                <ScrollColumn
                    items={MINUTES}
                    value={snappedMm}
                    onChange={(m) => onChange(`${hh}:${m}`)}
                    ariaLabel="Minute"
                    accent={accentColor}
                />
            </div>
        </div>
    )
}
