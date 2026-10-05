import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import btsNew1 from '../assets/FotosDelCrew/bts-new-1.jpg';
import btsNew2 from '../assets/FotosDelCrew/bts-new-2.jpg';
import bts1 from '../assets/FotosDelCrew/bts-1.jpg';
import img1 from '../assets/FotosDelCrew/CaracterizacionMomia.jpg';
import img2 from '../assets/FotosDelCrew/CreacionDeHipopotamos.jpg';
import img3 from '../assets/FotosDelCrew/DummieBebe.jpg';
import img4 from '../assets/FotosDelCrew/DummiePero.jpg';
import img5 from '../assets/FotosDelCrew/MaquillajeFXGuadalajara.jpg';
import img6 from '../assets/FotosDelCrew/Prostetico Dummie Embarazo.jpg';
import img7 from '../assets/FotosDelCrew/ResidentEvilTrailer2026Creacion.jpg';
import img8 from '../assets/FotosDelCrew/SkettiesCreacionComercial.jpg';
import img9 from '../assets/FotosDelCrew/CaracterizaciónBruja.jpg';
import img10 from '../assets/FotosDelCrew/CaracterizaciónCavernicula.jpg';
import img11 from '../assets/FotosDelCrew/FiestaEnLaMadrigueraCómoSeHizo.jpg';
import img12 from '../assets/FotosDelCrew/ProsteticosCaracterizaciónMomia.jpg';
import img14 from '../assets/FotosDelCrew/crew-2.jpg';
import img15 from '../assets/FotosDelCrew/crew-3.jpg';
import img16 from '../assets/FotosDelCrew/crew-4.jpg';

import { useLanguage } from '../LanguageContext';

const CrewGallery = () => {
    const { t } = useLanguage();
    const [selectedIdx, setSelectedIdx] = useState(null);

    const allImages = [
        btsNew1,
        bts1,
        img15,
        btsNew2,
        img16,
        img1,
        img2,
        img3,
        img4,
        img6,
        img7,
        img8,
        img9,
        img11,
        img12
    ];

    // Lightbox navigation
    const handlePrev = (e) => {
        e?.stopPropagation();
        setSelectedIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    };

    const handleNext = (e) => {
        e?.stopPropagation();
        setSelectedIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    };

    const handleClose = () => {
        setSelectedIdx(null);
    };

    // Keyboard navigation & body scroll lock
    useEffect(() => {
        if (selectedIdx === null) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIdx]);

    return (
        <section className="py-20 md:py-24 bg-black overflow-hidden border-b border-neutral-900">
            <div className="container mx-auto px-6 mb-8 md:mb-12">
                <div className="flex items-center gap-4 mb-8">
                    <span className="w-8 h-[1px] bg-red-900"></span>
                    <span className="text-neutral-500 tracking-[0.2em] uppercase text-xs">
                        {t('crew', 'behindScenes')}
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-light text-white uppercase leading-tight tracking-tight mb-8">
                    MFX <span className="font-bold">{t('crew', 'crewTitle')}</span>
                </h2>
            </div>

            <div className="w-full overflow-x-auto pb-8 hide-scrollbar">
                <div className="flex w-max border-t border-l border-neutral-800 ml-6 mr-6">
                    {allImages.map((img, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setSelectedIdx(idx)}
                            className="w-[190px] sm:w-[230px] md:w-[270px] aspect-square overflow-hidden group border-r border-b border-neutral-800 flex-shrink-0 cursor-zoom-in relative bg-neutral-950"
                        >
                            <img
                                src={img}
                                alt={`Crew work ${idx + 1}`}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-108"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedIdx !== null && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={handleClose}
                >
                    {/* Top bar */}
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10">
                        <span className="text-neutral-400 text-xs tracking-[0.2em] uppercase font-mono">
                            {selectedIdx + 1} / {allImages.length}
                        </span>
                        <button 
                            onClick={handleClose}
                            className="p-3 text-neutral-400 hover:text-white transition-colors bg-neutral-900/60 hover:bg-neutral-800 rounded-full"
                            title="Cerrar (Esc)"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Nav Prev */}
                    <button 
                        onClick={handlePrev}
                        className="absolute left-4 md:left-8 p-3 text-neutral-400 hover:text-white transition-colors bg-neutral-900/60 hover:bg-neutral-800 rounded-full z-10"
                        title="Anterior (Flecha izquierda)"
                    >
                        <ChevronLeft className="w-7 h-7" />
                    </button>

                    {/* Image display */}
                    <div 
                        className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={allImages[selectedIdx]} 
                            alt={`Crew BTS ${selectedIdx + 1}`}
                            className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-sm select-none"
                        />
                    </div>

                    {/* Nav Next */}
                    <button 
                        onClick={handleNext}
                        className="absolute right-4 md:right-8 p-3 text-neutral-400 hover:text-white transition-colors bg-neutral-900/60 hover:bg-neutral-800 rounded-full z-10"
                        title="Siguiente (Flecha derecha)"
                    >
                        <ChevronRight className="w-7 h-7" />
                    </button>
                </div>
            )}

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};

export default CrewGallery;

