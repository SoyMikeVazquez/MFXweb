import { useState } from 'react';
import { useLanguage } from '../LanguageContext';

// Import images from assets/Portafolio
import bruja from '../assets/Portafolio/bruja.jpg';
import hora from '../assets/Portafolio/hora.jpeg';
import resident from '../assets/Portafolio/resident.jpeg';
import roma from '../assets/Portafolio/roma.jpg';
import soz from '../assets/Portafolio/soz.jpg';
import yeti from '../assets/Portafolio/yeti.jpeg';

// Import images from assets/UltimasProducciones
import turnoNocturno from '../assets/UltimasProducciones/Turno nocturno”.jpg';
import dead from '../assets/UltimasProducciones/dead.jpg';
import lazoDePetra from '../assets/UltimasProducciones/lazo de petra.jpg';
import parvulos from '../assets/UltimasProducciones/parvulos.jpg';
import tormento from '../assets/UltimasProducciones/tormento.jpg';
import cienAnos from '../assets/UltimasProducciones/cien-anos.jpg';
import demonatrix from '../assets/UltimasProducciones/demonatrix.jpg';
import blinkTwice from '../assets/UltimasProducciones/blink-twice.jpg';
import residentEvil from '../assets/UltimasProducciones/resident-evil.png';

const LatestProductions = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('productions');

    const data = {
        portfolio: [
            { id: 1, title: "Roma", category: `${t('portfolio', 'categories').production} 2026`, image: roma },
            { id: 2, title: "Resident Evil", category: "Spot Capcom 2026", image: resident },
            { id: 3, title: "S.O.Z", category: `${t('portfolio', 'categories').production} 2021`, image: soz },
            { id: 4, title: "Mal de ojo", category: `${t('portfolio', 'categories').production} 2022`, image: bruja },
            { id: 5, title: "Yeti", category: "Spot Coffe Mate 2026", image: yeti },
            { id: 6, title: "La hora marcada", category: `Vix ${t('portfolio', 'categories').tvSeries} 2023`, image: hora },
        ],
        productions: [
            { id: 6, title: "Cien años de soledad", category: t('portfolio', 'categories').production, year: "2026", image: cienAnos },
            { id: 7, title: "The Demonatrix", category: t('portfolio', 'categories').production, year: "2026", image: demonatrix },
            { id: 8, title: "Resident Evil", category: "Spot Capcom", year: "2026", image: residentEvil },
            { id: 1, title: "Turno Nocturno", category: t('portfolio', 'categories').production, year: "2025", image: turnoNocturno },
            { id: 2, title: "Párvulos", category: t('portfolio', 'categories').production, year: "2025", image: parvulos },
            { id: 3, title: "Tormento", category: t('portfolio', 'categories').production, year: "2026", image: tormento },
            { id: 4, title: "Lazo de Petra", category: t('portfolio', 'categories').shortFilm, year: "2026", image: lazoDePetra },
            { id: 5, title: "Dead", category: t('portfolio', 'categories').musicVideo, year: "2026", image: dead },
        ],
        articles: [
            { id: 1, title: "The Art of prosthetics", category: t('portfolio', 'categories').behindScenes, date: "May 2024", image: bruja },
            { id: 2, title: "Mastering the Yeti", category: t('portfolio', 'categories').technicalGuide, date: "April 2024", image: yeti },
        ]
    };



    return (
        <section
            id="latest-productions"
            className="py-24 bg-black border-t border-neutral-900"
        >
            <div className="container mx-auto px-6 mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <span className="text-red-700 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                            {t('portfolio', 'explore')}
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                            {/* Instead of 'archive', we might use something else but let's stick to the same or just visually keep it consistent if there's no specific instruction. I'll just use the same as portfolio for now or remove the text. Wait, the user didn't mention changing the title. I will keep it empty or same. I'll just use the same title or an empty one. Let's keep the same for now, or maybe the tabs are enough. Let's just leave it empty. */}
                            {t('portfolio', 'tabs').productions}
                        </h2>
                    </div>

                    <div className="flex gap-4 overflow-x-auto hide-scrollbar">
                        {['productions', 'articles'].map((tab) => (
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
                        <div key={item.id} className="relative group w-[300px] md:w-[400px] h-[500px] overflow-hidden bg-[#0a0a0a] border border-neutral-900 flex-shrink-0 hover:border-neutral-700 transition-all duration-500 cursor-pointer">

                            {/* Actual Project Image */}
                            <div className="absolute inset-0 bg-neutral-900">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                />
                                {/* Initial dark overlay to make text readable */}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500"></div>
                            </div>

                            {/* Overlay Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-transparent to-transparent opacity-90">
                                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-red-700 text-xs font-bold uppercase tracking-widest block">
                                            {item.category}
                                        </span>
                                        {/* Display extra info based on content type next to category */}
                                        {item.year && <span className="text-neutral-500 text-[10px] font-bold tracking-widest">{item.year}</span>}
                                        {item.date && <span className="text-neutral-500 text-[10px] font-bold tracking-widest">{item.date}</span>}
                                    </div>

                                    <h3 className="text-2xl font-bold text-white uppercase tracking-wide group-hover:text-neutral-300 transition-colors leading-tight">
                                        {item.title}
                                    </h3>

                                    <div className="w-0 group-hover:w-full h-[1px] bg-red-700 mt-6 transition-all duration-500"></div>
                                </div>
                            </div>
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

export default LatestProductions;
