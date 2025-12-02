'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './locales/en';
import { ko } from './locales/ko';

type Locale = 'en' | 'ko';
type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
    en,
    ko,
};

// Deep readonly type for translations
type DeepReadonly<T> = T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// Helper to replace parameters in translation strings
export function withParams(template: string, params: Record<string, string>): string {
    return template.replace(/{(\w+)}/g, (_, key) => params[key] || `{${key}}`);
}

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: DeepReadonly<Dictionary>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>('ko');

    useEffect(() => {
        // Check local storage first
        const storedLocale = localStorage.getItem('app_locale') as Locale;
        if (storedLocale && (storedLocale === 'en' || storedLocale === 'ko')) {
            setLocale(storedLocale);
        } else {
            // If no preference, check browser language
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'en') {
                setLocale('en');
            }
        }
    }, []);

    const changeLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('app_locale', newLocale);
    };

    const t = dictionaries[locale] as DeepReadonly<Dictionary>;

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
