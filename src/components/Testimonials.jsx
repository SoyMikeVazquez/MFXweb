import { Quote } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Testimonials = () => {
    const { t, getArray } = useLanguage();
    const reviews = getArray('testimonials', 'reviews');

    return (
        <section id="testimonials" className="py-24 bg-[#050505] border-t border-neutral-900 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center mb-20 text-center">
                    <span className="text-red-700 font-bold tracking-[0.3em] uppercase text-xs mb-4">
                        {t('testimonials', 'recognition')}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-widest mb-4">
                        {t('testimonials', 'title')}
                    </h2>
                    <div className="h-1 w-24 bg-red-900 mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {reviews.map((review, index) => (
                        <div key={index} className="relative group bg-neutral-900/20 border border-neutral-800 p-10 hover:border-red-900/30 transition-all duration-500">

                            {/* Quote Icon */}
                            <div className="absolute -top-5 left-10 bg-[#050505] px-2 text-red-800 group-hover:text-red-600 transition-colors">
                                <Quote size={40} className="fill-current" />
                            </div>

                            <p className="text-neutral-400 font-light italic leading-relaxed mb-8 text-lg">
                                "{review.text}"
                            </p>

                            <div className="border-t border-neutral-800 pt-6 group-hover:border-red-900/30 transition-colors">
                                <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-1">
                                    {review.author}
                                </h4>
                                <span className="text-red-700 text-xs font-mono uppercase tracking-wider">
                                    {review.project}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;

