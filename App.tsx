import React, { useState, useEffect } from 'react';
import Journal from './components/Journal';
import { getAsset, saveAsset } from './utils/storage';
import { Loader2, Download } from 'lucide-react';

// Updated to the user-provided direct image link (Background)
const STATIC_BACKGROUND_URL = "https://i.ibb.co/sJ5D40wC/slow-burn-madrid-background-1.png"; 
const STORAGE_KEY_BG = 'slow_burn_bg_image_v3'; 

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
        setApiKey(process.env.API_KEY);
    }
    setBackgroundUrl(STATIC_BACKGROUND_URL);
  }, []);

  const handleDownloadBackground = () => {
    if (!backgroundUrl) return;
    window.open(backgroundUrl, '_blank');
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-12 relative overflow-hidden perspective-1000 bg-[#F5F0EB]"
    >
      
      {/* Scaled Background Layer */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
        style={{
            backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.2)',
            opacity: backgroundUrl ? 1 : 0
        }}
      />

      {/* Subtle Lighting Overlay to blend UI with the illustration */}
      <div className="absolute inset-0 pointer-events-none bg-white/10 mix-blend-soft-light z-20"></div>

      <div className="relative max-w-[95vw] xl:max-w-7xl w-full flex justify-center items-center z-30">
        
        {/* The Journal */}
        <Journal apiKey={apiKey} />

      </div>

      {/* Footer / Credits */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 z-30 mix-blend-multiply">
        <span className="text-ink/50 font-sans text-xs tracking-widest uppercase font-bold">
            CARMEN IN MADRID - EPISODE 1
        </span>
        {backgroundUrl && (
            <button 
                onClick={handleDownloadBackground}
                className="flex items-center gap-1 text-[10px] text-ink/40 hover:text-ink/80 transition-colors uppercase font-bold tracking-widest border border-ink/20 px-2 py-1 rounded-full hover:bg-white/50"
                title="View Background Image"
            >
                <Download className="w-3 h-3" />
                <span>Scene</span>
            </button>
        )}
      </div>
      
    </div>
  );
};

export default App;