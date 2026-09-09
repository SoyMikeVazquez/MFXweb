import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const Portfolio = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('portfolio');
    const [isHovered, setIsHovered] = useState(false);
    const location = useLocation();

    // Listen to hash changes (e.g. direct URL navigations)
    useEffect(() => {
        if (location.hash === '#portfolio') {
            setActiveTab('portfolio');
        }
    }, [location.hash]);

    // Listen to custom reset event (clicks on Hero's "View Projects" button)
    useEffect(() => {
        const handleReset = () => {
            setActiveTab('portfolio');
        };
        window.addEventListener('reset-portfolio-tab', handleReset);
        return () => {
            window.removeEventListener('reset-portfolio-tab', handleReset);
        };
    }, []);

    useEffect(() => {
        let interval;
        if (!isHovered) {
            interval = setInterval(() => {
                setActiveTab(currentTab => {
                    const tabIds = ['portfolio', 'productions', 'articles'];
                    const currentIndex = tabIds.indexOf(currentTab);
                    const nextIndex = (currentIndex + 1) % tabIds.length;
                    return tabIds[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isHovered]);

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
            { id: 7, title: "The Demonatrix", category: t('portfolio', 'categories').production, year: "2023", image: demonatrix },
            { id: 1, title: "Turno Nocturno", category: t('portfolio', 'categories').production, year: "2024", image: turnoNocturno },
            { id: 2, title: "Párvulos", category: t('portfolio', 'categories').production, year: "2024", image: parvulos },
            { id: 3, title: "Tormento", category: t('portfolio', 'categories').production, year: "2023", image: tormento },
            { id: 4, title: "Lazo de Petra", category: t('portfolio', 'categories').shortFilm, year: "2023", image: lazoDePetra },
            { id: 5, title: "Dead", category: t('portfolio', 'categories').musicVideo, year: "2023", image: dead },
            { id: 8, title: "Blink Twice", category: t('portfolio', 'categories').production, year: "2024", image: blinkTwice },
        ],
        articles: [
            { id: 1, title: "The Art of prosthetics", category: t('portfolio', 'categories').behindScenes, date: "May 2024", image: bruja },
            { id: 2, title: "Mastering the Yeti", category: t('portfolio', 'categories').technicalGuide, date: "April 2024", image: yeti },
        ]
    };

    const tabs = [
        { id: 'portfolio', label: t('portfolio', 'tabs').portfolio },
        { id: 'productions', label: t('portfolio', 'tabs').productions },
        { id: 'articles', label: t('portfolio', 'tabs').articles }
    ];

    return (
        <section
            id="portfolio"
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

                    {/* Tabs Navigation */}
                    <div
                        className="flex flex-wrap gap-4 border-b border-neutral-800 pb-1"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-sm font-bold uppercase tracking-[0.2em] pb-4 transition-all duration-300 relative ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-neutral-600 hover:text-neutral-400'
                                    }`}
                            >
                                {tab.label}
                                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-red-900 transition-transform duration-300 ${activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'
                                    }`}></span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Horizontal Slider */}
            <div
                className="w-full overflow-x-auto pb-12 hide-scrollbar"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div key={activeTab} className="flex gap-6 px-6 w-max animate-fade-in">
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
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-red-700 text-xs font-bold uppercase tracking-widest block">
                                            {item.category}
                                        </span>
                                        {/* Display extra info based on content type */}
                                        {item.year && <span className="text-neutral-500 text-[10px] tracking-widest">{item.year}</span>}
                                        {item.date && <span className="text-neutral-500 text-[10px] tracking-widest">{item.date}</span>}
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

            {/* View More Button - Kept in DOM to prevent Layout Shift */}
            <div
                className={`container mx-auto px-6 mt-12 flex justify-center transition-opacity duration-500 ${
                    activeTab === 'portfolio' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none select-none'
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Link
                    to="/portfolio"
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

