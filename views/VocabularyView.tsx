import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Word, WordCategory, UserProfile } from '../types';
import { generateVocabulary } from '../services/geminiService';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface VocabularyViewProps {
  vocabulary: Word[];
  addWords: (words: Word[]) => void;
  userProfile: UserProfile;
}

const VocabularyView: React.FC<VocabularyViewProps> = ({ vocabulary, addWords, userProfile }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<WordCategory>(WordCategory.NOUN);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredWords = vocabulary.filter(w => w.category === activeTab);

  const handleGenerate = async () => {
    if (!topicInput) return;
    setIsGenerating(true);
    const newWords = await generateVocabulary(topicInput, activeTab, userProfile.appLanguage);
    addWords(newWords);
    setIsGenerating(false);
    setShowAddModal(false);
    setTopicInput('');
  };

  return (
    <Layout title={t('voc_title')} action={
      <button onClick={() => setShowAddModal(true)} className="text-indigo-600 font-medium text-sm flex items-center">
        <Plus size={16} className="mr-1"/> {t('voc_add')}
      </button>
    }>
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex p-4 pb-0 space-x-4 border-b border-gray-200 overflow-x-auto">
          {[
            { id: WordCategory.NOUN, label: t('voc_noun') },
            { id: WordCategory.VERB, label: t('voc_verb') },
            { id: WordCategory.ADJECTIVE, label: t('voc_adj') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Word List */}
        <div className="flex-1 p-4 space-y-3">
          {filteredWords.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>{t('voc_empty')}</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="mt-2 text-indigo-600 text-sm font-medium underline"
              >
                {t('voc_gen_ai')}
              </button>
            </div>
          ) : (
            filteredWords.map(word => (
              <div key={word.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-lg text-gray-800">{word.german}</span>
                  <span className="text-gray-500 text-sm">{word.ukrainian}</span>
                </div>
                {word.exampleSentence && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg italic">
                    "{word.exampleSentence}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-4">{t('voc_modal_title')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('voc_modal_desc')} <strong>{activeTab}</strong>.</p>
              
              <input 
                type="text" 
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder={t('voc_modal_ph')}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-gray-600 font-medium"
                >
                  {t('voc_cancel')}
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !topicInput}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium flex justify-center items-center"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : t('voc_gen')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VocabularyView;
