import { useLanguage } from '../LanguageContext';

const Contact = () => {
    const { t } = useLanguage();

    return (
        <section id="contact" className="py-24 bg-black relative overflow-hidden border-t border-red-900/20">

            <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row gap-16">

                <div className="w-full md:w-1/3">
                    <span className="text-red-700 font-bold tracking-[0.4em] uppercase text-xs mb-8 block">
                        {t('contact', 'location')}
                    </span>
                    <h2 className="text-4xl font-bold uppercase text-white mb-8">
                        {t('contact', 'title')}
                    </h2>
                    <div className="space-y-6 text-neutral-400 font-serif">
                        <p>
                            <strong className="block text-white font-sans uppercase text-xs tracking-widest mb-1">{t('contact', 'addressLabel')}</strong>
                            {t('contact', 'address')}
                        </p>
                        <p>
                            <strong className="block text-white font-sans uppercase text-xs tracking-widest mb-1">{t('contact', 'emailLabel')}</strong>
                            maquillajefxmexico@gmail.com
                        </p>
                        <p>
                            <strong className="block text-white font-sans uppercase text-xs tracking-widest mb-1">{t('contact', 'phoneLabel')}</strong>
                            +52 5533 4280 81
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-2/3">
                    <form className="space-y-8 bg-neutral-900/20 p-8 border border-neutral-800">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex flex-col">
                                <label htmlFor="name" className="text-neutral-500 text-xs uppercase font-bold tracking-widest mb-2">{t('contact', 'formName')}</label>
                                <input type="text" id="name" className="w-full bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-red-900 transition-colors" />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="email" className="text-neutral-500 text-xs uppercase font-bold tracking-widest mb-2">{t('contact', 'formEmail')}</label>
                                <input type="email" id="email" className="w-full bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-red-900 transition-colors" />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="message" className="text-neutral-500 text-xs uppercase font-bold tracking-widest mb-2">{t('contact', 'formDetails')}</label>
                            <textarea id="message" rows="5" className="w-full bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-red-900 transition-colors resize-none"></textarea>
                        </div>

                        <div className="text-right">
                            <button type="button" className="px-12 py-4 bg-red-900 text-white font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all text-xs">
                                {t('contact', 'send')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;

