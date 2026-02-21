"use client"

import { Card } from '@/components/ui/Card'
import { getLocalizedField } from '@/lib/utils'
import { User, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'

type Trainer = Database['public']['Tables']['trainers']['Row']

interface TrainerCardProps {
  trainer: Trainer
  locale: string
}

export function TrainerCard({ trainer, locale }: TrainerCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to profile
    router.push(`/${locale}/trainers/${trainer.id}`)
  }

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    window.location.href = `tel:${trainer.phone}`
  }

  const initials = getLocalizedField(trainer, 'name', locale)?.trim().split(' ').map((n: string) => n[0]).join('').substring(0, 2)

  return (
    <Card 
      onClick={handleCardClick}
      className="animate-fade-in-up bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative group cursor-pointer hover:-translate-y-1 transition-all"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 font-bold text-sm text-blue-300 drop-shadow-md">
            {initials || <User className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-white drop-shadow-md truncate mb-0.5 group-hover:text-blue-300 transition-colors">
              {getLocalizedField(trainer, 'name', locale)}
            </h3>
            
            <div className="flex items-center gap-2 text-xs text-indigo-100/70 font-medium">
              {trainer.availability && trainer.availability.length > 0 && (
                <div className="flex gap-1.5 items-center">
                  <span className="text-indigo-200/50">{'التوفر:'}</span>
                  <div className="flex gap-1">
                    {trainer.availability.slice(0, 2).map((day: string) => (
                      <span key={day} className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-1 rounded">
                        {day.slice(0, 3)}
                      </span>
                    ))}
                    {trainer.availability.length > 2 && <span className="text-[10px] text-indigo-200/50">+{trainer.availability.length - 2}</span>}
                  </div>
                </div>
              )}
            </div>
        </div>

        <div className="flex items-center gap-2">
           {trainer.phone && (
               <button 
                 onClick={handleCallClick} 
                 className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:text-blue-300 hover:bg-white/20 transition-all flex-shrink-0"
                 title="اتصال"
               >
                   <Phone className="w-3.5 h-3.5" />
               </button>
           )}
        </div>
      </div>
    </Card>
  )
}
