import { useState, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import anaImg from '../assets/FotosSocios/AnaMaquillajeFX.jpg';
import robImg from '../assets/FotosSocios/RobOrtizFX2.jpg';

const About = () => {
    const { t, getArray } = useLanguage();
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    // Iniciar de forma aleatoria qué carta va al frente (0 o 1)
    const [frontCardIndex, setFrontCardIndex] = useState(() => Math.random() > 0.5 ? 0 : 1);

    // Cambiar las cartas constantemente
    useEffect(() => {
        const interval = setInterval(() => {
            setFrontCardIndex((prev) => (prev === 0 ? 1 : 0));
        }, 4000); // Cambia cada 4 segundos
        return () => clearInterval(interval);
    }, []);

    const cards = [
        {
            id: 0,
            image: anaImg
        },
        {
            id: 1,
            image: robImg
        }
    ];

    const currentText = getArray('about', 'text');

    return (
        <section id="about" className="py-24 bg-[#050505] text-white relative border-b border-neutral-900">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-20 items-center">

                    {/* Left Side: Cards Container */}
                    <div className="w-full md:w-5/12 relative flex h-[320px] md:h-[440px] items-center justify-center mb-12 md:mb-0">
                        <div className="relative w-full max-w-[280px] md:max-w-[340px] aspect-[3/4]">
                            {cards.map((card) => {
                                const isFront = frontCardIndex === card.id;
                                return (
                                    <div
                                        key={card.id}
                                        className={`absolute inset-0 bg-neutral-900 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] border border-neutral-800 group overflow-hidden
                                            ${isFront
                                                ? 'translate-x-6 rotate-[4deg] z-20 scale-100 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
                                                : '-translate-x-6 -rotate-[6deg] z-10 scale-95 opacity-70'}
                                        `}
                                    >
                                        {/* Image Area */}
                                        <div className="w-full h-full">
                                            <img
                                                src={card.image}
                                                alt={`MFX Crew Member ${card.id + 1}`}
                                                className={`w-full h-full object-cover transition-all duration-700 pointer-events-none ${card.id === 1 ? 'grayscale' : ''}`}
                                            />
                                            <div className="absolute inset-0 bg-neutral-900/10 pointer-events-none"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side: Content */}
                    <div className="w-full md:w-7/12">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-8 h-[1px] bg-red-900"></span>
                            <span className="text-neutral-500 tracking-[0.2em] uppercase text-xs">
                                {t('about', 'studio')}
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-light mb-10 text-white uppercase leading-tight tracking-tight">
                            {t('about', 'titleLight')} <span className="font-bold">{t('about', 'titleBold')}</span>
                        </h2>

                        <div className="relative group">
                            <div className={`bg-neutral-900/50 border-l-2 border-red-900 h-[360px] relative transition-all duration-500 ${isAutoScroll ? 'overflow-hidden' : 'overflow-y-scroll custom-scrollbar'}`}>
                                <div className={`p-8 ${isAutoScroll ? 'animate-vertical-scroll' : ''}`}>
                                    {/* First set of text */}
                                    {currentText.map((paragraph, index) => (
                                        <p key={`first-${index}`} className="text-neutral-300 text-lg leading-relaxed mb-8 italic font-light">
                                            {paragraph}
                                        </p>
                                    ))}
                                    {/* Duplicated set for seamless loop - only show when auto-scrolling */}
                                    {isAutoScroll && currentText.map((paragraph, index) => (
                                        <p key={`second-${index}`} className="text-neutral-300 text-lg leading-relaxed mb-8 italic font-light">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                {/* Gradient overlays - hidden during manual scroll for better visibility */}
                                {isAutoScroll && (
                                    <>
                                        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-neutral-900 to-transparent pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none"></div>
                                    </>
                                )}
                            </div>

                            {/* Control Button */}
                            <button
                                onClick={() => setIsAutoScroll(!isAutoScroll)}
                                className="absolute top-4 right-4 z-10 p-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded backdrop-blur-sm transition-all text-neutral-400 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest"
                            >
                                {isAutoScroll ? (
                                    <>
                                        <Pause size={14} />
                                        <span>{t('about', 'pause')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={14} />
                                        <span>{t('about', 'autoScroll')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;


