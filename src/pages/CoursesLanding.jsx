import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Film,
  Flame,
  Layers,
  ChevronDown
} from 'lucide-react';

const VIDEO_HERO_URL = "https://xmirggkcykqqisotuyhj.supabase.co/storage/v1/object/public/general/Models_moving_slowly_diagonal_20261003093210.mp4";

export default function CoursesLanding() {
  const formRef = useRef(null);
  const coursesRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    curso: 'Caracterización y Prostéticos de Cine',
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.correo || !formData.telefono) return;

    setStatus('sending');
    setErrorMessage('');

    // Format phone to digits for numeric column in Supabase
    const cleanDigits = formData.telefono.replace(/\D/g, '');
    const numericPhone = cleanDigits ? Number(cleanDigits) : null;

    try {
      // 1. Guardar en Supabase (tabla leads)
      if (supabase) {
        const { error: supaErr } = await supabase.from('leads').insert([
          {
            nombre: formData.nombre.trim(),
            correo: formData.correo.trim(),
            telefono: numericPhone,
          },
        ]);

        if (supaErr) {
          console.error('Error insertando lead en Supabase:', supaErr);
          // Si hay error en Supabase, lo logueamos pero intentamos enviar correo de notificación
        }
      }

      // 2. Notificar vía Resend a soymikevazquez@gmail.com
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const notifyUrl = isLocal ? '/api/lead' : '/api.php?action=lead';

      const res = await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim(),
          telefono: formData.telefono.trim(),
          curso: formData.curso,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('Aviso de notificación por correo:', data.error);
      }

      setStatus('success');
      setFormData({
        nombre: '',
        correo: '',
        telefono: '',
        curso: 'Caracterización y Prostéticos de Cine',
      });
    } catch (err) {
      console.error('Error en el envío del formulario:', err);
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu registro. Por favor intenta de nuevo.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-900 selection:text-white relative">
      <div className="grain-overlay"></div>

      {/* Top Floating Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-b border-neutral-900">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-['Oswald'] uppercase tracking-[0.25em] text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-red-600" />
            <span>Volver a MFX</span>
          </Link>

          <span className="text-xs font-['Oswald'] tracking-[0.3em] uppercase text-red-600 font-bold hidden sm:inline">
            Workshops & Masterclasses
          </span>

          <button
            onClick={() => scrollToSection(formRef)}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white text-[11px] font-['Oswald'] tracking-[0.2em] uppercase rounded transition-all cursor-pointer shadow-lg shadow-red-950/40"
          >
            Apartar Lugar
          </button>
        </div>
      </header>

      {/* =========================================================================
          SECCIÓN 1: HERO CONTAINER (VIDEO BACKGROUND)
      ========================================================================== */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
        {/* Background Video (More transparent & vibrant) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105 filter brightness-90 contrast-110"
          >
            <source src={VIDEO_HERO_URL} type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>
          {/* Soft transparent overlay allowing video to clearly show through */}
          <div className="absolute inset-0 bg-black/35"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40"></div>
        </div>

        {/* Atmospheric Background Smoke Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-1">
          {/* Low rising mist bank */}
          <div className="absolute -bottom-10 left-0 right-0 h-72 bg-gradient-to-t from-[#050505] via-neutral-900/50 to-transparent blur-2xl animate-smoke-rise"></div>

          {/* Left drifting smoke cloud */}
          <div className="absolute top-1/4 -left-28 w-[650px] h-[500px] rounded-full bg-neutral-300/10 blur-[100px] animate-smoke-1"></div>

          {/* Right drifting smoke cloud with subtle red horror/FX undertone */}
          <div className="absolute bottom-1/4 -right-28 w-[700px] h-[550px] rounded-full bg-red-900/20 blur-[120px] animate-smoke-2"></div>

          {/* Central floating vapor */}
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] rounded-full bg-white/5 blur-[90px] animate-smoke-3"></div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto relative z-10 max-w-4xl text-center space-y-6 pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 border border-red-700/60 text-red-400 text-xs font-['Oswald'] tracking-[0.3em] uppercase backdrop-blur-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Próxima Apertura • Cupos Limitados</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal uppercase tracking-wide text-white font-['Oswald'] leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            Aprende Efectos Especiales <br />
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-amber-500">
              y Maquillaje FX de Cine
            </span>
          </h1>

          <p className="text-neutral-200 font-serif text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Formación profesional y 100% práctica impartida por los directores y artistas de MFX, ganadores del Premio Ariel.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection(formRef)}
              className="w-full sm:w-auto px-10 py-4 bg-red-900 hover:bg-white hover:text-black text-white font-['Oswald'] font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 cursor-pointer shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 group"
            >
              <span>Quiero Información & Preventa</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => scrollToSection(coursesRef)}
              className="w-full sm:w-auto px-8 py-4 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 font-['Oswald'] text-xs uppercase tracking-[0.25em] transition-all cursor-pointer"
            >
              Ver Cursos & Equipo
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-12 max-w-2xl mx-auto border-t border-neutral-800/80 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-['Oswald']">+20 Años</div>
              <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-sans mt-0.5">De Trayectoria</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-['Oswald']">Premios Ariel</div>
              <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-sans mt-0.5">Por la AMACC</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-['Oswald']">100% Taller</div>
              <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-sans mt-0.5">Práctica Real</div>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => scrollToSection(coursesRef)}
              className="text-neutral-500 hover:text-white transition-colors animate-bounce"
              aria-label="Bajar a cursos"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECCIÓN 2: EL EQUIPO Y PRÓXIMOS CURSOS
      ========================================================================== */}
      <section ref={coursesRef} className="py-24 px-6 bg-[#0a0a0a] border-t border-neutral-900 relative overflow-hidden">
        {/* Background Smoke Drift for Section 2 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-10 -right-24 w-[600px] h-[600px] rounded-full bg-neutral-800/15 blur-[130px] animate-smoke-2"></div>
          <div className="absolute bottom-10 -left-24 w-[650px] h-[650px] rounded-full bg-red-950/15 blur-[140px] animate-smoke-1"></div>
        </div>

        <div className="container mx-auto max-w-6xl space-y-20 relative z-10">
          
          {/* El Equipo Resumen */}
          <div className="flex flex-col lg:flex-row items-center gap-12 bg-neutral-950/80 p-8 sm:p-12 border border-neutral-800/80 rounded-lg relative overflow-hidden">
            <div className="w-full lg:w-1/2 space-y-6">
              <span className="text-red-600 font-bold tracking-[0.4em] uppercase text-xs block font-['Oswald']">
                El Estudio & Mentores
              </span>
              <h2 className="text-3xl sm:text-4xl font-normal uppercase text-white font-['Oswald'] leading-tight tracking-wide">
                Aprende de los mismos artistas que transforman el cine
              </h2>
              <p className="text-neutral-400 font-serif leading-relaxed text-base sm:text-lg">
                Fundada por Roberto Ortiz y Ana Flores, <strong className="text-white font-sans">MFX (Makeup and Special Effects Mexico)</strong> es el referente líder en Latinoamérica en diseño de criaturas, animatrónicos y prostéticos de alto nivel para producciones como <em>Roma</em>, <em>Bardo</em> y <em>Apocalypto</em>.
              </p>
              <p className="text-neutral-400 font-serif leading-relaxed text-base sm:text-lg">
                Nuestros talleres están diseñados para transferir el conocimiento técnico real utilizado en sets de filmación: uso de siliconas de grado médico, escultura anatómica, moldes de precisión y pintura especializada.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-300 font-['Oswald']">
                  <Award className="w-4 h-4 text-red-600" />
                  <span>Ganadores Premios Ariel</span>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-300 font-['Oswald']">
                  <Film className="w-4 h-4 text-red-600" />
                  <span>Cine & TV Internacional</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-[#050505] p-6 border border-neutral-900 rounded">
                  <div className="text-red-600 font-['Oswald'] text-2xl font-normal mb-1">01</div>
                  <h4 className="text-white font-['Oswald'] uppercase text-sm font-normal tracking-wider mb-2">Atención Directa</h4>
                  <p className="text-neutral-400 text-xs font-serif leading-relaxed">Grupos reducidos para garantizar acompañamiento paso a paso en tu mesa de trabajo.</p>
                </div>
                <div className="bg-[#050505] p-6 border border-neutral-900 rounded">
                  <div className="text-red-600 font-['Oswald'] text-2xl font-normal mb-1">02</div>
                  <h4 className="text-white font-['Oswald'] uppercase text-sm font-normal tracking-wider mb-2">Materiales Profesionales</h4>
                  <p className="text-neutral-400 text-xs font-serif leading-relaxed">Práctica con los mismos insumos de efectos especiales que se usan en Hollywood.</p>
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="bg-[#050505] p-6 border border-neutral-900 rounded">
                  <div className="text-red-600 font-['Oswald'] text-2xl font-normal mb-1">03</div>
                  <h4 className="text-white font-['Oswald'] uppercase text-sm font-normal tracking-wider mb-2">Portafolio Real</h4>
                  <p className="text-neutral-400 text-xs font-serif leading-relaxed">Terminarás con piezas reales fotografiadas profesionalmente para tu currículum.</p>
                </div>
                <div className="bg-[#050505] p-6 border border-neutral-900 rounded">
                  <div className="text-red-600 font-['Oswald'] text-2xl font-normal mb-1">04</div>
                  <h4 className="text-white font-['Oswald'] uppercase text-sm font-normal tracking-wider mb-2">Networking</h4>
                  <p className="text-neutral-400 text-xs font-serif leading-relaxed">Conexión directa con la industria cinematográfica y teatral de México.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cursos Próximos */}
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <span className="text-red-600 font-bold tracking-[0.4em] uppercase text-xs block font-['Oswald']">
                Próximas Fechas
              </span>
              <h2 className="text-3xl sm:text-5xl font-normal uppercase text-white font-['Oswald'] tracking-wide">
                Cursos & Workshops Disponibles
              </h2>
              <p className="text-neutral-400 font-serif max-w-xl mx-auto text-base">
                Selecciona tu especialidad y regístrate para recibir el temario desglosado, costos y fechas exactas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Curso 1 */}
              <div className="bg-neutral-950 border border-neutral-900 hover:border-red-900/60 p-8 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-red-500 font-['Oswald'] font-bold block">
                    Nivel Inicial a Avanzado
                  </span>
                  <h3 className="text-2xl font-normal uppercase text-white font-['Oswald'] tracking-wide">
                    Caracterización & Prostéticos de Cine
                  </h3>
                  <p className="text-neutral-400 font-serif text-sm leading-relaxed">
                    Escultura sobre modelo, elaboración de moldes rígidos y flexibles, vaciado en silicona platino y espuma de látex, aplicación en piel con bordes imperceptibles y técnicas de pintura al alcohol hiperrealista.
                  </p>
                </div>

                <div className="pt-8 border-t border-neutral-900 mt-6">
                  <button
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, curso: 'Caracterización y Prostéticos de Cine' }));
                      scrollToSection(formRef);
                    }}
                    className="w-full py-3 text-center text-xs font-['Oswald'] uppercase tracking-[0.2em] font-bold text-neutral-300 group-hover:text-white bg-neutral-900 group-hover:bg-red-900 transition-colors cursor-pointer"
                  >
                    Registrarme en este curso
                  </button>
                </div>
              </div>

              {/* Curso 2 */}
              <div className="bg-neutral-950 border border-neutral-900 hover:border-red-900/60 p-8 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-red-500 font-['Oswald'] font-bold block">
                    Especialización Cinematográfica
                  </span>
                  <h3 className="text-2xl font-normal uppercase text-white font-['Oswald'] tracking-wide">
                    Criaturas, Monstruos & Animatrónicos
                  </h3>
                  <p className="text-neutral-400 font-serif text-sm leading-relaxed">
                    Diseño conceptual, técnicas de modelado de monstruos, mecanismos animatrónicos operables para cine (movimiento de ojos, mandíbulas y respiración), integración de títeres y puppets para set.
                  </p>
                </div>

                <div className="pt-8 border-t border-neutral-900 mt-6">
                  <button
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, curso: 'Criaturas, Monstruos y Animatrónicos' }));
                      scrollToSection(formRef);
                    }}
                    className="w-full py-3 text-center text-xs font-['Oswald'] uppercase tracking-[0.2em] font-bold text-neutral-300 group-hover:text-white bg-neutral-900 group-hover:bg-red-900 transition-colors cursor-pointer"
                  >
                    Registrarme en este curso
                  </button>
                </div>
              </div>

              {/* Curso 3 */}
              <div className="bg-neutral-950 border border-neutral-900 hover:border-red-900/60 p-8 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-red-500 font-['Oswald'] font-bold block">
                    Efectos Escénicos Directos
                  </span>
                  <h3 className="text-2xl font-normal uppercase text-white font-['Oswald'] tracking-wide">
                    Efectos Especiales de Set & Sangre
                  </h3>
                  <p className="text-neutral-400 font-serif text-sm leading-relaxed">
                    Simulación de heridas balísticas, quemaduras de tercer grado, cortes quirúrgicos, moretones, cicatrices y formulación de tipos de sangre para cámara según la iluminación y textura requerida.
                  </p>
                </div>

                <div className="pt-8 border-t border-neutral-900 mt-6">
                  <button
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, curso: 'Efectos Especiales de Set y Sangre' }));
                      scrollToSection(formRef);
                    }}
                    className="w-full py-3 text-center text-xs font-['Oswald'] uppercase tracking-[0.2em] font-bold text-neutral-300 group-hover:text-white bg-neutral-900 group-hover:bg-red-900 transition-colors cursor-pointer"
                  >
                    Registrarme en este curso
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECCIÓN 3: FORMULARIO DE REGISTRO / LEADS
      ========================================================================== */}
      <section ref={formRef} className="py-24 px-6 bg-black border-t border-neutral-900 relative overflow-hidden">
        {/* Background Smoke for Section 3 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[500px] rounded-full bg-neutral-700/10 blur-[130px] animate-smoke-3"></div>
          <div className="absolute -bottom-10 right-0 w-[550px] h-[400px] rounded-full bg-red-950/20 blur-[120px] animate-smoke-1"></div>
        </div>

        <div className="container mx-auto max-w-3xl relative z-10">
          <div className="text-center space-y-4 mb-12">
            <span className="text-red-600 font-bold tracking-[0.4em] uppercase text-xs block font-['Oswald']">
              Registro de Interesados
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal uppercase text-white font-['Oswald'] tracking-wide">
              Asegura tu Lugar en Preventa
            </h2>
            <p className="text-neutral-400 font-serif text-base sm:text-lg max-w-xl mx-auto">
              Llena tus datos a continuación. Te enviaremos el temario detallado, calendario de fechas y precios preferenciales antes de la apertura pública.
            </p>
          </div>

          <div className="bg-neutral-950 p-8 sm:p-12 border border-neutral-800 shadow-2xl relative">
            {status === 'success' ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-normal uppercase text-white font-['Oswald'] tracking-wide">
                  ¡Registro Exitoso!
                </h3>
                <p className="text-neutral-300 font-serif text-base max-w-md mx-auto">
                  Hemos guardado tus datos con éxito. En breve nos pondremos en contacto contigo por WhatsApp o correo electrónico para brindarte todos los detalles y asegurar tu lugar.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-['Oswald'] text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer"
                  >
                    Registrar a otra persona
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && (
                  <div className="p-4 bg-red-950/40 border border-red-800/60 rounded flex items-center gap-3 text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-neutral-400 text-xs uppercase font-bold tracking-widest font-['Oswald']">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Roberto Martínez"
                    disabled={status === 'sending'}
                    className="w-full bg-black border border-neutral-800 py-3.5 px-4 text-white focus:outline-none focus:border-red-900 transition-colors disabled:opacity-50 text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="correo" className="block text-neutral-400 text-xs uppercase font-bold tracking-widest font-['Oswald']">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      required
                      placeholder="nombre@ejemplo.com"
                      disabled={status === 'sending'}
                      className="w-full bg-black border border-neutral-800 py-3.5 px-4 text-white focus:outline-none focus:border-red-900 transition-colors disabled:opacity-50 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="telefono" className="block text-neutral-400 text-xs uppercase font-bold tracking-widest font-['Oswald']">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      placeholder="Ej. 55 1234 5678"
                      disabled={status === 'sending'}
                      className="w-full bg-black border border-neutral-800 py-3.5 px-4 text-white focus:outline-none focus:border-red-900 transition-colors disabled:opacity-50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="curso" className="block text-neutral-400 text-xs uppercase font-bold tracking-widest font-['Oswald']">
                    Curso de Mayor Interés
                  </label>
                  <select
                    id="curso"
                    name="curso"
                    value={formData.curso}
                    onChange={handleChange}
                    disabled={status === 'sending'}
                    className="w-full bg-black border border-neutral-800 py-3.5 px-4 text-white focus:outline-none focus:border-red-900 transition-colors disabled:opacity-50 text-sm cursor-pointer"
                  >
                    <option value="Caracterización y Prostéticos de Cine">
                      Caracterización & Prostéticos de Cine
                    </option>
                    <option value="Criaturas, Monstruos y Animatrónicos">
                      Criaturas, Monstruos & Animatrónicos
                    </option>
                    <option value="Efectos Especiales de Set y Sangre">
                      Efectos Especiales de Set & Sangre
                    </option>
                    <option value="Todos los anteriores / Información general">
                      Todos los anteriores / Información general
                    </option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full py-4 bg-red-900 hover:bg-white hover:text-black text-white font-['Oswald'] font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 cursor-pointer shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando Registro...</span>
                      </>
                    ) : (
                      <>
                        <span>Solicitar Información y Preventa</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center mt-3 font-serif">
                    Tus datos están protegidos. Te notificaremos únicamente con información relevante sobre los cursos.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer minimalista */}
      <footer className="py-8 bg-black border-t border-neutral-900 text-center text-xs text-neutral-500 font-serif">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} MFX Makeup and Special Effects Mexico. Todos los derechos reservados.</p>
          <Link to="/" className="text-neutral-400 hover:text-white uppercase font-['Oswald'] tracking-widest text-[11px] transition-colors">
            Sitio Principal MFX
          </Link>
        </div>
      </footer>
    </div>
  );
}
