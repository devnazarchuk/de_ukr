import React from 'react';
import { ViewState } from '../types';
import { Home, MessageCircle, Book, Layers } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const { t } = useTranslation();

  const navItems = [
    { view: ViewState.DASHBOARD, icon: Home, label: t('nav_home') },
    { view: ViewState.SCENARIO, icon: MessageCircle, label: t('nav_practice') },
    { view: ViewState.VOCABULARY, icon: Book, label: t('nav_vocab') },
    { view: ViewState.FLASHCARDS, icon: Layers, label: t('nav_cards') },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              currentView === item.view ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={24} strokeWidth={currentView === item.view ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
