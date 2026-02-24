'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, User, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  locale: string;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'trainee' | 'trainer';
  subtitle?: string;
  href: string;
}

// LANGUAGES constant removed

export function Header({ locale, title, showBack, backHref, onBack }: HeaderProps) {
  const isRTL = true;
  const BackIcon = ChevronRight;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const nameField = 'name_ar';

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [searchOpen]);

  const handleSearch = useCallback(async (term: string) => {
    setQuery(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    // Debounce: clear previous timer, set new one
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const [traineeRes, trainerRes] = await Promise.all([
          (supabase as any)
            .from('trainees')
            .select('id, name_en, name_ar, name_he, class_id, phone')
            .or(`name_en.ilike.%${term}%,name_ar.ilike.%${term}%,name_he.ilike.%${term}%,phone.ilike.%${term}%`)
            .limit(5),
          (supabase as any)
            .from('trainers')
            .select('id, name_en, name_ar, name_he, phone')
            .or(`name_en.ilike.%${term}%,name_ar.ilike.%${term}%,name_he.ilike.%${term}%,phone.ilike.%${term}%`)
            .limit(5),
        ]);

        const mapped: SearchResult[] = [];

        if (traineeRes.data) {
          for (const t of traineeRes.data) {
            mapped.push({
              id: t.id,
              name: t[nameField] || t.name_he,
              type: 'trainee',
              subtitle: t.phone || undefined,
              href: `/${locale}/teams/${t.class_id}`,
            });
          }
        }

        if (trainerRes.data) {
          for (const t of trainerRes.data) {
            mapped.push({
              id: t.id,
              name: t[nameField] || t.name_he,
              type: 'trainer',
              subtitle: t.phone || undefined,
              href: `/${locale}/trainers`,
            });
          }
        }

        setResults(mapped);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [locale, nameField]);

  // Close on Escape or click outside
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
          setSearchOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

// Language switcher logic removed

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-20 gap-4">
            
            {/* Left: Logo & Back */}
            <div className={`flex items-center gap-3 relative z-10 ${showBack ? 'pl-2' : ''}`}>
              {showBack && (
                <button
                  onClick={onBack || (() => backHref ? router.push(backHref) : router.back())}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  <BackIcon className="w-6 h-6" />
                </button>
              )}
              
              <Link href={`/${locale}`} className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 md:w-16 md:h-16 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    <Image 
                        src="/images/logo.jpg" 
                        alt="Logo" 
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="flex flex-col">
                    <h1 className="font-outfit font-bold text-xl md:text-2xl leading-none text-white tracking-tight drop-shadow-md">
                        {title || 'باقة الغربية'}
                    </h1>
                    <p className="text-[10px] md:text-xs text-gold-400 font-bold tracking-wider uppercase opacity-90 drop-shadow-md">
                        {'النادي الرياضي'}
                    </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="hidden md:flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative group" ref={searchRef}>
                    <div className={`flex items-center bg-navy-50/50 border border-navy-100 rounded-full px-4 py-2 w-64 focus-within:w-80 focus-within:bg-white focus-within:border-navy-200 focus-within:shadow-soft transition-all duration-300 ${searchOpen ? 'w-80 bg-white shadow-soft' : ''}`}>
                        <Search className="w-4 h-4 text-navy-300 mr-2 group-focus-within:text-gold-500 transition-colors" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={'بحث...'}
                            className="bg-transparent border-none outline-none text-sm text-navy-800 placeholder-navy-300 w-full"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => setSearchOpen(true)}
                        />
                    </div>
                     {/* Search Results Dropdown */}
                     {searchOpen && (query.length > 1 || results.length > 0) && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                            {loading && <div className="p-4 text-center text-xs text-gray-400">{'جاري التحميل...'}</div>}
                            {!loading && results.length === 0 && query.length > 1 && (
                                <div className="p-4 text-center text-xs text-gray-400">{'لا توجد نتائج'}</div>
                            )}
                            {results.map((result) => (
                                <Link
                                    key={`${result.type}-${result.id}`}
                                    href={result.href}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-navy-50 transition-colors"
                                    onClick={() => setSearchOpen(false)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                        result.type === 'trainee' ? 'bg-indigo-100 text-indigo-700' : 'bg-gold-100 text-gold-700'
                                    }`}>
                                        {result.type === 'trainee' ? 'لا' : 'مد'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-navy-900 truncate">{result.name}</p>
                                        {result.subtitle && <p className="text-[10px] text-navy-500 truncate">{result.subtitle}</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

{/* Language Switcher Removed */}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
                 <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    aria-label="Toggle search"
                    className={`p-2 rounded-full transition-colors ${
                        searchOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
                    }`}
                 >
                    <Search className="w-5 h-5" />
                 </button>
            </div>
        </div>
      </div>

       {/* Mobile Search Overlay */}
       {searchOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl shadow-xl p-4 animate-in slide-in-from-top-2 z-40 border-b border-gray-100">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    autoFocus
                    type="text"
                    placeholder="بحث عن لاعبين، مدربين..."
                    className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full"
                    onClick={() => setSearchOpen(false)}
                >
                    <span className="block w-3 h-3 text-[10px] leading-3 text-center text-gray-600">&times;</span>
                </button>
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto">
                 {results.map((result) => (
                    <Link
                        key={`${result.type}-${result.id}`}
                        href={result.href}
                        className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 active:bg-gray-50"
                        onClick={() => setSearchOpen(false)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            result.type === 'trainee' ? 'bg-indigo-100 text-indigo-700' : 'bg-gold-100 text-gold-700'
                        }`}>
                            {result.type === 'trainee' ? 'لا' : 'مد'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{result.name}</p>
                            {result.subtitle && <p className="text-[10px] text-gray-500">{result.subtitle}</p>}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
       )}
    </header>
  );
}
