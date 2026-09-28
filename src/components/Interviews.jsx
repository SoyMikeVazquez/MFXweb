import { useState } from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const VideoThumbnail = ({ videoId, title }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="relative w-full aspect-video bg-neutral-900 border border-neutral-800 rounded-sm overflow-hidden group cursor-pointer hover:border-red-900/50 transition-colors duration-500">
            {!isPlaying ? (
                <div 
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={() => setIsPlaying(true)}
                >
                    {/* Thumbnail Image */}
                    <img 
                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                        alt={title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                    
                    {/* Custom Play Button */}
                    <div className="absolute z-10 w-16 h-16 bg-red-900/90 text-white rounded-full flex items-center justify-center transform group-hover:scale-110 shadow-[0_0_20px_rgba(153,27,27,0.5)] transition-all duration-300">
                        <Play size={24} className="ml-1" fill="currentColor" />
                    </div>
                </div>
            ) : (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                ></iframe>
            )}
        </div>
    );
};

const Interviews = () => {
    const { t } = useLanguage();

    const videos = [
        { id: '2dVusOUtkvg', title: 'Interview 1' },
        { id: '9s82gJGASxc', title: 'Interview 2' },
        { id: 'sbbyPO_rQlQ', title: 'Interview 3' },
    ];

    return (
        <section id="interviews" className="py-24 bg-[#050505] border-t border-neutral-900">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-red-900/30 pb-8">
                    <div>
                        <span className="text-red-700 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                            {t('interviews', 'subtitle')}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            {t('interviews', 'title')}
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video, index) => (
                        <div key={index} className="flex flex-col">
                            <VideoThumbnail videoId={video.id} title={video.title} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Interviews;
