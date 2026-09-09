import { createContext, useState, useContext } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'es' : 'en');
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
