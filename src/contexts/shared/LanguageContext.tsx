import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import {
  SupportedLanguage,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  posTranslations,
} from '../../utils/posTranslations';
import { onboardingTranslations } from '../../utils/onboardingTranslations';
import { universalTranslations } from '../../utils/universalTranslations';

export interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isRtl: boolean;
  dir: 'rtl' | 'ltr';
  activeLangConfig: LanguageInfo;
  supportedLanguages: LanguageInfo[];
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const APP_LANG_STORAGE_KEY = 'app_language';
export const POS_LANG_STORAGE_KEY = 'pos_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    try {
      // 1. Primary universal app language
      const savedApp = localStorage.getItem(APP_LANG_STORAGE_KEY) as SupportedLanguage;
      if (savedApp && SUPPORTED_LANGUAGES.some((l) => l.code === savedApp)) {
        return savedApp;
      }
      // 2. Backward compatibility with POS & onboarding language key
      const savedPos = localStorage.getItem(POS_LANG_STORAGE_KEY) as SupportedLanguage;
      if (savedPos && SUPPORTED_LANGUAGES.some((l) => l.code === savedPos)) {
        return savedPos;
      }
    } catch {
      // Ignore localStorage errors
    }
    // Default system language is Arabic (🇸🇦)
    return 'ar';
  });

  const activeLangConfig = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [currentLanguage]);

  const isRtl = activeLangConfig.dir === 'rtl';
  const dir: 'rtl' | 'ltr' = activeLangConfig.dir;

  // Apply document language and direction universally
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = dir;
      document.body.setAttribute('dir', dir);
      if (isRtl) {
        document.body.classList.add('rtl-layout');
        document.body.classList.remove('ltr-layout');
      } else {
        document.body.classList.add('ltr-layout');
        document.body.classList.remove('rtl-layout');
      }
    }
  }, [currentLanguage, dir, isRtl]);

  // Synchronize across multiple browser tabs & custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === APP_LANG_STORAGE_KEY || e.key === POS_LANG_STORAGE_KEY) && e.newValue) {
        const newLang = e.newValue as SupportedLanguage;
        if (SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) {
          setCurrentLanguageState(newLang);
        }
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail && SUPPORTED_LANGUAGES.some((l) => l.code === customEvent.detail)) {
        setCurrentLanguageState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app_language_changed', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app_language_changed', handleCustomChange);
    };
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) return;
    setCurrentLanguageState(lang);
    try {
      localStorage.setItem(APP_LANG_STORAGE_KEY, lang);
      localStorage.setItem(POS_LANG_STORAGE_KEY, lang);
      window.dispatchEvent(new CustomEvent('app_language_changed', { detail: lang }));
    } catch (e) {
      console.warn('Failed to persist language change:', e);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      // 1. Universal translation dictionary
      const universalVal = universalTranslations[currentLanguage]?.[key];
      if (universalVal) return universalVal;

      // 2. POS translation dictionary
      const posVal = posTranslations[currentLanguage]?.[key];
      if (posVal) return posVal;

      // 3. Onboarding translation dictionary
      const onboardingVal = onboardingTranslations[currentLanguage]?.[key];
      if (onboardingVal) return onboardingVal;

      // 4. Fallback to English universal / POS / onboarding
      const enUniversal = universalTranslations.en?.[key];
      if (enUniversal) return enUniversal;

      const enPos = posTranslations.en?.[key];
      if (enPos) return enPos;

      const enOnboarding = onboardingTranslations.en?.[key];
      if (enOnboarding) return enOnboarding;

      // 5. Provided fallback or key itself
      return fallback !== undefined ? fallback : key;
    },
    [currentLanguage]
  );

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        isRtl,
        dir,
        activeLangConfig,
        supportedLanguages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
