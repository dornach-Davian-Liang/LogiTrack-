// ============================================================
// LanguageContext - 全局语言上下文管理
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, getTranslations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 从 localStorage 获取保存的语言，默认为 'zh'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('logitrack_language') as Language | null;
    return saved || 'zh';
  });

  const translations = getTranslations(language);

  // 当语言改变时，保存到 localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('logitrack_language', lang);
  };

  useEffect(() => {
    // 设置 HTML 的 lang 属性
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
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
