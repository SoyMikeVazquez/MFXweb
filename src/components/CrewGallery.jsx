import btsNew1 from '../assets/FotosDelCrew/bts-new-1.jpg';
import btsNew2 from '../assets/FotosDelCrew/bts-new-2.jpg';
import bts1 from '../assets/FotosDelCrew/bts-1.jpg';
import bts2 from '../assets/FotosDelCrew/bts-2.png';
import bts3 from '../assets/FotosDelCrew/bts-3.png';
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
    const allImages = [
        btsNew1,
        bts1,
        bts2,
        img15,
        btsNew2,
        bts3,
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

    return (
        <section className="py-24 bg-black overflow-hidden border-b border-neutral-900">
            <div className="container mx-auto px-6 mb-12">
                <div className="flex items-center gap-4 mb-8">
                    <span className="w-8 h-[1px] bg-red-900"></span>
                    <span className="text-neutral-500 tracking-[0.2em] uppercase text-xs">
                        {t('crew', 'behindScenes')}
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-light text-white uppercase leading-tight tracking-tight mb-16">
                    MFX <span className="font-bold">{t('crew', 'crewTitle')}</span>
                </h2>
            </div>

            <div className="w-full overflow-x-auto pb-8 hide-scrollbar">
                <div className="flex w-max border-t border-l border-neutral-800 ml-6 mr-6">
                    {allImages.map((img, idx) => (
                        <div key={idx} className="w-[250px] md:w-[350px] aspect-square overflow-hidden group border-r border-b border-neutral-800 flex-shrink-0">
                            <img
                                src={img}
                                alt={`Crew work ${idx + 1}`}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 cursor-pointer"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>

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
