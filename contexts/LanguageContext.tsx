import React, { createContext, useContext } from 'react';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: string;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'Українська',
  t: (key) => key,
});

export const useTranslation = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ language: string, children: React.ReactNode }> = ({ language, children }) => {
  const t = (key: string) => {
    return translations[language]?.[key] || translations['Українська'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
