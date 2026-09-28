import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Hero from './components/Hero';
import Navbar from './components/Navbar';
import About from './components/About';
import BrandSlider from './components/BrandSlider';
import Portfolio from './components/Portfolio';
import CrewGallery from './components/CrewGallery';
import Services from './components/Services';
import Interviews from './components/Interviews';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LatestProductions from './components/LatestProductions';
import { LanguageProvider } from './LanguageContext';
import { Mail } from 'lucide-react';

import PortfolioPage from './pages/PortfolioPage';
import GalleryAdmin from './pages/GalleryAdmin';

import loadingAnim from './assets/mfxanimacion.gif';


/* ── Home page ────────────────────────────────────────────────────────────── */
function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeout, setFadeout] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeout(true), 1750);
    const removeTimer = setTimeout(() => setIsLoading(false), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-900 selection:text-white relative">
      {/* Loading Screen Overlay */}
      {isLoading && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ease-in-out ${
            fadeout ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <img
            src={loadingAnim}
            alt="Loading animation"
            className="w-16 h-16 md:w-32 md:h-32 object-contain"
          />
        </div>
      )}

      <div className="grain-overlay"></div>

      {/* Structural layout change: Hero first, then Nav */}
      <Hero />
      <Navbar />

      <main>
        <BrandSlider />
        <Portfolio />
        <Services />
        <CrewGallery />
        <LatestProductions />
        <Interviews />
        {/* <Testimonials /> */}
        <About />
        <Contact />
      </main>

      <Footer />

      {/* Discrete Floating Contact Buttons */}
      <div className="fixed bottom-24 right-8 z-50 flex flex-col gap-3">
        {/* WhatsApp Button */}
        <a
          href="https://wa.me/525533428081"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg group"
          aria-label="WhatsApp"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-current transition-colors duration-300 group-hover:text-[#25D366]"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 0 0-6.98-2.879C6.22 1.96 1.798 6.33 1.795 11.76c-.001 1.637.452 3.232 1.312 4.6l-.993 3.629 3.722-.976-.135-.078-.041.018zm11.233-6.52c-.302-.151-1.787-.881-2.056-.979-.269-.098-.465-.147-.659.151-.194.298-.75.979-.918 1.176-.168.196-.336.22-.639.07-.302-.15-1.277-.47-2.433-1.5-.899-.8-1.504-1.79-1.68-2.09-.177-.3-.019-.462.132-.61.136-.134.302-.35.454-.526.151-.175.202-.298.302-.497.102-.198.05-.373-.026-.523-.075-.15-.659-1.59-.902-2.176-.237-.57-.479-.493-.66-.502-.171-.008-.367-.01-.563-.01-.196 0-.517.073-.787.369-.27.298-1.031 1.008-1.031 2.458s1.05 2.85 1.196 3.05c.147.2 2.068 3.159 5.011 4.434.7.303 1.246.484 1.671.619.703.224 1.343.193 1.85.118.563-.083 1.787-.73 2.039-1.436.252-.706.252-1.312.177-1.437-.075-.125-.269-.196-.571-.347z" />
          </svg>
        </a>

        {/* Mail Button */}
        <a
          href="mailto:maquillajefxmexico@gmail.com"
          className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg group"
          aria-label="Email"
        >
          <Mail size={20} className="transition-colors duration-300 group-hover:text-red-700" />
        </a>
      </div>
    </div>
  );
}

/* ── Scroll to hash element on route change ────────────────────────────────── */
function ScrollToHashElement() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  return null;
}

/* ── App root with routing ────────────────────────────────────────────────── */
function App() {
  return (
    <LanguageProvider>
      <ScrollToHashElement />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<PortfolioPage />} />
        <Route path="/admin" element={<GalleryAdmin />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
