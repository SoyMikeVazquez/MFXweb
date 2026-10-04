import { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const Contact = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
    const [serverError, setServerError] = useState('');

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) return;

        setStatus('sending');
        setServerError('');

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const url = isLocal ? '/api/contact' : '/api.php?action=contact';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || t('contact', 'errorMessage'));
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
        } catch (err) {
            console.error('Error sending message:', err);
            setServerError(err.message || t('contact', 'errorMessage'));
            setStatus('error');
        }
    };

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
                    <form onSubmit={handleSubmit} className="space-y-8 bg-neutral-900/20 p-8 border border-neutral-800">
                        {status === 'success' && (
                            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded flex items-center gap-3 text-emerald-300 text-sm">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                                <span>{t('contact', 'successMessage')}</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded flex items-center gap-3 text-red-300 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                                <span>{serverError || t('contact', 'errorMessage')}</span>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex flex-col">
                                <label htmlFor="name" className="text-neutral-500 text-xs uppercase font-bold tracking-widest mb-2">
                                    {t('contact', 'formName')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={status === 'sending'}
                                    className="w-full bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-red-900 transition-colors disabled:opacity-50"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="email" className="text-neutral-500 text-xs uppercase font-bold tracking-widest mb-2">
                                    {t('contact', 'formEmail')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={status === 'sending'}
                                    className="w-full bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-red-900 transition-colors disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="message" className="text-neutral-500 text-xs uppercase font-bold tracking-widest mb-2">
                                {t('contact', 'formDetails')}
                            </label>
                            <textarea
                                id="message"
                                rows="5"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                disabled={status === 'sending'}
                                className="w-full bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-red-900 transition-colors resize-none disabled:opacity-50"
                            ></textarea>
                        </div>

                        <div className="text-right">
                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="inline-flex items-center justify-center gap-2 px-12 py-4 bg-red-900 text-white font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all text-xs disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {status === 'sending' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('contact', 'sending')}
                                    </>
                                ) : (
                                    t('contact', 'send')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
