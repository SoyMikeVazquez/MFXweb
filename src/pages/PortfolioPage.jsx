import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Mail, Play, Eye } from 'lucide-react';
import Navbar from '../components/Navbar';
import imagesData from '../../public/imagenes web/imagenes/images_canonical.json';

/* ─── Category order matching the reference site ─────────────────────────── */
const CATEGORY_ORDER = [
  'All',
  'Character Make Up',
  'Horror Fantasy',
  'Old Age',
  'Realistic Bodies',
  'Realistic Animals',
  'Puppets',
  'Blood Wounds',
  'Costumes Masks',
  'Videos',
];

/* ─── Label overrides to match reference display names ───────────────────── */
const CATEGORY_LABELS = {
  'All': 'ALL',
  'Character Make Up': 'CHARACTER MAKE UP',
  'Horror Fantasy': 'HORROR AND FANTASY',
  'Old Age': 'OLD AGE',
  'Realistic Bodies': 'REALISTIC BODIES',
  'Realistic Animals': 'REALISTIC ANIMALS',
  'Puppets': 'PUPPETS',
  'Blood Wounds': 'BLOOD & WOUNDS',
  'Costumes Masks': 'COSTUMES & MASKS',
  'Videos': 'VIDEOS',
};

/* ─── Prepare & filter images ─────────────────────────────────────────────── */
function prepareImages(images, category) {
  return images
    .filter((img) => {
      if (img.hidden === true) return false;
      if (!img.src_url || !img.hover_caption) return false;
      
      if (category === 'Videos') {
        return img.is_video === true;
      }
      
      if (category === 'All') {
        return img.categories?.length > 0 || img.is_video === true;
      }
      
      return img.categories?.includes(category);
    })
    .sort((a, b) => {
      if (a.order == null) return 1;
      if (b.order == null) return -1;
      return a.order - b.order;
    });
}

