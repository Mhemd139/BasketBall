'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (mounted && open) {
            document.body.style.overflow = 'hidden';
        }
        return () => { if (mounted) document.body.style.overflow = ''; };
    }, [open, mounted]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange?.(false)}
            />
            <div className="relative z-50 w-full max-w-lg max-h-full flex flex-col">
                {children}
            </div>
        </div>,
        document.body
    );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
    return (
        <div 
            className={cn("bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200", className)} 
            {...props}
        >
            {children}
        </div>
    );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-6 py-4 border-b border-gray-100 bg-gray-50/50", className)} {...props}>
            {children}
        </div>
    );
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center", className)} {...props}>
            {children}
        </div>
    );
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("text-lg font-bold text-gray-900", className)} {...props}>
            {children}
        </h3>
    );
}

// Helper to find Close button context if needed, but for now parent handles generic close via backdrop
