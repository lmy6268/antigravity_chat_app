'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './locales/en';
import { ko } from './locales/ko';

type Locale = 'en' | 'ko';
type Dictionary = typeof en;

// Nested key access helper type
type Path<T> = T extends object ? { [K in keyof T]: K extends string ? `${K}` | `${K}.${Path<T[K]>}` : never }[keyof T] : never;

const dictionaries: Record<Locale, Dictionary> = {
    en,
    ko,
};

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en');

    useEffect(() => {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'ko') {
            setLocale('ko');
        }

        // Check local storage
        const storedLocale = localStorage.getItem('app_locale') as Locale;
        if (storedLocale && (storedLocale === 'en' || storedLocale === 'ko')) {
            setLocale(storedLocale);
        }
    }, []);

    const changeLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('app_locale', newLocale);
    };

    const t = (key: string, params?: Record<string, string>): string => {
        const keys = key.split('.');
        let value: any = dictionaries[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                return key; // Fallback to key if not found
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // Replace params like {name}
        if (params) {
            return value.replace(/{(\w+)}/g, (_, k) => params[k] || `{${k}}`);
        }

        return value;
    };

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
