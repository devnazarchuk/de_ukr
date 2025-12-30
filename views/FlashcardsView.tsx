import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Word } from '../types';
import { RotateCw, Check, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface FlashcardsViewProps {
  vocabulary: Word[];
  updateMastery: (id: string, level: number) => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ vocabulary, updateMastery }) => {
  const { t } = useTranslation();
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // Sort words by lowest mastery level first (Spaced Repetition simple implementation)
    const sorted = [...vocabulary].sort((a, b) => a.masteryLevel - b.masteryLevel);
    setQueue(sorted);
  }, [vocabulary]);

  const currentCard = queue[currentIndex];

  const handleNext = (success: boolean) => {
    if (!currentCard) return;

    // Update mastery
    const newLevel = success ? currentCard.masteryLevel + 1 : Math.max(0, currentCard.masteryLevel - 1);
    updateMastery(currentCard.id, newLevel);

    setIsFlipped(false);
    setTimeout(() => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }
    }, 200);
  };

  const restart = () => {
    setFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (vocabulary.length === 0) {
    return (
      <Layout title={t('flash_title')}>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-6 text-center">
          <p>{t('flash_empty')}</p>
        </div>
      </Layout>
    );
  }

  if (finished) {
    return (
      <Layout title={t('flash_title')}>
         <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
            <div className="bg-green-100 p-6 rounded-full text-green-600">
                <Check size={48} />
            </div>
            <h2 className="text-2xl font-bold">{t('flash_done_title')}</h2>
            <p className="text-gray-500">{t('flash_done_desc')}</p>
            <button 
                onClick={restart}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
            >
                {t('flash_restart')}
            </button>
         </div>
      </Layout>
    )
  }

  if (!currentCard) return <Layout><div className="p-4">Loading...</div></Layout>;

  return (
    <Layout title={t('flash_review')}>
      <div className="flex flex-col h-full p-6 items-center justify-center">
        
        {/* Progress */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
            <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
            ></div>
        </div>

        {/* Card Container */}
        <div 
            className="w-full max-w-xs aspect-[3/4] perspective-1000 cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front (German) */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('flash_front')}</span>
                    <h2 className="text-3xl font-bold text-gray-800 break-words">{currentCard.german}</h2>
                    <p className="mt-8 text-indigo-500 text-sm font-medium flex items-center">
                        <RotateCw size={14} className="mr-1" /> {t('flash_flip')}
                    </p>
                </div>

                {/* Back (Ukrainian + Context) */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-4">{t('flash_back')}</span>
                    <h2 className="text-2xl font-bold mb-6">{currentCard.ukrainian}</h2>
                    
                    {currentCard.exampleSentence && (
                        <div className="bg-white/10 p-4 rounded-xl text-sm italic border border-white/10">
                            "{currentCard.exampleSentence}"
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-center space-x-6 mt-10 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
            >
                <X size={24} />
            </button>
            <span className="text-sm font-medium text-gray-400">{t('flash_know')}</span>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
            >
                <Check size={24} />
            </button>
        </div>

      </div>
      
      {/* Styles for flip animation */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </Layout>
  );
};

export default FlashcardsView;
