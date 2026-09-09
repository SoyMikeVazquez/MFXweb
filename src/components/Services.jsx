import { Plus, ScanFace, Bot, Skull, Droplet } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Services = () => {
    const { t, getArray } = useLanguage();
    const serviceTexts = getArray('services', 'items');

    // We match icons by index since they are not in JSON
    const icons = [
        <Droplet size={48} strokeWidth={1} />,
        <Bot size={48} strokeWidth={1} />,
        <Skull size={48} strokeWidth={1} />,
        <ScanFace size={48} strokeWidth={1} />
    ];

    const services = serviceTexts.map((text, index) => ({
        ...text,
        icon: icons[index]
    }));

    return (
        <section id="services" className="py-24 bg-[#080808] text-white border-t border-neutral-900">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start mb-16 border-b border-red-900/30 pb-8">
                    <div>
                        <span className="text-red-700 font-bold tracking-[0.3em] uppercase text-xs mb-2 block">
                            {t('services', 'capabilities')}
                        </span>
                        <h2 className="text-4xl font-bold uppercase tracking-tighter">
                            {t('services', 'title')}
                        </h2>
                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map((service, index) => (
                        <div key={index} className="group bg-neutral-900/50 border border-neutral-800 p-8 min-h-[400px] flex flex-col justify-between hover:bg-neutral-900 hover:border-red-900/50 transition-all duration-500 cursor-pointer relative overflow-hidden">

                            <div className="absolute top-4 right-4 text-neutral-800 group-hover:text-red-800 transition-colors">
                                <Plus size={24} />
                            </div>

                            <div className="mt-8 relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                                <span className="text-neutral-600 mb-4 block group-hover:text-white transition-all duration-500">
                                    {service.icon}
                                </span>
                                <span className="text-sm font-black text-red-900 group-hover:text-red-600 transition-colors mb-2 block tracking-widest uppercase">
                                    {service.id}
                                </span>
                                <h3 className="text-2xl font-bold uppercase mb-4 text-neutral-200 group-hover:text-white">
                                    {service.title}
                                </h3>
                            </div>

                            <div className="relative z-10 border-t border-neutral-800 pt-6 group-hover:border-red-900/30 transition-colors">
                                <p className="text-sm font-light text-neutral-400 group-hover:text-neutral-300">
                                    {service.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