/* ─── Lazy-loaded square image ────────────────────────────────────────────── */
function GalleryItem({ img, index, onClick, isRectangular, views }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const viewCount = views && views[img.filename] != null ? views[img.filename] : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      className={`gallery-sq-item relative group ${isRectangular ? 'gallery-sq-item--video' : ''}`}
      onClick={() => onClick(index)}
      style={{ animationDelay: `${(index % 16) * 25}ms` }}
    >
      {/* skeleton */}
      {!loaded && <div className="sq-skeleton" />}

      {visible && (
        <img
          src={img.src_url}
          alt={img.hover_caption}
          className={`sq-img ${loaded ? 'sq-img--loaded' : ''}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      )}

      <div className="sq-overlay flex flex-col justify-end items-start relative">
        {img.is_video && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/80 p-3 rounded-full text-white shadow-glow group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
            <Play size={18} fill="white" />
          </div>
        )}
        <p className="sq-caption">{img.hover_caption}</p>
        <span className="text-[10px] text-neutral-400 font-sans flex items-center mt-1 select-none font-normal not-italic tracking-wider leading-none">
          <Eye size={10} className="mr-1" />
          {viewCount}
        </span>
      </div>
    </article>
  );
}

/* ─── Lightbox with zoom & pan ────────────────────────────────────────────── */
/* ─── Helper to extract embed URLs for Vimeo/YouTube ──────────────────────── */
function getEmbedUrl(videoUrl) {
  if (!videoUrl) return '';
  
  // YouTube
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = videoUrl.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }
  
  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/album\/[^\/]+\/video\/|showcase\/[^\/]+\/video\/|video\/|)|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = videoUrl.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&dnt=1`;
  }
  
  return '';
}

/* ─── Lightbox with zoom & pan ────────────────────────────────────────────── */
function Lightbox({ images, index, views, onClose, onPrev, onNext }) {
  const img = images[index] || {};
  const viewCount = views && img.filename && views[img.filename] != null ? views[img.filename] : 0;
  const initialHighRes = img.src_url ? img.src_url.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '') : '';
  const [imgSrc, setImgSrc] = useState(initialHighRes);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  // Reset zoom & source when switching images
  useEffect(() => {
    if (!img.src_url) return;
    const highRes = img.src_url.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');
    setImgSrc(highRes);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setLoaded(false);
  }, [index, img.src_url]);

  const handleImageError = () => {
    if (!img.filename) return;
    // If the remote high-res fails, fall back to the local image
    const localPath = `/imagenes web/imagenes/${img.filename}`;
    if (imgSrc !== localPath) {
      setImgSrc(localPath);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (img.is_video) return;
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.5, 5));
      if (e.key === '-') {
        setScale((s) => {
          const next = Math.max(s - 0.5, 1);
          if (next === 1) setTranslate({ x: 0, y: 0 });
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext, img.is_video]);

  // Scroll to zoom
  const handleWheel = useCallback((e) => {
    if (img.is_video) return;
    e.preventDefault();
    e.stopPropagation();
    setScale((prev) => {
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      const next = Math.min(Math.max(prev + delta, 1), 5);
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, [img.is_video]);

  // Attach wheel listener with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Double-click to toggle zoom
  const handleDoubleClick = () => {
    if (img.is_video) return;
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  // Drag to pan (only when zoomed)
  const handlePointerDown = (e) => {
    if (img.is_video || scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy,
    });
  };

  const handlePointerUp = () => setDragging(false);

  // Click backdrop to close (only if not zoomed and not dragging)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && scale <= 1) onClose();
  };

  if (!img.src_url) return null;

  return (
    <div className="lb-overlay" onClick={handleBackdropClick}>
      <button className="lb-close" onClick={onClose}><X size={20} /></button>

      {scale <= 1 && (
        <>
          <button className="lb-prev" onClick={onPrev}><ChevronLeft size={28} /></button>
          <button className="lb-next" onClick={onNext}><ChevronRight size={28} /></button>
        </>
      )}

      <div
        ref={containerRef}
        className={`lb-content ${dragging ? 'lb-content--dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Loading spinner */}
        {!loaded && <div className="lb-loader" />}

        {img.is_video ? (
          <div className="w-full max-w-4xl aspect-video rounded overflow-hidden shadow-2xl relative z-10 bg-black">
            {img.video_type === 'youtube' || img.video_type === 'vimeo' ? (
              <iframe
                src={getEmbedUrl(img.video_url)}
                title={img.hover_caption}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={() => setLoaded(true)}
              />
            ) : (
              <video
                src={img.video_url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                onLoadedData={() => setLoaded(true)}
              />
            )}
          </div>
        ) : (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={img.hover_caption}
            className={`lb-img ${loaded ? 'lb-img--loaded' : ''}`}
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={handleImageError}
          />
        )}

        <div className="lb-meta" style={{ opacity: scale > 1 ? 0 : 1 }}>
          <p className="lb-caption">
            {img.hover_caption}
            <span className="ml-3 inline-flex items-center text-xs text-neutral-500 font-sans font-normal not-italic tracking-wider select-none">
              <Eye size={12} className="mr-1" />
              {viewCount}
            </span>
          </p>
          <span className="lb-counter">{index + 1} / {images.length}</span>
        </div>
      </div>

      {/* Zoom indicator */}
      {!img.is_video && (
        <div className={`lb-zoom-badge ${scale > 1 ? 'lb-zoom-badge--on' : ''}`}>
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Zoom hint */}
      {!img.is_video && scale <= 1 && (
        <div className="lb-hint">Scroll para zoom · Doble click para ampliar</div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayCategory, setDisplayCategory] = useState('All');
  const [transitioning, setTransitioning] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [views, setViews] = useState({});

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const filtered = useMemo(() => prepareImages(imagesData, displayCategory), [displayCategory]);

  // Fetch views on mount
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const url = isLocal ? '/api/views' : '/api.php?action=get_views';
        const response = await fetch(url);
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            setViews(resData.views || {});
          }
        }
      } catch (err) {
        console.error('Error fetching views:', err);
      }
    };
    fetchViews();
  }, [isLocal]);

  // Record a view whenever the lightbox switches to a new image
  const currentFilename = lightboxIndex !== null && filtered[lightboxIndex] ? filtered[lightboxIndex].filename : null;

  useEffect(() => {
    if (currentFilename) {
      // Optimistically update local state so counter increases instantly
      setViews(prev => ({
        ...prev,
        [currentFilename]: (prev[currentFilename] || 0) + 1
      }));

      const recordView = async () => {
        try {
          const url = isLocal ? '/api/views' : '/api.php?action=view';
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: currentFilename })
          });
        } catch (err) {
          console.error('Error recording view:', err);
        }
      };
      recordView();
    }
  }, [currentFilename, isLocal]);

  // Smooth category switch
  const handleCategory = useCallback((cat) => {
    if (cat === activeCategory || transitioning) return;
    setTransitioning(true);
    setActiveCategory(cat);
    setTimeout(() => {
      setDisplayCategory(cat);
      setTransitioning(false);
    }, 220);
  }, [activeCategory, transitioning]);

  // Lock scroll for lightbox
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  const openLb = (i) => setLightboxIndex(i);
  const closeLb = () => setLightboxIndex(null);
  const prevLb = () => setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length);
  const nextLb = () => setLightboxIndex((i) => (i + 1) % filtered.length);

  return (
    <div className="pf-page relative">
      <div className="grain-overlay"></div>
      <Navbar />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="pf-header">
        <Link to="/" className="pf-back"><ArrowLeft size={14} /> Volver</Link>
        <h1 className="pf-title">PORTAFOLIO</h1>
      </header>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <nav className="pf-filters">
        <div className="pf-filters-inner">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`pf-filter-btn ${activeCategory === cat ? 'pf-filter-btn--on' : ''}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <main className={`pf-grid-wrap ${transitioning ? 'pf-grid-wrap--fade' : ''}`}>
        <div className="pf-count">{filtered.length} trabajos</div>
        <div className={`pf-grid ${displayCategory === 'Videos' ? 'pf-grid--videos' : ''}`}>
          {filtered.map((img, idx) => (
            <GalleryItem key={img.filename} img={img} index={idx} onClick={openLb} isRectangular={displayCategory === 'Videos'} views={views} />
          ))}
        </div>
      </main>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={filtered}
          index={lightboxIndex}
          views={views}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
        />
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="pf-footer flex flex-col sm:flex-row items-center justify-center gap-4">
        <p style={{ color: 'white' }}>© {new Date().getFullYear()} MFX Mexico — Todos los derechos reservados</p>
        <Link 
          to="/admin" 
          className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all duration-300 font-['Oswald'] inline-block text-center"
        >
          Acceso
        </Link>
      </footer>

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
