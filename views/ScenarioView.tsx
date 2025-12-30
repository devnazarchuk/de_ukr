import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { ChatMessage, UserProfile, Word, WordCategory } from '../types';
import { startScenario, sendMessageToScenario, getHintForScenario, ScenarioStartResponse, WordPair, ScenarioTask, generateSpeech } from '../services/geminiService';
import { Send, Mic, Sparkles, Volume2, RotateCcw, MessageCircle, Headphones, X, Play, RotateCw, Check, Languages, Lightbulb, ListTodo, CheckCircle2, ArrowRight, BookPlus, ThumbsUp, ThumbsDown, BookOpen, User, Pause, RefreshCw, ChevronRight, Loader2, StopCircle } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import LiquidLoader from '../components/LiquidLoader';

interface ScenarioViewProps {
  userProfile: UserProfile;
  addWords: (words: Word[]) => void;
}

enum PracticeMode {
  SELECTION = 'SELECTION',
  CHAT = 'CHAT',
  SPEAK = 'SPEAK',
  LISTEN = 'LISTEN'
}

// --- SUB-COMPONENTS ---

const BottomSheet = ({ title, children, onClose, isOpen }: { title: string, children?: React.ReactNode, onClose: () => void, isOpen: boolean }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-[200] flex justify-end flex-col" 
      style={{backgroundColor: 'rgba(0,0,0,0.3)'}} 
      onClick={onClose}
    >
        <div 
          className="bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[70vh] overflow-y-auto" 
          onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                   <X size={20} className="text-gray-600"/>
                </button>
            </div>
            {children}
        </div>
        <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  )
}

const ModeSelection = ({ onSelect, t }: { onSelect: (mode: PracticeMode) => void, t: any }) => (
  <Layout title={t('scen_title')}>
    <div className="p-6 space-y-4">
      <div 
        onClick={() => onSelect(PracticeMode.SPEAK)}
        className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:bg-blue-100 transition-colors"
      >
        <div className="bg-blue-500 text-white p-3 rounded-full">
           <Mic size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{t('scen_mode_speak')}</h3>
          <p className="text-sm text-gray-500">{t('scen_mode_speak_desc')}</p>
        </div>
      </div>

      <div 
        onClick={() => onSelect(PracticeMode.LISTEN)}
        className="bg-purple-50 border border-purple-100 p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:bg-purple-100 transition-colors"
      >
        <div className="bg-purple-500 text-white p-3 rounded-full">
           <Headphones size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{t('scen_mode_listen')}</h3>
          <p className="text-sm text-gray-500">{t('scen_mode_listen_desc')}</p>
        </div>
      </div>

      <div 
        onClick={() => onSelect(PracticeMode.CHAT)}
        className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:bg-indigo-100 transition-colors"
      >
        <div className="bg-indigo-500 text-white p-3 rounded-full">
           <MessageCircle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{t('scen_mode_chat')}</h3>
          <p className="text-sm text-gray-500">{t('scen_mode_chat_desc')}</p>
        </div>
      </div>
    </div>
  </Layout>
);

interface ClickableWordProps {
  word: string;
  translation?: string;
  t: any;
  onAdd: (german: string, ukrainian: string) => void;
}

const ClickableWord: React.FC<ClickableWordProps> = ({ word, translation, t, onAdd }) => {
  const [showTrans, setShowTrans] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (translation) {
      onAdd(word, translation);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <span 
      onClick={(e) => { e.stopPropagation(); setShowTrans(!showTrans); }}
      className={`relative cursor-pointer rounded px-0.5 mx-0.5 transition-colors inline-block border-b border-dashed border-blue-300 ${showTrans ? 'bg-purple-200 text-purple-900' : 'hover:bg-blue-50'}`}
    >
      {word}
      {showTrans && (
        <span className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 animate-fade-in flex items-center gap-3">
          <span>{translation || t('speak_word_trans_placeholder')}</span>
          <button 
             onClick={handleAdd}
             className="p-1 hover:bg-white/20 rounded-full transition-colors"
             title={t('voc_add')}
          >
             {added ? <Check size={14} className="text-green-400" /> : <BookPlus size={14} />}
          </button>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></span>
        </span>
      )}
    </span>
  );
};

