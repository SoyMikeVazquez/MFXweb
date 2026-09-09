import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Search, Globe, Video, Menu, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Navbar = () => {
    const { language, toggleLanguage, t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    const navItems = [
        { key: 'HOME', hash: 'inicio' },
        { key: 'PORTFOLIO', hash: 'portafolio' },
        { key: 'SERVICES', hash: 'services' },
        { key: 'CONTACT', hash: 'contact' }
    ];

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <div className="bg-black border-y border-neutral-900 sticky top-0 z-50 shadow-2xl shadow-black/50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex space-x-6 md:space-x-10">
                        {navItems.map((item) => {
                            if (item.key === 'PORTFOLIO') {
                                return (
                                    <Link
                                        key={item.key}
                                        to="/portfolio"
                                        className="text-xs font-bold text-neutral-500 hover:text-red-600 transition-colors tracking-[0.25em] uppercase"
                                    >
                                        {t('nav', item.key)}
                                    </Link>
                                );
                            }
                            return (
                                <a
                                    key={item.key}
                                    href={isHomePage ? `#${item.hash}` : `/#${item.hash}`}
                                    className="text-xs font-bold text-neutral-500 hover:text-red-600 transition-colors tracking-[0.25em] uppercase"
                                >
                                    {t('nav', item.key)}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Logo/Brand text for mobile only */}
                    <div className="md:hidden text-white font-black tracking-widest text-lg">
                        MFX
                    </div>

                    {/* Desktop Social / Search / Lang */}
                    <div className="hidden md:flex items-center space-x-6 text-neutral-600">
                        <div className="flex space-x-4 border-r border-neutral-800 pr-6">
                            <a href="https://www.facebook.com/maquillajefx" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Facebook size={14} />
                            </a>
                            <a href="https://www.instagram.com/maquillajefx/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Instagram size={14} />
                            </a>
                            <a href="https://vimeo.com/mfxmexico" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Video size={14} />
                            </a>
                            <a href="https://www.linkedin.com/company/mfx-mexico/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Linkedin size={14} />
                            </a>
                        </div>
                        <Search size={16} className="hover:text-red-600 cursor-pointer transition-colors" />

                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors border-l border-neutral-800 pl-6"
                        >
                            <Globe size={14} />
                            {language === 'en' ? 'EN' : 'ES'}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
                        >
                            <Globe size={18} />
                            {language === 'en' ? 'EN' : 'ES'}
                        </button>
                        <button
                            className="text-white hover:text-red-600 transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}>
                {/* Blurred Background */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={closeMenu}></div>

                {/* Menu Content */}
                <div className={`absolute right-0 top-16 bottom-0 w-full max-w-sm bg-neutral-900/50 border-l border-neutral-800 p-8 flex flex-col transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}>

                    <nav className="flex flex-col space-y-8 mt-8">
                        {navItems.map((item) => {
                            if (item.key === 'PORTFOLIO') {
                                return (
                                    <Link
                                        key={item.key}
                                        to="/portfolio"
                                        onClick={closeMenu}
                                        className="text-xl font-bold text-neutral-300 hover:text-red-600 transition-colors tracking-[0.25em] uppercase border-b border-neutral-800 pb-4"
                                    >
                                        {t('nav', item.key)}
                                    </Link>
                                );
                            }
                            return (
                                <a
                                    key={item.key}
                                    href={isHomePage ? `#${item.hash}` : `/#${item.hash}`}
                                    onClick={closeMenu}
                                    className="text-xl font-bold text-neutral-300 hover:text-red-600 transition-colors tracking-[0.25em] uppercase border-b border-neutral-800 pb-4"
                                >
                                    {t('nav', item.key)}
                                </a>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-8 flex items-center justify-between border-t border-neutral-800">
                        <div className="flex space-x-6 text-neutral-400">
                            <a href="https://www.facebook.com/maquillajefx" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="https://www.instagram.com/maquillajefx/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="https://vimeo.com/mfxmexico" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Video size={20} />
                            </a>
                            <a href="https://www.linkedin.com/company/mfx-mexico/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
