'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, User, Users, Globe, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  locale: string;
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'trainee' | 'trainer';
  subtitle?: string;
  href: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇵🇸', dir: 'rtl' },
  { code: 'he', label: 'עברית', flag: '🇮🇱', dir: 'rtl' },
];

export function Header({ locale, title, showBack, backHref }: HeaderProps) {
  const isRTL = locale === 'ar' || locale === 'he';
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const nameField = locale === 'ar' ? 'name_ar' : locale === 'he' ? 'name_he' : 'name_en';

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

    setLoading(true);
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
          name: t[nameField] || t.name_en,
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
          name: t[nameField] || t.name_en,
          type: 'trainer',
          subtitle: t.phone || undefined,
          href: `/${locale}/trainers`,
        });
      }
    }

    setResults(mapped);
    setLoading(false);
  }, [locale, nameField]);

  // Close on Escape or click outside
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
          setSearchOpen(false);
          setLangOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const switchLanguage = (newLocale: string) => {
    if (!pathname) return;
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setLangOpen(false);
  };

  return (
    <header className="header" suppressHydrationWarning>
      <div className="flex items-center justify-between w-full max-w-screen-xl mx-auto gap-3">
        {/* Left side: Back button or Logo */}
        {showBack && backHref ? (
          <Link
            href={backHref}
            className="w-10 h-10 rounded-2xl bg-white/50 hover:bg-white border border-gray-100 flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg hover:shadow-gray-200/50 shrink-0 backdrop-blur-sm group"
          >
            <BackIcon className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
          </Link>
        ) : (
          <Link href={`/${locale}`} className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 0 0 20"/>
              </svg>
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-900 hidden sm:block">
              Basketball Manager
            </span>
          </Link>
        )}

        {/* Center: Title */}
        {title && (
          <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2 truncate max-w-[30%] sm:max-w-[40%] pointer-events-none tracking-tight">
            {title}
          </h1>
        )}

        {/* Right: Search & Language */}
        <div className="flex items-center gap-3 shrink-0">
            
            {/* Language Switcher - Premium Redesign */}
            <div ref={langRef} className="relative z-50">
                <button
                    onClick={() => setLangOpen(!langOpen)}
                    className={`
                        h-10 px-3 rounded-2xl flex items-center gap-2 transition-all duration-300 border
                        ${langOpen 
                            ? 'bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100 scale-105' 
                            : 'bg-white/60 hover:bg-white border-transparent hover:border-gray-100 hover:shadow-lg hover:shadow-gray-200/50'
                        }
                    `}
                >
                    <span className="text-xl leading-none filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-110">
                        {LANGUAGES.find(l => l.code === locale)?.flag}
                    </span>
                    <span className={`text-sm font-semibold hidden md:block transition-colors ${langOpen ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {locale.toUpperCase()}
                    </span>
                    <Globe className={`w-3.5 h-3.5 transition-colors ${langOpen ? 'text-indigo-400' : 'text-gray-400'}`} />
                </button>

                {/* Animated Dropdown */}
                <div 
                    className={`
                        absolute top-full right-0 mt-3 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-white/20 ring-1 ring-black/5
                        transform transition-all duration-300 origin-top-right
                        ${langOpen 
                            ? 'opacity-100 translate-y-0 scale-100' 
                            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                        }
                    `}
                >
                    <div className="space-y-1">
                        {LANGUAGES.map((lang) => {
                            const isActive = locale === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => switchLanguage(lang.code)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group
                                        ${isActive 
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl filter drop-shadow-sm">{lang.flag}</span>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold">{lang.label}</span>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <Check className="w-3 h-3" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Search Widget - Polished */}
            <div ref={searchRef} className="relative z-40">
            <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`
                flex items-center gap-2 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden h-10 border-2
                ${searchOpen
                    ? 'w-56 sm:w-72 bg-white border-blue-600 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] px-3 ring-2 ring-yellow-400/50'
                    : 'w-10 bg-white/60 hover:bg-white border-transparent hover:border-blue-100 px-0 justify-center hover:shadow-lg hover:shadow-blue-200/50'
                }
                `}
            >
                <Search className={`shrink-0 transition-colors duration-300 ${searchOpen ? 'w-4 h-4 text-blue-600' : 'w-4 h-4 text-gray-500'}`} />
                
                 {/* Input overlaid */}
                {searchOpen && (
                    <div className="flex-1 flex items-center gap-2 min-w-0 animate-in fade-in zoom-in-95 duration-300">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={
                            locale === 'ar' ? 'بحث عن لاعب/مدرب...'
                            : locale === 'he' ? 'חיפוש שחקן/מאמן...'
                            : 'Search player/coach...'
                            }
                            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 text-blue-900 min-w-0 border-none ring-0 shadow-none focus:ring-0 focus:border-none focus:outline-none"
                            style={{ outline: 'none', boxShadow: 'none' }}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                        {query && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setQuery(''); setResults([]); inputRef.current?.focus(); }}
                                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 text-gray-500 hover:text-gray-700"
                            >
                                <span className="text-xs font-bold leading-none">&times;</span>
                            </button>
                        )}
                    </div>
                )}
            </button>

            {/* Dropdown results */}
            {searchOpen && (query.length >= 2 || loading) && (
                <div className="absolute top-full right-0 mt-3 w-72 sm:w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 p-1">
                {loading && (
                    <div className="px-4 py-6 flex flex-col items-center justify-center gap-3 text-gray-400">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                    <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                        {locale === 'ar' ? 'لا توجد نتائج' : locale === 'he' ? 'אין תוצאות' : 'No results found'}
                    </p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {results.map((result) => (
                        <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => {
                            setSearchOpen(false);
                            router.push(result.href);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50/80 transition-all text-left group border border-transparent hover:border-indigo-100 mb-1 last:mb-0"
                        dir={isRTL ? 'rtl' : 'ltr'}
                        >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm ${
                            result.type === 'trainer'
                            ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600'
                            : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'
                        }`}>
                            {result.type === 'trainer'
                            ? <User className="w-5 h-5" />
                            : <Users className="w-5 h-5" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
                            {result.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                                    result.type === 'trainer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {result.type === 'trainer'
                                    ? (locale === 'ar' ? 'مدرب' : locale === 'he' ? 'מאמן' : 'Trainer')
                                    : (locale === 'ar' ? 'لاعب' : locale === 'he' ? 'שחקן' : 'Player')
                                }
                                </span>
                                {result.subtitle && <span className="text-xs text-gray-400" dir="ltr">{result.subtitle}</span>}
                            </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 ${isRTL ? 'rotate-180' : ''}`} />
                        </button>
                    ))}
                    </div>
                )}
                </div>
            )}
            </div>
        </div>
      </div>
    </header>
  );
}
