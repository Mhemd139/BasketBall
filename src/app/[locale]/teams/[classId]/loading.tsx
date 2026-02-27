import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#060d1a] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
    )
}
