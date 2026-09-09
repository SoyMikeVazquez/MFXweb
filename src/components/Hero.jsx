import { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import logoImg from '../assets/mfx.png';

// Import backgrounds for Desktop
import desk1 from '../assets/FotosDelFondo/1.jpg';
import desk2 from '../assets/FotosDelFondo/2.jpg';
import desk3 from '../assets/FotosDelFondo/3.jpg';
import desk4 from '../assets/FotosDelFondo/4.jpg';
import desk5 from '../assets/FotosDelFondo/5.jpg';

// Import backgrounds for Mobile
import mob1 from '../assets/FotosDelFondoMobile/1.jpg';
import mob2 from '../assets/FotosDelFondoMobile/2.jpg';
import mob3 from '../assets/FotosDelFondoMobile/3.jpg';
import mob4 from '../assets/FotosDelFondoMobile/4.jpg';
import mob5 from '../assets/FotosDelFondoMobile/5.jpg';

const Hero = () => {
    const { t } = useLanguage();

    const backgrounds = [
        { desktop: desk1, mobile: mob1 },
        { desktop: desk2, mobile: mob2 },
        { desktop: desk3, mobile: mob3 },
        { desktop: desk4, mobile: mob4 },
        { desktop: desk5, mobile: mob5 },
    ];

    const [currentBg, setCurrentBg] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBg((prev) => (prev + 1) % backgrounds.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(interval);
    }, [backgrounds.length]);

    return (
        <section id="inicio" className="relative min-h-screen flex items-center bg-black overflow-hidden">
            {/* Background Images with Fade Effect */}
            <div className="absolute inset-0 z-0">
                {backgrounds.map((bg, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-2000 ease-in-out ${index === currentBg ? 'opacity-80' : 'opacity-0'
                            }`}
                    >
                        <picture>
                            <source media="(min-width: 768px)" srcSet={bg.desktop} />
                            <img
                                src={bg.mobile}
                                alt={`Background ${index + 1}`}
                                className="w-full h-full object-cover object-top"
                            />
                        </picture>
                    </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 flex flex-col justify-center h-full pt-20">

                <div className="max-w-3xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[1px] w-12 bg-neutral-500"></div>
                        <span className="text-neutral-400 tracking-[0.3em] text-sm uppercase font-light">
                            {t('hero', 'subtitle')}
                        </span>
                    </div>

                    {/* Logo Replacement */}
                    <div className="mb-12">
                        <img
                            src={logoImg}
                            alt="MFX Studios Logo"
                            className="w-full max-w-md object-contain opacity-90"
                        />
                    </div>

                    <p className="text-neutral-400 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-12 border-l border-neutral-800 pl-6">
                        {t('hero', 'description')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <a
                            href="#portfolio"
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('reset-portfolio-tab'));
                            }}
                            className="px-8 py-4 bg-white text-black text-xs font-bold uppercase text-center tracking-[0.2em] hover:bg-neutral-200 transition-colors"
                        >
                            {t('hero', 'viewProjects')}
                        </a>
                        <a
                            href="tel:+525533428081"
                            className="px-8 py-4 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase text-center tracking-[0.2em] hover:border-white hover:text-white transition-colors"
                        >
                            {t('hero', 'contact')}
                        </a>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500">{t('hero', 'scroll')}</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-500 to-transparent"></div>
            </div>
        </section>
    );
};

export default Hero;

