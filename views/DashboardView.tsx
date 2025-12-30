import React from 'react';
import Layout from '../components/Layout';
import { ViewState, UserGoal, Word } from '../types';
import { Trophy, Flame, PlusCircle, ArrowRight, User } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface DashboardProps {
  setView: (view: ViewState) => void;
  userGoal: UserGoal;
  vocabulary: Word[];
}

const DashboardView: React.FC<DashboardProps> = ({ setView, userGoal, vocabulary }) => {
  const { t } = useTranslation();
  const percentage = Math.min(100, Math.round((userGoal.current / userGoal.target) * 100));

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with Avatar */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dash_hello')}</h1>
            <p className="text-gray-500 text-sm">{t('dash_subtitle')}</p>
          </div>
          <button 
            onClick={() => setView(ViewState.PROFILE)}
            className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center hover:bg-indigo-100 transition-colors"
          >
            <User className="text-gray-600" size={20} />
          </button>
        </div>

        {/* Goal Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium">{t('dash_month_goal')}</p>
              <h2 className="text-3xl font-bold mt-1">{userGoal.current} <span className="text-lg font-normal opacity-80">/ {userGoal.target} {t('dash_words')}</span></h2>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <Trophy className="text-white" size={24} />
            </div>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 mb-2">
            <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
          </div>
          <p className="text-xs text-indigo-100 text-right">{percentage}% {t('dash_done')}</p>
        </div>

        {/* Streak / Motivation */}
        <div className="flex space-x-4">
           <div className="flex-1 bg-orange-50 rounded-xl p-4 border border-orange-100 flex flex-col items-center">
              <Flame className="text-orange-500 mb-2" size={24} />
              <span className="font-bold text-gray-800">3</span>
              <span className="text-xs text-gray-500">{t('dash_streak')}</span>
           </div>
           <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center cursor-pointer" onClick={() => setView(ViewState.VOCABULARY)}>
              <PlusCircle className="text-green-600 mb-2" size={24} />
              <span className="font-bold text-gray-800">{t('dash_new_words')}</span>
              <span className="text-xs text-gray-500">{t('dash_words')}</span>
           </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3">{t('dash_continue')}</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setView(ViewState.SCENARIO)}
              className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  💬
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{t('dash_scenario_title')}</p>
                  <p className="text-xs text-gray-500">{t('dash_scenario_desc')}</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>

            <button 
              onClick={() => setView(ViewState.FLASHCARDS)}
              className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                  🎴
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{t('dash_flash_title')}</p>
                  <p className="text-xs text-gray-500">{vocabulary.length} {t('dash_flash_desc')}</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardView;
