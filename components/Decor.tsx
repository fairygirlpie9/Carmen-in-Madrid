import React from 'react';

// Using simple SVG/CSS approximations for the aesthetic since we can't load external arbitrary images easily without generation
// In a real production app, these would be high-res transparent PNGs.

export const AperolSpritz: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative w-24 h-32 ${className}`}>
    <div className="absolute inset-0 bg-orange-400/80 rounded-b-3xl rounded-t-lg shadow-lg border border-white/20 backdrop-blur-sm overflow-hidden">
        {/* Ice cubes */}
        <div className="absolute top-4 left-4 w-6 h-6 bg-white/30 rotate-12 rounded-sm blur-[1px]"></div>
        <div className="absolute top-10 right-4 w-5 h-5 bg-white/30 -rotate-6 rounded-sm blur-[1px]"></div>
        {/* Liquid Gradient */}
        <div className="absolute bottom-0 w-full h-3/4 bg-gradient-to-t from-aperol to-orange-300 opacity-90"></div>
        {/* Orange Slice */}
        <div className="absolute -top-2 -right-4 w-16 h-16 bg-orange-500 rounded-full border-4 border-orange-200"></div>
    </div>
    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/10 blur-sm rounded-full"></div>
  </div>
);

export const CinnamonBundle: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative w-32 h-20 ${className}`}>
    {/* Turban/Cloth Base */}
    <div className="absolute inset-0 bg-teal-muted rounded-full opacity-90 blur-[0.5px] rotate-3 shadow-md"></div>
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-30 mix-blend-multiply rounded-full rotate-3"></div>
    
    {/* Cinnamon Sticks */}
    <div className="absolute top-2 left-4 w-24 h-3 bg-amber-800 rotate-[-10deg] rounded-full shadow-sm"></div>
    <div className="absolute top-5 left-3 w-24 h-3 bg-amber-700 rotate-[-15deg] rounded-full shadow-sm"></div>
    <div className="absolute top-8 left-5 w-24 h-3 bg-amber-900 rotate-[-5deg] rounded-full shadow-sm"></div>
  </div>
);

export const Ticket: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-32 h-16 bg-[#eaddcf] shadow-md -rotate-12 border-dashed border-2 border-gray-300 p-2 flex flex-col justify-between ${className}`}>
    <div className="text-[8px] font-mono tracking-widest text-gray-500 uppercase text-center border-b border-gray-300 pb-1">RENFE / ATOCHA</div>
    <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-ink font-mono">MADRID</span>
        <div className="w-8 h-8 border border-ink rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold">1A</span>
        </div>
    </div>
  </div>
);
