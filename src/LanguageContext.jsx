import { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    // Try to get saved language from localStorage, otherwise default to 'en'
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('language');
        return saved ? saved : 'en';
    });

    const setLanguage = (newLanguage) => {
        setLanguageState(newLanguage);
        localStorage.setItem('language', newLanguage);
        document.documentElement.lang = newLanguage;
    };

    // Effect to set the initial lang attribute on mount
    useEffect(() => {
        document.documentElement.lang = language;
    }, []);

    const toggleLanguage = () => {
        const nextLang = language === 'en' ? 'es' : 'en';
        setLanguage(nextLang);
    };

    const t = (section, key) => {
        if (!translations[language] || !translations[language][section]) {
            return key;
        }
        return translations[language][section][key] || key;
    };

    const getArray = (section, key) => {
        if (!translations[language] || !translations[language][section]) {
            return [];
        }
        return translations[language][section][key] || [];
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, getArray }}>
            {children}
        </LanguageContext.Provider>
    );
};
