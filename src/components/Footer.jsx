import { Facebook, Instagram, Linkedin, Phone, Video, ChevronUp } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { Link } from 'react-router-dom';

const Footer = () => {
    const { t } = useLanguage();

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="bg-black py-16 border-t border-neutral-900 relative">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-24">

                    {/* Left Column: ABOUT US */}
                    <div className="w-full md:w-1/2">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-neutral-800 w-fit">
                            {t('footer', 'about')}
                        </h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-12 max-w-md">
                            {t('footer', 'aboutText')}
                        </p>

                        <div className="flex items-center gap-6">
                            <a href="https://maquillajefxmexico.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="inline-block text-white font-bold text-xs uppercase tracking-widest border-b border-white pb-1 hover:text-neutral-300 hover:border-neutral-300 transition-colors">
                                {t('footer', 'privacy')}
                            </a>
                            <Link 
                                to="/admin" 
                                className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all duration-300 font-['Oswald'] inline-block text-center"
                            >
                                Acceso
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: CONTACT & FOLLOW */}
                    <div className="w-full md:w-1/2 flex flex-col items-start md:items-start">
                        {/* CONTACT US */}
                        <div className="mb-12">
                            <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-neutral-800 w-fit">
                                {t('footer', 'contact')}
                            </h3>
                            <a href="mailto:maquillajefxmexico@gmail.com" className="block text-neutral-400 text-sm mb-2 hover:text-white transition-colors">
                                maquillajefxmexico@gmail.com
                            </a>
                            <p className="text-neutral-400 text-sm">
                                +525533428081
                            </p>
                        </div>

                        {/* FOLLOW US */}
                        <div>
                            <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-neutral-800 w-fit">
                                {t('footer', 'follow')}
                            </h3>
                            <div className="flex space-x-6">
                                <a href="https://www.facebook.com/maquillajefx" target="_blank" rel="noopener noreferrer" className="bg-white text-black p-2 rounded-full hover:bg-neutral-300 transition-colors">
                                    <Facebook size={18} />
                                </a>
                                <a href="https://www.instagram.com/maquillajefx/" target="_blank" rel="noopener noreferrer" className="bg-white text-black p-2 rounded-full hover:bg-neutral-300 transition-colors">
                                    <Instagram size={18} />
                                </a>
                                <a href="https://vimeo.com/mfxmexico" target="_blank" rel="noopener noreferrer" className="bg-white text-black p-2 rounded-full hover:bg-neutral-300 transition-colors">
                                    <Video size={18} />
                                </a>
                                <a href="https://www.linkedin.com/company/mfx-mexico/" target="_blank" rel="noopener noreferrer" className="bg-white text-black p-2 rounded-full hover:bg-neutral-300 transition-colors">
                                    <Linkedin size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll to top button */}
            <button
                onClick={scrollToTop}
                className="absolute bottom-8 right-8 bg-neutral-900 text-white p-3 hover:bg-neutral-800 transition-colors border border-neutral-800"
                aria-label="Scroll to top"
            >
                <ChevronUp size={24} />
            </button>
        </footer>
    );
};

export default Footer;
