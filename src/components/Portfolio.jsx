import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

// Import images from assets/Portafolio
import bruja from '../assets/Portafolio/bruja.jpg';
import hora from '../assets/Portafolio/hora.jpeg';
import resident from '../assets/Portafolio/resident.jpeg';
import roma from '../assets/Portafolio/roma.jpg';
import soz from '../assets/Portafolio/soz.jpg';
import yeti from '../assets/Portafolio/yeti.jpeg';
import hippos from '../assets/Portafolio/hippos.jpg';
import oldman from '../assets/Portafolio/oldman.jpg';
import zombie from '../assets/Portafolio/zombie.jpg';
import tiger from '../assets/Portafolio/tiger.jpg';
import witchNew from '../assets/Portafolio/witch_new.png';
import blood from '../assets/Portafolio/blood.jpg';
import character from '../assets/Portafolio/character.png';
import yetiNew from '../assets/Portafolio/yeti_new.jpg';
import ratPuppet from '../assets/Portafolio/rat_puppet.png';

// New images
import newRealisticAnimals from '../assets/Portafolio/new_realistic_animals.png';
import newBloodWounds from '../assets/Portafolio/new_blood_wounds.png';
import newRealisticBodies from '../assets/Portafolio/new_realistic_bodies.jpg';
import newRomaCharacter from '../assets/Portafolio/new_roma_character.jpg';
import newOldAge from '../assets/Portafolio/new_old_age.jpg';

// Import images from assets/UltimasProducciones
import turnoNocturno from '../assets/UltimasProducciones/Turno nocturno”.jpg';
import dead from '../assets/UltimasProducciones/dead.jpg';
import lazoDePetra from '../assets/UltimasProducciones/lazo de petra.jpg';
import parvulos from '../assets/UltimasProducciones/parvulos.jpg';
import tormento from '../assets/UltimasProducciones/tormento.jpg';
import cienAnos from '../assets/UltimasProducciones/cien-anos.jpg';
import demonatrix from '../assets/UltimasProducciones/demonatrix.jpg';
import blinkTwice from '../assets/UltimasProducciones/blink-twice.jpg';

const Portfolio = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('portfolio');

    const data = {
        portfolio: [
            { id: 1, title: "Character Makeup", query: "Character Make Up", image: newRomaCharacter },
            { id: 2, title: "Horror and Fantasy", query: "Horror Fantasy", image: witchNew },
            { id: 3, title: "Old Age", query: "Old Age", image: newOldAge },
            { id: 4, title: "Realistic Bodies", query: "Realistic Bodies", image: newRealisticBodies },
            { id: 5, title: "Realistic Animals", query: "Realistic Animals", image: newRealisticAnimals },
            { id: 6, title: "Puppets & Animatronics", query: "Puppets & Animatronics", image: ratPuppet },
            { id: 7, title: "Blood and Wounds", query: "Blood Wounds", image: newBloodWounds },
            { id: 8, title: "Costumes and Mask", query: "Costumes Masks", image: yetiNew },
        ],
        articles: [
            { id: 1, title: "The Art of prosthetics", category: t('portfolio', 'categories').behindScenes, date: "May 2024", image: bruja },
            { id: 2, title: "Mastering the Yeti", category: t('portfolio', 'categories').technicalGuide, date: "April 2024", image: yeti },
        ]
    };



    return (
        <section
            id="gallery"
            className="py-24 bg-black border-t border-neutral-900"
        >
            <div className="container mx-auto px-6 mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <span className="text-red-700 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                            {t('portfolio', 'explore')}
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                            {t('portfolio', 'archive')}
                        </h2>
                    </div>

                    <div className="hidden gap-4 overflow-x-auto hide-scrollbar">
                        {['portfolio', 'productions', 'articles'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 pb-2 border-b-2 ${
                                    activeTab === tab
                                        ? 'text-white border-red-700'
                                        : 'text-neutral-500 border-transparent hover:text-white'
                                }`}
                            >
                                {t('portfolio', 'tabs')[tab]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Horizontal Slider */}
            <div className="w-full overflow-x-auto pb-12 hide-scrollbar">
                <div className="flex gap-6 px-6 w-max animate-fade-in" key={activeTab}>
                    {data[activeTab].map((item) => (
                        <Link to={`/gallery?category=${encodeURIComponent(item.query)}`} key={item.id} className="relative group w-[300px] md:w-[400px] h-[500px] overflow-hidden bg-[#0a0a0a] border border-neutral-900 flex-shrink-0 hover:border-neutral-700 transition-all duration-500 cursor-pointer block">

                            {/* Actual Project Image */}
                            <div className="absolute inset-0 bg-neutral-900">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                />
                                {/* Initial dark overlay to make text readable */}
                                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-500"></div>
                            </div>

                            {/* Overlay Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60">
                                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-wide group-hover:text-neutral-300 transition-colors leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                        {item.title}
                                    </h3>

                                    <div className="w-0 group-hover:w-full h-[1px] bg-red-700 mt-6 transition-all duration-500"></div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* View More Button - Kept in DOM to prevent Layout Shift */}
            <div className="container mx-auto px-6 mt-12 flex justify-center transition-opacity duration-500 opacity-100 pointer-events-auto">
                <Link
                    to="/gallery"
                    className="group relative px-8 py-4 bg-transparent border border-red-900 overflow-hidden transition-all duration-500 hover:border-red-600"
                >
                    {/* Fill background on hover */}
                    <div className="absolute inset-0 w-0 bg-red-900 group-hover:w-full transition-all duration-500 ease-out"></div>

                    {/* Button Text */}
                    <span className="relative z-10 text-white font-bold uppercase tracking-[0.3em] text-sm">
                        {t('portfolio', 'viewFull')}
                    </span>
                </Link>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fadeInTab {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeInTab 0.5s ease-out forwards;
                }
            `}</style>
        </section>
    );
};

export default Portfolio;

