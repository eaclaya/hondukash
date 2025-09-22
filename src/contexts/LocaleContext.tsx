'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import esMessages from '../../messages/es.json';
import enMessages from '../../messages/en.json';
import { useStore } from './StoreContext';

type Locale = 'es' | 'en';
type Messages = typeof esMessages;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: (key: string, section?: string) => string;
  updateStoreLanguage: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const messagesMap = {
  es: esMessages,
  en: enMessages,
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');
  const { currentStore, refreshCurrentStore } = useStore();

  // Load locale from store settings or localStorage on mount
  useEffect(() => {
    // Priority: 1. Current store language, 2. localStorage, 3. default 'es'
    if (currentStore?.language && (currentStore.language === 'es' || currentStore.language === 'en')) {
      setLocale(currentStore.language as Locale);
    } else {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && (savedLocale === 'es' || savedLocale === 'en')) {
        setLocale(savedLocale);
      }
    }
  }, [currentStore]);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  // Function to update store language setting
  const updateStoreLanguage = async (newLocale: Locale) => {
    if (!currentStore) return;

    try {
      const response = await fetch(`/api/stores/${currentStore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentStore,
          language: newLocale
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update store language');
      }

      // Refresh the store data to get the updated language
      await refreshCurrentStore();
      
      setLocale(newLocale);
    } catch (error) {
      console.error('Error updating store language:', error);
      // Still update locally even if server update fails
      setLocale(newLocale);
    }
  };

  const messages = messagesMap[locale];

  const t = (key: string, section?: string) => {
    try {
      if (section) {
        const sectionMessages = (messages as any)[section];
        return sectionMessages?.[key] || key;
      }
      
      // Try to find the key in any section
      for (const sectionKey of Object.keys(messages)) {
        const sectionMessages = (messages as any)[sectionKey];
        if (sectionMessages && typeof sectionMessages === 'object' && sectionMessages[key]) {
          return sectionMessages[key];
        }
      }
      
      return key;
    } catch {
      return key;
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages, t, updateStoreLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Hook for specific section translations
export function useTranslations(section: string) {
  const { t } = useLocale();
  return (key: string) => t(key, section);
}