// Extracted TopicSelection to prevent re-renders losing focus
const TopicSelection = ({ 
  onConfirm, 
  title, 
  loading, 
  topic, 
  setTopic, 
  t, 
  onBack 
}: { 
  onConfirm: () => void, 
  title: string, 
  loading?: boolean, 
  topic: string, 
  setTopic: (t: string) => void, 
  t: any,
  onBack: () => void
}) => {
  if (loading) {
    return (
      <Layout 
        title={title} 
        action={<button onClick={onBack}><X className="text-gray-500"/></button>}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
           <LiquidLoader text={t('scen_loading')} />
           <p className="text-gray-500 text-sm animate-pulse">Creating your scenario...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
        title={title} 
        action={<button onClick={onBack}><X className="text-gray-500"/></button>}
    >
      <div className="p-6 flex flex-col items-center justify-center h-full space-y-8">
        <div className="bg-indigo-50 p-6 rounded-full">
          <MessageCircle size={48} className="text-indigo-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{t('scen_choose')}</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            {t('scen_desc')}
          </p>
        </div>
        
        <div className="w-full space-y-4">
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('scen_placeholder')}
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          />
          
          <button 
            onClick={onConfirm}
            disabled={!topic.trim() || loading}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center"
          >
            {t('scen_start')}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {['Restaurant', 'Hotel', 'Arzt', 'Bahnof'].map(tag => (
            <button 
              key={tag} 
              onClick={() => setTopic(tag)}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const ScenarioIntro = ({ topic, data, onStart, onBack, t }: { topic: string, data: ScenarioStartResponse, onStart: () => void, onBack: () => void, t: any }) => {
  return (
    <Layout title={t('scen_title')} action={<button onClick={onBack}><X className="text-gray-500"/></button>}>
       <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-fade-in">
          <div className="bg-blue-100 p-6 rounded-full text-blue-600">
             <MessageCircle size={48} />
          </div>
          
          <div className="space-y-4 max-w-sm">
             <h2 className="text-2xl font-bold text-gray-900">{topic}</h2>
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                <p className="text-gray-600 leading-relaxed text-sm">
                   {data.description}
                </p>
             </div>
          </div>

          <button 
             onClick={onStart}
             className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
             {t('scen_start')} <ArrowRight size={20}/>
          </button>
       </div>
    </Layout>
  )
}

const ScenarioSuccess = ({ 
    onClose, 
    onRetry, 
    onListening, 
    tasksCompleted, 
    totalTasks, 
    wordsPracticed, 
    t 
}: { 
    onClose: () => void, 
    onRetry: () => void,
    onListening: () => void,
    tasksCompleted: number,
    totalTasks: number,
    wordsPracticed: number,
    t: any 
}) => (
    <div className="fixed inset-0 z-[110] bg-[#F0F9FF] flex flex-col h-full animate-fade-in font-sans">
        {/* Header */}
        <div className="flex justify-between items-center p-4 pt-safe">
            <button onClick={onClose}><X size={24} className="text-gray-900" /></button>
            <div className="flex items-center space-x-2">
                 <span className="font-bold text-gray-900 text-lg">Speak</span>
                 <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
            </div>
            <button onClick={onRetry} className="text-blue-600 font-semibold text-sm">Retry</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center">
            
            <h1 className="text-3xl font-extrabold text-gray-900 mb-10 mt-4 text-center tracking-tight">Keep practicing!</h1>

            {/* Stats Row */}
            <div className="flex justify-between w-full mb-10">
                {/* Task Stat */}
                <div className="flex flex-col items-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex flex-col items-center justify-center mb-3 text-blue-600 relative">
                         <CheckCircle2 className="mb-1" size={24} strokeWidth={2.5} />
                         <span className="text-lg font-bold text-gray-900 leading-none">{tasksCompleted}/{totalTasks}</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 text-center">Tasks completed</span>
                </div>
                
                 {/* Speaking Score */}
                <div className="flex flex-col items-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex flex-col items-center justify-center mb-3 text-orange-500">
                         <div className="relative">
                            <User size={24} strokeWidth={2.5} />
                            <Volume2 size={12} className="absolute -right-2 top-0" strokeWidth={3} />
                         </div>
                         <span className="text-lg font-bold text-gray-900 leading-none mt-1">5/5</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 text-center flex items-center justify-center gap-1">
                        Speaking score <div className="rounded-full border border-gray-400 w-3 h-3 flex items-center justify-center text-[8px] text-gray-500 font-serif">i</div>
                    </span>
                </div>

                 {/* Words Practiced */}
                <div className="flex flex-col items-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex flex-col items-center justify-center mb-3 text-purple-600">
                         <BookOpen className="mb-1" size={24} strokeWidth={2.5} />
                         <span className="text-lg font-bold text-gray-900 leading-none">{wordsPracticed}</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 text-center">Words practiced</span>
                </div>
            </div>

            {/* Tip Card */}
            <div className="w-full bg-white rounded-3xl p-6 shadow-sm mb-10 text-left border border-white">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Practice leads to progress</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed font-medium">
                   Every bit of practice helps you get more comfortable speaking. Use Hints to guide you through the conversation.
                </p>
            </div>

            {/* Feedback */}
            <div className="mb-8 text-center w-full">
                <p className="text-slate-600 font-semibold mb-6 text-sm">What did you think of this activity?</p>
                <div className="flex justify-center space-x-8">
                    <button className="transition-transform active:scale-90">
                        <ThumbsUp size={28} className="text-gray-400 hover:text-gray-600" strokeWidth={2} />
                    </button>
                    <button className="transition-transform active:scale-90">
                        <ThumbsDown size={28} className="text-gray-400 hover:text-gray-600" strokeWidth={2} />
                    </button>
                </div>
            </div>

        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-white/0 pb-safe w-full max-w-md mx-auto space-y-3 mb-2">
            <button 
                onClick={onRetry} 
                className="w-full bg-blue-600 text-white py-4 rounded-full font-bold text-lg shadow-blue-200 shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
                Next speaking activity
            </button>
            <button 
                onClick={onListening}
                className="w-full bg-blue-100 text-blue-600 py-4 rounded-full font-bold text-lg hover:bg-blue-200 active:scale-95 transition-all"
            >
                Try a listening activity
            </button>
        </div>
    </div>
);

// --- Custom Audio Hook for Real Audio ---
const useRealAudio = () => {
    const [audioCache, setAudioCache] = useState<Record<string, AudioBuffer>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentText, setCurrentText] = useState<string | null>(null);
    
    // Audio Context (initialized lazily)
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    // Queue for sequential processing
    const queueRef = useRef<string[]>([]);
    const processingRef = useRef(false);

    const getContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        return audioContextRef.current;
    }

    const decodeAudioData = async (arrayBuffer: ArrayBuffer, ctx: AudioContext): Promise<AudioBuffer> => {
        // Raw PCM decoding helper since Gemini sends raw PCM
        const dataInt16 = new Int16Array(arrayBuffer);
        const sampleRate = 24000; 
        const numChannels = 1;
        
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    const fetchAndCache = async (text: string) => {
        if (audioCache[text]) return audioCache[text];
        
        try {
            const arrayBuffer = await generateSpeech(text);
            if (!arrayBuffer) return null;
            
            const ctx = getContext();
            const buffer = await decodeAudioData(arrayBuffer, ctx);
            
            setAudioCache(prev => ({...prev, [text]: buffer}));
            return buffer;
        } catch (e) {
            console.error("Failed to fetch/cache audio", e);
            return null;
        }
    };

    const processQueue = async () => {
        if (processingRef.current) return;
        processingRef.current = true;

        while (queueRef.current.length > 0) {
            const text = queueRef.current.shift();
            if (text && !audioCache[text]) {
                await fetchAndCache(text);
                // Artificial delay to prevent 429 rate limiting
                await new Promise(r => setTimeout(r, 500));
            }
        }

        processingRef.current = false;
    };

    const preload = (texts: string[]) => {
        const uniqueTexts = texts.filter(t => t && t.trim() !== '' && !audioCache[t]);
        if (uniqueTexts.length === 0) return;

        uniqueTexts.forEach(t => {
            if (!queueRef.current.includes(t)) {
                queueRef.current.push(t);
            }
        });
        
        processQueue();
    };

    const playText = async (text: string) => {
        try {
            // Stop previous
            stop();

            const ctx = getContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            let buffer = audioCache[text];

            if (!buffer) {
                setIsLoading(true);
                setCurrentText(text);
                // Attempt direct fetch if needed, bypassing queue for immediate user interaction
                buffer = await fetchAndCache(text) as AudioBuffer;
                setIsLoading(false);
                if (!buffer) return;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => {
                setIsPlaying(false);
                setCurrentText(null);
            };
            
            sourceRef.current = source;
            source.start();
            setIsPlaying(true);
            setCurrentText(text);

        } catch (e) {
            console.error("Play error", e);
            setIsLoading(false);
            setIsPlaying(false);
            setCurrentText(null);
        }
    };

    const stop = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e){}
            setIsPlaying(false);
            setCurrentText(null);
        }
    }

    const toggle = (text: string) => {
        if (isPlaying && currentText === text) {
            stop();
        } else {
            playText(text);
        }
    }

    return { playText, stop, toggle, isPlaying, isLoading, preload, currentText };
};

const SpeakingInterface = ({ 
    onClose, 
    onSwitchMode,
    t, 
    initialData, 
    userProfile, 
    addWords 
}: { 
    onClose: () => void, 
    onSwitchMode: (mode: PracticeMode) => void,
    t: any, 
    initialData: ScenarioStartResponse, 
    userProfile: UserProfile, 
    addWords: (words: Word[]) => void 
}) => {
  const [history, setHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [currentLine, setCurrentLine] = useState(initialData.message);
  const [currentTranslation, setCurrentTranslation] = useState(initialData.translation);
  const [currentWordPairs, setCurrentWordPairs] = useState<WordPair[]>(initialData.word_pairs);
  const [currentHint, setCurrentHint] = useState<string>(initialData.hint);
  
  const [isTranslationVisible, setIsTranslationVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Sheet states
  const [showTasks, setShowTasks] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [tasks, setTasks] = useState<ScenarioTask[]>(initialData.tasks);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { playText, isPlaying: isAudioPlaying, isLoading: isAudioLoading } = useRealAudio();

  useEffect(() => {
    // Scroll to bottom whenever history or current line changes
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [history, currentLine, isLoading]);

  useEffect(() => {
    if (tasks.length > 0 && tasks.every(t => t.completed)) {
        setTimeout(() => setIsCompleted(true), 1500);
    }
  }, [tasks]);

  const handleRetry = () => {
    // Reset conversation state
    setHistory([]);
    setCurrentLine(initialData.message);
    setCurrentTranslation(initialData.translation);
    setCurrentWordPairs(initialData.word_pairs);
    setCurrentHint(initialData.hint);
    setTasks(initialData.tasks);
    setIsCompleted(false);
    setIsLoading(false);
  };

  const handleRecord = () => {
    setIsRecording(true);
    // Simulate recording duration
    setTimeout(async () => {
      setIsRecording(false);
      // In a real app, this would be STT
      const userText = currentHint || "Guten Tag! Ich verstehe."; 
      
      // Add previous AI turn and User turn to history
      setHistory(prev => [
        ...prev, 
        { role: 'model', text: currentLine },
        { role: 'user', text: userText }
      ]);
      
      setIsLoading(true);
      // Send active tasks to AI to check for completion
      const aiResponse = await sendMessageToScenario(userText, tasks, userProfile.appLanguage);
      
      setCurrentLine(aiResponse.text);
      setCurrentTranslation(aiResponse.translation);
      setCurrentWordPairs(aiResponse.word_pairs);
      setCurrentHint(aiResponse.hint);
      
      // Update tasks based on AI verification
      if (aiResponse.completed_task_ids && aiResponse.completed_task_ids.length > 0) {
          setTasks(prev => prev.map(t => 
             aiResponse.completed_task_ids.includes(t.id) ? { ...t, completed: true } : t
          ));
      }
      
      setIsTranslationVisible(false); // Reset translation visibility for new message
      setShowHint(false); // Auto-close hint sheet if open
      setIsLoading(false);
    }, 2000);
  };

  // Helper to find translation for a specific word
  const getWordTranslation = (word: string) => {
    // Clean input word from punctuation for loose matching
    const cleanInput = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
    
    // 1. Exact match (preferred)
    let pair = currentWordPairs.find(p => p.word === word);
    
    // 2. Loose match (fallback)
    if (!pair) {
        pair = currentWordPairs.find(p => {
             const cleanSource = p.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
             return cleanSource === cleanInput;
        });
    }
    
    // 3. Fallback for common mismatches if AI missed it
    if (!pair && currentTranslation) {
        // Very basic fallback or just return undefined to let user guess/add
        return undefined; 
    }

    return pair ? pair.translation : undefined;
  };

  const handleAddWord = (german: string, ukrainian: string) => {
     addWords([{
         id: Date.now().toString(),
         german,
         ukrainian,
         category: WordCategory.PHRASE, // Default to phrase if unknown
         masteryLevel: 0
     }]);
  };

  if (isCompleted) {
      // Approximate word count from user's history
      const wordsPracticed = history.filter(h => h.role === 'user').reduce((acc, curr) => acc + curr.text.split(/\s+/).length, 0);

      return (
        <ScenarioSuccess 
            onClose={onClose} 
            onRetry={handleRetry}
            onListening={() => onSwitchMode(PracticeMode.LISTEN)}
            tasksCompleted={tasks.filter(t => t.completed).length}
            totalTasks={tasks.length}
            wordsPracticed={wordsPracticed}
            t={t} 
        />
      );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-100 shadow-sm z-10 safe-top">
        <button onClick={onClose}><X className="text-gray-500" /></button>
        <span className="font-bold text-gray-800">{t('scen_mode_speak')}</span>
        <div className="w-6"></div>
      </div>

      {/* Main Content - Chat Stream */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-48" ref={scrollRef}>
        <div className="space-y-6">
            
            {/* History Items (Top to Bottom) */}
            {history.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 border border-gray-100 rounded-bl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}

            {/* Current Active AI Card (Bottom of stream) */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-[2rem] p-6 shadow-md animate-fade-in relative min-h-[180px] flex flex-col justify-center my-4">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <MessageCircle size={120} />
                </div>
                
                {isLoading ? (
                    <div className="flex items-center justify-center space-x-2 text-blue-600 h-20">
                        <span className="animate-bounce w-3 h-3 bg-blue-600 rounded-full"></span>
                        <span className="animate-bounce w-3 h-3 bg-blue-600 rounded-full" style={{animationDelay: '0.2s'}}></span>
                        <span className="animate-bounce w-3 h-3 bg-blue-600 rounded-full" style={{animationDelay: '0.4s'}}></span>
                    </div>
                ) : (
                    <div className="z-10 relative">
                        {/* The Text */}
                        <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-4">
                        {currentLine.split(' ').map((word, i) => (
                            <React.Fragment key={i}>
                               <ClickableWord 
                                  word={word} 
                                  translation={getWordTranslation(word)} 
                                  t={t} 
                                  onAdd={handleAddWord}
                               />{' '}
                            </React.Fragment>
                        ))}
                        </h2>

                        {/* Full Translation Panel */}
                        {isTranslationVisible && (
                            <div className="bg-slate-50 p-4 rounded-xl text-slate-600 font-medium text-sm mb-6 border border-slate-200 animate-slide-up shadow-inner">
                                {currentTranslation}
                            </div>
                        )}

                        {/* Controls for card */}
                        <div className="flex items-center space-x-3 mt-4">
                            <button 
                                onClick={() => playText(currentLine)}
                                className="flex items-center space-x-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
                            >
                                {isAudioLoading ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                                <span>{t('speak_listen_btn')}</span>
                            </button>
                            <button 
                                onClick={() => setIsTranslationVisible(!isTranslationVisible)}
                                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors border ${isTranslationVisible ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Languages size={16} />
                                <span>{t('speak_translate_btn')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* FIXED BOTTOM AREA: Controls */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="p-4 pb-8 flex items-center justify-between max-w-md mx-auto relative">
             <button 
                onClick={() => setShowTasks(true)}
                className="flex flex-col items-center space-y-1 text-gray-400 hover:text-blue-600 transition-colors w-16"
             >
                 <div className="relative">
                     <ListTodo size={24} />
                     {tasks.every(t => t.completed) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>}
                 </div>
                 <span className="text-[10px] font-medium">{t('speak_btn_tasks')}</span>
             </button>

             {/* Large Mic Button */}
             <button 
                onClick={handleRecord}
                disabled={isLoading}
                className={`w-20 h-20 -mt-8 rounded-full flex items-center justify-center shadow-xl shadow-blue-200 transition-all transform border-4 border-white ${
                    isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
                } disabled:opacity-50 disabled:scale-100`}
             >
                 <Mic size={36} className="text-white" />
             </button>

             <button 
                onClick={() => setShowHint(true)}
                disabled={isLoading || !currentHint}
                className={`flex flex-col items-center space-y-1 transition-colors w-16 ${showHint ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
             >
                 <Sparkles size={24} />
                 <span className="text-[10px] font-medium">{t('speak_btn_hints')}</span>
             </button>
        </div>
      </div>

      {/* Hints Bottom Sheet */}
      <BottomSheet 
        title={t('scen_hint_label')} 
        isOpen={showHint} 
        onClose={() => setShowHint(false)}
      >
        <div className="space-y-4">
             <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-start gap-3">
                 <Lightbulb className="text-yellow-600 mt-1 shrink-0" size={24} />
                 <div>
                    <p className="text-lg font-medium text-gray-800 leading-relaxed">
                        {currentHint}
                    </p>
                    <p className="text-sm text-yellow-700 mt-2 font-medium opacity-80">
                        {t('speak_example')}
                    </p>
                 </div>
             </div>
             
             <button 
               onClick={() => playText(currentHint)}
               className="w-full bg-yellow-100 text-yellow-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-200 transition-colors"
             >
                {isAudioLoading ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />} {t('speak_listen_btn')}
             </button>
        </div>
      </BottomSheet>

      {/* Tasks Bottom Sheet */}
      <BottomSheet 
        title={t('speak_tasks_title')} 
        isOpen={showTasks} 
        onClose={() => setShowTasks(false)}
      >
          <div className="space-y-3">
              {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`flex items-center p-4 rounded-xl transition-colors border ${
                        task.completed ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors shrink-0 ${
                          task.completed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                      }`}>
                          {task.completed && <Check size={14} />}
                      </div>
                      <span className={`text-base font-medium ${task.completed ? 'text-green-800 line-through opacity-70' : 'text-slate-700'}`}>
                          {task.text}
                      </span>
                  </div>
              ))}
          </div>
      </BottomSheet>
    </div>
  );
};

// Updated Listening Interface
const ListeningInterface = ({ onClose, t }: { onClose: () => void, t: any }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  // Feedback can now include 'review' which shows the solution even if incorrect
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'review' | null>(null);
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [activeWordTranslation, setActiveWordTranslation] = useState<string | null>(null);
  
  // Use real audio hook
  const { toggle, playText, preload, isPlaying, isLoading: isAudioLoading, currentText } = useRealAudio();

  // Mock Exercises (Keyword Spotting)
  const exercises = [
    {
      fullText: "Guten Tag, mein Name ist Julia Weber. Ich interessiere mich sehr für die Wohnung in der Birkenstraße und wollte fragen, ob es bald einen Besichtigungstermin gibt.",
      translation: "Good day, my name is Julia Weber. I am very interested in the apartment on Birkenstraße and wanted to ask if there is a viewing appointment available soon.",
      targets: ["Besichtigungstermin", "interessiere", "Balkon", "Lage", "Möbel", "Kaution"],
      // In a real app, options would be shuffled. Here we hardcode to match screenshot layout.
      options: ["interessiere", "Balkon", "Lage", "Besichtigungstermin", "Kaution", "Möbel", "Ich", "möchte", "einen", "vereinbaren"],
      correctKeywords: ["Besichtigungstermin", "interessiere"], 
      wordPairs: {
        "Besichtigungstermin": "viewing appointment",
        "interessiere": "am interested",
        "Balkon": "balcony",
        "Lage": "location",
        "Möbel": "furniture",
        "Kaution": "deposit",
        "vereinbaren": "arrange",
        "Guten": "Good", "Tag": "day", "mein": "my", "Name": "name", "ist": "is", "Julia": "Julia", "Weber": "Weber",
        "Ich": "I", "mich": "myself", "sehr": "very", "für": "for", "die": "the", "Wohnung": "apartment",
        "in": "in", "der": "the", "Birkenstraße": "Birkenstraße", "und": "and", "wollte": "wanted", "fragen": "to ask",
        "ob": "if", "es": "it", "bald": "soon", "einen": "a", "gibt": "gives/is"
      }
    }
  ];

  const currentExercise = exercises[currentStage];
  
  // Preload audio when exercise changes
  useEffect(() => {
    preload([currentExercise.fullText, ...currentExercise.options]);
  }, [currentExercise]);

  const togglePlay = (textToPlay?: string) => {
    const text = textToPlay || currentExercise.fullText;
    toggle(text);
  };

  const playWord = (word: string, e: React.MouseEvent) => {
      e.stopPropagation();
      playText(word);
  }

  const handleSkip = () => {
    if (currentStage < exercises.length - 1) {
      setCurrentStage(prev => prev + 1);
      resetState();
    } else {
      onClose();
    }
  };

  const resetState = () => {
    setSelectedWords([]);
    setFeedback(null);
    setShowFullTranslation(false);
    setActiveWordTranslation(null);
  };

  const toggleWord = (word: string) => {
    if (feedback === 'correct' || feedback === 'review') return; 
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else {
      setSelectedWords(prev => [...prev, word]);
    }
  };

  const checkAnswer = () => {
    const demoCorrectSet = ["Besichtigungstermin", "interessiere", "Balkon"];
    const isCorrect = selectedWords.length > 0 && selectedWords.every(w => demoCorrectSet.includes(w));
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNextStage = () => {
     handleSkip();
  };

  // Visualizer bars
  const VisualizerBars = () => (
     <div className="flex items-center justify-center space-x-1 h-16 w-full max-w-[200px]">
        {[...Array(5)].map((_, i) => (
           <div 
             key={i} 
             className={`w-1.5 bg-blue-600 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-2'}`}
             style={{ 
                 height: isPlaying ? `${Math.random() * 40 + 10}px` : '8px',
                 animationDelay: `${i * 0.1}s` 
             }}
           ></div>
        ))}
     </div>
  );
  
  // SUCCESS / REVIEW VIEW
  // This view is shown if the user is correct OR if they chose to view the answer ('review')
  if (feedback === 'correct' || feedback === 'review') {
      return (
        <div className="fixed inset-0 z-[100] bg-[#F0F9FF] flex flex-col h-full font-sans">
             {/* Top Section */}
             <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                     <button onClick={onClose}><X className="text-gray-500" /></button>
                     <button onClick={handleSkip} className="text-blue-600 font-semibold">Skip</button>
                </div>
                
                <h1 className={`text-3xl font-extrabold mb-8 mt-4 ${feedback === 'correct' ? 'text-slate-900' : 'text-slate-700'}`}>
                    {feedback === 'correct' ? 'Чудово!' : 'Правильна відповідь'}
                </h1>
                
                {/* Bubbles Grid */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    {currentExercise.options.map((word, idx) => {
                        const demoCorrectSet = ["Besichtigungstermin", "interessiere", "Balkon"];
                        const isCorrectOption = demoCorrectSet.includes(word);
                        
                        if (!isCorrectOption) {
                            // Unselected / Incorrect option styling (White)
                            return (
                                <div key={idx} className="bg-white text-gray-700 px-5 py-3 rounded-2xl font-bold text-center shadow-sm border border-transparent opacity-60">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            {word}
                                            <button onClick={(e) => playWord(word, e)}>
                                               <Volume2 size={14} className="text-gray-400" />
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">
                                            {(currentExercise.wordPairs as any)[word] || "..."}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        
                        // Selected/Correct Styling (Purple)
                        return (
                            <div key={idx} className="relative group animate-fade-in" style={{animationDelay: `${idx * 100}ms`}}>
                                <div className="bg-purple-200 text-purple-900 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm border border-purple-300 flex flex-col items-center w-full">
                                    <div className="flex items-center gap-2">
                                        {word}
                                        <button onClick={(e) => playWord(word, e)}>
                                            <Volume2 size={16} className="text-purple-600" />
                                        </button>
                                    </div>
                                    <span className="text-xs text-purple-700 italic font-medium mt-1">
                                        {(currentExercise.wordPairs as any)[word] || "..."}
                                    </span>
                                </div>
                                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white shadow-sm">
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                            </div>
                        )
                    })}
                </div>
             </div>

             {/* Bottom Sheet Card */}
             <div className="bg-white rounded-t-[2rem] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] w-full max-w-md mx-auto">
                <div className="p-6 pb-safe">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-gray-800">Ви почули</span>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md uppercase">DE</span>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => togglePlay(currentExercise.fullText)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                {isAudioLoading ? <Loader2 size={20} className="animate-spin text-blue-600"/> : (isPlaying && currentText === currentExercise.fullText ? <Pause size={20} className="text-blue-600" /> : <Play size={20} className="text-gray-700" />)}
                             </button>
                             <button 
                                onClick={() => setShowFullTranslation(!showFullTranslation)}
                                className={`p-2 rounded-full transition-colors ${showFullTranslation ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                             >
                                <Languages size={20} />
                             </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl mb-6 min-h-[80px]">
                        {showFullTranslation ? (
                            <p className="text-lg text-gray-700 leading-relaxed font-medium animate-fade-in">
                                {currentExercise.translation}
                            </p>
                        ) : (
                            <p className="text-lg text-gray-900 leading-relaxed font-medium">
                                {currentExercise.fullText.split(' ').map((word, i) => {
                                    const cleanWord = word.replace(/[^\w\säöüÄÖÜß]/gi, '');
                                    return (
                                        <span 
                                            key={i} 
                                            className="relative inline-block mr-1 cursor-pointer hover:bg-yellow-100 rounded px-0.5 transition-colors group"
                                            onClick={() => setActiveWordTranslation(cleanWord)}
                                        >
                                            {word}
                                            {activeWordTranslation === cleanWord && (
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                                    {(currentExercise.wordPairs as any)[cleanWord] || "?"}
                                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></span>
                                                </span>
                                            )}
                                        </span>
                                    )
                                })}
                            </p>
                        )}
                    </div>

                    <button 
                        onClick={handleNextStage}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        Далі
                    </button>
                </div>
             </div>
        </div>
      )
  }

  // DEFAULT LISTENING VIEW
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col h-full font-sans">
       {/* Top Bar */}
       <div className="bg-white px-4 pt-safe pb-2">
            <div className="flex justify-between items-center h-14 relative">
                <button onClick={onClose}><X size={24} className="text-gray-500" /></button>
                <div className="flex items-center gap-2 font-bold text-gray-900">
                    <Headphones size={20} className="text-gray-900" />
                    <span>Listen</span>
                </div>
                <button onClick={handleSkip} className="text-blue-600 font-semibold text-sm">Skip</button>
            </div>
            {/* Progress Line */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${((currentStage + 1) / exercises.length) * 100}%` }}
                ></div>
            </div>
       </div>

      <div className="flex-1 flex flex-col p-6 items-center">
        
        <h2 className="text-gray-900 font-bold text-lg mb-8 text-center">{t('listen_instr')}</h2>

        {/* Audio Visualizer / Time */}
        <div className="w-full flex justify-between items-center text-xs text-blue-900 font-bold mb-6 px-4">
             <span>0:00</span>
             <VisualizerBars />
             <span>0:0{Math.ceil(currentExercise.fullText.length / 15)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full max-w-xs mb-10">
            {/* Speed */}
            <button 
                onClick={() => setSpeed(s => s === 1 ? 0.75 : 1)}
                className="bg-gray-100 text-gray-600 text-sm font-bold px-4 py-3 rounded-xl min-w-[60px]"
            >
                {speed}x
            </button>

            {/* Replay */}
            <button className="p-3 bg-gray-50 rounded-full text-gray-600 border border-gray-100 shadow-sm" onClick={() => {
                togglePlay();
            }}>
                <RotateCcw size={24} />
            </button>

            {/* Reset */}
            <button className="p-3 bg-gray-50 rounded-full text-gray-600 border border-gray-100 shadow-sm" onClick={resetState}>
                <RefreshCw size={24} />
            </button>

            {/* Play Button - Large Blue */}
            <button 
                onClick={() => togglePlay()}
                className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-blue-200 active:scale-95 transition-transform"
            >
                {isAudioLoading ? <Loader2 size={32} className="animate-spin"/> : (isPlaying ? <Pause fill="white" size={32} /> : <Play fill="white" size={32} className="ml-1" />)}
            </button>
        </div>

        {/* Word Bank */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
            {currentExercise.options.map((word, idx) => {
                const isSelected = selectedWords.includes(word);
                return (
                    <button
                        key={`${word}-${idx}`}
                        onClick={() => toggleWord(word)}
                        className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm border-2 ${
                            isSelected 
                                ? 'bg-white border-transparent ring-2 ring-blue-500 text-blue-600 shadow-md transform -translate-y-1' 
                                : 'bg-white border-transparent shadow-sm text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{
                            boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    >
                        {word}
                    </button>
                )
            })}
        </div>
        
      </div>

      {/* Bottom Action Area */}
      <div className={`p-4 pb-safe border-t border-gray-100 transition-colors ${
          feedback === 'incorrect' ? 'bg-red-50' : 'bg-white'
      }`}>
          {feedback === null ? (
              <button 
                onClick={checkAnswer}
                disabled={selectedWords.length === 0}
                className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-lg disabled:opacity-50 enabled:bg-blue-600 enabled:text-white transition-all shadow-sm"
              >
                {t('listen_check')}
              </button>
          ) : (
             <div className="flex flex-col gap-4 animate-slide-up">
                 <div className="flex items-center gap-3 px-2">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500">
                         <X className="text-white" size={18}/>
                     </div>
                     <div>
                         <h3 className="font-bold text-lg text-red-800">Incorrect</h3>
                         <p className="text-sm text-red-600">Try again</p>
                     </div>
                 </div>
                 {/* Updated to go to result view */}
                 <button 
                    onClick={() => setFeedback('review')}
                    className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all bg-red-600"
                 >
                    Показати відповідь
                 </button>
             </div>
          )}
      </div>
    </div>
  )
}

const ScenarioView: React.FC<ScenarioViewProps> = ({ userProfile, addWords }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PracticeMode>(PracticeMode.SELECTION);
  const [topic, setTopic] = useState('');
  
  // States for Speak Mode flow
  const [isPreparing, setIsPreparing] = useState(false);
  const [scenarioData, setScenarioData] = useState<ScenarioStartResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Chat Mode State
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Chat Logic
  const handleStartChat = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setMessages([]); // clear old chat
    const response = await startScenario(topic, userProfile.appLanguage);
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: response.message,
      timestamp: Date.now()
    }]);
    setIsChatStarted(true);
    setIsLoading(false);
  };

  const handleSendChat = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setHint(null);
    setIsLoading(true);

    const response = await sendMessageToScenario(userMsg.text, [], userProfile.appLanguage);
    
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      timestamp: Date.now(),
      hint: response.hint
    }]);
    setIsLoading(false);
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
  };

  const requestHintChat = async () => {
    setIsLoading(true);
    // Legacy single hint request
    const context = messages.map(m => `${m.role}: ${m.text}`).join('\n');
    const help = await getHintForScenario(context, userProfile.appLanguage);
    setHint(help);
    setIsLoading(false);
  };

  const handlePrepareSpeak = async () => {
      setIsPreparing(true);
      const data = await startScenario(topic, userProfile.appLanguage);
      setScenarioData(data);
      setIsPreparing(false);
  }

  // Render logic
  if (mode === PracticeMode.SELECTION) {
    return <ModeSelection onSelect={setMode} t={t} />;
  }

  if (mode === PracticeMode.SPEAK) {
    if (!scenarioData) {
        return (
          <TopicSelection 
            title={t('scen_mode_speak')} 
            onConfirm={handlePrepareSpeak} 
            loading={isPreparing} 
            topic={topic} 
            setTopic={setTopic} 
            t={t} 
            onBack={() => setMode(PracticeMode.SELECTION)}
          />
        );
    }
    if (!isSpeaking) {
        return <ScenarioIntro 
                 topic={topic} 
                 data={scenarioData} 
                 onStart={() => setIsSpeaking(true)} 
                 onBack={() => { setScenarioData(null); setIsSpeaking(false); }} 
                 t={t} 
               />
    }
    return <SpeakingInterface onClose={() => { setMode(PracticeMode.SELECTION); setScenarioData(null); setIsSpeaking(false); }} onSwitchMode={setMode} t={t} userProfile={userProfile} initialData={scenarioData} addWords={addWords} />;
  }

  if (mode === PracticeMode.LISTEN) {
    return <ListeningInterface onClose={() => setMode(PracticeMode.SELECTION)} t={t} />;
  }

  // CHAT MODE
  if (mode === PracticeMode.CHAT) {
    if (!isChatStarted) {
      return (
        <TopicSelection 
          title={t('scen_mode_chat')} 
          onConfirm={handleStartChat} 
          loading={isLoading} 
          topic={topic} 
          setTopic={setTopic} 
          t={t}
          onBack={() => setMode(PracticeMode.SELECTION)}
        />
      );
    }

    return (
      <Layout 
        title={topic} 
        action={
          <div className="flex space-x-2">
             <button onClick={() => setIsChatStarted(false)} title={t('scen_reset')} className="text-gray-500 hover:text-red-500">
               <RotateCcw size={20} />
             </button>
             <button onClick={() => setMode(PracticeMode.SELECTION)}><X className="text-gray-500"/></button>
          </div>
        }
      >
        <div className="flex flex-col h-full">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => speakText(msg.text)}
                      className="absolute -right-8 top-2 text-gray-400 hover:text-indigo-600 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-gray-100 rounded-2xl p-4 rounded-tl-none flex space-x-1">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
              </div>
            )}
            
            {hint && (
               <div className="mx-auto bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 max-w-[90%] animate-fade-in">
                 <p className="font-semibold mb-1 flex items-center gap-2"><Sparkles size={14}/> {t('scen_hint_label')}</p>
                 <pre className="font-sans whitespace-pre-wrap">{hint}</pre>
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-100 p-3">
            <div className="flex items-center space-x-2">
              <button 
                className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                onClick={requestHintChat}
                disabled={isLoading}
                title={t('scen_hint_btn')}
              >
                <Sparkles size={20} />
              </button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={t('scen_input_ph')}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm"
                  disabled={isLoading}
                />
              </div>
              <button 
                onClick={handleSendChat}
                disabled={!inputText.trim() || isLoading}
                className={`p-3 rounded-full text-white transition-all ${
                  inputText.trim() ? 'bg-indigo-600 shadow-md transform scale-100' : 'bg-gray-300 scale-90'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
};

export default ScenarioView;