import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Mic, Volume2, CheckCircle, AlertCircle, Loader2, ImageOff, ArrowRight, ArrowLeft, BookOpen, MapPin, Feather, Bookmark, Home, Headphones, X } from 'lucide-react';
import { generateSpeech, analyzePronunciation } from '../services/gemini';
import { EPISODE_ONE, COVER_IMAGE_URL } from '../constants';
import { AppState, CharacterRole, DialogueLine, SectionType, DictionaryEntry, Scene } from '../types';
import { saveProgress, saveDictionaryWord, getDictionary } from '../utils/storage';

interface JournalProps {
  apiKey: string;
}

// Runtime Cache for preloaded audio (so we don't even hit DB if already in memory this session)
const audioCache: Record<string, AudioBuffer> = {};

const Journal: React.FC<JournalProps> = ({ apiKey }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [feedback, setFeedback] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Navigation State
  const [currentSection, setCurrentSection] = useState<SectionType>(SectionType.STORY);
  const [sceneIndex, setSceneIndex] = useState(0); // Index within the story array
  const [lineIndex, setLineIndex] = useState(0);
  const [pageTurnState, setPageTurnState] = useState<'idle' | 'turning'>('idle');
  const [showCover, setShowCover] = useState(true);
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  
  // Settings State
  const [isAmbienceEnabled, setIsAmbienceEnabled] = useState(true);

  // Derived Data Helper
  const getCurrentScene = (): Scene | null => {
      if (currentSection === SectionType.STORY) return EPISODE_ONE.story[sceneIndex];
      if (currentSection === SectionType.INSIGHT) return EPISODE_ONE.culturalInsight;
      if (currentSection === SectionType.VOCAB) return EPISODE_ONE.vocabulary;
      return null;
  };
  
  const currentScene = getCurrentScene();
  const currentLine = currentScene ? currentScene.script[lineIndex] : null;

  // Slideshow State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageFading, setIsImageFading] = useState(false);
  
  const currentImage = currentScene?.images?.[currentImageIndex];

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>(''); // Store the determined MIME type
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const audioLoadingRef = useRef<Set<string>>(new Set());

  // Load dictionary on mount
  useEffect(() => {
    setDictionary(getDictionary());
  }, []);

  // --- Ambience Control (Revised) ---
  
  // 1. Initialize Audio Object once
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.5; // Increased volume from 0.1 to 0.5
    // Allow cross origin to prevent some potential CORS issues with Google assets
    audio.crossOrigin = "anonymous"; 
    ambienceRef.current = audio;

    return () => {
        if (ambienceRef.current) {
            ambienceRef.current.pause();
            ambienceRef.current = null;
        }
    };
  }, []);

  // 2. Manage Playback State
  useEffect(() => {
    const audio = ambienceRef.current;
    if (!audio) return;

    // Determine if we should be playing
    const shouldPlay = !showCover && 
                       currentSection !== SectionType.MENU && 
                       isAmbienceEnabled && 
                       !!currentScene?.ambience;

    if (shouldPlay) {
        // If the source is different, update and load
        if (currentScene?.ambience && audio.src !== currentScene.ambience) {
            audio.src = currentScene.ambience;
            audio.load();
        }
        
        // Attempt to play
        // We use a small timeout to prevent rapid play/pause conflicts during React render cycles
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play might be blocked until user interacts with the page
                // or if the browser doesn't support the format (OGG on older Safari)
                console.warn("Ambience play prevented:", error);
            });
        }
    } else {
        // Pause if we shouldn't be playing
        audio.pause();
    }
  }, [currentScene, showCover, currentSection, isAmbienceEnabled]);


  // --- Audio Preloading (Smart Lookahead) ---
  useEffect(() => {
    if (!apiKey || !currentScene || !currentLine) return;

    const loadAudioForLine = async (line: DialogueLine) => {
      if (line.role === CharacterRole.CARMEN && currentSection !== SectionType.VOCAB) return;
      // In Vocab mode, even Carmen lines might want a reference audio (or we just skip it)
      
      const cacheKey = `${line.id}-${line.role}`;
      // Check Memory Cache first
      if (audioCache[cacheKey] || audioLoadingRef.current.has(cacheKey)) return;

      try {
        audioLoadingRef.current.add(cacheKey);
        // Use a different voice for 'Narrator' vs 'Mateo'
        let voice = 'Puck';
        if (line.role === CharacterRole.NARRATOR) voice = 'Fenrir';
        else if (line.role === CharacterRole.MATEO) voice = 'Charon';

        // Check Persistent DB Cache via generateSpeech's new parameter
        const uniqueStorageKey = `tts_${line.id}_${voice}`;
        const buffer = await generateSpeech(line.spanish, voice, uniqueStorageKey);
        
        if (buffer) audioCache[cacheKey] = buffer;
      } catch (e: any) {
         console.warn(`Failed to preload ${line.id}`, e);
      } finally {
        audioLoadingRef.current.delete(cacheKey);
      }
    };

    const managePreload = async () => {
        await loadAudioForLine(currentLine);
        // Look ahead
        const nextLineIdx = lineIndex + 1;
        if (nextLineIdx < currentScene.script.length) {
             setTimeout(() => loadAudioForLine(currentScene.script[nextLineIdx]), 500);
        }
    };

    managePreload();

  }, [apiKey, currentScene, lineIndex, currentSection]);

  // --- Slideshow Logic ---
  useEffect(() => {
    setCurrentImageIndex(0); 
  }, [currentScene?.id]);

  useEffect(() => {
    if (!currentScene || currentScene.images.length <= 1) return;

    const interval = setInterval(() => {
        setIsImageFading(true);
        setTimeout(() => {
            setCurrentImageIndex(prev => (prev + 1) % currentScene.images.length);
            setIsImageFading(false);
        }, 500); 
    }, 4000); 

    return () => clearInterval(interval);
  }, [currentScene?.images.length, currentScene?.id]);

  useEffect(() => {
    setFeedback(null);
  }, [lineIndex, sceneIndex, currentSection]);

  // --- Actions ---

  const handleOpenBook = () => {
    setPageTurnState('turning');
    setTimeout(() => setShowCover(false), 600);
    setTimeout(() => setPageTurnState('idle'), 650);
  };

  const handlePlayAudio = async () => {
    if (appState !== AppState.IDLE || !currentLine) return;
    
    setAppState(AppState.PLAYING_AUDIO);
    try {
      const cacheKey = `${currentLine.id}-${currentLine.role}`;
      let buffer = audioCache[cacheKey];

      // Voice selection logic
      let voice = 'Puck';
      if (currentLine.role === CharacterRole.NARRATOR) voice = 'Fenrir';
      else if (currentLine.role === CharacterRole.MATEO) voice = 'Charon';

      if (!buffer) {
        // Not in memory, fetch from DB or API
        const uniqueStorageKey = `tts_${currentLine.id}_${voice}`;
        buffer = await generateSpeech(currentLine.spanish, voice, uniqueStorageKey) as AudioBuffer;
        
        if (buffer) audioCache[cacheKey] = buffer;
      }
      
      if (buffer) {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        source.onended = () => setAppState(AppState.IDLE);
      } else {
        setAppState(AppState.IDLE);
      }
    } catch (e: any) {
      console.error(e);
      setAppState(AppState.IDLE);
    }
  };

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'touchstart') e.preventDefault();
    if (appState !== AppState.IDLE || isRecording) return;

    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // Safari
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      mimeTypeRef.current = mimeType;
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
      };

      mediaRecorder.onstop = async () => {
        // Use the mimeType we determined, or fallback to the recorder's actual type
        const type = mimeTypeRef.current || mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        setAppState(AppState.ANALYZING);
        
        const result = await analyzePronunciation(audioBlob, currentLine!.spanish);
        setFeedback(result);
        setAppState(AppState.IDLE);
        stream.getTracks().forEach(track => track.stop());

        // Check if the result indicates quota exceeded
        if (currentSection === SectionType.VOCAB && result.score > 60) {
            // Save to dictionary if practicing Vocab
            const entry: DictionaryEntry = {
                spanish: currentLine!.spanish,
                english: currentLine!.english,
                dateAdded: Date.now()
            };
            saveDictionaryWord(entry);
            setDictionary(getDictionary());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAppState(AppState.RECORDING);
    } catch (err) {
      console.error(err);
      setAppState(AppState.IDLE);
    }
  };

  const stopRecording = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'touchend') e.preventDefault();
    if (!isRecording || !mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const navigateToSection = (section: SectionType) => {
      setPageTurnState('turning');
      setTimeout(() => {
          setCurrentSection(section);
          setSceneIndex(0);
          setLineIndex(0);
          setFeedback(null);
          setPageTurnState('idle');
      }, 600);
  };

  const handleNextLine = () => {
    if (!currentScene) return;

    if (lineIndex < currentScene.script.length - 1) {
        setLineIndex(prev => prev + 1);
    } else {
        // End of Scene logic
        if (currentSection === SectionType.STORY) {
            if (sceneIndex < EPISODE_ONE.story.length - 1) {
                // Next Story Scene
                handleTurnPage(true);
            } else {
                // End of Episode -> Go to Menu
                navigateToSection(SectionType.MENU);
                saveProgress('completed_ep1');
            }
        } else {
            // End of Insight or Vocab -> Return to Menu
            navigateToSection(SectionType.MENU);
        }
    }
  };

  const handlePrevLine = () => {
    if (lineIndex > 0) {
        setLineIndex(prev => prev - 1);
    } else if (currentSection === SectionType.STORY && sceneIndex > 0) {
        handleTurnPage(false);
    } else if (currentSection !== SectionType.STORY) {
        // If we are at the beginning of Insight or Vocab, go back to Menu
        navigateToSection(SectionType.MENU);
    }
  };

  const handleTurnPage = (forward: boolean) => {
      setPageTurnState('turning');
      setTimeout(() => {
          if (forward) {
             setSceneIndex(prev => prev + 1);
             setLineIndex(0);
          } else {
             setSceneIndex(prev => prev - 1);
             setLineIndex(EPISODE_ONE.story[sceneIndex - 1].script.length - 1);
          }
          setPageTurnState('idle');
      }, 600);
  };

  // --- Views ---

  if (showCover) {
    return (
      <div 
        className={`relative w-full max-w-md md:max-w-2xl aspect-[3/4] bg-white rounded-r-xl rounded-l-sm flex flex-col overflow-hidden z-10 transition-all duration-700 ease-in-out cursor-pointer group ${pageTurnState === 'turning' ? 'opacity-0 translate-x-[-20%] rotate-y-12' : 'opacity-100'}`}
        onClick={handleOpenBook}
        style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0">
           <img src={COVER_IMAGE_URL} className="w-full h-full object-cover" alt="Cover" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-end p-8 pb-12 text-center items-center">
            <h1 className="font-serif text-4xl md:text-6xl text-white font-bold tracking-wide mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Carmen In<br/>Madrid
            </h1>
            <div className="w-12 h-1 bg-white/50 rounded-full mb-6"></div>
            <p className="font-sans text-xs text-white/90 uppercase tracking-[0.3em] mb-12 animate-pulse drop-shadow-md font-bold">
                Tap to Begin
            </p>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/20 to-transparent z-20"></div>
      </div>
    );
  }

  // --- Mission Report / Menu View ---
  if (currentSection === SectionType.MENU) {
      return (
        <div className={`relative w-full max-w-3xl aspect-auto md:aspect-[3/2] bg-[#FAFAFA] rounded-xl flex flex-col items-center justify-center p-8 md:p-12 shadow-journal overflow-hidden z-10 transition-all duration-700 ${pageTurnState === 'turning' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="absolute inset-0 border-8 border-white pointer-events-none z-20 rounded-xl"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-oak-light to-oak-dark opacity-50"></div>
            
            <div className="text-center mb-8">
                <h3 className="text-gold-muted font-sans font-bold tracking-[0.3em] uppercase text-xs mb-3">Episode Complete</h3>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-2">¡Felicidades!</h2>
                <p className="text-gray-500 italic font-serif max-w-lg mx-auto">
                    You have arrived in Madrid. Your journey has just begun. What would you like to do next?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <button 
                    onClick={() => navigateToSection(SectionType.INSIGHT)}
                    className="group relative h-40 bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all text-left flex flex-col justify-between overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-muted/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <MapPin className="w-8 h-8 text-teal-muted mb-2" />
                    <div>
                        <h4 className="font-bold text-ink font-serif text-xl">Cultural Insight</h4>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">El Invernadero</p>
                    </div>
                </button>

                <button 
                    onClick={() => navigateToSection(SectionType.VOCAB)}
                    className="group relative h-40 bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all text-left flex flex-col justify-between overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-aperol/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <Bookmark className="w-8 h-8 text-aperol mb-2" />
                    <div>
                        <h4 className="font-bold text-ink font-serif text-xl">Vocabulary Spotlight</h4>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Review & Practice</p>
                    </div>
                </button>
            </div>

            <button 
                onClick={() => navigateToSection(SectionType.STORY)}
                className="mt-8 text-gray-400 hover:text-ink flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors"
            >
                <Home className="w-4 h-4" /> Replay Episode
            </button>
        </div>
      );
  }

  // --- Main View (Story, Insight, Vocab) ---
  
  if (!currentScene || !currentLine) return null; // Safety

  const isCarmen = currentLine.role === CharacterRole.CARMEN;
  const isNarrator = currentLine.role === CharacterRole.NARRATOR;
  // In Vocab mode, everyone can practice Narrator lines too if they want, but mainly Carmen
  const canRecord = isCarmen || isNarrator || currentSection === SectionType.VOCAB;
  const showListen = !isCarmen || currentSection === SectionType.VOCAB; 

  return (
    <div className={`relative w-full max-w-none md:max-w-7xl md:aspect-[3/2] bg-white rounded-xl flex flex-col md:flex-row overflow-hidden z-10 transition-all duration-700 ${pageTurnState === 'turning' ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        
      {/* Book Center Fold */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 -ml-6 z-20 book-spine pointer-events-none"></div>

      {/* Dictionary Sidebar (Overlay) */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-80 bg-paper z-40 shadow-2xl transform transition-transform duration-300 ${showDictionary ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                  <h3 className="font-serif font-bold text-xl text-ink">My Dictionary</h3>
                  <button onClick={() => setShowDictionary(false)} className="p-2 hover:bg-gray-200 rounded-full text-ink">
                      <X className="w-6 h-6" />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4">
                  {dictionary.length === 0 ? (
                      <div className="text-center text-gray-400 mt-10">
                          <Feather className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm px-4">
                              Go to <strong>Menu &gt; Vocabulary Spotlight</strong> to practice. 
                              High scoring words (80%+) are automatically saved here!
                          </p>
                      </div>
                  ) : (
                      dictionary.map((entry, i) => (
                          <div key={i} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                              <p className="font-bold text-ink text-lg">{entry.spanish}</p>
                              <p className="text-gray-500 italic text-sm">{entry.english}</p>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* Left Page: Visual */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-full p-0 md:p-12 border-b md:border-b-0 md:border-r border-gray-200 relative bg-[#FAFAFA]">
        <div className="w-full h-full bg-white shadow-inner flex items-center justify-center overflow-hidden border border-gray-100 relative group transition-opacity duration-500">
          {currentImage ? (
            <img 
                key={currentImage} 
                src={currentImage} 
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                alt={`Scene: ${currentScene.title}`} 
                className={`w-full h-full object-cover sepia-[0.15] contrast-[1.05] transition-opacity duration-500 ${isImageFading ? 'opacity-80' : 'opacity-100'}`} 
            />
          ) : (
             <div className="flex flex-col items-center justify-center p-6 text-center">
                <ImageOff className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-gray-400 font-serif italic text-sm">Image unavailable</p>
             </div>
          )}
          
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]"></div>
          
          {/* Metadata Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase text-ink/70 shadow-sm flex items-center gap-2 z-10">
             {currentSection === SectionType.STORY ? (
                 <><MapPin className="w-3 h-3" /> {currentScene.location}</>
             ) : (
                 <><Feather className="w-3 h-3" /> {currentSection}</>
             )}
          </div>
          
          {/* Mobile Dictionary Toggle - Moved Here */}
          <button 
                onClick={() => setShowDictionary(true)}
                className="md:hidden absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full text-ink/70 shadow-sm hover:text-ink transition-colors z-30"
            >
                <Bookmark className="w-4 h-4" />
          </button>
        </div>
        
        {/* Dictionary Toggle (Desktop) */}
        <button 
            onClick={() => setShowDictionary(!showDictionary)}
            className="hidden md:flex absolute bottom-4 left-4 text-gray-400 hover:text-ink items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
            <Bookmark className="w-4 h-4" /> Dictionary
        </button>
      </div>

      {/* Right Page: Interaction */}
      <div className="w-full md:w-1/2 h-auto md:h-full p-6 md:p-16 flex flex-col justify-center relative bg-[#FAFAFA]">

        <div className="flex-1 flex flex-col justify-center space-y-4 md:space-y-8">
            <div className="space-y-2 border-b-2 border-oak-light pb-4 md:pb-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-gold-muted uppercase font-sans">
                        {currentSection === SectionType.STORY ? `Episode 01 • Scene ${sceneIndex + 1}` : currentScene.title}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                         {/* Mission Report / Home Button - ALWAYS VISIBLE */}
                         <button 
                            onClick={() => navigateToSection(SectionType.MENU)}
                            className="text-gray-400 hover:text-ink transition-colors flex items-center gap-1 group"
                            title="Mission Report / Menu"
                         >
                             <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                         </button>
                         
                         {/* Ambience Toggle */}
                         {currentScene.ambience && (
                            <button 
                                onClick={() => setIsAmbienceEnabled(!isAmbienceEnabled)}
                                className={`transition-colors flex items-center gap-1 group ${isAmbienceEnabled ? 'text-teal-muted' : 'text-gray-300 hover:text-gray-400'}`}
                                title={isAmbienceEnabled ? "Mute Ambience" : "Play Ambience"}
                            >
                                <Headphones className="w-4 h-4" />
                            </button>
                         )}

                        <span className="text-[10px] font-bold bg-ink/5 text-ink/50 px-2 py-1 rounded uppercase tracking-wider">
                            {currentLine.role}
                        </span>
                    </div>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-ink font-bold leading-tight">
                    {currentLine.spanish}
                </h1>
                <p className="text-base md:text-lg text-gray-500 font-serif italic font-light mt-1">
                    {currentLine.english}
                </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 md:gap-4 pt-2 md:pt-4 select-none flex-wrap">
                
                {showListen && (
                    <button 
                        onClick={handlePlayAudio}
                        disabled={appState === AppState.PLAYING_AUDIO || isRecording}
                        className={`group relative flex-1 md:flex-none justify-center px-4 md:px-6 py-3 md:py-3 bg-ink text-white rounded-full flex items-center gap-2 md:gap-3 transition-transform active:scale-95 disabled:opacity-50 shadow-lg hover:shadow-xl hover:bg-gray-800`}
                    >
                    {appState === AppState.PLAYING_AUDIO ? (
                        <Volume2 className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                    ) : (
                        <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                    )}
                    <span className="font-sans font-bold text-xs md:text-sm tracking-wide whitespace-nowrap">
                        LISTEN
                    </span>
                    </button>
                )}

                {canRecord && (
                    <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={appState === AppState.ANALYZING || appState === AppState.PLAYING_AUDIO}
                        className={`group flex-1 md:flex-none justify-center px-4 md:px-6 py-3 rounded-full flex items-center gap-2 md:gap-3 transition-all active:scale-95 shadow-lg border-2
                            ${isRecording 
                                ? 'bg-red-500 border-red-500 text-white shadow-red-500/30 scale-105' 
                                : 'bg-white border-gray-200 text-ink hover:border-teal-muted'
                            } disabled:opacity-70 disabled:active:scale-100 cursor-pointer select-none`}
                    >
                    {appState === AppState.ANALYZING ? (
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    ) : (
                        <Mic className={`w-4 h-4 md:w-5 md:h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                    )}
                    <span className="font-sans font-bold text-xs md:text-sm tracking-wide whitespace-nowrap">
                        {appState === AppState.ANALYZING 
                            ? 'ANALYZING...' 
                            : (isRecording 
                                ? 'LISTENING...' 
                                : (currentSection === SectionType.VOCAB ? 'PRACTICE' : (isCarmen ? 'HOLD TO SPEAK' : 'PRACTICE'))
                              )
                        }
                    </span>
                    </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={handlePrevLine}
                        disabled={currentSection === SectionType.STORY && sceneIndex === 0 && lineIndex === 0}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-ink hover:border-ink transition-colors disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400"
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                        onClick={handleNextLine}
                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-ink hover:border-ink transition-colors disabled:opacity-30`}
                    >
                        {lineIndex < currentScene.script.length - 1 ? (
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-teal-muted" />
                        )}
                    </button>
                </div>
            </div>
            
             <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest pl-2 h-4 min-h-[1rem]">
                {isRecording ? "Release to finish" : (canRecord ? "Hold button to speak" : "")}
            </p>
        </div>

        {/* Feedback Section */}
        <div className={`mt-4 md:mt-8 min-h-[120px] md:min-h-[140px] transition-opacity duration-500 ${feedback ? 'opacity-100' : 'opacity-0'}`}>
            {feedback && (
                <div className="bg-oak-light/30 rounded-xl p-4 md:p-5 border border-oak-dark/20 relative">
                     <div className="absolute -top-3 left-4 md:left-6 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm flex items-center gap-2">
                         {feedback.score > 80 ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                         <span className="text-[10px] font-bold font-sans">SCORE: {feedback.score}%</span>
                     </div>
                     <p className="text-ink font-serif text-base leading-relaxed">"{feedback.feedback}"</p>
                     {currentSection === SectionType.VOCAB && feedback.score > 80 && (
                         <div className="mt-2 text-[10px] text-teal-muted font-bold uppercase tracking-wide flex items-center gap-1">
                             <Bookmark className="w-3 h-3" /> Added to Dictionary
                         </div>
                     )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Journal;