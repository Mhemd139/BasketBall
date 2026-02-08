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
  onBack?: () => void;
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

export function Header({ locale, title, showBack, backHref, onBack }: HeaderProps) {
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
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

    // Debounce: clear previous timer, set new one
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
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
    }, 300);
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
    <header className="sticky top-0 z-50 w-full glass-header transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            
            {/* Left: Logo & Back */}
            <div className={`flex items-center gap-3 relative z-10 ${showBack ? 'pl-2' : ''}`}>
              {showBack && (
                <button 
                  onClick={onBack || (() => backHref ? router.push(backHref) : router.back())}
                  className="p-2 -ml-2 rounded-full hover:bg-navy-50 text-navy-600 transition-colors"
                >
                  <BackIcon className="w-6 h-6" />
                </button>
              )}
              
              <Link href={`/${locale}`} className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform duration-300">
                    <span className="text-2xl md:text-3xl filter drop-shadow-sm">🏀</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="font-outfit font-bold text-xl md:text-2xl leading-none text-navy-900 tracking-tight">
                        {title || (locale === 'ar' ? 'الباقة الغربية' : locale === 'he' ? 'באקה אל-גרביה' : 'Baqa El-Gharbia')}
                    </h1>
                    <p className="text-[10px] md:text-xs text-gold-600 font-bold tracking-wider uppercase opacity-90">
                        {locale === 'ar' ? 'النادي الرياضي' : locale === 'he' ? 'מועדון ספורט' : 'Sports Club'}
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
                            placeholder={locale === 'ar' ? 'بحث...' : locale === 'he' ? 'חיפוש...' : 'Search...'}
                            className="bg-transparent border-none outline-none text-sm text-navy-800 placeholder-navy-300 w-full"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => setSearchOpen(true)}
                        />
                    </div>
                     {/* Search Results Dropdown */}
                     {searchOpen && (query.length > 1 || results.length > 0) && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                            {loading && <div className="p-4 text-center text-xs text-gray-400">Loading...</div>}
                            {!loading && results.length === 0 && query.length > 1 && (
                                <div className="p-4 text-center text-xs text-gray-400">No results found</div>
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
                                        {result.type === 'trainee' ? 'P' : 'C'}
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

                {/* Language Switcher */}
                <div className="relative" ref={langRef}>
                    <button 
                        onClick={() => setLangOpen(!langOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm ${
                            langOpen 
                            ? 'bg-navy-50 border-navy-200 text-navy-800' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gold-300 hover:text-navy-700'
                        }`}
                    >
                        <Globe className="w-4 h-4 text-gold-500" />
                        <span className="uppercase font-medium">{locale}</span>
                    </button>
                    
                    {langOpen && (
                        <div className="absolute top-full end-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => switchLanguage(lang.code)}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-navy-50 transition-colors ${
                                        locale === lang.code ? 'text-gold-600 font-bold bg-navy-50/50' : 'text-gray-600'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </span>
                                    {locale === lang.code && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
                 <button 
                    onClick={() => setSearchOpen(!searchOpen)}
                    className={`p-2 rounded-full transition-colors ${
                        searchOpen ? 'bg-navy-100 text-navy-700' : 'hover:bg-gray-100 text-gray-600'
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
                    placeholder="Search players, coaches..."
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
                            {result.type === 'trainee' ? 'P' : 'C'}
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
