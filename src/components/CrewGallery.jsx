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
import img13 from '../assets/FotosDelCrew/crew-1.jpeg';
import img14 from '../assets/FotosDelCrew/crew-2.jpg';
import img15 from '../assets/FotosDelCrew/crew-3.jpg';
import img16 from '../assets/FotosDelCrew/crew-4.jpg';

import { useLanguage } from '../LanguageContext';

const CrewGallery = () => {
    const { t } = useLanguage();
    const allImages = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, img15, img16];

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

            <div className="container mx-auto px-0 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-l border-neutral-800">
                    {allImages.map((img, idx) => (
                        <div key={idx} className="aspect-square overflow-hidden group border-r border-b border-neutral-800">
                            <img
                                src={img}
                                alt={`Crew work ${idx + 1}`}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CrewGallery;
