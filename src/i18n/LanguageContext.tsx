'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { en } from './locales/en';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { ko } from './locales/ko';
import { loadLocale, saveLocale } from '@/lib/key-storage';

// Basic types
type Locale = 'en' | 'ko';
type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ko,
};

// 번역을 위한 Deep readonly 타입
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// 번역 문자열의 파라미터를 교체하는 헬퍼
export function withParams(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] || `{${key}}`);
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: DeepReadonly<Dictionary>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ko');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const initLocale = async () => {
      const storedLocale = (await loadLocale()) as Locale;
      if (storedLocale && (storedLocale === 'en' || storedLocale === 'ko')) {
        setLocale(storedLocale);
      } else {
        // 선호도가 없다면 브라우저 언어 확인
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'en') {
          setLocale('en');
        }
      }
      setIsMounted(true);
    };
    initLocale();
  }, []);

  const changeLocale = async (newLocale: Locale) => {
    setLocale(newLocale);
    await saveLocale(newLocale);
  };

  const t = dictionaries[locale] as DeepReadonly<Dictionary>;

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
