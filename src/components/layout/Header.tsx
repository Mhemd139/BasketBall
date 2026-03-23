'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Users, User, GraduationCap } from 'lucide-react';
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
  type: 'trainee' | 'trainer' | 'team';
  subtitle?: string;
  href: string;
}

// LANGUAGES constant removed

export function Header({ locale, title, showBack, backHref, onBack }: HeaderProps) {
  const BackIcon = ChevronRight;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  const nameField = `name_${locale}` as 'name_ar' | 'name_he' | 'name_en';

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

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const escaped = term.replace(/[%_\\]/g, c => `\\${c}`);

        const [traineeRes, trainerRes, teamRes] = await Promise.all([
          (supabase as any)
            .from('trainees')
            .select('id, name_en, name_ar, name_he, class_id, phone')
            .or(`name_en.ilike.%${escaped}%,name_ar.ilike.%${escaped}%,name_he.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
            .limit(5),
          (supabase as any)
            .from('trainers')
            .select('id, name_en, name_ar, name_he, phone')
            .or(`name_en.ilike.%${escaped}%,name_ar.ilike.%${escaped}%,name_he.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
            .limit(5),
          (supabase as any)
            .from('classes')
            .select('id, name_en, name_ar, name_he, trainees(count)')
            .or(`name_en.ilike.%${escaped}%,name_ar.ilike.%${escaped}%,name_he.ilike.%${escaped}%`)
            .limit(5),
        ]);

        const mapped: SearchResult[] = [];

        if (teamRes.data) {
          for (const t of teamRes.data) {
            const count = t.trainees?.[0]?.count ?? 0
            mapped.push({
              id: t.id,
              name: t[nameField] || t.name_he,
              type: 'team',
              subtitle: `${count} لاعب`,
              href: `/${locale}/teams/${t.id}`,
            });
          }
        }

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
      const target = e.target as Node;
      if (searchRef.current?.contains(target)) return;
      if (mobileSearchRef.current?.contains(target)) return;
      setSearchOpen(false);
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
    <header className="sticky top-0 z-50 w-full bg-[#080e1f]/80 backdrop-blur-2xl border-b border-white/8 shadow-[0_1px_24px_0_rgba(0,0,0,0.4)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] md:h-20 gap-4">

            {/* Left: Logo & Back */}
            <div className={`flex items-center gap-2 relative z-10`}>
              {showBack && (
                <button
                  onClick={onBack || (() => backHref ? router.push(backHref) : router.back())}
                  aria-label="Go back"
                  className="p-2 rounded-xl hover:bg-white/10 active:bg-white/15 text-white/80 hover:text-white transition-all touch-manipulation"
                >
                  <BackIcon className="w-5 h-5" />
                </button>
              )}

              <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
                <div className="relative w-14 h-14 md:w-16 md:h-16 overflow-hidden rounded-xl ring-2 ring-yellow-600/40 shadow-[0_0_16px_rgba(202,138,4,0.3)] transition-transform duration-200 group-hover:scale-105 shrink-0">
                    <Image
                        src="/images/logo.jpg"
                        alt="Logo"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <h1 className="font-black text-base md:text-lg leading-tight text-yellow-600 tracking-tight truncate">
                    {title || <>باقة الغربية <span className="text-yellow-600/50 text-sm">·</span> النادي الرياضي</>}
                </h1>
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
                                        {result.type === 'team' ? <Users className="w-4 h-4" /> : result.type === 'trainee' ? <User className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
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
        <div ref={mobileSearchRef} className="md:hidden absolute top-full left-0 w-full bg-[#080e1f]/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-3 animate-in slide-in-from-top-2 duration-200 z-40" dir="rtl">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                    autoFocus
                    type="text"
                    placeholder="بحث عن فرق، لاعبين، مدربين..."
                    className="w-full bg-white/[0.07] border border-white/10 rounded-2xl pr-10 pl-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            {(loading || results.length > 0 || (query.length > 1 && !loading)) && (
                <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
                    {loading && (
                        <p className="text-center text-xs text-white/30 py-4">{'جاري البحث...'}</p>
                    )}
                    {!loading && query.length > 1 && results.length === 0 && (
                        <p className="text-center text-xs text-white/30 py-4">{'لا توجد نتائج'}</p>
                    )}
                    {results.map((result) => (
                        <Link
                            key={`${result.type}-${result.id}`}
                            href={result.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                            onClick={() => setSearchOpen(false)}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                result.type === 'team' ? 'bg-purple-500/20 text-purple-300' : result.type === 'trainee' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                                {result.type === 'team' ? <Users className="w-4 h-4" /> : result.type === 'trainee' ? <User className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{result.name}</p>
                                {result.subtitle && <p className="text-[10px] text-white/40 truncate" dir="ltr">{result.subtitle}</p>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
       )}
    </header>
  );
}
