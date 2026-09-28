import { useState } from 'react';
import { ArrowRight, ChevronRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

// Import images for specific services
import imgBeautyMakeup from '../assets/Servicios/beauty-makeup.png';
import imgHairPieces from '../assets/Servicios/hair-pieces.jpg';
import imgCharacterMakeup from '../assets/Servicios/character-makeup.jpg';
import imgProstheticMakeup from '../assets/Servicios/prosthetic-makeup.jpg';
import imgAnimatronics from '../assets/Servicios/animatronics.jpg';
import imgRealisticDummies from '../assets/Servicios/realistic-dummies.jpg';
import imgPuppets from '../assets/Servicios/puppets.jpg';
import imgSpecialWardrobe from '../assets/Servicios/special-wardrobe.jpg';
import imgHireDummies from '../assets/Servicios/hire-dummies.jpg';
import imgEducationalWorkshops from '../assets/Servicios/educational-workshops.jpg';
import imgStore from '../assets/Servicios/store.jpg';

const Services = () => {
    const { t, getArray } = useLanguage();
    const serviceTexts = getArray('services', 'items');
    const [activeIndex, setActiveIndex] = useState(0);
    const [mobileOpenIndex, setMobileOpenIndex] = useState(0);

    const imageArray = [
        imgBeautyMakeup,          // 01: Beauty Makeup
        imgHairPieces,            // 02: Hair / Hair Pieces
        imgCharacterMakeup,       // 03: Character Makeup
        imgProstheticMakeup,      // 04: Prosthetic Makeup
        imgAnimatronics,          // 05: Animatronics
        imgRealisticDummies,      // 06: Realistic Dummies
        imgPuppets,               // 07: Puppets
        imgSpecialWardrobe,       // 08: Special wardrobe
        imgHireDummies,           // 09: Hire Dummies
        imgEducationalWorkshops,  // 10: Educational workshops
        imgStore                  // 11: Store
    ];

    const services = serviceTexts.map((text, index) => ({
        ...text,
        image: imageArray[index % imageArray.length]
    }));

    const activeService = services[activeIndex] || services[0];

    const toggleMobileService = (index) => {
        setMobileOpenIndex(prev => (prev === index ? null : index));
    };

    return (
        <section id="services" className="py-20 lg:py-24 bg-[#080808] text-white border-t border-neutral-900 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-1/4 -left-40 w-96 h-96 bg-red-950/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 lg:mb-14 border-b border-red-900/30 pb-8">
                    <div>
                        <span className="text-red-700 font-bold tracking-[0.3em] uppercase text-xs mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                            {t('services', 'MFX WORKSHOP')}
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight">
                            {t('services', 'title')}
                        </h2>
                    </div>
                </div>

                {/* ── MOBILE / SMARTPHONE VIEW (< lg) ────────────────────────── */}
                {/* Expandable list with manual icon toggle */}
                <div className="block lg:hidden space-y-3">
                    {services.map((service, index) => {
                        const isOpen = mobileOpenIndex === index;
                        const formattedIndex = String(index + 1).padStart(2, '0');

                        return (
                            <div
                                key={index}
                                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                                    isOpen
                                        ? 'border-red-900/80 bg-neutral-900/90 shadow-xl'
                                        : 'border-neutral-800/80 bg-neutral-950/60'
                                }`}
                            >
                                {/* Row Header with title and icon */}
                                <button
                                    type="button"
                                    onClick={() => toggleMobileService(index)}
                                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors cursor-pointer"
                                    aria-expanded={isOpen}
                                >
                                    <div className="flex items-center gap-3.5 pr-2">
                                        <span className={`text-xs font-mono tracking-wider transition-colors ${
                                            isOpen ? 'text-red-500 font-bold' : 'text-neutral-500'
                                        }`}>
                                            {formattedIndex}
                                        </span>
                                        <h3 className={`text-sm sm:text-base font-bold uppercase tracking-wider transition-colors ${
                                            isOpen ? 'text-white' : 'text-neutral-300'
                                        }`}>
                                            {service.title}
                                        </h3>
                                    </div>

                                    {/* Action Toggle Icon */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                        isOpen
                                            ? 'bg-red-600/20 border-red-500 text-red-400 rotate-180'
                                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                                    }`}>
                                        <ChevronDown size={16} />
                                    </div>
                                </button>

                                {/* Collapsible Content: Photo, Description, Quote Button */}
                                {isOpen && (
                                    <div className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 border-t border-neutral-800/70">
                                        {/* Photo */}
                                        <div className="relative h-[220px] sm:h-[260px] w-full rounded-lg overflow-hidden border border-neutral-800 mb-4 shadow-md">
                                            <img
                                                src={service.image}
                                                alt={service.title}
                                                className="w-full h-full object-cover object-center"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-light font-serif mb-5">
                                            {service.desc}
                                        </p>

                                        {/* Quote Button & Availability Note */}
                                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                            <a
                                                href="#contact"
                                                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-950/80 hover:bg-red-900 border border-red-800 text-white text-xs uppercase font-bold tracking-widest rounded transition-all duration-300 shadow-md"
                                            >
                                                <span>{t('services', 'quoteBtn')}</span>
                                                <ArrowRight size={14} />
                                            </a>

                                            {(service.title === 'Educational workshops' ||
                                                service.title === 'Store' ||
                                                service.title === 'Talleres educativos' ||
                                                service.title === 'Tienda') && (
                                                    <span className="text-xs text-neutral-400 italic text-center sm:text-left">
                                                        {t('services', 'availabilityNote')}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── DESKTOP VIEW (lg+) ──────────────────────────────────────── */}
                {/* Two-Column Layout with Hover on PC */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* Column 1: Services List */}
                    <div className="lg:col-span-5 xl:col-span-5 flex flex-col divide-y divide-neutral-800/60 border border-neutral-800/80 bg-neutral-950/50 rounded-xl overflow-hidden backdrop-blur-sm">
                        {services.map((service, index) => {
                            const isActive = activeIndex === index;
                            const formattedIndex = String(index + 1).padStart(2, '0');

                            return (
                                <div
                                    key={index}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => setActiveIndex(index)}
                                    className={`group relative p-4 sm:p-5 transition-all duration-300 cursor-pointer flex items-center justify-between border-l-4 ${isActive
                                        ? 'bg-gradient-to-r from-red-950/40 via-red-950/15 to-transparent border-red-600 pl-6'
                                        : 'border-transparent hover:border-red-900/60 hover:bg-neutral-900/40 hover:pl-6'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-mono tracking-wider transition-colors duration-300 ${isActive ? 'text-red-500 font-bold' : 'text-neutral-600 group-hover:text-neutral-400'
                                            }`}>
                                            {formattedIndex}
                                        </span>
                                        <h3 className={`text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-300 ${isActive
                                            ? 'text-white translate-x-1'
                                            : 'text-neutral-400 group-hover:text-neutral-100'
                                            }`}>
                                            {service.title}
                                        </h3>
                                    </div>

                                    <div className={`transition-all duration-300 flex items-center ${isActive
                                        ? 'opacity-100 translate-x-0 text-red-500'
                                        : 'opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 text-neutral-500'
                                        }`}>
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Column 2: Photo and Description Showcase (Sticky on PC) */}
                    <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-28">
                        <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-sm">

                            {/* Service Image Display */}
                            <div className="relative h-[260px] sm:h-[340px] md:h-[380px] w-full rounded-xl overflow-hidden border border-neutral-800 group shadow-inner">
                                <img
                                    key={activeService.image}
                                    src={activeService.image}
                                    alt={activeService.title}
                                    className="w-full h-full object-cover object-center transition-all duration-700 ease-out transform scale-100 group-hover:scale-105"
                                />
                                {/* Atmospheric gradients */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                                <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none"></div>
                            </div>

                            {/* Service Details: Title & Description */}
                            <div className="mt-6">
                                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-3 flex items-center gap-3">
                                    <span>{activeService.title}</span>
                                </h3>

                                <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-light font-serif">
                                    {activeService.desc}
                                </p>

                                {/* Action Buttons */}
                                <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
                                    <a
                                        href="#contact"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-white text-xs uppercase font-bold tracking-widest rounded transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                    >
                                        <span>{t('services', 'quoteBtn')}</span>
                                        <ArrowRight size={14} />
                                    </a>

                                    {(activeService.title === 'Educational workshops' ||
                                        activeService.title === 'Store' ||
                                        activeService.title === 'Talleres educativos' ||
                                        activeService.title === 'Tienda') && (
                                            <span className="text-xs text-neutral-400 italic">
                                                {t('services', 'availabilityNote')}
                                            </span>
                                        )}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Services;
