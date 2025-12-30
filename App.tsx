import React, { useState, useEffect } from 'react';
import { ViewState, Word, WordCategory, UserGoal, UserProfile } from './types';
import Navigation from './components/Navigation';
import DashboardView from './views/DashboardView';
import ScenarioView from './views/ScenarioView';
import VocabularyView from './views/VocabularyView';
import FlashcardsView from './views/FlashcardsView';
import ProfileView from './views/ProfileView';
import { LanguageProvider } from './contexts/LanguageContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // App State
  const [vocabulary, setVocabulary] = useState<Word[]>([]);
  const [userGoal, setUserGoal] = useState<UserGoal>({ target: 100, current: 12, unit: 'слів' });
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    appLanguage: 'Українська',
    learningLanguage: 'Німецька',
    level: 'A1',
    goal: '',
    situation: '',
    challenges: ''
  });

  // Load initial data (mock)
  useEffect(() => {
    const savedVocab = localStorage.getItem('vocab');
    if (savedVocab) {
        setVocabulary(JSON.parse(savedVocab));
    } else {
        // Seed data
        const initialWords: Word[] = [
            { id: '1', german: 'der Apfel', ukrainian: 'Яблуко', category: WordCategory.NOUN, exampleSentence: 'Ich esse einen Apfel.', masteryLevel: 1 },
            { id: '2', german: 'laufen', ukrainian: 'бігати', category: WordCategory.VERB, exampleSentence: 'Er läuft schnell.', masteryLevel: 2 },
            { id: '3', german: 'schön', ukrainian: 'гарний', category: WordCategory.ADJECTIVE, exampleSentence: 'Das Wetter ist schön.', masteryLevel: 0 },
        ];
        setVocabulary(initialWords);
    }

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  // Save vocab on change
  useEffect(() => {
    if (vocabulary.length > 0) {
        localStorage.setItem('vocab', JSON.stringify(vocabulary));
        setUserGoal(prev => ({ ...prev, current: vocabulary.length }));
    }
  }, [vocabulary]);

  // Save profile on change
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  const addWords = (newWords: Word[]) => {
    setVocabulary(prev => [...prev, ...newWords]);
  };

  const updateWordMastery = (id: string, level: number) => {
    setVocabulary(prev => prev.map(w => w.id === id ? { ...w, masteryLevel: Math.min(5, Math.max(0, level)) } : w));
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <DashboardView setView={setCurrentView} userGoal={userGoal} vocabulary={vocabulary} />;
      case ViewState.SCENARIO:
        return <ScenarioView userProfile={userProfile} addWords={addWords} />;
      case ViewState.VOCABULARY:
        return <VocabularyView vocabulary={vocabulary} addWords={addWords} userProfile={userProfile} />;
      case ViewState.FLASHCARDS:
        return <FlashcardsView vocabulary={vocabulary} updateMastery={updateWordMastery} />;
      case ViewState.PROFILE:
        return <ProfileView profile={userProfile} setProfile={setUserProfile} setView={setCurrentView} />;
      default:
        return <DashboardView setView={setCurrentView} userGoal={userGoal} vocabulary={vocabulary} />;
    }
  };

  return (
    <LanguageProvider language={userProfile.appLanguage}>
      <div className="text-gray-900 font-sans">
        {renderView()}
        {currentView !== ViewState.PROFILE && (
          <Navigation currentView={currentView} setView={setCurrentView} />
        )}
      </div>
    </LanguageProvider>
  );
};

export default App;