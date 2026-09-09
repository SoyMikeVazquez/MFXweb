import React from 'react';

// Import all images from Marcas
import logo8 from '../assets/Marcas/8.png';
import logo9 from '../assets/Marcas/9.png';
import logo10 from '../assets/Marcas/10.png';
import logo11 from '../assets/Marcas/11.png';
import logo12 from '../assets/Marcas/12.png';
import logo13 from '../assets/Marcas/13.png';

const BrandSlider = () => {
    const logos = [logo8, logo9, logo10, logo11, logo12, logo13];

    // Duplicate logos for seamless infinite loop
    const duplicatedLogos = [...logos, ...logos, ...logos, ...logos];

    return (
        <div className="bg-[#050505] py-16 border-b border-neutral-900 overflow-hidden relative">
            {/* Cinematic gradient overlays on edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>

            <div className="animate-horizontal-scroll flex items-center gap-20 px-10">
                {duplicatedLogos.map((logo, index) => (
                    <div key={index} className="flex-shrink-0 grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                        <img
                            src={logo}
                            alt={`Brand Logo ${index}`}
                            className="h-12 md:h-16 w-auto object-contain"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BrandSlider;
